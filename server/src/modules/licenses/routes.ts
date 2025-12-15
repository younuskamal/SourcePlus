import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { LicenseStatus, Role, TransactionStatus, TransactionType } from '@prisma/client';
import { generateSerial } from '../../utils/serial.js';
import { logAudit } from '../../utils/audit.js';

const generateSchema = z.object({
  planId: z.string(),
  customerName: z.string().min(2),
  quantity: z.number().int().min(1).max(50).default(1)
});

const updateSchema = z.object({
  customerName: z.string().optional(),
  hardwareId: z.string().optional(),
  status: z.nativeEnum(LicenseStatus).optional()
});

export default async function licenseRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    return app.prisma.license.findMany({
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });
  });

  app.post('/generate', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const data = generateSchema.parse(request.body);
    const plan = await app.prisma.plan.findUnique({
      where: { id: data.planId },
      include: { prices: true }
    });

    if (!plan) return reply.code(404).send({ message: 'Plan not found' });

    // Determine price to use (prefer primary, then first available, then legacy)
    const priceObj = plan.prices.find(p => p.isPrimary) || plan.prices[0];
    let amount = 0;
    let currency = 'USD';

    if (priceObj) {
      amount = priceObj.periodPrice || (priceObj.monthlyPrice ? priceObj.monthlyPrice * plan.durationMonths : 0);
      currency = priceObj.currency;
    } else {
      // Legacy fallback
      amount = plan.priceUSD || 0;
      currency = plan.currency || 'USD';
    }

    const created = [];
    for (let i = 0; i < data.quantity; i++) {
      const serial = generateSerial(plan);
      const license = await app.prisma.license.create({
        data: {
          serial,
          planId: data.planId,
          customerName: data.customerName,
          deviceLimit: plan.deviceLimit,
          status: LicenseStatus.pending,
          expireDate: new Date(new Date().setMonth(new Date().getMonth() + plan.durationMonths))
        }
      });

      if (amount > 0) {
        await app.prisma.transaction.create({
          data: {
            licenseId: license.id,
            customerName: data.customerName,
            planName: plan.name,
            amount: amount,
            currency: currency,
            type: TransactionType.purchase,
            status: TransactionStatus.completed
          }
        });
      }
      created.push(license);
    }

    await logAudit(app, { userId: request.user?.userId, action: 'GENERATE_LICENSE', details: `Generated ${created.length} licenses for ${plan.name}`, ip: request.ip });
    return reply.code(201).send(created);
  });

  app.patch('/:id', { preHandler: [app.authorize([Role.admin, Role.developer])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const data = updateSchema.parse(request.body);
    const license = await app.prisma.license.update({ where: { id }, data });
    await logAudit(app, { userId: request.user?.userId, action: 'UPDATE_LICENSE', details: `Updated ${license.serial}`, ip: request.ip });
    return reply.send(license);
  });

  app.post('/:id/renew', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const { months } = z.object({ months: z.number().int().positive() }).parse(request.body);
    const id = (request.params as { id: string }).id;

    const license = await app.prisma.license.findUnique({
      where: { id },
      include: { plan: { include: { prices: true } } }
    });

    if (!license || !license.plan) return reply.code(404).send({ message: 'License not found' });

    const current = license.expireDate && new Date(license.expireDate) > new Date()
      ? new Date(license.expireDate)
      : new Date();

    current.setMonth(current.getMonth() + months);

    const updated = await app.prisma.license.update({
      where: { id },
      data: { expireDate: current, status: LicenseStatus.active, lastRenewalDate: new Date() }
    });

    // Calculate Renewal Cost
    const priceObj = license.plan.prices.find(p => p.isPrimary) || license.plan.prices[0];
    let renewalAmount = 0;
    let currency = 'USD';

    if (priceObj) {
      const basePrice = priceObj.periodPrice || (priceObj.monthlyPrice ? priceObj.monthlyPrice * license.plan.durationMonths : 0);
      if (basePrice > 0 && license.plan.durationMonths > 0) {
        renewalAmount = (basePrice / license.plan.durationMonths) * months;
      }
      currency = priceObj.currency;
    } else {
      // Legacy fallback
      const basePrice = license.plan.priceUSD || 0;
      if (basePrice > 0 && license.plan.durationMonths > 0) {
        renewalAmount = (basePrice / license.plan.durationMonths) * months;
      }
      currency = license.plan.currency || 'USD';
    }

    if (renewalAmount > 0) {
      await app.prisma.transaction.create({
        data: {
          licenseId: id,
          customerName: license.customerName,
          planName: license.plan.name,
          amount: parseFloat(renewalAmount.toFixed(2)),
          currency: currency,
          type: TransactionType.renewal,
          status: TransactionStatus.completed
        }
      });
    }

    await logAudit(app, { userId: request.user?.userId, action: 'RENEW_LICENSE', details: `Renewed ${license.serial} for ${months} months`, ip: request.ip });
    return reply.send(updated);
  });

  app.post('/:id/pause', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const license = await app.prisma.license.findUnique({ where: { id } });
    if (!license) return reply.code(404).send({ message: 'License not found' });
    const updated = await app.prisma.license.update({ where: { id }, data: { isPaused: !license.isPaused, status: license.isPaused ? LicenseStatus.active : LicenseStatus.paused } });
    await logAudit(app, { userId: request.user?.userId, action: 'TOGGLE_PAUSE', details: `Pause toggle ${license.serial}`, ip: request.ip });
    return reply.send(updated);
  });

  app.post('/:id/revoke', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const updated = await app.prisma.license.update({ where: { id }, data: { status: LicenseStatus.revoked } });
    await logAudit(app, { userId: request.user?.userId, action: 'REVOKE_LICENSE', details: `Revoked ${updated.serial}`, ip: request.ip });
    return reply.send(updated);
  });

  app.delete('/:id', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const license = await app.prisma.license.delete({ where: { id } });
    await logAudit(app, { userId: request.user?.userId, action: 'DELETE_LICENSE', details: `Deleted ${license.serial}`, ip: request.ip });
    return reply.code(204).send();
  });
}
