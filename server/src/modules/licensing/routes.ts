import { FastifyInstance } from 'fastify';
import controller from './controller.js';

export default async function licensingRoutes(app: FastifyInstance) {
  app.post('/license/validate', controller.validateLicense);
  app.post('/license/activate', controller.activateLicense);

  app.get('/subscription/status', controller.subscriptionStatus);

  app.get('/app/update', controller.checkUpdate);

  app.get('/config/sync', controller.syncConfig);

  app.post('/support/request', controller.createSupportTicket);
}
