import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ItemFilterBar } from '../components/items/ItemFilterBar';
import { ItemList } from '../components/items/ItemList';
import { useItemList } from '../hooks/useItems';
import { useCategories } from '../hooks/useCategories';
import type { ItemFilter } from '../types';

export function ItemsPage() {
  const categories = useCategories();
  const [filters, setFilters] = useState<ItemFilter>({});
  const items = useItemList(filters);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">物品</h1>
        <Link to="/items/add">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />新增</Button>
        </Link>
      </div>
      <ItemFilterBar categories={categories} onFilterChange={(f) => setFilters(f)} />
      <ItemList items={items} />
    </div>
  );
}