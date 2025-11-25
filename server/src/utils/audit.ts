import { FastifyInstance } from 'fastify';
import { Role } from '@prisma/client';
import argon2 from 'argon2';

export const logAudit = async (
  app: FastifyInstance,
  params: { userId?: string; action: string; details: string; ip?: string }
) => {
  try {
    await app.prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        details: params.details,
        ipAddress: params.ip ?? null
      }
    });
  } catch (err) {
    app.log.error({ err }, 'audit log failed');
  }
};

export const ensureAdminSeed = async (app: FastifyInstance) => {
  const count = await app.prisma.user.count();
  if (count === 0) {
    const passwordHash = await argon2.hash('Admin@123');
    await app.prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@sourceplus.com',
        passwordHash,
        role: Role.admin
      }
    });
  }
};
