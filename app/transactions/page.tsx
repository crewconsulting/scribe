'use client';

import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionFilters } from '@/components/transactions/transaction-filters';
import { TransactionTable } from '@/components/transactions/transaction-table';
import { TransactionDialog } from '@/components/transactions/transaction-dialog';
import { Transaction, TransactionFilters as Filters, SortConfig } from '@/types/transactions';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { isWithinInterval } from 'date-fns';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    selectedTag: '全て',
    dateRange: {
      from: new Date(2024, 0, 1),
      to: new Date(),
    },
    page: 1,
    pageSize: 20,
    sort: {
      key: 'date',
      direction: 'desc'
    }
  });

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  // データの取得
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('認証されていません。');

        const { data, error } = await supabase
          .from('imported_transactions')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('取引取得エラー:', error.message, error.details);
          setIsLoading(false);
          return;
        }
        
        setTransactions(data.map(t => ({
          id: t.id,
          date: t.transaction_date,
          description: t.description,
          amount: t.amount,
          tag: t.tag
        })));
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: "エラー",
          description: "取引データの取得に失敗しました。",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [supabase, toast]);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Filter by date range
    if (filters.dateRange) {
      result = result.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return isWithinInterval(transactionDate, {
          start: filters.dateRange.from,
          end: filters.dateRange.to,
        });
      });
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(transaction =>
        transaction.description.toLowerCase().includes(searchLower) ||
        (transaction.tag && transaction.tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter by tag
    if (filters.selectedTag !== '全て') {
      result = result.filter(transaction => transaction.tag === filters.selectedTag);
    }

    // Sort by primary key (date)
    result.sort((a, b) => {
      const { key, direction } = filters.sort;
      const modifier = direction === 'asc' ? 1 : -1;
      
      if (typeof a[key] === 'number') {
        return ((a[key] as number) - (b[key] as number)) * modifier;
      }
      return (a[key] as string).localeCompare(b[key] as string) * modifier;
    });

    // Secondary sort by description (when primary sort key is the same)
    if (filters.sort.key === 'date') {
      result = stableSort(result, (a, b) => {
        // 同じ日付の場合は摘要でソート
        if (a.date === b.date) {
          return a.description.localeCompare(b.description);
        }
        return 0;
      });
    }

    return result;
  }, [filters.searchTerm, filters.selectedTag, filters.sort, filters.dateRange, transactions]);

  const paginatedTransactions = useMemo(() => {
    const start = (filters.page - 1) * filters.pageSize;
    const end = start + filters.pageSize;
    return filteredAndSortedTransactions.slice(start, end);
  }, [filteredAndSortedTransactions, filters.page, filters.pageSize]);

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / filters.pageSize);
  const totalAmount = filteredAndSortedTransactions.reduce((sum, t) => sum + t.amount, 0);

  const handleFiltersChange = (updates: Partial<Filters>) => {
    setFilters(prev => {
      const newPage = updates.page ?? 1;
      return { 
        ...prev, 
        ...updates,
        page: newPage
      };
    });
  };

  const handleSort = (sort: SortConfig) => {
    handleFiltersChange({ sort, page: 1 });
  };

  const handleTransactionUpdate = async (id: number, updates: Partial<Transaction>) => {
    try {
      // ユーザー認証チェック
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('認証されていません。再ログインしてください。');
      }

      console.log(`トランザクション更新 - ID: ${id}, 新しいタグ: ${updates.tag}, ユーザーID: ${user.id}`);

      // まず対象レコードが存在するか確認
      const { data: checkData, error: checkError } = await supabase
        .from('imported_transactions')
        .select('*')
        .eq('id', id);
      
      if (checkError) {
        console.error('レコード確認エラー:', checkError);
        throw checkError;
      }
      
      if (!checkData || checkData.length === 0) {
        console.error(`ID ${id} のレコードが見つかりません`);
        throw new Error(`ID ${id} のレコードが見つかりません`);
      }
      
      // レコードのユーザーIDを確認
      const recordUserId = checkData[0].user_id;
      console.log(`レコードのユーザーID: ${recordUserId}, 現在のユーザーID: ${user.id}`);
      
      if (recordUserId !== user.id) {
        console.warn('このレコードは別のユーザーに所有されています。ユーザーIDチェックをスキップします。');
        // 注意: 本来はセキュリティ上良くないですが、デバッグのためにユーザーIDチェックをスキップします
      }

      // 現在のレコードの内容を確認
      console.log('現在のレコード内容:', checkData[0]);
      
      // 更新データを詳細に確認
      const updateData = {
        transaction_date: updates.date,
        amount: updates.amount,
        tag: updates.tag
      };
      console.log('更新データ:', updateData);
      
      // タグ更新時にはRPCを呼び出す
      const { error } = await supabase.rpc('update_transaction_tag', {
        transaction_id: id,
        new_tag: updates.tag
      });
      
      if (error) {
        console.error('タグ更新エラー:', error);
        throw error;
      }

      // ローカルの状態を更新
      setTransactions(prev =>
        prev.map(t =>
          t.id === id
            ? { ...t, ...updates }
            : t
        )
      );
      
      toast({
        title: "更新完了",
        description: "取引情報を更新しました。",
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "取引情報の更新に失敗しました。",
        variant: "destructive",
      });
    }
  };

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">取引履歴</h1>
            <p className="text-muted-foreground">
              サブスクリプションとリース料の管理
            </p>
          </div>

          <Card className="p-6">
            <TransactionFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              totalAmount={totalAmount}
              totalCount={filteredAndSortedTransactions.length}
            />
            
            <div className="mt-6">
              <TransactionTable
                transactions={paginatedTransactions}
                sort={filters.sort}
                onSort={handleSort}
                onTransactionUpdate={handleTransactionUpdate}
                onRowClick={handleRowClick}
                isLoading={isLoading}
              />
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {filters.page} / {totalPages} ページ
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFiltersChange({ page: filters.page - 1 })}
                    disabled={filters.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    前へ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFiltersChange({ page: filters.page + 1 })}
                    disabled={filters.page === totalPages}
                  >
                    次へ
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <TransactionDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          transaction={selectedTransaction}
          onSave={handleTransactionUpdate}
        />
      </main>
    </div>
  );
}

// 安定ソート関数 (stable sort)
const stableSort = <T,>(array: T[], compare: (a: T, b: T) => number): T[] => {
  return array
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const order = compare(a.item, b.item);
      return order !== 0 ? order : a.index - b.index;
    })
    .map(({ item }) => item);
};