import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
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

function getRestockLabel(item: ItemListItem): string {
  if (item.restock_days_remaining === undefined) return '补货';
  if (item.restock_days_remaining < 0) return `逾期 ${Math.abs(item.restock_days_remaining)} 天`;
  if (item.restock_days_remaining === 0) return '今天补货';
  return `${item.restock_days_remaining} 天后`;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link to={`/items/${item.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {item.display_label}
                {item.needs_restock && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    item.restock_days_remaining !== undefined && item.restock_days_remaining <= 0
                      ? 'bg-red-100 text-red-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    <RefreshCw className="h-3 w-3" />{getRestockLabel(item)}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {item.category_name} · {item.location_name ?? '未放置'}
                {item.needs_restock && item.next_restock_date ? ` · 下次 ${item.next_restock_date}` : ''}
                {item.needs_restock && item.restock_threshold !== undefined ? ` · 库存提醒 ≤ ${item.restock_threshold}` : ''}
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
