-- CSVインポート履歴を管理するテーブル
CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  row_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- インポートされた取引データを保存するテーブル
CREATE TABLE IF NOT EXISTS imported_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES import_history(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLSポリシーの設定
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_transactions ENABLE ROW LEVEL SECURITY;

-- インポート履歴のポリシー
CREATE POLICY "Users can view their own import history"
  ON import_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import history"
  ON import_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import history"
  ON import_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 取引データのポリシー
CREATE POLICY "Users can view their own transactions"
  ON imported_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON imported_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- インデックスの作成
CREATE INDEX idx_import_history_user_id ON import_history(user_id);
CREATE INDEX idx_imported_transactions_user_id ON imported_transactions(user_id);
CREATE INDEX idx_imported_transactions_import_id ON imported_transactions(import_id);
CREATE INDEX idx_imported_transactions_date ON imported_transactions(transaction_date); 