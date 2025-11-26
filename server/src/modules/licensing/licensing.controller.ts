import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { LicensingService } from './licensing.service.js';

const validateLicenseSchema = z.object({
  serial: z.string().min(1)
});

const activateLicenseSchema = z.object({
  serial: z.string().min(1),
  hardwareId: z.string().min(1),
  deviceName: z.string().min(1),
  appVersion: z.string().min(1)
});

const checkUpdateSchema = z.object({
  version: z.string().optional()
});

const createSupportTicketSchema = z.object({
  serial: z.string().min(1),
  hardwareId: z.string().min(1),
  appVersion: z.string().min(1),
  description: z.string().min(1),
  deviceName: z.string().optional(),
  systemVersion: z.string().optional(),
  phoneNumber: z.string().optional()
});

export const createLicensingController = (app: FastifyInstance) => {
  const service = new LicensingService(app);

  return {
    validateLicense: async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const body = validateLicenseSchema.parse(request.body);
        const result = await service.validateLicense(body.serial);
        return reply.send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid request' });
        }
        app.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },

    activateLicense: async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const body = activateLicenseSchema.parse(request.body);
        const result = await service.activateLicense(
          body.serial,
          body.hardwareId,
          body.deviceName,
          body.appVersion
        );
        return reply.send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid request' });
        }
        if (error instanceof Error) {
          if (error.message.includes('Device limit exceeded')) {
            return reply.code(403).send({ error: error.message });
          }
          if (error.message.includes('License not found')) {
            return reply.code(404).send({ error: error.message });
          }
          if (error.message.includes('License is')) {
            return reply.code(400).send({ error: error.message });
          }
        }
        app.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },

    getSubscriptionStatus: async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const query = request.query as {
          serial?: string;
          hardwareId?: string;
        };

        const serialHeader = request.headers['x-license-serial'];
        const hardwareHeader = request.headers['x-hardware-id'];

        const serial =
          (serialHeader && String(serialHeader)) || query.serial || '';
        const hardwareId = hardwareHeader
          ? String(hardwareHeader)
          : query.hardwareId;

        if (!serial) {
          return reply
            .code(400)
            .send({ error: 'License serial is required' });
        }

        const result = await service.getSubscriptionStatus(
          serial,
          hardwareId
        );
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error && error.message === 'License not found') {
          return reply.code(404).send({ error: 'License not found' });
        }
        app.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },

    checkUpdate: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = checkUpdateSchema.parse(request.query);
        const result = await service.checkUpdate(query.version);
        return reply.send(result);
      } catch (error) {
        app.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },

    syncConfig: async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await service.getConfig();
        return reply.send(result);
      } catch (error) {
        app.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },

    createSupportTicket: async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const body = createSupportTicketSchema.parse(request.body);
        const result = await service.createSupportTicket(
          body.serial,
          body.hardwareId,
          body.appVersion,
          body.description,
          body.deviceName,
          body.systemVersion,
          body.phoneNumber
        );
        return reply.code(201).send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid request' });
        }
        app.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  };
};

