import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { z } from 'zod';
import type { AuthTokenResponse } from '@metidy/shared';
import { prisma } from '../db/prisma.js';

const scrypt = promisify(scryptCallback);

const credentialsSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(256),
  device_name: z.string().trim().max(100).optional(),
});

const registerSchema = credentialsSchema.extend({
  name: z.string().trim().max(100).optional(),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

const deviceSchema = z.object({
  device_id: z.string().uuid().optional(),
  name: z.string().trim().max(100).optional(),
});

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString('base64url')}`;
}

async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [scheme, salt, stored] = passwordHash.split(':');
  if (scheme !== 'scrypt' || !salt || !stored) return false;

  const storedKey = Buffer.from(stored, 'base64url');
  const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}

function publicUser(user: { id: string; email: string; name: string | null }) {
  return {
    id: user.id,
    email: user.email,
    ...(user.name ? { name: user.name } : {}),
  };
}

async function issueTokens(
  app: FastifyInstance,
  user: { id: string; email: string; name: string | null },
  deviceId: string
): Promise<AuthTokenResponse> {
  return {
    access_token: app.jwt.sign(
      { sub: user.id, typ: 'access', device_id: deviceId },
      { expiresIn: '15m' }
    ),
    refresh_token: app.jwt.sign(
      { sub: user.id, typ: 'refresh', device_id: deviceId },
      { expiresIn: '30d' }
    ),
    device_id: deviceId,
    user: publicUser(user),
  };
}

export const authRoutes: FastifyPluginAsync = async app => {
  app.post('/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const userId = randomUUID();
    const deviceId = randomUUID();

    try {
      const user = await prisma.user.create({
        data: {
          id: userId,
          email: body.email,
          name: body.name,
          passwordHash: await hashPassword(body.password),
          devices: {
            create: {
              id: deviceId,
              name: body.device_name,
              lastSeenAt: new Date(),
            },
          },
        },
      });

      return reply.code(201).send(await issueTokens(app, user, deviceId));
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return reply.code(409).send({ error: 'email_already_registered' });
      }
      throw error;
    }
  });

  app.post('/auth/login', async (request, reply) => {
    const body = credentialsSchema.parse(request.body);
    const user = await prisma.user.findFirst({
      where: { email: body.email, deletedAt: null },
    });

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return reply.code(401).send({ error: 'invalid_credentials' });
    }

    const device = await prisma.device.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        name: body.device_name,
        lastSeenAt: new Date(),
      },
    });

    return issueTokens(app, user, device.id);
  });

  app.post('/auth/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body);
    try {
      const payload = app.jwt.verify<{ sub: string; typ?: string; device_id?: string }>(
        body.refresh_token
      );
      if (payload.typ !== 'refresh' || !payload.sub || !payload.device_id) {
        return reply.code(401).send({ error: 'invalid_refresh_token' });
      }

      const device = await prisma.device.findFirst({
        where: {
          id: payload.device_id,
          userId: payload.sub,
          revokedAt: null,
        },
      });
      const user = await prisma.user.findFirst({
        where: { id: payload.sub, deletedAt: null },
      });
      if (!device || !user) return reply.code(401).send({ error: 'invalid_refresh_token' });

      await prisma.device.update({
        where: { id: device.id },
        data: { lastSeenAt: new Date() },
      });

      return issueTokens(app, user, device.id);
    } catch {
      return reply.code(401).send({ error: 'invalid_refresh_token' });
    }
  });

  app.post('/auth/devices', { preHandler: app.authenticate }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });

    const body = deviceSchema.parse(request.body);
    const deviceId = body.device_id ?? randomUUID();
    const existingDevice = await prisma.device.findUnique({ where: { id: deviceId } });
    if (existingDevice && existingDevice.userId !== userId) {
      return reply.code(403).send({ error: 'device_not_owned' });
    }

    const device = existingDevice
      ? await prisma.device.update({
          where: { id: deviceId },
          data: {
            name: body.name,
            lastSeenAt: new Date(),
            revokedAt: null,
          },
        })
      : await prisma.device.create({
          data: {
            id: deviceId,
            userId,
            name: body.name,
            lastSeenAt: new Date(),
          },
        });

    return { device_id: device.id };
  });
};
