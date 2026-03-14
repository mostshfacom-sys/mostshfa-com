import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Try to fetch from audit_logs table if it exists
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activities = await (prisma as any).auditLog?.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });

      if (!activities) {
        return NextResponse.json({ activities: [] });
      }

      return NextResponse.json({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activities: activities.map((a: any) => ({
          id: a.id,
          type: a.entityType,
          action: a.action,
          entityName: a.entityName,
          userName: a.user?.name || a.user?.email || 'مستخدم',
          createdAt: a.createdAt.toISOString(),
        })),
      });
    } catch {
      // If audit_logs table doesn't exist, return empty array
      return NextResponse.json({ activities: [] });
    }
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ activities: [] });
  }
}
