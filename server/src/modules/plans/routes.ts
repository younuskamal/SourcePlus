import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';

const planSchema = z.object({
  name: z.string().min(2),
  durationMonths: z.number().int().positive(),
  priceUSD: z.number().nonnegative(),
  features: z.array(z.string()).default([]),
  deviceLimit: z.number().int().positive(),
  alternativePrices: z.array(z.object({ currency: z.string(), amount: z.number().nonnegative() })).default([])
});

export default async function planRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    return app.prisma.plan.findMany({ include: { prices: true } });
  });

  app.post('/', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const { alternativePrices, ...planData } = planSchema.parse(request.body);
    const plan = await app.prisma.plan.create({
      data: {
        ...planData,
        prices: {
          create: alternativePrices.map((p) => ({ currency: p.currency, amount: p.amount }))
        }
      },
      include: { prices: true }
    });
    await logAudit(app, { userId: request.user?.id, action: 'CREATE_PLAN', details: `Plan ${plan.name}`, ip: request.ip });
    return reply.code(201).send(plan);
  });

  app.patch('/:id', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const { alternativePrices, ...updateData } = planSchema.partial().parse(request.body);
    const plan = await app.prisma.plan.update({
      where: { id },
      data: {
        ...updateData,
        prices: alternativePrices
          ? {
            deleteMany: {},
            create: alternativePrices.map((p) => ({ currency: p.currency, amount: p.amount }))
          }
          : undefined
      },
      include: { prices: true }
    });
    await logAudit(app, { userId: request.user?.id, action: 'UPDATE_PLAN', details: `Plan ${plan.name}`, ip: request.ip });
    return reply.send(plan);
  });

  app.delete('/:id', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    await app.prisma.plan.delete({ where: { id } });
    await logAudit(app, { userId: request.user?.id, action: 'DELETE_PLAN', details: `Plan ${id}`, ip: request.ip });
    return reply.code(204).send();
  });
}
