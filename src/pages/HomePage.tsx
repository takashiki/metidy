import { Link } from 'react-router-dom';
import { Package, MapPin, Settings, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useItemList } from '../hooks/useItems';
import { useCategories } from '../hooks/useCategories';
import { useLocationTree } from '../hooks/useLocations';

export function HomePage() {
  const items = useItemList({});
  const categories = useCategories();
  const locationTree = useLocationTree();

  const statusCounts: Record<string, number> = {};
  items?.forEach(i => { statusCounts[i.status] = (statusCounts[i.status] ?? 0) + 1; });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Metidy</h1>
      <p className="text-muted-foreground text-sm">物品管理系统</p>

      <div className="flex gap-2">
        <Link to="/items/add"><Button><Plus className="h-4 w-4 mr-1" />新增物品</Button></Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="总物品" value={items?.length ?? 0} />
        <StatCard label="在用" value={statusCounts['在用'] ?? 0} />
        <StatCard label="闲置" value={statusCounts['闲置'] ?? 0} />
        <StatCard label="已出/已弃" value={(statusCounts['已出'] ?? 0) + (statusCounts['已弃'] ?? 0)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link to="/items" className="block">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />物品列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{categories?.length ?? 0} 个分类 · {items?.length ?? 0} 件物品</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/locations" className="block">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />位置管理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{locationTree?.length ?? 0} 个顶层位置</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/settings" className="block">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">分类 · 字段 · 渠道</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {items && items.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">最近添加</h2>
          <div className="space-y-1">
            {items.slice(0, 5).map(item => (
              <Link key={item.id} to={`/items/${item.id}`} className="block">
                <div className="flex justify-between items-center py-2 px-3 rounded-md hover:bg-muted transition-colors text-sm">
                  <span className="font-medium">{item.display_label}</span>
                  <span className="text-muted-foreground">{item.category_name} · {item.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6 pb-4 text-center">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}