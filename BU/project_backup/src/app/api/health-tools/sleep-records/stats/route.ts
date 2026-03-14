import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { formatDateOnly, sleepQualityScoreMap, toNumber } from '@/lib/health-tools/utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const days = toNumber(searchParams.get('days')) ?? 30;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    dateFrom.setHours(0, 0, 0, 0);

    const where = { userId: user.id, date: { gte: dateFrom } };

    const [totalRecords, avgResult, qualityGroups, bestRecord, worstRecord] = await Promise.all([
      prisma.sleepRecord.count({ where }),
      prisma.sleepRecord.aggregate({ where, _avg: { hours: true } }),
      prisma.sleepRecord.groupBy({
        by: ['quality'],
        where,
        _count: { _all: true },
      }),
      prisma.sleepRecord.findFirst({ where, orderBy: { hours: 'desc' } }),
      prisma.sleepRecord.findFirst({ where, orderBy: { hours: 'asc' } }),
    ]);

    if (!totalRecords || !bestRecord || !worstRecord) {
      return NextResponse.json({ message: 'لا توجد سجلات' });
    }

    const qualityBreakdown: Record<string, number> = {};
    let totalQualityScore = 0;

    qualityGroups.forEach((group) => {
      qualityBreakdown[group.quality] = group._count._all;
      totalQualityScore += (sleepQualityScoreMap[group.quality] ?? 0) * group._count._all;
    });

    const averageQualityScore = totalQualityScore / totalRecords;

    return NextResponse.json({
      average_hours: avgResult._avg.hours ?? 0,
      average_quality_score: Math.round(averageQualityScore * 10) / 10,
      total_records: totalRecords,
      quality_breakdown: qualityBreakdown,
      best_sleep: {
        date: formatDateOnly(bestRecord.date),
        hours: bestRecord.hours,
        quality: bestRecord.quality,
      },
      worst_sleep: {
        date: formatDateOnly(worstRecord.date),
        hours: worstRecord.hours,
        quality: worstRecord.quality,
      },
    });
  } catch (error) {
    console.error('Error fetching sleep stats:', error);
    return NextResponse.json({ error: 'خطأ في تحميل إحصائيات النوم' }, { status: 500 });
  }
}
