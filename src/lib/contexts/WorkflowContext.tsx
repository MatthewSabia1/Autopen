import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../supabase/supabase';
import { useAuth } from '../../../supabase/auth';
import { logError, logSupabaseOperation } from '../utils/debug';

// Define common workflow steps
export type BaseWorkflowStep =
  | 'creator'       // Initial product creator form
  | 'brain-dump'    // Brain dump input
  | 'idea-selection'// Select an idea from the brain dump analysis
  | 'completed';    // Workflow completed

// Define eBook specific workflow steps
export type EbookWorkflowStep =
  | BaseWorkflowStep
  | 'ebook-structure' // Define ebook structure/outline
  | 'ebook-writing'   // Generate ebook content
  | 'ebook-preview';  // Preview and download options

// More workflow types will be added here as they are developed
// export type CourseWorkflowStep = BaseWorkflowStep | 'course-structure' | 'course-modules' | 'course-preview';
// export type VideoWorkflowStep = BaseWorkflowStep | 'video-script' | 'video-storyboard' | 'video-preview';

// Combined type for all possible workflow steps
export type WorkflowStep = EbookWorkflowStep; // | CourseWorkflowStep | VideoWorkflowStep;

// Project type definition
export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: string;
  status: 'draft' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

// Brain dump type definition
export interface BrainDump {
  id: string;
  project_id: string;
  raw_content: string | null;
  analyzed_content: any | null;
  status: 'pending' | 'analyzing' | 'analyzed';
  created_at: string;
  updated_at: string;
}

// Brain dump file type definition
export interface BrainDumpFile {
  id: string;
  brain_dump_id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number;
  created_at: string;
  file?: File; // For local use
  preview?: string; // For local use
  type?: 'image' | 'document'; // For local use
}

// Brain dump link type definition
export interface BrainDumpLink {
  id: string;
  brain_dump_id: string;
  url: string;
  title: string;
  link_type: 'youtube' | 'webpage';
  transcript: string | null;
  created_at: string;
  thumbnail?: string; // For local use
  isLoadingTranscript?: boolean; // For local use
  transcriptError?: string; // For local use
}

// E-book idea type definition
export interface EbookIdea {
  id: string;
  brain_dump_id: string;
  title: string;
  description: string | null;
  source_data: string | null;
  created_at: string;
}

// E-book type definition
export interface Ebook {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  status: 'generating' | 'generated' | 'finalized';
  created_at: string;
  updated_at: string;
}

// E-book chapter type definition
export interface EbookChapter {
  id: string;
  ebook_id: string;
  title: string;
  content: string | null;
  order_index: number;
  status: 'pending' | 'generating' | 'generated';
  created_at: string;
  updated_at: string;
}

// Define possible workflow types
export type WorkflowType = 'ebook' | 'course' | 'video' | 'blog' | 'social';

// Workflow context state type
interface WorkflowContextState {
  workflowType: WorkflowType;      // Type of workflow (ebook, course, etc.)
  currentStep: WorkflowStep;       // Current step in the workflow
  project: Project | null;         // Associated project
  brainDump: BrainDump | null;     // Brain dump data (common to all workflows)
  brainDumpFiles: BrainDumpFile[]; // Uploaded files (common)
  brainDumpLinks: BrainDumpLink[]; // Added links (common)
  ebookIdeas: EbookIdea[];         // Ideas generated from brain dump (could be generalized)
  selectedIdeaId: string | null;   // Selected idea ID (common)
  
  // eBook specific state
  ebook: Ebook | null;
  ebookChapters: EbookChapter[];
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Future workflow-specific state will be added here
  // courseModules?: CourseModule[];
  // videoScenes?: VideoScene[];
}

// Workflow context functions type
interface WorkflowContextFunctions {
  // Common functions for all workflow types
  setWorkflowType: (type: WorkflowType) => void;
  setCurrentStep: (step: WorkflowStep) => void;
  createProject: (title: string, description: string) => Promise<string>;
  updateProject: (projectData: Partial<Project>) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  saveBrainDump: (content: string) => Promise<string>;
  addBrainDumpFile: (file: File) => Promise<void>;
  removeBrainDumpFile: (fileId: string) => Promise<void>;
  addBrainDumpLink: (url: string, title: string, linkType: 'youtube' | 'webpage') => Promise<string>;
  removeBrainDumpLink: (linkId: string) => Promise<void>;
  analyzeBrainDump: (progressCallback?: (status: string) => void) => Promise<void>;
  resetWorkflow: (newWorkflowType?: WorkflowType) => void;
  
  // eBook specific functions
  selectEbookIdea: (ideaId: string) => Promise<void>;
  createEbook: (title: string, description: string) => Promise<string>;
  generateEbookChapter: (chapterId: string) => Promise<void>;
  finalizeEbook: () => Promise<void>;
  
  // Future workflow-specific functions will be added here
  // createCourse?: (title: string, description: string) => Promise<string>;
  // createVideoScript?: (title: string, description: string) => Promise<string>;
}

