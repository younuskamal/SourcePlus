import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';

const versionSchema = z.object({
  version: z.string(),
  releaseNotes: z.string().default(''),
  downloadUrl: z.string().url(),
  forceUpdate: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

export default async function versionRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    return app.prisma.appVersion.findMany({ orderBy: { releaseDate: 'desc' } });
  });

  app.get('/latest', async () => {
    const latest = await app.prisma.appVersion.findFirst({ where: { isActive: true }, orderBy: { releaseDate: 'desc' } });
    return latest ?? {};
  });

  app.post('/', { preHandler: [app.authorize([Role.admin, Role.developer])] }, async (request, reply) => {
    const data = versionSchema.parse(request.body);
    const ver = await app.prisma.appVersion.create({ data });
    await logAudit(app, { userId: request.user?.userId, action: 'PUBLISH_VERSION', details: ver.version, ip: request.ip });
    return reply.code(201).send(ver);
  });

  app.patch('/:id', { preHandler: [app.authorize([Role.admin, Role.developer])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const ver = await app.prisma.appVersion.update({ where: { id }, data: versionSchema.partial().parse(request.body) });
    await logAudit(app, { userId: request.user?.userId, action: 'UPDATE_VERSION', details: ver.id, ip: request.ip });
    return reply.send(ver);
  });

  app.delete('/:id', { preHandler: [app.authorize([Role.admin])]}, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    await app.prisma.appVersion.delete({ where: { id } });
    await logAudit(app, { userId: request.user?.userId, action: 'DELETE_VERSION', details: id, ip: request.ip });
    return reply.code(204).send();
  });
}
