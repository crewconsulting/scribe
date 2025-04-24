'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { ImportHistoryTable } from '@/components/imports/import-history-table';
import { ImportDetailDialog } from '@/components/imports/import-detail-dialog';
import { DeleteConfirmDialog } from '@/components/imports/delete-confirm-dialog';
import { ImportHistory, ImportedTransaction } from '@/types/imports';
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { findMatchingTag } from '@/lib/utils/tag-matcher';
import { Tag } from '@/types/tags';

export default function ImportsPage() {
  const [imports, setImports] = useState<ImportHistory[]>([]);
  const [selectedImport, setSelectedImport] = useState<ImportHistory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rematchedTransactions, setRematchedTransactions] = useState<ImportedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);

  const { toast } = useToast();
  const supabase = createClientComponentClient();

  // タグデータの取得
  useEffect(() => {
    const fetchTags = async () => {
      try {
        // タグを取得
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('*');

        if (tagsError) throw tagsError;

        // タグに関連するルールを取得
        const { data: rulesData, error: rulesError } = await supabase
          .from('tag_rules')
          .select('*');

        if (rulesError) throw rulesError;

        // タグにルールをマッピング
        const tagsWithRules = tagsData.map(tag => ({
          ...tag,
          rules: rulesData.filter(rule => rule.tag_id === tag.id)
        }));

        setTags(tagsWithRules);
      } catch (error) {
        console.error('タグの取得中にエラーが発生しました:', error);
        toast({
          title: "エラー",
          description: "タグデータの読み込みに失敗しました。",
          variant: "destructive",
        });
      }
    };

    fetchTags();
  }, [supabase, toast]);

  // インポート履歴の取得
  useEffect(() => {
    const fetchImports = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('認証されていません。');

        const { data: importHistory, error: importError } = await supabase
          .from('import_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (importError) throw importError;

        const processedImports = await Promise.all(
          importHistory.map(async (history) => {
            const { data: transactions, error: transactionError } = await supabase
              .from('imported_transactions')
              .select('*')
              .eq('import_id', history.id);

            if (transactionError) throw transactionError;

            return {
              ...history,
              transactions: transactions || [],
              totalCount: transactions?.length || 0
            };
          })
        );

        setImports(processedImports);
      } catch (error) {
        console.error('Error fetching imports:', error);
        toast({
          title: "エラー",
          description: "インポート履歴の取得に失敗しました。",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchImports();
  }, [supabase, toast]);

  const handleDelete = async (history: ImportHistory) => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('認証されていません。');

      console.log('Starting deletion process...');
      console.log('Import ID:', history.id);
      console.log('User ID:', user.id);

      // 削除前にデータの存在を確認
      const { data: existingImport, error: checkError } = await supabase
        .from('import_history')
        .select('*')
        .eq('id', history.id)
        .eq('user_id', user.id)
        .single();

      if (checkError) {
        console.error('Error checking import:', checkError);
        throw new Error(`インポート履歴の確認に失敗しました: ${checkError.message}`);
      }

      if (!existingImport) {
        console.error('Import not found');
        throw new Error('削除対象のインポート履歴が見つかりません。');
      }

      console.log('Found import to delete:', existingImport);

      // まず、関連する取引データを削除
      console.log('Deleting transactions...');
      const { error: transactionError } = await supabase
        .from('imported_transactions')
        .delete()
        .eq('import_id', history.id);

      if (transactionError) {
        console.error('Transaction deletion error:', transactionError);
        throw new Error(`取引データの削除に失敗しました: ${transactionError.message}`);
      }

      console.log('Transactions deleted successfully');

      // 次に、インポート履歴を削除（RLSポリシーを考慮した条件指定）
      console.log('Deleting import history...');
      const { error: importError } = await supabase
        .from('import_history')
        .delete()
        .eq('id', history.id)
        .eq('user_id', user.id);

      if (importError) {
        console.error('Import history deletion error:', importError);
        throw new Error(`インポート履歴の削除に失敗しました: ${importError.message}`);
      }

      console.log('Import history deleted successfully');

      // 削除後にデータが存在しないことを確認（より厳密な条件で）
      console.log('Verifying deletion...');
      const { data: checkDeleted, error: checkDeletedError } = await supabase
        .from('import_history')
        .select('*')
        .eq('id', history.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkDeletedError) {
        console.error('Error checking deletion:', checkDeletedError);
        throw new Error(`削除の確認に失敗しました: ${checkDeletedError.message}`);
      }

      if (checkDeleted) {
        console.error('Data still exists after deletion:', checkDeleted);
        throw new Error('データベースの削除権限が正しく設定されていない可能性があります。');
      }

      console.log('Deletion verified successfully');

      // 成功した場合、ローカルの状態を更新
      setImports(prev => prev.filter(imp => imp.id !== history.id));
      setIsConfirmDeleteOpen(false);
      
      toast({
        title: "削除完了",
        description: `インポートデータ「${history.filename}」を削除しました。`,
      });
    } catch (error) {
      console.error('Error deleting import:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "インポートデータの削除に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModalRematch = async () => {
    if (!selectedImport) return;
    
    setIsProcessing(true);
    
    try {
      // 現在のトランザクションデータを取得
      const { data: transactions, error: transactionError } = await supabase
        .from('imported_transactions')
        .select('*')
        .eq('import_id', selectedImport.id);

      if (transactionError) throw transactionError;
      if (!transactions) throw new Error('取引データの取得に失敗しました。');

      // 各トランザクションに対してタグを再マッチング
      const rematchedResults: ImportedTransaction[] = transactions.map(transaction => {
        // 摘要からマッチするタグを検索
        const newTag = findMatchingTag(transaction.description, tags);
        
        // トランザクションのタグフィールドを安全に取得（nullを許容）
        const currentTag = typeof transaction.tag === 'string' ? transaction.tag : null;
        
        // 元のタグと新しいタグが異なる場合のみ変更の対象
        const hasChanged = currentTag !== newTag;
        
        return {
          id: transaction.id,
          date: transaction.transaction_date,
          description: transaction.description,
          amount: transaction.amount,
          tag: currentTag, // 現在のタグ（undefinedの場合はnullを使用）
          newCategory: newTag, // 新しくマッチしたタグ
          selectedCategory: hasChanged ? newTag : currentTag, // 選択されるタグ
          hasChanged // 変更があるかどうかのフラグ
        } as ImportedTransaction;
      });

      setRematchedTransactions(rematchedResults);
      
      // 変更があった件数を表示
      const changedCount = rematchedResults.filter(t => t.hasChanged).length;
      if (changedCount > 0) {
        toast({
          title: "タグ再マッチング完了",
          description: `${changedCount}件のタグが更新されました。変更を確認してください。`,
        });
      } else {
        toast({
          title: "タグ再マッチング完了",
          description: "タグの変更はありませんでした。",
        });
      }
    } catch (error) {
      console.error('Error during tag rematching:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "タグの再マッチングに失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateCategories = async () => {
    if (!selectedImport) return;
    
    setIsProcessing(true);
    try {
      // 変更されたタグのみを更新
      const updates = rematchedTransactions
        .filter(t => t.selectedCategory !== t.tag)
        .map(t => ({
          id: t.id,
          tag: t.selectedCategory
        }));

      if (updates.length === 0) {
        toast({
          title: "情報",
          description: "更新が必要なタグはありません。",
        });
        setIsProcessing(false);
        return;
      }

      // 一括更新
      for (const update of updates) {
        const { error } = await supabase
          .from('imported_transactions')
          .update({ tag: update.tag })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: "更新完了",
        description: `${updates.length}件のタグを更新しました。`,
      });

      // インポート履歴を更新して最新状態を表示
      const updatedImports = [...imports];
      const importIndex = updatedImports.findIndex(imp => imp.id === selectedImport.id);
      
      if (importIndex >= 0) {
        const updatedTransactions = selectedImport.transactions.map(transaction => {
          const updated = rematchedTransactions.find(t => t.id === transaction.id);
          if (updated && updated.selectedCategory !== transaction.tag) {
            return { ...transaction, tag: updated.selectedCategory ?? null };
          }
          return transaction;
        });
        
        updatedImports[importIndex] = {
          ...updatedImports[importIndex],
          transactions: updatedTransactions
        };
        
        setImports(updatedImports);
        setSelectedImport({
          ...selectedImport,
          transactions: updatedTransactions
        });
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating categories:', error);
      toast({
        title: "エラー",
        description: "タグの更新に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCategorySelect = (transactionId: string, category: string) => {
    setRematchedTransactions(prev => 
      prev.map(t => 
        t.id === transactionId
          ? { ...t, selectedCategory: category }
          : t
      )
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="space-y-8 max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold">インポート履歴</h1>
            <p className="text-muted-foreground">
              CSVインポートの履歴と取込データの管理
            </p>
          </div>

          <Card className="p-4 md:p-6">
            <ImportHistoryTable
              imports={imports}
              onSelectImport={(history) => {
                setSelectedImport(history);
                setRematchedTransactions(history.transactions.map(t => ({
                  ...t,
                  selectedCategory: t.tag || '未分類'
                })));
                setIsDialogOpen(true);
              }}
              onDeleteImport={(history) => {
                setSelectedImport(history);
                setIsConfirmDeleteOpen(true);
              }}
              isProcessing={isProcessing}
              isLoading={isLoading}
            />
          </Card>
        </div>

        <ImportDetailDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          selectedImport={selectedImport}
          rematchedTransactions={rematchedTransactions}
          isProcessing={isProcessing}
          onRematch={handleModalRematch}
          onUpdateCategories={handleUpdateCategories}
          onCategorySelect={handleCategorySelect}
          tags={tags}
        />

        <DeleteConfirmDialog
          isOpen={isConfirmDeleteOpen}
          onOpenChange={setIsConfirmDeleteOpen}
          onConfirm={() => selectedImport && handleDelete(selectedImport)}
          isProcessing={isProcessing}
        />
      </main>
    </div>
  );
}