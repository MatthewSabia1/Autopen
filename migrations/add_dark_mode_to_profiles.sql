-- Add dark_mode column to profiles table
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "dark_mode" BOOLEAN DEFAULT FALSE;

-- Update existing rows to have default value
UPDATE "public"."profiles" SET "dark_mode" = FALSE WHERE "dark_mode" IS NULL;
