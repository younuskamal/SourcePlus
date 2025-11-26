import { FastifyInstance } from 'fastify';
import { createLicensingController } from './licensing.controller.js';

export default async function licensingRoutes(app: FastifyInstance) {
  const controller = createLicensingController(app);

  app.post('/license/validate', controller.validateLicense);
  app.post('/license/activate', controller.activateLicense);
  app.get('/subscription/status', controller.getSubscriptionStatus);
  app.get('/app/update', controller.checkUpdate);
  app.get('/config/sync', controller.syncConfig);
  app.post('/support/request', controller.createSupportTicket);
}

