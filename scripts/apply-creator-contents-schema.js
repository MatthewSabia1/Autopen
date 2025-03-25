#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and key must be set in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('Applying creator_contents schema...');
    
    // Create tables if they don't exist
    const createTablesSQL = `
    -- Create creator_contents table for storing user-created content
    CREATE TABLE IF NOT EXISTS creator_contents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      metadata JSONB,
      version INTEGER DEFAULT 1,
      workflow_step TEXT,
      generation_progress INTEGER DEFAULT 0,
      ai_model_settings JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Enable RLS on creator_contents
    ALTER TABLE creator_contents ENABLE ROW LEVEL SECURITY;

    -- Create ebook_versions table for tracking different versions of generated ebooks
    CREATE TABLE IF NOT EXISTS ebook_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content_id UUID NOT NULL REFERENCES creator_contents(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      pdf_url TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Enable RLS on ebook_versions
    ALTER TABLE ebook_versions ENABLE ROW LEVEL SECURITY;
    `;
    
    // First create the tables
    const { error: createTablesError } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    if (createTablesError) {
      console.error('Error creating tables:', createTablesError);
    } else {
      console.log('Tables created successfully or already exist');
    }
    
    // Now try to create policies (one at a time to handle errors)
    try {
      const createContentsPolicySQL = `
      CREATE POLICY "Users can CRUD their own creator_contents" ON creator_contents
        FOR ALL USING (auth.uid() = user_id);
      `;
      await supabase.rpc('exec_sql', { sql: createContentsPolicySQL });
      console.log('Creator contents policy created successfully');
    } catch (policyError) {
      if (policyError.code === '42710') {
        // Policy already exists, this is fine
        console.log('Creator contents policy already exists, skipping');
      } else {
        console.error('Error creating creator contents policy:', policyError);
      }
    }
    
    try {
      const createVersionsPolicySQL = `
      CREATE POLICY "Users can CRUD their own ebook_versions" ON ebook_versions
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM creator_contents
            WHERE ebook_versions.content_id = creator_contents.id 
            AND creator_contents.user_id = auth.uid()
          )
        );
      `;
      await supabase.rpc('exec_sql', { sql: createVersionsPolicySQL });
      console.log('Ebook versions policy created successfully');
    } catch (policyError) {
      if (policyError.code === '42710') {
        // Policy already exists, this is fine
        console.log('Ebook versions policy already exists, skipping');
      } else {
        console.error('Error creating ebook versions policy:', policyError);
      }
    }
    
    try {
      const createTriggerSQL = `
      CREATE TRIGGER update_creator_contents_updated_at
      BEFORE UPDATE ON creator_contents
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
      `;
      await supabase.rpc('exec_sql', { sql: createTriggerSQL });
      console.log('Trigger created successfully');
    } catch (triggerError) {
      if (triggerError.code === '42710') {
        // Trigger already exists, this is fine
        console.log('Trigger already exists, skipping');
      } else {
        console.error('Error creating trigger:', triggerError);
      }
    }
    
    console.log('Schema applied successfully. Try refreshing the products page now.');
  } catch (error) {
    console.error('Error applying schema:', error);
    process.exit(1);
  }
}

applyMigration();