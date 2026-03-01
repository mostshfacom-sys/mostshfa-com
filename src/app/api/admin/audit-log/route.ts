import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');

    const where: Record<string, string> = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const auditLogModel = (prisma as any).auditLog;
      if (!auditLogModel) {
        return NextResponse.json({ logs: [], totalPages: 0, total: 0 });
      }

      const [logs, total] = await Promise.all([
        auditLogModel.findMany({
          where,
          take: limit,
          skip: (page - 1) * limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        }),
        auditLogModel.count({ where }),
      ]);

      return NextResponse.json({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logs: logs.map((log: any) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          entityName: log.entityName,
          changes: log.changes ? JSON.parse(log.changes) : null,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          user: log.user,
          createdAt: log.createdAt.toISOString(),
        })),
        totalPages: Math.ceil(total / limit),
        total,
      });
    } catch {
      // If table doesn't exist yet
      return NextResponse.json({ logs: [], totalPages: 0, total: 0 });
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'فشل في جلب سجل التدقيق' },
      { status: 500 }
    );
  }
}
