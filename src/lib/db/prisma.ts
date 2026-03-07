import { PrismaClient } from '@prisma/client';

const isBuildTime =
  process.env.NEXT_PHASE === 'phase-production-build' || process.env.VERCEL_BUILD_STEP === 'true';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  (isBuildTime
    ? (new Proxy(
        {},
        {
          get() {
            throw new Error('PrismaClient is not available during build time');
          },
        }
      ) as unknown as PrismaClient)
    : new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      }));

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
