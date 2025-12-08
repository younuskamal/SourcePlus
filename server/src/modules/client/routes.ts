import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { TicketStatus, LicenseStatus } from '@prisma/client';
import { generateSerial } from '../../utils/serial.js';

export default async function clientRoutes(app: FastifyInstance) {
  app.post('/validate', async (request, reply) => {
    const body = z.object({ serial: z.string(), hardwareId: z.string().optional() }).parse(request.body);
    const license = await app.prisma.license.findUnique({ where: { serial: body.serial }, include: { plan: true } });
    if (!license) return reply.code(404).send({ valid: false });
    return reply.send({
      valid: true,
      status: license.status,
      plan: license.plan ? { name: license.plan.name, features: license.plan.features } : null,
      expireDate: license.expireDate
    });
  });

  app.post('/activate', async (request, reply) => {
    const body = z.object({
      serial: z.string(),
      hardwareId: z.string(),
      deviceName: z.string(),
      appVersion: z.string()
    }).parse(request.body);
    const license = await app.prisma.license.findUnique({ where: { serial: body.serial } });
    if (!license) return reply.code(404).send({ success: false });
    const updated = await app.prisma.license.update({
      where: { id: license.id },
      data: {
        hardwareId: body.hardwareId,
        activationCount: { increment: 1 },
        activationDate: new Date(),
        status: LicenseStatus.active,
        lastCheckIn: new Date()
      }
    });
    return reply.send({ success: true, activationDate: updated.activationDate });
  });

  app.post('/offline-activation', async (request, reply) => {
    const body = z.object({
      activationCode: z.string().min(10),
      hardwareId: z.string().min(5)
    }).parse(request.body);

    const license = await app.prisma.license.findFirst({
      where: { serial: body.activationCode.substring(0, 20) }
    });

    if (!license) {
      return reply.code(404).send({ success: false, message: 'Invalid activation code' });
    }

    const updated = await app.prisma.license.update({
      where: { id: license.id },
      data: {
        hardwareId: body.hardwareId,
        activationCount: { increment: 1 },
        activationDate: new Date(),
        status: LicenseStatus.active,
        lastCheckIn: new Date()
      }
    });

    return reply.send({
      success: true,
      license: {
        serial: updated.serial,
        expireDate: updated.expireDate,
        status: updated.status
      }
    });
  });

  app.get('/plans', async (request, reply) => {
    const plans = await app.prisma.plan.findMany({
      where: { isActive: true },
      include: { prices: true }
    });
    const currencies = await app.prisma.currency.findMany();

    return reply.send(plans.map(p => {
      // Calculate prices for all active currencies
      const computedPrices = currencies.map(c => {
        const existing = p.prices.find(price => price.currency === c.code);

        // If explicit price exists, use it and ensure no nulls
        if (existing) {
          return {
            currency: c.code,
            monthlyPrice: existing.monthlyPrice || 0,
            periodPrice: existing.periodPrice || 0,
            yearlyPrice: existing.yearlyPrice || 0,
            discount: existing.discount || 0,
            isPrimary: existing.isPrimary
          };
        }

        // Otherwise, calculate from base USD
        const baseUsd = p.priceUSD || 0;
        const rate = c.rate;
        const periodPrice = baseUsd * rate;
        const monthlyPrice = p.durationMonths > 0 ? periodPrice / p.durationMonths : 0;
        // Estimate yearly based on monthly
        const yearlyPrice = monthlyPrice * 12;

        return {
          currency: c.code,
          monthlyPrice: Number(monthlyPrice.toFixed(0)), // Round to whole numbers for cleanliness
          periodPrice: Number(periodPrice.toFixed(0)),
          yearlyPrice: Number(yearlyPrice.toFixed(0)),
          discount: 0,
          isPrimary: c.code === 'USD'
        };
      });

      return {
        id: p.id,
        name: p.name,
        durationMonths: p.durationMonths,
        priceUSD: p.priceUSD,
        deviceLimit: p.deviceLimit,
        features: p.features,
        prices: computedPrices
      };
    }));
  });



  app.post('/validate', async (request, reply) => {
    const body = z.object({ serial: z.string(), hardwareId: z.string().optional() }).parse(request.body);
    const license = await app.prisma.license.findUnique({ where: { serial: body.serial }, include: { plan: true } });
    if (!license) return reply.code(404).send({ valid: false });
    return reply.send({
      valid: true,
      status: license.status,
      plan: license.plan ? {
        name: license.plan.name,
        features: license.plan.features,
        deviceLimit: license.plan.deviceLimit, // Return device limit
        limits: license.plan.limits // Return all limits
      } : null,
      expireDate: license.expireDate
    });
  });

  app.get('/check-license', async (request, reply) => {
    const serial = (request.query as any).serial as string | undefined;
    if (!serial) return reply.code(400).send({ valid: false, message: 'Serial required' });

    const license = await app.prisma.license.findUnique({
      where: { serial },
      include: { plan: true }
    });

    if (!license) return reply.code(404).send({ valid: false });

    const isExpired = license.expireDate && new Date(license.expireDate) < new Date();

    return reply.send({
      valid: license.status === LicenseStatus.active && !isExpired,
      status: license.status,
      expireDate: license.expireDate,
      daysLeft: license.expireDate ? Math.ceil((new Date(license.expireDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0,
      plan: license.plan ? {
        name: license.plan.name,
        deviceLimit: license.plan.deviceLimit,
        limits: license.plan.limits
      } : null
    });
  });

  app.post('/heartbeat', async (request, reply) => {
    const body = z.object({
      serial: z.string(),
      hardwareId: z.string(),
      appVersion: z.string(),
      deviceName: z.string().optional()
    }).parse(request.body);

    const license = await app.prisma.license.findUnique({ where: { serial: body.serial } });
    if (!license) return reply.code(404).send({ success: false });

    await app.prisma.license.update({
      where: { id: license.id },
      data: { lastCheckIn: new Date() }
    });

    return reply.send({ success: true, timestamp: new Date() });
  });

  app.post('/update-hwid', async (request, reply) => {
    const body = z.object({
      serial: z.string(),
      oldHardwareId: z.string().optional(),
      newHardwareId: z.string()
    }).parse(request.body);

    const license = await app.prisma.license.findUnique({ where: { serial: body.serial } });
    if (!license) return reply.code(404).send({ success: false });

    const updated = await app.prisma.license.update({
      where: { id: license.id },
      data: { hardwareId: body.newHardwareId }
    });

    return reply.send({ success: true, newHardwareId: updated.hardwareId });
  });

  app.get('/check-update', async (request, reply) => {
    const version = (request.query as any).version as string | undefined;
    const latest = await app.prisma.appVersion.findFirst({ where: { isActive: true }, orderBy: { releaseDate: 'desc' } });
    if (!latest) return reply.send({ shouldUpdate: false });

    const shouldUpdate = !version || version !== latest.version;

    return reply.send({
      shouldUpdate,
      latest: {
        version: latest.version,
        downloadUrl: latest.downloadUrl,
        releaseNotes: latest.releaseNotes,
        forceUpdate: latest.forceUpdate
      }
    });
  });

  app.get('/sync-config', async () => {
    const cfg = await app.prisma.remoteConfig.findMany();
    return Object.fromEntries(cfg.map((c) => [c.key, c.value]));
  });

  app.get('/notifications', async (request, reply) => {
    const serial = (request.query as any).serial || request.headers['x-serial'] || request.headers['serial'];
    if (!serial) return reply.code(400).send({ message: 'Serial is required' });

    const notifications = await app.prisma.notification.findMany({
      where: {
        OR: [
          { targetSerial: null },
          { targetSerial: serial }
        ],
        productType: 'POS'
      },
      orderBy: { sentAt: 'desc' },
      take: 20
    });
    return reply.send(notifications);
  });

  app.get('/support', async (request, reply) => {
    const serial = (request.query as any).serial || request.headers['x-serial'] || request.headers['serial'];
    if (!serial) return reply.code(400).send({ message: 'Serial is required' });

    const tickets = await app.prisma.supportTicket.findMany({
      where: { serial },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
    return reply.send(tickets);
  });

  app.post('/support', async (request, reply) => {
    const body = z.object({
      serial: z.string(),
      hardwareId: z.string(),
      deviceName: z.string(),
      systemVersion: z.string(),
      phoneNumber: z.string(),
      appVersion: z.string(),
      description: z.string()
    }).parse(request.body);

    const license = await app.prisma.license.findUnique({ where: { serial: body.serial } });

    const ticket = await app.prisma.supportTicket.create({
      data: {
        ...body,
        status: TicketStatus.open,
        licenseId: license?.id // Connect to license if found
      }
    });

    return reply.code(201).send({ ticketId: ticket.id, status: ticket.status });
  });
}
