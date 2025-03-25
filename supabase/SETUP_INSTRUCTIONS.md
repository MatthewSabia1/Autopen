# Supabase Setup Instructions

This document provides instructions for setting up the necessary Supabase resources for the application, including the profiles table and storage bucket for profile images.

## Prerequisites

1. A Supabase project
2. The Supabase CLI installed
3. Environment variables set up (see `.env` file)

## Option 1: Using Migrations (Recommended)

The easiest way to set up the required database tables and storage buckets is by using the migration files provided.

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

This will apply all the migrations in the `supabase/migrations` directory.

## Option 2: Manual Setup

If you prefer to set up the resources manually, you can follow these steps:

### 1. Setting up the Profiles Table

1. Go to your Supabase Dashboard > SQL Editor
2. Create a new query and paste the contents of `supabase/migrations/20240325_profiles_and_storage.sql`
3. Run the query

### 2. Setting up the Storage Bucket

1. Go to your Supabase Dashboard > Storage
2. Create a new bucket called `profile-images`
3. Set the bucket to public
4. Go to the SQL Editor and run the storage-related parts of the migration file:
   ```sql
   -- Create storage bucket for profile images
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('profile-images', 'profile-images', true)
   ON CONFLICT (id) DO NOTHING;

   -- Set up Row Level Security for storage
   -- Allow users to view any profile image
   CREATE POLICY "Allow public read access to profile images" 
     ON storage.objects 
     FOR SELECT 
     USING (bucket_id = 'profile-images');

   -- Allow users to insert their own profile images
   CREATE POLICY "Allow users to insert their own profile images" 
     ON storage.objects 
     FOR INSERT 
     WITH CHECK (
       bucket_id = 'profile-images' AND 
       (storage.foldername(name))[1] = auth.uid()::text
     );

   -- Allow users to update their own profile images
   CREATE POLICY "Allow users to update their own profile images" 
     ON storage.objects 
     FOR UPDATE 
     USING (
       bucket_id = 'profile-images' AND 
       (storage.foldername(name))[1] = auth.uid()::text
     );

   -- Allow users to delete their own profile images
   CREATE POLICY "Allow users to delete their own profile images" 
     ON storage.objects 
     FOR DELETE 
     USING (
       bucket_id = 'profile-images' AND 
       (storage.foldername(name))[1] = auth.uid()::text
     );
   ```

## Verifying Setup

To verify that everything is set up correctly:

1. Check that the `profiles` table exists in your database
2. Verify that the Row Level Security (RLS) policies are in place
3. Ensure the `profile-images` bucket exists in Storage
4. Test creating a user and uploading a profile image

## Troubleshooting

If you encounter any issues:

1. Check the Supabase logs in your dashboard
2. Ensure your environment variables are set correctly
3. Verify that RLS policies are properly configured
4. Make sure your Supabase client is initialized properly

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Supabase Storage Guide](https://supabase.io/docs/guides/storage)
- [Supabase Auth Guide](https://supabase.io/docs/guides/auth) 