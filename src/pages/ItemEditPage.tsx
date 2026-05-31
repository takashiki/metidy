import { useParams } from 'react-router-dom';
import { useItemDetail } from '../hooks/useItems';
import { ItemForm } from '../components/items/ItemForm';

export function ItemEditPage() {
  const { id } = useParams<{ id: string }>();
  const item = useItemDetail(id);

  if (!item) return <p className="text-muted-foreground py-8 text-center">加载中...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">编辑物品</h1>
      <ItemForm editItem={item} />
    </div>
  );
}