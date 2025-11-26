import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { LicensingService } from './services.js';

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

export default async function licensingRoutes(app: FastifyInstance) {
  const service = new LicensingService(app);

  app.post<{ Body: { serial: string } }>('/license/validate', async (request, reply) => {
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
  });

  app.post<{ Body: typeof activateLicenseSchema }>('/license/activate', async (request, reply) => {
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
  });

  app.get<{ Querystring: { serial: string; hardwareId?: string } }>('/subscription/status', async (request, reply) => {
    try {
      const serial = request.headers['x-license-serial'] as string || request.query.serial;
      
      if (!serial) {
        return reply.code(400).send({ error: 'License serial is required' });
      }

      const result = await service.getSubscriptionStatus(serial);
      return reply.send(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'License not found') {
        return reply.code(404).send({ error: 'License not found' });
      }
      app.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  app.get<{ Querystring: { version?: string } }>('/app/update', async (request, reply) => {
    try {
      const version = request.query.version;
      const result = await service.checkUpdate(version);
      return reply.send(result);
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  app.get('/config/sync', async (request, reply) => {
    try {
      const result = await service.getConfig();
      return reply.send(result);
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  app.post<{ Body: typeof createSupportTicketSchema }>('/support/request', async (request, reply) => {
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
  });
}
