"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { DatePickerWithRange } from "@/components/ui/date-range-picker"; // 使用していないためコメントアウト
import { useTheme } from "next-themes";
import { AreaChart, BarChart, LineChart } from "@tremor/react";
import { addMonths, format, startOfMonth, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { getSupabaseClient, checkAuthStatus } from "@/utils/supabase-client";
import { Database } from "@/types/supabase";

// インターフェースの定義
interface Tag {
  id: number;
  name: string;
}

interface Transaction {
  id: number;
  transaction_date: string;
  amount: number;
  description: string;
  tag: string | null;
}

interface ChartDataItem {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
}

interface MonthlyData {
  month: string;
  出費: number;
  収入: number;
  [key: string]: number | string; // タグ別の集計データ用
}

export default function ExpenseSummary() {
  console.log('【ExpenseSummary】コンポーネントがレンダリングされました');
  
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem | null>(null);
  const [period, setPeriod] = useState<"3M" | "6M" | "1Y">("6M");
  const [error, setError] = useState<string | null>(null);

  // 最終月の設定
  const lastMonth = startOfMonth(new Date());
  
  // 期間に応じた開始月の計算
  const getStartMonth = () => {
    switch (period) {
      case "3M": return subMonths(lastMonth, 2);
      case "6M": return subMonths(lastMonth, 5);
      case "1Y": return subMonths(lastMonth, 11);
    }
  };

  // タグ情報の取得
  const fetchTags = async () => {
    try {
      console.log('【ExpenseSummary】タグ情報を取得します');
      
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('tags')
        .select('id, name');

      if (error) {
        console.error('【ExpenseSummary】タグ取得エラー:', error.message);
        setError(`タグの取得に失敗しました: ${error.message}`);
        return [];
      }

      if (data) {
        console.log('【ExpenseSummary】取得したタグデータ:', data);
        setTags(data);
        return data;
      }
      
      return [];
    } catch (e) {
      console.error('【ExpenseSummary】タグ取得エラー (例外):', e);
      setError('タグ取得中に例外が発生しました');
      return [];
    }
  };

  // Supabaseからデータを取得
  const fetchData = async () => {
    console.log('【ExpenseSummary】データ取得を開始します');
    setIsLoading(true);
    setChartData(null); // データリセット
    setError(null);
    
    try {
      // 認証状態を確認
      const authStatus = await checkAuthStatus();
      console.log('【ExpenseSummary】認証状態:', authStatus);
      setIsAuthenticated(authStatus.isAuthenticated);
      
      // タグ情報の取得
      const tagData = await fetchTags();
      
      // 開始月と終了月の設定
      const startMonth = getStartMonth();
      const endMonth = addMonths(lastMonth, 1);  // 次の月の初日（終了日として使用）
      
      console.log('【ExpenseSummary】月次集計取得期間:', {
        startMonth: format(startMonth, 'yyyy-MM-dd'),
        endMonth: format(endMonth, 'yyyy-MM-dd')
      });
      
      // 月ごとの合計を計算するための初期化
      const monthlyTotals: { [key: string]: { 出費: number; 収入: number; [key: string]: number } } = {};
      
      // 表示する月のリストを初期化
      let currentMonth = startMonth;
      while (currentMonth < endMonth) {
        const monthKey = format(currentMonth, 'yyyy-MM');
        
        // 初期値として出費と収入、およびタグごとの集計用の空のオブジェクトを設定
        const initialData: { 出費: number; 収入: number; [key: string]: number } = { 
          出費: 0, 
          収入: 0 
        };
        
        // タグごとの集計用の初期値を設定
        tagData.forEach(tag => {
          initialData[tag.name] = 0;
        });
        
        monthlyTotals[monthKey] = initialData;
        currentMonth = addMonths(currentMonth, 1);
      }
      
      // 認証済みの場合のみトランザクションデータ取得を試みる
      if (authStatus.isAuthenticated) {
        try {
          console.log('【ExpenseSummary】imported_transactionsテーブルからデータを取得します', {
            期間開始: startMonth.toISOString(),
            期間終了: endMonth.toISOString()
          });

          const supabase = getSupabaseClient();
          
          try {
            // RLSポリシーを確認
            console.log('【ExpenseSummary】テーブルアクセス権限を確認します');
            const { data: testData, error: testError } = await supabase
              .from('imported_transactions')
              .select('count()', { count: 'exact', head: true });
            
            if (testError) {
              console.error('【ExpenseSummary】テーブルアクセスエラー:', testError);
              setError(`データベースアクセスエラー: ${testError.message}`);
            } else {
              console.log('【ExpenseSummary】テーブルアクセス確認OK、レコード数:', testData);
            }

            // 取引データの取得
            const { data, error } = await supabase
              .from('imported_transactions')
              .select('id, transaction_date, amount, description, tag')
              .gte('transaction_date', startMonth.toISOString())
              .lt('transaction_date', endMonth.toISOString());
      
            if (error) {
              console.log('【ExpenseSummary】取引取得エラー:', error.message);
              console.error('【ExpenseSummary】エラー詳細', {
                コード: error.code,
                詳細: error.details,
                ヒント: error.hint,
                メッセージ: error.message
              });
              setError(`取引データの取得に失敗しました: ${error.message}`);
            } else if (data && data.length > 0) {
              console.log(`【ExpenseSummary】取得した取引データ: ${data.length}件`, {
                最初の5件: data.slice(0, 5),
                データ型チェック: {
                  配列かどうか: Array.isArray(data),
                  長さ: data.length
                }
              });
              // 実データの集計処理
              processTransactions(data, monthlyTotals, tagData);
            } else {
              console.log('【ExpenseSummary】取得したデータがありません', {
                クエリ結果: data,
                クエリ期間: {
                  開始: startMonth.toISOString(),
                  終了: endMonth.toISOString()
                },
                テーブル: 'imported_transactions'
              });
            }
          } catch (queryError) {
            console.error('【ExpenseSummary】クエリ実行中に例外が発生:', queryError);
            setError('データ取得中に例外が発生しました');
          }
        } catch (transactionError) {
          console.error('【ExpenseSummary】トランザクションデータ処理中にエラー:', transactionError);
          setError('トランザクションデータの処理中にエラーが発生しました');
        }
      } else {
        console.log('【ExpenseSummary】非認証状態のため、実データは取得せずに空のグラフを表示します');
      }
      
      // グラフ用データ形式に変換（データがあってもなくても月の枠は表示）
      const formattedData = Object.keys(monthlyTotals).map(month => {
        // 基本的な月別データ
        const monthData: MonthlyData = {
          month: format(new Date(month + '-01'), 'M月', { locale: ja }),
          出費: Math.round(monthlyTotals[month].出費),
          収入: Math.round(monthlyTotals[month].収入)
        };
        
        // タグ別のデータを追加
        tagData.forEach(tag => {
          if (tag.name in monthlyTotals[month]) {
            monthData[tag.name] = Math.round(monthlyTotals[month][tag.name]);
          } else {
            monthData[tag.name] = 0;
          }
        });
        
        return monthData;
      });
      
      // 月順にソート
      formattedData.sort((a, b) => {
        const monthAKey = Object.keys(monthlyTotals).find(key => 
          format(new Date(key + '-01'), 'M月', { locale: ja }) === a.month) || '';
        const monthBKey = Object.keys(monthlyTotals).find(key => 
          format(new Date(key + '-01'), 'M月', { locale: ja }) === b.month) || '';
        return new Date(monthAKey).getTime() - new Date(monthBKey).getTime();
      });
      
      console.log('【ExpenseSummary】集計後のグラフデータ:', formattedData);
      setMonthlyData(formattedData);
      
    } catch (e) {
      console.error('【ExpenseSummary】データ取得エラー:', e);
      setError('データ取得中にエラーが発生しました');
      // エラー時は空のデータセット
      setMonthlyData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 期間変更時にデータを再取得
  useEffect(() => {
    console.log('【ExpenseSummary】期間変更トリガー:', period);
    fetchData();
  }, [period]);

  // 初期レンダリング時に実行
  useEffect(() => {
    console.log('【ExpenseSummary】コンポーネントがマウントされました');
    // コンポーネントIDを生成して追跡用に使用
    const componentId = Math.random().toString(36).substring(7);
    console.log(`【ExpenseSummary-${componentId}】コンポーネントIDが割り当てられました`);
  }, []);

  // チャートに表示するカテゴリー
  const chartCategories = ["出費", "収入", ...tags.map(tag => tag.name)];

  // トランザクションデータ処理関数
  const processTransactions = (transactions: Transaction[], monthlyTotals: any, tagData: Tag[]) => {
    console.log(`【ExpenseSummary】トランザクションデータを処理します: ${transactions.length}件`);
    
    transactions.forEach((transaction: Transaction) => {
      try {
        const date = new Date(transaction.transaction_date);
        const monthKey = format(date, 'yyyy-MM');
        
        if (monthlyTotals[monthKey]) {
          // 支出か収入かを判定
          if (transaction.amount < 0) {
            // 支出（出費）は正の値に変換して表示
            monthlyTotals[monthKey].出費 += Math.abs(transaction.amount);
          } else {
            // 収入
            monthlyTotals[monthKey].収入 += transaction.amount;
          }
          
          // タグ別の集計
          if (transaction.tag) {
            // タグ名が一致するか確認
            const matchingTag = tagData.find(tag => 
              tag.name.toLowerCase() === transaction.tag?.toLowerCase());
            
            if (matchingTag) {
              // 一致するタグが見つかった場合
              console.log(`【ExpenseSummary】タグマッチ: ${transaction.tag} -> ${matchingTag.name}`);
              monthlyTotals[monthKey][matchingTag.name] += Math.abs(transaction.amount);
            } else if (transaction.tag in monthlyTotals[monthKey]) {
              // タグ名が直接一致する場合
              monthlyTotals[monthKey][transaction.tag] += Math.abs(transaction.amount);
            } else {
              console.log(`【ExpenseSummary】タグ不一致: ${transaction.tag}`);
            }
          }
        }
      } catch (e) {
        console.error('【ExpenseSummary】データ集計エラー:', e, transaction);
      }
    });
  };

  // コンポーネントのレンダリングを確認
  console.log('【ExpenseSummary】JSXを返します');

  return (
    <Card>
      <CardHeader>
        <CardTitle>月別支出サマリー</CardTitle>
        <CardDescription>
          期間を選択して月ごとの支出と収入を確認できます
          {!isAuthenticated && isAuthenticated !== null && (
            <span className="ml-2 text-yellow-500">（ログインするとデータが表示されます）</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="6M" className="mb-4">
          <TabsList>
            <TabsTrigger value="3M" onClick={() => setPeriod("3M")}>3ヶ月</TabsTrigger>
            <TabsTrigger value="6M" onClick={() => setPeriod("6M")}>6ヶ月</TabsTrigger>
            <TabsTrigger value="1Y" onClick={() => setPeriod("1Y")}>1年</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center items-center h-72">
            <p>データ読み込み中...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-72 text-red-500">
            <p>エラー: {error}</p>
          </div>
        ) : (
          <div>
            {!isAuthenticated && isAuthenticated !== null && (
              <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ログインすると実際の取引データが表示されます。現在は空のグラフが表示されています。
                </p>
              </div>
            )}
            <Tabs defaultValue="bar">
              <TabsList className="mb-4">
                <TabsTrigger value="bar">棒グラフ</TabsTrigger>
                <TabsTrigger value="line">折れ線</TabsTrigger>
                <TabsTrigger value="area">エリア</TabsTrigger>
              </TabsList>
              
              <TabsContent value="bar">
                <div className="h-80">
                  <BarChart
                    className="h-full"
                    data={monthlyData}
                    index="month"
                    categories={["出費", "収入"]}
                    colors={["red", "green"]}
                    valueFormatter={(number: number) => `${number.toLocaleString()}円`}
                    showLegend={true}
                    showAnimation={true}
                    yAxisWidth={80}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="line">
                <div className="h-80">
                  <LineChart
                    className="h-full"
                    data={monthlyData}
                    index="month"
                    categories={["出費", "収入"]}
                    colors={["red", "green"]}
                    valueFormatter={(number: number) => `${number.toLocaleString()}円`}
                    showLegend={true}
                    showAnimation={true}
                    showXAxis={true}
                    showYAxis={true}
                    yAxisWidth={80}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="area">
                <div className="h-80">
                  <AreaChart
                    className="h-full"
                    data={monthlyData}
                    index="month"
                    categories={["出費", "収入"]}
                    colors={["red", "green"]}
                    valueFormatter={(number: number) => `${number.toLocaleString()}円`}
                    showLegend={true}
                    showAnimation={true}
                    showXAxis={true}
                    showYAxis={true}
                    yAxisWidth={80}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={fetchData} disabled={isLoading}>
          更新
        </Button>
      </CardFooter>
    </Card>
  );
} 