import { FastifyInstance } from 'fastify';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const ADMIN_EMAIL = 'admin@sourceplus.com';
const ADMIN_PASSWORD = 'Admin12345';

export const runSeed = async (app: FastifyInstance) => {
  const existing = await app.prisma.user.findUnique({
    where: { email: ADMIN_EMAIL }
  });

  if (existing) {
    app.log.info('Admin user already exists, skipping seed');
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await app.prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: 'Super Admin',
      passwordHash,
      role: Role.admin
    }
  });

  app.log.info(
    `Created default admin user (${ADMIN_EMAIL}) with password ${ADMIN_PASSWORD}`
  );
};

