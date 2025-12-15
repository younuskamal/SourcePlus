
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { logAudit } from '../../utils/audit.js';

const priceSchema = z.object({
  currency: z.string(),
  monthlyPrice: z.number().nonnegative().optional(),
  periodPrice: z.number().nonnegative().optional(),
  yearlyPrice: z.number().nonnegative().optional(),
  discount: z.number().min(0).max(100).optional(),
  isPrimary: z.boolean().default(false)
});

const planSchema = z.object({
  name: z.string().min(2),
  durationMonths: z.number().int().positive().default(12),
  prices: z.array(priceSchema).default([]),
  features: z.any().optional(), // JSON
  limits: z.any().optional(), // JSON
  isActive: z.boolean().default(true),
  deviceLimit: z.number().int().min(1).default(1)
});

export default async function planRoutes(app: FastifyInstance) {
  // Admin Routes - Require Authentication & Admin Role

  // GET /admin/plans
  app.get('/', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const plans = await app.prisma.plan.findMany({
      orderBy: { createdAt: 'desc' },
      include: { prices: true }
    });

    // Transform to match the requested API response structure
    const formattedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      durationMonths: plan.durationMonths,
      features: plan.features,
      limits: plan.limits,
      deviceLimit: plan.deviceLimit,
      is_active: plan.isActive,
      prices: plan.prices.map(p => ({
        currency: p.currency,
        monthlyPrice: p.monthlyPrice,
        periodPrice: p.periodPrice,
        yearlyPrice: p.yearlyPrice,
        discount: p.discount,
        isPrimary: p.isPrimary
      }))
    }));

    return formattedPlans;
  });

  // POST /admin/plans
  app.post('/', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    console.log('Received POST /admin/plans body:', JSON.stringify(request.body, null, 2));
    const data = planSchema.parse(request.body);
    console.log('Parsed plan data:', JSON.stringify(data, null, 2));

    const primaryPrice = data.prices.find(p => p.isPrimary) || data.prices[0];

    // Filter duplicates
    const uniqueCurrencies = new Set<string>();
    const cleanPrices: typeof data.prices = [];
    for (const p of data.prices) {
      if (!uniqueCurrencies.has(p.currency)) {
        uniqueCurrencies.add(p.currency);
        cleanPrices.push(p);
      }
    }

    const plan = await app.prisma.plan.create({
      data: {
        name: data.name,
        durationMonths: data.durationMonths,
        features: data.features || {},
        limits: data.limits || {},
        isActive: data.isActive,
        deviceLimit: data.deviceLimit,
        // Legacy fields defaults - Populate them for safety
        priceUSD: 0,
        price_monthly: primaryPrice?.monthlyPrice || 0,
        price_yearly: primaryPrice?.yearlyPrice || 0,
        currency: primaryPrice?.currency || 'IQD',
        prices: {
          create: cleanPrices.map(p => ({
            currency: p.currency,
            monthlyPrice: p.monthlyPrice,
            periodPrice: p.periodPrice,
            yearlyPrice: p.yearlyPrice,
            discount: p.discount,
            isPrimary: p.isPrimary
          }))
        }
      },
      include: { prices: true }
    });

    await logAudit(app, {
      userId: request.user?.userId,
      action: 'PLAN_CREATE',
      details: `Created plan ${plan.name}`,
      ip: request.ip
    });

    return reply.code(201).send(plan);
  });

  // PUT /admin/plans/:id
  app.put('/:id', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    console.log(`Received PUT /admin/plans/${id} body:`, JSON.stringify(request.body, null, 2));
    const data = planSchema.parse(request.body);

    const oldPlan = await app.prisma.plan.findUnique({ where: { id } });
    if (!oldPlan) return reply.code(404).send({ message: 'Plan not found' });

    const primaryPrice = data.prices.find(p => p.isPrimary) || data.prices[0];

    // Filter duplicates manually to fix Unique constraint failed
    const uniqueCurrencies = new Set<string>();
    const cleanPrices: typeof data.prices = [];
    for (const p of data.prices) {
      if (!uniqueCurrencies.has(p.currency)) {
        uniqueCurrencies.add(p.currency);
        cleanPrices.push(p);
      }
    }

    // Update plan and replace prices
    // Transaction to ensure atomicity
    const plan = await app.prisma.$transaction(async (tx) => {
      // 1. Delete existing prices
      await tx.planPrice.deleteMany({ where: { planId: id } });

      // 2. Update plan basic details
      await tx.plan.update({
        where: { id },
        data: {
          name: data.name,
          durationMonths: data.durationMonths,
          features: data.features || {},
          limits: data.limits || {},
          isActive: data.isActive,
          deviceLimit: data.deviceLimit,
          // Update legacy fields
          price_monthly: primaryPrice?.monthlyPrice || 0,
          price_yearly: primaryPrice?.yearlyPrice || 0,
          currency: primaryPrice?.currency || 'IQD'
        }
      });

      // 3. Create new prices
      if (cleanPrices.length > 0) {
        await tx.planPrice.createMany({
          data: cleanPrices.map(p => ({
            planId: id,
            currency: p.currency,
            monthlyPrice: p.monthlyPrice,
            periodPrice: p.periodPrice,
            yearlyPrice: p.yearlyPrice,
            discount: p.discount,
            isPrimary: p.isPrimary
          }))
        });
      }

      // 4. Return full object
      return tx.plan.findUniqueOrThrow({
        where: { id },
        include: { prices: true }
      });
    });

    await logAudit(app, {
      userId: request.user?.userId,
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
      userId: request.user?.userId,
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
      data: { isActive: true },
      include: { prices: true }
    });

    await logAudit(app, {
      userId: request.user?.userId,
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
      data: { isActive: false },
      include: { prices: true }
    });

    await logAudit(app, {
      userId: request.user?.userId,
      action: 'PLAN_DEACTIVATE',
      details: `Deactivated plan ${plan.name}`,
      ip: request.ip
    });

    return reply.send(plan);
  });
}
