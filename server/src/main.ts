import { buildApp } from './app.js';
import licensingRoutes from './modules/licensing/routes.js';
import { runSeed } from './seed.js';

const start = async () => {
  const app = buildApp();
  const port = Number(process.env.PORT) || 3001;

  app.register(licensingRoutes, { prefix: '/api' });

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

start();
