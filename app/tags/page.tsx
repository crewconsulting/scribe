'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { TagSection } from '@/components/tags/tag-section';
import { RuleDialog } from '@/components/tags/rule-dialog';
import { Tag, MATCH_TYPES, TAG_COLORS } from '@/types/tags';
import { useTags } from '@/hooks/use-tags';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from "@/components/ui/button";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    pattern: '',
    type: 'exact' as keyof typeof MATCH_TYPES,
  });
  const { toast } = useToast();
  const {
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    createRule,
    updateRule,
    deleteRule,
  } = useTags();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUserId = async () => {
      try {
        console.log('ユーザー情報取得を開始します');
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('認証エラー:', error);
          toast({
            title: "認証エラー",
            description: error.message,
            variant: "destructive",
          });
          router.push('/auth/login?redirect=/tags');
          return;
        }
        
        if (user) {
          console.log('ユーザー情報取得成功:', user.id);
          setUserId(user.id);
        } else {
          console.log('ユーザー情報なし - ログインしていません');
          toast({
            title: "エラー",
            description: "認証されていません。ログインページに移動します。",
            variant: "destructive",
          });
          router.push('/auth/login?redirect=/tags');
        }
      } catch (error) {
        console.error('ユーザー情報の取得に失敗しました:', error);
        toast({
          title: "エラー",
          description: "ユーザー情報の取得に失敗しました。",
          variant: "destructive",
        });
        router.push('/auth/login?redirect=/tags');
      }
    };

    getUserId();
  }, [toast, router]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await fetchTags();
        setTags(tags);
      } catch (error) {
        console.error('Failed to load tags:', error);
        toast({
          title: "タグの読み込みに失敗しました",
          variant: "destructive",
        });
      }
    };

    loadTags();
  }, [fetchTags, toast]);

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    
    if (!userId) {
      toast({
        title: "エラー",
        description: "ユーザーIDが取得できていません。再度ログインしてください。",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newTag = await createTag({
        name: newTagName.trim(),
        color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
        category: 'その他',
        is_master: false,
        user_id: userId,
      });
      
      console.log('作成されたタグ:', newTag);
      
      setTags(prev => [...prev, { ...newTag, rules: [] }]);
      setNewTagName('');
      
      toast({
        title: "タグを追加しました",
        description: `"${newTag.name}"を追加しました`,
      });
    } catch (error) {
      console.error('タグ作成エラー詳細:', error);
      toast({
        title: "タグの作成に失敗しました",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTag(tagId);
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      toast({
        title: "タグを削除しました",
      });
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast({
        title: "タグの削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTag = async (tagId: string, updates: Partial<Tag>) => {
    try {
      const updatedTag = await updateTag(tagId, updates);
      setTags(prev => prev.map(tag =>
        tag.id === tagId ? { ...tag, ...updatedTag } : tag
      ));
      setSelectedTag(prev => prev?.id === tagId ? { ...prev, ...updatedTag } : prev);
      toast({
        title: "タグを更新しました",
      });
    } catch (error) {
      console.error('Failed to update tag:', error);
      toast({
        title: "タグの更新に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleAddRule = async () => {
    if (!selectedTag || !newRule.pattern.trim()) return;

    try {
      const createdRule = await createRule({
        tag_id: selectedTag.id,
        pattern: newRule.pattern.trim(),
        type: newRule.type,
        enabled: true,
      });

      const updatedRules = [...(selectedTag.rules || []), createdRule];

      setTags(prev => prev.map(tag =>
        tag.id === selectedTag.id
          ? { ...tag, rules: updatedRules }
          : tag
      ));
      setSelectedTag({ ...selectedTag, rules: updatedRules });
      setNewRule({ pattern: '', type: 'exact' });
      
      toast({
        title: "マッチングルールを追加しました",
      });
    } catch (error) {
      console.error('Failed to create rule:', error);
      toast({
        title: "ルールの作成に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (tagId: string, ruleId: string) => {
    if (!selectedTag) return;

    try {
      await deleteRule(ruleId);
      const updatedRules = selectedTag.rules?.filter(rule => rule.id !== ruleId) || [];

      setTags(prev => prev.map(tag =>
        tag.id === tagId
          ? { ...tag, rules: updatedRules }
          : tag
      ));
      setSelectedTag({ ...selectedTag, rules: updatedRules });
      
      toast({
        title: "マッチングルールを削除しました",
      });
    } catch (error) {
      console.error('Failed to delete rule:', error);
      toast({
        title: "ルールの削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  const toggleRule = async (tagId: string, ruleId: string) => {
    if (!selectedTag) return;

    const rule = selectedTag.rules?.find(r => r.id === ruleId);
    if (!rule) return;

    try {
      const updatedRule = await updateRule(ruleId, {
        enabled: !rule.enabled,
      });

      const updatedRules = selectedTag.rules?.map(r =>
        r.id === ruleId ? updatedRule : r
      ) || [];

      setTags(prev => prev.map(tag =>
        tag.id === tagId
          ? { ...tag, rules: updatedRules }
          : tag
      ));
      setSelectedTag({ ...selectedTag, rules: updatedRules });

      toast({
        title: "ルールの状態を更新しました",
        description: "マッチングルールの有効/無効を切り替えました",
      });
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      toast({
        title: "ルールの更新に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleOpenRuleDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setIsRuleDialogOpen(true);
  };

  const masterTags = tags.filter(tag => tag.is_master);
  const userTags = tags.filter(tag => !tag.is_master);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">タグ管理</h1>
            <p className="text-muted-foreground">
              取引の分類に使用するタグとマッチングルールを管理
            </p>
          </div>

          <Card className="p-6 space-y-8">
            <TagSection
              title="マスタータグ"
              tags={masterTags}
              onOpenRuleDialog={handleOpenRuleDialog}
            />
            <TagSection
              title="カスタムタグ"
              tags={userTags}
              showAddButton
              newTagName={newTagName}
              onNewTagNameChange={setNewTagName}
              onAddTag={handleAddTag}
              onOpenRuleDialog={handleOpenRuleDialog}
            />
          </Card>

          <Button 
            onClick={async () => {
              const { data } = await supabase.auth.getUser();
              console.log('現在のユーザー:', data.user);
              toast({
                title: "ユーザー情報",
                description: data.user ? `ID: ${data.user.id}` : "ログインしていません",
              });
            }}
            variant="outline"
            size="sm"
          >
            ユーザー確認
          </Button>
        </div>
      </main>

      <RuleDialog
        isOpen={isRuleDialogOpen}
        onOpenChange={setIsRuleDialogOpen}
        selectedTag={selectedTag}
        newRule={newRule}
        onNewRuleChange={setNewRule}
        onAddRule={handleAddRule}
        onToggleRule={toggleRule}
        onDeleteRule={handleDeleteRule}
        onUpdateTag={handleUpdateTag}
        onDeleteTag={handleDeleteTag}
      />
    </div>
  );
}