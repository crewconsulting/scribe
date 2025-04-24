'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { ExpenseTable } from "@/components/dashboard/expense-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSupabaseClient, checkAuthStatus } from '@/utils/supabase-client';
import { useRouter } from 'next/navigation';

type PeriodType = 'daily' | 'monthly' | 'quarterly' | 'yearly';

export function DashboardPage() {
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2024, 0, 1),
    to: new Date(),
  });
  const [tableStartDate, setTableStartDate] = useState<Date>(new Date());
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  // タグ一覧の取得
  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true);
      try {
        const supabase = getSupabaseClient();
        
        const { data, error } = await supabase
          .from('tags')
          .select('name')
          .order('name');
        
        if (error) {
          console.error('タグ取得エラー:', error);
          setAvailableTags(['全て']);
        } else if (data && data.length > 0) {
          // データベースから取得したタグを設定
          const tagNames = ['全て', ...data.map(tag => tag.name)];
          setAvailableTags(tagNames);
        } else {
          setAvailableTags(['全て']);
        }
      } catch (err) {
        console.error('タグ取得中にエラーが発生しました:', err);
        setAvailableTags(['全て']);
      } finally {
        setLoadingTags(false);
      }
    };
    
    fetchTags();
  }, []);

  // 認証状態の確認
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('【DashboardPage】認証状態を確認します');
        const { isAuthenticated, error } = await checkAuthStatus();
        
        if (error) {
          console.error('【DashboardPage】認証エラー:', error);
          setAuthError('認証エラーが発生しました。再ログインが必要かもしれません。');
        } else if (!isAuthenticated) {
          setAuthError('ログインしていません。');
        } else {
          console.log('【DashboardPage】認証成功');
        }
      } catch (err) {
        console.error('【DashboardPage】認証チェックエラー:', err);
        setAuthError('予期せぬエラーが発生しました。');
      }
    };
    
    checkAuth();
  }, [router]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">ダッシュボード</h1>
            <p className="text-muted-foreground">
              支出の分析と可視化
            </p>
          </div>

          {authError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>認証エラー</AlertTitle>
              <AlertDescription>
                {authError} - モックデータで表示します。
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <Select value={period} onValueChange={(value: PeriodType) => setPeriod(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="集計期間" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">日次</SelectItem>
                  <SelectItem value="monthly">月次</SelectItem>
                  <SelectItem value="quarterly">四半期</SelectItem>
                  <SelectItem value="yearly">年間</SelectItem>
                </SelectContent>
              </Select>

              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onSelect={setDateRange}
              />

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      'w-[300px] justify-between',
                      !selectedTags.length && 'text-muted-foreground'
                    )}
                  >
                    {selectedTags.length > 0
                      ? `${selectedTags.length}個のタグを選択中`
                      : 'タグを選択'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-4">
                  <div className="space-y-4">
                    {loadingTags ? (
                      <div className="flex justify-center items-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">タグを読み込み中...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {availableTags.slice(1).map((tag) => (
                          <Button
                            key={tag}
                            variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                            className="justify-start"
                            onClick={() => {
                              setSelectedTags(
                                selectedTags.includes(tag)
                                  ? selectedTags.filter((t) => t !== tag)
                                  : [...selectedTags, tag]
                              );
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedTags.includes(tag) ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {tag}
                          </Button>
                        ))}
                      </div>
                    )}
                    {selectedTags.length > 0 && (
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setSelectedTags([])}
                      >
                        選択をクリア
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <ExpenseChart
              period={period}
              dateRange={dateRange}
              selectedTags={selectedTags}
            />

            <div className="mt-8">
              <ExpenseTable
                startDate={tableStartDate}
                onDateChange={setTableStartDate}
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}