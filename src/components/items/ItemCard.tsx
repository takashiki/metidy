import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { ItemListItem } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  '在用': 'bg-green-100 text-green-800',
  '闲置': 'bg-yellow-100 text-yellow-800',
  '已出': 'bg-gray-100 text-gray-800',
  '已弃': 'bg-red-100 text-red-800',
  '借出': 'bg-blue-100 text-blue-800',
};

interface ItemCardProps {
  item: ItemListItem;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link to={`/items/${item.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">{item.display_label}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {item.category_name} · {item.location_name ?? '未放置'}
              </CardDescription>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status] ?? ''}`}>
              {item.status}
            </span>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}