import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { TicketStatus, LicenseStatus } from '@prisma/client';
import { generateSerial } from '../../utils/serial.js';

export default async function clientRoutes(app: FastifyInstance) {


  app.post('/activate', async (request, reply) => {
    const body = z.object({
      serial: z.string(),
      hardwareId: z.string(),
      deviceName: z.string(),
      appVersion: z.string()
    }).parse(request.body);

    // 1. Find License
    const license = await app.prisma.license.findUnique({ where: { serial: body.serial } });
    if (!license) return reply.code(404).send({ success: false, message: 'License not found' });

    // 2. Check if this device (HWID) is already registered
    const existingDevice = await app.prisma.device.findUnique({
      where: {
        licenseId_hardwareId: {
          licenseId: license.id,
          hardwareId: body.hardwareId
        }
      }
    });

    // If device exists, just update its info and return success (idempotent)
    if (existingDevice) {
      await app.prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          lastCheckIn: new Date(),
          deviceName: body.deviceName,
          appVersion: body.appVersion,
          isActive: true
        }
      });

      // Also update license last checkin for good measure
      await app.prisma.license.update({
        where: { id: license.id },
        data: { lastCheckIn: new Date(), hardwareId: body.hardwareId } // Update main HWID to latest
      });

      return reply.send({ success: true, activationDate: existingDevice.activationDate });
    }

    // 3. New Device - Check Limit
    // We count *active* devices. Or total? Usually total registered slots.
    // Let's use validation count from License table which is incremented.
    // Or validly count from Device table.

    // Using License.activationCount is safer/faster if maintained correctly.
    // But let's verify with real count from DB to be self-healing if counts drifted.
    const currentDeviceCount = await app.prisma.device.count({
      where: { licenseId: license.id, isActive: true }
    });

    if (currentDeviceCount >= license.deviceLimit) {
      return reply.code(403).send({
        success: false,
        message: 'Device limit reached. Contact support to reset or upgrade.'
      });
    }

    // 4. Activate New Device
    const result = await app.prisma.$transaction(async (tx) => {
      // Create Device record
      const device = await tx.device.create({
        data: {
          licenseId: license.id,
          hardwareId: body.hardwareId,
          deviceName: body.deviceName,
          appVersion: body.appVersion,
          isActive: true
        }
      });

      // Update License
      const updatedLicense = await tx.license.update({
        where: { id: license.id },
        data: {
          activationCount: { increment: 1 },
          status: LicenseStatus.active,
          activationDate: license.activationDate || new Date(),
          lastCheckIn: new Date(),
          hardwareId: body.hardwareId // Set latest as primary/reference
        }
      });

      return { device, license: updatedLicense };
    });

    return reply.send({ success: true, activationDate: result.device.activationDate });
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
        limits: p.limits, // Updated: include limits in plan list
        prices: computedPrices
      };
    }));
  });


  app.post('/validate', async (request, reply) => {
    const body = z.object({ serial: z.string(), hardwareId: z.string().optional() }).parse(request.body);
    const license = await app.prisma.license.findUnique({ where: { serial: body.serial }, include: { plan: true } });
    if (!license) return reply.code(404).send({ valid: false });

    // Check expiration
    const isExpired = license.expireDate && new Date(license.expireDate) < new Date();
    const daysLeft = license.expireDate ? Math.ceil((new Date(license.expireDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return reply.send({
      valid: license.status === LicenseStatus.active && !isExpired,
      status: license.status,
      expireDate: license.expireDate,
      daysLeft: daysLeft,
      plan: license.plan ? {
        id: license.plan.id,
        name: license.plan.name,
        durationMonths: license.plan.durationMonths,
        features: license.plan.features,
        deviceLimit: license.plan.deviceLimit,
        limits: license.plan.limits // Updated: include limits here
      } : null,
      licenseId: license.id
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
        id: license.plan.id, // Added ID
        name: license.plan.name,
        deviceLimit: license.plan.deviceLimit,
        features: license.plan.features,
        limits: license.plan.limits // Updated: include limits here
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
