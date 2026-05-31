import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CategoryManager } from '../components/settings/CategoryManager';
import { ChannelManager } from '../components/settings/ChannelManager';
import { FieldManager } from '../components/settings/FieldManager';

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">设置</h1>
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">分类</TabsTrigger>
          <TabsTrigger value="fields">字段配置</TabsTrigger>
          <TabsTrigger value="channels">渠道</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="py-4"><CategoryManager /></TabsContent>
        <TabsContent value="fields" className="py-4"><FieldManager /></TabsContent>
        <TabsContent value="channels" className="py-4"><ChannelManager /></TabsContent>
      </Tabs>
    </div>
  );
}