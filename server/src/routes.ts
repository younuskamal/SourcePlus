import { FastifyInstance } from 'fastify';
import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/users/routes.js';
import planRoutes from './modules/plans/routes.js';
import currencyRoutes from './modules/currencies/routes.js';
import licenseRoutes from './modules/licenses/routes.js';
import notificationRoutes from './modules/notifications/routes.js';
import ticketRoutes from './modules/tickets/routes.js';
import versionRoutes from './modules/versions/routes.js';
import settingsRoutes from './modules/settings/routes.js';
import auditRoutes from './modules/audit/routes.js';
import analyticsRoutes from './modules/analytics/routes.js';
import backupRoutes from './modules/backup/routes.js';
import clientRoutes from './modules/client/routes.js';
// import supportRoutes from './modules/support/routes.js'; // Legacy - disabled
import clinicRoutes from './modules/clinics/routes.js';
import subscriptionRoutes from './modules/subscription/routes.js';
import messagesRoutes from './modules/messages/routes.js';
import supportMessagesRoutes from './modules/support/messages.js';

import { trafficRoutes } from './modules/traffic/traffic.routes.js';

import publicPlanRoutes from './modules/plans/public.routes.js';

export const registerRoutes = (app: FastifyInstance) => {
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(userRoutes, { prefix: '/api/users' });
  app.register(planRoutes, { prefix: '/api/plans' });
  app.register(publicPlanRoutes, { prefix: '/api/public/plans' });
  app.register(currencyRoutes, { prefix: '/api/currencies' });
  app.register(licenseRoutes, { prefix: '/api/licenses' });
  app.register(notificationRoutes, { prefix: '/api/notifications' });
  app.register(ticketRoutes, { prefix: '/api/tickets' });
  app.register(versionRoutes, { prefix: '/api/versions' });
  app.register(settingsRoutes, { prefix: '/api/settings' });
  app.register(auditRoutes, { prefix: '/api/audit-logs' });
  app.register(analyticsRoutes, { prefix: '/api/analytics' });
  app.register(backupRoutes, { prefix: '/api/backup' });
  app.register(clientRoutes, { prefix: '/api/pos' });
  app.register(clinicRoutes, { prefix: '/api/clinics' });
  app.register(subscriptionRoutes, { prefix: '/api/subscription' });
  app.register(messagesRoutes, { prefix: '/api/messages' });
  app.register(supportMessagesRoutes, { prefix: '/api' });
  app.register(trafficRoutes, { prefix: '/api/traffic' });
};