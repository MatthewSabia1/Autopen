import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import fetch from 'cross-fetch';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Constants for client management
const CONNECTION_TIMEOUT = 8000; // 8 seconds
const CONNECTIVITY_CHECK_TIMEOUT = 2000; // 2 seconds
const MAX_RETRIES = 2;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing. Check your .env file.');
}

// Validate URL format to prevent errors
try {
  new URL(supabaseUrl);
} catch (e) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Please check your .env file.');
}

// Log Supabase connection details for debugging (partial key only)
console.log('Connecting to Supabase URL:', supabaseUrl);
console.log('Using API key starting with:', supabaseAnonKey.substring(0, 10) + '...');

// Track connection state across the app
let isConnected = false;
let lastConnectivityCheck = 0;

// Create Supabase client with robust error handling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (...args) => {
      const [url, options = {}] = args;
      
      // Log outgoing requests in development
      console.log('Supabase request to:', url);
      
      // Perform the fetch
      return fetch(...args)
        .then(async (response) => {
          // If we get a 401/403, log details to help debugging
          if (response.status === 401 || response.status === 403) {
            try {
              const session = await supabase.auth.getSession();
              const clonedResponse = response.clone();
              const body = await clonedResponse.text();
              
              console.warn(`Supabase auth error (${response.status}): ${url}`);
              console.log('Auth session during error:', session);
              console.log('Auth error body:', body);
              
              // Automatically refresh token on auth error
              if (session.data.session) {
                try {
                  const { error } = await supabase.auth.refreshSession();
                  if (error) {
                    console.error('Session refresh failed:', error);
                  } else {
                    console.log('Session refreshed after auth error');
                  }
                } catch (e) {
                  console.error('Error during session refresh:', e);
                }
              }
              
              // Dispatch an event for the app to handle auth errors
              window.dispatchEvent(new CustomEvent('supabase:auth_error', { 
                detail: { status: response.status, url, body } 
              }));
            } catch (e) {
              console.error('Error while handling auth error:', e);
            }
          }
          
          return response;
        })
        .catch(error => {
          console.error('Supabase request failed:', error);
          
          // Dispatch network error event
          window.dispatchEvent(new CustomEvent('supabase:network_error', { 
            detail: { error, url } 
          }));
          
          throw error;
        });
    }
  },
  realtime: {
    // Disable realtime features to reduce connection issues
    params: {
      eventsPerSecond: 1
    }
  },
  db: {
    schema: 'public'
  }
});

// Initialize Supabase to help with startup
const initSupabase = async () => {
  try {
    console.log('Initializing Supabase client');
    
    // Check browser connectivity
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('Browser is offline');
      window.dispatchEvent(new CustomEvent('supabase:offline'));
      isConnected = false;
      return;
    }
    
    // Try to get the session
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      } else {
        console.log('Session status:', data.session ? 'Active' : 'No active session');
      }
    } catch (err) {
      console.warn('Error checking session:', err);
    }
    
    // Check connectivity without using AbortController
    const connected = await checkConnectivitySimple();
    if (connected) {
      window.dispatchEvent(new CustomEvent('supabase:online'));
    } else {
      window.dispatchEvent(new CustomEvent('supabase:offline'));
    }
  } catch (err) {
    console.error('Supabase initialization error:', err);
    window.dispatchEvent(new CustomEvent('supabase:error', { detail: err }));
  }
};

// Simple connectivity check without AbortController
const checkConnectivitySimple = async (): Promise<boolean> => {
  try {
    // If we've checked recently and succeeded, avoid rechecking
    if (isConnected && (Date.now() - lastConnectivityCheck) < 30000) {
      return true;
    }
    
    console.log('Checking Supabase connectivity...');
    
    // Create a simple timeout promise
    const timeoutPromise = new Promise<false>((resolve) => {
      setTimeout(() => resolve(false), CONNECTIVITY_CHECK_TIMEOUT);
    });
    
    // Use a very simple check
    const checkPromise = new Promise<boolean>((resolve) => {
      fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      })
        .then(response => resolve(response.ok))
        .catch(() => resolve(false));
    });
    
    // Race between the timeout and the connectivity check
    const isConnectedNow = await Promise.race([checkPromise, timeoutPromise]);
    
    // Update connection state
    isConnected = isConnectedNow;
    if (isConnectedNow) {
      lastConnectivityCheck = Date.now();
      console.log('Supabase connected');
    } else {
      console.warn('Supabase connectivity check failed');
    }
    
    return isConnectedNow;
  } catch (e) {
    console.error('Error in connectivity check:', e);
    isConnected = false;
    return false;
  }
};

// Helper to check if we're likely to have connectivity
export const checkSupabaseConnectivity = async (): Promise<boolean> => {
  try {
    // First try to get user session which doesn't need DB access
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Then try to call the debug auth function we created
    const { data, error } = await supabase.rpc('debug_auth');
    
    if (error) {
      console.error('Supabase connectivity check failed:', error);
      return false;
    }
    
    console.log('Supabase connectivity check succeeded. Auth debug:', data);
    return true;
  } catch (error) {
    console.error('Supabase connectivity check error:', error);
    return false;
  }
};

// Check if we're currently connected
export const getConnectionStatus = (): boolean => {
  return isConnected;
};

// Set up online/offline detection
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('Browser is online, checking Supabase connectivity');
    const connected = await checkConnectivitySimple();
    if (connected) {
      console.log('Supabase connection restored');
      window.dispatchEvent(new CustomEvent('supabase:online'));
    }
  });
  
  window.addEventListener('offline', () => {
    console.log('Browser is offline');
    isConnected = false;
    window.dispatchEvent(new CustomEvent('supabase:offline'));
  });
}

// Helper to check if the user is logged in locally
export const isUserLoggedInLocally = (): boolean => {
  try {
    const session = localStorage.getItem('sb-lyusrmqbqvkbglnluvdi-auth-token');
    return !!session;
  } catch (e) {
    return false;
  }
};

// Listen for authentication state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state change:', event, session ? 'User authenticated' : 'No session');
  
  if (event === 'SIGNED_IN') {
    window.dispatchEvent(new Event('supabase:online'));
  } else if (event === 'SIGNED_OUT') {
    window.dispatchEvent(new Event('supabase:offline'));
  }
});

// Initial connection check
checkSupabaseConnectivity()
  .then(isConnected => {
    console.log('Supabase ' + (isConnected ? 'connected' : 'connection failed'));
    
    // Dispatch appropriate event
    if (isConnected) {
      window.dispatchEvent(new Event('supabase:online'));
    } else {
      window.dispatchEvent(new Event('supabase:offline'));
    }
  })
  .catch(error => {
    console.error('Error during initial Supabase connection check:', error);
    window.dispatchEvent(new Event('supabase:offline'));
  });

// Initialize on load with a slight delay
setTimeout(initSupabase, 100);