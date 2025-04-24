'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  startOfDay,
  endOfDay,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachYearOfInterval,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { Transaction } from '@/types/transactions';
import { getSupabaseClient } from '@/utils/supabase-client';

interface ExpenseChartProps {
  period: 'daily' | 'monthly' | 'quarterly' | 'yearly';
  dateRange: { from: Date; to: Date };
  selectedTags: string[];
}

export function ExpenseChart({ period, dateRange, selectedTags }: ExpenseChartProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Supabaseからデータを取得
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const supabase = getSupabaseClient();
        
        // 日付範囲に基づいてデータ取得
        const { data, error } = await supabase
          .from('imported_transactions')
          .select('id, transaction_date, amount, description, tag')
          .gte('transaction_date', dateRange.from.toISOString())
          .lte('transaction_date', dateRange.to.toISOString());

        if (error) {
          console.error('取引データ取得エラー:', error);
          setTransactions([]);
        } else if (data) {
          // データマッピング
          const mappedData: Transaction[] = data.map(item => ({
            id: typeof item.id === 'number' ? item.id : parseInt(item.id),
            date: item.transaction_date,
            amount: item.amount,
            description: item.description || '',
            tag: item.tag || null,
          }));
          setTransactions(mappedData);
        }
      } catch (err) {
        console.error('データ取得中にエラーが発生しました:', err);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [dateRange]);

  const data = useMemo(() => {
    const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) };
    
    let dates;
    switch (period) {
      case 'daily':
        dates = eachDayOfInterval(interval);
        break;
      case 'monthly':
        dates = eachMonthOfInterval(interval);
        break;
      case 'quarterly':
        dates = eachQuarterOfInterval(interval);
        break;
      case 'yearly':
        dates = eachYearOfInterval(interval);
        break;
    }

    const filteredTransactions = transactions.filter(
      transaction => {
        const date = new Date(transaction.date);
        return isWithinInterval(date, interval);
      }
    );

    const formatDate = (date: Date) => {
      switch (period) {
        case 'daily':
          return format(date, 'MM/dd', { locale: ja });
        case 'monthly':
          return format(date, 'yyyy年MM月', { locale: ja });
        case 'quarterly':
          return `${format(date, 'yyyy年', { locale: ja })}Q${Math.floor(date.getMonth() / 3) + 1}`;
        case 'yearly':
          return format(date, 'yyyy年', { locale: ja });
      }
    };

    return dates.map(date => {
      const dataPoint: any = {
        name: formatDate(date),
      };

      // タグが選択されていない場合は合計のみ表示
      if (selectedTags.length === 0) {
        const total = filteredTransactions
          .filter(t => {
            const transactionDate = new Date(t.date);
            switch (period) {
              case 'daily':
                return format(transactionDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
              case 'monthly':
                return format(transactionDate, 'yyyy-MM') === format(date, 'yyyy-MM');
              case 'quarterly':
                return format(transactionDate, 'yyyy') === format(date, 'yyyy') &&
                  Math.floor(transactionDate.getMonth() / 3) === Math.floor(date.getMonth() / 3);
              case 'yearly':
                return format(transactionDate, 'yyyy') === format(date, 'yyyy');
            }
          })
          .reduce((sum, t) => sum + t.amount, 0);

        dataPoint['合計'] = total;
      } else {
        // 選択されたタグごとの金額を計算
        selectedTags.forEach(tag => {
          const amount = filteredTransactions
            .filter(t => {
              const transactionDate = new Date(t.date);
              let isInPeriod;
              switch (period) {
                case 'daily':
                  isInPeriod = format(transactionDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                  break;
                case 'monthly':
                  isInPeriod = format(transactionDate, 'yyyy-MM') === format(date, 'yyyy-MM');
                  break;
                case 'quarterly':
                  isInPeriod = format(transactionDate, 'yyyy') === format(date, 'yyyy') &&
                    Math.floor(transactionDate.getMonth() / 3) === Math.floor(date.getMonth() / 3);
                  break;
                case 'yearly':
                  isInPeriod = format(transactionDate, 'yyyy') === format(date, 'yyyy');
                  break;
              }
              return isInPeriod && t.tag === tag;
            })
            .reduce((sum, t) => sum + t.amount, 0);

          dataPoint[tag] = amount;
        });
      }

      return dataPoint;
    });
  }, [period, dateRange, selectedTags, transactions]);

  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  return (
    <div className="h-[500px] w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name"
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <YAxis
            tickFormatter={(value) => `¥${(value / 10000).toLocaleString()}万`}
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <Tooltip
            formatter={(value: number) => `¥${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
            }}
          />
          <Legend />
          {(selectedTags.length > 0 ? selectedTags : ['合計']).map((tag, index) => (
            <Line
              key={tag}
              type="monotone"
              dataKey={tag}
              name={tag}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}