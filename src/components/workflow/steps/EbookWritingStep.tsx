import React, { useState, useEffect } from 'react';
import { useWorkflow } from '@/lib/contexts/WorkflowContext';
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
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useProducts } from '@/hooks/useProducts';
import { Textarea } from '@/components/ui/textarea';

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
  
  // When ebookChapters from context change, update our local copy
  useEffect(() => {
    if (ebookChapters && ebookChapters.length > 0) {
      setLocalChapters(ebookChapters);
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display text-ink-dark mb-4">
          Generate eBook Content
        </h2>
        <p className="text-ink-light font-serif max-w-3xl">
          Our AI is generating high-quality content for each chapter of your eBook. 
          You can preview each chapter as it's completed, manually edit the content, or regenerate if needed.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm font-serif">{error}</p>
        </div>
      )}
      
      {/* Book information */}
      <Card className="border border-accent-tertiary/20 bg-paper shadow-textera">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-accent-primary/10 p-3 rounded-lg">
              <BookText className="h-10 w-10 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg text-ink-dark mb-1">
                {ebook?.title}
              </h3>
              {ebook?.description && (
                <p className="text-ink-light font-serif text-sm mb-4">
                  {ebook.description}
                </p>
              )}
              
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-serif mb-1">
                  <span className="text-ink-light">
                    {completedChapters} of {totalChapters} chapters completed
                  </span>
                  <span className="text-accent-primary font-medium">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-2 bg-accent-tertiary/20" 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chapter list */}
      <div className="space-y-4">
        {localChapters.map((chapter, index) => (
          <motion.div
            key={chapter.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              id={`chapter-${chapter.id}`}
              className={cn(
                "border overflow-hidden transition-all duration-300",
                expandedChapter === chapter.id 
                  ? "border-accent-primary/30 shadow-md" 
                  : chapter.status === 'generated'
                    ? "border-green-200 hover:border-green-300" 
                    : "border-accent-tertiary/20"
              )}
            >
              <div 
                className={cn(
                  "p-4 flex items-center justify-between cursor-pointer hover:bg-accent-tertiary/5 transition-colors",
                  expandedChapter === chapter.id && "border-b border-accent-tertiary/20 bg-accent-tertiary/5"
                )}
                onClick={() => toggleChapter(chapter.id)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      chapter.status === 'generated' 
                        ? "bg-green-100 text-green-600" 
                        : chapter.status === 'generating'
                          ? "bg-accent-primary/10 text-accent-primary"
                          : "bg-accent-tertiary/20 text-ink-faded"
                    )}
                  >
                    {chapter.status === 'generated' ? (
                      <FileEdit className="h-4 w-4" />
                    ) : chapter.status === 'generating' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-serif font-medium text-ink-dark">
                      {chapter.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-ink-light font-serif">
                        {chapter.status === 'generated' 
                          ? 'Generated'
                          : chapter.status === 'generating'
                            ? 'Generating...'
                            : 'Pending generation'}
                      </p>
                      {chapter.status === 'generated' && chapter.content && (
                        <>
                          <span className="h-1 w-1 bg-ink-faded rounded-full"></span>
                          <p className="text-xs text-ink-light font-serif">{chapter.content.split(/\s+/).length.toLocaleString()} words</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {chapter.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="workflow"
                      className="gap-1.5 px-3 h-8 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateChapter(chapter.id);
                      }}
                      disabled={!!generatingChapter}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate
                    </Button>
                  )}
                  {chapter.status === 'generated' && !editingChapter && (
                    <Button
                      size="sm"
                      variant="workflowOutline"
                      className="gap-1.5 px-3 h-8"
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
                  )}
                  {chapter.status === 'generated' && !editingChapter && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 px-3 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateChapter(chapter.id);
                      }}
                      disabled={!!generatingChapter || !!editingChapter}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Regenerate
                    </Button>
                  )}
                  {expandedChapter === chapter.id && !editingChapter ? (
                    <ChevronUp className="h-5 w-5 text-ink-faded" />
                  ) : !editingChapter ? (
                    <ChevronDown className="h-5 w-5 text-ink-faded" />
                  ) : null}
                </div>
              </div>
              
              {/* Expanded chapter content */}
              {expandedChapter === chapter.id && (
                <div className={cn(
                  "p-4 bg-cream border-t border-accent-tertiary/10",
                  editingChapter === chapter.id && "bg-paper"
                )}>
                  {chapter.status === 'generated' && chapter.content && !editingChapter ? (
                    <div 
                      className="prose prose-sm max-w-none font-serif text-ink-dark"
                      dangerouslySetInnerHTML={{ __html: formatContent(chapter.content) }}
                    />
                  ) : chapter.status === 'generating' ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Loader2 className="h-8 w-8 text-accent-primary animate-spin mb-3" />
                      <p className="font-serif text-ink-light">Generating content with AI...</p>
                      <p className="text-xs text-ink-faded mt-1 font-serif">This may take a minute or two</p>
                    </div>
                  ) : editingChapter === chapter.id ? (
                    <div className="space-y-4">
                      <div className="bg-accent-primary/5 p-3 rounded-lg border border-accent-primary/10">
                        <p className="text-accent-primary text-sm font-serif">
                          Edit the chapter content below. Use markdown formatting for headings (#, ##), lists (-, 1.), and emphasis (**bold**, *italic*).
                        </p>
                      </div>
                      <Textarea 
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full min-h-[400px] font-mono text-sm text-ink-dark border-accent-tertiary/30 focus:border-accent-primary/50"
                        placeholder="Write or paste your chapter content here. Use markdown for formatting..."
                      />
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={handleCancelEditing}
                          disabled={savingChapter === chapter.id}
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                        <Button
                          variant="workflow"
                          size="sm"
                          className="gap-1.5 text-white"
                          onClick={() => handleSaveEdits(chapter.id)}
                          disabled={savingChapter === chapter.id}
                        >
                          {savingChapter === chapter.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-3.5 w-3.5" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="font-serif text-ink-light">
                        Click the "Generate" button to create content for this chapter.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Generation control buttons */}
      {localChapters.some(c => c.status === 'pending') && !editingChapter && (
        <div className="space-y-4">
          <Button
            className="gap-2 w-full text-white"
            variant="workflowOutline"
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
            className="gap-2 w-full text-white"
            variant="workflow"
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
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button
          variant="workflowOutline"
          onClick={() => setCurrentStep('idea-selection')}
          className="gap-2"
          disabled={!!editingChapter}
        >
          Back
        </Button>
        <Button
          className="gap-2 text-white"
          variant={allChaptersGenerated ? "workflowGold" : "workflow"}
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
      </div>
    </div>
  );
};

export default EbookWritingStep; 