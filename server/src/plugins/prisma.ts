import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

let prisma: PrismaClient | null = null;
let pool: pg.Pool | null = null;

const getPrisma = () => {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required for Prisma');
    }
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    pool = new pg.Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return { prisma, pool };
};

export default fp(async (app) => {
  const { prisma: client, pool: pgPool } = getPrisma();
  app.decorate('prisma', client);

  app.addHook('onClose', async () => {
    await client.$disconnect();
    if (pgPool) {
      await pgPool.end();
    }
  });
});
