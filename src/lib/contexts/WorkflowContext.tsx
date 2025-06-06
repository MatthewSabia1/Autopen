import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../supabase/supabase';
import { useAuth } from '../../../supabase/auth';
import { logError, logSupabaseOperation } from '../utils/debug';
import { generateStructuredDocument } from '../brainDumpAnalyzer';

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
  status: 'pending' | 'analyzing' | 'analyzed' | 'complete';
  analysis_result?: any;
  structured_document?: string;
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
  target_audience?: string | null;
  format_approach?: string | null;
  unique_value?: string | null;
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
  metadata?: {
    target_audience?: string;
    format_approach?: string;
    unique_value?: string;
    exportUrls?: {
      markdown?: string;
    };
  };
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
  addBrainDumpLink: (url: string, title: string, linkType: 'youtube' | 'webpage', existingId?: string, thumbnail?: string, transcript?: string, isLoadingTranscript?: boolean, transcriptError?: string) => Promise<string>;
  removeBrainDumpLink: (linkId: string) => Promise<void>;
  analyzeBrainDump: (progressCallback?: (status: string) => void) => Promise<void>;
  resetWorkflow: (newWorkflowType?: WorkflowType, productId?: string) => void;
  
  // eBook specific functions
  selectEbookIdea: (ideaId: string) => Promise<void>;
  createEbook: (title: string, description: string, targetAudience?: string, formatApproach?: string, uniqueValue?: string) => Promise<string>;
  generateEbookChapter: (chapterId: string) => Promise<void>;
  finalizeEbook: () => Promise<void>;
  updateEbookChapters: (chapters: EbookChapter[]) => void;
  
  // Future workflow-specific functions will be added here
  // createCourse?: (title: string, description: string) => Promise<string>;
  // createVideoScript?: (title: string, description: string) => Promise<string>;

  // Chapter management functions
  addEbookChapter: (title: string, creationType: 'ai' | 'manual') => Promise<EbookChapter>;
  updateEbookChapter: (chapterId: string, content: string) => Promise<EbookChapter>;
  deleteEbookChapter: (chapterId: string) => Promise<void>;

  // Brain dump setters (used in creator page legacy code)
  setBrainDump?: (content: string | null) => void;
  setBrainDumpFiles?: (files: BrainDumpFile[]) => void;
  setBrainDumpLinks?: (links: BrainDumpLink[]) => void;
}

