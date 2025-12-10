import { buildApp } from './app.js';
import { runSeed } from './seed.js';

const start = async () => {
  const app = buildApp();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  const host = '0.0.0.0';

  try {
    app.log.info('Starting server initialization...');
    await app.ready();

    app.log.info('Connecting to database...');
    await app.prisma.$connect();
    app.log.info('Database connected.');

    // Start listening immediately to satisfy Render's port scan
    await app.listen({ port, host });
    app.log.info(`Server successfully listening on ${host}:${port}`);

    // Run seed/migrations after server is up
    try {
      app.log.info('Running database seed...');
      await runSeed(app);
      app.log.info('Seed completed successfully.');
    } catch (seedErr) {
      app.log.error(seedErr, 'Failed to run seed, but server is up.');
    }

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
