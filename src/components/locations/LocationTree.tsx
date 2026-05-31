import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, FolderOpen, DoorOpen, Box } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useLocationTree } from '../../hooks/useLocations';
import { createLocation, updateLocation, deleteLocation } from '../../services/locationService';
import type { LocationTreeNode, LocationType } from '../../types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  '房间': <DoorOpen className="h-4 w-4" />,
  '家具': <FolderOpen className="h-4 w-4" />,
  '容器': <Box className="h-4 w-4" />,
};

const LOCATION_TYPES: LocationType[] = ['房间', '家具', '容器'];

export function LocationTree() {
  const tree = useLocationTree();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<LocationType>('房间');
  const [addingUnderId, setAddingUnderId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<LocationType>('容器');
  const [rootNewName, setRootNewName] = useState('');
  const [rootNewType, setRootNewType] = useState<LocationType>('房间');

  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const handleAdd = async (parentId?: string) => {
    const name = parentId ? newName.trim() : rootNewName.trim();
    if (!name) return;
    await createLocation({ name, parent_id: parentId, type: parentId ? newType : rootNewType });
    if (parentId) { setNewName(''); setNewType('容器'); setAddingUnderId(null); }
    else { setRootNewName(''); setRootNewType('房间'); }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await updateLocation(id, { name: editName.trim(), type: editType });
    setEditingId(null);
  };

  const handleDelete = async (id: string, nodeLabel: string) => {
    if (!confirm(`确定删除 "${nodeLabel}" 及其所有子位置？关联物品的 location 将置空。`)) return;
    await deleteLocation(id);
  };

  const renderNode = (node: LocationTreeNode) => {
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="ml-4">
        <div className="flex items-center gap-1 py-1 group">
          {hasChildren ? (
            <button onClick={() => toggle(node.id)} className="p-0.5 hover:bg-muted rounded">
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : <span className="w-5" />}
          <span className="mr-1">{TYPE_ICONS[node.type]}</span>
          {editingId === node.id ? (
            <div className="flex items-center gap-1 flex-1">
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-sm flex-1" autoFocus
                onKeyDown={e => e.key === 'Enter' && handleUpdate(node.id)} />
              <Select value={editType} onValueChange={(v) => setEditType(v as LocationType)}>
                <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{LOCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleUpdate(node.id)}>保存</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>取消</Button>
            </div>
          ) : (
            <>
              <span className="text-sm hover:text-primary flex-1">{node.name}</span>
              <span className="text-xs text-muted-foreground">({node.item_count})</span>
              <div className="hidden group-hover:flex items-center gap-0.5">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                  onClick={() => { setEditingId(node.id); setEditName(node.name); setEditType(node.type); }}>
                  <Pencil className="h-3 w-3" /></Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                  onClick={() => { setAddingUnderId(node.id); setNewName(''); setNewType('容器'); }}>
                  <Plus className="h-3 w-3" /></Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                  onClick={() => handleDelete(node.id, node.name)}>
                  <Trash2 className="h-3 w-3" /></Button>
              </div>
            </>
          )}
        </div>
        {addingUnderId === node.id && (
          <div className="ml-8 flex items-center gap-1 py-1">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="新位置名" className="h-7 text-sm flex-1" autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAdd(node.id)} />
            <Select value={newType} onValueChange={(v) => setNewType(v as LocationType)}>
              <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{LOCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleAdd(node.id)}>确定</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingUnderId(null)}>取消</Button>
          </div>
        )}
        {isExpanded && hasChildren && node.children.map(renderNode)}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 mb-2">
        <Input value={rootNewName} onChange={e => setRootNewName(e.target.value)} placeholder="添加新位置" className="h-8 text-sm flex-1"
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <Select value={rootNewType} onValueChange={(v) => setRootNewType(v as LocationType)}>
          <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{LOCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-8" onClick={() => handleAdd()}><Plus className="h-3.5 w-3.5 mr-1" />添加</Button>
      </div>
      {tree?.map(renderNode)}
    </div>
  );
}