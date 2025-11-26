import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import sensible from '@fastify/sensible';
import dotenv from 'dotenv';
import { ZodError } from 'zod';
import authPlugin from './plugins/auth.js';
import prismaPlugin from './plugins/prisma.js';
import clientPlugin from './plugins/client.js';
import { registerRoutes } from './routes.js';
import { runSeed } from './seed.js';

dotenv.config();

export const buildApp = () => {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: [
      'https://sourcef.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  });
  app.register(sensible);
  app.register(multipart);
  app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret'
  });
  app.register(prismaPlugin);
  app.register(authPlugin);
  app.register(clientPlugin);

  app.get('/', async () => ({ status: 'ok' }));
  app.get('/health', async () => ({ healthy: true }));

  registerRoutes(app);

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

export const startApp = async () => {
  const app = buildApp();
  const port = Number(process.env.PORT) || 3001;

  app.register(import('./modules/licensing/routes.js'), {
    prefix: '/api'
  });

  try {
    await app.ready();
    await app.prisma.$connect();
    await runSeed(app);
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Server running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
