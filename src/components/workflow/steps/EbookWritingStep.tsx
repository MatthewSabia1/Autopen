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
    project
  } = useWorkflow();
  const { createProduct, updateProduct } = useProducts();

  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingChapter, setGeneratingChapter] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [savingChapter, setSavingChapter] = useState<string | null>(null);
  // Keep a local copy of chapters that we can update directly for UI purposes
  const [localChapters, setLocalChapters] = useState<any[]>([]);
  
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
      
      try {
        // Count completed chapters
        const completedChapters = ebookChapters.filter(c => c.status === 'generated').length;
        const totalChapters = ebookChapters.length;
        const progress = Math.round((completedChapters / totalChapters) * 100);
        
        // Sort chapters for metadata
        const sortedChapters = [...ebookChapters].sort((a, b) => a.order_index - b.order_index);
        
        // Create metadata with current progress, optimizing storage
        // Only store full content for completed chapters, store summary for others
        const metadata = {
          ebookData: {
            id: ebook.id,
            title: ebook.title,
            description: ebook.description || '',
            // Optimized chapter storage - only keep full content for generated chapters
            chapters: sortedChapters.map(chapter => {
              const baseChapter = {
                id: chapter.id,
                title: chapter.title,
                order_index: chapter.order_index,
                status: chapter.status
              };
              
              // Only include content for generated chapters
              if (chapter.status === 'generated' && chapter.content) {
                // For very large chapters, we might want to truncate
                if (chapter.content.length > 30000) {
                  return {
                    ...baseChapter,
                    content: `${chapter.content.substring(0, 30000)}... (truncated)`,
                    contentTruncated: true,
                    contentLength: chapter.content.length
                  };
                }
                return { ...baseChapter, content: chapter.content };
              }
              
              // For pending chapters, just store the base info without content
              return baseChapter;
            })
          },
          progress,
          completedChapters,
          totalChapters,
          updatedAt: new Date().toISOString(),
          workflow_step: 'ebook-writing' as WorkflowStep
        };
        
        if (draftId) {
          // Update existing draft
          await updateProduct(draftId, {
            metadata,
            workflow_step: 'ebook-writing' as WorkflowStep,
            status: 'in_progress'
          });
          console.log('Updated draft product');
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
            setDraftId(result.id);
            console.log('Created draft product:', result.id);
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
  }, [ebookChapters, ebook, project, draftId]);

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
      
      // Find the chapter to update
      const chapterToUpdate = ebookChapters.find(c => c.id === chapterId);
      if (!chapterToUpdate) throw new Error('Chapter not found');
      
      // Update chapter in database using the Supabase client
      const { supabase } = await import('../../../../supabase/supabase');
      
      const { error, data } = await supabase
        .from('ebook_chapters')
        .update({ 
          content: editContent,
          status: 'generated'
        })
        .eq('id', chapterId)
        .select();
      
      if (error) throw error;
      
      // Create updated chapter object with new content
      const updatedChapter = {
        ...chapterToUpdate,
        content: editContent,
        status: 'generated' as const
      };
      
      // Update the local state directly with React useState setter pattern
      // This is a workaround since we don't have a direct setter in the context
      setLocalChapters(prevChapters => prevChapters.map(c => 
        c.id === chapterId ? updatedChapter : c
      ));
      
      // Update the draft product with the new chapter content
      if (draftId) {
        try {
          const chapterMetadata = {
            id: chapterId,
            title: chapterToUpdate.title,
            status: 'generated',
            updatedAt: new Date().toISOString()
          };
          
          if (editContent.length > 30000) {
            (chapterMetadata as any).contentPreview = editContent.substring(0, 500) + '... (truncated)';
            (chapterMetadata as any).contentLength = editContent.length;
          } else {
            (chapterMetadata as any).content = editContent;
          }
          
          await updateProduct(draftId, {
            metadata: {
              lastUpdatedChapter: chapterMetadata,
              updatedAt: new Date().toISOString()
            }
          });
          
          console.log('Successfully updated chapter content in product metadata');
        } catch (updateErr) {
          console.error('Error updating draft product with chapter content:', updateErr);
        }
      }
      
      // Exit edit mode
      setEditingChapter(null);
      setEditContent('');
      
      // Close the chapter accordion after successful save
      setExpandedChapter(null);
      
      // Show success message as a non-error notification
      setError('✓ Chapter content updated successfully');
      setTimeout(() => setError(null), 3000);
      
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
      
      // Find the chapter to generate
      const chapterToGenerate = ebookChapters.find(c => c.id === chapterId);
      if (!chapterToGenerate) throw new Error('Chapter not found');
      
      // Auto-expand the chapter being generated
      setExpandedChapter(chapterId);
      
      // Remove auto-scrolling functionality
      // Show a toast or notification that generation started
      console.log(`Generating chapter: ${chapterToGenerate.title}`);
      
      // Start generation with optimistic UI update
      await generateEbookChapter(chapterId);
      
      // Update the draft product with the new chapter content
      if (draftId) {
        try {
          // Get the updated chapter content after generation
          const updatedChapter = ebookChapters.find(c => c.id === chapterId);
          
          if (updatedChapter && updatedChapter.status === 'generated') {
            // Count completed chapters after this generation
            const updatedCompletedChapters = ebookChapters.filter(c => 
              c.status === 'generated' || c.id === chapterId
            ).length;
            
            // Calculate updated progress
            const updatedProgress = Math.round((updatedCompletedChapters / totalChapters) * 100);
            
            // Only store essential information about the updated chapter
            // This is a more efficient approach than storing all chapter data
            const chapterUpdate = {
              id: chapterId,
              title: updatedChapter.title,
              status: 'generated',
              updatedAt: new Date().toISOString()
            };
            
            // For very large content, truncate to avoid DB limitations
            if (updatedChapter.content) {
              if (updatedChapter.content.length > 30000) {
                // Store a truncated version to avoid DB issues
                (chapterUpdate as any).contentPreview = updatedChapter.content.substring(0, 500) + '... (truncated)';
                (chapterUpdate as any).contentLength = updatedChapter.content.length;
              } else {
                // Store full content since it's a reasonable size
                (chapterUpdate as any).content = updatedChapter.content;
              }
            }
            
            // Update the product with new progress and minimal chapter info
            await updateProduct(draftId, {
              metadata: {
                lastUpdatedChapter: chapterUpdate,
                progress: updatedProgress,
                completedChapters: updatedCompletedChapters,
                totalChapters,
                updatedAt: new Date().toISOString()
              }
            });
            
            console.log(`Updated draft product with new chapter content for: ${updatedChapter.title}`);
          }
        } catch (updateErr) {
          // Don't block the UI flow if updating the product fails
          console.error('Error updating draft product with chapter content:', updateErr);
        }
      }
      
      // Show success feedback
      // Check if all chapters are now generated
      const allGenerated = ebookChapters.every(c => 
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
      
      // Find the chapter to delete
      const chapterToDelete = localChapters.find(c => c.id === deletingChapter);
      if (!chapterToDelete) throw new Error('Chapter not found');
      
      // Update chapter in database using the Supabase client
      const { supabase } = await import('../../../../supabase/supabase');
      
      const { error } = await supabase
        .from('ebook_chapters')
        .delete()
        .eq('id', deletingChapter);
      
      if (error) throw error;
      
      // Create a new array without the deleted chapter to update local state
      const updatedChapters = localChapters.filter(c => c.id !== deletingChapter);
      
      // Update the local state to remove the deleted chapter
      setLocalChapters(updatedChapters);
      
      // Close any expanded chapter if it was the deleted one
      if (expandedChapter === deletingChapter) {
        setExpandedChapter(null);
      }
      
      // Update the draft product metadata
      if (draftId) {
        try {
          // Recalculate progress after deletion
          const completedChapters = updatedChapters.filter(c => c.status === 'generated').length;
          const totalRemainingChapters = updatedChapters.length;
          const progress = totalRemainingChapters > 0 
            ? Math.round((completedChapters / totalRemainingChapters) * 100) 
            : 0;
          
          await updateProduct(draftId, {
            metadata: {
              progress,
              completedChapters,
              totalChapters: totalRemainingChapters,
              updatedAt: new Date().toISOString(),
              deletedChapter: deletingChapter,
              remainingChapterIds: updatedChapters.map(c => c.id),
            }
          });
          
          console.log('Successfully updated product metadata after chapter deletion');
        } catch (updateErr) {
          console.error('Error updating draft product after chapter deletion:', updateErr);
        }
      }
      
      // Show success message
      setError('✓ Chapter deleted successfully');
      setTimeout(() => setError(null), 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to delete chapter');
      console.error('Error deleting chapter:', err);
    } finally {
      setDeletingChapter(null);
      setDeleteConfirmOpen(false);
    }
  };

  /**
   * Formats markdown content for display as HTML
   */
  const formatContent = (content: string | null): string => {
    if (!content) return '';
    
    // More comprehensive markdown formatting
    return content
      // Headers
      .replace(/# (.*)/g, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/## (.*)/g, '<h2 class="text-lg font-bold mt-3 mb-2">$1</h2>')
      .replace(/### (.*)/g, '<h3 class="text-base font-bold mt-2 mb-1">$1</h3>')
      .replace(/#### (.*)/g, '<h4 class="text-sm font-bold mt-2 mb-1">$1</h4>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^\s*\d+\.\s*(.*)/gm, '<li class="ml-6 list-decimal">$1</li>')
      .replace(/^\s*-\s*(.*)/gm, '<li class="ml-4 list-disc">$1</li>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded font-mono text-sm overflow-x-auto my-2">$1</pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded font-mono text-sm">$1</code>')
      // Blockquotes
      .replace(/^>\s*(.*)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic my-2">$1</blockquote>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="my-4 border-t border-gray-300">')
      // Paragraphs and line breaks
      .replace(/\n\n/g, '<p class="mb-4"></p>')
      .replace(/\n/g, '<br />');
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
      setError('Chapter title cannot be empty');
      return;
    }

    setAddingChapter(true);
    setError(null);

    try {
      const { supabase } = await import('../../../../supabase/supabase');
      
      // Determine the highest order_index to place the new chapter at the end
      const highestOrderIndex = localChapters.length > 0
        ? Math.max(...localChapters.map(c => c.order_index))
        : -1;
      
      // Create the new chapter in the database
      const { data: newChapter, error } = await supabase
        .from('ebook_chapters')
        .insert({
          ebook_id: ebook?.id,
          title: newChapterTitle,
          order_index: highestOrderIndex + 1,
          status: newChapterCreationType === 'manual' ? 'generated' : 'pending',
          content: newChapterCreationType === 'manual' ? 'Edit this chapter to add your content.' : null,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      if (!newChapter) {
        throw new Error('Failed to create new chapter');
      }

      // Create a new array with the added chapter
      const updatedChapters = [...localChapters, newChapter];
      
      // Add the new chapter to the local state
      setLocalChapters(updatedChapters);
      
      // If it's a manual chapter, immediately open it for editing
      if (newChapterCreationType === 'manual') {
        setExpandedChapter(newChapter.id);
        setEditingChapter(newChapter.id);
        setEditContent('Edit this chapter to add your content.');
      } else if (newChapterCreationType === 'ai') {
        // For AI generation, we'll generate content right away
        await handleGenerateChapter(newChapter.id);
      }
      
      // Update the product metadata
      if (draftId) {
        try {
          const completedChapters = updatedChapters.filter(c => c.status === 'generated').length;
          const totalChapters = updatedChapters.length;
          const progress = Math.round((completedChapters / totalChapters) * 100);
          
          await updateProduct(draftId, {
            metadata: {
              totalChapters,
              completedChapters,
              progress,
              updatedAt: new Date().toISOString(),
              addedChapter: {
                id: newChapter.id,
                title: newChapter.title,
                creationType: newChapterCreationType,
              }
            }
          });
          
          console.log('Successfully updated product metadata after adding a chapter');
        } catch (updateErr) {
          console.error('Error updating draft product after adding a chapter:', updateErr);
        }
      }
      
      setError(`✓ New chapter ${newChapterCreationType === 'manual' ? 'added' : 'added and generating'}`);
      setTimeout(() => setError(null), 3000);
      
      // Close the dialog
      setAddChapterDialogOpen(false);
      
    } catch (err) {
      setError(err.message || 'Failed to add new chapter');
      console.error('Error adding new chapter:', err);
    } finally {
      setAddingChapter(false);
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

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "border rounded-md p-4 flex items-start",
            error.startsWith('✓') || error.startsWith('✨')
              ? "bg-accent-primary/5 border-accent-primary/20 text-accent-primary"
              : "bg-red-50 border-red-200 text-red-700"
          )}
        >
          {error.startsWith('✓') ? (
            <div className="bg-accent-primary/10 p-1 rounded-full mr-3 flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-accent-primary" />
            </div>
          ) : error.startsWith('✨') ? (
            <div className="bg-[#ccb595]/10 p-1 rounded-full mr-3 flex-shrink-0">
              <Sparkles className="h-4 w-4 text-[#ccb595]" />
            </div>
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-serif">{error}</p>
        </motion.div>
      )}
      
      {/* Book information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="border border-[#E8E8E8] bg-gradient-to-br from-white to-[#F9F7F4]/30 shadow-sm rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-[#738996]/10 rounded-full flex items-center justify-center flex-shrink-0 group transition-all duration-300 hover:scale-105 hover:bg-[#738996]/20">
                <BookText className="h-8 w-8 text-[#738996] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl text-ink-dark mb-1 tracking-tight">
                  {ebook?.title}
                </h3>
                {ebook?.description && (
                  <p className="text-ink-light font-serif text-sm mb-5 leading-relaxed">
                    {ebook.description}
                  </p>
                )}
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-serif mb-1">
                    <span className="text-ink-light flex items-center">
                      <span className="w-2 h-2 mr-1.5 rounded-full bg-[#738996]/70"></span>
                      {completedChapters} of {totalChapters} chapters completed
                    </span>
                    <span className="text-[#738996] font-medium bg-[#738996]/10 px-2.5 py-1 rounded-full shadow-sm">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E8E8E8] rounded-full h-2">
                    <motion.div 
                      className="bg-[#738996] h-2 rounded-full"
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

      {/* Chapter list */}
      <div className="space-y-5">
        {localChapters.map((chapter, index) => (
          <motion.div
            key={chapter.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card 
              id={`chapter-${chapter.id}`}
              className={cn(
                "border overflow-hidden transition-all duration-300 rounded-lg group",
                expandedChapter === chapter.id 
                  ? "shadow-blue border-[#738996]/30" 
                  : chapter.status === 'generated'
                    ? "border-[#E8E8E8] hover:border-[#738996]/20 hover:shadow-sm" 
                    : "border-[#E8E8E8] hover:border-[#E8E8E8]/80 hover:shadow-sm"
              )}
            >
              <div 
                className={cn(
                  "py-4 px-5 flex items-center justify-between cursor-pointer transition-all duration-300",
                  expandedChapter === chapter.id 
                    ? "border-b border-[#E8E8E8] bg-[#F9F7F4]" 
                    : "hover:bg-[#F9F7F4]/50"
                )}
                onClick={() => toggleChapter(chapter.id)}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105",
                      chapter.status === 'generated' 
                        ? "bg-green-100 text-green-600" 
                        : chapter.status === 'generating'
                          ? "bg-[#738996]/10 text-[#738996]"
                          : "bg-[#F5F5F5] text-[#888888]"
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
                    <h4 className="font-display font-medium text-ink-dark tracking-tight">
                      {chapter.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "inline-flex items-center justify-center px-2.5 py-0.5 text-xs rounded-full font-medium shadow-sm transition-all duration-300",
                        chapter.status === 'generated' 
                          ? "bg-green-100 text-green-700" 
                          : chapter.status === 'generating'
                            ? "bg-[#738996]/10 text-[#738996]"
                            : "bg-[#F5F5F5] text-[#888888]"
                      )}>
                        {chapter.status === 'generated' 
                          ? 'Generated'
                          : chapter.status === 'generating'
                            ? 'Generating...'
                            : 'Pending'}
                      </span>
                      {chapter.status === 'generated' && chapter.content && (
                        <span className="text-xs text-ink-light font-serif flex items-center">
                          <span className="h-1 w-1 bg-ink-faded rounded-full mx-2"></span>
                          {chapter.content.split(/\s+/).length.toLocaleString()} words
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {chapter.status === 'pending' && (
                    <Button
                      size="sm"
                      className="gap-1.5 px-3.5 h-9 bg-[#738996] text-white hover:bg-[#738996]/90 transition-all duration-200 shadow-sm hover:shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateChapter(chapter.id);
                      }}
                      disabled={!!generatingChapter || !!editingChapter}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate
                    </Button>
                  )}
                  {chapter.status === 'generated' && !editingChapter && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 px-3.5 h-9 border-accent-tertiary/30 text-ink-dark hover:border-[#738996]/30 hover:bg-[#738996]/5 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditing(chapter);
                          setExpandedChapter(chapter.id); // Ensure chapter is expanded when editing
                        }}
                        disabled={!!generatingChapter || !!editingChapter}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 px-3.5 h-9 text-ink-light hover:bg-accent-tertiary/20 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateChapter(chapter.id);
                        }}
                        disabled={!!generatingChapter || !!editingChapter}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Regenerate
                      </Button>
                    </>
                  )}
                  {/* Delete button - Only show if not editing and not the only chapter */}
                  {!editingChapter && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "transition-all duration-200 h-9 w-9 p-0",
                        localChapters.length > 1
                          ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                          : "text-red-300 cursor-not-allowed"
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
                  )}
                  <motion.div 
                    animate={{ rotate: expandedChapter === chapter.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F5F5] transition-colors duration-200"
                  >
                    <ChevronDown className="h-5 w-5 text-ink-faded" />
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
                        ? "bg-white" 
                        : "bg-[#FAF9F5] border-t border-[#E8E8E8]"
                    )}>
                      {chapter.status === 'generated' && chapter.content && !editingChapter ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="prose prose-sm max-w-none font-serif text-ink-dark prose-headings:font-display prose-headings:text-ink-dark prose-p:text-ink-light prose-p:leading-relaxed prose-headings:mb-3 prose-li:text-ink-light prose-li:leading-relaxed"
                        >
                          <div dangerouslySetInnerHTML={{ __html: formatContent(chapter.content) }} />
                          
                          {/* Add action buttons at the bottom of displayed content */}
                          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#E8E8E8]">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 px-3.5 h-9 border-accent-tertiary/30 text-ink-dark hover:border-[#738996]/30 hover:bg-[#738996]/5 transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditing(chapter);
                              }}
                              disabled={!!generatingChapter || !!editingChapter}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit Chapter
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1.5 px-3.5 h-9 text-ink-light hover:bg-accent-tertiary/20 transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateChapter(chapter.id);
                              }}
                              disabled={!!generatingChapter || !!editingChapter}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Regenerate
                            </Button>
                          </div>
                        </motion.div>
                      ) : chapter.status === 'generating' ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="w-20 h-20 bg-[#738996]/10 rounded-full flex items-center justify-center mb-5 shadow-inner">
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
                              <Loader2 className="h-10 w-10 text-[#738996]" />
                            </motion.div>
                          </div>
                          <h4 className="font-display text-lg text-ink-dark mb-2">Generating Chapter Content</h4>
                          <p className="text-sm text-ink-light font-serif max-w-md">
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
                          <div className="bg-[#738996]/5 p-5 rounded-lg border border-[#738996]/10 shadow-sm">
                            <div className="flex items-start">
                              <div className="bg-[#738996]/15 p-2 rounded-md mr-4 flex-shrink-0 mt-0.5 shadow-sm">
                                <FileEdit className="h-5 w-5 text-[#738996]" />
                              </div>
                              <div>
                                <h4 className="font-display text-base text-[#738996] mb-2">Editing Chapter</h4>
                                <p className="text-sm text-ink-light font-serif mb-0 leading-relaxed">
                                  Use markdown formatting for headings (#, ##), lists (-, 1.), and emphasis (**bold**, *italic*).
                                  Your changes will be saved in real-time.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#738996]/20 to-[#ccb595]/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                            <Textarea 
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              className="relative w-full min-h-[400px] font-mono text-sm text-ink-dark border-[#E8E8E8] focus:border-[#738996] focus:ring-[#738996]/20 transition-colors duration-300 rounded-lg shadow-sm resize-y"
                              placeholder="Write or paste your chapter content here. Use markdown for formatting..."
                            />
                          </div>
                          <div className="flex justify-end gap-3 mt-5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-ink-light hover:bg-accent-tertiary/20 transition-all duration-200 h-10"
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
                          <div className="w-20 h-20 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-5 shadow-inner">
                            <BookText className="h-9 w-9 text-[#CCCCCC]" />
                          </div>
                          <h4 className="font-display text-lg text-ink-dark mb-2">Ready to Generate</h4>
                          <p className="text-ink-light font-serif text-center mb-6 max-w-md">
                            Click the "Generate" button to create AI-powered content for this chapter.
                          </p>
                          <Button
                            className="gap-2 bg-gradient-to-r from-[#738996] to-[#738996]/90 text-white hover:from-[#738996]/90 hover:to-[#738996]/80 transition-all duration-300 shadow-sm hover:shadow px-5 py-2 h-auto"
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
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add New Chapter Button */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Button
          className="gap-2 w-full border border-[#738996]/20 text-[#738996] hover:bg-[#738996]/5 hover:border-[#738996]/40 transition-all duration-300 py-6"
          variant="outline"
          onClick={handleAddChapterClick}
          disabled={!!editingChapter || !!generatingChapter}
        >
          <Plus className="h-5 w-5" />
          Add New Chapter
        </Button>
      </motion.div>

      {/* Generation control buttons */}
      {localChapters.some(c => c.status === 'pending') && !editingChapter && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-4"
        >
          <Button
            className="gap-2 w-full border border-[#738996]/30 text-[#738996] hover:bg-[#738996]/5 hover:border-[#738996]/50 transition-all duration-300 shadow-sm h-12"
            variant="outline"
            onClick={() => {
              const nextPendingChapter = localChapters.find(c => c.status === 'pending');
              if (nextPendingChapter) {
                handleGenerateChapter(nextPendingChapter.id);
              }
            }}
            disabled={!!generatingChapter || !!editingChapter}
          >
            <Sparkles className="h-4 w-4" />
            Generate Next Chapter
          </Button>
          
          <Button
            className="gap-2 w-full bg-gradient-to-r from-[#738996] to-[#738996]/90 text-white hover:from-[#738996]/90 hover:to-[#738996]/80 transition-all duration-300 shadow-sm hover:shadow h-12"
            onClick={async () => {
              // Get all pending chapters
              const pendingChapters = localChapters
                .filter(c => c.status === 'pending')
                .sort((a, b) => a.order_index - b.order_index);
              
              // Calculate total work to do  
              const totalChapters = pendingChapters.length;
              
              // Start with the first chapter
              if (pendingChapters.length > 0) {
                setError(null);
                
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
                    // We shouldn't use error state for status messages, but since we don't have
                    // a separate status state, we'll use a visually different style
                    setError(`✨ ${statusMessage}`);
                    
                    // Expand the current chapter
                    setExpandedChapter(chapter.id);
                    
                    // Remove auto-scrolling functionality
                    await generateEbookChapter(chapter.id);
                    
                    // Short pause between chapters
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                  
                  // When all done, clear error message (which was being used as a status)
                  setError(null);
                  
                  // When all done, proceed to preview
                  setTimeout(() => {
                    setCurrentStep('ebook-preview');
                  }, 1000);
                } catch (err: any) {
                  setError(err.message || 'Failed to generate chapters');
                } finally {
                  setGeneratingChapter(null);
                }
              }
            }}
            disabled={!!generatingChapter || !!editingChapter}
          >
            <Sparkles className="h-4 w-4" />
            Auto-Generate All Chapters
          </Button>
          
          <p className="text-xs text-ink-faded text-center font-serif">
            Each chapter builds on previous ones. For best results, generate chapters in order from beginning to end.
          </p>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex justify-between mt-10"
      >
        <Button
          variant="outline"
          onClick={() => setCurrentStep('idea-selection')}
          className="gap-2 border-[#E8E8E8] hover:bg-[#F5F5F5] hover:border-[#E8E8E8] transition-all duration-200"
          disabled={!!editingChapter}
        >
          Back
        </Button>
        <Button
          className={cn(
            "gap-2 text-white transition-all duration-300 shadow-sm hover:shadow px-6",
            allChaptersGenerated 
              ? "bg-gradient-to-r from-[#ccb595] to-[#ccb595]/90 hover:from-[#ccb595]/90 hover:to-[#ccb595]/80" 
              : "bg-[#738996] hover:bg-[#738996]/90"
          )}
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

      {/* Delete Chapter Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display text-ink-dark">Delete Chapter</DialogTitle>
            <DialogDescription className="font-serif text-ink-light">
              Are you sure you want to delete this chapter? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-ink-dark font-serif mb-4">
              {localChapters.find(c => c.id === deletingChapter)?.title}
            </p>
            <div className="bg-red-50 p-3 rounded-md border border-red-100 text-red-700 text-sm font-serif">
              <AlertCircle className="h-4 w-4 inline-block mr-2 mb-0.5" />
              This will permanently remove the chapter from your eBook.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmOpen(false)}
              className="text-ink-light hover:bg-accent-tertiary/20"
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={deleteChapter}
              disabled={!deletingChapter}
            >
              Delete Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Chapter Dialog */}
      <Dialog open={addChapterDialogOpen} onOpenChange={setAddChapterDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display text-ink-dark">Add New Chapter</DialogTitle>
            <DialogDescription className="font-serif text-ink-light">
              Create a new chapter for your eBook. You can choose to generate content with AI or write it manually.
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
                className="border-accent-tertiary/30 focus:border-[#738996] focus:ring-[#738996]/20"
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
                <div className="flex items-start space-x-3 p-3 rounded-md border border-[#E8E8E8] hover:border-[#738996]/20 transition-all duration-200 cursor-pointer">
                  <RadioGroupItem 
                    value="ai" 
                    id="option-ai" 
                    className="mt-1 data-[state=checked]:border-[#738996] data-[state=checked]:text-[#738996]" 
                  />
                  <div className="space-y-1.5">
                    <Label 
                      htmlFor="option-ai" 
                      className="text-ink-dark font-medium flex items-center cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-[#738996]" />
                      AI-Generated Chapter
                    </Label>
                    <p className="text-sm text-ink-light font-serif">
                      Our AI will generate high-quality content for this chapter based on your eBook topic and previous chapters.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-md border border-[#E8E8E8] hover:border-[#738996]/20 transition-all duration-200 cursor-pointer">
                  <RadioGroupItem 
                    value="manual" 
                    id="option-manual" 
                    className="mt-1 data-[state=checked]:border-[#738996] data-[state=checked]:text-[#738996]" 
                  />
                  <div className="space-y-1.5">
                    <Label 
                      htmlFor="option-manual" 
                      className="text-ink-dark font-medium flex items-center cursor-pointer"
                    >
                      <PenLine className="h-4 w-4 mr-2 text-[#738996]" />
                      Write Chapter Manually
                    </Label>
                    <p className="text-sm text-ink-light font-serif">
                      Create the chapter content yourself using our markdown editor.
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
              className="text-ink-light hover:bg-accent-tertiary/20"
              disabled={addingChapter}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#738996] text-white hover:bg-[#738996]/90"
              onClick={handleAddChapter}
              disabled={!newChapterTitle.trim() || addingChapter}
            >
              {addingChapter ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  {newChapterCreationType === 'ai' ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Add & Generate
                    </>
                  ) : (
                    <>
                      <PenLine className="h-4 w-4 mr-2" />
                      Add & Edit
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EbookWritingStep; 