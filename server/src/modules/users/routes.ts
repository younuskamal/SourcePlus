import { FastifyInstance } from 'fastify';
import argon2 from 'argon2';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { logAudit } from '../../utils/audit.js';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role)
});

export default async function userRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authorize([Role.admin])] }, async () => {
    return app.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
  });

  app.post('/', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const data = createUserSchema.parse(request.body);
    const exists = await app.prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return reply.code(400).send({ message: 'Email already used' });

    const passwordHash = await argon2.hash(data.password);
    const user = await app.prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, role: data.role }
    });

    await logAudit(app, { userId: request.user?.id, action: 'CREATE_USER', details: `Created ${user.email}`, ip: request.ip });
    return reply.code(201).send({ id: user.id, name: user.name, email: user.email, role: user.role });
  });

  app.delete('/:id', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    await app.prisma.user.delete({ where: { id } });
    await logAudit(app, { userId: request.user?.id, action: 'DELETE_USER', details: `Deleted ${id}`, ip: request.ip });
    return reply.code(204).send();
  });
}
