import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import type { ItemStatus, Category } from '../../types';

const STATUS_OPTIONS: ItemStatus[] = ['在用', '闲置', '已出', '已弃', '借出'];

interface ItemFilterBarProps {
  categories: Category[] | undefined;
  onFilterChange: (filters: { search?: string; category_id?: string; status?: ItemStatus }) => void;
}

export function ItemFilterBar({ categories, onFilterChange }: ItemFilterBarProps) {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  const apply = (s: string, c: string, st: string) => {
    onFilterChange({
      search: s || undefined,
      category_id: c && c !== 'all' ? c : undefined,
      status: st && st !== 'all' ? (st as ItemStatus) : undefined,
    });
  };

  const handleSearch = (v: string) => { setSearch(v); apply(v, categoryId, status); };
  const handleCategory = (v: string | null) => { setCategoryId(v ?? 'all'); apply(search, v ?? 'all', status); };
  const handleStatus = (v: string | null) => { setStatus(v ?? 'all'); apply(search, categoryId, v ?? 'all'); };

  const clear = () => {
    setSearch(''); setCategoryId('all'); setStatus('all');
    onFilterChange({});
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索物品..."
          className="pl-8"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <Select value={categoryId} onValueChange={handleCategory}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="全部分类" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部分类</SelectItem>
          {categories?.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={handleStatus}>
        <SelectTrigger className="w-[110px]">
          <SelectValue placeholder="全部状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          {STATUS_OPTIONS.map(s => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(search || categoryId !== 'all' || status !== 'all') && (
        <Button variant="ghost" size="icon" onClick={clear}><X className="h-4 w-4" /></Button>
      )}
    </div>
  );
}