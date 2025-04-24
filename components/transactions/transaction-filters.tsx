'use client';

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TRANSACTION_TAGS } from '@/lib/mock-data/transactions';
import type { TransactionFilters } from "@/types/transactions";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: Partial<TransactionFilters>) => void;
  totalAmount: number;
  totalCount: number;
}

// 1ページあたりの表示件数オプション
const PAGE_SIZES = [10, 20, 50, 100];

export function TransactionFilters({
  filters,
  onFiltersChange,
  totalAmount,
  totalCount,
}: TransactionFiltersProps) {
  // ハイドレーション対策のためのマウント状態管理
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto] gap-8">
        {/* フィルターコントロール */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* 検索ボックス */}
            <Input
              placeholder="取引を検索..."
              value={filters.searchTerm}
              onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
              className="w-[300px]"
            />
            {/* タグフィルター */}
            <Select
              value={filters.selectedTag}
              onValueChange={(value) => onFiltersChange({ selectedTag: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="タグで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_TAGS.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* 表示件数選択 */}
            <Select
              value={filters.pageSize.toString()}
              onValueChange={(value) => onFiltersChange({ pageSize: parseInt(value) })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="表示件数" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}件表示
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 期間選択 */}
          <DateRangePicker
            from={filters.dateRange.from}
            to={filters.dateRange.to}
            onSelect={(range) => onFiltersChange({ dateRange: range })}
          />
        </div>

        {/* 集計情報 */}
        <Card className="p-4 min-w-[200px]">
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">
              {mounted ? (
                `${totalCount}件中 ${filters.pageSize * (filters.page - 1) + 1} - ${Math.min(filters.pageSize * filters.page, totalCount)}件を表示`
              ) : ''}
            </p>
            <p className="text-2xl font-bold truncate" title={`¥${totalAmount.toLocaleString()}`}>
              {mounted ? `¥${totalAmount.toLocaleString()}` : ''}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}