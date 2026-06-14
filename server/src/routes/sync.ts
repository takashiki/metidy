import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';
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

type SyncChangeInput = z.infer<typeof syncChangeSchema>;
type SyncEntityType = z.infer<typeof syncEntityTypeSchema>;
type Transaction = Prisma.TransactionClient;

const entityApplyOrder: Record<SyncEntityType, number> = {
  category: 10,
  location: 20,
  channel: 30,
  field: 40,
  item: 50,
  item_field_value: 60,
  photo: 70,
};

function sortChangesForApply(changes: SyncChangeInput[]): SyncChangeInput[] {
  return changes
    .map((change, index) => ({ change, index }))
    .sort((left, right) => {
      const orderDiff =
        entityApplyOrder[left.change.entity_type] - entityApplyOrder[right.change.entity_type];
      return orderDiff === 0 ? left.index - right.index : orderDiff;
    })
    .map(({ change }) => change);
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function dateValue(value: unknown): Date | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  return new Date(value);
}

function jsonRecord(value: unknown): Prisma.InputJsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Prisma.InputJsonObject;
}

function jsonValue(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

function serializePayload(value: unknown): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(value, (_key, current) => {
      if (typeof current === 'bigint') return Number(current);
      return current;
    })
  ) as Record<string, unknown>;
}

async function getCurrent(tx: Transaction, userId: string, entityType: SyncEntityType, entityId: string) {
  switch (entityType) {
    case 'category':
      return tx.category.findFirst({ where: { id: entityId, userId } });
    case 'channel':
      return tx.channel.findFirst({ where: { id: entityId, userId } });
    case 'location':
      return tx.location.findFirst({ where: { id: entityId, userId } });
    case 'field':
      return tx.field.findFirst({ where: { id: entityId, userId } });
    case 'item':
      return tx.item.findFirst({ where: { id: entityId, userId } });
    case 'item_field_value':
      return tx.itemFieldValue.findFirst({ where: { id: entityId, userId } });
    case 'photo':
      return tx.photo.findFirst({ where: { id: entityId, userId } });
  }
}

async function getOwner(tx: Transaction, entityType: SyncEntityType, entityId: string) {
  switch (entityType) {
    case 'category':
      return tx.category.findUnique({ where: { id: entityId }, select: { userId: true } });
    case 'channel':
      return tx.channel.findUnique({ where: { id: entityId }, select: { userId: true } });
    case 'location':
      return tx.location.findUnique({ where: { id: entityId }, select: { userId: true } });
    case 'field':
      return tx.field.findUnique({ where: { id: entityId }, select: { userId: true } });
    case 'item':
      return tx.item.findUnique({ where: { id: entityId }, select: { userId: true } });
    case 'item_field_value':
      return tx.itemFieldValue.findUnique({ where: { id: entityId }, select: { userId: true } });
    case 'photo':
      return tx.photo.findUnique({ where: { id: entityId }, select: { userId: true } });
  }
}

