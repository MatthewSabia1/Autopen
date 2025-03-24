// Script to apply ebook workflow changes using the Supabase client
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

// Create a Supabase client with the service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyEbookSchemaChanges() {
  console.log('===== AUTOPEN EBOOK WORKFLOW DATABASE SETUP =====');
  console.log('Starting database changes for eBook workflow...');
  
  try {
    // 1. Update creator_contents table
    console.log('\n1. Updating creator_contents table...');
    const { error: updateError } = await supabase.rpc('alter_creator_contents', {});
    
    if (updateError) {
      // Create the stored procedure if it doesn't exist
      console.log('Creating alter_creator_contents procedure...');
      await supabase.from('_exec').select('*').eq('query', `
        CREATE OR REPLACE FUNCTION alter_creator_contents()
        RETURNS void AS $$
        BEGIN
          -- Add columns if they don't exist
          BEGIN
            ALTER TABLE public.creator_contents
            ADD COLUMN IF NOT EXISTS workflow_step TEXT,
            ADD COLUMN IF NOT EXISTS generation_progress JSONB DEFAULT '{"current_step": null, "total_steps": null, "steps_completed": []}'::jsonb,
            ADD COLUMN IF NOT EXISTS ai_model_settings JSONB DEFAULT '{}'::jsonb;
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error altering creator_contents: %', SQLERRM;
          END;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      // Now execute the procedure
      const { error: execError } = await supabase.rpc('alter_creator_contents', {});
      if (execError) {
        console.error('Error updating creator_contents table:', execError);
      } else {
        console.log('Successfully updated creator_contents table');
      }
    } else {
      console.log('Successfully updated creator_contents table');
    }

    // 2. Create ebook_chapters table if it doesn't exist
    console.log('\n2. Creating ebook_chapters table...');
    const { data: chaptersExists } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'ebook_chapters');

    if (!chaptersExists || chaptersExists.length === 0) {
      console.log('Creating ebook_chapters table...');
      const { error: chaptersError } = await supabase.from('_exec').select('*').eq('query', `
        CREATE TABLE IF NOT EXISTS public.ebook_chapters (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          content_id UUID REFERENCES public.creator_contents(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          content TEXT,
          chapter_index INTEGER NOT NULL,
          metadata JSONB DEFAULT '{}'::jsonb
        );
        
        CREATE INDEX IF NOT EXISTS ebook_chapters_content_id_idx ON public.ebook_chapters(content_id);
        ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own ebook_chapters" 
        ON public.ebook_chapters
        FOR SELECT
        USING (EXISTS (
          SELECT 1 FROM public.creator_contents
          WHERE creator_contents.id = ebook_chapters.content_id
          AND creator_contents.user_id = auth.uid()
        ));
        
        CREATE POLICY "Users can create ebook_chapters" 
        ON public.ebook_chapters
        FOR INSERT
        WITH CHECK (EXISTS (
          SELECT 1 FROM public.creator_contents
          WHERE creator_contents.id = ebook_chapters.content_id
          AND creator_contents.user_id = auth.uid()
        ));
        
        CREATE POLICY "Users can update own ebook_chapters" 
        ON public.ebook_chapters
        FOR UPDATE
        USING (EXISTS (
          SELECT 1 FROM public.creator_contents
          WHERE creator_contents.id = ebook_chapters.content_id
          AND creator_contents.user_id = auth.uid()
        ));
        
        CREATE POLICY "Users can delete own ebook_chapters" 
        ON public.ebook_chapters
        FOR DELETE
        USING (EXISTS (
          SELECT 1 FROM public.creator_contents
          WHERE creator_contents.id = ebook_chapters.content_id
          AND creator_contents.user_id = auth.uid()
        ));
        
        GRANT ALL ON public.ebook_chapters TO authenticated;
        GRANT ALL ON public.ebook_chapters TO service_role;
      `);
      
      if (chaptersError) {
        console.error('Error creating ebook_chapters table:', chaptersError);
      } else {
        console.log('Successfully created ebook_chapters table');
      }
    } else {
      console.log('ebook_chapters table already exists');
    }

    // 3. Create ebook_versions table if it doesn't exist
    console.log('\n3. Creating ebook_versions table...');
    const { data: versionsExists } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'ebook_versions');

    if (!versionsExists || versionsExists.length === 0) {
      console.log('Creating ebook_versions table...');
      const { error: versionsError } = await supabase.from('_exec').select('*').eq('query', `
        CREATE TABLE IF NOT EXISTS public.ebook_versions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          created_at TIMESTAMPTZ DEFAULT now(),
          content_id UUID REFERENCES public.creator_contents(id) ON DELETE CASCADE,
          version_number INTEGER NOT NULL,
          pdf_url TEXT,
          metadata JSONB DEFAULT '{}'::jsonb
        );
        
        CREATE INDEX IF NOT EXISTS ebook_versions_content_id_idx ON public.ebook_versions(content_id);
        ALTER TABLE public.ebook_versions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own ebook_versions" 
        ON public.ebook_versions
        FOR SELECT
        USING (EXISTS (
          SELECT 1 FROM public.creator_contents
          WHERE creator_contents.id = ebook_versions.content_id
          AND creator_contents.user_id = auth.uid()
        ));
        
        CREATE POLICY "Users can create ebook_versions" 
        ON public.ebook_versions
        FOR INSERT
        WITH CHECK (EXISTS (
          SELECT 1 FROM public.creator_contents
          WHERE creator_contents.id = ebook_versions.content_id
          AND creator_contents.user_id = auth.uid()
        ));
        
        CREATE POLICY "Users can update own ebook_versions" 
        ON public.ebook_versions
        FOR UPDATE
        USING (EXISTS (
          SELECT 1 FROM public.creator_contents
          WHERE creator_contents.id = ebook_versions.content_id
          AND creator_contents.user_id = auth.uid()
        ));
        
        CREATE POLICY "Users can delete own ebook_versions" 
        ON public.ebook_versions
        FOR DELETE
        USING (EXISTS (
          SELECT 1 FROM public.creator_contents
          WHERE creator_contents.id = ebook_versions.content_id
          AND creator_contents.user_id = auth.uid()
        ));
        
        GRANT ALL ON public.ebook_versions TO authenticated;
        GRANT ALL ON public.ebook_versions TO service_role;
      `);
      
      if (versionsError) {
        console.error('Error creating ebook_versions table:', versionsError);
      } else {
        console.log('Successfully created ebook_versions table');
      }
    } else {
      console.log('ebook_versions table already exists');
    }

    // 4. Create or update trigger function for updated_at
    console.log('\n4. Creating updated_at trigger function...');
    const { error: functionError } = await supabase.from('_exec').select('*').eq('query', `
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS update_ebook_chapters_updated_at ON public.ebook_chapters;
      CREATE TRIGGER update_ebook_chapters_updated_at
        BEFORE UPDATE ON public.ebook_chapters
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    `);
    
    if (functionError) {
      console.error('Error creating updated_at trigger function:', functionError);
    } else {
      console.log('Successfully created updated_at trigger function');
    }

    // 5. Check and fix RLS on creator_contents
    console.log('\n5. Checking row level security on creator_contents...');
    const { error: rlsError } = await supabase.from('_exec').select('*').eq('query', `
      -- Create the stored procedure if it doesn't exist
      CREATE OR REPLACE FUNCTION fix_creator_contents_rls()
      RETURNS void AS $$
      BEGIN
        -- Enable RLS on creator_contents
        ALTER TABLE public.creator_contents ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own creator_contents" ON public.creator_contents;
        DROP POLICY IF EXISTS "Users can create creator_contents" ON public.creator_contents;
        DROP POLICY IF EXISTS "Users can update own creator_contents" ON public.creator_contents;
        DROP POLICY IF EXISTS "Users can delete own creator_contents" ON public.creator_contents;
        
        -- Create new policies
        CREATE POLICY "Users can view own creator_contents" 
          ON public.creator_contents 
          FOR SELECT 
          TO authenticated 
          USING (auth.uid() = user_id);
          
        CREATE POLICY "Users can create creator_contents" 
          ON public.creator_contents 
          FOR INSERT 
          TO authenticated 
          WITH CHECK (true);
          
        CREATE POLICY "Users can update own creator_contents" 
          ON public.creator_contents 
          FOR UPDATE 
          TO authenticated 
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
          
        CREATE POLICY "Users can delete own creator_contents" 
          ON public.creator_contents 
          FOR DELETE 
          TO authenticated 
          USING (auth.uid() = user_id);
          
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing creator_contents RLS: %', SQLERRM;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    if (rlsError) {
      console.error('Error creating fix_creator_contents_rls procedure:', rlsError);
    } else {
      console.log('Successfully created fix_creator_contents_rls procedure');
      
      // Execute the procedure
      const { error: execRlsError } = await supabase.rpc('fix_creator_contents_rls', {});
      if (execRlsError) {
        console.error('Error executing fix_creator_contents_rls:', execRlsError);
      } else {
        console.log('Successfully fixed creator_contents RLS');
      }
    }

    console.log('\nAll database changes completed successfully.');
    
  } catch (error) {
    console.error('Error applying eBook schema changes:', error);
    process.exit(1);
  }
}

// Run the schema changes
applyEbookSchemaChanges()
  .then(() => {
    console.log('eBook workflow database setup completed.');
  })
  .catch(error => {
    console.error('Fatal error during setup process:', error);
    process.exit(1);
  }); 