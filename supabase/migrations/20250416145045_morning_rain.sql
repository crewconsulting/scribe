/*
  # Enable public access to transactions table

  1. Security Changes
    - Remove existing RLS policies
    - Add new policies that allow public access
    - Keep RLS enabled but allow all operations

  Note: This is for development purposes only. In production, proper authentication should be implemented.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable update access for all users" ON transactions;

-- Create new policies that allow public access
CREATE POLICY "Allow public read access"
  ON transactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access"
  ON transactions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON transactions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access"
  ON transactions
  FOR DELETE
  TO public
  USING (true);