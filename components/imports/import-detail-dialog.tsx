'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ImportHistory, ImportedTransaction } from '@/types/imports';
import { Tag } from '@/types/tags';
import { RefreshCw, Check } from "lucide-react";
import { TransactionTable } from "./transaction-table";
import { Badge } from "@/components/ui/badge";

interface ImportDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedImport: ImportHistory | null;
  rematchedTransactions: ImportedTransaction[];
  isProcessing: boolean;
  onRematch: () => void;
  onUpdateCategories: () => void;
  onCategorySelect: (transactionId: string, category: string) => void;
  tags: Tag[];
}

export function ImportDetailDialog({
  isOpen,
  onOpenChange,
  selectedImport,
  rematchedTransactions,
  isProcessing,
  onRematch,
  onUpdateCategories,
  onCategorySelect,
  tags,
}: ImportDetailDialogProps) {
  if (!selectedImport) return null;

  const changedCount = rematchedTransactions.filter(t => 
    t.selectedCategory !== t.tag
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>取込データ詳細</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ファイル名</p>
              <p className="font-medium">{selectedImport.filename}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">インポート日時</p>
              <p className="font-medium">
                {(() => {
                  try {
                    const date = new Date(selectedImport.created_at);
                    if (isNaN(date.getTime())) {
                      return '日付不明';
                    }
                    return format(date, 'yyyy年MM月dd日 HH:mm:ss', { locale: ja });
                  } catch (error) {
                    return '日付不明';
                  }
                })()}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center flex-wrap gap-4">
            <Button
              onClick={onRematch}
              disabled={isProcessing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              タグを再マッチング
            </Button>
            {changedCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-warning/10 text-foreground border-warning/50">
                  {changedCount}件の変更があります
                </Badge>
                <p className="text-sm text-muted-foreground italic">
                  変更がある取引のみ選択可能です
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <TransactionTable
              transactions={rematchedTransactions}
              onCategorySelect={onCategorySelect}
              tags={tags}
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            {changedCount > 0 && (
              <Button
                onClick={onUpdateCategories}
                disabled={isProcessing}
              >
                <Check className="h-4 w-4 mr-2" />
                変更を保存
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}