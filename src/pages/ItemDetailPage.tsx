import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useItemDetail } from '../hooks/useItems';
import { deleteItem } from '../services/itemService';
import { useState } from 'react';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = useItemDetail(id);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!id || !confirm('确定删除？')) return;
    setDeleting(true);
    await deleteItem(id);
    navigate('/items');
  }

  if (!item) return <p className="text-muted-foreground py-8 text-center">加载中...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />返回
        </Button>
        <div className="flex gap-2">
          <Link to={`/items/${item.id}/edit`}>
            <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1" />编辑</Button>
          </Link>
          <Button variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" />{deleting ? '删除中...' : '删除'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {item.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label="分类" value={item.category_name} />
          <DetailRow label="数量" value={String(item.quantity)} />
          <DetailRow label="状态" value={item.status} />
          <DetailRow label="位置" value={item.location_name} />
          <DetailRow label="购入渠道" value={item.channel_name} />
          <DetailRow label="购入日期" value={item.acquired_date} />
          <DetailRow label="价格" value={item.price != null ? `${item.currency ?? 'CNY'} ${item.price}` : undefined} />
          <DetailRow label="评分" value={item.rating ? '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating) : undefined} />
          <DetailRow label="重要性" value={item.importance} />
          <DetailRow label="保修到期" value={item.warranty_until} />
          <DetailRow label="备注" value={item.notes} />
          {item.custom_fields && Object.keys(item.custom_fields).length > 0 && (
            <>
              <div className="border-t pt-3 mt-3" />
              <h3 className="text-sm font-medium text-muted-foreground">分类特有字段</h3>
              {Object.entries(item.custom_fields).map(([key, value]) => (
                <DetailRow key={key} label={key} value={value !== undefined ? String(value) : undefined} />
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (value === undefined || value === '') return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
