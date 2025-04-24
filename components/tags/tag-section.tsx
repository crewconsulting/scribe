import { Tag } from '@/types/tags';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TagSectionProps {
  title: string;
  tags: Tag[];
  showAddButton?: boolean;
  newTagName?: string;
  onNewTagNameChange?: (value: string) => void;
  onAddTag?: () => void;
  onOpenRuleDialog: (tag: Tag) => void;
}

export function TagSection({
  title,
  tags,
  showAddButton = false,
  newTagName = '',
  onNewTagNameChange,
  onAddTag,
  onOpenRuleDialog,
}: TagSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tags.map((tag) => (
          <Button
            key={tag.id}
            variant="outline"
            className="h-auto py-2 px-4 justify-start space-x-2"
            onClick={() => onOpenRuleDialog(tag)}
          >
            <Badge
              style={{ backgroundColor: tag.color }}
              className="h-2 w-2 rounded-full p-0"
            />
            <span className="truncate">{tag.name}</span>
            <Badge variant="secondary" className="ml-auto">
              {(tag.rules || []).length}
            </Badge>
          </Button>
        ))}

        {showAddButton && (
          <div className="flex gap-2">
            <Input
              placeholder="新しいタグ名"
              value={newTagName}
              onChange={(e) => onNewTagNameChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onAddTag) {
                  onAddTag();
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={onAddTag}
              disabled={!newTagName}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}