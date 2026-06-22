import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

type GlobalPrisma = {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const globalForPrisma = globalThis as unknown as GlobalPrisma;

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is missing');
  }

  return new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false },
  });
}

function createPrismaClient() {
  const pool = globalForPrisma.pgPool ?? createPool();
  if (!globalForPrisma.pgPool) globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter: adapter as never,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  } as never);

  const retryableActions = new Set([
    'findUnique',
    'findUniqueOrThrow',
    'findFirst',
    'findFirstOrThrow',
    'findMany',
    'count',
    'aggregate',
    'groupBy',
  ]);

  const isRetryableError = (error: unknown) => {
    if (!error || typeof error !== 'object') return false;
    const prismaError = error as { code?: string; message?: string; name?: string };
    const message = prismaError.message || '';
    return (
      prismaError.code === 'P1001' ||
      prismaError.code === 'P1002' ||
      prismaError.code === 'P2024' ||
      prismaError.name === 'PrismaClientInitializationError' ||
      message.includes("Can't reach database server") ||
      message.includes('Error querying the database') ||
      message.includes('Connection refused') ||
      message.includes('Timed out fetching a new connection from the connection pool')
    );
  };

  client.$use(async (params, next) => {
    if (!retryableActions.has(params.action)) {
      return next(params);
    }

    let attempt = 0;
    while (true) {
      try {
        return await next(params);
      } catch (error) {
        if (attempt >= 2 || !isRetryableError(error)) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
        attempt += 1;
      }
    }
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
