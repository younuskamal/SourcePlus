import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import licensingRoutes from './licensing.routes.js';

export default fp(async (app: FastifyInstance) => {
  await licensingRoutes(app);
});