// Combined workflow context type
type WorkflowContextType = WorkflowContextState & WorkflowContextFunctions & {
  /** Alias for `loading` to keep backward compatibility */
  isLoading: boolean;
};

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
    linkType: 'youtube' | 'webpage',
    existingId?: string,
    thumbnail?: string,
    transcript?: string,
    isLoadingTranscript?: boolean,
    transcriptError?: string
  ): Promise<string> => {
    if (!state.brainDump?.id) throw new Error('No active brain dump');
    
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    
    try {
      let linkId: string;
      
      // Check if we're updating an existing link or creating a new one
      if (existingId) {
        // Update existing link
        const { error } = await supabase
          .from('brain_dump_links')
          .update({
            url,
            title,
            link_type: linkType,
            transcript: transcript || null
          })
          .eq('id', existingId);
        
        if (error) throw error;
        linkId = existingId;
        
        // Update link in state
        setState(prevState => ({ 
          ...prevState, 
          brainDumpLinks: prevState.brainDumpLinks.map(link => 
            link.id === existingId ? {
              ...link,
              url,
              title,
              link_type: linkType,
              transcript,
              thumbnail: thumbnail || link.thumbnail,
              isLoadingTranscript,
              transcriptError
            } : link
          ),
          loading: false 
        }));
      } else {
        // Create new link record in database
        const { data, error } = await supabase
          .from('brain_dump_links')
          .insert({
            brain_dump_id: state.brainDump.id,
            url,
            title,
            link_type: linkType,
            transcript: transcript || null
          })
          .select()
          .single();
        
        if (error) throw error;
        linkId = data.id;
        
        // Add YouTube thumbnail if applicable and not provided
        let linkThumbnail = thumbnail;
        if (linkType === 'youtube' && !linkThumbnail) {
          try {
            const videoId = extractYoutubeVideoId(url);
            if (videoId) {
              linkThumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            }
          } catch (err) {
            console.error('Error generating YouTube thumbnail:', err);
          }
        }
        
        const linkData: BrainDumpLink = {
          ...data,
          thumbnail: linkThumbnail,
          isLoadingTranscript,
          transcriptError
        };
        
        setState(prevState => ({ 
          ...prevState, 
          brainDumpLinks: [...prevState.brainDumpLinks, linkData],
          loading: false 
        }));
      }
      
      return linkId;
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
      
      // Use the shared content analyzer function
      try {
        // Import the brain dump analyzer
        const { analyzeBrainDumpContent } = await import('../brainDumpAnalyzer');
        
        if (progressCallback) {
          progressCallback("Analysis modules loaded, preparing to analyze content...");
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
        
        // Also generate a title for the brain dump if needed
        if (!state.project?.title || state.project.title === 'New Project') {
          try {
            const { generateTitle } = await import('../ai/textProcessor');
            const generatedTitle = await generateTitle(content);
            
            if (progressCallback) {
              progressCallback(`Generated title: "${generatedTitle}"`);
            }
            
            // Update project title
            try {
              await updateProject({ title: generatedTitle });
            } catch (titleUpdateError) {
              console.error("Error updating project title:", titleUpdateError);
            }
          } catch (titleError) {
            console.error("Error generating title:", titleError);
          }
        }
        
        // Process the content with the shared analyzer
        const analysisResult = await analyzeBrainDumpContent(
          content, 
          state.brainDumpFiles, 
          state.brainDumpLinks,
          progressCallback
        );
        
        // Generate a structured document from the analysis results
        const structuredDocument = generateStructuredDocument(analysisResult);
        
        // Update state with results and structured document
        setState(prevState => ({
          ...prevState,
          loading: false,
          brainDump: {
            ...prevState.brainDump!,
            status: 'analyzed',
            analysis_result: analysisResult,
            structured_document: structuredDocument
          }
        }));
        
        // Convert the analysis to ideas for the e-book workflow
        const ideas = generateIdeasFromAnalysis(analysisResult, content);
        
        // Create analyzed content summary
        const analyzedContent = {
          topics: analysisResult.keywords.slice(0, 5),
          keyPoints: ideas.map((idea: any) => idea.title),
          summary: analysisResult.summary,
          generateDate: new Date().toISOString(),
          ideaCount: ideas.length,
          stats: analysisResult.stats
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
      } catch (analysisError: any) {
        console.error("Error in analysis process:", analysisError);
        
        // Make sure the UI reflects the error state
        setState(prevState => ({ 
          ...prevState, 
          loading: false, 
          error: analysisError.message || "An unexpected error occurred during analysis",
          brainDump: { 
            ...prevState.brainDump!, 
            status: 'pending' // Reset to pending to allow retrying
          }
        }));
        
        if (progressCallback) {
          progressCallback(`Error: ${analysisError.message || "Analysis failed"}`);
        }
        
        throw analysisError;
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
   * Helper function to generate ideas from brain dump analysis
   */
  const generateIdeasFromAnalysis = (analysis: any, content: string): any[] => {
    try {
      // Generate at least 5 ideas based on the analysis
      const ideas = [];
      
      // Use keywords as the basis for ideas
      if (analysis.keywords && analysis.keywords.length > 0) {
        // Create base ideas from keywords
        for (const keyword of analysis.keywords.slice(0, 5)) {
          ideas.push({
            title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: A Complete Guide`,
            description: `A comprehensive exploration of ${keyword}, covering key concepts, practical applications, and best practices.`,
            source_data: JSON.stringify({
              keyword,
              source: 'keyword-analysis'
            })
          });
        }
        
        // Create some alternative formats using the same keywords
        if (analysis.keywords.length >= 3) {
          ideas.push({
            title: `The Ultimate Guide to ${analysis.keywords[0]}, ${analysis.keywords[1]}, and ${analysis.keywords[2]}`,
            description: `A comprehensive guide covering the interconnections between these key topics, with practical advice and strategies.`,
            source_data: JSON.stringify({
              keywords: analysis.keywords.slice(0, 3),
              source: 'combined-keywords'
            })
          });
        }
      }
      
      // If we couldn't generate enough ideas, add some generic ones based on the content length
      if (ideas.length < 5) {
        const words = content.trim().split(/\s+/);
        const wordSample = words.slice(0, 100).join(' ');
        
        ideas.push({
          title: 'The Complete Guide Based on Your Content',
          description: `A structured exploration of the key concepts in your content, organized for clarity and impact.`,
          source_data: JSON.stringify({
            contentSample: wordSample,
            source: 'content-analysis'
          })
        });
        
        ideas.push({
          title: 'Mastering the Fundamentals',
          description: `Learn the essential concepts and practical applications from your content, organized into a step-by-step guide.`,
          source_data: JSON.stringify({
            contentLength: words.length,
            source: 'fallback-idea'
          })
        });
      }
      
      // Add an idea based on the summary if available
      if (analysis.summary) {
        const summaryWords = analysis.summary.split(/\s+/);
        if (summaryWords.length >= 5) {
          // Extract a potential title from the first sentence
          const firstSentence = analysis.summary.split(/[.!?]+/)[0];
          const potentialTitle = firstSentence.length > 50 
            ? firstSentence.substring(0, 50) + '...'
            : firstSentence;
            
          ideas.push({
            title: potentialTitle,
            description: analysis.summary,
            source_data: JSON.stringify({
              source: 'summary-based'
            })
          });
        }
      }
      
      return ideas;
    } catch (err) {
      console.error("Error generating ideas from analysis:", err);
      
      // Return at least one fallback idea
      return [
        {
          title: 'A Comprehensive Guide to Your Content',
          description: 'A structured exploration of the key concepts in your content, organized for clarity and impact.',
          source_data: JSON.stringify({
            source: 'error-fallback'
          })
        }
      ];
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
  const createEbook = async (title: string, description: string, targetAudience?: string, formatApproach?: string, uniqueValue?: string): Promise<string> => {
    setState(prevState => ({ ...prevState, loading: true, error: null }));

    if (!state.project) {
      logError('createEbook', new Error('Project not loaded'));
      setState(prevState => ({ ...prevState, error: 'Project not found', loading: false }));
      throw new Error('Project not found');
    }

    if (!state.selectedIdeaId && !title) throw new Error('No idea selected or title provided');
    
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
          metadata: {
            target_audience: targetAudience,
            format_approach: formatApproach,
            unique_value: uniqueValue
          },
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
        loading: false,
        currentStep: 'ebook-writing'
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
        previousChapters,
        // @ts-ignore - We're adding metadata fields that may not be in the type definition yet
        state.ebook.metadata?.target_audience,
        // @ts-ignore - We're adding metadata fields that may not be in the type definition yet
        state.ebook.metadata?.format_approach,
        // @ts-ignore - We're adding metadata fields that may not be in the type definition yet
        state.ebook.metadata?.unique_value
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
      logError('generateEbookChapter', error);
      // CRITICAL: Reset chapter status to pending on error
      try {
        const { error: updateError } = await supabase
          .from('ebook_chapters')
          .update({ status: 'pending' })
          .eq('id', chapterId);
        
        if (updateError) {
          logError('generateEbookChapter:resetStatus', updateError);
        }
      } catch (resetErr) {
        logError('generateEbookChapter:resetStatusCatch', resetErr);
      }
      
      // Update state to reflect the reset status
      setState(prevState => ({
        ...prevState,
        ebookChapters: prevState.ebookChapters.map(ch =>
          ch.id === chapterId ? { ...ch, status: 'pending' } : ch
        ),
        loading: false,
        error: `Failed to generate chapter ${chapter.title}: ${error.message}`
      }));
      
      // Rethrow the original error to signal failure
      throw error;
    } finally {
      // Ensure loading is always set to false
      setState(prevState => ({
        ...prevState,
        loading: false
      }));
    }
  };

  /**
   * Finalizes the eBook, marking it as complete and generating a download link
   */
  const finalizeEbook = async (): Promise<void> => {
    if (!state.ebook || !state.project?.id) {
      throw new Error('Ebook or project not found');
    }
    
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    
    try {
      // Get markdown content
      const { formatEbookForExport } = await import('../openRouter');
      const markdownContent = formatEbookForExport(
        state.ebook.title,
        state.ebook.description || '',
        state.ebookChapters
      );
      
      // Create a file blob for the content
      const contentBlob = new Blob([markdownContent], { type: 'text/markdown' });
      
      // Generate a file path for storage
      const filePath = `${state.project!.id}/${state.ebook.id}/${Date.now()}-ebook.md`;
      
      // Try to store the file in Supabase storage
      let publicUrl = '';
      
      try {
        // Check if the bucket exists
        const { data: buckets, error: bucketsError } = await supabase.storage
          .listBuckets();
        
        const bucketExists = buckets?.some(bucket => bucket.name === 'ebooks');
        
        // If bucket doesn't exist, try to create it
        if (!bucketExists) {
          console.log('Ebooks bucket not found, attempting to create it...');
          const { error: createBucketError } = await supabase.storage
            .createBucket('ebooks', { public: true });
          
          if (createBucketError) {
            console.error('Failed to create ebooks bucket:', createBucketError);
            throw new Error(`Unable to create storage bucket: ${createBucketError.message}`);
          }
        }
        
        // Upload file to bucket
        const { error: storageError } = await supabase.storage
          .from('ebooks')
          .upload(filePath, contentBlob);
        
        if (storageError) throw storageError;
        
        // Get public URL for the file
        const { data: publicUrlData } = supabase.storage
          .from('ebooks')
          .getPublicUrl(filePath);
        
        publicUrl = publicUrlData.publicUrl;
      } catch (storageError) {
        console.error('Storage error:', storageError);
        // Continue with finalization even if storage fails
        // We'll just not have a public URL for the ebook
      }
      
      // Update e-book status and add export URL to metadata if available
      const currentMetadata = state.ebook?.metadata || {};
      const updateData: any = {
        status: 'finalized',
        metadata: {
          ...currentMetadata,
          ...(publicUrl && {
            exportUrls: {
              ...(currentMetadata.exportUrls || {}),
              markdown: publicUrl
            }
          })
        }
      };
      
      const { error: ebookError } = await supabase
        .from('ebooks')
        .update(updateData)
        .eq('id', state.ebook.id);
      
      if (ebookError) throw ebookError;
      
      // Update project status
      await updateProject({ status: 'completed' });
      
      setState(prevState => ({ 
        ...prevState, 
        ebook: { 
          ...prevState.ebook!, 
          status: 'finalized',
          metadata: {
            ...prevState.ebook!.metadata,
            ...(publicUrl && {
              exportUrls: {
                ...(prevState.ebook!.metadata?.exportUrls || {}),
                markdown: publicUrl
              }
            })
          }
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
   * Updates the ebook chapters state in the context
   * This ensures that changes to chapters made in child components are properly synced
   */
  const updateEbookChapters = (chapters: EbookChapter[]): void => {
    setState(prevState => ({
      ...prevState,
      ebookChapters: chapters
    }));
  };

  /**
   * Adds a new chapter to the current eBook
   */
  const addEbookChapter = async (title: string, creationType: 'ai' | 'manual'): Promise<EbookChapter> => {
    if (!state.ebook?.id) throw new Error('No active e-book');
    if (!title.trim()) throw new Error('Chapter title cannot be empty');

    setState(prevState => ({ ...prevState, loading: true, error: null }));

    try {
      // Determine the highest order_index
      const highestOrderIndex = state.ebookChapters.length > 0
        ? Math.max(...state.ebookChapters.map(c => c.order_index))
        : -1;

      // Create the new chapter in the database
      const { data: newChapter, error } = await supabase
        .from('ebook_chapters')
        .insert({
          ebook_id: state.ebook.id,
          title,
          order_index: highestOrderIndex + 1,
          status: creationType === 'manual' ? 'generated' : 'pending',
          content: creationType === 'manual' ? 'Edit this chapter to add your content.' : null,
        })
        .select('*')
        .single();

      if (error) throw error;
      if (!newChapter) throw new Error('Failed to create new chapter in database');

      // Update state
      setState(prevState => ({
        ...prevState,
        ebookChapters: [...prevState.ebookChapters, newChapter],
        loading: false
      }));

      return newChapter;
    } catch (error: any) {
      logError('addEbookChapter', error);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: error.message || 'Failed to add new chapter'
      }));
      throw error;
    }
  };

  /**
   * Updates the content of an existing eBook chapter
   */
  const updateEbookChapter = async (chapterId: string, content: string): Promise<EbookChapter> => {
    if (!state.ebook?.id) throw new Error('No active e-book');

    setState(prevState => ({ ...prevState, loading: true, error: null }));

    try {
      // Find the chapter to update in current state
      const chapterToUpdate = state.ebookChapters.find(c => c.id === chapterId);
      if (!chapterToUpdate) throw new Error('Chapter not found in context');

      // Update chapter in database
      const { data, error } = await supabase
        .from('ebook_chapters')
        .update({
          content,
          status: 'generated' // Assume saving means it's generated
        })
        .eq('id', chapterId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update chapter in database');

      const updatedChapter = data;

      // Update state
      setState(prevState => ({
        ...prevState,
        ebookChapters: prevState.ebookChapters.map(c =>
          c.id === chapterId ? updatedChapter : c
        ),
        loading: false
      }));

      return updatedChapter;
    } catch (error: any) {
      logError('updateEbookChapter', error);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: error.message || 'Failed to update chapter'
      }));
      throw error;
    }
  };

  /**
   * Deletes an eBook chapter
   */
  const deleteEbookChapter = async (chapterId: string): Promise<void> => {
    if (!state.ebook?.id) throw new Error('No active e-book');
    if (state.ebookChapters.length <= 1) throw new Error('Cannot delete the only chapter');

    setState(prevState => ({ ...prevState, loading: true, error: null }));

    try {
      // Delete from database
      const { error } = await supabase
        .from('ebook_chapters')
        .delete()
        .eq('id', chapterId);

      if (error) throw error;

      // Update state
      setState(prevState => ({
        ...prevState,
        ebookChapters: prevState.ebookChapters.filter(c => c.id !== chapterId),
        loading: false
      }));
    } catch (error: any) {
      logError('deleteEbookChapter', error);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: error.message || 'Failed to delete chapter'
      }));
      throw error;
    }
  };

  /**
   * Resets the workflow state
   * Optionally can specify a specific workflow type to reset to
   */
  const resetWorkflow = (newWorkflowType?: WorkflowType, productId?: string) => {
    console.log('resetWorkflow called with:', { newWorkflowType, productId });
    
    // Remove the unused productId parameter check
    if (productId) {
      console.warn('The productId parameter in resetWorkflow is deprecated and not used.');
    }
    
    // Proceed with normal workflow reset based on newWorkflowType
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

  // Context value
  const contextValue: WorkflowContextType = {
    ...state,
    isLoading: state.loading,
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
    updateEbookChapters,
    resetWorkflow,
    // Add new chapter functions
    addEbookChapter,
    updateEbookChapter,
    deleteEbookChapter,
    // Legacy setters (no-ops or simple state update)
    setBrainDump: (content) => {
      setState(prev => ({...prev, brainDump: prev.brainDump ? {...prev.brainDump, raw_content: content } : prev.brainDump }));
    },
    setBrainDumpFiles: (files) => {
      setState(prev => ({...prev, brainDumpFiles: files }));
    },
    setBrainDumpLinks: (links) => {
      setState(prev => ({...prev, brainDumpLinks: links }));
    },
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