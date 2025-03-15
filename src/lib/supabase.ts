import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import fetch from 'cross-fetch';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Constants for client management
const CONNECTION_TIMEOUT = 8000; // 8 seconds
const CONNECTIVITY_CHECK_TIMEOUT = 2000; // 2 seconds
const MAX_RETRIES = 2;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
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
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        try {
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        } catch (e) {
          console.error('Error reading from localStorage:', e);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          console.error('Error writing to localStorage:', e);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error('Error removing from localStorage:', e);
        }
      }
    }
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    },
    fetch: (...args) => {
      const [resource, config] = args;
      
      // Make a copy of config to avoid mutating the original
      const updatedConfig = { ...config };
      
      // Ensure headers include the API key
      updatedConfig.headers = {
        ...updatedConfig.headers,
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      };
      
      // Don't set abort controller if one is already provided
      const originalAbortController = updatedConfig.signal ? 
        { signal: updatedConfig.signal } : 
        new AbortController();
        
      const signal = updatedConfig.signal || originalAbortController.signal;
      
      // Set a timeout that won't abort existing signals
      const timeoutId = updatedConfig.signal ? null : setTimeout(() => {
        if (originalAbortController && !originalAbortController.signal.aborted) {
          originalAbortController.abort(new Error('Request timeout'));
        }
      }, CONNECTION_TIMEOUT);
      
      // Remove any existing signal to avoid conflicts
      if (!updatedConfig.signal) {
        updatedConfig.signal = signal;
      }
      
      // Convert URL to string for logging (and don't log full URLs with tokens)
      const safeResourceUrl = typeof resource === 'string' 
        ? resource.split('?')[0]
        : 'non-string-resource';
        
      console.log('Supabase request to:', safeResourceUrl);
      
      return new Promise((resolve, reject) => {
        // Use cross-fetch for better compatibility
        fetch(resource, updatedConfig)
          .then(response => {
            if (timeoutId) clearTimeout(timeoutId);
            
            // If we got any response, we're technically "connected"
            isConnected = true;
            lastConnectivityCheck = Date.now();
            
            // Check for auth errors
            if (response.status === 401) {
              console.warn('Supabase auth error (401):', safeResourceUrl);
              
              response.clone().text().then(body => {
                console.error('Auth error body:', body);
              }).catch(() => {});
            }
            
            // Check for server errors
            if (response.status >= 500) {
              console.warn('Supabase server error:', response.status);
              
              response.clone().text().then(body => {
                console.error('Server error body:', body);
              }).catch(() => {});
            }
            
            resolve(response);
          })
          .catch(err => {
            if (timeoutId) clearTimeout(timeoutId);
            
            console.error('Supabase fetch error:', err);
            
            // Set connected state to false on network errors
            if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
              isConnected = false;
              window.dispatchEvent(new CustomEvent('supabase:offline'));
            }
            
            reject(err);
          });
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
    const checkPromise = new Promise<boolean>(async (resolve) => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        });
        resolve(response.ok);
      } catch (e) {
        resolve(false);
      }
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
  // If offline mode is detected in the browser, return false immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  
  return await checkConnectivitySimple();
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

// Initialize on load with a slight delay
setTimeout(initSupabase, 100);