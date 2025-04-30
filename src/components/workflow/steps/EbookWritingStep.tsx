import React, { useState, useEffect } from 'react';
import { useWorkflow, WorkflowStep } from '@/lib/contexts/WorkflowContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle,
  BookText, 
  ChevronDown,
  ChevronUp, 
  Clock, 
  FileEdit, 
  Loader2, 
  RotateCcw, 
  Sparkles,
  ArrowRight,
  Save,
  Edit,
  X,
  CheckCircle,
  Trash2,
  Plus,
  PenLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DialogTitle, DialogFooter, Dialog, DialogContent, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { useProducts } from '@/hooks/useProducts';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '../../../../supabase/supabase';
import ReactMarkdown from 'react-markdown';

/**
 * The eBook writing step in the workflow.
 * Manages the generation of individual chapters using Google Gemini AI.
 */
const EbookWritingStep = () => {
  const { 
    ebook, 
    ebookChapters, 
    generateEbookChapter,
    setCurrentStep,
    project,
    updateEbookChapters,
    addEbookChapter,
    updateEbookChapter,
    deleteEbookChapter
  } = useWorkflow();
  const { createProduct, updateProduct } = useProducts();

  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingChapter, setGeneratingChapter] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [savingChapter, setSavingChapter] = useState<string | null>(null);
  // Keep a local copy of chapters that we can update directly for UI purposes
  const [localChapters, setLocalChapters] = useState<any[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);
  
  // State for chapter deletion and addition
  const [deletingChapter, setDeletingChapter] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [addChapterDialogOpen, setAddChapterDialogOpen] = useState<boolean>(false);
  const [newChapterTitle, setNewChapterTitle] = useState<string>('');
  const [newChapterCreationType, setNewChapterCreationType] = useState<'ai' | 'manual'>('ai');
  const [addingChapter, setAddingChapter] = useState<boolean>(false);
  
  // When ebookChapters from context change, update our local copy
  useEffect(() => {
    if (ebookChapters && ebookChapters.length > 0) {
      setLocalChapters([...ebookChapters]);
    }
  }, [ebookChapters]);

  // Create or update draft product when chapters are generated
  useEffect(() => {
    const saveDraftProduct = async () => {
      if (!ebook || !project || !ebookChapters.length) return;
      
      // Find existing draft product ID
      let existingProductId: string | null = null;
      try {
        const { data: existingProduct, error: findError } = await supabase
          .from('products')
          .select('id')
          .eq('project_id', project.id)
          .eq('type', 'ebook')
          .in('status', ['draft', 'in_progress']) // Check for existing draft or in-progress
          .maybeSingle(); // Expect 0 or 1 result

        if (findError) {
          console.error('Error finding existing product:', findError);
          // Decide if we should proceed or throw/notify
        } else if (existingProduct) {
          existingProductId = existingProduct.id;
          console.log('Found existing product ID:', existingProductId);
        }
      } catch (err) {
        console.error('Exception while finding existing product:', err);
      }

      try {
        // Count completed chapters
        const completedChapters = ebookChapters.filter(c => c.status === 'generated').length;
        const totalChapters = ebookChapters.length;
        const progress = Math.round((completedChapters / totalChapters) * 100);
        
        // Create metadata with current progress
        const metadata = {
          progress,
          completedChapters,
          totalChapters,
          updatedAt: new Date().toISOString(),
          workflow_step: 'ebook-writing' as WorkflowStep
        };
        
        if (existingProductId) {
          // Update existing draft
          await updateProduct(existingProductId, {
            metadata,
            workflow_step: 'ebook-writing' as WorkflowStep,
            status: 'in_progress'
          });
          console.log('Created new draft product:', existingProductId);
        } else {
          // Create new draft
          const result = await createProduct({
            title: ebook.title,
            description: ebook.description || '',
            type: 'ebook',
            status: 'in_progress',
            project_id: project.id,
            metadata,
            workflow_step: 'ebook-writing' as WorkflowStep
          });
          
          if (result?.id) {
            console.log('Created new draft product:', result.id);
          }
        }
      } catch (err) {
        console.error('Error saving draft product:', err);
        // Don't show error to user
      }
    };
    
    // Only save draft if we have at least one generated chapter
    if (ebookChapters.some(c => c.status === 'generated')) {
      saveDraftProduct();
    }
  }, [ebookChapters, ebook, project]);

  // Calculate progress percentage
  const completedChapters = localChapters.filter(c => c.status === 'generated').length;
  const totalChapters = localChapters.length;
  const progressPercentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
  const allChaptersGenerated = completedChapters === totalChapters;

  /**
   * Toggles the expanded state of a chapter
   */
  const toggleChapter = (chapterId: string) => {
    // If we're editing, don't collapse the chapter
    if (editingChapter === chapterId) return;
    
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  /**
   * Starts editing a chapter
   */
  const handleStartEditing = (chapter) => {
    setEditingChapter(chapter.id);
    setEditContent(chapter.content || '');
  };

  /**
   * Cancels editing a chapter
   */
  const handleCancelEditing = () => {
    setEditingChapter(null);
    setEditContent('');
  };

  /**
   * Saves edited chapter content
   */
  const handleSaveEdits = async (chapterId) => {
    try {
      setSavingChapter(chapterId);
      setError(null);
      setNotification(null);
      
      // Call the context function to update the chapter
      const updatedChapter = await updateEbookChapter(chapterId, editContent);
      
      // Update local state based on the returned chapter from context
      setLocalChapters(prevChapters => 
        prevChapters.map(c => (c.id === chapterId ? updatedChapter : c))
      );
      
      // Exit edit mode
      setEditingChapter(null);
      setEditContent('');
      
      // Close the chapter accordion after successful save
      setExpandedChapter(null);
      
      // Show success message as a non-error notification
      setNotification({ message: 'Chapter content updated successfully', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to save chapter');
      console.error('Error saving chapter:', err);
    } finally {
      setSavingChapter(null);
    }
  };

  /**
   * Handles generating content for a specific chapter
   */
  const handleGenerateChapter = async (chapterId: string) => {
    try {
      setError(null);
      setGeneratingChapter(chapterId);
      setNotification(null);
      
      // Find the chapter to generate
      const chapterToGenerate = localChapters.find(c => c.id === chapterId);
      if (!chapterToGenerate) throw new Error('Chapter not found');
      
      // Auto-expand the chapter being generated
      setExpandedChapter(chapterId);
      
      // Remove auto-scrolling functionality
      // Show a toast or notification that generation started
      console.log(`Generating chapter: ${chapterToGenerate.title}`);
      
      // Start generation with optimistic UI update
      await generateEbookChapter(chapterId);
      
      // Show success feedback
      // Check if all chapters are now generated
      const allGenerated = localChapters.every(c => 
        (c.id === chapterId) ? true : c.status === 'generated'
      );
      
      if (allGenerated) {
        // Delay the transition slightly to allow UI to update
        setTimeout(() => {
          setCurrentStep('ebook-preview');
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate chapter');
      setNotification({ message: err.message || 'Failed to generate chapter', type: 'error' });
    } finally {
      setGeneratingChapter(null);
    }
  };

  /**
   * Handles proceeding to the next step
   */
  const handleProceed = () => {
    // Check if all chapters are generated based on local state
    const allDone = localChapters.every(c => c.status === 'generated');
    if (allDone) {
      setCurrentStep('ebook-preview');
    }
  };

  /**
   * Initiates chapter deletion process
   */
  const handleDeleteChapterClick = (chapterId: string, e: React.MouseEvent) => {
    // Prevent triggering the accordion toggle
    e.stopPropagation();
    setDeletingChapter(chapterId);
    setDeleteConfirmOpen(true);
  };

  /**
   * Deletes a chapter from the database and updates local state
   */
  const deleteChapter = async () => {
    if (!deletingChapter) return;
    
    try {
      setError(null);
      setNotification(null);
      
      // Call context function to delete the chapter
      await deleteEbookChapter(deletingChapter);
      
      // Update local state (context already updated)
      setLocalChapters(prevChapters => 
        prevChapters.filter(c => c.id !== deletingChapter)
      );
      
      // Close any expanded chapter if it was the deleted one
      if (expandedChapter === deletingChapter) {
        setExpandedChapter(null);
      }
      
      // Show success message
      setNotification({ message: 'Chapter deleted successfully', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to delete chapter');
      console.error('Error deleting chapter:', err);
    } finally {
      setDeletingChapter(null);
      setDeleteConfirmOpen(false);
    }
  };

  /**
   * Opens the add chapter dialog
   */
  const handleAddChapterClick = () => {
    setNewChapterTitle('');
    setNewChapterCreationType('ai');
    setAddChapterDialogOpen(true);
  };

  /**
   * Creates a new chapter in the database and updates the local state
   */
  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) {
      // Use setError for validation failures
      setError('Chapter title cannot be empty');
      return;
    }

    setAddingChapter(true);
    setError(null);
    setNotification(null);

    try {
      // Call context function to add the chapter
      const newChapter = await addEbookChapter(newChapterTitle, newChapterCreationType);
      
      // Local state (`localChapters`) will be updated automatically 
      // by the useEffect hook listening to `ebookChapters` from the context.
      
      // If it's a manual chapter, immediately open it for editing
      if (newChapterCreationType === 'manual') {
        setExpandedChapter(newChapter.id);
        setEditingChapter(newChapter.id);
        setEditContent('Edit this chapter to add your content.');
      } else if (newChapterCreationType === 'ai') {
        // For AI generation, we'll generate content right away
        await handleGenerateChapter(newChapter.id);
      }
      
      // Show success message
      setNotification({
        message: `New chapter ${newChapterCreationType === 'manual' ? 'added' : 'added and generating'}`,
        type: 'success' 
      });
      setTimeout(() => setNotification(null), 3000);
      
      // Close the dialog
      setAddChapterDialogOpen(false);
      
    } catch (err) {
      setError(err.message || 'Failed to add new chapter');
      console.error('Error adding new chapter:', err);
    } finally {
      setAddingChapter(false);
    }
  };

  // Add this inside the component, before the return statement
  // This section has the "Auto-Generate All Chapters" button functionality
  // We need to update it to use localChapters instead of the original ebookChapters

  const handleAutoGenerateAllChapters = async () => {
    // Get all pending chapters from the LOCAL state (not global context)
    const pendingChapters = localChapters
      .filter(c => c.status === 'pending')
      .sort((a, b) => a.order_index - b.order_index);
    
    // Calculate total work to do  
    const totalChapters = pendingChapters.length;
    
    // Start with the first chapter
    if (pendingChapters.length > 0) {
      setError(null);
      setNotification(null);
      
      try {
        // Show a message notifying about batch generation
        console.log(`Starting batch generation of ${totalChapters} chapters. This may take a few minutes.`);
        
        // Process one at a time to ensure proper context flow
        for (let i = 0; i < pendingChapters.length; i++) {
          const chapter = pendingChapters[i];
          setGeneratingChapter(chapter.id);
          
          // Update progress message - use non-error status messaging
          const statusMessage = `Generating chapter ${i+1} of ${totalChapters}: "${chapter.title}"...`;
          console.log(statusMessage);
          setNotification({ message: statusMessage, type: 'info' });
          
          // Expand the current chapter
          setExpandedChapter(chapter.id);
          
          // Remove auto-scrolling functionality
          await generateEbookChapter(chapter.id);
          
          // Short pause between chapters
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // When all done, clear error message (which was being used as a status)
        setNotification(null);
        
        // When all done, proceed to preview
        setTimeout(() => {
          setCurrentStep('ebook-preview');
        }, 1000);
      } catch (err: any) {
        setError(err.message || 'Failed to generate chapters');
        setNotification({ message: err.message || 'Failed to generate chapters', type: 'error' });
      } finally {
        setGeneratingChapter(null);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h2 className="text-2xl font-display text-ink-dark mb-4 tracking-tight">
          Generate eBook Content
        </h2>
        <p className="text-ink-light font-serif max-w-3xl leading-relaxed">
          Our AI is generating high-quality content for each chapter of your eBook. 
          You can preview each chapter as it's completed, manually edit the content, or regenerate if needed.
        </p>
      </div>

      {/* Notification Area */}
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "border rounded-md p-4 flex items-start",
            notification.type === 'success' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400",
            notification.type === 'info' && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-400",
            notification.type === 'warning' && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30 text-yellow-700 dark:text-yellow-500",
            notification.type === 'error' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400"
          )}
        >
          {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />}
          {notification.type === 'info' && <Sparkles className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />}
          {notification.type === 'warning' && <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />}
          {notification.type === 'error' && <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />}
          <p className="text-sm font-serif">{notification.message}</p>
        </motion.div>
      )}
      
      {/* Book information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/30 bg-gradient-to-br from-white to-[#F9F7F4]/30 dark:from-card dark:to-card shadow-sm dark:shadow-md rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md dark:hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-[#738996]/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center flex-shrink-0 group transition-all duration-300 hover:scale-105 hover:bg-[#738996]/20 dark:hover:bg-accent-primary/30">
                <BookText className="h-8 w-8 text-[#738996] dark:text-accent-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl text-ink-dark dark:text-ink-dark mb-1 tracking-tight">
                  {ebook?.title}
                </h3>
                {ebook?.description && (
                  <p className="text-ink-light dark:text-ink-light/80 font-serif text-sm mb-5 leading-relaxed">
                    {ebook.description}
                  </p>
                )}
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-serif mb-1">
                    <span className="text-ink-light flex items-center">
                      <span className="w-2 h-2 mr-1.5 rounded-full bg-[#738996]/70 dark:bg-accent-primary/70"></span>
                      {completedChapters} of {totalChapters} chapters completed
                    </span>
                    <span className="text-[#738996] dark:text-accent-primary font-medium bg-[#738996]/10 dark:bg-accent-primary/20 px-2.5 py-1 rounded-full shadow-sm">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E8E8E8] dark:bg-gray-700/50 rounded-full h-2">
                    <motion.div 
                      className="bg-[#738996] dark:bg-accent-primary h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* === MOVED Action Buttons Section === */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-accent-tertiary/20 dark:border-accent-tertiary/30"
      >
        <div className="flex gap-3">
          {/* Add Chapter Button */}
          <Button
            className="gap-2 border border-[#738996]/20 dark:border-accent-primary/30 text-[#738996] dark:text-accent-primary hover:bg-[#738996]/5 dark:hover:bg-accent-primary/10 hover:border-[#738996]/40 dark:hover:border-accent-primary/50 transition-all duration-300"
            variant="outline"
            size="sm"
            onClick={handleAddChapterClick}
            disabled={!!editingChapter || !!generatingChapter}
          >
            <Plus className="h-4 w-4" />
            Add Chapter
          </Button>

          {/* Auto-Generate All Button (conditional) */}
          {localChapters.some(c => c.status === 'pending') && !editingChapter && (
            <Button
              className="gap-2 bg-gradient-to-r from-[#738996] to-[#738996]/90 dark:from-accent-primary dark:to-accent-primary/90 text-white hover:from-[#738996]/90 hover:to-[#738996]/80 dark:hover:from-accent-primary/90 dark:hover:to-accent-primary/80 transition-all duration-300 shadow-sm dark:shadow-md hover:shadow"
              size="sm"
              onClick={handleAutoGenerateAllChapters}
              disabled={!!generatingChapter || !!editingChapter}
            >
              <Sparkles className="h-4 w-4" />
              Auto-Generate All
            </Button>
          )}
        </div>

        {/* Proceed Button */}
        <Button
          className={cn(
            "gap-2 text-white transition-all duration-300 shadow-sm dark:shadow-md hover:shadow px-5",
            allChaptersGenerated 
              ? "bg-gradient-to-r from-[#ccb595] to-[#ccb595]/90 dark:from-accent-yellow dark:to-accent-yellow/90 hover:from-[#ccb595]/90 hover:to-[#ccb595]/80 dark:hover:from-accent-yellow/90 dark:hover:to-accent-yellow/80" 
              : "bg-[#738996] dark:bg-accent-primary hover:bg-[#738996]/90 dark:hover:bg-accent-primary/90"
          )}
          size="sm"
          onClick={handleProceed}
          disabled={!allChaptersGenerated || !!editingChapter}
        >
          {allChaptersGenerated ? (
            <>
              Preview eBook
              <ArrowRight className="h-4 w-4" />
            </>
          ) : 'Generate All Chapters First'}
        </Button>
      </motion.div>
      {/* ==================================== */}

      {/* Chapter list */}
      <div className="space-y-5">
        {localChapters.map((chapter, index) => (
          <motion.div
            key={chapter.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.3, 
              delay: index * 0.05 
            }}
            className={cn(
              "overflow-hidden rounded-lg shadow-sm dark:shadow-md border transition-all duration-300",
              expandedChapter === chapter.id
                ? "mb-6 border-[#738996]/40 dark:border-accent-primary/50 bg-white dark:bg-card"
                : "mb-4 border-accent-tertiary/20 dark:border-accent-tertiary/30 bg-white dark:bg-card hover:border-accent-tertiary/40 dark:hover:border-accent-tertiary/50 hover:shadow-md dark:hover:shadow-lg"
            )}
          >
            <div className={cn(
              "px-5 py-4 cursor-pointer transition-colors duration-200 flex justify-between",
              expandedChapter === chapter.id
                ? "bg-[#738996]/5 dark:bg-accent-primary/10"
                : "hover:bg-[#738996]/5 dark:hover:bg-accent-primary/10"
            )}
              onClick={() => toggleChapter(chapter.id)}
            >
              <div className="flex items-center gap-4">
                <div 
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105",
                    chapter.status === 'generated' 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                      : chapter.status === 'generating'
                        ? "bg-[#738996]/10 dark:bg-accent-primary/20 text-[#738996] dark:text-accent-primary"
                        : "bg-[#F5F5F5] dark:bg-gray-700/40 text-[#888888] dark:text-gray-400"
                  )}
                >
                  {chapter.status === 'generated' ? (
                    <FileEdit className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  ) : chapter.status === 'generating' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                    >
                      <Loader2 className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <Clock className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  )}
                </div>
                <div>
                  <h4 className="font-display font-medium text-ink-dark dark:text-ink-dark tracking-tight">
                    {chapter.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "inline-flex items-center justify-center px-2.5 py-0.5 text-xs rounded-full font-medium shadow-sm transition-all duration-300",
                      chapter.status === 'generated' 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                        : chapter.status === 'generating'
                          ? "bg-[#738996]/10 dark:bg-accent-primary/20 text-[#738996] dark:text-accent-primary"
                          : "bg-[#F5F5F5] dark:bg-gray-700/50 text-[#888888] dark:text-gray-400"
                    )}>
                      {chapter.status === 'generated' 
                        ? 'Generated'
                        : chapter.status === 'generating'
                          ? 'Generating...'
                          : 'Pending'}
                    </span>
                    {chapter.status === 'generated' && chapter.content && (
                      <span className="text-xs text-ink-light dark:text-ink-light/70 font-serif flex items-center">
                        <span className="h-1 w-1 bg-ink-faded dark:bg-ink-light/40 rounded-full mx-2"></span>
                        {chapter.content.split(/\s+/).length.toLocaleString()} words
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Consolidated Action Buttons */} 
                {chapter.status === 'pending' && (
                  <Button
                    className="gap-1.5 bg-[#738996] dark:bg-accent-primary hover:bg-[#637885] dark:hover:bg-accent-primary/90 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateChapter(chapter.id);
                    }}
                    disabled={!!generatingChapter}
                  >
                    {generatingChapter === chapter.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Content
                      </>
                    )}
                  </Button>
                )}
                {chapter.status === 'generated' && !editingChapter && (
                  <> { /* Use Fragment */}
                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-[#738996] dark:text-accent-primary border-[#738996]/30 dark:border-accent-primary/30 hover:bg-[#738996]/5 dark:hover:bg-accent-primary/10 h-9 px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditing(chapter);
                        setExpandedChapter(chapter.id); // Ensure chapter is expanded when editing
                      }}
                      disabled={!!generatingChapter || !!editingChapter}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    {/* Regenerate Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-ink-light dark:text-ink-light/80 border-accent-tertiary/30 dark:border-accent-tertiary/40 hover:bg-accent-tertiary/5 dark:hover:bg-accent-tertiary/10 h-9 px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateChapter(chapter.id);
                      }}
                      disabled={!!generatingChapter || !!editingChapter}
                    >
                      <RotateCcw className="h-4 w-4" />
                       Regenerate
                    </Button>
                    {/* Delete Button (Moved Here) */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "transition-all duration-200 h-9 w-9 p-0", // Match size
                        localChapters.length > 1
                          ? "text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400"
                          : "text-red-300 dark:text-red-700/50 cursor-not-allowed"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (localChapters.length > 1) {
                          handleDeleteChapterClick(chapter.id, e);
                        }
                      }}
                      disabled={!!generatingChapter || !!editingChapter || deletingChapter === chapter.id || localChapters.length <= 1}
                      title={localChapters.length > 1 ? "Delete chapter" : "Cannot delete the only chapter"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <motion.div 
                  animate={{ rotate: expandedChapter === chapter.id ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F5F5] dark:hover:bg-gray-700/40 transition-colors duration-200"
                >
                  <ChevronDown className="h-5 w-5 text-ink-faded dark:text-gray-400" />
                </motion.div>
              </div>
            </div>
            
            {/* Expanded chapter content */}
            <AnimatePresence>
              {expandedChapter === chapter.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className={cn(
                    "px-6 pt-5 pb-6 transition-all duration-300",
                    editingChapter === chapter.id 
                      ? "bg-white dark:bg-card" 
                      : "bg-[#FAF9F5] dark:bg-card/80 border-t border-[#E8E8E8] dark:border-accent-tertiary/30"
                  )}>
                    {chapter.status === 'generated' && chapter.content && !editingChapter ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="prose prose-sm dark:prose-invert max-w-none font-serif text-ink-dark"
                      >
                        <ReactMarkdown>
                          {chapter.content}
                        </ReactMarkdown>
                      </motion.div>
                    ) : chapter.status === 'generating' ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-[#738996]/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center mb-5 shadow-inner dark:shadow-inner-dark">
                          <motion.div
                            animate={{ 
                              rotate: 360,
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                            }}
                          >
                            <Loader2 className="h-10 w-10 text-[#738996] dark:text-accent-primary" />
                          </motion.div>
                        </div>
                        <h4 className="font-display text-lg text-ink-dark dark:text-ink-dark mb-2">Generating Chapter Content</h4>
                        <p className="text-sm text-ink-light dark:text-ink-light/80 font-serif max-w-md">
                          Our AI is crafting high-quality content for this chapter. This may take a minute or two.
                        </p>
                      </div>
                    ) : editingChapter === chapter.id ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-5"
                      >
                        <div className="bg-[#738996]/5 dark:bg-accent-primary/15 p-5 rounded-lg border border-[#738996]/10 dark:border-accent-primary/30 shadow-sm dark:shadow-md">
                          <div className="flex items-start">
                            <div className="bg-[#738996]/15 dark:bg-accent-primary/25 p-2 rounded-md mr-4 flex-shrink-0 mt-0.5 shadow-sm dark:shadow-md">
                              <FileEdit className="h-5 w-5 text-[#738996] dark:text-accent-primary" />
                            </div>
                            <div>
                              <h4 className="font-display text-base text-[#738996] dark:text-accent-primary mb-2">Editing Chapter</h4>
                              <p className="text-sm text-ink-light dark:text-ink-light/80 font-serif mb-0 leading-relaxed">
                                Use markdown formatting for headings (#, ##), lists (-, 1.), and emphasis (**bold**, *italic*).
                                Your changes will be saved in real-time.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#738996]/20 to-[#ccb595]/20 dark:from-accent-primary/30 dark:to-accent-yellow/30 rounded-lg blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                          <Textarea 
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="relative w-full min-h-[400px] font-mono text-sm text-ink-dark dark:text-ink-light border-[#E8E8E8] dark:border-accent-tertiary/30 focus:border-[#738996] dark:focus:border-accent-primary focus:ring-[#738996]/20 dark:focus:ring-accent-primary/30 transition-colors duration-300 rounded-lg shadow-sm dark:shadow-md resize-y dark:bg-card"
                            placeholder="Write or paste your chapter content here. Use markdown for formatting..."
                          />
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-ink-light dark:text-ink-light hover:bg-accent-tertiary/20 transition-all duration-200 h-10"
                            onClick={handleCancelEditing}
                            disabled={savingChapter === chapter.id}
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="gap-1.5 bg-[#738996] text-white hover:bg-[#738996]/90 transition-all duration-200 shadow-sm hover:shadow h-10"
                            onClick={() => handleSaveEdits(chapter.id)}
                            disabled={savingChapter === chapter.id}
                          >
                            {savingChapter === chapter.id ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ 
                                    duration: 1.5, 
                                    repeat: Infinity, 
                                    ease: "linear" 
                                  }}
                                >
                                  <Loader2 className="h-4 w-4" />
                                </motion.div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="py-12 flex flex-col items-center justify-center"
                      >
                        <div className="w-20 h-20 bg-[#F5F5F5] dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-5 shadow-inner dark:shadow-inner-dark">
                          <BookText className="h-9 w-9 text-[#CCCCCC] dark:text-gray-600" />
                        </div>
                        <h4 className="font-display text-lg text-ink-dark dark:text-ink-dark mb-2">Ready to Generate</h4>
                        <p className="text-ink-light dark:text-ink-light/80 font-serif text-center mb-6 max-w-md">
                          Click the "Generate" button to create AI-powered content for this chapter.
                        </p>
                        <Button
                          className="gap-2 bg-gradient-to-r from-[#738996] to-[#738996]/90 dark:from-accent-primary dark:to-accent-primary/90 text-white hover:from-[#738996]/90 hover:to-[#738996]/80 dark:hover:from-accent-primary/90 dark:hover:to-accent-primary/80 transition-all duration-300 shadow-sm dark:shadow-md hover:shadow px-5 py-2 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateChapter(chapter.id);
                          }}
                          disabled={!!generatingChapter}
                        >
                          <Sparkles className="h-4 w-4" />
                          Generate Chapter
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex justify-between mt-10"
      >
        <Button
          variant="outline"
          onClick={() => setCurrentStep('idea-selection')}
          className="gap-2 border-[#E8E8E8] dark:border-accent-tertiary/30 hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/10 hover:border-[#E8E8E8] dark:hover:border-accent-tertiary/40 transition-all duration-200"
          disabled={!!editingChapter}
        >
          Back
        </Button>
      </motion.div>

      {/* Delete chapter confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-card border-accent-tertiary/20 dark:border-accent-tertiary/30">
          <DialogHeader>
            <DialogTitle className="text-ink-dark dark:text-ink-dark font-display">Confirm Delete Chapter</DialogTitle>
            <DialogDescription className="text-ink-light dark:text-ink-light/80 font-serif">
              Are you sure you want to delete this chapter? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-md p-3 my-2">
            <p className="text-red-800 dark:text-red-300 text-sm font-serif">
              <strong>Warning:</strong> Deleting this chapter may affect the flow and coherence of your eBook.
            </p>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmOpen(false)}
              className="text-ink-light dark:text-ink-light/80 border border-[#E8E8E8] dark:border-accent-tertiary/30 hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteChapter}
              className="bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 text-white"
              disabled={!deletingChapter}
            >
              Delete Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add chapter dialog */}
      <Dialog open={addChapterDialogOpen} onOpenChange={setAddChapterDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-card border-accent-tertiary/20 dark:border-accent-tertiary/30">
          <DialogHeader>
            <DialogTitle className="text-ink-dark dark:text-ink-dark font-display">Add New Chapter</DialogTitle>
            <DialogDescription className="text-ink-light dark:text-ink-light/80 font-serif">
              Create a new chapter for your eBook. You can have it AI-generated or write it yourself.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="chapter-title" className="text-ink-dark font-medium">
                Chapter Title
              </Label>
              <Input
                id="chapter-title"
                placeholder="Enter chapter title..."
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="font-serif bg-white dark:bg-card border-[#E8E8E8] dark:border-accent-tertiary/40 focus:border-[#738996] dark:focus:border-accent-primary text-ink-dark dark:text-ink-light"
                disabled={addingChapter}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-ink-dark font-medium">
                Content Creation
              </Label>
              <RadioGroup 
                value={newChapterCreationType} 
                onValueChange={(value) => setNewChapterCreationType(value as 'ai' | 'manual')}
                className="space-y-3"
                disabled={addingChapter}
              >
                <div className="flex items-start space-x-3 p-3 rounded-md border border-[#E8E8E8] dark:border-accent-tertiary/30 hover:border-[#738996]/20 dark:hover:border-accent-primary/40 transition-all duration-200 cursor-pointer bg-white dark:bg-card">
                  <RadioGroupItem 
                    value="ai" 
                    id="option-ai" 
                    className="mt-1 data-[state=checked]:border-[#738996] dark:data-[state=checked]:border-accent-primary data-[state=checked]:text-[#738996] dark:data-[state=checked]:text-accent-primary" 
                  />
                  <div className="space-y-1.5">
                    <Label 
                      htmlFor="option-ai" 
                      className="text-ink-dark dark:text-ink-dark font-medium flex items-center cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-[#738996] dark:text-accent-primary" />
                      AI-Generated Chapter
                    </Label>
                    <p className="text-sm text-ink-light dark:text-ink-light/80 font-serif">
                      Our AI will generate high-quality content for this chapter based on your eBook topic and previous chapters.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-md border border-[#E8E8E8] dark:border-accent-tertiary/30 hover:border-[#738996]/20 dark:hover:border-accent-primary/40 transition-all duration-200 cursor-pointer bg-white dark:bg-card">
                  <RadioGroupItem 
                    value="manual" 
                    id="option-manual" 
                    className="mt-1 data-[state=checked]:border-[#738996] dark:data-[state=checked]:border-accent-primary data-[state=checked]:text-[#738996] dark:data-[state=checked]:text-accent-primary" 
                  />
                  <div className="space-y-1.5">
                    <Label 
                      htmlFor="option-manual" 
                      className="text-ink-dark dark:text-ink-dark font-medium flex items-center cursor-pointer"
                    >
                      <PenLine className="h-4 w-4 mr-2 text-[#738996] dark:text-accent-primary" />
                      Custom Chapter (Manual)
                    </Label>
                    <p className="text-sm text-ink-light dark:text-ink-light/80 font-serif">
                      Start with a blank editor to write your own custom chapter content.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAddChapterDialogOpen(false)}
              className="mr-1 text-ink-light dark:text-ink-light border border-[#E8E8E8] dark:border-accent-tertiary/30 hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/10"
              disabled={addingChapter}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddChapter}
              className="bg-[#738996] dark:bg-accent-primary text-white"
              disabled={!newChapterTitle.trim() || addingChapter}
            >
              {addingChapter ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Chapter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress bar and action buttons */}
      <div className="bg-white dark:bg-card rounded-lg p-6 shadow-sm dark:shadow-md border border-accent-tertiary/20 dark:border-accent-tertiary/30 mt-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-lg text-ink-dark dark:text-ink-dark">
              eBook Generation Progress
            </h4>
            <span className="text-ink-light dark:text-ink-light/80 font-serif text-sm">
              {completedChapters} of {totalChapters} chapters completed
            </span>
          </div>
          
          <Progress value={progressPercentage} className="h-2.5 bg-[#E8E8E8] dark:bg-gray-700/50" />
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              {/* Auto-generate all button */}
              {!allChaptersGenerated && !generatingChapter && localChapters.some(c => c.status === 'pending') && (
                <Button
                  variant="outline"
                  className="gap-1.5 text-[#738996] dark:text-accent-primary border-[#738996]/30 dark:border-accent-primary/30 hover:bg-[#738996]/5 dark:hover:bg-accent-primary/10"
                  onClick={handleAutoGenerateAllChapters}
                >
                  <Sparkles className="h-4 w-4" />
                  Auto-Generate All
                </Button>
              )}
              
              {/* Add chapter button */}
              <Button
                variant="outline"
                className="gap-1.5 text-ink-light dark:text-ink-light/80 border-accent-tertiary/30 dark:border-accent-tertiary/40 hover:bg-accent-tertiary/5 dark:hover:bg-accent-tertiary/10"
                onClick={handleAddChapterClick}
              >
                <Plus className="h-4 w-4" />
                Add Chapter
              </Button>
            </div>
            
            {/* Next step button */}
            <Button
              className="gap-1.5 bg-[#738996] dark:bg-accent-primary hover:bg-[#637885] dark:hover:bg-accent-primary/90 text-white"
              onClick={handleProceed}
              disabled={!allChaptersGenerated}
            >
              Preview eBook
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Add CSS for dark mode shadow-inner */}
      <style jsx global>{`
        .dark .shadow-inner-dark {
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
};

export default EbookWritingStep; 