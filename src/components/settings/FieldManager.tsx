import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useCategories } from '../../hooks/useCategories';
import { useFieldsForCategory } from '../../hooks/useFields';
import { createField, deleteField } from '../../services/fieldService';
import type { DataType } from '../../types';

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: 'text', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'date', label: '日期' },
  { value: 'enum', label: '枚举(下拉)' },
  { value: 'boolean', label: '布尔(开关)' },
];

export function FieldManager() {
  const categories = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<DataType>('text');
  const [newOptions, setNewOptions] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const fields = useFieldsForCategory(selectedCategoryId || undefined);

  const handleAdd = async () => {
    if (!newKey.trim() || !newLabel.trim() || !selectedCategoryId) return;
    await createField({
      category_id: selectedCategoryId,
      key: newKey.trim(),
      label: newLabel.trim(),
      data_type: newType,
      options: newType === 'enum' ? newOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      unit: newUnit.trim() || undefined,
      sort_order: (fields?.length ?? 0) + 1,
    });
    setAdding(false);
    setNewKey(''); setNewLabel(''); setNewType('text'); setNewOptions(''); setNewUnit('');
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`确定删除字段"${label}"？这将同时删除所有物品的该字段值。`)) return;
    await deleteField(id);
  };

  return (
    <div className="space-y-4">
      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
        <SelectTrigger><SelectValue placeholder="选择分类查看/添加字段" /></SelectTrigger>
        <SelectContent>
          {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {selectedCategoryId && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">当前分类字段 ({fields?.length ?? 0})</h3>
            <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
              <Plus className="h-3.5 w-3.5 mr-1" />添加字段
            </Button>
          </div>

          {adding && (
            <div className="border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="字段Key (英文)" className="h-8 text-sm" />
                <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="显示名称" className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={newType} onValueChange={(v) => setNewType(v as DataType)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{DATA_TYPES.map(dt => <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>)}</SelectContent>
                </Select>
                {newType === 'enum' && (
                  <Input value={newOptions} onChange={e => setNewOptions(e.target.value)} placeholder="选项,逗号分隔" className="h-8 text-sm" />
                )}
                {newType === 'number' && (
                  <Input value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="单位 (W/天/月)" className="h-8 text-sm" />
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd}>确定</Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>取消</Button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {fields?.map(field => (
              <div key={field.id} className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted group">
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{field.data_type}</span>
                <span className="flex-1 text-sm">{field.label}</span>
                <span className="text-xs text-muted-foreground">{field.key}</span>
                {field.required && <span className="text-xs text-destructive">必填</span>}
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hidden group-hover:flex text-destructive"
                  onClick={() => handleDelete(field.id, field.label)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}