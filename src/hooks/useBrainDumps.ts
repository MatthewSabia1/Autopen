import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase/supabase';
import { useAuth } from '../../supabase/auth';
import { analyzeBrainDumpContent } from '@/lib/brainDumpAnalyzer';
import { generateTitle } from '@/lib/ai/textProcessor';

export type BrainDumpMetadata = {
  wordCount: number;
  fileCount: number;
  linkCount: number;
  summary?: string;
  keywords?: string[];
  analyzedContent?: any;
  structuredDocument?: string;
  files?: any[];
  links?: any[];
  [key: string]: unknown;
};

export type SavedBrainDump = {
  id: string;
  title: string;
  description?: string;
  content: string;
  status: 'draft' | 'analyzed' | 'complete';
  created_at: string;
  updated_at: string;
  user_id: string;
  metadata?: BrainDumpMetadata;
};

export function useBrainDumps() {
  const { user } = useAuth();
  const [brainDumps, setBrainDumps] = useState<SavedBrainDump[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Function to fetch all brain dumps for the current user
  const fetchBrainDumps = useCallback(async () => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('saved_brain_dumps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setBrainDumps(data || []);
      return data;
    } catch (err: any) {
      console.error('Error fetching brain dumps:', err);
      setError(err.message || 'Error fetching brain dumps');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch brain dumps when the component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchBrainDumps();
    }
  }, [user, fetchBrainDumps]);

  // Function to get a single brain dump by ID
  const getBrainDumpById = async (id: string) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('saved_brain_dumps')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (err: any) {
      console.error('Error fetching brain dump:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new brain dump
  const createBrainDump = async (brainDump: Omit<SavedBrainDump, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      
      const newBrainDump = {
        ...brainDump,
        user_id: user.id,
      };
      
      const { data, error } = await supabase
        .from('saved_brain_dumps')
        .insert([newBrainDump])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setBrainDumps(prev => [data, ...prev]);
      
      return data;
    } catch (err: any) {
      console.error('Error creating brain dump:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update an existing brain dump
  const updateBrainDump = async (id: string, updates: Partial<SavedBrainDump>) => {
    if (!user) return null;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('saved_brain_dumps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setBrainDumps(prev => 
        prev.map(item => item.id === id ? data : item)
      );
      
      return data;
    } catch (err: any) {
      console.error('Error updating brain dump:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a brain dump
  const deleteBrainDump = async (id: string) => {
    if (!user) return false;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('saved_brain_dumps')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setBrainDumps(prev => prev.filter(item => item.id !== id));
      
      return true;
    } catch (err: any) {
      console.error('Error deleting brain dump:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to save brain dump from workflow
  const saveBrainDumpFromWorkflow = async (
    title: string | null, 
    content: string, 
    analyzedContent: any | null,
    files?: any[],
    links?: any[]
  ) => {
    if (!user) return null;
    
    try {
      // Generate a title if one wasn't provided
      let finalTitle = title;
      if (!finalTitle || finalTitle === 'Brain Dump' || finalTitle === 'Untitled Brain Dump') {
        try {
          finalTitle = await generateTitle(content);
        } catch (titleErr) {
          console.error('Error generating title:', titleErr);
          finalTitle = 'Brain Dump ' + new Date().toLocaleDateString();
        }
      }
      
      const status = analyzedContent ? 'analyzed' : 'draft';
      
      // Calculate word count
      const wordCount = content ? content.trim().split(/\s+/).length : 0;
      
      // Create metadata object
      const metadata: BrainDumpMetadata = {
        wordCount: wordCount,
        fileCount: files?.length || 0,
        linkCount: links?.length || 0,
        summary: content ? content.substring(0, 150) + (content.length > 150 ? '...' : '') : '',
        files: files,
        links: links,
      };
      
      // Add analyzed content if available
      if (analyzedContent) {
        metadata.analyzedContent = analyzedContent;
      }
      
      // Create the brain dump
      const newBrainDump = {
        title: finalTitle,
        content,
        status,
        metadata
      };
      
      return await createBrainDump(newBrainDump);
    } catch (err: any) {
      console.error('Error saving brain dump from workflow:', err);
      throw err;
    }
  };
  
  // Function to analyze a brain dump's content
  const analyzeBrainDump = async (
    id: string | null,
    content: string,
    files?: any[],
    links?: any[],
    progressCallback?: (message: string) => void
  ) => {
    try {
      // Set a default progress callback if none provided
      const progress = progressCallback || ((msg: string) => console.log(msg));
      
      progress("Starting content analysis...");
      
      // Calculate word count for validation
      const wordCount = content.trim().split(/\s+/).length;
      const fileCount = files?.length || 0;
      const linkCount = links?.length || 0;
      
      // Check if there's enough content to analyze
      if (wordCount < 50 && fileCount === 0 && linkCount === 0) {
        throw new Error("Not enough content to analyze. Please provide at least 50 words or add files/links.");
      }
      
      progress("Processing content...");
      
      // Call the content analyzer function
      const result = await analyzeBrainDumpContent(content, files, links, progress);
      
      if (!result) {
        throw new Error("Analysis failed to produce results");
      }
      
      progress("Analysis complete!");
      
      // If an ID was provided, update the brain dump with the analyzed content
      if (id && user) {
        await updateBrainDump(id, {
          status: 'analyzed',
          metadata: {
            wordCount: wordCount,
            fileCount: fileCount,
            linkCount: linkCount,
            summary: content.substring(0, 150) + (content.length > 150 ? '...' : ''),
            analyzedContent: result,
            files: files,
            links: links,
          }
        });
      }
      
      return result;
    } catch (err: any) {
      console.error("Error analyzing brain dump:", err);
      throw err;
    }
  };

  // Function to refresh the brain dumps list
  const refreshBrainDumps = async () => {
    return await fetchBrainDumps();
  };

  // Helper to convert file objects from the standalone format to workflow format
  const convertFilesToWorkflowFormat = (files: any[]): any[] => {
    // Make sure we're returning a format compatible with the analyzer
    return files.map(file => ({
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      content: file.content || null, // Include any extracted content
      file: file.file // Include the actual file object
    }));
  };

  // Helper to convert link objects from the standalone format to workflow format
  const convertLinksToWorkflowFormat = (links: any[]): any[] => {
    // Make sure we're returning a format compatible with the analyzer
    return links.map(link => ({
      id: link.id,
      url: link.url,
      title: link.title || link.url,
      type: link.type,
      transcript: link.transcript || null // Include any extracted transcript
    }));
  };

  // Also expose standalone functions for integration with WorkflowContext
  // This allows brain-dump.tsx to use the workflow functionalities
  const analyzeBrainDumpContentForStandalone = async (content: string, files?: any[], links?: any[], progressCallback?: (message: string) => void) => {
    try {
      // console.log("analyzeBrainDumpContentForStandalone called with:", { 
      //   contentLength: content?.length, 
      //   filesCount: files?.length, 
      //   linksCount: links?.length 
      // });
      
      // Convert files and links to the format expected by the analyzer
      const formattedFiles = files ? convertFilesToWorkflowFormat(files) : [];
      const formattedLinks = links ? convertLinksToWorkflowFormat(links) : [];
      
      // console.log("Formatted objects:", { 
      //   formattedFiles: formattedFiles.length, 
      //   formattedLinks: formattedLinks.length 
      // });
      
      // Use the imported analyzeBrainDumpContent from the top of the file
      const result = await analyzeBrainDumpContent(
        content, 
        formattedFiles, 
        formattedLinks, 
        progressCallback || (msg => console.log("Analysis progress:", msg)) // Keep progress log
      );
      
      // Generate a structured document from the analysis results
      const { generateStructuredDocument } = await import('@/lib/brainDumpAnalyzer');
      const structuredDocument = generateStructuredDocument(result);
      
      // Add the structured document to the result
      const enhancedResult = {
        ...result,
        structuredDocument
      };
      
      // console.log("Analysis result:", enhancedResult);
      return enhancedResult;
    } catch (err) {
      console.error("Error in analyzeBrainDumpContentForStandalone:", err); // Keep error log
      throw err;
    }
  };

  /**
   * Get or Create Brain Dump For Project
   * Finds an existing brain dump associated with a project ID, 
   * or creates a new one if none exists.
   */
  const getOrCreateBrainDumpForProject = useCallback(async (projectId: string): Promise<SavedBrainDump | null> => {
    if (!user) return null;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Try to find existing brain dump by project_id
      const { data: existingDumps, error: findError } = await supabase
        .from('brain_dumps')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) // Get the most recent one if multiple exist
        .limit(1);

      if (findError) {
        console.error('Error finding brain dump for project:', findError);
        throw findError;
      }

      if (existingDumps && existingDumps.length > 0) {
        console.log(`Found existing brain dump ${existingDumps[0].id} for project ${projectId}`);
        setIsLoading(false);
        return existingDumps[0];
      }

      // 2. If not found, create a new one
      console.log(`No existing brain dump found for project ${projectId}, creating new...`);
      const newBrainDumpData: Omit<SavedBrainDump, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
        title: 'New Brain Dump (Workflow)',
        content: '', // Start empty
        project_id: projectId,
        metadata: { 
          createdAt: new Date().toISOString(),
          status: 'new',
          wordCount: 0,
          fileCount: 0,
          linkCount: 0
        }
      };

      const { data: newDump, error: createError } = await supabase
        .from('brain_dumps')
        .insert({ ...newBrainDumpData, user_id: user.id })
        .select()
        .single();

      if (createError) {
        console.error('Error creating new brain dump for project:', createError);
        throw createError;
      }

      console.log(`Created new brain dump ${newDump.id} for project ${projectId}`);
      setIsLoading(false);
      // Optional: Add to local state? Depends on how state is managed.
      // setBrainDumps(prev => [newDump, ...prev]); 
      return newDump;

    } catch (err: any) {
      setError(err.message || 'Failed to get or create brain dump for project');
      setIsLoading(false);
      return null;
    }
  }, [user, supabase]);

  return {
    brainDumps,
    isLoading,
    error,
    getBrainDumpById,
    createBrainDump,
    updateBrainDump,
    deleteBrainDump,
    saveBrainDumpFromWorkflow,
    analyzeBrainDump,
    getOrCreateBrainDumpForProject,
    refreshBrainDumps,
    analyzeBrainDumpContent: analyzeBrainDumpContentForStandalone,
    isDeleting
  };
} 