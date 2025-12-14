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
import supportRoutes from './modules/support/routes.js';
import clinicRoutes from './modules/clinics/routes.js';
import subscriptionRoutes from './modules/subscription/routes.js';
import messagesRoutes from './modules/messages/routes.js';

import { trafficRoutes } from './modules/traffic/traffic.routes.js';

import publicPlanRoutes from './modules/plans/public.routes.js';

export const registerRoutes = (app: FastifyInstance) => {
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(userRoutes, { prefix: '/users' });
  app.register(planRoutes, { prefix: '/plans' });
  app.register(publicPlanRoutes, { prefix: '/api/plans' });
  app.register(currencyRoutes, { prefix: '/currencies' });
  app.register(licenseRoutes, { prefix: '/licenses' });
  app.register(notificationRoutes, { prefix: '/notifications' });
  app.register(ticketRoutes, { prefix: '/tickets' });
  app.register(versionRoutes, { prefix: '/versions' });
  app.register(settingsRoutes, { prefix: '/settings' });
  app.register(auditRoutes, { prefix: '/audit-logs' });
  app.register(analyticsRoutes, { prefix: '/analytics' });
  app.register(backupRoutes, { prefix: '/backup' });
  app.register(clientRoutes, { prefix: '/api/pos' });
  app.register(clinicRoutes, { prefix: '/api/clinics' });
  app.register(subscriptionRoutes, { prefix: '/api/subscription' });
  app.register(supportRoutes, { prefix: '/api/support' });
  app.register(messagesRoutes, { prefix: '/api/messages' });
  app.register(trafficRoutes, { prefix: '/traffic' });
};