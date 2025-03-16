import { useState, useEffect } from 'react';
import { supabase, checkSupabaseConnectivity, isUserLoggedInLocally, getConnectionStatus } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Create a profile cache helper
const PROFILE_CACHE_KEY = 'autopen_profile_cache';

const getProfileFromCache = (): Profile | null => {
  try {
    const cachedProfile = localStorage.getItem(PROFILE_CACHE_KEY);
    if (cachedProfile) {
      return JSON.parse(cachedProfile);
    }
  } catch (e) {
    console.error('Failed to parse cached profile:', e);
  }
  return null;
};

const saveProfileToCache = (profile: Profile) => {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to cache profile:', e);
  }
};

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!getConnectionStatus());
  const [fetchAttempts, setFetchAttempts] = useState(0);

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
        // Refresh profile data if possible
        if (user) {
          fetchProfile(user.id);
        }
      }
    };

    const handleError = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        console.error('Supabase error event:', customEvent.detail);
        setError(`Database error: ${customEvent.detail.message || 'Unknown error'}`);
      }
    };

    // Check initial connectivity state based on browser's online status
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine || !getConnectionStatus());
      if (!navigator.onLine) {
        setError('You are currently offline. Some features may be limited.');
      }
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('supabase:offline', handleOffline);
    window.addEventListener('supabase:online', handleOnline);
    window.addEventListener('supabase:error', handleError);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('supabase:offline', handleOffline);
      window.removeEventListener('supabase:online', handleOnline);
      window.removeEventListener('supabase:error', handleError);
    };
  }, [user]);

  // Function to fetch profile data with improved error handling
  const fetchProfile = async (userId: string) => {
    try {
      // Too many attempts, switch to offline mode with cached data
      if (fetchAttempts > 2) {
        const cachedProfile = getProfileFromCache();
        if (cachedProfile && cachedProfile.id === userId) {
          setProfile(cachedProfile);
          setIsOffline(true);
          setError('Using cached data. Connection to database failed after multiple attempts.');
          setLoading(false);
          return;
        }
        
        // Fallback to a default profile if no cache exists
        const defaultProfile: Profile = {
          id: userId,
          username: user?.email?.split('@')[0] || 'User',
          updated_at: new Date().toISOString(),
          avatar_url: null,
          bio: null
        };
        setProfile(defaultProfile);
        setIsOffline(true);
        setError('Using default profile. Connection to database failed after multiple attempts.');
        setLoading(false);
        return;
      }
      
      setFetchAttempts(prev => prev + 1);
      setLoading(true);
      
      // Check browser connectivity first and use cache if offline
      if ((typeof navigator !== 'undefined' && !navigator.onLine) || !await checkSupabaseConnectivity()) {
        const cachedProfile = getProfileFromCache();
        if (cachedProfile && cachedProfile.id === userId) {
          console.log('Using cached profile (offline mode)');
          setProfile(cachedProfile);
          setIsOffline(true);
          setError('You are currently offline. Using locally stored data.');
          setLoading(false);
          return;
        }
        
        throw new Error('Currently offline, no cached profile available');
      }
      
      console.log('Fetching profile for user:', userId);

      // Use a simple approach without AbortController
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          throw error;
        }

        if (data) {
          console.log('Profile fetch successful');
          setProfile(data);
          saveProfileToCache(data);
          setFetchAttempts(0); // Reset attempts on success
          setIsOffline(false);
          setError(null);
          setLoading(false);
          return;
        }
      } catch (fetchError: any) {
        console.error('Fetch profile error details:', fetchError);
        
        // If we have a cached profile, use it when errors occur
        const cachedProfile = getProfileFromCache();
        if (cachedProfile && cachedProfile.id === userId) {
          console.log('Using cached profile after fetch error');
          setProfile(cachedProfile);
          setIsOffline(true);
          setError('Using locally stored data. Some features may be limited.');
          setLoading(false);
          return;
        }
        
        // Create a basic profile if logged in but no cache
        if (isUserLoggedInLocally()) {
          const defaultProfile: Profile = {
            id: userId,
            username: user?.email?.split('@')[0] || 'User',
            updated_at: new Date().toISOString(),
            avatar_url: null,
            bio: null
          };
          setProfile(defaultProfile);
          setIsOffline(true);
          setError('Using default profile. Unable to connect to the database.');
          setLoading(false);
          return;
        }
        
        throw fetchError;
      }
    } catch (err: any) {
      console.error('Error in profile handling:', err);
      
      // Handle common error cases
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout') ||
        err.message.includes('abort') ||
        err.message.includes('offline') ||
        err.message.includes('upstream connect error') ||
        err.message.includes('signal is aborted')
      )) {
        setError('Network connection issue: Unable to connect to the database');
        setIsOffline(true);
        
        // Try to use cached profile
        const cachedProfile = getProfileFromCache();
        if (cachedProfile && cachedProfile.id === userId) {
          setProfile(cachedProfile);
        } else if (isUserLoggedInLocally()) {
          // Create a temporary profile if we're logged in but have no cache
          const defaultProfile: Profile = {
            id: userId,
            username: user?.email?.split('@')[0] || 'User',
            updated_at: new Date().toISOString(),
            avatar_url: null,
            bio: null
          };
          setProfile(defaultProfile);
        }
      } else {
        setError(err.message || 'Failed to fetch profile');
      }
      
      setLoading(false);
    }
  };

  // Fetch profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Try to load from cache first
    const cachedProfile = getProfileFromCache();
    if (cachedProfile && cachedProfile.id === user.id) {
      setProfile(cachedProfile);
    }
    
    // Reset fetch attempts when user changes
    setFetchAttempts(0);
    fetchProfile(user.id);
  }, [user]);

  // Update profile function with offline handling
  const updateProfile = async (updates: ProfileUpdate) => {
    if (!user) return { error: 'No user signed in' };
    
    // Check for offline mode
    if (isOffline) {
      return { error: 'You are currently offline. Profile updates are not available.' };
    }
    
    try {
      setLoading(true);
      setError(null);

      console.log('Updating profile for user:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      console.log('Profile update successful');

      // Cache the updated profile
      saveProfileToCache(data);
      
      // Update local state
      setProfile(data);
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating profile:', err);
      
      // Special handling for network errors
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout') ||
        err.message.includes('upstream connect error')
      )) {
        setIsOffline(true);
        setError('Network connection issue: Unable to save profile changes');
        return { error: 'Network connection issue: Unable to save profile changes' };
      }
      
      setError(err.message || 'Failed to update profile');
      return { error: err.message || 'Failed to update profile' };
    } finally {
      setLoading(false);
    }
  };

  // Avatar upload with offline check
  const uploadAvatar = async (file: File) => {
    if (!user) return { error: 'No user signed in' };
    
    // Check for offline mode
    if (isOffline) {
      return { error: 'You are currently offline. Avatar uploads are not available.' };
    }
    
    try {
      setLoading(true);
      setError(null);

      console.log('Uploading avatar for user:', user.id);

      // Create a unique file path for the avatar
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data: publicUrlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      console.log('Avatar uploaded successfully, updating profile with URL');

      // Update the user's profile with the new avatar URL
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Profile update error after avatar upload:', updateError);
        throw updateError;
      }

      console.log('Avatar update successful');

      // Cache updated profile
      saveProfileToCache(data);
      
      // Update state
      setProfile(data);
      
      return { data, error: null };
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      
      // Network error handling
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout') ||
        err.message.includes('upstream connect error')
      )) {
        setIsOffline(true);
        setError('Network connection issue: Unable to upload avatar');
        return { error: 'Network connection issue: Unable to upload avatar' };
      }
      
      setError(err.message || 'Failed to upload avatar');
      return { error: err.message || 'Failed to upload avatar' };
    } finally {
      setLoading(false);
    }
  };

  // Public method to retry fetching profile
  const retryFetchProfile = () => {
    if (!user) return;
    setFetchAttempts(0);
    setIsOffline(false);
    setError(null);
    fetchProfile(user.id);
  };

  return {
    profile,
    loading,
    error,
    isOffline,
    updateProfile,
    uploadAvatar,
    refreshProfile: user ? () => fetchProfile(user.id) : () => {},
    retry: retryFetchProfile
  };
};