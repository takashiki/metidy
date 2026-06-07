import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { DynamicFormSection } from '../fields/DynamicFormSection';
import { useCategories } from '../../hooks/useCategories';
import { useChannels } from '../../hooks/useChannels';
import { useLocationTree } from '../../hooks/useLocations';
import { createItem, updateItem } from '../../services/itemService';
import { incrementChannelUsage } from '../../services/channelService';
import type { ItemFormData, ItemDetail, ItemStatus, Importance } from '../../types';

const STATUS_OPTIONS: ItemStatus[] = ['在用', '闲置', '已出', '已弃', '借出'];
const IMPORTANCE_OPTIONS: Importance[] = ['低', '中', '高', '关键'];

interface ItemFormProps {
  editItem?: ItemDetail;
}

export function ItemForm({ editItem }: ItemFormProps) {
  const navigate = useNavigate();
  const categories = useCategories();
  const channels = useChannels();
  const locationTree = useLocationTree();

  const [name, setName] = useState(editItem?.name ?? '');
  const [categoryId, setCategoryId] = useState(editItem?.category_id ?? '');
  const [quantity, setQuantity] = useState(editItem?.quantity ?? 1);
  const [status, setStatus] = useState<ItemStatus>(editItem?.status ?? '在用');
  const [locationId, setLocationId] = useState(editItem?.location_id ?? '');
  const [channelId, setChannelId] = useState(editItem?.channel_id ?? '');
  const [acquiredDate, setAcquiredDate] = useState(editItem?.acquired_date ?? '');
  const [price, setPrice] = useState(editItem?.price?.toString() ?? '');
  const [rating, setRating] = useState(editItem?.rating?.toString() ?? '');
  const [importance, setImportance] = useState(editItem?.importance ?? '');
  const [warrantyUntil, setWarrantyUntil] = useState(editItem?.warranty_until ?? '');
  const [notes, setNotes] = useState(editItem?.notes ?? '');
  const [customFields, setCustomFields] = useState<Record<string, any>>(editItem?.custom_fields ?? {});
  const [saving, setSaving] = useState(false);

  const flatLocations = locationTree ? flattenLocations(locationTree) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;

    setSaving(true);
    const data: ItemFormData = {
      name: name.trim(),
      category_id: categoryId,
      quantity,
      status,
      location_id: locationId || undefined,
      channel_id: channelId || undefined,
      acquired_date: acquiredDate || undefined,
      price: price ? Number(price) : undefined,
      rating: rating ? Number(rating) : undefined,
      importance: (importance || undefined) as Importance | undefined,
      warranty_until: warrantyUntil || undefined,
      notes: notes.trim() || undefined,
      custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
    };

    try {
      if (editItem) {
        await updateItem(editItem.id, { ...data, category_id: editItem.category_id });
      } else {
        await createItem(data);
      }
      if (channelId && !editItem) {
        await incrementChannelUsage(channelId);
      }
      navigate(editItem ? `/items/${editItem.id}` : '/items');
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic fields */}
      <fieldset className="border rounded-lg p-4 space-y-4">
        <legend className="text-sm font-medium text-muted-foreground px-1">基本信息</legend>
        <div>
          <Label>名称 *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="手机" required />
        </div>
        <div>
          <Label>分类 *</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? '')} required>
            <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
            <SelectContent>
              {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>数量</Label>
            <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} />
          </div>
          <div>
            <Label>状态</Label>
            <Select value={status} onValueChange={(v) => setStatus((v as ItemStatus) ?? '在用')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      {/* Dynamic custom fields */}
      <DynamicFormSection categoryId={categoryId} values={customFields} onChange={setCustomFields} />

      {/* Detail fields */}
      <fieldset className="border rounded-lg p-4 space-y-4">
        <legend className="text-sm font-medium text-muted-foreground px-1">详细信息（可选）</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>位置</Label>
            <Select value={locationId} onValueChange={(v) => setLocationId(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="选择位置" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">— 不填 —</SelectItem>
                {flatLocations.map((loc: any) => (
                  <SelectItem key={loc.id} value={loc.id}>{'　'.repeat(loc.depth)}{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>购入渠道</Label>
            <Select value={channelId} onValueChange={(v) => setChannelId(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="选择渠道" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">— 不填 —</SelectItem>
                {channels?.map(ch => (
                  <SelectItem key={ch.id} value={ch.id}>{ch.name}{ch.usage_count > 0 ? ` (${ch.usage_count})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>购入日期</Label>
            <Input type="date" value={acquiredDate} onChange={e => setAcquiredDate(e.target.value)} />
          </div>
          <div>
            <Label>价格</Label>
            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} step="0.01" placeholder="0.00" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>评分</Label>
            <Select value={rating} onValueChange={(v) => setRating(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">— 不填 —</SelectItem>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{'★'.repeat(n)}{'☆'.repeat(5-n)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>重要性</Label>
            <Select value={importance} onValueChange={(v) => setImportance(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">— 不填 —</SelectItem>
                {IMPORTANCE_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>保修到期</Label>
          <Input type="date" value={warrantyUntil} onChange={e => setWarrantyUntil(e.target.value)} />
        </div>
        <div>
          <Label>备注</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="自由备注..." />
        </div>
      </fieldset>

      <div className="flex gap-3 justify-end sticky bottom-16 md:bottom-0 bg-background py-4 border-t md:border-t-0">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>取消</Button>
        <Button type="submit" disabled={saving || !name.trim() || !categoryId}>
          <Save className="h-4 w-4 mr-1" />{saving ? '保存中...' : '保存'}
        </Button>
      </div>
    </form>
  );
}

function flattenLocations(nodes: any[], depth = 0): any[] {
  const result: any[] = [];
  for (const node of nodes) {
    result.push({ id: node.id, name: node.name, depth });
    result.push(...flattenLocations(node.children, depth + 1));
  }
  return result;
}
