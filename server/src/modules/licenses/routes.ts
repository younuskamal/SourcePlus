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
    return app.prisma.license.findMany({ include: { plan: true } });
  });

  app.post('/generate', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const data = generateSchema.parse(request.body);
    const plan = await app.prisma.plan.findUnique({ where: { id: data.planId } });
    if (!plan) return reply.code(404).send({ message: 'Plan not found' });

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
      if (plan.priceUSD > 0) {
        await app.prisma.transaction.create({
          data: {
            licenseId: license.id,
            customerName: data.customerName,
            planName: plan.name,
            amount: plan.priceUSD,
            currency: 'USD',
            type: TransactionType.purchase,
            status: TransactionStatus.completed
          }
        });
      }
      created.push(license);
    }

    await logAudit(app, { userId: request.user?.id, action: 'GENERATE_LICENSE', details: `Generated ${created.length} licenses`, ip: request.ip });
    return reply.code(201).send(created);
  });

  app.patch('/:id', { preHandler: [app.authorize([Role.admin, Role.developer])] }, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const data = updateSchema.parse(request.body);
    const license = await app.prisma.license.update({ where: { id }, data });
    await logAudit(app, { userId: request.user?.id, action: 'UPDATE_LICENSE', details: `Updated ${license.serial}`, ip: request.ip });
    return reply.send(license);
  });

  app.post('/:id/renew', { preHandler: [app.authorize([Role.admin])] }, async (request, reply) => {
    const { months } = z.object({ months: z.number().int().positive() }).parse(request.body);
    const id = (request.params as { id: string }).id;
    const license = await app.prisma.license.findUnique({ where: { id } , include: { plan: true }});
    if (!license || !license.plan) return reply.code(404).send({ message: 'License not found' });

    const current = license.expireDate ? new Date(license.expireDate) : new Date();
    current.setMonth(current.getMonth() + months);

    const updated = await app.prisma.license.update({
      where: { id },
      data: { expireDate: current, status: LicenseStatus.active, lastRenewalDate: new Date() }
    });

    await app.prisma.transaction.create({
      data: {
        licenseId: id,
        customerName: license.customerName,
        planName: license.plan.name,
        amount: (license.plan.priceUSD / license.plan.durationMonths) * months,
        currency: 'USD',
        type: TransactionType.renewal,
        status: TransactionStatus.completed
      }
    });

    await logAudit(app, { userId: request.user?.id, action: 'RENEW_LICENSE', details: `Renewed ${license.serial}`, ip: request.ip });
    return reply.send(updated);
  });

  app.post('/:id/pause', { preHandler: [app.authorize([Role.admin])]}, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const license = await app.prisma.license.findUnique({ where: { id } });
    if (!license) return reply.code(404).send({ message: 'License not found' });
    const updated = await app.prisma.license.update({ where: { id }, data: { isPaused: !license.isPaused, status: license.isPaused ? LicenseStatus.active : LicenseStatus.paused } });
    await logAudit(app, { userId: request.user?.id, action: 'TOGGLE_PAUSE', details: `Pause toggle ${license.serial}`, ip: request.ip });
    return reply.send(updated);
  });

  app.post('/:id/revoke', { preHandler: [app.authorize([Role.admin])]}, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const updated = await app.prisma.license.update({ where: { id }, data: { status: LicenseStatus.revoked } });
    await logAudit(app, { userId: request.user?.id, action: 'REVOKE_LICENSE', details: `Revoked ${updated.serial}`, ip: request.ip });
    return reply.send(updated);
  });

  app.delete('/:id', { preHandler: [app.authorize([Role.admin])]}, async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const license = await app.prisma.license.delete({ where: { id } });
    await logAudit(app, { userId: request.user?.id, action: 'DELETE_LICENSE', details: `Deleted ${license.serial}`, ip: request.ip });
    return reply.code(204).send();
  });
}
