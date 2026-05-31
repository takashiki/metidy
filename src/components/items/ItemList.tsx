import { ItemCard } from './ItemCard';
import type { ItemListItem } from '../../types';

interface ItemListProps {
  items: ItemListItem[] | undefined;
}

export function ItemList({ items }: ItemListProps) {
  if (!items) {
    return <div className="text-muted-foreground text-sm py-8 text-center">加载中...</div>;
  }
  if (items.length === 0) {
    return <div className="text-muted-foreground text-sm py-12 text-center">没有物品，点击右下角 + 添加第一个</div>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map(item => <ItemCard key={item.id} item={item} />)}
    </div>
  );
}