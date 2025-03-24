import { useState, useEffect, useCallback } from 'react';
import { supabase, checkSupabaseConnectivity } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/database.types';

export type CreatorContent = Database['public']['Tables']['creator_contents']['Row'];
export type NewCreatorContent = Database['public']['Tables']['creator_contents']['Insert'];
export type CreatorContentUpdate = Database['public']['Tables']['creator_contents']['Update'];

// Cache helpers
const CREATOR_CONTENTS_CACHE_KEY = 'autopen_creator_contents_cache';

const getContentFromCache = (): CreatorContent[] => {
  try {
    const cachedContents = localStorage.getItem(CREATOR_CONTENTS_CACHE_KEY);
    if (cachedContents) {
      return JSON.parse(cachedContents);
    }
  } catch (e) {
    console.error('Failed to parse cached creator contents:', e);
  }
  return [];
};

const saveContentToCache = (contents: CreatorContent[]) => {
  try {
    localStorage.setItem(CREATOR_CONTENTS_CACHE_KEY, JSON.stringify(contents));
  } catch (e) {
    console.error('Failed to cache creator contents:', e);
  }
};

export const useCreator = () => {
  const { user } = useAuth();
  const [contents, setContents] = useState<CreatorContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Fetch all creator contents for the current user
  const fetchCreatorContents = useCallback(async () => {
    if (!user) {
      setContents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First try to load from cache while fetching
      const cachedContents = getContentFromCache();
      if (cachedContents.length > 0) {
        setContents(cachedContents);
      }

      // Create a timeout promise
      const timeoutPromise = new Promise<{ data: null, error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout: Could not connect to Supabase')), 8000)
      );

      // Create the actual fetch promise
      const fetchPromise = supabase
        .from('creator_contents')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      // Race between the timeout and the fetch
      try {
        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

        if (error) {
          throw error;
        }

        if (data) {
          setContents(data || []);
          saveContentToCache(data);
          setError(null);
          return;
        }
      } catch (fetchError: any) {
        // If fetch fails, check if we have cached data
        const cachedData = getContentFromCache();
        if (cachedData.length > 0) {
          setContents(cachedData);
          setError('Could not connect to the network. Showing cached data.');
        } else {
          setError(`Could not load creator contents: ${fetchError.message}`);
        }
      }
    } catch (e) {
      console.error('Error fetching creator contents:', e);
      setError('An unexpected error occurred while loading creator contents.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Set up listeners for online/offline events
  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setError('You are currently offline. Some features may be limited.');
    };

    const handleOnline = async () => {
      const isConnected = await checkSupabaseConnectivity();
      if (isConnected) {
        setIsOffline(false);
        setError(null);
        // Refresh creator contents if possible
        if (user) {
          fetchCreatorContents();
        }
      }
    };

    // Check initial connectivity
    checkSupabaseConnectivity().then(isConnected => {
      setIsOffline(!isConnected);
      if (!isConnected && user) {
        // Load from cache
        const cachedContents = getContentFromCache();
        if (cachedContents.length > 0) {
          setContents(cachedContents);
          setError('Using locally stored data. Some features may be limited.');
        } else {
          setError('Network connection issue: Unable to connect to the database.');
        }
      }
    });

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('supabase:offline', handleOffline);
    window.addEventListener('supabase:online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('supabase:offline', handleOffline);
      window.removeEventListener('supabase:online', handleOnline);
    };
  }, [user, fetchCreatorContents]);

  // Fetch contents on initialization and when user changes
  useEffect(() => {
    fetchCreatorContents();
  }, [fetchCreatorContents]);

  // Create new content with offline check
  const createContent = async (content: Omit<CreatorContent, 'id' | 'created_at'>) => {
    if (!user) return { error: 'No user signed in' };
    
    // Check for offline mode
    if (isOffline) {
      return { error: 'You are currently offline. Creating new content is not available.' };
    }
    
    try {
      setLoading(true);
      setError(null);

      // Debug log to help identify user ID issues
      console.log('Creating content with user ID:', user.id);
      console.log('Auth state before create:', await supabase.auth.getSession());

      const newContent = {
        ...content,
        user_id: user.id,
      };

      console.log('Attempting to create content with:', JSON.stringify(newContent, null, 2));
      
      // First try with regular insert
      let { data, error } = await supabase
        .from('creator_contents')
        .insert(newContent)
        .select();

      // If we get an RLS error, try with a different approach using RPC
      if (error && error.code === '42501' && error.message.includes('row-level security policy')) {
        console.log('RLS error detected, trying alternative approach with RPC');
        
        // Try using RPC function
        const { data: rpcData, error: rpcError } = await supabase.rpc('insert_creator_content', {
          content_data: newContent
        });
        
        if (rpcError) {
          console.error('RPC approach failed:', rpcError);
          throw new Error(`Permission error: ${rpcError.message}`);
        }
        
        console.log('Content created successfully via RPC:', rpcData);
        
        // Update local state with the new content
        const createdContent = rpcData;
        const updatedContents = [createdContent, ...contents];
        setContents(updatedContents);
        saveContentToCache(updatedContents);
        
        return { data: createdContent, error: null };
      }
      
      if (error) {
        console.error('Content creation error:', error);
        throw error;
      }
      
      console.log('Content created successfully:', data);

      // Update local state and cache if we got back data
      if (data && data.length > 0) {
        const createdContent = data[0];
        const updatedContents = [createdContent, ...contents];
        setContents(updatedContents);
        saveContentToCache(updatedContents);
        
        return { data: createdContent, error: null };
      } else {
        // If no data returned but also no error, just refresh the list
        await fetchCreatorContents();
        return { data: null, error: null };
      }
    } catch (err: any) {
      console.error('Error creating content:', err);
      
      // Network error handling
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout')
      )) {
        setIsOffline(true);
        setError('Network connection issue: Unable to create new content');
        return { error: 'Network connection issue: Unable to create new content' };
      }
      
      // Handle RLS policy errors specifically
      if (err.message && err.message.includes('row-level security')) {
        return { error: 'Permission error: Please try logging out and logging back in.' };
      }
      
      setError(err.message || 'Failed to create content');
      return { error: err.message || 'Failed to create content' };
    } finally {
      setLoading(false);
    }
  };

  // Get a single content by ID
  const getContent = async (id: string) => {
    if (!user) return { error: 'No user signed in' };
    
    try {
      // Create a unique request ID for tracking duplicate calls
      const requestId = `getContent-${id}-${Date.now()}`;
      console.log(`[${requestId}] Fetching content with ID: ${id}`);
      
      // Only set loading true for UI state if we're not fetching from cache
      const localContent = contents.find(c => c.id === id);
      if (!localContent) {
        setLoading(true);
      }
      
      // If we're offline and have the content locally, use it
      if (isOffline && localContent) {
        console.log(`[${requestId}] Using cached content in offline mode`);
        return { data: localContent, error: null };
      }
      
      // Proceed with fetch if online
      const { data, error } = await supabase
        .from('creator_contents')
        .select('*')
        .eq('id', id)
        .maybeSingle(); // Use maybeSingle instead of single to handle 0 results gracefully

      if (error) {
        console.log(`[${requestId}] Supabase error:`, error);
        throw error;
      }

      if (!data) {
        console.log(`[${requestId}] Content not found`);
        return { data: null, error: 'Content not found' };
      }

      // Verify this content belongs to the current user
      if (data.user_id !== user.id) {
        console.log(`[${requestId}] Permission error: content belongs to different user`);
        return { data: null, error: 'You do not have permission to access this content' };
      }

      console.log(`[${requestId}] Content fetched successfully`);
      return { data, error: null };
    } catch (err: any) {
      console.error('Error fetching content:', err);
      
      // Network error handling - check if we have this content in cache
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout')
      )) {
        const cachedContents = getContentFromCache();
        const cachedContent = cachedContents.find(c => c.id === id);
        
        if (cachedContent) {
          return { 
            data: cachedContent, 
            error: 'Using cached data. Some features may be limited.' 
          };
        }
      }
      
      // Only update global error state if this is a UI-initiated request
      // For API call chains, we should handle the error in the caller
      setError(err.message || 'Failed to fetch content');
      return { data: null, error: err.message || 'Failed to fetch content' };
    } finally {
      setLoading(false);
    }
  };

  // Update existing content
  const updateContent = async (id: string, updates: CreatorContentUpdate) => {
    if (!user) return { error: 'No user signed in' };
    
    // Check for offline mode
    if (isOffline) {
      return { error: 'You are currently offline. Content updates are not available.' };
    }
    
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('creator_contents')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update the contents list and cache
      const updatedContents = contents.map(content => content.id === id ? data : content);
      setContents(updatedContents);
      saveContentToCache(updatedContents);

      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating content:', err);
      
      // Network error handling
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout')
      )) {
        setIsOffline(true);
        setError('Network connection issue: Unable to save content changes');
        return { error: 'Network connection issue: Unable to save content changes' };
      }
      
      setError(err.message || 'Failed to update content');
      return { error: err.message || 'Failed to update content' };
    } finally {
      setLoading(false);
    }
  };

  // Delete content
  const deleteContent = async (id: string) => {
    if (!user) return { error: 'No user signed in' };
    
    // Check for offline mode
    if (isOffline) {
      return { error: 'You are currently offline. Content deletion is not available.' };
    }
    
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('creator_contents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Remove the content from state and cache
      const updatedContents = contents.filter(content => content.id !== id);
      setContents(updatedContents);
      saveContentToCache(updatedContents);
      
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting content:', err);
      
      // Network error handling
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout')
      )) {
        setIsOffline(true);
        setError('Network connection issue: Unable to delete content');
        return { error: 'Network connection issue: Unable to delete content' };
      }
      
      setError(err.message || 'Failed to delete content');
      return { error: err.message || 'Failed to delete content' };
    } finally {
      setLoading(false);
    }
  };

  return {
    contents,
    loading,
    error,
    isOffline,
    createContent,
    getContent,
    updateContent,
    deleteContent,
    refreshContents: fetchCreatorContents
  };
};