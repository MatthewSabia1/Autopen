import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCreator } from './useCreator';
import { OpenRouterService } from '../lib/openRouter';
import { PDFGeneratorService } from '../lib/pdfGenerator';
import { 
  EbookWorkflowStep, 
  EbookChapter, 
  EbookContent,
  TableOfContents,
  WorkflowProgress
} from '../types/ebook.types';
import { Json } from '../types/database.types';

export const useEbookCreator = (contentId?: string) => {
  const { user } = useAuth();
  const { getContent, updateContent } = useCreator();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ebookContent, setEbookContent] = useState<EbookContent>({});
  const [chapters, setChapters] = useState<EbookChapter[]>([]);
  const [workflowProgress, setWorkflowProgress] = useState<WorkflowProgress>({
    currentStep: null,
    totalSteps: 9,
    stepsCompleted: []
  });
  const [generating, setGenerating] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Fetch eBook content and chapters
  const fetchEbookData = useCallback(async () => {
    if (!contentId || !user) {
      setLoading(false);
      return;
    }
    
    // Create a unique request ID for this fetch operation
    const requestId = `fetchEbook-${contentId}-${Date.now()}`;
    
    try {
      console.log(`[${requestId}] fetchEbookData called for contentId: ${contentId}`);
      setLoading(true);
      setError(null);
      
      // Get the content data
      const { data: contentData, error: contentError } = await getContent(contentId);
      
      if (contentError) {
        console.log(`[${requestId}] Error fetching content: ${contentError}`);
        setError(contentError);
        setLoading(false);
        return; // Return early to prevent further API calls
      }
      
      if (!contentData) {
        const errorMsg = 'Content not found';
        console.log(`[${requestId}] ${errorMsg}`);
        setError(errorMsg);
        setLoading(false);
        return; // Return early to prevent further API calls
      }
      
      // Check if this is an eBook type
      if (contentData.type !== 'ebook') {
        const errorMsg = 'Content is not an eBook';
        console.log(`[${requestId}] ${errorMsg}`);
        setError(errorMsg);
        setLoading(false);
        return; // Return early to prevent further API calls
      }
      
      // Set the workflow progress from saved data
      if (contentData.generation_progress) {
        const progress = contentData.generation_progress as WorkflowProgress;
        
        // Ensure the workflow progress has the required properties
        const sanitizedProgress: WorkflowProgress = {
          currentStep: progress.currentStep || null,
          totalSteps: progress.totalSteps || 9,
          stepsCompleted: Array.isArray(progress.stepsCompleted) ? progress.stepsCompleted : [],
          stepProgress: progress.stepProgress || {}
        };
        
        setWorkflowProgress(sanitizedProgress);
      } else {
        // Initialize with default values if no progress data exists
        setWorkflowProgress({
          currentStep: null,
          totalSteps: 9,
          stepsCompleted: [],
          stepProgress: {}
        });
      }
      
      // Parse eBook content from the content field
      let parsedEbookContent: EbookContent = {};
      if (contentData.content) {
        parsedEbookContent = contentData.content as EbookContent;
        setEbookContent(parsedEbookContent);
      }
      
      try {
        console.log(`[${requestId}] Fetching chapters`);
        // Fetch chapters from the database
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('ebook_chapters')
          .select('*')
          .eq('content_id', contentId)
          .order('chapter_index', { ascending: true });
        
        if (chaptersError) {
          console.log(`[${requestId}] Error fetching chapters: ${chaptersError.message}`);
          
          // Check if the error is because the table doesn't exist
          if (chaptersError.message.includes('does not exist')) {
            console.log(`[${requestId}] ebook_chapters table doesn't exist yet - using chapters from content field`);
            
            // Use chapters from content field if available
            if (parsedEbookContent.chapters && parsedEbookContent.chapters.length > 0) {
              setChapters(parsedEbookContent.chapters);
            } else {
              // Initialize with empty chapters array
              setChapters([]);
            }
          } else {
            // For other types of errors, set the error state
            setError(`Error fetching chapters: ${chaptersError.message}`);
          }
        } else if (chaptersData) {
          const mappedChapters: EbookChapter[] = chaptersData.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            content: chapter.content,
            chapterIndex: chapter.chapter_index,
            metadata: chapter.metadata || {}
          }));
          
          setChapters(mappedChapters);
          
          // Ensure the ebookContent.chapters is updated
          setEbookContent(prev => ({
            ...prev,
            chapters: mappedChapters
          }));
        }
      } catch (chapterErr: any) {
        console.error(`[${requestId}] Error in chapter fetch:`, chapterErr);
        // Continue with the workflow even if chapters can't be fetched
      }
      
      try {
        console.log(`[${requestId}] Fetching versions`);
        // Fetch versions
        const { data: versionsData, error: versionsError } = await supabase
          .from('ebook_versions')
          .select('*')
          .eq('content_id', contentId)
          .order('version_number', { ascending: false });
        
        if (versionsError) {
          console.error(`[${requestId}] Error fetching versions:`, versionsError);
          // If versions table doesn't exist, just continue without versions
          if (!versionsError.message.includes('does not exist')) {
            console.warn(`[${requestId}] Non-critical error fetching versions: ${versionsError.message}`);
          }
        } else if (versionsData) {
          setVersions(versionsData);
        }
      } catch (versionErr: any) {
        console.error(`[${requestId}] Error in version fetch:`, versionErr);
        // Continue with the workflow even if versions can't be fetched
      }
      
      console.log(`[${requestId}] Fetch completed successfully`);
      setLoading(false);
      
    } catch (err: any) {
      console.error(`[${requestId}] Error in fetchEbookData:`, err);
      setError(err.message || 'Error fetching eBook data');
    }
  }, [contentId, user, getContent]);
  
  // Load eBook data when contentId changes
  useEffect(() => {
    let isActive = true;
    
    // Only fetch if we have a contentId and it's not already loading
    if (contentId && isActive) {
      fetchEbookData();
    }
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isActive = false;
    };
  }, [contentId]); // Only depend on contentId, not on fetchEbookData
  
  // Update workflow progress
  const updateWorkflowProgress = async (progress: Partial<WorkflowProgress>) => {
    if (!contentId) return { error: 'No content ID provided' };
    
    try {
      const updatedProgress = { ...workflowProgress, ...progress };
      setWorkflowProgress(updatedProgress);
      
      // Update in the database
      const { error: updateError } = await updateContent(contentId, {
        generation_progress: updatedProgress as Json,
        workflow_step: updatedProgress.currentStep
      });
      
      if (updateError) {
        throw new Error(updateError);
      }
      
      return { error: null };
    } catch (err: any) {
      console.error('Error updating workflow progress:', err);
      return { error: err.message || 'Error updating workflow progress' };
    }
  };
  
  // Save eBook content
  const saveEbookContent = async (content: Partial<EbookContent>) => {
    if (!contentId) return { error: 'No content ID provided' };
    
    try {
      const updatedContent = { ...ebookContent, ...content };
      setEbookContent(updatedContent);
      
      // Update in the database - cast to Json type
      const { error: updateError } = await updateContent(contentId, {
        content: updatedContent as unknown as Json
      });
      
      if (updateError) {
        throw new Error(updateError);
      }
      
      return { error: null };
    } catch (err: any) {
      console.error('Error saving eBook content:', err);
      return { error: err.message || 'Error saving eBook content' };
    }
  };
  
  // Add or update a chapter
  const saveChapter = async (chapter: EbookChapter) => {
    if (!contentId) return { error: 'No content ID provided' };
    
    try {
      const chapterData = {
        content_id: contentId,
        title: chapter.title,
        content: chapter.content,
        chapter_index: chapter.chapterIndex,
        metadata: chapter.metadata || {}
      };
      
      try {
        let result;
        
        // If the chapter has an ID, update it
        if (chapter.id) {
          result = await supabase
            .from('ebook_chapters')
            .update(chapterData)
            .eq('id', chapter.id)
            .eq('content_id', contentId);
        } else {
          // Otherwise, insert a new chapter
          result = await supabase
            .from('ebook_chapters')
            .insert(chapterData)
            .select();
        }
        
        if (result.error) {
          if (result.error.message.includes('does not exist')) {
            console.log('ebook_chapters table does not exist yet - storing chapter in content only');
            // Continue with in-memory operation
          } else {
            throw new Error(`Error saving chapter: ${result.error.message}`);
          }
        }
      
        // It's ok if db operation failed due to missing table - still update in-memory state
        // Update local state
        if (chapter.id) {
          setChapters(prevChapters => 
            prevChapters.map(ch => 
              ch.id === chapter.id ? { ...chapter } : ch
            )
          );
        } else {
          // Add a fake ID for local state if there's no real one
          const newChapter = {
            ...chapter,
            id: chapter.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
          setChapters(prevChapters => [...prevChapters, newChapter]);
        }
        
      } catch (dbError) {
        console.warn('Failed to save to database, using in-memory state only:', dbError);
      }
      
      // Update the ebookContent.chapters as well
      setEbookContent(prev => {
        const updatedChapters = chapter.id 
          ? prev.chapters?.map(ch => ch.id === chapter.id ? { ...chapter } : ch) || []
          : [...(prev.chapters || []), chapter];
            
        // Also store the updated chapters array in the content object for persistence
        const updatedContent = {
          ...prev,
          chapters: updatedChapters
        };
        
        // Save to database as a backup storage method in case tables don't exist
        updateContent(contentId, {
          content: updatedContent as unknown as Json
        }).catch(err => {
          console.error('Failed to update content with chapter changes:', err);
        });
        
        return updatedContent;
      });
      
      return { error: null };
    } catch (err: any) {
      console.error('Error saving chapter:', err);
      return { error: err.message || 'Error saving chapter' };
    }
  };
  
  // Delete a chapter
  const deleteChapter = async (chapterId: string) => {
    if (!contentId) return { error: 'No content ID provided' };
    
    try {
      try {
        const { error: deleteError } = await supabase
          .from('ebook_chapters')
          .delete()
          .eq('id', chapterId)
          .eq('content_id', contentId);
        
        if (deleteError) {
          if (deleteError.message.includes('does not exist')) {
            console.log('ebook_chapters table does not exist yet - removing chapter from content only');
            // Continue with in-memory operation
          } else {
            throw new Error(`Error deleting chapter: ${deleteError.message}`);
          }
        }
      } catch (dbError) {
        console.warn('Failed to delete from database, using in-memory state only:', dbError);
      }
      
      // Even if DB operation failed due to missing table, continue with in-memory state
      // Update local state
      setChapters(prevChapters => prevChapters.filter(ch => ch.id !== chapterId));
      
      // Update ebookContent as well and persist in content object
      setEbookContent(prev => {
        const updatedChapters = prev.chapters?.filter(ch => ch.id !== chapterId) || [];
        
        // Create updated content object with filtered chapters array
        const updatedContent = {
          ...prev,
          chapters: updatedChapters
        };
        
        // Save to database as a backup storage method
        updateContent(contentId, {
          content: updatedContent as unknown as Json
        }).catch(err => {
          console.error('Failed to update content after chapter deletion:', err);
        });
        
        return updatedContent;
      });
      
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting chapter:', err);
      return { error: err.message || 'Error deleting chapter' };
    }
  };
  
  // Save a new version
  const saveVersion = async (pdfUrl: string) => {
    if (!contentId) return { error: 'No content ID provided' };
    
    try {
      // Determine the version number
      const versionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;
      
      const versionData = {
        content_id: contentId,
        version_number: versionNumber,
        pdf_url: pdfUrl,
        metadata: {
          timestamp: new Date().toISOString(),
          chapters: chapters.length
        }
      };
      
      const { data, error } = await supabase
        .from('ebook_versions')
        .insert(versionData)
        .select();
      
      if (error) {
        throw new Error(`Error saving version: ${error.message}`);
      }
      
      // Update local state
      if (data && data[0]) {
        setVersions([data[0], ...versions]);
      }
      
      return { error: null };
    } catch (err: any) {
      console.error('Error saving version:', err);
      return { error: err.message || 'Error saving version' };
    }
  };
  
  // Generate eBook components with AI
  
  // Step 1: Generate title
  const generateTitle = async (rawData: string) => {
    if (!contentId) return { error: 'No content ID provided' };
    
    try {
      setGenerating(true);
      setError(null);
      
      // Update workflow progress
      await updateWorkflowProgress({
        currentStep: EbookWorkflowStep.GENERATE_TITLE,
        stepsCompleted: [...workflowProgress.stepsCompleted.filter(step => 
          step !== EbookWorkflowStep.GENERATE_TITLE
        )]
      });
      
      // Generate title with AI
      const title = await OpenRouterService.generateEbookTitle(rawData);
      
      // Save the title to eBook content
      await saveEbookContent({
        title,
        rawData
      });
      
      // Update workflow progress
      await updateWorkflowProgress({
        stepsCompleted: [...workflowProgress.stepsCompleted, EbookWorkflowStep.GENERATE_TITLE]
      });
      
      return { title, error: null };
    } catch (err: any) {
      console.error('Error generating title:', err);
      setError(err.message || 'Error generating title');
      return { error: err.message || 'Error generating title' };
    } finally {
      setGenerating(false);
    }
  };
  
  // Step 2: Generate table of contents
  const generateTableOfContents = async () => {
    if (!contentId || !ebookContent.title || !ebookContent.rawData) {
      return { error: 'Missing title or raw data' };
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      // Update workflow progress
      await updateWorkflowProgress({
        currentStep: EbookWorkflowStep.GENERATE_TOC,
        stepsCompleted: [...workflowProgress.stepsCompleted.filter(step => 
          step !== EbookWorkflowStep.GENERATE_TOC
        )]
      });
      
      // Generate TOC with AI
      const tocJsonString = await OpenRouterService.generateEbookTOC(
        ebookContent.rawData,
        ebookContent.title
      );
      
      // Parse the TOC
      const tableOfContents: TableOfContents = JSON.parse(tocJsonString);
      
      // Save the TOC to eBook content
      await saveEbookContent({ tableOfContents });
      
      // Update workflow progress
      await updateWorkflowProgress({
        stepsCompleted: [...workflowProgress.stepsCompleted, EbookWorkflowStep.GENERATE_TOC]
      });
      
      return { tableOfContents, error: null };
    } catch (err: any) {
      console.error('Error generating table of contents:', err);
      setError(err.message || 'Error generating table of contents');
      return { error: err.message || 'Error generating table of contents' };
    } finally {
      setGenerating(false);
    }
  };
  
  // Step 3: Generate chapters
  const generateChapters = async () => {
    if (!contentId || !ebookContent.tableOfContents) {
      return { error: 'Missing table of contents' };
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      // Update workflow progress
      await updateWorkflowProgress({
        currentStep: EbookWorkflowStep.GENERATE_CHAPTERS,
        stepsCompleted: [...workflowProgress.stepsCompleted.filter(step => 
          step !== EbookWorkflowStep.GENERATE_CHAPTERS
        )]
      });
      
      const generatedChapters: EbookChapter[] = [];
      const { chapters: tocChapters } = ebookContent.tableOfContents;
      
      // Generate each chapter with AI
      for (let i = 0; i < tocChapters.length; i++) {
        const chapter = tocChapters[i];
        
        // Update step progress
        await updateWorkflowProgress({
          stepProgress: {
            ...workflowProgress.stepProgress,
            [EbookWorkflowStep.GENERATE_CHAPTERS]: (i / tocChapters.length) * 100
          }
        });
        
        // Generate chapter content
        const chapterContent = await OpenRouterService.generateEbookChapter(
          chapter.title,
          chapter.dataPoints
        );
        
        // Create chapter object
        const newChapter: EbookChapter = {
          title: chapter.title,
          content: chapterContent,
          chapterIndex: i,
          dataPoints: chapter.dataPoints
        };
        
        // Save to database
        const { error: saveError } = await saveChapter(newChapter);
        
        if (saveError) {
          console.error(`Error saving chapter ${i+1}:`, saveError);
        }
        
        generatedChapters.push(newChapter);
      }
      
      // Update workflow progress
      await updateWorkflowProgress({
        stepProgress: {
          ...workflowProgress.stepProgress,
          [EbookWorkflowStep.GENERATE_CHAPTERS]: 100
        },
        stepsCompleted: [...workflowProgress.stepsCompleted, EbookWorkflowStep.GENERATE_CHAPTERS]
      });
      
      return { chapters: generatedChapters, error: null };
    } catch (err: any) {
      console.error('Error generating chapters:', err);
      setError(err.message || 'Error generating chapters');
      return { error: err.message || 'Error generating chapters' };
    } finally {
      setGenerating(false);
    }
  };
  
  // Step 4: Generate introduction
  const generateIntroduction = async () => {
    if (!contentId || !ebookContent.title || !ebookContent.tableOfContents) {
      return { error: 'Missing title or table of contents' };
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      // Update workflow progress
      await updateWorkflowProgress({
        currentStep: EbookWorkflowStep.GENERATE_INTRODUCTION,
        stepsCompleted: [...workflowProgress.stepsCompleted.filter(step => 
          step !== EbookWorkflowStep.GENERATE_INTRODUCTION
        )]
      });
      
      // Generate introduction with AI
      const introduction = await OpenRouterService.generateEbookIntroduction(
        ebookContent.title,
        ebookContent.tableOfContents
      );
      
      // Save the introduction to eBook content
      await saveEbookContent({ introduction });
      
      // Update workflow progress
      await updateWorkflowProgress({
        stepsCompleted: [...workflowProgress.stepsCompleted, EbookWorkflowStep.GENERATE_INTRODUCTION]
      });
      
      return { introduction, error: null };
    } catch (err: any) {
      console.error('Error generating introduction:', err);
      setError(err.message || 'Error generating introduction');
      return { error: err.message || 'Error generating introduction' };
    } finally {
      setGenerating(false);
    }
  };
  
  // Step 5: Generate conclusion
  const generateConclusion = async () => {
    if (!contentId || !ebookContent.title || !ebookContent.tableOfContents) {
      return { error: 'Missing title or table of contents' };
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      // Update workflow progress
      await updateWorkflowProgress({
        currentStep: EbookWorkflowStep.GENERATE_CONCLUSION,
        stepsCompleted: [...workflowProgress.stepsCompleted.filter(step => 
          step !== EbookWorkflowStep.GENERATE_CONCLUSION
        )]
      });
      
      // Generate conclusion with AI
      const conclusion = await OpenRouterService.generateEbookConclusion(
        ebookContent.title,
        ebookContent.tableOfContents
      );
      
      // Save the conclusion to eBook content
      await saveEbookContent({ conclusion });
      
      // Update workflow progress
      await updateWorkflowProgress({
        stepsCompleted: [...workflowProgress.stepsCompleted, EbookWorkflowStep.GENERATE_CONCLUSION]
      });
      
      return { conclusion, error: null };
    } catch (err: any) {
      console.error('Error generating conclusion:', err);
      setError(err.message || 'Error generating conclusion');
      return { error: err.message || 'Error generating conclusion' };
    } finally {
      setGenerating(false);
    }
  };
  
  // Step 6: Assemble draft
  const assembleDraft = async () => {
    if (!contentId) return { error: 'No content ID provided' };
    
    try {
      setGenerating(true);
      setError(null);
      
      // Update workflow progress
      await updateWorkflowProgress({
        currentStep: EbookWorkflowStep.ASSEMBLE_DRAFT,
        stepsCompleted: [...workflowProgress.stepsCompleted.filter(step => 
          step !== EbookWorkflowStep.ASSEMBLE_DRAFT
        )]
      });
      
      // The draft is already assembled since we've been saving each component
      // No need to call fetchEbookData again as it may cause issues with missing tables
      console.log('Draft assembled from existing components');
      
      // Update workflow progress
      await updateWorkflowProgress({
        stepsCompleted: [...workflowProgress.stepsCompleted, EbookWorkflowStep.ASSEMBLE_DRAFT]
      });
      
      return { error: null };
    } catch (err: any) {
      console.error('Error assembling draft:', err);
      setError(err.message || 'Error assembling draft');
      return { error: err.message || 'Error assembling draft' };
    } finally {
      setGenerating(false);
    }
  };
  
  // Step 7: AI review and revision
  const reviewAndRevise = async () => {
    if (!contentId || !ebookContent) {
      return { error: 'Missing eBook content' };
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      // Update workflow progress
      await updateWorkflowProgress({
        currentStep: EbookWorkflowStep.AI_REVIEW,
        stepsCompleted: [...workflowProgress.stepsCompleted.filter(step => 
          step !== EbookWorkflowStep.AI_REVIEW
        )]
      });
      
      // Review and revise with AI
      const revisedContent = await OpenRouterService.reviewAndReviseEbook(ebookContent);
      
      // Save the revised content
      await saveEbookContent(revisedContent);
      
      // If chapters were revised, save them individually
      if (revisedContent.chapters) {
        for (let i = 0; i < revisedContent.chapters.length; i++) {
          const revisedChapter = revisedContent.chapters[i];
          const originalChapter = chapters[i];
          
          if (originalChapter && originalChapter.id) {
            await saveChapter({
              ...revisedChapter,
              id: originalChapter.id,
              chapterIndex: i
            });
          }
        }
      }
      
      // Update workflow progress
      await updateWorkflowProgress({
        stepsCompleted: [...workflowProgress.stepsCompleted, EbookWorkflowStep.AI_REVIEW]
      });
      
      return { revisedContent, error: null };
    } catch (err: any) {
      console.error('Error reviewing and revising:', err);
      setError(err.message || 'Error reviewing and revising');
      return { error: err.message || 'Error reviewing and revising' };
    } finally {
      setGenerating(false);
    }
  };
  
  // Step 8: Generate PDF
  const generatePDF = async (options = {}) => {
    if (!contentId || !ebookContent) {
      return { error: 'Missing eBook content' };
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      // Update workflow progress
      await updateWorkflowProgress({
        currentStep: EbookWorkflowStep.GENERATE_PDF,
        stepsCompleted: [...workflowProgress.stepsCompleted.filter(step => 
          step !== EbookWorkflowStep.GENERATE_PDF
        )]
      });
      
      // Generate PDF with customization options
      const pdfDataUrl = await PDFGeneratorService.generatePDFDataUrl(ebookContent, options);
      
      // Set preview URL
      setPreviewUrl(pdfDataUrl);
      
      // Save the version
      const { error: saveError } = await saveVersion(pdfDataUrl);
      
      if (saveError) {
        console.error('Error saving version:', saveError);
      }
      
      // Update workflow progress
      await updateWorkflowProgress({
        stepsCompleted: [...workflowProgress.stepsCompleted, EbookWorkflowStep.GENERATE_PDF]
      });
      
      // Update content status to completed
      await updateContent(contentId, {
        status: 'completed'
      });
      
      return { pdfUrl: pdfDataUrl, error: null };
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError(err.message || 'Error generating PDF');
      return { error: err.message || 'Error generating PDF' };
    } finally {
      setGenerating(false);
    }
  };
  
  // Execute the next step in the workflow
  const executeNextStep = async (): Promise<void> => {
    console.log('executeNextStep called');
    
    if (generating) {
      console.log('Already generating content, skipping');
      return Promise.resolve();
    }
    
    try {
      console.log('Setting generating state to true');
      setGenerating(true);
      
      // Check if all steps are completed
      if (workflowProgress.stepsCompleted.length >= (workflowProgress.totalSteps || 9)) {
        console.log('All steps already completed');
        return;
      }
      
      // Get the next step to execute
      let nextStep = workflowProgress.currentStep;
      
      // If no current step, determine from completed steps
      if (!nextStep) {
        const stepsInOrder = [
          EbookWorkflowStep.INPUT_HANDLING,
          EbookWorkflowStep.GENERATE_TITLE,
          EbookWorkflowStep.GENERATE_TOC,
          EbookWorkflowStep.GENERATE_CHAPTERS,
          EbookWorkflowStep.GENERATE_INTRODUCTION,
          EbookWorkflowStep.GENERATE_CONCLUSION,
          EbookWorkflowStep.ASSEMBLE_DRAFT,
          EbookWorkflowStep.AI_REVIEW,
          EbookWorkflowStep.GENERATE_PDF
        ];
        
        const completedSteps = workflowProgress.stepsCompleted || [];
        const nextStepIndex = stepsInOrder.findIndex(step => !completedSteps.includes(step));
        
        if (nextStepIndex !== -1) {
          nextStep = stepsInOrder[nextStepIndex];
        } else {
          // If all completed, default to generate PDF
          nextStep = EbookWorkflowStep.GENERATE_PDF;
        }
      }
      
      console.log(`Executing workflow step: ${nextStep}`);
      
      // Execute the appropriate step based on the current step
      let result: any;
      switch (nextStep) {
        case EbookWorkflowStep.GENERATE_TITLE:
          console.log('Generating title...');
          result = await generateTitle(ebookContent.rawData || '');
          break;
          
        case EbookWorkflowStep.GENERATE_TOC:
          console.log('Generating table of contents...');
          result = await generateTableOfContents();
          break;
          
        case EbookWorkflowStep.GENERATE_CHAPTERS:
          console.log('Generating chapters...');
          result = await generateChapters();
          break;
          
        case EbookWorkflowStep.GENERATE_INTRODUCTION:
          console.log('Generating introduction...');
          result = await generateIntroduction();
          break;
          
        case EbookWorkflowStep.GENERATE_CONCLUSION:
          console.log('Generating conclusion...');
          result = await generateConclusion();
          break;
          
        case EbookWorkflowStep.ASSEMBLE_DRAFT:
          console.log('Assembling draft...');
          result = await assembleDraft();
          break;
          
        case EbookWorkflowStep.AI_REVIEW:
          console.log('Performing AI review...');
          result = await reviewAndRevise();
          break;
          
        case EbookWorkflowStep.GENERATE_PDF:
          console.log('Generating PDF...');
          result = await generatePDF();
          break;
          
        default:
          console.log('No valid step to execute');
          return;
      }
      
      if (result && result.error) {
        console.error(`Error in step ${nextStep}:`, result.error);
        throw new Error(result.error);
      }
      
      console.log(`Successfully completed step: ${nextStep}`);
      
      // Update workflow progress with completed step
      const newCompletedSteps = [...workflowProgress.stepsCompleted];
      if (!newCompletedSteps.includes(nextStep)) {
        newCompletedSteps.push(nextStep);
      }
      
      // Determine the next step
      let newCurrentStep: EbookWorkflowStep | null = null;
      
      if (nextStep === EbookWorkflowStep.GENERATE_PDF) {
        // If the current step is GENERATE_PDF, we're done
        newCurrentStep = null;
      } else {
        // Find the next step in sequence
        const stepsInOrder = [
          EbookWorkflowStep.INPUT_HANDLING,
          EbookWorkflowStep.GENERATE_TITLE,
          EbookWorkflowStep.GENERATE_TOC,
          EbookWorkflowStep.GENERATE_CHAPTERS,
          EbookWorkflowStep.GENERATE_INTRODUCTION,
          EbookWorkflowStep.GENERATE_CONCLUSION,
          EbookWorkflowStep.ASSEMBLE_DRAFT,
          EbookWorkflowStep.AI_REVIEW,
          EbookWorkflowStep.GENERATE_PDF
        ];
        
        const currentIndex = stepsInOrder.indexOf(nextStep);
        if (currentIndex !== -1 && currentIndex < stepsInOrder.length - 1) {
          newCurrentStep = stepsInOrder[currentIndex + 1];
        }
      }
      
      // Update workflow progress
      const updatedProgress = {
        ...workflowProgress,
        stepsCompleted: newCompletedSteps,
        currentStep: newCurrentStep
      };
      
      console.log('Updating workflow progress:', updatedProgress);
      
      setWorkflowProgress(updatedProgress);
      
      // Save progress to database
      if (contentId) {
        try {
          const { error: updateError } = await updateContent(contentId, {
            generation_progress: updatedProgress
          });
          
          if (updateError) {
            console.error('Error updating workflow progress:', updateError);
          }
        } catch (err) {
          console.error('Error saving workflow progress:', err);
        }
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error executing next step:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };
  
  // Download PDF with options
  const downloadPDF = async (options = {}) => {
    if (!contentId || !ebookContent) {
      return { error: 'Missing eBook content' };
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      // Create a properly formatted filename preserving the eBook title case
      const safeFilename = `${ebookContent.title?.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_') || 'ebook'}.pdf`;
      
      // Use the PDFGeneratorService to save the PDF with options
      await PDFGeneratorService.savePDF(
        ebookContent,
        safeFilename,
        options
      );
      
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      setError(err.message || 'Error downloading PDF');
      return { error: err.message || 'Error downloading PDF' };
    } finally {
      setGenerating(false);
    }
  };
  
  return {
    loading,
    error,
    ebookContent,
    chapters,
    workflowProgress,
    generating,
    versions,
    previewUrl,
    saveEbookContent,
    saveChapter,
    deleteChapter,
    generateTitle,
    generateTableOfContents,
    generateChapters,
    generateIntroduction,
    generateConclusion,
    assembleDraft,
    reviewAndRevise,
    generatePDF,
    executeNextStep,
    downloadPDF,
    refreshData: fetchEbookData
  };
}; 