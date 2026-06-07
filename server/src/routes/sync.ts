import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { SyncPullResponse, SyncPushResponse } from '@metidy/shared';
import { prisma } from '../db/prisma.js';

const syncEntityTypeSchema = z.enum([
  'item',
  'category',
  'location',
  'channel',
  'field',
  'item_field_value',
  'photo',
]);

const syncChangeSchema = z.object({
  entity_type: syncEntityTypeSchema,
  entity_id: z.string().uuid(),
  operation: z.enum(['create', 'update', 'delete']),
  version: z.number().int().positive().optional(),
  base_version: z.number().int().positive().optional(),
  changed_at: z.string().optional(),
  payload: z.record(z.string(), z.unknown()),
});

const syncPushSchema = z.object({
  device_id: z.string().uuid(),
  changes: z.array(syncChangeSchema).max(500),
});

export const syncRoutes: FastifyPluginAsync = async app => {
  app.post('/sync/push', { preHandler: app.authenticate }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });

    const body = syncPushSchema.parse(request.body);
    const accepted: SyncPushResponse['accepted'] = [];

    await prisma.$transaction(async tx => {
      for (const change of body.changes) {
        const version = BigInt(Date.now());
        await tx.syncChange.create({
          data: {
            userId,
            entityType: change.entity_type,
            entityId: change.entity_id,
            operation: change.operation,
            version,
            payloadJson: change.payload,
          },
        });
        accepted.push({
          entity_type: change.entity_type,
          entity_id: change.entity_id,
          version: Number(version),
        });
      }
    });

    const response: SyncPushResponse = {
      accepted,
      conflicts: [],
    };
    return response;
  });

  app.get('/sync/pull', { preHandler: app.authenticate }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });

    const query = z.object({ cursor: z.coerce.bigint().default(0n) }).parse(request.query);
    const rows = await prisma.syncChange.findMany({
      where: {
        userId,
        id: { gt: query.cursor },
      },
      orderBy: { id: 'asc' },
      take: 500,
    });

    const cursor = rows.length > 0 ? String(rows[rows.length - 1]?.id) : String(query.cursor);
    const response: SyncPullResponse = {
      cursor,
      changes: rows.map(row => ({
        entity_type: row.entityType as SyncPullResponse['changes'][number]['entity_type'],
        entity_id: row.entityId,
        operation: row.operation as SyncPullResponse['changes'][number]['operation'],
        version: Number(row.version),
        changed_at: row.changedAt.toISOString(),
        payload: row.payloadJson as Record<string, unknown>,
      })),
    };
    return response;
  });
};
