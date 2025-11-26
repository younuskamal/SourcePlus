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
  serial: z.string().optional(),
  hardwareId: z.string().optional()
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
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return Object.values(raw);
  return [];
};

const controller = {
  validateLicense: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { serial } = validateLicenseSchema.parse(request.body ?? {});
      const prisma = request.server.prisma;

      const license = await prisma.license.findUnique({
        where: { serial },
        include: { plan: true }
      });

      if (!license) {
        return reply.code(404).send({ error: 'License not found' });
      }

      return reply.send({
        valid: license.status === LicenseStatus.active && !license.isPaused,
        status: license.status,
        plan: {
          name: license.plan.name,
          features: formatFeatures(license.plan.features)
        },
        expireDate: license.expireDate ? license.expireDate.toISOString() : null
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid request payload' });
      }
      return reply.code(500).send({ error: 'Unable to validate license' });
    }
  },

  activateLicense: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = activateLicenseSchema.parse(request.body ?? {});
      const prisma = request.server.prisma;

      const license = await prisma.license.findUnique({
        where: { serial: body.serial }
      });

      if (!license) {
        return reply.code(404).send({ error: 'License not found' });
      }

      const activationDate = new Date();

      await prisma.$transaction(async (tx) => {
        await tx.license.update({
          where: { id: license.id },
          data: {
            hardwareId: body.hardwareId,
            activationDate,
            lastCheckIn: activationDate,
            status: LicenseStatus.active,
            activationCount: { increment: 1 }
          }
        });

        const existingDevice = await tx.device.findFirst({
          where: { licenseId: license.id, hardwareId: body.hardwareId }
        });

        if (existingDevice) {
          await tx.device.update({
            where: { id: existingDevice.id },
            data: {
              deviceName: body.deviceName ?? existingDevice.deviceName,
              appVersion: body.appVersion,
              lastCheckIn: activationDate,
              isActive: true
            }
          });
        } else {
          await tx.device.create({
            data: {
              licenseId: license.id,
              hardwareId: body.hardwareId,
              deviceName: body.deviceName ?? 'Unknown device',
              appVersion: body.appVersion
            }
          });
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
        return reply.code(400).send({ error: 'Invalid request payload' });
      }
      return reply.code(500).send({ error: 'Unable to activate license' });
    }
  },

  subscriptionStatus: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = subscriptionQuerySchema.parse(request.query ?? {});
      const serialHeader = request.headers['x-license-serial'];
      const serial =
        query.serial ??
        (Array.isArray(serialHeader) ? serialHeader[0] : serialHeader) ??
        '';

      if (!serial) {
        return reply.code(400).send({ error: 'serial is required' });
      }

      const prisma = request.server.prisma;
      const license = await prisma.license.findUnique({
        where: { serial },
        select: {
          expireDate: true,
          status: true,
          isPaused: true
        }
      });

      if (!license) {
        return reply.code(404).send({ error: 'License not found' });
      }

      const remainingDays = license.expireDate
        ? Math.max(
            0,
            Math.ceil((license.expireDate.getTime() - Date.now()) / 86_400_000)
          )
        : 0;

      return reply.send({
        status: license.status,
        remainingDays,
        forceLogout: license.isPaused || license.status !== LicenseStatus.active
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid query parameters' });
      }
      return reply.code(500).send({ error: 'Unable to fetch subscription status' });
    }
  },

  checkUpdate: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { version } = checkUpdateSchema.parse(request.query ?? {});
      const prisma = request.server.prisma;

      const latest = await prisma.appVersion.findFirst({
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
      return reply.code(500).send({ error: 'Unable to check for updates' });
    }
  },

  syncConfig: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const prisma = request.server.prisma;
      const remoteConfigs = await prisma.remoteConfig.findMany();

      const configMap = remoteConfigs.reduce(
        (acc, config) => {
          acc[config.key] = config.value;
          return acc;
        },
        {} as Record<string, unknown>
      );

      return reply.send({
        maintenance_mode: Boolean(configMap.maintenance_mode ?? false),
        support_phone:
          typeof configMap.support_phone === 'string' ? configMap.support_phone : '',
        features: (configMap.features as Record<string, unknown>) ?? {}
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Unable to sync configuration' });
    }
  },

  createSupportTicket: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = supportTicketSchema.parse(request.body ?? {});
      const prisma = request.server.prisma;

      const license = await prisma.license.findUnique({
        where: { serial: body.serial },
        select: { id: true }
      });

      const ticket = await prisma.supportTicket.create({
        data: {
          licenseId: license?.id ?? null,
          serial: body.serial,
          hardwareId: body.hardwareId,
          deviceName: body.deviceName ?? 'Unknown device',
          systemVersion: body.systemVersion ?? 'unknown',
          phoneNumber: body.phoneNumber ?? '',
          appVersion: body.appVersion,
          description: body.description
        }
      });

      return reply.code(201).send({
        ticketId: `T-${ticket.id.slice(0, 8).toUpperCase()}`,
        status: 'received'
      });
    } catch (error) {
      request.log.error(error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid request payload' });
      }
      return reply.code(500).send({ error: 'Unable to create support ticket' });
    }
  }
};

export default controller;