async function applyChange(
  tx: Transaction,
  userId: string,
  change: SyncChangeInput,
  version: bigint
) {
  const deletedAt = change.operation === 'delete' ? new Date() : null;
  const payload = change.payload;

  if (change.operation === 'delete') {
    const data = { deletedAt, version };
    switch (change.entity_type) {
      case 'category':
        await tx.category.updateMany({ where: { id: change.entity_id, userId }, data });
        return;
      case 'channel':
        await tx.channel.updateMany({ where: { id: change.entity_id, userId }, data });
        return;
      case 'location':
        await tx.location.updateMany({ where: { id: change.entity_id, userId }, data });
        return;
      case 'field':
        await tx.field.updateMany({ where: { id: change.entity_id, userId }, data });
        return;
      case 'item':
        await tx.item.updateMany({ where: { id: change.entity_id, userId }, data });
        return;
      case 'item_field_value':
        await tx.itemFieldValue.updateMany({ where: { id: change.entity_id, userId }, data });
        return;
      case 'photo':
        await tx.photo.updateMany({ where: { id: change.entity_id, userId }, data });
        return;
    }
  }

  switch (change.entity_type) {
    case 'category':
      await tx.category.upsert({
        where: { id: change.entity_id },
        update: {
          templateKey: optionalString(payload.template_key),
          name: stringValue(payload.name),
          parentId: optionalString(payload.parent_id),
          icon: optionalString(payload.icon),
          sortOrder: numberValue(payload.sort_order, 99),
          deletedAt: null,
          version,
        },
        create: {
          id: change.entity_id,
          userId,
          templateKey: optionalString(payload.template_key),
          name: stringValue(payload.name),
          parentId: optionalString(payload.parent_id),
          icon: optionalString(payload.icon),
          sortOrder: numberValue(payload.sort_order, 99),
          version,
        },
      });
      return;
    case 'channel':
      await tx.channel.upsert({
        where: { id: change.entity_id },
        update: {
          templateKey: optionalString(payload.template_key),
          name: stringValue(payload.name),
          icon: optionalString(payload.icon),
          sortOrder: numberValue(payload.sort_order, 99),
          usageCount: numberValue(payload.usage_count),
          deletedAt: null,
          version,
        },
        create: {
          id: change.entity_id,
          userId,
          templateKey: optionalString(payload.template_key),
          name: stringValue(payload.name),
          icon: optionalString(payload.icon),
          sortOrder: numberValue(payload.sort_order, 99),
          usageCount: numberValue(payload.usage_count),
          version,
        },
      });
      return;
    case 'location':
      await tx.location.upsert({
        where: { id: change.entity_id },
        update: {
          name: stringValue(payload.name),
          parentId: optionalString(payload.parent_id),
          type: stringValue(payload.type, '房间'),
          deletedAt: null,
          version,
        },
        create: {
          id: change.entity_id,
          userId,
          name: stringValue(payload.name),
          parentId: optionalString(payload.parent_id),
          type: stringValue(payload.type, '房间'),
          version,
        },
      });
      return;
    case 'field':
      await tx.field.upsert({
        where: { id: change.entity_id },
        update: {
          templateKey: optionalString(payload.template_key),
          categoryId: optionalString(payload.category_id),
          key: stringValue(payload.key),
          label: stringValue(payload.label),
          dataType: stringValue(payload.data_type, 'text'),
          optionsJson: jsonValue(payload.options),
          unit: optionalString(payload.unit),
          required: booleanValue(payload.required),
          sortOrder: numberValue(payload.sort_order, 99),
          deletedAt: null,
          version,
        },
        create: {
          id: change.entity_id,
          userId,
          templateKey: optionalString(payload.template_key),
          categoryId: optionalString(payload.category_id),
          key: stringValue(payload.key),
          label: stringValue(payload.label),
          dataType: stringValue(payload.data_type, 'text'),
          optionsJson: jsonValue(payload.options),
          unit: optionalString(payload.unit),
          required: booleanValue(payload.required),
          sortOrder: numberValue(payload.sort_order, 99),
          version,
        },
      });
      return;
    case 'item':
      await tx.item.upsert({
        where: { id: change.entity_id },
        update: {
          name: stringValue(payload.name),
          categoryId: stringValue(payload.category_id),
          quantity: numberValue(payload.quantity, 1),
          status: stringValue(payload.status, '在用'),
          locationId: optionalString(payload.location_id),
          channelId: optionalString(payload.channel_id),
          acquiredDate: dateValue(payload.acquired_date),
          price: payload.price == null ? null : String(payload.price),
          currency: stringValue(payload.currency, 'CNY'),
          rating: payload.rating == null ? null : numberValue(payload.rating),
          importance: optionalString(payload.importance),
          warrantyUntil: dateValue(payload.warranty_until),
          needsRestock: booleanValue(payload.needs_restock),
          restockIntervalDays: payload.restock_interval_days == null ? null : numberValue(payload.restock_interval_days),
          restockThreshold: payload.restock_threshold == null ? null : numberValue(payload.restock_threshold),
          notes: optionalString(payload.notes),
          deletedAt: null,
          version,
        },
        create: {
          id: change.entity_id,
          userId,
          name: stringValue(payload.name),
          categoryId: stringValue(payload.category_id),
          quantity: numberValue(payload.quantity, 1),
          status: stringValue(payload.status, '在用'),
          locationId: optionalString(payload.location_id),
          channelId: optionalString(payload.channel_id),
          acquiredDate: dateValue(payload.acquired_date),
          price: payload.price == null ? null : String(payload.price),
          currency: stringValue(payload.currency, 'CNY'),
          rating: payload.rating == null ? null : numberValue(payload.rating),
          importance: optionalString(payload.importance),
          warrantyUntil: dateValue(payload.warranty_until),
          needsRestock: booleanValue(payload.needs_restock),
          restockIntervalDays: payload.restock_interval_days == null ? null : numberValue(payload.restock_interval_days),
          restockThreshold: payload.restock_threshold == null ? null : numberValue(payload.restock_threshold),
          notes: optionalString(payload.notes),
          version,
        },
      });
      return;
    case 'item_field_value':
      await tx.itemFieldValue.upsert({
        where: { id: change.entity_id },
        update: {
          itemId: stringValue(payload.item_id),
          fieldId: stringValue(payload.field_id),
          valueJson: jsonValue(payload.value),
          deletedAt: null,
          version,
        },
        create: {
          id: change.entity_id,
          userId,
          itemId: stringValue(payload.item_id),
          fieldId: stringValue(payload.field_id),
          valueJson: jsonValue(payload.value),
          version,
        },
      });
      return;
    case 'photo':
      await tx.photo.upsert({
        where: { id: change.entity_id },
        update: {
          itemId: stringValue(payload.item_id),
          objectKey: stringValue(payload.object_key),
          mimeType: stringValue(payload.mime_type, 'application/octet-stream'),
          size: numberValue(payload.size),
          width: payload.width == null ? null : numberValue(payload.width),
          height: payload.height == null ? null : numberValue(payload.height),
          isPrimary: booleanValue(payload.is_primary),
          deletedAt: null,
          version,
        },
        create: {
          id: change.entity_id,
          userId,
          itemId: stringValue(payload.item_id),
          objectKey: stringValue(payload.object_key),
          mimeType: stringValue(payload.mime_type, 'application/octet-stream'),
          size: numberValue(payload.size),
          width: payload.width == null ? null : numberValue(payload.width),
          height: payload.height == null ? null : numberValue(payload.height),
          isPrimary: booleanValue(payload.is_primary),
          version,
        },
      });
      return;
  }
}

