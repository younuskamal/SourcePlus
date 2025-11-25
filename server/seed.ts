import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

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
  });
