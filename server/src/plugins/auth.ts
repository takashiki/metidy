import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export const authPlugin = fp(async app => {
  await app.register(jwt, { secret: config.JWT_SECRET });

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = await request.jwtVerify<{ sub: string; typ?: string; device_id?: string }>();
      if (payload.typ !== 'access') {
        throw new Error('invalid token type');
      }
      request.userId = payload.sub;
    } catch {
      await reply.code(401).send({ error: 'unauthorized' });
    }
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}
