'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload, Search, Tag as TagIcon } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Papa from 'papaparse';
import jschardet from 'jschardet';
import iconv from 'iconv-lite';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { findMatchingTag } from '@/lib/utils/tag-matcher'; 
import { Tag } from '@/types/tags';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
}

interface ProcessedTransaction {
  id: string;
  import_id: string;
  user_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  tag: string | null;
  selected_tag?: string | null;
}

export default function ImportPage() {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [processedTransactions, setProcessedTransactions] = useState<ProcessedTransaction[]>([]);
  const [isMatchingDialogOpen, setIsMatchingDialogOpen] = useState(false);
  const [importHistoryId, setImportHistoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState<ProcessedTransaction[]>([]);
  const [bulkTagSelectOpen, setBulkTagSelectOpen] = useState(false);
  const [selectedTagForBulk, setSelectedTagForBulk] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // タグデータの取得
  useEffect(() => {
    const fetchTags = async () => {
      try {
        // タグを取得
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('*');

        if (tagsError) throw tagsError;

        // タグに関連するルールを取得
        const { data: rulesData, error: rulesError } = await supabase
          .from('tag_rules')
          .select('*');

        if (rulesError) throw rulesError;

        // タグにルールをマッピング
        const tagsWithRules = tagsData.map(tag => ({
          ...tag,
          rules: rulesData.filter(rule => rule.tag_id === tag.id)
        }));

        setTags(tagsWithRules);
      } catch (error) {
        console.error('タグの取得中にエラーが発生しました:', error);
        setError('タグデータの読み込みに失敗しました。');
      }
    };

    fetchTags();
  }, [supabase]);

  const processCSV = async () => {
    if (!csvData || !columnMapping) return;
    setError(null);
    setProgress(0);

    try {
      // インポート履歴の作成
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('認証されていません。');
      }

      const { data: importHistory, error: importError } = await supabase
        .from('import_history')
        .insert({
          filename: 'imported_data.csv',
          status: 'processing',
          user_id: user.id,
          success_count: 0,
          error_count: 0
        })
        .select()
        .single();

      if (importError) throw importError;
      
      setImportHistoryId(importHistory.id);

      const totalRows = csvData.length;
      let processedRows = 0;
      let errorCount = 0;
      let processed: ProcessedTransaction[] = [];

      // 日付形式を検証・変換する関数
      const validateDate = (dateStr: string): string => {
        if (!dateStr) {
          console.warn('Empty date value, using current date');
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        }
        
        // 入力値がISO形式の日付文字列ならそのまま返す
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
          return dateStr.split('T')[0]; // 時間部分があれば削除
        }
        
        // 日本語の年月日形式を変換 (例: 2023年1月1日 -> 2023-01-01)
        if (/^\d{4}年\d{1,2}月\d{1,2}日/.test(dateStr)) {
          const match = dateStr.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日/);
          if (match) {
            const [_, year, month, day] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        
        // スラッシュ区切りの形式を変換 (例: 2023/1/1 -> 2023-01-01)
        if (/^\d{4}\/\d{1,2}\/\d{1,2}/.test(dateStr)) {
          const match = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
          if (match) {
            const [_, year, month, day] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        
        // スラッシュ区切りの形式 (月/日/年) を変換 (例: 1/1/2023 -> 2023-01-01)
        if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
          const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (match) {
            const [_, month, day, year] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        
        // いずれの形式にも合わない場合は現在の日付を返す
        console.warn(`Invalid date format: ${dateStr}, using current date`);
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      };

      // データを処理
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          // 金額の変換
          const amount = parseInt(String(row[columnMapping.amount]).replace(/[,¥￥\s]/g, ''), 10);
          if (isNaN(amount)) {
            throw new Error('金額の変換に失敗しました');
          }
          
          // 日付形式を検証・変換
          const dateValue = row[columnMapping.date];
          const validatedDate = validateDate(dateValue);
          
          // 摘要からマッチするタグを検索
          const description = row[columnMapping.description];
          const matchedTag = findMatchingTag(description, tags);
          
          processed.push({
            id: `temp-${i}`,
            import_id: importHistory.id,
            user_id: user.id,
            transaction_date: validatedDate,
            description: description || '名称なし', // 空の場合はデフォルト値
            amount: amount,
            tag: matchedTag,
            selected_tag: matchedTag // 初期値はマッチしたタグ
          });
        } catch (error: unknown) {
          errorCount++;
          console.error('Row processing error:', error instanceof Error ? error.message : String(error), row);
        }
        
        processedRows++;
        setProgress((processedRows / totalRows) * 100);
      }

      // 処理されたデータの最初の10件をログに出力（デバッグ用）
      console.log('Processed first 10 transactions:', processed.slice(0, 10));

      setProcessedTransactions(processed);
      setFilteredTransactions(processed); // 検索用の配列も初期化
      setIsMatchingDialogOpen(true);
    } catch (error: any) {
      console.error('Import error:', error);
      setError(`データの処理中にエラーが発生しました: ${error.message || 'Unknown error'}`);
    }
  };

  const saveProcessedData = async () => {
    if (!importHistoryId || processedTransactions.length === 0) return;
    setError(null);
    setProgress(0);

    try {
      const totalRows = processedTransactions.length;
      let processedRows = 0;
      let successCount = 0;
      let errorCount = 0;

      // バッチ処理のサイズ
      const batchSize = 100;
      const batches = [];

      // 日付形式を検証・変換する関数
      const validateDate = (dateStr: string): string => {
        // 入力値がISO形式の日付文字列ならそのまま返す
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
          return dateStr.split('T')[0]; // 時間部分があれば削除
        }
        
        // 日本語の年月日形式を変換 (例: 2023年1月1日 -> 2023-01-01)
        if (/^\d{4}年\d{1,2}月\d{1,2}日/.test(dateStr)) {
          const match = dateStr.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日/);
          if (match) {
            const [_, year, month, day] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        
        // スラッシュ区切りの形式を変換 (例: 2023/1/1 -> 2023-01-01)
        if (/^\d{4}\/\d{1,2}\/\d{1,2}/.test(dateStr)) {
          const match = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
          if (match) {
            const [_, year, month, day] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        
        // いずれの形式にも合わない場合は現在の日付を返す
        console.warn(`Invalid date format: ${dateStr}, using current date`);
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      };

      // 確定したタグでデータを整形
      for (let i = 0; i < processedTransactions.length; i += batchSize) {
        const batch = processedTransactions.slice(i, i + batchSize).map(transaction => {
          // 日付形式を検証・変換
          const validatedDate = validateDate(transaction.transaction_date);
          
          return {
            import_id: transaction.import_id,
            user_id: transaction.user_id,
            transaction_date: validatedDate,
            description: transaction.description,
            amount: transaction.amount,
            tag: transaction.selected_tag // ユーザーが選択したタグを使用
          };
        });
        
        if (batch.length > 0) {
          batches.push(batch);
        }
      }

      // バッチごとにデータを挿入
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`Inserting batch ${batchIndex + 1}/${batches.length}, records: ${batch.length}`);
        console.log('Sample record:', JSON.stringify(batch[0]));
        
        const { error: insertError } = await supabase
          .from('imported_transactions')
          .insert(batch);

        if (insertError) {
          errorCount += batch.length;
          console.error('Batch insert error:', insertError);
          // エラーの詳細を表示
          console.error('Error details:', JSON.stringify(insertError));
          // 最初の行のみデバッグ出力
          console.error('First row that failed:', JSON.stringify(batch[0]));
          setError(`データの保存中にエラーが発生しました: ${insertError.message || 'Unknown error'}`);
        } else {
          successCount += batch.length;
        }

        processedRows += batch.length;
        setProgress((processedRows / totalRows) * 100);
      }

      // インポート完了を記録
      const finalStatus = errorCount > 0 ? 'completed_with_errors' : 'completed';
      await supabase
        .from('import_history')
        .update({
          status: finalStatus,
          row_count: totalRows,
          success_count: successCount,
          error_count: errorCount
        })
        .eq('id', importHistoryId);

      setProgress(100);
      setCsvData(null);
      setHeaders([]);
      setColumnMapping(null);
      setProcessedTransactions([]);
      setIsMatchingDialogOpen(false);
      setImportHistoryId(null);
    } catch (error: any) {
      console.error('Save error:', error);
      setError(`データの保存中にエラーが発生しました: ${error.message || 'Unknown error'}`);
    }
  };

  const handleTagChange = (transactionId: string, selectedTag: string | null) => {
    setProcessedTransactions(prev => 
      prev.map(transaction => 
        transaction.id === transactionId 
          ? { ...transaction, selected_tag: selectedTag } 
          : transaction
      )
    );
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    try {
      // ファイルの内容を読み込み
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const buffer = Buffer.from(uint8Array);
      
      // エンコーディングを検出（より詳細な検出ロジック）
      const detected = jschardet.detect(buffer);
      console.log('Detected encoding:', detected);  // デバッグ用

      // 日本語のエンコーディングを優先的に確認
      let encoding = 'utf-8';
      let content: string;

      // BOMの確認
      if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        encoding = 'utf-8';
      } else {
        // 各エンコーディングで試行
        const encodings = ['shift-jis', 'utf-8', 'euc-jp'];
        for (const enc of encodings) {
          try {
            const testContent = iconv.decode(buffer, enc);
            // 日本語の文字が含まれているかチェック
            if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(testContent)) {
              encoding = enc;
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }

      content = iconv.decode(buffer, encoding);
      console.log('Using encoding:', encoding);  // デバッグ用
      
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length > 0) {
            console.log('Parsed data sample:', results.data[0]);  // デバッグ用
            setCsvData(results.data);
            setHeaders(Object.keys(results.data[0] as object));
            // 最初の10行（または全行数のうち少ない方）をプレビュー用に保存
            setPreviewRows(results.data.slice(0, 10));
          }
        },
        error: (error: Error) => {
          setError('CSVファイルの解析に失敗しました。');
          console.error('CSV parse error:', error);
        }
      });
    } catch (error: unknown) {
      setError('ファイルの読み込み中にエラーが発生しました。');
      console.error('File reading error:', error);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleColumnSelect = (column: string, type: keyof ColumnMapping) => {
    setColumnMapping(prev => ({
      ...prev,
      [type]: column
    } as ColumnMapping));
  };

  const handleError = (error: unknown): void => {
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError(String(error));
    }
  };

  // トランザクションの検索フィルター
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTransactions(processedTransactions);
      return;
    }

    const filtered = processedTransactions.filter(transaction => 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [searchTerm, processedTransactions]);

  // 一括タグ設定
  const applyBulkTagUpdate = () => {
    if (selectedTagForBulk === null) return;
    
    setProcessedTransactions(prev => 
      prev.map(transaction => {
        // 検索条件に一致する取引のみタグを更新
        if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
          return transaction;
        }
        return { ...transaction, selected_tag: selectedTagForBulk };
      })
    );
    
    setBulkTagSelectOpen(false);
    setSelectedTagForBulk(null);
  };

  // 表示用のトランザクション（検索フィルター適用済み）
  const displayTransactions = filteredTransactions.slice(0, 50);
  const hasMoreTransactions = filteredTransactions.length > 50;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">CSVインポート</h1>
            <p className="text-muted-foreground">
              クレジットカード明細をアップロードして支出を分析
            </p>
          </div>

          {progress > 0 && <Progress value={progress} className="w-full" />}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!csvData ? (
            <Card className="border-2 border-dashed">
              <div
                {...getRootProps()}
                className="flex flex-col items-center justify-center p-12 text-center"
              >
                <input {...getInputProps()} />
                <div className="rounded-full bg-secondary p-4 mb-4">
                  <Upload className="h-8 w-8" />
                </div>
                {isDragActive ? (
                  <p className="text-lg">ファイルをドロップしてください...</p>
                ) : (
                  <>
                    <p className="text-lg mb-2">CSVファイルをドラッグ＆ドロップ</p>
                    <p className="text-sm text-muted-foreground">
                      またはクリックしてファイルを選択
                    </p>
                  </>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">列の選択</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">日付の列</label>
                  <Select onValueChange={(value) => handleColumnSelect(value, 'date')}>
                    <SelectTrigger>
                      <SelectValue placeholder="日付の列を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">摘要の列</label>
                  <Select onValueChange={(value) => handleColumnSelect(value, 'description')}>
                    <SelectTrigger>
                      <SelectValue placeholder="摘要の列を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">金額の列</label>
                  <Select onValueChange={(value) => handleColumnSelect(value, 'amount')}>
                    <SelectTrigger>
                      <SelectValue placeholder="金額の列を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={processCSV}
                  disabled={!columnMapping?.date || !columnMapping?.description || !columnMapping?.amount}
                  className="w-full"
                >
                  インポート開始
                </Button>
              </div>
              
              {/* CSVデータのプレビュー */}
              <div className="mt-8 overflow-x-auto">
                <h3 className="text-lg font-medium mb-2">データプレビュー</h3>
                <div className="border rounded-md">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        {headers.map((header, index) => (
                          <th 
                            key={index}
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-border">
                      {previewRows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {headers.map((header, cellIndex) => (
                            <td 
                              key={cellIndex}
                              className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground"
                            >
                              {String(row[header] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {csvData && csvData.length > previewRows.length && (
                        <tr>
                          <td 
                            colSpan={headers.length} 
                            className="px-6 py-4 text-center text-sm text-muted-foreground bg-muted font-medium italic"
                          >
                            {csvData.length - previewRows.length}行省略 (全{csvData.length}行中)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* タグマッチング結果モーダル */}
      <Dialog open={isMatchingDialogOpen} onOpenChange={(open) => {
        // 閉じる時は確認をして、必要ならフィルターをリセット
        if (!open) {
          setSearchTerm('');
          setFilteredTransactions(processedTransactions);
        }
        setIsMatchingDialogOpen(open);
      }}>
        <DialogContent className="max-w-5xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>タグマッチング結果の確認</DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="摘要で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setBulkTagSelectOpen(true)}
              disabled={filteredTransactions.length === 0}
              className="flex items-center"
            >
              <TagIcon className="mr-2 h-4 w-4" />
              一括タグ設定
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>摘要</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>タグ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.transaction_date}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="text-right">{transaction.amount.toLocaleString()}円</TableCell>
                    <TableCell>
                      <Select 
                        value={transaction.selected_tag || 'none'} 
                        onValueChange={(value) => handleTagChange(transaction.id, value === 'none' ? null : value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="タグなし">
                            {transaction.selected_tag && (
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ 
                                    backgroundColor: tags.find(tag => tag.name === transaction.selected_tag)?.color || '#ccc' 
                                  }} 
                                />
                                {transaction.selected_tag}
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
                    </TableCell>
                  </TableRow>
                ))}
                {hasMoreTransactions && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      他 {filteredTransactions.length - displayTransactions.length} 件のトランザクションがあります
                    </TableCell>
                  </TableRow>
                )}
                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      一致する取引がありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setIsMatchingDialogOpen(false);
            }}>
              キャンセル
            </Button>
            <Button onClick={saveProcessedData}>
              確定してインポート
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 一括タグ設定モーダル */}
      <Dialog open={bulkTagSelectOpen} onOpenChange={setBulkTagSelectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>一括タグ設定</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 
                `「${searchTerm}」を含む ${filteredTransactions.length} 件の取引に一括でタグを設定します` : 
                `${filteredTransactions.length} 件の取引に一括でタグを設定します`}
            </p>
            
            <Select 
              value={selectedTagForBulk || 'none'} 
              onValueChange={(value) => setSelectedTagForBulk(value === 'none' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="タグを選択">
                  {selectedTagForBulk && (
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: tags.find(tag => tag.name === selectedTagForBulk)?.color || '#ccc' }} 
                      />
                      {selectedTagForBulk}
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkTagSelectOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={applyBulkTagUpdate} disabled={selectedTagForBulk === null}>
              適用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}