import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useCategories } from '../../hooks/useCategories';
import { createCategory, updateCategory, deleteCategory } from '../../services/categoryService';

export function CategoryManager() {
  const categories = useCategories();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createCategory({ name: newName.trim(), sort_order: (categories?.length ?? 0) + 1 });
    setNewName('');
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await updateCategory(id, { name: editName.trim() });
    setEditingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定删除分类"${name}"？将同时删除该分类下的物品和字段。`)) return;
    await deleteCategory(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="新分类名称" className="flex-1"
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <Button onClick={handleAdd} size="sm"><Plus className="h-4 w-4 mr-1" />添加</Button>
      </div>
      <div className="space-y-1">
        {categories?.map(cat => (
          <div key={cat.id} className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted group">
            <span>{cat.icon}</span>
            {editingId === cat.id ? (
              <>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-sm flex-1" autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)} />
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleUpdate(cat.id)}>保存</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>取消</Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{cat.name}</span>
                <div className="hidden group-hover:flex gap-0.5">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                    onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                    onClick={() => handleDelete(cat.id, cat.name)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}