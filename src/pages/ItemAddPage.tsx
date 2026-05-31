import { ItemForm } from '../components/items/ItemForm';

export function ItemAddPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">新增物品</h1>
      <ItemForm />
    </div>
  );
}