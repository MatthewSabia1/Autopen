#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL and service role key must be set in environment variables');
  process.exit(1);
}

// Create Supabase client with admin rights
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple function to create a test product for a specific user
async function createProductForUser(userId) {
  try {
    console.log(`Creating test product for user ${userId}...`);
    
    const { data, error } = await supabase
      .from('creator_contents')
      .insert({
        title: `Test Product ${Math.floor(Math.random() * 1000)}`,
        description: 'This is a test product created for debugging',
        type: 'ebook',
        status: 'draft',
        user_id: userId,
        metadata: {
          test: true,
          created_by: 'debug_script',
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Error creating product:', error.message);
      return null;
    }
    
    console.log('Product created successfully:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
}

// Get first user ID from the system
async function getFirstUser() {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error.message);
      return null;
    }
    
    if (!data.users || data.users.length === 0) {
      console.error('No users found in the system');
      return null;
    }
    
    console.log(`Found ${data.users.length} users`);
    console.log('First user:', data.users[0].email, data.users[0].id);
    
    return data.users[0].id;
  } catch (error) {
    console.error('Error getting users:', error);
    return null;
  }
}

// Main function
async function main() {
  // Get the first user in the system or use a provided user ID
  const userId = process.argv[2] || await getFirstUser();
  
  if (!userId) {
    console.error('No user ID available. Exiting.');
    process.exit(1);
  }
  
  // Create a test product for this user
  const product = await createProductForUser(userId);
  
  if (product) {
    console.log('\nProduct creation successful! You can now check the products page.');
    console.log(`Product ID: ${product.id}`);
    console.log(`Title: ${product.title}`);
  } else {
    console.error('\nProduct creation failed.');
  }
}

// Run the script
main();