import { useState, useEffect, useCallback } from 'react';
import { supabase, checkSupabaseConnectivity } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/database.types';

export type Project = Database['public']['Tables']['projects']['Row'];
export type NewProject = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

// Cache helpers
const PROJECTS_CACHE_KEY = 'autopen_projects_cache';

const getProjectsFromCache = (): Project[] => {
  try {
    const cachedProjects = localStorage.getItem(PROJECTS_CACHE_KEY);
    if (cachedProjects) {
      return JSON.parse(cachedProjects);
    }
  } catch (e) {
    console.error('Failed to parse cached projects:', e);
  }
  return [];
};

const saveProjectsToCache = (projects: Project[]) => {
  try {
    localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to cache projects:', e);
  }
};

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

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
        // Refresh projects if possible
        if (user) {
          fetchProjects();
        }
      }
    };

    // Check initial connectivity
    checkSupabaseConnectivity().then(isConnected => {
      setIsOffline(!isConnected);
      if (!isConnected && user) {
        // Load from cache
        const cachedProjects = getProjectsFromCache();
        if (cachedProjects.length > 0) {
          setProjects(cachedProjects);
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
  }, [user]);

  // Fetch all projects for the current user
  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First try to load from cache while fetching
      const cachedProjects = getProjectsFromCache();
      if (cachedProjects.length > 0) {
        setProjects(cachedProjects);
      }

      // Create a timeout promise
      const timeoutPromise = new Promise<{ data: null, error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout: Could not connect to Supabase')), 8000)
      );

      // Create the actual fetch promise
      const fetchPromise = supabase
        .from('projects')
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
          setProjects(data || []);
          saveProjectsToCache(data);
          setError(null);
          return;
        }
      } catch (fetchError: any) {
        console.error('Fetch projects error:', fetchError);
        
        // If we have cached projects, continue using them
        if (cachedProjects.length > 0) {
          console.log('Using cached projects data');
          setError('Using locally stored data. Some features may be limited.');
          setIsOffline(true);
          return;
        }
        
        // No cached projects, show the error
        throw fetchError;
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      
      // If it's a network/connectivity error
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout') ||
        err.message.includes('abort')
      )) {
        setError('Network connection issue: Unable to connect to the database');
        setIsOffline(true);
        
        // Use cached projects if available
        const cachedProjects = getProjectsFromCache();
        if (cachedProjects.length > 0) {
          setProjects(cachedProjects);
        }
      } else {
        setError(err.message || 'Failed to fetch projects');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch projects on initialization and when user changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Create a new project with offline check
  const createProject = async (project: Omit<NewProject, 'user_id'>) => {
    if (!user) return { error: 'No user signed in' };
    
    // Check for offline mode
    if (isOffline) {
      return { error: 'You are currently offline. Creating new products is not available.' };
    }
    
    try {
      setLoading(true);
      setError(null);

      // Debug log to help identify user ID issues
      console.log('Creating project with user ID:', user.id);
      console.log('Auth state before create:', await supabase.auth.getSession());

      const newProject: NewProject = {
        ...project,
        user_id: user.id,
      };

      // Use upsert instead of insert to be more resilient
      const { data, error } = await supabase
        .from('projects')
        .upsert(newProject)
        .select();

      if (error) {
        console.error('Project creation error:', error);
        throw error;
      }

      console.log('Project created successfully:', data);

      // Update local state and cache if we got back data
      if (data && data.length > 0) {
        const createdProject = data[0];
        const updatedProjects = [createdProject, ...projects];
        setProjects(updatedProjects);
        saveProjectsToCache(updatedProjects);
        
        return { data: createdProject, error: null };
      } else {
        // If no data returned but also no error, just refresh the list
        await fetchProjects();
        return { data: null, error: null };
      }
    } catch (err: any) {
      console.error('Error creating project:', err);
      
      // Network error handling
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout')
      )) {
        setIsOffline(true);
        setError('Network connection issue: Unable to create new product');
        return { error: 'Network connection issue: Unable to create new product' };
      }
      
      // Handle RLS policy errors specifically
      if (err.message && err.message.includes('row-level security')) {
        return { error: 'Permission error: Please try logging out and logging back in.' };
      }
      
      setError(err.message || 'Failed to create product');
      return { error: err.message || 'Failed to create product' };
    } finally {
      setLoading(false);
    }
  };

  // Get a single project by ID
  const getProject = async (id: string) => {
    if (!user) return { error: 'No user signed in' };
    
    try {
      setLoading(true);
      
      // First check if we have this project in local state
      const localProject = projects.find(p => p.id === id);
      
      // If we're offline and have the project locally, use it
      if (isOffline && localProject) {
        return { data: localProject, error: null };
      }
      
      // Proceed with fetch if online
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Error fetching project:', err);
      
      // Network error handling - check if we have this project in cache
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout')
      )) {
        const cachedProjects = getProjectsFromCache();
        const cachedProject = cachedProjects.find(p => p.id === id);
        
        if (cachedProject) {
          return { 
            data: cachedProject, 
            error: 'Using cached data. Some features may be limited.' 
          };
        }
      }
      
      setError(err.message || 'Failed to fetch product');
      return { error: err.message || 'Failed to fetch product' };
    } finally {
      setLoading(false);
    }
  };

  // Update an existing project
  const updateProject = async (id: string, updates: ProjectUpdate) => {
    if (!user) return { error: 'No user signed in' };
    
    // Check for offline mode
    if (isOffline) {
      return { error: 'You are currently offline. Product updates are not available.' };
    }
    
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update the projects list and cache
      const updatedProjects = projects.map(project => project.id === id ? data : project);
      setProjects(updatedProjects);
      saveProjectsToCache(updatedProjects);

      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating project:', err);
      
      // Network error handling
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout')
      )) {
        setIsOffline(true);
        setError('Network connection issue: Unable to save product changes');
        return { error: 'Network connection issue: Unable to save product changes' };
      }
      
      setError(err.message || 'Failed to update product');
      return { error: err.message || 'Failed to update product' };
    } finally {
      setLoading(false);
    }
  };

  // Delete a project
  const deleteProject = async (id: string) => {
    if (!user) return { error: 'No user signed in' };
    
    // Check for offline mode
    if (isOffline) {
      return { error: 'You are currently offline. Product deletion is not available.' };
    }
    
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Remove the project from state and cache
      const updatedProjects = projects.filter(project => project.id !== id);
      setProjects(updatedProjects);
      saveProjectsToCache(updatedProjects);
      
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting project:', err);
      
      // Network error handling
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout')
      )) {
        setIsOffline(true);
        setError('Network connection issue: Unable to delete product');
        return { error: 'Network connection issue: Unable to delete product' };
      }
      
      setError(err.message || 'Failed to delete product');
      return { error: err.message || 'Failed to delete product' };
    } finally {
      setLoading(false);
    }
  };

  return {
    projects,
    loading,
    error,
    isOffline,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    refreshProjects: fetchProjects
  };
};