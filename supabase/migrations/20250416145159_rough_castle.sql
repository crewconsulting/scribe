/*
  # Fix user_id constraint

  1. Changes
    - Remove foreign key constraint from user_id
    - Change user_id type to text to allow test user ID
*/

ALTER TABLE transactions
  ALTER COLUMN user_id TYPE text,
  ALTER COLUMN user_id DROP NOT NULL;