import { FastifyInstance } from 'fastify';
import { Role } from '@prisma/client';

export default async function auditRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authorize([Role.admin])] }, async () => {
    return app.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  });

  app.delete('/', { preHandler: [app.authorize([Role.admin])]}, async (request, reply) => {
    await app.prisma.auditLog.deleteMany();
    await app.prisma.auditLog.create({
      data: { userId: request.user?.id ?? null, action: 'CLEAR_LOGS', details: 'Audit logs cleared', ipAddress: request.ip }
    });
    return reply.code(204).send();
  });
}
