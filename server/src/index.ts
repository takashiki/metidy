import { buildApp } from './app.js';
import { config } from './config.js';
import { prisma } from './db/prisma.js';

const app = await buildApp();

const close = async () => {
  await app.close();
  await prisma.$disconnect();
};

process.on('SIGINT', () => {
  close().finally(() => process.exit(0));
});

process.on('SIGTERM', () => {
  close().finally(() => process.exit(0));
});

await app.listen({
  port: config.PORT,
  host: '0.0.0.0',
});
