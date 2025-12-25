import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { ZodError } from 'zod';
import authPlugin from './plugins/auth.js';
import prismaPlugin from './plugins/prisma.js';
import clientPlugin from './plugins/client.js';
import { registerRoutes } from './routes.js';
dotenv.config();

export const buildApp = () => {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: [
      'https://sourcef.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://138.68.88.223:4080'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  });
  app.register(sensible);
  app.register(multipart);
  app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret'
  });
  app.register(rateLimit, {
    global: false,
    max: 200,
    timeWindow: '1 minute'
  });
  app.register(prismaPlugin);
  app.register(authPlugin);
  app.register(clientPlugin);

  app.get('/', async () => ({ status: 'ok' }));
  app.get('/health', async () => ({ healthy: true }));

  registerRoutes(app);

  // Capture response body
  app.addHook('onSend', async (request, reply, payload) => {
    const url = request.raw.url || '';
    if (url.startsWith('/api/')) {
      try {
        (request as any).rawBody = JSON.parse(payload as string);
      } catch (e) {
        (request as any).rawBody = payload;
      }
    }
  });

  app.addHook('onResponse', async (request, reply) => {
    const url = request.raw.url || '';

    // Only log requests to /api/*
    if (!url.startsWith('/api/')) {
      return;
    }

    // Extract serial and hardwareId from headers or body
    let serial = (request.headers['x-serial'] as string) || (request.headers['serial'] as string);
    let hardwareId = (request.headers['x-hardware-id'] as string) || (request.headers['hardware-id'] as string);

    // Try to get from body if not in headers (safely)
    if (!serial || !hardwareId) {
      try {
        const body = request.body as any;
        if (body) {
          if (!serial && body.serial) serial = body.serial;
          if (!hardwareId && body.hardwareId) hardwareId = body.hardwareId;
        }
      } catch (e) {
        // Ignore body parsing errors
      }
    }

    const duration = reply.elapsedTime;
    const responseBody = (request as any).rawBody;

    try {
      await app.prisma.trafficLog.create({
        data: {
          method: request.method,
          endpoint: url.split('?')[0], // Remove query params from endpoint
          status: reply.statusCode,
          serial: serial || null,
          hardwareId: hardwareId || null,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] || null,
          payload: (request.body as any) || undefined,
          response: responseBody || undefined,
          durationMs: duration,
        },
      });
    } catch (err) {
      request.log.error(err, 'Failed to log traffic');
    }
  });


  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error instanceof ZodError) {
      return reply
        .code(400)
        .send({ error: 'Invalid request payload' });
    }

    const status = (error as any)?.statusCode ?? 500;
    const message =
      (error as any)?.message ?? 'Internal server error';

    return reply.code(status).send({ error: message });
  });

  return app;
};

// Export backup scheduler instance
export let backupScheduler: any = null;

export const initializeBackupScheduler = async (app: any) => {
  const { BackupScheduler } = await import('./services/backup.scheduler.js');
  backupScheduler = new BackupScheduler(app);
  await backupScheduler.start();
};
