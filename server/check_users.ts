import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users in database:', users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
