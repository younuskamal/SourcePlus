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
  try {
    const passwordHash = await argon2.hash('Admin123!');

    await app.prisma.user.upsert({
      where: { email: 'admin@sourceplus.com' },
      update: {
        name: 'Main Admin',
        passwordHash,
        role: Role.admin
      },
      create: {
        name: 'Main Admin',
        email: 'admin@sourceplus.com',
        passwordHash,
        role: Role.admin
      }
    });
    app.log.info('Ensured admin@sourceplus.com with password Admin123!');
  } catch (err: any) {
    if (err?.code === 'P2021' || err?.code === 'P1010') {
      app.log.warn({ err }, 'Database not ready or access denied; skipping admin seed');
      return;
    }
    app.log.error({ err }, 'Admin seed failed');
  }
};
