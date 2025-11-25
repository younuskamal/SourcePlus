import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import argon2 from 'argon2';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const pool = new pg.Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPasswordHash = await argon2.hash('password');
  const devPasswordHash = await argon2.hash('password');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sourceplus.com' },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: 'admin@sourceplus.com',
      name: 'Admin User',
      passwordHash: adminPasswordHash,
      role: 'admin'
    }
  });

  const devUser = await prisma.user.upsert({
    where: { email: 'ali@sourceplus.com' },
    update: {},
    create: {
      email: 'ali@sourceplus.com',
      name: 'Ali Developer',
      passwordHash: devPasswordHash,
      role: 'developer'
    }
  });

  console.log('Seed data created:', { adminUser, devUser });
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
