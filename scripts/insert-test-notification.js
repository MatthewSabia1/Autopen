// Script to insert a test notification
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

// Create Supabase client with service role key (has RLS bypass)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// User ID to create notification for
// Replace this with an actual user ID from your auth.users table
const USER_ID = 'dbbb58e9-e7b8-4e98-9622-d3e145a64602'; // <-- Replace with your user ID

async function insertTestNotification() {
  try {
    console.log('Inserting test notification for user:', USER_ID);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: USER_ID,
        message: 'This is a test notification from the script!',
        notification_type: 'system',
        created_at: new Date().toISOString(),
        target_url: '/dashboard'
      })
      .select();

    if (error) {
      throw error;
    }

    console.log('Successfully inserted notification:', data);
    console.log('You should now see this notification in your app!');
  } catch (err) {
    console.error('Error inserting notification:', err);
  }
}

// Run the function
insertTestNotification(); 