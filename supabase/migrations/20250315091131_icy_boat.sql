/*
  # Add bio field to profiles table

  1. Schema Changes
    - Add `bio` column to the `profiles` table for user descriptions/about me
  2. Default Values
    - Set default to empty string
*/

-- Add bio column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text DEFAULT '';
  END IF;
END $$;