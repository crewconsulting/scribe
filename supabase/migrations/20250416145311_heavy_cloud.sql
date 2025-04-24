/*
  # Update RLS policies for transactions table

  1. Changes
    - Drop existing policies
    - Create new public access policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable update access for all users" ON transactions;
DROP POLICY IF EXISTS "Allow public read access" ON transactions;
DROP POLICY IF EXISTS "Allow public insert access" ON transactions;
DROP POLICY IF EXISTS "Allow public update access" ON transactions;
DROP POLICY IF EXISTS "Allow public delete access" ON transactions;

-- Create new policies
CREATE POLICY "transactions_policy"
  ON transactions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);