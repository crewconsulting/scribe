import { Tag, MatchRule, MATCH_TYPES, TAG_CATEGORIES } from '@/types/tags';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Trash2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ColorPicker } from './color-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RuleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTag: Tag | null;
  newRule: {
    pattern: string;
    type: keyof typeof MATCH_TYPES;
  };
  onNewRuleChange: (rule: { pattern: string; type: keyof typeof MATCH_TYPES }) => void;
  onAddRule: () => void;
  onToggleRule: (tagId: string, ruleId: string) => void;
  onDeleteRule: (tagId: string, ruleId: string) => void;
  onUpdateTag: (tagId: string, updates: Partial<Tag>) => void;
  onDeleteTag?: (tagId: string) => void;
}

export function RuleDialog({
  isOpen,
  onOpenChange,
  selectedTag,
  newRule,
  onNewRuleChange,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  onUpdateTag,
  onDeleteTag,
}: RuleDialogProps) {
  const [editingName, setEditingName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (selectedTag) {
      setEditingName(selectedTag.name);
    }
  }, [selectedTag]);

  const handleToggle = (tagId: string, ruleId: string) => {
    onToggleRule(tagId, ruleId);
  };

  const handleNameChange = () => {
    if (selectedTag && !selectedTag.is_master && editingName.trim()) {
      onUpdateTag(selectedTag.id, { name: editingName.trim() });
    }
  };

  const handleColorChange = (color: string) => {
    if (selectedTag) {
      onUpdateTag(selectedTag.id, { color });
    }
  };

  const handleCategoryChange = (category: string) => {
    if (selectedTag) {
      onUpdateTag(selectedTag.id, { category });
    }
  };

  const handleDelete = () => {
    if (selectedTag && onDeleteTag) {
      onDeleteTag(selectedTag.id);
      onOpenChange(false);
    }
  };

  const handleAddRule = () => {
    if (!selectedTag || !newRule.pattern.trim()) return;
    onAddRule();
    onNewRuleChange({ pattern: '', type: 'exact' }); // Reset form after adding
  };

  if (!selectedTag) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>タグの設定</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">一般</TabsTrigger>
            <TabsTrigger value="rules">マッチングルール</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">タグ名</label>
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleNameChange}
                disabled={selectedTag.is_master}
              />
              {selectedTag.is_master && (
                <p className="text-sm text-muted-foreground">
                  マスタータグの名前は変更できません
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">カテゴリ</label>
              <Select
                value={selectedTag.category}
                onValueChange={handleCategoryChange}
                disabled={selectedTag.is_master}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAG_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ColorPicker
              color={selectedTag.color}
              onChange={handleColorChange}
            />

            {!selectedTag.is_master && !showDeleteConfirm && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                タグを削除
              </Button>
            )}

            {showDeleteConfirm && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>このタグを削除してもよろしいですか？</span>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                    >
                      削除
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      キャンセル
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="rules" className="space-y-4 py-4">
            {!selectedTag.is_master && (
              <div className="space-y-4">
                <Input
                  placeholder="マッチングパターン"
                  value={newRule.pattern}
                  onChange={(e) => onNewRuleChange({ ...newRule, pattern: e.target.value })}
                />
                <Select
                  value={newRule.type}
                  onValueChange={(value: keyof typeof MATCH_TYPES) => 
                    onNewRuleChange({ ...newRule, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="マッチングタイプ" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MATCH_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  onClick={handleAddRule}
                  disabled={!newRule.pattern.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  ルールを追加
                </Button>
              </div>
            )}

            <ScrollArea className="h-[200px] pr-4">
              {(selectedTag.rules || []).map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggle(selectedTag.id, rule.id)}
                    />
                    <span className={rule.enabled ? "" : "text-muted-foreground"}>
                      {MATCH_TYPES[rule.type]}: {rule.pattern}
                    </span>
                  </div>
                  {!selectedTag.is_master && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteRule(selectedTag.id, rule.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            完了
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}