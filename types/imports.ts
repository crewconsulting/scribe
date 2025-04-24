export interface ImportedTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  tag: string | null;
  newCategory?: string | null; // 再マッチング後の新しいタグ
  selectedCategory?: string | null; // ユーザーが選択したタグ
  hasChanged?: boolean; // タグが変更されたかどうかを示すフラグ
}

export interface ImportHistory {
  id: string;
  filename: string;
  created_at: string;
  totalCount: number;
  transactions: ImportedTransaction[];
}