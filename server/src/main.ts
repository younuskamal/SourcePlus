import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import sensible from '@fastify/sensible';
import dotenv from 'dotenv';
import { ZodError } from 'zod';
import authPlugin from './plugins/auth.js';
import prismaPlugin from './plugins/prisma.js';
import { registerRoutes } from './routes.js';
import { ensureAdminSeed } from './utils/audit.js';

dotenv.config();

const buildServer = () => {
  const app = Fastify({
    logger: true
  });

  app.register(cors, { origin: true });
  app.register(sensible);
  app.register(multipart);
  app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret'
  });
  app.register(prismaPlugin);
  app.register(authPlugin);

  app.get('/', async () => ({ status: 'ok' }));
  app.get('/health', async () => ({ healthy: true }));

  registerRoutes(app);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      const issues = error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
      }));
      return reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation error',
        issues
      });
    }
    throw error;
  });

  return app;
};

const start = async () => {
  const app = buildServer();
  const port = Number(process.env.PORT) || 3001;
  try {
    await app.ready();
    await ensureAdminSeed(app);
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Server running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
