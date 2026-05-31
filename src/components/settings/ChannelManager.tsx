import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useChannels } from '../../hooks/useChannels';
import { createChannel, updateChannel, deleteChannel } from '../../services/channelService';

export function ChannelManager() {
  const channels = useChannels();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createChannel({ name: newName.trim() });
    setNewName('');
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await updateChannel(id, { name: editName.trim() });
    setEditingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定删除渠道"${name}"？`)) return;
    await deleteChannel(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="新渠道名称" className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <Button onClick={handleAdd} size="sm"><Plus className="h-4 w-4 mr-1" />添加</Button>
      </div>
      <div className="space-y-1">
        {channels?.map(ch => (
          <div key={ch.id} className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted group">
            {editingId === ch.id ? (
              <>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-sm flex-1" autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleUpdate(ch.id)} />
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleUpdate(ch.id)}>保存</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>取消</Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{ch.name}</span>
                <span className="text-xs text-muted-foreground mr-2">使用 {ch.usage_count} 次</span>
                <div className="hidden group-hover:flex gap-0.5">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                    onClick={() => { setEditingId(ch.id); setEditName(ch.name); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                    onClick={() => handleDelete(ch.id, ch.name)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}