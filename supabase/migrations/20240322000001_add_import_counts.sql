-- import_historyテーブルにカラムを追加
ALTER TABLE import_history
ADD COLUMN IF NOT EXISTS success_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_message text; 