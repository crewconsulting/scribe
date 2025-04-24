import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Transaction } from "@/types/transactions";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';

interface TransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onSave: (id: number, updates: Partial<Transaction>) => void;
}

export function TransactionDialog({
  isOpen,
  onOpenChange,
  transaction,
  onSave,
}: TransactionDialogProps) {
  const [values, setValues] = useState<Partial<Transaction> & { dateObj?: Date }>({
    date: transaction?.date || '',
    dateObj: transaction ? new Date(transaction.date) : undefined,
    description: transaction?.description || '',
    amount: transaction?.amount || 0,
    tag: transaction?.tag || null
  });
  
  const [tags, setTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);

  useEffect(() => {
    if (!transaction || !isOpen) return;
    
    // 値を初期化
    setValues({
      date: transaction.date,
      dateObj: new Date(transaction.date),
      description: transaction.description,
      amount: transaction.amount,
      tag: transaction.tag
    });
    
    // タグを取得
    const fetchTags = async () => {
      setLoadingTags(true);
      try {
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
          setTags(['未分類']);
        }
      } catch (e) {
        console.error('タグ取得エラー (例外):', e);
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTags();
  }, [transaction, isOpen]);

  const handleSave = () => {
    if (!transaction) return;
    
    // タグが「未分類」の場合はnullに設定
    const tagValue = values.tag === '未分類' ? null : values.tag;
    
    onSave(transaction.id, {
      ...values,
      date: values.dateObj ? format(values.dateObj, 'yyyy-MM-dd') : '',
      tag: tagValue
    });
    onOpenChange(false);
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>取引の編集</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">日付</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !values.dateObj && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {values.dateObj ? (
                    format(values.dateObj, 'yyyy年MM月dd日', { locale: ja })
                  ) : (
                    <span>日付を選択</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={values.dateObj}
                  onSelect={(date) => setValues({ ...values, dateObj: date })}
                  initialFocus
                  locale={ja}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">摘要</label>
            <Input
              value={values.description}
              readOnly
              disabled
              className="bg-muted cursor-not-allowed"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">金額</label>
            <Input
              type="number"
              value={values.amount}
              onChange={(e) => setValues({ ...values, amount: parseInt(e.target.value) })}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">タグ</label>
            {loadingTags ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>タグを読み込み中...</span>
              </div>
            ) : (
              <Select
                value={values.tag === null ? '未分類' : values.tag}
                onValueChange={(value) => setValues({ ...values, tag: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* sourceFileプロパティの安全なチェック */}
          {transaction && 
            typeof transaction === 'object' && 
            transaction !== null && 
            'sourceFile' in transaction && 
            typeof transaction.sourceFile === 'string' && 
            transaction.sourceFile && (
              <div className="text-sm text-muted-foreground">
                取込ファイル: {transaction.sourceFile}
              </div>
            )
          }
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}