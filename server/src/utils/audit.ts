import { FastifyInstance } from 'fastify';

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
