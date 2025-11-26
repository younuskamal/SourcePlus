import { LicenseStatus } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const validateLicenseSchema = z.object({
  serial: z.string().min(1)
});

const activateLicenseSchema = z.object({
  serial: z.string().min(1),
  hardwareId: z.string().min(1),
  deviceName: z.string().optional(),
  appVersion: z.string().min(1)
});

const subscriptionQuerySchema = z.object({
  serial: z.string().min(1)
});

const checkUpdateSchema = z.object({
  version: z.string().optional()
});

const supportTicketSchema = z.object({
  serial: z.string().min(1),
  hardwareId: z.string().min(1),
  appVersion: z.string().min(1),
  description: z.string().min(1),
  deviceName: z.string().optional(),
  systemVersion: z.string().optional(),
  phoneNumber: z.string().optional()
});

const formatFeatures = (raw: unknown) => {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && typeof raw === 'object') {
    return Object.values(raw);
  }
  return [];
};

const controller = {
  validateLicense: async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { serial } = validateLicenseSchema.parse(
        request.body ?? {}
      );

      const license =
        await request.server.prisma.license.findUnique({
          where: { serial },
          include: { plan: true }
        });

      if (!license) {
        return reply
          .code(404)
          .send({ error: 'License not found' });
      }

      return reply.send({
        valid:
          license.status === LicenseStatus.active &&
          !license.isPaused,
        status: license.status,
        plan: {
          name: license.plan.name,
          features: formatFeatures(license.plan.features)
        },
        expireDate: license.expireDate
          ? license.expireDate.toISOString()
          : null
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof z.ZodError) {
        return reply
          .code(400)
          .send({ error: 'Invalid request payload' });
      }
      return reply
        .code(500)
        .send({ error: 'Unable to validate license' });
    }
  },

  activateLicense: async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const body = activateLicenseSchema.parse(request.body ?? {});

      const existing =
        await request.server.prisma.license.findUnique({
          where: { serial: body.serial }
        });

      if (!existing) {
        return reply
          .code(404)
          .send({ error: 'License not found' });
      }

      const activationDate = new Date();

      await request.server.prisma.license.update({
        where: { serial: body.serial },
        data: {
          hardwareId: body.hardwareId,
          activationDate,
          lastCheckIn: activationDate,
          status: LicenseStatus.active,
          activationCount: { increment: 1 }
        }
      });

      return reply.send({
        success: true,
        activationDate: activationDate.toISOString(),
        message: 'Device activated successfully.'
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof z.ZodError) {
        return reply
          .code(400)
          .send({ error: 'Invalid request payload' });
      }
      return reply
        .code(500)
        .send({ error: 'Unable to activate license' });
    }
  },

  subscriptionStatus: async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const query = subscriptionQuerySchema.parse(
        request.query ?? {}
      );

      const license =
        await request.server.prisma.license.findUnique({
          where: { serial: query.serial },
          select: {
            expireDate: true,
            status: true,
            isPaused: true
          }
        });

      if (!license) {
        return reply
          .code(404)
          .send({ error: 'License not found' });
      }

      const remainingDays = license.expireDate
        ? Math.max(
            0,
            Math.ceil(
              (license.expireDate.getTime() - Date.now()) /
                86_400_000
            )
          )
        : 0;

      return reply.send({
        status: license.status,
        remainingDays,
        forceLogout:
          license.isPaused ||
          license.status !== LicenseStatus.active
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof z.ZodError) {
        return reply
          .code(400)
          .send({ error: 'Invalid query parameters' });
      }
      return reply
        .code(500)
        .send({ error: 'Unable to fetch subscription status' });
    }
  },

  checkUpdate: async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { version } = checkUpdateSchema.parse(
        request.query ?? {}
      );

      const latest =
        await request.server.prisma.appVersion.findFirst({
          where: { isActive: true },
          orderBy: { releaseDate: 'desc' }
        });

      if (!latest) {
        return reply.send({
          hasUpdate: false,
          version: version ?? 'latest',
          downloadUrl: '',
          releaseNotes: '',
          forceUpdate: false
        });
      }

      return reply.send({
        hasUpdate: version ? latest.version !== version : true,
        version: latest.version,
        downloadUrl: latest.downloadUrl,
        releaseNotes: latest.releaseNotes,
        forceUpdate: latest.forceUpdate
      });
    } catch (error) {
      request.log.error(error);
      return reply
        .code(500)
        .send({ error: 'Unable to check for updates' });
    }
  },

  syncConfig: async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const settings =
        await request.server.prisma.systemSetting.findMany({
          where: {
            key: {
              in: ['maintenance_mode', 'support_phone', 'features']
            }
          }
        });

      const map = settings.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        },
        {} as Record<string, unknown>
      );

      return reply.send({
        maintenance_mode:
          typeof map.maintenance_mode === 'boolean'
            ? map.maintenance_mode
            : Boolean(map.maintenance_mode),
        support_phone:
          typeof map.support_phone === 'string'
            ? map.support_phone
            : '',
        features:
          (map.features as Record<string, unknown>) ?? {}
      });
    } catch (error) {
      request.log.error(error);
      return reply
        .code(500)
        .send({ error: 'Unable to sync configuration' });
    }
  },

  createSupportTicket: async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const body = supportTicketSchema.parse(request.body ?? {});

      const license =
        await request.server.prisma.license.findUnique({
          where: { serial: body.serial },
          select: { id: true }
        });

      const ticket =
        await request.server.prisma.supportTicket.create({
          data: {
            licenseId: license?.id,
            serial: body.serial,
            hardwareId: body.hardwareId,
            deviceName: body.deviceName ?? 'Unknown device',
            systemVersion: body.systemVersion ?? 'unknown',
            phoneNumber: body.phoneNumber ?? 'N/A',
            appVersion: body.appVersion,
            description: body.description
          }
        });

      const ticketId = `T-${ticket.id.slice(0, 8).toUpperCase()}`;

      return reply.code(201).send({
        ticketId,
        status: 'received'
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof z.ZodError) {
        return reply
          .code(400)
          .send({ error: 'Invalid request payload' });
      }
      return reply
        .code(500)
        .send({ error: 'Unable to create support ticket' });
    }
  }
};

export default controller;
