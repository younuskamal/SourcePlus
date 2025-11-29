import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';

const planSchema = z.object({
  name: z.string().min(2),
  price_monthly: z.number().nonnegative().optional(),
  price_yearly: z.number().nonnegative().optional(),
  currency: z.string().default('IQD'),
  features: z.any().optional(), // JSON
  limits: z.any().optional(), // JSON
  isActive: z.boolean().default(true)
});

export default async function planRoutes(app: FastifyInstance) {
  // Admin Routes - Require Authentication & Admin Role

  // GET /admin/plans
  app.get('/', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const plans = await app.prisma.plan.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return plans;
  });

  // POST /admin/plans
  app.post('/', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const data = planSchema.parse(request.body);

    // Default values for legacy fields to satisfy DB constraints if any
    const plan = await app.prisma.plan.create({
      data: {
        name: data.name,
        price_monthly: data.price_monthly,
        price_yearly: data.price_yearly,
        currency: data.currency,
        features: data.features || {},
        limits: data.limits || {},
        isActive: data.isActive,
        // Legacy fields defaults
        durationMonths: 1,
        priceUSD: 0,
        deviceLimit: 1
      }
    });

    await logAudit(app, {
      userId: request.user?.id,
      action: 'PLAN_CREATE',
      details: `Created plan ${plan.name}`,
      ip: request.ip
    });

    return reply.code(201).send(plan);
  });

  // PUT /admin/plans/:id
  app.put('/:id', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const data = planSchema.parse(request.body);

    const oldPlan = await app.prisma.plan.findUnique({ where: { id } });
    if (!oldPlan) return reply.code(404).send({ message: 'Plan not found' });

    const plan = await app.prisma.plan.update({
      where: { id },
      data: {
        name: data.name,
        price_monthly: data.price_monthly,
        price_yearly: data.price_yearly,
        currency: data.currency,
        features: data.features || {},
        limits: data.limits || {},
        isActive: data.isActive
      }
    });

    await logAudit(app, {
      userId: request.user?.id,
      action: 'PLAN_UPDATE',
      details: `Updated plan ${plan.name}`,
      ip: request.ip
    });

    return reply.send(plan);
  });

  // DELETE /admin/plans/:id
  app.delete('/:id', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;

    const oldPlan = await app.prisma.plan.findUnique({ where: { id } });
    if (!oldPlan) return reply.code(404).send({ message: 'Plan not found' });

    await app.prisma.plan.delete({ where: { id } });

    await logAudit(app, {
      userId: request.user?.id,
      action: 'PLAN_DELETE',
      details: `Deleted plan ${oldPlan.name}`,
      ip: request.ip
    });

    return reply.code(204).send();
  });

  // PATCH /admin/plans/:id/activate
  app.patch('/:id/activate', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const plan = await app.prisma.plan.update({
      where: { id },
      data: { isActive: true }
    });

    await logAudit(app, {
      userId: request.user?.id,
      action: 'PLAN_ACTIVATE',
      details: `Activated plan ${plan.name}`,
      ip: request.ip
    });

    return reply.send(plan);
  });

  // PATCH /admin/plans/:id/deactivate
  app.patch('/:id/deactivate', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const plan = await app.prisma.plan.update({
      where: { id },
      data: { isActive: false }
    });

    await logAudit(app, {
      userId: request.user?.id,
      action: 'PLAN_DEACTIVATE',
      details: `Deactivated plan ${plan.name}`,
      ip: request.ip
    });

    return reply.send(plan);
  });
}
