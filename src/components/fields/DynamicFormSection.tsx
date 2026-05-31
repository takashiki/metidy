import { useFieldsForCategory } from '../../hooks/useFields';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import type { FieldDefinition } from '../../types';

interface DynamicFormSectionProps {
  categoryId?: string;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

export function DynamicFormSection({ categoryId, values, onChange }: DynamicFormSectionProps) {
  const fields = useFieldsForCategory(categoryId);

  if (!categoryId || !fields || fields.length === 0) {
    return null;
  }

  const setValue = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  const renderField = (field: FieldDefinition) => {
    const currentValue = values[field.key];

    switch (field.data_type) {
      case 'text':
        return (
          <Input
            value={currentValue ?? ''}
            onChange={(e) => setValue(field.key, e.target.value)}
            placeholder={field.label}
          />
        );

      case 'number':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={currentValue ?? ''}
              onChange={(e) => setValue(field.key, e.target.value ? Number(e.target.value) : undefined)}
              placeholder={field.label}
              className="flex-1"
            />
            {field.unit && <span className="text-sm text-muted-foreground whitespace-nowrap">{field.unit}</span>}
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={currentValue ?? ''}
            onChange={(e) => setValue(field.key, e.target.value || undefined)}
          />
        );

      case 'enum':
        return (
          <Select
            value={currentValue ?? ''}
            onValueChange={(v) => setValue(field.key, v || undefined)}
          >
            <SelectTrigger><SelectValue placeholder={`选择${field.label}`} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="empty">— 不填 —</SelectItem>
              {field.options?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <Switch
              checked={currentValue === true}
              onCheckedChange={(checked) => setValue(field.key, checked || undefined)}
            />
            <span className="text-sm">{field.label}</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <fieldset className="border rounded-lg p-4 space-y-4">
      <legend className="text-sm font-medium text-muted-foreground px-1">分类特有字段</legend>
      {fields.map(field => (
        <div key={field.id} className="space-y-1.5">
          <Label>
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}
    </fieldset>
  );
}