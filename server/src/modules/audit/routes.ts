import { FastifyInstance } from 'fastify';
import { Role, ProductType } from '@prisma/client';

export default async function auditRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authorize([Role.admin])] }, async (request) => {
    const { productType } = request.query as { productType?: ProductType };
    const where = productType ? { productType } : {};
    return app.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200
    });
  });

  app.delete('/', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    await app.prisma.auditLog.deleteMany();
    await app.prisma.auditLog.create({
      data: { userId: request.user?.id ?? null, action: 'CLEAR_LOGS', details: 'Audit logs cleared', ipAddress: request.ip }
    });
    return reply.code(204).send();
  });
}
