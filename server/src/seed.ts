import { FastifyInstance } from 'fastify';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const ADMIN_EMAIL = 'admin@sourceplus.com';
const ADMIN_PASSWORD = 'Admin12345';

export const runSeed = async (app: FastifyInstance) => {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await app.prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: 'Super Admin',
      passwordHash,
      role: Role.admin
    },
    create: {
      email: ADMIN_EMAIL,
      name: 'Super Admin',
      passwordHash,
      role: Role.admin
    }
  });

  app.log.info(
    `Ensured default admin user (${ADMIN_EMAIL}) with password ${ADMIN_PASSWORD}`
  );
};

