import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Project } from './useProjects';
import { RealtimeChannel } from '@supabase/supabase-js';

export type Folder = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  itemCount?: number;
};

export type NewFolder = {
  name: string;
  description?: string | null;
};

export const useFolders = () => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const realtimeChannelRelationsRef = useRef<RealtimeChannel | null>(null);
  const initialLoadCompleteRef = useRef(false);
  const fetchInProgressRef = useRef(false);

  // Get folder item count directly from folder_projects table
  const getFolderItemCount = async (folderId: string): Promise<number> => {
    try {
      // Use direct count query as primary method since RPC is not available
      const { count, error: queryError } = await supabase
        .from('folder_projects')
        .select('project_id', { count: 'exact', head: true })
        .eq('folder_id', folderId);
      
      if (queryError) {
        console.error('Error getting folder item count:', queryError);
        return 0;
      }
      
      return count || 0;
    } catch (e) {
      console.error('Error in getFolderItemCount:', e);
      return 0;
    }
  };

  // Fetch all folders for the current user
  const fetchFolders = useCallback(async () => {
    // Prevent concurrent fetches and unnecessary fetches after initial load
    if (fetchInProgressRef.current) {
      console.log('fetchFolders: Fetch already in progress, skipping');
      return;
    }

    fetchInProgressRef.current = true;

    if (!user) {
      console.log('fetchFolders: No user, clearing folders');
      setFolders([]);
      setLoading(false);
      fetchInProgressRef.current = false;
      return;
    }

    try {
      console.log('fetchFolders: Starting folder fetch for user', user.id);
      if (!initialLoadCompleteRef.current) {
        setLoading(true);
      }
      
      // Fetch folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('project_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (foldersError) {
        console.error('fetchFolders: Error fetching folders:', foldersError);
        throw foldersError;
      }
      
      if (!foldersData) {
        console.log('fetchFolders: No folder data returned, clearing folders');
        setFolders([]);
        setLoading(false);
        initialLoadCompleteRef.current = true;
        fetchInProgressRef.current = false;
        return;
      }

      console.log(`fetchFolders: Found ${foldersData.length} folders`);
      
      // Fetch item counts for each folder with error handling
      const foldersWithCounts = await Promise.all(
        foldersData.map(async (folder) => {
          try {
            const itemCount = await getFolderItemCount(folder.id);
            console.log(`fetchFolders: Folder "${folder.name}" has ${itemCount} items`);
            
            return {
              ...folder,
              itemCount
            };
          } catch (countErr) {
            console.error(`Error getting count for folder ${folder.id}:`, countErr);
            return {
              ...folder,
              itemCount: 0
            };
          }
        })
      );
      
      console.log('fetchFolders: Setting folders with counts', foldersWithCounts.length);
      setFolders(foldersWithCounts);
      setError(null);
    } catch (e: any) {
      console.error('fetchFolders: Error in folder fetch:', e);
      setError(`Could not load folders: ${e.message}`);
    } finally {
      setLoading(false);
      initialLoadCompleteRef.current = true;
      fetchInProgressRef.current = false;
    }
  }, [user]);

  // Create a new folder
  const createFolder = async (folder: NewFolder) => {
    if (!user) return { error: 'No user signed in' };
    
    try {
      setLoading(true);
      setError(null);
      
      // Log request details for debugging
      console.log('Creating folder with data:', {
        name: folder.name,
        description: folder.description,
        user_id: user.id
      });
      
      // First, attempt to insert the folder
      const { error: createError } = await supabase
        .from('project_folders')
        .insert({
          name: folder.name,
          description: folder.description || null,
          user_id: user.id
        });
      
      if (createError) {
        console.error('Supabase error creating folder:', createError);
        throw createError;
      }
      
      // If insert was successful but didn't return data, query for the new folder
      const { data: newFolderData, error: fetchError } = await supabase
        .from('project_folders')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', folder.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (fetchError) {
        console.warn('Warning: Unable to fetch the newly created folder:', fetchError);
      }
      
      const folderData = newFolderData || {
        id: crypto.randomUUID(), // Generate a temporary ID for UI
        name: folder.name,
        description: folder.description || null,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Successfully created folder:', folderData);
      setFolders(prev => [{...folderData, itemCount: 0}, ...prev]);
      return { data: folderData };
    } catch (e: any) {
      console.error('Error creating folder:', e);
      // More detailed error logging
      if (e.code) console.error(`Error code: ${e.code}, Message: ${e.message}, Details:`, e);
      setError(`Could not create folder: ${e.message}`);
      return { error: e.message || 'Unknown error creating folder' };
    } finally {
      setLoading(false);
    }
  };

  // Update an existing folder
  const updateFolder = async (folderId: string, updates: Partial<NewFolder>) => {
    if (!user) return { error: 'No user signed in' };

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('project_folders')
        .update(updates)
        .eq('id', folderId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      if (data) {
        setFolders(prev => prev.map(f => 
          f.id === folderId ? { ...f, ...data } : f
        ));
        return { data };
      }
      
      return { error: 'Unknown error updating folder' };
    } catch (e: any) {
      console.error('Error updating folder:', e);
      setError(`Could not update folder: ${e.message}`);
      return { error: e.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete a folder
  const deleteFolder = async (folderId: string, deleteContent: boolean = false) => {
    if (!user) return { error: 'No user signed in' };

    try {
      setLoading(true);
      setError(null);
      
      // If deleteContent is true, first remove all associated content
      if (deleteContent) {
        // Get all folder-content relationships
        const { data: folderContents, error: contentsError } = await supabase
          .from('folder_projects')
          .select('project_id')
          .eq('folder_id', folderId);
          
        if (contentsError) throw contentsError;
        
        // Delete each content item
        if (folderContents && folderContents.length > 0) {
          // Process in batches to avoid hitting rate limits
          for (const item of folderContents) {
            // Delete project
            await supabase
              .from('projects')
              .delete()
              .eq('id', item.project_id)
              .eq('user_id', user.id);
            
            // If needed, also delete related brain dumps
            const { data: brainDumps } = await supabase
              .from('brain_dumps')
              .select('id')
              .eq('project_id', item.project_id);
              
            if (brainDumps && brainDumps.length > 0) {
              for (const dump of brainDumps) {
                await supabase
                  .from('brain_dumps')
                  .delete()
                  .eq('id', dump.id)
                  .eq('user_id', user.id);
              }
            }
          }
        }
      }
      
      // First delete all folder relationships
      const { error: relError } = await supabase
        .from('folder_projects')
        .delete()
        .eq('folder_id', folderId);
        
      if (relError) throw relError;
      
      // Then delete the folder itself
      const { error: deleteError } = await supabase
        .from('project_folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id);
      
      if (deleteError) throw deleteError;
      
      setFolders(prev => prev.filter(f => f.id !== folderId));
      return { success: true };
    } catch (e: any) {
      console.error('Error deleting folder:', e);
      setError(`Could not delete folder: ${e.message}`);
      return { error: e.message };
    } finally {
      setLoading(false);
    }
  };

  // Add a project to a folder
  const addProjectToFolder = async (folderId: string, projectId: string) => {
    if (!user) return { error: 'No user signed in' };

    try {
      setError(null);
      
      const { data, error: addError } = await supabase
        .from('folder_projects')
        .insert({
          folder_id: folderId,
          project_id: projectId
        })
        .select()
        .single();
      
      if (addError) throw addError;
      
      // Update the item count in the UI
      setFolders(prev => prev.map(f => 
        f.id === folderId ? { ...f, itemCount: (f.itemCount || 0) + 1 } : f
      ));
      
      return { data };
    } catch (e: any) {
      console.error('Error adding project to folder:', e);
      setError(`Could not add project to folder: ${e.message}`);
      return { error: e.message };
    }
  };

  // Remove a project from a folder
  const removeProjectFromFolder = async (folderId: string, projectId: string) => {
    if (!user) return { error: 'No user signed in' };

    try {
      setError(null);
      
      const { error: removeError } = await supabase
        .from('folder_projects')
        .delete()
        .eq('folder_id', folderId)
        .eq('project_id', projectId);
      
      if (removeError) throw removeError;
      
      // Update the item count in the UI
      setFolders(prev => prev.map(f => 
        f.id === folderId ? { ...f, itemCount: Math.max(0, (f.itemCount || 0) - 1) } : f
      ));
      
      return { error: null };
    } catch (e: any) {
      console.error('Error removing project from folder:', e);
      setError(`Could not remove project from folder: ${e.message}`);
      return { error: e.message };
    }
  };

  // Add content to a folder (support different content types)
  const addContentToFolder = async (folderId: string, contentId: string, contentType: string) => {
    if (!user) return { error: 'No user signed in' };

    try {
      setError(null);
      
      // Using the folder_projects table
      const { data, error: addError } = await supabase
        .from('folder_projects')
        .insert({
          folder_id: folderId,
          project_id: contentId
        })
        .select()
        .single();
      
      if (addError) throw addError;
      
      // Update the item count in the UI
      setFolders(prev => prev.map(f => 
        f.id === folderId ? { ...f, itemCount: (f.itemCount || 0) + 1 } : f
      ));
      
      return { data };
    } catch (e: any) {
      console.error('Error adding content to folder:', e);
      setError(`Could not add content to folder: ${e.message}`);
      return { error: e.message };
    }
  };

  // Remove content from a folder
  const removeContentFromFolder = async (folderId: string, contentId: string) => {
    if (!user) return { error: 'No user signed in' };

    try {
      setError(null);
      
      const { error: removeError } = await supabase
        .from('folder_projects')
        .delete()
        .eq('folder_id', folderId)
        .eq('project_id', contentId);
      
      if (removeError) throw removeError;
      
      // Update the item count in the UI
      setFolders(prev => prev.map(f => 
        f.id === folderId ? { ...f, itemCount: Math.max(0, (f.itemCount || 0) - 1) } : f
      ));
      
      return { error: null };
    } catch (e: any) {
      console.error('Error removing content from folder:', e);
      setError(`Could not remove content from folder: ${e.message}`);
      return { error: e.message };
    }
  };

  // Get all projects in a folder
  const getProjectsInFolder = useCallback(async (folderId: string) => {
    if (!user) return { error: 'No user signed in', data: [] };

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching projects for folder: ${folderId}`);
      
      const { data, error: fetchError } = await supabase
        .from('folder_projects')
        .select(`
          project_id,
          projects:project_id(*)
        `)
        .eq('folder_id', folderId);
      
      if (fetchError) {
        console.error('Error fetching folder projects:', fetchError);
        throw fetchError;
      }
      
      // Extract the projects from the nested structure and filter out any nulls
      const projects = data
        ?.map(item => item.projects)
        .filter(project => project !== null) as unknown as Project[];
      
      console.log(`Found ${projects.length} projects in folder ${folderId}`);
      
      return { data: projects };
    } catch (e: any) {
      console.error('Error fetching projects in folder:', e);
      setError(`Could not fetch projects in folder: ${e.message}`);
      return { error: e.message, data: [] };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Set up real-time subscription to folders
  const setupRealtimeSubscription = useCallback(() => {
    if (!user) return;

    // Clean up any existing subscription
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe();
      realtimeChannelRef.current = null;
    }

    console.log('Setting up real-time subscription for folders');
    
    const channel = supabase
      .channel('folders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'project_folders',
          filter: `user_id=eq.${user.id}` // Only listen to this user's folders
        },
        (payload) => {
          console.log('Received real-time folder update:', payload.eventType, payload);
          
          // Only process events after initial load is complete
          if (!initialLoadCompleteRef.current) {
            console.log('Ignoring real-time update until initial load is complete');
            return;
          }
          
          // Handle different events
          if (payload.eventType === 'INSERT') {
            const newFolder = payload.new as Folder;
            console.log('Adding new folder to state:', newFolder.name);
            
            // Add the new folder to the list only if it doesn't exist
            setFolders(prev => {
              // Check if folder already exists
              if (prev.some(f => f.id === newFolder.id)) {
                console.log('Folder already exists in state, not adding duplicate');
                return prev;
              }
              console.log('Folder added to state');
              
              // Add itemCount = 0 to the new folder
              const folderWithCount = {
                ...newFolder,
                itemCount: 0
              };
              
              return [folderWithCount, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedFolder = payload.new as Folder;
            console.log('Updating existing folder in state:', updatedFolder.name);
            
            // Update the folder in the list
            setFolders(prev => 
              prev.map(f => {
                if (f.id === updatedFolder.id) {
                  // Preserve the itemCount
                  return { ...updatedFolder, itemCount: f.itemCount };
                }
                return f;
              })
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedFolder = payload.old as Folder;
            console.log('Removing deleted folder from state:', deletedFolder.id);
            
            // Remove the folder from the list
            setFolders(prev => prev.filter(f => f.id !== deletedFolder.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Folder subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to folder changes');
        } else {
          console.warn('Folder subscription status not SUBSCRIBED:', status);
        }
      });

    realtimeChannelRef.current = channel;
    
    return () => {
      if (realtimeChannelRef.current) {
        console.log('Unsubscribing from folder changes');
        realtimeChannelRef.current.unsubscribe();
        realtimeChannelRef.current = null;
      }
    };
  }, [user]);

  // Set up real-time subscription to folder-project relationships
  const setupProjectRelationSubscription = useCallback(() => {
    if (!user) return;

    // Clean up any existing subscription
    if (realtimeChannelRelationsRef.current) {
      realtimeChannelRelationsRef.current.unsubscribe();
      realtimeChannelRelationsRef.current = null;
    }

    console.log('Setting up real-time subscription for folder-project relationships');
    
    const channel = supabase
      .channel('folder-projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'folder_projects'
        },
        (payload) => {
          console.log('Received real-time folder_projects update:', payload.eventType, payload);
          
          // Only process events after initial load is complete
          if (!initialLoadCompleteRef.current) {
            console.log('Ignoring real-time update until initial load is complete');
            return;
          }
          
          // When a project is added to a folder, update the folder's item count
          if (payload.eventType === 'INSERT') {
            const relation = payload.new as any;
            const folderId = relation.folder_id;
            
            console.log(`Project added to folder ${folderId}, updating count`);
            
            // Update the folder's item count
            setFolders(prev => 
              prev.map(f => {
                if (f.id === folderId) {
                  return { 
                    ...f, 
                    itemCount: (f.itemCount || 0) + 1 
                  };
                }
                return f;
              })
            );
          } 
          // When a project is removed from a folder, update the folder's item count
          else if (payload.eventType === 'DELETE') {
            const relation = payload.old as any;
            const folderId = relation.folder_id;
            
            console.log(`Project removed from folder ${folderId}, updating count`);
            
            // Update the folder's item count
            setFolders(prev => 
              prev.map(f => {
                if (f.id === folderId) {
                  return { 
                    ...f, 
                    itemCount: Math.max(0, (f.itemCount || 1) - 1)
                  };
                }
                return f;
              })
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Folder-projects subscription status:', status);
      });

    realtimeChannelRelationsRef.current = channel;
    
    return () => {
      if (realtimeChannelRelationsRef.current) {
        console.log('Unsubscribing from folder-projects changes');
        realtimeChannelRelationsRef.current.unsubscribe();
        realtimeChannelRelationsRef.current = null;
      }
    };
  }, [user]);

  // Initialize by fetching folders and setting up subscriptions
  useEffect(() => {
    // Run the initial fetch only once when the user becomes available
    if (user && !initialLoadCompleteRef.current && !fetchInProgressRef.current) {
      console.log('Initial folder fetch');
      fetchFolders();
    }
    
    // Set up subscriptions
    const unsubscribeFolders = setupRealtimeSubscription();
    const unsubscribeRelations = setupProjectRelationSubscription();
    
    return () => {
      // Clean up subscriptions
      if (unsubscribeFolders) unsubscribeFolders();
      if (unsubscribeRelations) unsubscribeRelations();
    };
  }, [user, fetchFolders, setupRealtimeSubscription, setupProjectRelationSubscription]);

  return {
    folders,
    loading,
    error,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    getProjectsInFolder,
    addProjectToFolder,
    removeProjectFromFolder,
    addContentToFolder,
    removeContentFromFolder
  };
}; 