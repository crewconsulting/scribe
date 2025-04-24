/*
  # Create import history and format tables

  1. New Tables
    - `import_formats`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `column_mappings` (jsonb, not null)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `import_history`
      - `id` (uuid, primary key)
      - `filename` (text, not null)
      - `format_id` (uuid, references import_formats)
      - `row_count` (integer, not null)
      - `success_count` (integer, not null)
      - `error_count` (integer, not null)
      - `error_details` (jsonb)
      - `created_at` (timestamptz)
      - `user_id` (text)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (development only)
*/

-- Create import_formats table
CREATE TABLE IF NOT EXISTS import_formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  column_mappings jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create import_history table
CREATE TABLE IF NOT EXISTS import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  format_id uuid REFERENCES import_formats(id),
  row_count integer NOT NULL,
  success_count integer NOT NULL,
  error_count integer NOT NULL,
  error_details jsonb,
  created_at timestamptz DEFAULT now(),
  user_id text
);

-- Enable RLS
ALTER TABLE import_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (development only)
CREATE POLICY "import_formats_policy"
  ON import_formats
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "import_history_policy"
  ON import_history
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Insert default import formats
INSERT INTO import_formats (name, description, column_mappings) VALUES
  ('デフォルト', 'デフォルトのCSVフォーマット', '{
    "date": {
      "index": 0,
      "formats": ["yyyy/MM/dd", "yyyy-MM-dd", "yyyy年MM月dd日"]
    },
    "amount": {
      "index": 1,
      "type": "number",
      "removeChars": ["¥", ","]
    },
    "description": {
      "index": 2,
      "type": "text"
    }
  }'),
  ('クレジットカード明細', 'クレジットカード明細のCSVフォーマット', '{
    "date": {
      "index": 0,
      "formats": ["yyyy/MM/dd", "yyyy-MM-dd", "yyyy年MM月dd日"]
    },
    "amount": {
      "index": 2,
      "type": "number",
      "removeChars": ["¥", ","]
    },
    "description": {
      "index": 1,
      "type": "text"
    }
  }');