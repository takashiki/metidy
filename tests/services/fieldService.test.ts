import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/database';
import { seedDatabase } from '../../src/db/seed';
import { getFieldsByCategory, getGlobalFields, createField, updateField, deleteField } from '../../src/services/fieldService';
import type { Category, Field } from '../../src/types';

describe('fieldService', () => {
  let applianceCategory: Category;
  let plugTypeField: Field;

  beforeEach(async () => {
    await db.categories.clear();
    await db.channels.clear();
    await db.fields.clear();
    await db.items.clear();
    await db.item_field_values.clear();
    await seedDatabase();
    applianceCategory = (await db.categories.where('template_key').equals('appliance').first())!;
    plugTypeField = (await db.fields.where('template_key').equals('appliance.plug_type').first())!;
  });

  it('getFieldsByCategory() returns fields for a specific category', async () => {
    const fields = await getFieldsByCategory(applianceCategory.id);
    expect(fields.length).toBe(5);
    expect(fields[0].key).toBe('plug_type');
  });

  it('getFieldsByCategory() returns empty array for unknown category', async () => {
    const fields = await getFieldsByCategory('unknown');
    expect(fields.length).toBe(0);
  });

  it('getGlobalFields() returns fields with null category_id', async () => {
    await createField({ key: 'notes_extra', label: '额外备注', data_type: 'text', required: false, sort_order: 1 });
    const fields = await getGlobalFields();
    expect(fields.length).toBe(1);
    expect(fields[0].key).toBe('notes_extra');
  });

  it('createField() adds field to category', async () => {
    const created = await createField({ category_id: applianceCategory.id, key: 'energy_grade', label: '能效等级', data_type: 'enum', options: ['一级', '二级', '三级'], required: false, sort_order: 6 });
    expect(created.key).toBe('energy_grade');
    const fields = await getFieldsByCategory(applianceCategory.id);
    expect(fields.length).toBe(6);
  });

  it('deleteField() removes field', async () => {
    await deleteField(plugTypeField.id);
    const fields = await getFieldsByCategory(applianceCategory.id);
    expect(fields.length).toBe(4);
  });

  it('updateField() modifies existing field', async () => {
    await updateField(plugTypeField.id, { key: 'power_plug', label: '电源插头类型', required: true });
    const field = await db.fields.get(plugTypeField.id);
    expect(field?.key).toBe('power_plug');
    expect(field?.label).toBe('电源插头类型');
    expect(field?.required).toBe(true);
  });
});
