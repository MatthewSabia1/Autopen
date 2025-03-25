#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Error: Supabase URL, anon key, and service role key must be set in environment variables');
  process.exit(1);
}

// Create Supabase clients
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

console.log('Supabase Configuration:');
console.log('URL:', supabaseUrl);
console.log('Anon Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');
console.log('Service Key (first 10 chars):', supabaseServiceKey.substring(0, 10) + '...');

async function diagnoseDatabase() {
  try {
    console.log('\n----- Database Schema Check -----');
    
    // Check if creator_contents exists
    const { data: ccCheck, error: ccError } = await serviceClient
      .from('creator_contents')
      .select('id')
      .limit(1);
    
    if (ccError) {
      console.error('creator_contents table error:', ccError.message);
      
      // Try to create the table
      console.log('\nAttempting to create creator_contents table...');
      const createTableSQL = `
      CREATE TABLE IF NOT EXISTS creator_contents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      `;
      
      const { error: createError } = await serviceClient.rpc('exec_sql', { sql: createTableSQL });
      if (createError) {
        console.error('Failed to create table:', createError.message);
      } else {
        console.log('Table created successfully!');
      }
    } else {
      console.log('creator_contents table exists.');
      
      // Check RLS policies
      const { data: policies, error: policyError } = await serviceClient.rpc('exec_sql', { 
        sql: "SELECT * FROM pg_policies WHERE tablename = 'creator_contents';" 
      });
      
      if (policyError) {
        console.error('Error checking policies:', policyError.message);
      } else {
        console.log('RLS Policies:', policies);
      }
    }
    
    // Check if projects table exists
    const { data: projCheck, error: projError } = await serviceClient
      .from('projects')
      .select('id')
      .limit(1);
    
    if (projError) {
      console.error('projects table error:', projError.message);
    } else {
      console.log('projects table exists with data:', projCheck);
    }
  } catch (error) {
    console.error('Schema check error:', error);
  }
}

async function checkAuthentication() {
  try {
    console.log('\n----- Authentication Check -----');
    
    // Create a test user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    
    console.log('Creating test user:', testEmail);
    const { data: signUpData, error: signUpError } = await serviceClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (signUpError) {
      console.error('Error creating test user:', signUpError.message);
      return;
    }
    
    console.log('Test user created:', signUpData.user.id);
    
    // Sign in with the test user
    console.log('Signing in with test user...');
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('Error signing in:', signInError.message);
      return;
    }
    
    console.log('Successfully signed in. Session:', !!signInData.session);
    console.log('User ID:', signInData.user.id);
    
    // Use the authenticated client to test RLS
    const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session.access_token}`
        }
      }
    });
    
    // Try to create a product
    console.log('\nCreating test product...');
    const { data: productData, error: productError } = await authedClient
      .from('creator_contents')
      .insert({
        title: 'Test Product',
        description: 'This is a test product',
        type: 'ebook',
        status: 'draft',
        user_id: signInData.user.id,
        metadata: { test: true }
      })
      .select();
    
    if (productError) {
      console.error('Error creating product:', productError.message);
    } else {
      console.log('Product created successfully:', productData[0].id);
      
      // Test fetching the product
      console.log('\nFetching product with authenticated client...');
      const { data: fetchData, error: fetchError } = await authedClient
        .from('creator_contents')
        .select('*')
        .eq('id', productData[0].id);
      
      if (fetchError) {
        console.error('Error fetching product:', fetchError.message);
      } else {
        console.log('Product fetched successfully:', fetchData[0].title);
      }
    }
    
    // Clean up - delete the test user
    console.log('\nCleaning up - deleting test user...');
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(signInData.user.id);
    
    if (deleteError) {
      console.error('Error deleting test user:', deleteError.message);
    } else {
      console.log('Test user deleted successfully');
    }
  } catch (error) {
    console.error('Authentication test error:', error);
  }
}

async function countExistingProducts() {
  try {
    console.log('\n----- Existing Products Check -----');
    
    // Count users
    const { data: users, error: usersError } = await serviceClient.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error listing users:', usersError.message);
      return;
    }
    
    console.log(`Found ${users.users.length} users in the system`);
    
    if (users.users.length > 0) {
      // For each user, check their products
      for (const user of users.users) {
        console.log(`\nChecking products for user: ${user.email} (${user.id})`);
        
        const { data: products, error: productsError } = await serviceClient
          .from('creator_contents')
          .select('*')
          .eq('user_id', user.id);
        
        if (productsError) {
          console.error(`Error fetching products for user ${user.id}:`, productsError.message);
        } else {
          console.log(`Found ${products?.length || 0} products for user ${user.email}`);
          
          if (products && products.length > 0) {
            console.log('Sample product:', {
              id: products[0].id,
              title: products[0].title,
              type: products[0].type,
              status: products[0].status
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Products check error:', error);
  }
}

// Run all tests
async function runDiagnostics() {
  console.log('===== Supabase Diagnostics Tool =====');
  
  await diagnoseDatabase();
  await checkAuthentication();
  await countExistingProducts();
  
  console.log('\n===== Diagnostics Complete =====');
}

runDiagnostics();