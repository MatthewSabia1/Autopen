import { useState, useEffect, useCallback } from 'react';
import { supabase, checkSupabaseConnectivity } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/database.types';
import { AnalysisResult } from '../types/BrainDumpTypes';

export type BrainDump = Database['public']['Tables']['brain_dumps']['Row'];
export type NewBrainDump = Database['public']['Tables']['brain_dumps']['Insert'];
export type BrainDumpUpdate = Database['public']['Tables']['brain_dumps']['Update'];

// Local storage cache key
const BRAIN_DUMPS_CACHE_KEY = 'autopen_brain_dumps_cache';

// Helper functions for caching
const getBrainDumpsFromCache = (): BrainDump[] => {
  try {
    const cachedData = localStorage.getItem(BRAIN_DUMPS_CACHE_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (e) {
    console.error('Failed to parse cached brain dumps:', e);
  }
  return [];
};

const saveBrainDumpsToCache = (brainDumps: BrainDump[]) => {
  try {
    localStorage.setItem(BRAIN_DUMPS_CACHE_KEY, JSON.stringify(brainDumps));
  } catch (e) {
    console.error('Failed to cache brain dumps:', e);
  }
};

export const useBrainDump = () => {
  const { user } = useAuth();
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Fetch all brain dumps for the current user
  const fetchBrainDumps = useCallback(async () => {
    if (!user) {
      setBrainDumps([]);
      setLoading(false);
      return { data: [], error: null };
    }

    try {
      setLoading(true);
      
      // First try to load from cache while fetching
      const cachedBrainDumps = getBrainDumpsFromCache();
      if (cachedBrainDumps.length > 0) {
        setBrainDumps(cachedBrainDumps);
      }

      // Create a timeout promise
      const timeoutPromise = new Promise<{ data: null, error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout: Could not connect to database')), 8000)
      );

      // Create the actual fetch promise
      const fetchPromise = supabase
        .from('brain_dumps')
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
          setBrainDumps(data || []);
          saveBrainDumpsToCache(data);
          setError(null);
          return { data, error: null };
        }
      } catch (fetchError: any) {
        // If fetch fails, check if we have cached data
        const cachedData = getBrainDumpsFromCache();
        if (cachedData.length > 0) {
          setBrainDumps(cachedData);
          setError('Could not connect to the network. Showing cached data.');
          return { data: cachedData, error: 'Using cached data (offline)' };
        } else {
          setError(`Could not load brain dumps: ${fetchError.message}`);
          return { data: [], error: fetchError.message };
        }
      }

      return { data: brainDumps, error: null };
    } catch (e: any) {
      console.error('Error fetching brain dumps:', e);
      setError('An unexpected error occurred while loading brain dumps.');
      return { data: [], error: e.message };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch brain dumps on initialization and when user changes
  useEffect(() => {
    fetchBrainDumps();
  }, [fetchBrainDumps]);
  
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
        // Refresh brain dumps if possible
        if (user) {
          fetchBrainDumps();
        }
      }
    };

    // Check initial connectivity
    checkSupabaseConnectivity().then(isConnected => {
      setIsOffline(!isConnected);
      if (!isConnected && user) {
        // Load from cache
        const cachedBrainDumps = getBrainDumpsFromCache();
        if (cachedBrainDumps.length > 0) {
          setBrainDumps(cachedBrainDumps);
          setError('Using locally stored data. Some features may be limited.');
        } else {
          setError('Network connection issue: Unable to connect to the database.');
        }
      }
    });

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [user, fetchBrainDumps]);

  // Save brain dump analysis result
  const saveBrainDump = useCallback(async (analysisResult: AnalysisResult, title: string = 'Untitled Analysis', projectId?: string) => {
    if (!user) return { error: 'No user signed in' };
    
    // Check for offline mode
    if (isOffline) {
      return { error: 'You are currently offline. Saving is not available.' };
    }
    
    try {
      setLoading(true);
      setError(null);

      // Format content for storage
      const contentJson = JSON.stringify(analysisResult);

      const newBrainDump: NewBrainDump = {
        title,
        content: contentJson,
        user_id: user.id,
        project_id: projectId || null
      };

      const { data, error } = await supabase
        .from('brain_dumps')
        .insert(newBrainDump)
        .select();

      if (error) {
        console.error('Brain dump save error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        // Update local state and cache
        const savedBrainDump = data[0];
        const updatedBrainDumps = [savedBrainDump, ...brainDumps];
        setBrainDumps(updatedBrainDumps);
        saveBrainDumpsToCache(updatedBrainDumps);
        
        return { data: savedBrainDump, error: null };
      } else {
        // If no data returned but also no error, refresh the list
        await fetchBrainDumps();
        return { data: null, error: null };
      }
    } catch (err: any) {
      console.error('Error saving brain dump:', err);
      
      // Network error handling
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout')
      )) {
        setIsOffline(true);
        setError('Network connection issue: Unable to save analysis');
        return { error: 'Network connection issue: Unable to save analysis' };
      }
      
      setError(err.message || 'Failed to save analysis');
      return { error: err.message || 'Failed to save analysis' };
    } finally {
      setLoading(false);
    }
  }, [user, isOffline, brainDumps, fetchBrainDumps]);

  // Get a single brain dump by ID
  const getBrainDump = useCallback(async (id: string) => {
    if (!user) return { error: 'No user signed in' };
    
    try {
      setLoading(true);
      
      // First check if we have this brain dump in local state
      const localBrainDump = brainDumps.find(b => b.id === id);
      
      // If we're offline and have the brain dump locally, use it
      if (isOffline && localBrainDump) {
        return { data: localBrainDump, error: null };
      }
      
      // Proceed with fetch if online
      const { data, error } = await supabase
        .from('brain_dumps')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Error fetching brain dump:', err);
      
      // Network error handling - check if we have this brain dump in cache
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout')
      )) {
        const cachedBrainDumps = getBrainDumpsFromCache();
        const cachedBrainDump = cachedBrainDumps.find(b => b.id === id);
        
        if (cachedBrainDump) {
          return { 
            data: cachedBrainDump, 
            error: 'Using cached data. Some features may be limited.' 
          };
        }
      }
      
      setError(err.message || 'Failed to fetch brain dump');
      return { error: err.message || 'Failed to fetch brain dump' };
    } finally {
      setLoading(false);
    }
  }, [user, isOffline, brainDumps]);

  // Delete a brain dump
  const deleteBrainDump = useCallback(async (id: string) => {
    if (!user) return { error: 'No user signed in' };
    
    // Check for offline mode
    if (isOffline) {
      return { error: 'You are currently offline. Deletion is not available.' };
    }
    
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('brain_dumps')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Remove the brain dump from state and cache
      const updatedBrainDumps = brainDumps.filter(item => item.id !== id);
      setBrainDumps(updatedBrainDumps);
      saveBrainDumpsToCache(updatedBrainDumps);
      
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting brain dump:', err);
      
      // Network error handling
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout')
      )) {
        setIsOffline(true);
        setError('Network connection issue: Unable to delete analysis');
        return { error: 'Network connection issue: Unable to delete analysis' };
      }
      
      setError(err.message || 'Failed to delete analysis');
      return { error: err.message || 'Failed to delete analysis' };
    } finally {
      setLoading(false);
    }
  }, [user, isOffline, brainDumps]);

  // Convert brain dump to a creator content (for eBook, blog post, etc.)
  const convertToCreatorContent = useCallback(async (brainDumpId: string, contentType: string, title?: string) => {
    if (!user) return { error: 'No user signed in' };
    
    // Check for offline mode
    if (isOffline) {
      return { error: 'You are currently offline. Content creation is not available.' };
    }
    
    try {
      setLoading(true);
      setError(null);

      // Fetch the brain dump first
      const { data: brainDumpData, error: fetchError } = await getBrainDump(brainDumpId);
      
      if (fetchError || !brainDumpData) {
        return { error: fetchError || 'Could not find the specified brain dump' };
      }
      
      // Parse the content from JSON string
      let analysisResult: AnalysisResult;
      try {
        analysisResult = brainDumpData.content ? JSON.parse(brainDumpData.content) : null;
      } catch (parseError) {
        return { error: 'Invalid brain dump data format' };
      }
      
      if (!analysisResult) {
        return { error: 'Brain dump has no analysis data' };
      }
      
      // Create creator content record
      const { data: creatorData, error: creatorError } = await supabase
        .from('creator_contents')
        .insert({
          title: title || brainDumpData.title,
          description: analysisResult.summary,
          content: {
            brainDumpId: brainDumpId,
            analysisResult: analysisResult
          },
          type: contentType,
          status: 'draft',
          user_id: user.id,
          project_id: brainDumpData.project_id,
          metadata: {
            source: 'brain_dump',
            sourceId: brainDumpId
          },
          version: 1
        })
        .select();
      
      if (creatorError) {
        throw creatorError;
      }
      
      // Update the brain dump with the content reference
      if (creatorData && creatorData.length > 0) {
        return { data: creatorData[0], error: null };
      } else {
        return { error: 'Failed to create content from brain dump' };
      }
    } catch (err: any) {
      console.error('Error converting brain dump to creator content:', err);
      
      // Network error handling
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout')
      )) {
        setIsOffline(true);
        setError('Network connection issue: Unable to create content');
        return { error: 'Network connection issue: Unable to create content' };
      }
      
      setError(err.message || 'Failed to create content');
      return { error: err.message || 'Failed to create content' };
    } finally {
      setLoading(false);
    }
  }, [user, isOffline, getBrainDump]);

  return {
    brainDumps,
    loading,
    error,
    isOffline,
    fetchBrainDumps,
    saveBrainDump,
    getBrainDump,
    deleteBrainDump,
    convertToCreatorContent
  };
};