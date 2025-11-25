import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';

const notificationSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  targetSerial: z.string().optional()
});

export default async function notificationRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    return app.prisma.notification.findMany({ orderBy: { sentAt: 'desc' } });
  });

  app.post('/', { preHandler: [app.authorize([Role.admin, Role.developer])] }, async (request, reply) => {
    const data = notificationSchema.parse(request.body);
    const notif = await app.prisma.notification.create({
      data: { ...data, channel: data.targetSerial ? 'direct' : 'broadcast' }
    });
    await logAudit(app, { userId: request.user?.id, action: 'SEND_NOTIFICATION', details: data.title, ip: request.ip });
    return reply.code(201).send(notif);
  });

  app.delete('/:id', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    await app.prisma.notification.delete({ where: { id } });
    await logAudit(app, { userId: request.user?.id, action: 'DELETE_NOTIFICATION', details: id, ip: request.ip });
    return reply.code(204).send();
  });

  app.delete('/', { preHandler: [app.authorize([Role.admin])]}, async (request, reply) => {
    await app.prisma.notification.deleteMany();
    await logAudit(app, { userId: request.user?.id, action: 'CLEAR_NOTIFICATIONS', details: 'Cleared all notifications', ip: request.ip });
    return reply.code(204).send();
  });
}
