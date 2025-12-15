import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';

const settingsSchema = z.record(z.string(), z.any());
const remoteSchema = z.record(z.string(), z.any());

export default async function settingsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    const settings = await app.prisma.systemSetting.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  });

  app.put('/', { preHandler: [app.authorize([Role.admin, Role.developer])] }, async (request, reply) => {
    const data = settingsSchema.parse(request.body);
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        app.prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      )
    );
    await logAudit(app, { userId: request.user?.userId, action: 'UPDATE_SETTINGS', details: 'System settings updated', ip: request.ip });
    return reply.send({ ok: true });
  });

  app.get('/remote', async () => {
    const cfg = await app.prisma.remoteConfig.findMany();
    return Object.fromEntries(cfg.map((c) => [c.key, c.value]));
  });

  app.put('/remote', { preHandler: [app.authorize([Role.admin, Role.developer])] }, async (request, reply) => {
    const data = remoteSchema.parse(request.body);
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        app.prisma.remoteConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      )
    );
    await logAudit(app, { userId: request.user?.userId, action: 'UPDATE_REMOTE_CONFIG', details: 'Remote config updated', ip: request.ip });
    return reply.send({ ok: true });
  });

  app.post('/reset', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    // Delete in order to respect foreign keys (although SetNull/Cascade helps)
    await app.prisma.$transaction([
      app.prisma.transaction.deleteMany(),
      app.prisma.supportTicket.deleteMany(), // Cascades to replies and attachments
      app.prisma.license.deleteMany(),
      app.prisma.notification.deleteMany(),
      app.prisma.auditLog.deleteMany(),
    ]);

    await logAudit(app, { userId: request.user?.userId, action: 'SYSTEM_RESET', details: 'System data reset to factory defaults', ip: request.ip });
    return reply.send({ message: 'System reset successful' });
  });
}