// Combined workflow context type
type WorkflowContextType = WorkflowContextState & WorkflowContextFunctions;

// Create the context
const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// Initial state
const initialState: WorkflowContextState = {
  workflowType: 'ebook', // Default to eBook workflow for now
  currentStep: 'creator', // Start at the creator step rather than brain-dump
  project: null,
  brainDump: null,
  brainDumpFiles: [],
  brainDumpLinks: [],
  ebookIdeas: [],
  selectedIdeaId: null,
  ebook: null,
  ebookChapters: [],
  loading: false,
  error: null,
};

// Provider component
export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WorkflowContextState>(initialState);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();

  // Load project if projectId is in the URL
  useEffect(() => {
    if (projectId && user) {
      loadProject(projectId);
    }
  }, [projectId, user]);

  /**
   * Sets the current workflow type (ebook, course, etc.)
   */
  const setWorkflowType = (type: WorkflowType) => {
    setState(prevState => ({ ...prevState, workflowType: type }));
  };

  /**
   * Updates the current workflow step
   */
  const setCurrentStep = (step: WorkflowStep) => {
    // Scroll to top when changing steps
    window.scrollTo(0, 0);
    setState(prevState => ({ ...prevState, currentStep: step }));
  };

  /**
   * Creates a new content project
   */
  const createProject = async (title: string, description: string): Promise<string> => {
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    
    try {
      logSupabaseOperation('createProject', { title, description });
      
      // Check if user is authenticated
      if (!user) {
        console.error('User not authenticated');
        setState(prevState => ({ 
          ...prevState, 
          loading: false, 
          error: 'You must be logged in to create a project.' 
        }));
        throw new Error('User not authenticated. Please log in and try again.');
      }
      
      // First check if we already have a project with that title to avoid duplicates
      if (state.project && state.project.title === title && state.project.description === description) {
        logSupabaseOperation('createProject', { status: 'using existing project', id: state.project.id });
        setState(prevState => ({ ...prevState, loading: false }));
        // Return existing project ID if it already exists
        return state.project.id;
      }
      
      logSupabaseOperation('createProject', { 
        operation: 'insert project', 
        user_id: user.id,
        supabase_configured: !!supabase
      });
      
      const { data: project, error } = await supabase
        .from('projects')
        .insert([
          {
            title,
            description,
            type: 'ebook',
            status: 'draft',
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) {
        logError('WorkflowContext.createProject', error, { title, description });
        setState(prevState => ({ 
          ...prevState, 
          loading: false, 
          error: `Database error: ${error.message}` 
        }));
        throw error;
      }

      logSupabaseOperation('createProject', { status: 'success', project });
      setState(prevState => ({
        ...prevState,
        project,
        currentStep: 'brain-dump',
        loading: false
      }));

      return project.id;
    } catch (error: any) {
      logError('WorkflowContext.createProject', error);
      setState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: error.message || 'Failed to create project' 
      }));
      throw new Error(error.message || 'Failed to create project');
    }
  };

  /**
   * Updates an existing project
   */
  const updateProject = async (projectData: Partial<Project>): Promise<void> => {
    if (!state.project?.id) throw new Error('No active project');
    
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    
    try {
      const { error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', state.project.id);
      
      if (error) throw error;
      
      setState(prevState => ({ 
        ...prevState, 
        project: { ...prevState.project!, ...projectData },
        loading: false 
      }));
    } catch (error: any) {
      setState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: error.message || 'Failed to update project' 
      }));
      throw error;
    }
  };

  /**
   * Loads a project and all related data
   */
  const loadProject = async (projectId: string): Promise<void> => {
    if (!projectId) {
      console.warn('loadProject called without a projectId');
      return;
    }
    
    if (!user) {
      console.warn('User not authenticated, cannot load project');
      return;
    }
    
    // Prevent duplicate loading of the same project
    if (state.project?.id === projectId && !state.loading) {
      return;
    }
    
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    
    try {
      // Load project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();
      
      if (projectError) throw projectError;
      
      // Load brain dump if exists
      let foundBrainDump = null;
      let brainDumpFiles: BrainDumpFile[] = [];
      let brainDumpLinks: BrainDumpLink[] = [];
      let ebookIdeas: EbookIdea[] = [];
      
      try {
        const { data: brainDump, error: brainDumpError } = await supabase
          .from('brain_dumps')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!brainDumpError && brainDump) {
          foundBrainDump = brainDump;
          
          // Load brain dump files
          try {
            const { data: files } = await supabase
              .from('brain_dump_files')
              .select('*')
              .eq('brain_dump_id', brainDump.id);
            
            if (files) {
              brainDumpFiles = files;
            }
          } catch (filesErr) {
            console.error('Error loading brain dump files:', filesErr);
          }
          
          // Load brain dump links
          try {
            const { data: links } = await supabase
              .from('brain_dump_links')
              .select('*')
              .eq('brain_dump_id', brainDump.id);
            
            if (links) {
              brainDumpLinks = links;
            }
          } catch (linksErr) {
            console.error('Error loading brain dump links:', linksErr);
          }
          
          // Load e-book ideas
          try {
            const { data: ideas } = await supabase
              .from('ebook_ideas')
              .select('*')
              .eq('brain_dump_id', brainDump.id);
            
            if (ideas) {
              ebookIdeas = ideas;
            }
          } catch (ideasErr) {
            console.error('Error loading ebook ideas:', ideasErr);
          }
        }
      } catch (brainDumpErr) {
        console.error('Error loading brain dump:', brainDumpErr);
      }
      
      // Load e-book if exists
      let foundEbook = null;
      let ebookChapters: EbookChapter[] = [];
      
      try {
        const { data: ebook, error: ebookError } = await supabase
          .from('ebooks')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!ebookError && ebook) {
          foundEbook = ebook;
          
          // Load e-book chapters
          try {
            const { data: chapters } = await supabase
              .from('ebook_chapters')
              .select('*')
              .eq('ebook_id', ebook.id)
              .order('order_index', { ascending: true });
            
            if (chapters) {
              ebookChapters = chapters;
            }
          } catch (chaptersErr) {
            console.error('Error loading ebook chapters:', chaptersErr);
          }
        }
      } catch (ebookErr) {
        console.error('Error loading ebook:', ebookErr);
      }
      
      // Determine current step based on loaded data
      let currentStep: WorkflowStep = 'brain-dump';
      
      if (foundEbook && foundEbook.status === 'finalized') {
        currentStep = 'completed';
      } else if (foundEbook && ebookChapters.length > 0) {
        currentStep = 'ebook-writing';
      } else if (foundEbook) {
        currentStep = 'ebook-structure';
      } else if (foundBrainDump && ebookIdeas.length > 0) {
        currentStep = 'idea-selection';
      } else if (foundBrainDump) {
        currentStep = 'brain-dump';
      }
      
      // Update state with all loaded data
      setState(prevState => ({ 
        ...prevState,
        currentStep,
        project,
        brainDump: foundBrainDump,
        brainDumpFiles,
        brainDumpLinks,
        ebookIdeas,
        selectedIdeaId: null,
        ebook: foundEbook,
        ebookChapters,
        loading: false,
        error: null
      }));
    } catch (error: any) {
      setState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: error.message || 'Failed to load project' 
      }));
      console.error('Error in loadProject:', error);
    }
  };

  /**
   * Saves brain dump content
   */
  const saveBrainDump = async (content: string): Promise<string> => {
    if (!state.project?.id) throw new Error('No active project');
    
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    
    try {
      // Check if brain dump already exists
      if (state.brainDump) {
        // Update existing brain dump
        const { error } = await supabase
          .from('brain_dumps')
          .update({
            raw_content: content,
            updated_at: new Date().toISOString()
          })
          .eq('id', state.brainDump.id);
        
        if (error) throw error;
        
        setState(prevState => ({ 
          ...prevState, 
          brainDump: { 
            ...prevState.brainDump!, 
            raw_content: content,
            updated_at: new Date().toISOString()
          },
          loading: false 
        }));
        
        return state.brainDump.id;
      } else {
        // Create new brain dump
        const { data, error } = await supabase
          .from('brain_dumps')
          .insert({
            project_id: state.project.id,
            raw_content: content,
            status: 'pending'
          })
          .select()
          .single();
        
        if (error) throw error;
        
        setState(prevState => ({ 
          ...prevState, 
          brainDump: data,
          loading: false 
        }));
        
        return data.id;
      }
    } catch (error: any) {
      setState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: error.message || 'Failed to save brain dump' 
      }));
      throw error;
    }
  };

  /**
   * Adds a file to the brain dump
   */
  const addBrainDumpFile = async (file: File): Promise<void> => {
    if (!state.brainDump?.id) throw new Error('No active brain dump');
    
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    
    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user!.id}/${state.project!.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('brain-dump-files')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Create file record in database
      const { data, error } = await supabase
        .from('brain_dump_files')
        .insert({
          brain_dump_id: state.brainDump.id,
          file_name: file.name,
          file_type: file.type,
          file_path: filePath,
          file_size: file.size
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Determine if it's an image or document
      const isImage = file.type.startsWith('image/');
      const fileData: BrainDumpFile = {
        ...data,
        file,
        preview: isImage ? URL.createObjectURL(file) : undefined,
        type: isImage ? 'image' : 'document'
      };
      
      setState(prevState => ({ 
        ...prevState, 
        brainDumpFiles: [...prevState.brainDumpFiles, fileData],
        loading: false 
      }));
    } catch (error: any) {
      setState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: error.message || 'Failed to add file' 
      }));
      throw error;
    }
  };

  /**
   * Removes a file from the brain dump
   */
  const removeBrainDumpFile = async (fileId: string): Promise<void> => {
    if (!state.brainDump?.id) throw new Error('No active brain dump');
    
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    
    try {
      // Get file to delete
      const fileToDelete = state.brainDumpFiles.find(f => f.id === fileId);
      if (!fileToDelete) throw new Error('File not found');
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('brain-dump-files')
        .remove([fileToDelete.file_path]);
      
      if (storageError) throw storageError;
      
      // Delete from database
      const { error } = await supabase
        .from('brain_dump_files')
        .delete()
        .eq('id', fileId);
      
      if (error) throw error;
      
      // Revoke object URL if it exists to avoid memory leaks
      if (fileToDelete.preview) {
        URL.revokeObjectURL(fileToDelete.preview);
      }
      
      setState(prevState => ({ 
        ...prevState, 
        brainDumpFiles: prevState.brainDumpFiles.filter(f => f.id !== fileId),
        loading: false 
      }));
    } catch (error: any) {
      setState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: error.message || 'Failed to remove file' 
      }));
      throw error;
    }
  };

  /**
   * Adds a link to the brain dump
   */
  const addBrainDumpLink = async (
    url: string, 
    title: string, 
    linkType: 'youtube' | 'webpage'
  ): Promise<string> => {
    if (!state.brainDump?.id) throw new Error('No active brain dump');
    
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    
    try {
      // Create link record in database
      const { data, error } = await supabase
        .from('brain_dump_links')
        .insert({
          brain_dump_id: state.brainDump.id,
          url,
          title,
          link_type: linkType,
          transcript: null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add YouTube thumbnail if applicable
      let thumbnail: string | undefined;
      if (linkType === 'youtube') {
        try {
          const videoId = extractYoutubeVideoId(url);
          if (videoId) {
            thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
          }
        } catch (err) {
          console.error('Error generating YouTube thumbnail:', err);
        }
      }
      
      const linkData: BrainDumpLink = {
        ...data,
        thumbnail
      };
      
      setState(prevState => ({ 
        ...prevState, 
        brainDumpLinks: [...prevState.brainDumpLinks, linkData],
        loading: false 
      }));
      
      return data.id;
    } catch (error: any) {
      setState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: error.message || 'Failed to add link' 
      }));
      throw error;
    }
  };

  /**
   * Removes a link from the brain dump
   */
  const removeBrainDumpLink = async (linkId: string): Promise<void> => {
    if (!state.brainDump?.id) throw new Error('No active brain dump');
    
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    
    try {
      // Delete from database
      const { error } = await supabase
        .from('brain_dump_links')
        .delete()
        .eq('id', linkId);
      
      if (error) throw error;
      
      setState(prevState => ({ 
        ...prevState, 
        brainDumpLinks: prevState.brainDumpLinks.filter(l => l.id !== linkId),
        loading: false 
      }));
    } catch (error: any) {
      setState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: error.message || 'Failed to remove link' 
      }));
      throw error;
    }
  };

  /**
   * Analyzes the brain dump data and generates e-book ideas
   */
  const analyzeBrainDump = async (
    progressCallback?: (status: string) => void
  ): Promise<void> => {
    if (!state.brainDump?.id) throw new Error('No active brain dump');
    
    // Immediately update state to show analyzing
    setState(prevState => ({ 
      ...prevState, 
      loading: true, 
      error: null,
      brainDump: { 
        ...prevState.brainDump!, 
        status: 'analyzing'
      }
    }));
    
    try {
      // Update brain dump status in database
      try {
        await supabase
          .from('brain_dumps')
          .update({ status: 'analyzing' })
          .eq('id', state.brainDump.id);
          
        if (progressCallback) {
          progressCallback("Database updated, starting content analysis...");
        }
      } catch (statusError) {
        console.error("Error updating brain dump status:", statusError);
        if (progressCallback) {
          progressCallback("Database connection limited. Continuing with analysis...");
        }
      }
      
      // Import OpenRouter API integration
      let openRouterModule;
      try {
        openRouterModule = await import('../openRouter');
        
        if (progressCallback) {
          progressCallback("AI module loaded, preparing to analyze content...");
        }
        
        // Test OpenRouter connectivity before proceeding
        if (progressCallback) {
          progressCallback("Testing OpenRouter API connectivity...");
        }
        
        const { testOpenRouterConnectivity } = openRouterModule;
        const connectivityTest = await testOpenRouterConnectivity();
        
        if (!connectivityTest.success) {
          if (progressCallback) {
            progressCallback(`OpenRouter API connectivity test failed: ${connectivityTest.message}`);
          }
          
          setState(prevState => ({ 
            ...prevState, 
            loading: false, 
            error: `OpenRouter API connectivity issue: ${connectivityTest.message}`,
            brainDump: { 
              ...prevState.brainDump!, 
              status: 'pending' // Reset to pending to allow retrying 
            }
          }));
          
          throw new Error(`OpenRouter API connectivity issue: ${connectivityTest.message}`);
        }
        
        if (progressCallback) {
          progressCallback("OpenRouter API connectivity confirmed. Starting analysis...");
        }
      } catch (importError: any) {
        console.error("Failed to import OpenRouter module:", importError);
        
        // Provide more detailed error information
        const errorMessage = importError.message 
          ? `Failed to load OpenRouter module: ${importError.message}` 
          : "Failed to load OpenRouter module";
          
        setState(prevState => ({ 
          ...prevState, 
          loading: false, 
          error: errorMessage,
          brainDump: { 
            ...prevState.brainDump!, 
            status: 'pending' // Reset to pending to allow retrying 
          }
        }));
        
        if (progressCallback) {
          progressCallback(`Error: ${errorMessage}. Please try again.`);
        }
        
        throw new Error(errorMessage);
      }
      
      const { generateIdeasFromBrainDump } = openRouterModule as any;
      
      if (!generateIdeasFromBrainDump) {
        setState(prevState => ({ 
          ...prevState, 
          loading: false, 
          error: "OpenRouter functionality not available. Please check your installation." 
        }));
        throw new Error("OpenRouter generateIdeasFromBrainDump function not available");
      }
      
      // Get content for analysis
      const content = state.brainDump.raw_content || '';
      if (!content.trim()) {
        setState(prevState => ({ 
          ...prevState, 
          loading: false, 
          error: "Brain dump content is empty. Please add content and try again." 
        }));
        throw new Error("Brain dump content is empty");
      }
      
      // Get file names
      const fileNames = state.brainDumpFiles.map(file => file.file_name);
      
      // Get link URLs
      const linkUrls = state.brainDumpLinks.map(link => link.url);
      
      // Handle API progress updates
      const handleApiProgress = (status: {retry: number, maxRetries: number, message: string}) => {
        if (progressCallback) {
          progressCallback(status.message);
        }
      };
      
      // Generate ideas with explicit error handling
      let ideas;
      try {
        if (progressCallback) {
          progressCallback("Sending content to AI for analysis...");
        }
        
        ideas = await generateIdeasFromBrainDump(content, fileNames, linkUrls, handleApiProgress);
        
        if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
          setState(prevState => ({ 
            ...prevState, 
            loading: false, 
            error: "OpenRouter API did not return any ideas. Please try again." 
          }));
          throw new Error("No ideas returned from API");
        }
        
        if (progressCallback) {
          progressCallback(`Analysis complete! Generated ${ideas.length} ideas.`);
        }
      } catch (apiError) {
        console.error("API error during analysis:", apiError);
        setState(prevState => ({ 
          ...prevState, 
          loading: false, 
          error: `OpenRouter API error: ${apiError.message || "Unknown error during analysis"}` 
        }));
        throw apiError;
      }
      
      // Create analyzed content summary
      const analyzedContent = {
        topics: ideas.map((idea: any) => idea.title.split(' ')[0]).slice(0, 5),
        keyPoints: ideas.map((idea: any) => idea.title),
        generateDate: new Date().toISOString(),
        ideaCount: ideas.length
      };
      
      // Update brain dump with analyzed content
      try {
        if (progressCallback) {
          progressCallback("Saving analysis results...");
        }
        
        const { error } = await supabase
          .from('brain_dumps')
          .update({ 
            analyzed_content: analyzedContent,
            status: 'analyzed'
          })
          .eq('id', state.brainDump.id);
          
        if (error) {
          console.error("Database error during brain dump update:", error);
          if (progressCallback) {
            progressCallback("Warning: Database update failed, but analysis completed.");
          }
        } else if (progressCallback) {
          progressCallback("Analysis saved successfully!");
        }
      } catch (updateError) {
        console.error("Error updating brain dump with analysis:", updateError);
        if (progressCallback) {
          progressCallback("Warning: Failed to save analysis to database.");
        }
      }
      
      // Store the generated ideas in the database
      let createdIdeas = [];
      try {
        if (progressCallback) {
          progressCallback("Saving generated ideas...");
        }
        
        const { data, error } = await supabase
          .from('ebook_ideas')
          .insert(ideas.map((idea: any) => ({
            brain_dump_id: state.brainDump!.id,
            title: idea.title,
            description: idea.description,
            source_data: idea.source_data
          })))
          .select();
          
        if (!error && data) {
          createdIdeas = data;
          if (progressCallback) {
            progressCallback(`${data.length} ideas saved successfully.`);
          }
        } else if (error) {
          console.error("Error inserting ideas:", error);
          throw error;
        }
      } catch (ideasError) {
        console.error("Error inserting ebook ideas:", ideasError);
        setState(prevState => ({ 
          ...prevState, 
          loading: false, 
          error: `Failed to save ideas: ${ideasError.message || "Database error"}` 
        }));
        throw ideasError;
      }
      
      // Use local state if no created ideas (this should normally not happen given the error throwing above)
      if (createdIdeas.length === 0) {
        setState(prevState => ({ 
          ...prevState, 
          loading: false, 
          error: "Failed to save ideas to database" 
        }));
        throw new Error("No ideas were created in the database");
      }
      
      // Update state and proceed to next step
      setState(prevState => ({ 
        ...prevState, 
        brainDump: { 
          ...prevState.brainDump!, 
          analyzed_content: analyzedContent,
          status: 'analyzed'
        },
        ebookIdeas: createdIdeas,
        loading: false,
        currentStep: 'idea-selection', // Automatically advance to idea selection
        error: null
      }));
      
      if (progressCallback) {
        progressCallback("Analysis complete! Moving to idea selection.");
      }
      
    } catch (error: any) {
      console.error('Error in analyzeBrainDump:', error);
      
      // Make sure the UI reflects the error state
      setState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: error.message || "An unexpected error occurred during analysis",
        brainDump: { 
          ...prevState.brainDump!, 
          status: 'pending' // Reset to pending to allow retrying
        }
      }));
      
      if (progressCallback) {
        progressCallback(`Error: ${error.message || "Analysis failed"}`);
      }
    }
  };

  /**
   * Helper function to generate fallback ideas when AI analysis fails
   * This function is kept for reference but should no longer be used
   */
  const generateFallbackIdeas = (content: string, brainDumpId: string) => {
    console.warn("generateFallbackIdeas called but should not be used");
    throw new Error("Fallback ideas should not be used");
  };

  /**
   * Selects an e-book idea to use for the e-book
   */
  const selectEbookIdea = async (ideaId: string): Promise<void> => {
    setState(prevState => ({ 
      ...prevState, 
      selectedIdeaId: ideaId
    }));
  };

  /**
   * Creates a new e-book based on the selected idea
   */
  const createEbook = async (title: string, description: string): Promise<string> => {
    if (!state.project?.id) throw new Error('No active project');
    if (!state.selectedIdeaId && !title) throw new Error('No idea selected or title provided');
    
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    
    try {
      // Get selected idea if we have one
      const selectedIdea = state.selectedIdeaId 
        ? state.ebookIdeas.find(idea => idea.id === state.selectedIdeaId)
        : null;
      
      // Use idea title/description or provided values
      const bookTitle = title || (selectedIdea?.title || 'My eBook');
      const bookDescription = description || (selectedIdea?.description || '');
      
      // Import OpenRouter API integration dynamically to avoid circular dependencies
      const { generateEbookStructure } = await import('../openRouter');
      
      // Get brain dump content for reference
      const brainDump = state.brainDump;
      if (!brainDump) throw new Error('No brain dump available for reference');
      
      // Get reference content from brain dump
      let referenceContent = '';
      
      if (brainDump.raw_content) {
        // If the content is very large, summarize it to avoid token limits
        if (brainDump.raw_content.length > 25000) {
          referenceContent = brainDump.raw_content.substring(0, 25000) + 
            "\n\n[Content truncated for API limits. Total length: " + 
            brainDump.raw_content.length + " characters]";
        } else {
          referenceContent = brainDump.raw_content;
        }
      } else if (brainDump.analyzed_content) {
        referenceContent = JSON.stringify(brainDump.analyzed_content);
      }
      
      // Generate book structure using AI
      const bookStructure = await generateEbookStructure(
        { title: bookTitle, description: bookDescription },
        referenceContent
      );
      
      // Create e-book in database
      const { data: ebook, error: ebookError } = await supabase
        .from('ebooks')
        .insert({
          project_id: state.project.id,
          title: bookStructure.title,
          description: bookStructure.description,
          status: 'generating'
        })
        .select()
        .single();
      
      if (ebookError) throw ebookError;
      
      // Create chapters in database - ensure we create enough chapters for a substantial book
      // Aim for at least 10-15 chapters for a 30,000+ word book
      const normalizedChapters = bookStructure.chapters.length >= 10 
        ? bookStructure.chapters 
        : [
            // Always have introduction and conclusion
            { title: 'Introduction', description: 'Introduction to the book.', order_index: 0 },
            ...bookStructure.chapters
              .filter(c => c.order_index > 0 && c.order_index < bookStructure.chapters.length - 1)
              .flatMap(chapter => {
                // If we have fewer than 10 chapters, split some into multiple sub-topics
                const baseIdx = chapter.order_index;
                return [
                  { title: chapter.title, description: chapter.description, order_index: baseIdx * 2 - 1 },
                  { 
                    title: `Expanding on ${chapter.title}`, 
                    description: `Further exploration of concepts from ${chapter.title}.`,
                    order_index: baseIdx * 2
                  }
                ];
              }),
            { 
              title: 'Conclusion', 
              description: 'Summary and closing thoughts.', 
              order_index: Math.max(10, bookStructure.chapters.length * 2)
            }
          ];
          
      // Create chapters in database with appropriate indexing
      const { data: chapters, error: chaptersError } = await supabase
        .from('ebook_chapters')
        .insert(normalizedChapters.map((chapter, idx) => ({
          ebook_id: ebook.id,
          title: chapter.title,
          content: chapter.description, // Store the description in the content field temporarily
          order_index: chapter.order_index || idx,
          status: 'pending'
        })))
        .select();
      
      if (chaptersError) throw chaptersError;
      
      // Update project status
      await updateProject({ status: 'in_progress' });
      
      setState(prevState => ({ 
        ...prevState, 
        ebook,
        ebookChapters: chapters,
        loading: false
      }));
      
      return ebook.id;
    } catch (error: any) {
      logError('createEbook', error);
      setState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: error.message || 'Failed to create e-book' 
      }));
      throw error;
    }
  };

  /**
   * Generates content for an e-book chapter
   */
  const generateEbookChapter = async (chapterId: string): Promise<void> => {
    if (!state.ebook?.id) throw new Error('No active e-book');
    
    const chapter = state.ebookChapters.find(c => c.id === chapterId);
    if (!chapter) throw new Error('Chapter not found');

    // Get brain dump content for reference
    const brainDump = state.brainDump;
    if (!brainDump?.raw_content && !brainDump?.analyzed_content) {
      throw new Error('No brain dump content available for reference');
    }
    
    setState(prevState => ({ 
      ...prevState, 
      loading: true, 
      error: null,
      ebookChapters: prevState.ebookChapters.map(c => 
        c.id === chapterId ? { ...c, status: 'generating' as const } : c
      )
    }));
    
    try {
      // Import OpenRouter API integration dynamically to avoid circular dependencies
      const { generateChapterContent } = await import('../openRouter');
      
      // Get all previous chapters to provide context
      const sortedChapters = [...state.ebookChapters]
        .sort((a, b) => a.order_index - b.order_index);
      
      // Find chapters that come before this one and are already generated
      // Limit to the most recent 2-3 chapters to avoid token limits
      const previousChapters = sortedChapters
        .filter(c => c.order_index < chapter.order_index && c.content)
        .slice(-3) // Just take the 3 most recent chapters
        .map(c => ({ 
          title: c.title, 
          // Truncate content to reasonable size
          content: c.content?.length && c.content.length > 3000 
            ? c.content.substring(0, 3000) + '...' 
            : c.content 
        }));
      
      // Get reference content from brain dump - handle large content efficiently
      let referenceContent = '';
      
      if (brainDump.raw_content) {
        // If content is very large, take relevant segments based on chapter title
        // This is a simple approach; a more sophisticated implementation would use embeddings
        if (brainDump.raw_content.length > 10000) {
          // Look for sections that might be relevant to this chapter
          const chapterKeywords = chapter.title.toLowerCase().split(/\s+/)
            .filter(word => word.length > 3) // Only consider meaningful words
            .filter(word => !['chapter', 'introduction', 'conclusion', 'part', 'section'].includes(word));
            
          if (chapterKeywords.length > 0) {
            // Split content into paragraphs
            const paragraphs = brainDump.raw_content.split(/\n\n+/);
            
            // Find paragraphs containing keywords
            const relevantParagraphs = paragraphs.filter(para => 
              chapterKeywords.some(keyword => para.toLowerCase().includes(keyword))
            );
            
            // If we found relevant content, use it; otherwise use the beginning
            if (relevantParagraphs.length > 0) {
              referenceContent = relevantParagraphs.slice(0, 10).join('\n\n');
              
              // Add note about selected content
              referenceContent += `\n\n[Selected content relevant to: ${chapterKeywords.join(', ')}]`;
            } else {
              // Take a segment from the beginning
              referenceContent = brainDump.raw_content.substring(0, 8000);
              referenceContent += '\n\n[Content truncated for API limits]';
            }
          } else {
            // Without keywords, take a segment from beginning
            referenceContent = brainDump.raw_content.substring(0, 8000);
            referenceContent += '\n\n[Content truncated for API limits]';
          }
        } else {
          referenceContent = brainDump.raw_content;
        }
      } else if (brainDump.analyzed_content) {
        referenceContent = JSON.stringify(brainDump.analyzed_content);
      }
      
      // Generate chapter content using AI
      const chapterContent = await generateChapterContent(
        state.ebook.title,
        state.ebook.description || '',
        chapter.title,
        chapter.content || '', // Use existing content as description if any
        chapter.order_index,
        sortedChapters.length,
        referenceContent,
        previousChapters
      );
      
      // Update chapter in database
      const { error } = await supabase
        .from('ebook_chapters')
        .update({ 
          content: chapterContent,
          status: 'generated'
        })
        .eq('id', chapterId);
      
      if (error) throw error;
      
      // Check if all chapters are generated
      const updatedChapters = state.ebookChapters.map(c => 
        c.id === chapterId ? { 
          ...c, 
          content: chapterContent, 
          status: 'generated' as const 
        } : c
      );
      
      const allChaptersGenerated = updatedChapters.every(c => c.status === 'generated');
      
      // Update e-book status if all chapters are generated
      if (allChaptersGenerated) {
        await supabase
          .from('ebooks')
          .update({ status: 'generated' })
          .eq('id', state.ebook.id);
      }
      
      setState(prevState => ({ 
        ...prevState, 
        ebookChapters: updatedChapters,
        ebook: allChaptersGenerated ? { ...prevState.ebook!, status: 'generated' as const } : prevState.ebook,
        loading: false
      }));
    } catch (error: any) {
      logError('generateEbookChapter', error, { chapterId });
      
      // Create user-friendly error message
      let errorMessage = 'Failed to generate chapter';
      if (error.message?.includes('rate limit')) {
        errorMessage = 'API rate limit reached. Please try again in a few minutes.';
      } else if (error.message?.includes('token')) {
        errorMessage = 'Content is too large. Try splitting into smaller chunks.';
      }
      
      setState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: errorMessage,
        ebookChapters: prevState.ebookChapters.map(c => 
          c.id === chapterId ? { ...c, status: 'pending' as const } : c
        )
      }));
      throw error;
    }
  };

  /**
   * Finalizes the e-book
   */
  const finalizeEbook = async (): Promise<void> => {
    if (!state.ebook?.id) throw new Error('No active e-book');
    
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    
    try {
      // Check if all chapters are generated
      const allGenerated = state.ebookChapters.every(chapter => chapter.status === 'generated');
      
      if (!allGenerated) {
        throw new Error('All chapters must be generated before finalizing the e-book');
      }
      
      // Import formatEbookForExport function
      const { formatEbookForExport } = await import('../openRouter');
      
      // Format ebook content for export
      const markdownContent = formatEbookForExport(
        state.ebook.title,
        state.ebook.description || '',
        state.ebookChapters
      );
      
      // Store formatted content in a storage bucket for later download
      const filePath = `${state.project!.id}/${state.ebook.id}/${Date.now()}-ebook.md`;
      
      const { error: storageError } = await supabase.storage
        .from('ebooks')
        .upload(filePath, new Blob([markdownContent], { type: 'text/markdown' }));
      
      if (storageError) throw storageError;
      
      // Get public URL for the file
      const { data: publicUrlData } = supabase.storage
        .from('ebooks')
        .getPublicUrl(filePath);
      
      // Update e-book status and add download URL
      const { error: ebookError } = await supabase
        .from('ebooks')
        .update({ 
          status: 'finalized',
          cover_image_url: publicUrlData.publicUrl // Temporarily use this field to store markdown URL
        })
        .eq('id', state.ebook.id);
      
      if (ebookError) throw ebookError;
      
      // Update project status
      await updateProject({ status: 'completed' });
      
      setState(prevState => ({ 
        ...prevState, 
        ebook: { 
          ...prevState.ebook!, 
          status: 'finalized',
          cover_image_url: publicUrlData.publicUrl
        },
        project: { ...prevState.project!, status: 'completed' },
        loading: false
      }));
    } catch (error: any) {
      logError('finalizeEbook', error);
      setState(prevState => ({ 
        ...prevState, 
        loading: false, 
        error: error.message || 'Failed to finalize e-book' 
      }));
      throw error;
    }
  };

  /**
   * Resets the workflow state
   * Optionally can specify a specific workflow type to reset to
   */
  const resetWorkflow = (newWorkflowType?: WorkflowType) => {
    console.log('resetWorkflow called with:', newWorkflowType);
    
    if (newWorkflowType) {
      // Validate the workflow type to ensure it's a valid enum value
      const validWorkflowTypes: WorkflowType[] = ['ebook', 'course', 'video', 'blog', 'social'];
      
      if (!validWorkflowTypes.includes(newWorkflowType)) {
        console.error(`Invalid workflow type: "${newWorkflowType}". Using default "ebook" instead.`);
        newWorkflowType = 'ebook'; // Fallback to ebook for invalid types
      }
      
      console.log(`Setting workflow state to ${newWorkflowType} and navigating to /workflow/${newWorkflowType}`);
      
      setState({
        ...initialState,
        workflowType: newWorkflowType
      });
      navigate(`/workflow/${newWorkflowType}`);
    } else {
      console.log('Resetting workflow state to default and navigating to /workflow');
      setState(initialState);
      navigate('/workflow');
    }
  };

  /**
   * Helper function to extract YouTube video ID
   */
  const extractYoutubeVideoId = (url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname.includes('youtube.com')) {
        return parsedUrl.searchParams.get('v');
      } else if (parsedUrl.hostname.includes('youtu.be')) {
        return parsedUrl.pathname.slice(1);
      }
    } catch {
      // Invalid URL
    }
    return null;
  };

  // Context value
  const contextValue: WorkflowContextType = {
    ...state,
    setWorkflowType,
    setCurrentStep,
    createProject,
    updateProject,
    loadProject,
    saveBrainDump,
    addBrainDumpFile,
    removeBrainDumpFile,
    addBrainDumpLink,
    removeBrainDumpLink,
    analyzeBrainDump,
    selectEbookIdea,
    createEbook,
    generateEbookChapter,
    finalizeEbook,
    resetWorkflow
  };

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
};

// Custom hook to use the workflow context
export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}; 