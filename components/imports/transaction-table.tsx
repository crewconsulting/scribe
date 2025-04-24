'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ImportedTransaction } from '@/types/imports';
import { Tag } from '@/types/tags';
import { Check, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TransactionTableProps {
  transactions: ImportedTransaction[];
  onCategorySelect: (transactionId: string, category: string) => void;
  tags: Tag[];
}

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return '日付不明';
    }
    return format(date, 'yyyy年MM月dd日', { locale: ja });
  } catch (error) {
    return '日付不明';
  }
};

export function TransactionTable({
  transactions,
  onCategorySelect,
  tags,
}: TransactionTableProps) {
  return (
    <ScrollArea className="h-[calc(100vh-400px)] rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">日付</TableHead>
            <TableHead className="min-w-[300px]">摘要</TableHead>
            <TableHead className="min-w-[200px]">タグ</TableHead>
            <TableHead className="min-w-[150px]">金額</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const hasChanged = transaction.hasChanged;
            const tagColor = transaction.selectedCategory 
              ? tags.find(tag => tag.name === transaction.selectedCategory)?.color || '#ccc'
              : '#ccc';
            
            return (
              <TableRow key={transaction.id} className={cn(
                hasChanged && "bg-warning/10"
              )}>
                <TableCell>
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell className="break-all">{transaction.description}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {hasChanged && transaction.tag !== null && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-1">現在:</span>
                        <Badge variant="outline" className="font-normal">
                          {transaction.tag || '未分類'}
                        </Badge>
                      </div>
                    )}
                    
                    <Select
                      value={transaction.selectedCategory || 'none'}
                      onValueChange={(value) => onCategorySelect(transaction.id, value === 'none' ? '' : value)}
                      disabled={!hasChanged}
                    >
                      <SelectTrigger className={cn(
                        "w-full",
                        hasChanged && "border-warning bg-background"
                      )}>
                        <SelectValue placeholder="タグなし">
                          {transaction.selectedCategory && (
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: tagColor }} 
                              />
                              {transaction.selectedCategory}
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">タグなし</SelectItem>
                        {tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.name}>
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                              {tag.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {hasChanged && (
                      <div className="flex items-center gap-1 text-xs text-warning-foreground">
                        <AlertTriangle className="h-3 w-3" />
                        <span>新しいタグルールで変更されました</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  ¥{transaction.amount.toLocaleString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}