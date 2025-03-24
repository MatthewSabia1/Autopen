import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, checkSupabaseConnectivity } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../types/database.types';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  // Subscribe to real-time changes on the projects table
  const setupRealtimeSubscription = useCallback(() => {
    if (!user) {
      console.log('No user, skipping realtime subscription setup');
      return;
    }

    // Clean up any existing subscription
    if (realtimeChannelRef.current) {
      console.log('Cleaning up existing realtime subscription');
      realtimeChannelRef.current.unsubscribe();
      realtimeChannelRef.current = null;
    }

    // Don't set up subscriptions if offline
    if (isOffline) {
      console.log('Not setting up realtime subscription because device is offline');
      return;
    }

    console.log('Setting up real-time subscription for projects table with user ID:', user.id);
    
    try {
      const channel = supabase
        .channel(`projects-changes-${new Date().getTime()}`) // Add timestamp to ensure unique channel names
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'projects',
            filter: `user_id=eq.${user.id}` // Only listen to this user's projects
          },
          (payload) => {
            console.log('Received real-time project update:', payload.eventType, payload.new?.id || payload.old?.id);
            
            // Handle different events
            if (payload.eventType === 'INSERT') {
              const newProject = payload.new as Project;
              console.log('Adding new project to state:', newProject.title, newProject.id);
              
              // Add the new project to the list only if it doesn't exist
              setProjects(prev => {
                // Check if project already exists
                if (prev.some(p => p.id === newProject.id)) {
                  console.log('Project already exists in state, not adding duplicate');
                  return prev;
                }
                const updatedProjects = [newProject, ...prev];
                console.log('Project added to state. New count:', updatedProjects.length);
                // Also update the cache
                saveProjectsToCache(updatedProjects);
                return updatedProjects;
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedProject = payload.new as Project;
              console.log('Updating existing project in state:', updatedProject.title, updatedProject.id);
              
              // Update the project in the list
              setProjects(prev => {
                const updatedProjects = prev.map(p => p.id === updatedProject.id ? updatedProject : p);
                // Also update the cache
                saveProjectsToCache(updatedProjects);
                return updatedProjects;
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedProject = payload.old as Project;
              console.log('Removing deleted project from state:', deletedProject.id);
              
              // Remove the project from the list
              setProjects(prev => {
                const updatedProjects = prev.filter(p => p.id !== deletedProject.id);
                // Also update the cache
                saveProjectsToCache(updatedProjects);
                return updatedProjects;
              });
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to projects changes');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to projects changes:', err);
            setError('Failed to connect to real-time updates');
          } else {
            console.warn('Subscription status not SUBSCRIBED:', status, err);
          }
        });

      realtimeChannelRef.current = channel;
      
      console.log('Realtime subscription channel set up:', channel);
    } catch (err) {
      console.error('Error setting up realtime subscription:', err);
    }
    
    return () => {
      if (realtimeChannelRef.current) {
        console.log('Unsubscribing from projects changes');
        realtimeChannelRef.current.unsubscribe();
        realtimeChannelRef.current = null;
      }
    };
  }, [user, isOffline]);

  // Set up real-time subscription when user or offline status changes
  useEffect(() => {
    setupRealtimeSubscription();
    
    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
        realtimeChannelRef.current = null;
      }
    };
  }, [user, isOffline, setupRealtimeSubscription]);

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
        // If fetch fails, check if we have cached data
        const cachedData = getProjectsFromCache();
        if (cachedData.length > 0) {
          setProjects(cachedData);
          setError('Could not connect to the network. Showing cached data.');
        } else {
          setError(`Could not load projects: ${fetchError.message}`);
        }
      }
    } catch (e) {
      console.error('Error fetching projects:', e);
      setError('An unexpected error occurred while loading projects.');
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
  }, [user, fetchProjects]);

  // Fetch projects on initialization and when user changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Create a new project with offline check
  const createProject = useCallback(async (project: Omit<NewProject, 'user_id'>) => {
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
        
        // Optimistically update the local state - real-time subscription will confirm later
        const updatedProjects = [createdProject, ...projects];
        setProjects(updatedProjects);
        saveProjectsToCache(updatedProjects);
        
        console.log('Project added to local state:', createdProject.title);
        console.log('Updated projects count:', updatedProjects.length);
        
        // Force a refresh of the projects list to ensure consistency
        setTimeout(() => {
          console.log('Refreshing projects after create');
          fetchProjects();
        }, 500);
        
        return { data: createdProject, error: null };
      } else {
        // If no data returned but also no error, just refresh the list
        console.log('No data returned from project creation, refreshing projects');
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
        setError('Network connection issue: Unable to create a new product');
        return { error: 'Network connection issue: Unable to create a new product' };
      }
      
      // Special handling for auth errors
      if (err.code === 'PGRST301' || (err.message && err.message.includes('JWT'))) {
        return { error: 'Permission error: Please try logging out and logging back in.' };
      }
      
      setError(err.message || 'Failed to create product');
      return { error: err.message || 'Failed to create product' };
    } finally {
      setLoading(false);
    }
  }, [user, isOffline, projects, fetchProjects]);

  // Get a single project by ID
  const getProject = useCallback(async (id: string) => {
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
  }, [user, isOffline, projects]);

  // Update an existing project
  const updateProject = useCallback(async (id: string, updates: ProjectUpdate) => {
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
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Update the project in our local state to reflect changes immediately
        const updatedProject = data[0];
        const updatedProjects = projects.map(p => 
          p.id === id ? updatedProject : p
        );
        
        setProjects(updatedProjects);
        saveProjectsToCache(updatedProjects);
        
        return { data: updatedProject, error: null };
      } else {
        // If no data returned but also no error, just refresh the list
        await fetchProjects();
        return { data: null, error: null };
      }
    } catch (err: any) {
      console.error('Error updating project:', err);
      
      // Network error handling
      if (err.message && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network request failed') ||
        err.message.includes('timeout')
      )) {
        setIsOffline(true);
        setError('Network connection issue: Unable to update product');
        return { error: 'Network connection issue: Unable to update product' };
      }
      
      setError(err.message || 'Failed to update product');
      return { error: err.message || 'Failed to update product' };
    } finally {
      setLoading(false);
    }
  }, [user, isOffline, projects, fetchProjects]);

  // Delete a project
  const deleteProject = useCallback(async (id: string, deleteContent: boolean = false) => {
    if (!user) return { error: 'No user signed in' };
    
    // Check for offline mode
    if (isOffline) {
      return { error: 'You are currently offline. Product deletion is not available.' };
    }
    
    try {
      setLoading(true);
      setError(null);

      // If deleteContent is true, delete associated content first
      if (deleteContent) {
        // First get the project to see what type of content it has
        const { data: projectData } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (projectData && projectData.content) {
          // Handle different content types
          const contentType = projectData.content.type || 'unknown';
          
          // If this project is associated with brain dumps, delete them
          if (contentType === 'ebook' || contentType === 'course') {
            // Delete associated brain dumps
            const { data: contentData } = await supabase
              .from('brain_dumps')
              .select('id')
              .eq('project_id', id);
              
            if (contentData && contentData.length > 0) {
              for (const item of contentData) {
                await supabase
                  .from('brain_dumps')
                  .delete()
                  .eq('id', item.id)
                  .eq('user_id', user.id);
              }
            }
          }
          
          // Delete any folder associations
          await supabase
            .from('folder_projects')
            .delete()
            .eq('project_id', id);
        }
      }

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
  }, [user, isOffline, projects]);

  return {
    projects,
    loading,
    error,
    isOffline,
    fetchProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject
  };
};