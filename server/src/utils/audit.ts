import { FastifyInstance } from 'fastify';
import { ProductType } from '@prisma/client';

export const logAudit = async (
  app: FastifyInstance,
  params: { userId?: string; action: string; details: string; ip?: string; productType?: ProductType }
) => {
  try {
    await app.prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        details: params.details,
        ipAddress: params.ip ?? null,
        productType: params.productType ?? ProductType.POS
      }
    });
  } catch (err) {
    app.log.error({ err }, 'audit log failed');
  }
};