export const syncRoutes: FastifyPluginAsync = async app => {
  app.post('/sync/push', { preHandler: app.authenticate }, async (request, reply) => {
    const userId = request.userId;
    if (!userId) return reply.code(401).send({ error: 'unauthorized' });

    const body = syncPushSchema.parse(request.body);
    const accepted: SyncPushResponse['accepted'] = [];
    const conflicts: SyncPushResponse['conflicts'] = [];

    await prisma.$transaction(async (tx: Transaction) => {
      for (const change of sortChangesForApply(body.changes)) {
        const current = await getCurrent(tx, userId, change.entity_type, change.entity_id);
        const owner: { userId: string } | null = current
          ? { userId: current.userId }
          : await getOwner(tx, change.entity_type, change.entity_id);
        if (owner && owner.userId !== userId) {
          conflicts.push({
            entity_type: change.entity_type,
            entity_id: change.entity_id,
            server_version: 0,
            server_payload: {},
          });
          continue;
        }

        if (
          current &&
          change.base_version !== undefined &&
          Number(current.version) > change.base_version
        ) {
          conflicts.push({
            entity_type: change.entity_type,
            entity_id: change.entity_id,
            server_version: Number(current.version),
            server_payload: serializePayload(current),
          });
          continue;
        }

        const version = BigInt(Date.now());
        await applyChange(tx, userId, change, version);
        await tx.syncChange.create({
          data: {
            userId,
            entityType: change.entity_type,
            entityId: change.entity_id,
            operation: change.operation,
            version,
            payloadJson: jsonRecord({ ...change.payload, version: Number(version) }),
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
      conflicts,
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
      changes: rows.map((row: Awaited<typeof rows>[number]) => ({
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
