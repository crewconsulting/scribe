'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ImportHistory } from '@/types/imports';
import { Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportHistoryTableProps {
  imports: ImportHistory[];
  onSelectImport: (history: ImportHistory) => void;
  onDeleteImport: (history: ImportHistory) => void;
  isProcessing: boolean;
  isLoading?: boolean;
}

export function ImportHistoryTable({
  imports,
  onSelectImport,
  onDeleteImport,
  isProcessing,
  isLoading = false
}: ImportHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        データを読み込み中...
      </div>
    );
  }

  if (!imports.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        インポート履歴がありません
      </div>
    );
  }

  return (
    <ScrollArea className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">インポート日時</TableHead>
            <TableHead className="min-w-[300px]">ファイル名</TableHead>
            <TableHead className="min-w-[100px]">取込件数</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {imports.map((history) => (
            <TableRow key={history.id}>
              <TableCell>
                {(() => {
                  try {
                    const date = new Date(history.created_at);
                    if (isNaN(date.getTime())) {
                      return '日付不明';
                    }
                    return format(date, 'yyyy/MM/dd HH:mm:ss', { locale: ja });
                  } catch (error) {
                    return '日付不明';
                  }
                })()}
              </TableCell>
              <TableCell>
                <Button
                  variant="link"
                  className="p-0 h-auto text-left"
                  onClick={() => onSelectImport(history)}
                >
                  {history.filename}
                </Button>
              </TableCell>
              <TableCell>
                {history.totalCount}
              </TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteImport(history)}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}