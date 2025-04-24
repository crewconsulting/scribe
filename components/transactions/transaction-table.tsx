'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, ArrowUpDown, Loader2, AlertCircle } from "lucide-react";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Transaction, SortConfig } from "@/types/transactions";
import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface TransactionTableProps {
  transactions: Transaction[];
  sort: SortConfig;
  onSort: (sort: SortConfig) => void;
  onTransactionUpdate: (id: number, updates: Partial<Transaction>) => void;
  onRowClick: (transaction: Transaction) => void;
  isLoading?: boolean;
}

// タグ変更確認モーダル用の型
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentTag: string;
  newTag: string;
}

// タグ変更確認モーダル
function ConfirmTagChangeModal({ isOpen, onClose, onConfirm, currentTag, newTag }: ConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            タグの変更確認
          </DialogTitle>
          <DialogDescription>
            以下のタグ変更を行います。よろしいですか？
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">現在のタグ:</p>
              <p className="text-lg font-medium">{currentTag === '未分類' ? '未分類' : currentTag}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">新しいタグ:</p>
              <p className="text-lg font-medium">{newTag === '未分類' ? '未分類' : newTag}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button onClick={onConfirm}>変更する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TransactionTable({
  transactions,
  sort,
  onSort,
  onTransactionUpdate,
  onRowClick,
  isLoading = false
}: TransactionTableProps) {
  const [mounted, setMounted] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  
  // タグ変更確認用の状態
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    transactionId: number | null;
    currentTag: string;
    newTag: string;
  }>({
    isOpen: false,
    transactionId: null,
    currentTag: '',
    newTag: ''
  });

  useEffect(() => {
    setMounted(true);

    // Supabaseからタグを取得
    const fetchTags = async () => {
      setLoadingTags(true);
      try {
        // タグデータの取得
        const { data: tagData, error } = await supabase
          .from('tags')
          .select('name');

        if (error) {
          console.error('タグ取得エラー:', error.message, error.details);
          setLoadingTags(false);
          return;
        }

        if (tagData && tagData.length > 0) {
          // タグデータの整形 (未分類オプションを追加)
          const tagNames = ['未分類', ...tagData.map(tag => tag.name)];
          setTags(tagNames);
        } else {
          // タグがない場合はデフォルトで未分類のみ
          setTags(['未分類']);
        }
      } catch (e) {
        console.error('タグ取得エラー (例外):', e);
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTags();
  }, []);

  const handleSort = (column: keyof Transaction) => {
    onSort({
      key: column,
      direction: sort.key === column && sort.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // タグ変更の前に確認モーダルを表示
  const handleTagChangeRequest = (id: number, newTagValue: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    const currentTagDisplay = transaction.tag === null ? '未分類' : transaction.tag;
    
    setConfirmModal({
      isOpen: true,
      transactionId: id,
      currentTag: currentTagDisplay,
      newTag: newTagValue
    });
  };

  // 確認後に実際のタグ変更を実行
  const handleConfirmTagChange = () => {
    if (confirmModal.transactionId === null) return;
    
    try {
      // 未分類の場合はnullに設定
      const tagValue = confirmModal.newTag === '未分類' ? null : confirmModal.newTag;
      
      // データベース更新関数を呼び出し
      onTransactionUpdate(confirmModal.transactionId, { tag: tagValue });
      
      // モーダルを閉じる
      setConfirmModal({
        isOpen: false,
        transactionId: null,
        currentTag: '',
        newTag: ''
      });
    } catch (error) {
      console.error('タグ更新エラー:', error);
      // エラーが発生しても、モーダルは閉じる
      setConfirmModal({
        isOpen: false,
        transactionId: null,
        currentTag: '',
        newTag: ''
      });
    }
  };

  // モーダルをキャンセル
  const handleCancelTagChange = () => {
    setConfirmModal({
      isOpen: false,
      transactionId: null,
      currentTag: '',
      newTag: ''
    });
  };

  const SortIcon = ({ column }: { column: keyof Transaction }) => {
    if (sort.key !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sort.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        データを読み込み中...
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        表示するデータがありません
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* 日付列 */}
              <TableHead className="w-[120px] whitespace-nowrap">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('date')}
                  className="h-8 flex items-center gap-1"
                >
                  日付
                  <SortIcon column="date" />
                </Button>
              </TableHead>
              {/* 摘要列 */}
              <TableHead className="min-w-[200px] max-w-[400px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('description')}
                  className="h-8 flex items-center gap-1"
                >
                  摘要
                  <SortIcon column="description" />
                </Button>
              </TableHead>
              {/* タグ列 */}
              <TableHead className="w-[180px] whitespace-nowrap">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('tag')}
                  className="h-8 flex items-center gap-1"
                >
                  タグ
                  <SortIcon column="tag" />
                </Button>
              </TableHead>
              {/* 金額列 */}
              <TableHead className="w-[120px] text-right whitespace-nowrap">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('amount')}
                  className="h-8 flex items-center gap-1 ml-auto"
                >
                  金額
                  <SortIcon column="amount" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                className="group cursor-pointer hover:bg-muted/50"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.tag-select')) return;
                  onRowClick(transaction);
                }}
              >
                {/* 日付セル */}
                <TableCell className="whitespace-nowrap">
                  {mounted ? format(new Date(transaction.date), 'yyyy年MM月dd日', { locale: ja }) : ''}
                </TableCell>
                {/* 摘要セル */}
                <TableCell className="max-w-[400px] truncate text-muted-foreground">
                  {transaction.description}
                </TableCell>
                {/* タグセル */}
                <TableCell className="whitespace-nowrap">
                  <div className="tag-select">
                    {loadingTags ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>ロード中...</span>
                      </div>
                    ) : (
                      <Select
                        value={transaction.tag === null ? '未分類' : transaction.tag}
                        onValueChange={(value) => handleTagChangeRequest(transaction.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start">
                          {tags.map((tag) => (
                            <SelectItem key={tag} value={tag}>
                              {tag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </TableCell>
                {/* 金額セル */}
                <TableCell className="text-right whitespace-nowrap">
                  {mounted ? `¥${transaction.amount.toLocaleString()}` : ''}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* タグ変更確認モーダル */}
      <ConfirmTagChangeModal
        isOpen={confirmModal.isOpen}
        onClose={handleCancelTagChange}
        onConfirm={handleConfirmTagChange}
        currentTag={confirmModal.currentTag}
        newTag={confirmModal.newTag}
      />
    </>
  );
}