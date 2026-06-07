import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authPlugin } from './plugins/auth.js';
import { healthRoutes } from './routes/health.js';
import { syncRoutes } from './routes/sync.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });
  await app.register(authPlugin);
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(syncRoutes, { prefix: '/api' });

  return app;
}
