import { Prisma } from '@prisma/client';
import { DEFAULT_CATEGORIES, DEFAULT_CHANNELS, DEFAULT_FIELDS } from '@metidy/shared';
import { prisma } from './prisma.js';

type Client = typeof prisma | Prisma.TransactionClient;

function jsonValue(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

function fieldOptions(field: (typeof DEFAULT_FIELDS)[number]) {
  return 'options' in field ? field.options : undefined;
}

function fieldUnit(field: (typeof DEFAULT_FIELDS)[number]) {
  return 'unit' in field ? field.unit : null;
}

export async function ensureDefaultDataForUser(client: Client, userId: string): Promise<void> {
  for (const category of DEFAULT_CATEGORIES) {
    await client.category.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
        icon: category.icon,
        sortOrder: category.sort_order,
        deletedAt: null,
      },
      create: {
        id: category.id,
        userId,
        name: category.name,
        icon: category.icon,
        sortOrder: category.sort_order,
      },
    });
  }

  for (const channel of DEFAULT_CHANNELS) {
    await client.channel.upsert({
      where: { id: channel.id },
      update: {
        name: channel.name,
        sortOrder: channel.sort_order,
        usageCount: channel.usage_count,
        deletedAt: null,
      },
      create: {
        id: channel.id,
        userId,
        name: channel.name,
        sortOrder: channel.sort_order,
        usageCount: channel.usage_count,
      },
    });
  }

  for (const field of DEFAULT_FIELDS) {
    await client.field.upsert({
      where: { id: field.id },
      update: {
        categoryId: field.category_id,
        key: field.key,
        label: field.label,
        dataType: field.data_type,
        optionsJson: jsonValue(fieldOptions(field)),
        unit: fieldUnit(field),
        required: field.required,
        sortOrder: field.sort_order,
        deletedAt: null,
      },
      create: {
        id: field.id,
        userId,
        categoryId: field.category_id,
        key: field.key,
        label: field.label,
        dataType: field.data_type,
        optionsJson: jsonValue(fieldOptions(field)),
        unit: fieldUnit(field),
        required: field.required,
        sortOrder: field.sort_order,
      },
    });
  }
}
