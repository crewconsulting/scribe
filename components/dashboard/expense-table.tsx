'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { format, subMonths, addMonths, isWithinInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { TRANSACTION_TAGS } from '@/lib/mock-data/transactions';
import { Transaction } from '@/types/transactions';
import { getSupabaseClient } from '@/utils/supabase-client';
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ExpenseTableProps {
  startDate: Date;
  onDateChange: (date: Date) => void;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  tag: string;
  month: string;
}

function TransactionModal({ isOpen, onClose, transactions, tag, month }: TransactionModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mounted ? format(parseISO(month), 'yyyy年M月', { locale: ja }) : ''}{tag}の取引
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="text-right mb-4">
            <span className="text-sm text-muted-foreground">合計: </span>
            <span className="text-lg font-bold">
              {mounted ? `¥${total.toLocaleString()}` : ''}
            </span>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>摘要</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {mounted ? format(parseISO(transaction.date), 'yyyy年M月d日', { locale: ja }) : ''}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="text-right">
                      {mounted ? `¥${transaction.amount.toLocaleString()}` : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// テーブル存在チェックヘルパー関数
const ensureTablesExist = async (): Promise<boolean> => {
  const supabase = getSupabaseClient();
  
  try {
    // タグテーブルの有無をチェック
    const { error: tagsExistError } = await supabase
      .from('tags')
      .select('id')
      .limit(1);
    
    // トランザクションテーブルの有無をチェック  
    const { error: transactionsExistError } = await supabase
      .from('imported_transactions')
      .select('transaction_date')
      .limit(1);

    if (tagsExistError || transactionsExistError) {
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
};

export function ExpenseTable({ startDate, onDateChange }: ExpenseTableProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ tag: string; month: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tags, setTags] = useState<string[]>(['全て']);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);
      setTransactions([]);
      
      try {
        // テーブルの存在を確認
        const tablesExist = await ensureTablesExist();
        
        if (!tablesExist) {
          setError('データテーブルが見つかりません。初期設定が必要かもしれません。');
        }
        
        // データ取得処理を実行
        await fetchTags();
        await fetchTransactions();
      } catch (err) {
        setError('データ取得中にエラーが発生しました。');
        toast({
          variant: "destructive",
          title: "エラー",
          description: "データの読み込み中に問題が発生しました。",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [startDate, toast]);

  // タグデータを取得する関数
  const fetchTags = async () => {
    const supabase = getSupabaseClient();
    
    try {
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('name, id');

      if (tagError) {
        setTags(['全て']);
        return;
      }
      
      if (tagData && tagData.length > 0) {
        const tagNames = ['全て', ...tagData.map(tag => tag.name)];
        setTags(tagNames);
      } else {
        setTags(['全て']);
      }
    } catch (e) {
      setTags(['全て']);
    }
  };

  // 取引データを取得する関数
  const fetchTransactions = async () => {
    const supabase = getSupabaseClient();
    
    try {
      // 取得する期間の設定（過去12ヶ月）
      const endDate = endOfMonth(startDate);
      const startMonthDate = startOfMonth(subMonths(startDate, 11));
      
      // 認証状態を確認
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setTransactions([]);
        return;
      }
      
      if (!user) {
        setTransactions([]);
        return;
      }
      
      // 取引データの取得
      const { data, error } = await supabase
        .from('imported_transactions')
        .select('*')
        .gte('transaction_date', startMonthDate.toISOString())
        .lte('transaction_date', endDate.toISOString());

      if (error) {
        setTransactions([]);
        toast({
          variant: "destructive",
          title: "データ取得エラー",
          description: "取引データの取得中にエラーが発生しました。",
        });
        return;
      }
      
      if (data && data.length > 0) {
        // トランザクションの型に合わせてマッピング
        const mappedData: Transaction[] = data.map(item => ({
          id: typeof item.id === 'number' ? item.id : parseInt(item.id),
          date: item.transaction_date,
          amount: item.amount,
          description: item.description || '',
          tag: item.tag || null,
        }));

        setTransactions(mappedData);
      } else {
        setTransactions([]);
      }
    } catch (e) {
      setTransactions([]);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "取引データの処理中にエラーが発生しました。",
      });
    }
  };

  // 12ヶ月分の期間を生成
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => subMonths(startDate, i));
  }, [startDate]);

  // タグごとの月別集計データを生成
  const monthlyData = useMemo(() => {
    const data = new Map<string, { [key: string]: number }>();

    // タグごとの初期化
    tags.slice(1).forEach(tag => {
      data.set(tag, {});
      months.forEach(month => {
        data.get(tag)![format(month, 'yyyy-MM')] = 0;
      });
    });

    // タグマッピング辞書を作成
    const tagMap = new Map<string, string>();
    tags.slice(1).forEach(tag => {
      // 正規化されたバージョンのタグをマッピング
      const normalizedTag = tag.toLowerCase().trim();
      tagMap.set(normalizedTag, tag);
      tagMap.set(normalizedTag.replace(/\s+/g, ''), tag);
    });

    // 取引データの集計
    transactions.forEach(transaction => {
      if (!transaction || !transaction.date) return;

      try {
        const transactionDate = new Date(transaction.date);
        const monthKey = format(transactionDate, 'yyyy-MM');
        
        // 対象期間内の取引のみを集計
        if (isWithinInterval(transactionDate, {
          start: startOfMonth(months[months.length - 1]),
          end: endOfMonth(months[0])
        })) {
          if (transaction.tag) {
            // タグの正規化とマッピング
            const normalizedTag = transaction.tag.toLowerCase().trim();
            const mappedTag = tagMap.get(normalizedTag) || 
                              tagMap.get(normalizedTag.replace(/\s+/g, ''));
            
            const tagData = mappedTag ? data.get(mappedTag) : undefined;
            
            if (tagData && monthKey in tagData) {
              tagData[monthKey] += transaction.amount;
            }
          }
        }
      } catch (error) {
        // エラーは静かに処理
      }
    });

    return data;
  }, [months, transactions, tags]);

  // 月ごとの合計を計算
  const monthlyTotals = useMemo(() => {
    const totals: { [key: string]: number } = {};
    months.forEach(month => {
      const monthKey = format(month, 'yyyy-MM');
      totals[monthKey] = Array.from(monthlyData.values()).reduce(
        (sum, tagData) => sum + (tagData[monthKey] || 0),
        0
      );
    });
    return totals;
  }, [months, monthlyData]);

  // 選択されたセルの取引を取得
  const selectedTransactions = useMemo(() => {
    if (!selectedCell) return [];

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const monthKey = format(transactionDate, 'yyyy-MM');
      
      if (selectedCell.tag === '全て') {
        return monthKey === selectedCell.month;
      }
      
      return transaction.tag === selectedCell.tag && monthKey === selectedCell.month;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCell, transactions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">月別支出サマリー</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addMonths(startDate, 12))}
            disabled={format(startDate, 'yyyy-MM') === format(new Date(), 'yyyy-MM')}
          >
            次年
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(subMonths(startDate, 12))}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            前年
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">データを読み込み中...</span>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">タグ</TableHead>
                {months.map(month => (
                  <TableHead key={month.getTime()} className="text-right">
                    {mounted ? format(month, 'yyyy年M月', { locale: ja }) : ''}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(monthlyData.entries()).map(([tag, data]) => (
                <TableRow key={tag}>
                  <TableCell className="font-medium">{tag}</TableCell>
                  {months.map(month => {
                    const monthKey = format(month, 'yyyy-MM');
                    const amount = data[monthKey] || 0;
                    return (
                      <TableCell 
                        key={month.getTime()} 
                        className={`text-right ${amount > 0 ? 'cursor-pointer hover:bg-muted' : ''}`}
                        onClick={() => {
                          if (amount > 0) {
                            setSelectedCell({ tag, month: monthKey });
                          }
                        }}
                      >
                        {mounted && amount > 0 ? `¥${amount.toLocaleString()}` : '-'}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">合計</TableCell>
                {months.map(month => {
                  const monthKey = format(month, 'yyyy-MM');
                  const total = monthlyTotals[monthKey] || 0;
                  return (
                    <TableCell 
                      key={month.getTime()} 
                      className={`text-right font-bold ${total > 0 ? 'cursor-pointer hover:bg-muted' : ''}`}
                      onClick={() => {
                        if (total > 0) {
                          setSelectedCell({ tag: '全て', month: monthKey });
                        }
                      }}
                    >
                      {mounted && total > 0 ? `¥${total.toLocaleString()}` : '-'}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {selectedCell && (
        <TransactionModal
          isOpen={!!selectedCell}
          onClose={() => setSelectedCell(null)}
          transactions={selectedTransactions}
          tag={selectedCell.tag}
          month={selectedCell.month}
        />
      )}
    </div>
  );
}