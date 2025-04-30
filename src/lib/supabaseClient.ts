// Log the values used to create the client (without revealing full keys)
console.log('Supabase initialization', {
  url: import.meta.env.VITE_SUPABASE_URL || '(missing URL)',
  key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 
    `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 5)}...` : 
    '(missing key)',
  environment: import.meta.env.MODE || 'unknown',
});

// Import createClient from supabase-js
// If this import already exists in the file, you don't need to add it again
import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Add validation with helpful error messages
if (!supabaseUrl) {
  console.error('CRITICAL ERROR: Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseKey) {
  console.error('CRITICAL ERROR: Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Get current hostname for CORS configuration
// const currentHost = window.location.origin; // Keep this commented or remove if not used elsewhere

// console.log('Current origin for CORS purposes:', currentHost); // Keep commented or remove

// Create client with explicit options
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    // Remove explicit Origin header, let the browser handle it.
    headers: {
      'X-Client-Info': 'supabase-js',
    },
  },
});

// Connection test function
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('notifications').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection test failed with error:', error);
      return { success: false, error };
    }
    
    console.log('Supabase connection successful! Count query returned:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error during Supabase connection test:', err);
    return { success: false, error: err };
  }
};

// Run the test when the client is loaded
/* // Commenting out the automatic test execution
testSupabaseConnection()
  .then(result => {
    console.log('Connection test completed, result:', result.success ? 'SUCCESS' : 'FAILED');
  })
  .catch(err => {
    console.error('Connection test exception:', err);
  });
*/

// Rest of your existing code... 