import React, { useState, useRef, useEffect } from 'react';
import { useWorkflow } from '@/lib/contexts/WorkflowContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Loader2,
  X,
  File,
  Image,
  Trash2,
  AlertCircle,
  Youtube,
  ArrowRight,
  Brain,
  Save,
  Check,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useBrainDumps } from '@/hooks/useBrainDumps';
// Import YouTube transcript functions
import { isYoutubeUrl, extractYoutubeVideoId, fetchYoutubeTranscript, youtubeUrlRegex } from '@/lib/youtubeTranscript';

// Loading overlay component with fancy animations
const LoadingOverlay = ({ 
  visible, 
  message, 
  step, 
  totalSteps,
  status,
  onCancel,
  showCancelButton = true
}: { 
  visible: boolean; 
  message: string;
  step?: number;
  totalSteps?: number;
  status?: string;
  onCancel?: () => void;
  showCancelButton?: boolean;
}) => {
  // Track duration for auto-cancel option
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  // Explicitly track dialog open state to prevent sync issues
  const [isOpen, setIsOpen] = useState(false);
  
  // Update dialog state when visible prop changes
  useEffect(() => {
    if (visible) {
      setIsOpen(true);
      setSecondsElapsed(0); // Reset timer when becoming visible
    } else {
      // Add slight delay when closing to prevent UI jank
      const timeout = setTimeout(() => {
        setIsOpen(false);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [visible]);
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (visible && isOpen) {
      // Reset timer when overlay becomes visible
      setSecondsElapsed(0);
      
      // Start counting seconds
      intervalId = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [visible, isOpen]);
  
  // Auto-show cancel button after 30 seconds (reduced from 45s)
  const showCancelOption = showCancelButton && (secondsElapsed > 25 || status === 'analyzing');
  
  // Auto-trigger cancel after very long duration (2 minutes)
  useEffect(() => {
    if (secondsElapsed > 120 && onCancel && visible) {
      console.warn("Analysis taking too long (2 minutes) - auto-cancelling");
      onCancel();
    }
  }, [secondsElapsed, onCancel, visible]);
  
  const handleOpenChange = (open: boolean) => {
    if (!open && onCancel) {
      onCancel();
    }
    setIsOpen(open);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-paper rounded-xl p-8 max-w-md w-full shadow-textera border border-accent-tertiary/20">
        <DialogHeader>
          <DialogTitle className="sr-only">Content Analysis</DialogTitle>
          <DialogDescription className="sr-only">
            AI is analyzing your content to generate structured ideas
          </DialogDescription>
        </DialogHeader>
        <div className="text-center">
          <div className="mb-6 relative">
            <div className="w-20 h-20 mx-auto relative">
              {/* Fancy pulsing rings */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.6, 0.4]
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-full bg-accent-primary/30"
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className="absolute inset-0 rounded-full bg-accent-primary/20"
              />
              
              {/* Icon for processing */}
              <div className="absolute inset-0 flex items-center justify-center">
                {status === 'analyzing' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Brain className="h-10 w-10 text-accent-primary" />
                  </motion.div>
                ) : (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-10 w-10 text-accent-primary" />
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-display text-ink-dark mb-2">{message}</h3>
          
          {step !== undefined && totalSteps !== undefined && (
            <div className="mb-4">
              <p className="text-sm text-ink-light font-serif mb-2">
                Step {step} of {totalSteps}
              </p>
              <div className="w-full h-2 bg-accent-tertiary/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(step / totalSteps) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-accent-primary rounded-full"
                />
              </div>
            </div>
          )}
          
          <p className="text-ink-light font-serif max-w-md mx-auto">
            {status === 'analyzing' 
              ? message.includes("API") || message.includes("model") || message.includes("retry")
                ? message // Show detailed API status messages
                : "Our AI is analyzing your content to generate structured ideas for your eBook. This may take a few minutes."
              : "Please wait while we process your content..."}
          </p>
          
          {secondsElapsed > 0 && (
            <p className="text-xs text-ink-faded mt-3 font-serif">
              Processing time: {secondsElapsed} seconds
              {secondsElapsed > 90 && " (may take up to 2 minutes)"}
            </p>
          )}
          
          {/* Show additional helper text for long-running operations */}
          {status === 'analyzing' && !message.includes("failed") && !message.includes("error") && (
            <p className="text-xs text-ink-faded mt-3 font-serif max-w-sm mx-auto">
              For large content, this could take 1-2 minutes. You'll see updates here as processing continues.
            </p>
          )}

          {/* Note about long processing times - show earlier than before */}
          {secondsElapsed > 45 && !message.includes("timeout") && (
            <div className="mt-4 p-3 bg-amber-50 rounded-md border border-amber-200">
              <p className="text-xs text-amber-700 font-serif">
                This is taking longer than expected. We're still working on it, but you can cancel and try with less content if needed.
              </p>
            </div>
          )}
          
          {/* Optional cancel button - show earlier at 25 seconds */}
          {showCancelOption && onCancel && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                  setIsOpen(false);
                }
              }}
              className="mt-4 text-ink-light hover:text-ink-dark font-serif"
            >
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * YouTube Transcript Progress Indicator component
 * Shows transcript processing status in the UI
 */
const YouTubeTranscriptIndicator = () => {
  const [visibleLinks, setVisibleLinks] = useState<{loading: number, total: number, completed: number}>({
    loading: 0,
    total: 0,
    completed: 0
  });
  
  // Track and update status of YouTube links
  useEffect(() => {
    const updateStatus = () => {
      // Find all YouTube links with transcripts in the page
      const links = document.querySelectorAll('[data-youtube-link="true"]');
      const loadingLinks = document.querySelectorAll('[data-youtube-loading="true"]');
      const completedLinks = document.querySelectorAll('[data-youtube-completed="true"]');
      
      setVisibleLinks({
        loading: loadingLinks.length,
        total: links.length,
        completed: completedLinks.length
      });
    };
    
    // Update status initially and every 2 seconds
    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Only show if there are YouTube links being processed
  if (visibleLinks.loading === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-accent-primary/95 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in flex items-center gap-3">
      <div className="relative h-6 w-6">
        <Youtube className="h-6 w-6 z-10 relative" />
        <div className="absolute inset-0 bg-accent-primary rounded-full animate-ping opacity-30"></div>
      </div>
      <div className="text-sm">
        <p className="font-medium">Processing YouTube Transcripts</p>
        <p className="text-xs opacity-80">
          {visibleLinks.completed} of {visibleLinks.total} completed
        </p>
      </div>
      <div className="w-20 h-1.5 bg-white/30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white rounded-full transition-all duration-300"
          style={{ width: `${(visibleLinks.completed / visibleLinks.total) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

/**
 * The second step in the eBook creation workflow.
 * Users can paste text, upload files, or add links to compile
 * unstructured content for the AI to analyze.
 */
const BrainDumpStep = () => {
  const { 
    project, 
    brainDump, 
    brainDumpFiles,
    brainDumpLinks,
    saveBrainDump, 
    addBrainDumpFile, 
    removeBrainDumpFile,
    addBrainDumpLink,
    removeBrainDumpLink,
    analyzeBrainDump,
    setCurrentStep,
    loading
  } = useWorkflow();
  
  // Add the hook for saving brain dumps independently
  const { saveBrainDumpFromWorkflow } = useBrainDumps();

  const [content, setContent] = useState(brainDump?.raw_content || '');
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isYouTube, setIsYouTube] = useState(false);
  
  // State for save for later dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSavingForLater, setIsSavingForLater] = useState(false);
  const [savingSuccess, setSavingSuccess] = useState(false);
  
  // Local loading states for better UX control
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [loadingMessage, setLoadingMessage] = useState('Processing content...');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Track active transcript fetching operations to prevent race conditions
  const activeTranscriptFetches = useRef<Set<string>>(new Set());

  // Load brain dump data when available
  useEffect(() => {
    if (brainDump?.raw_content) {
      setContent(brainDump.raw_content);
    }
  }, [brainDump]);
  
  // Set default save title when project title is available
  useEffect(() => {
    if (project?.title) {
      setSaveTitle(`${project.title} - Brain Dump`);
    }
  }, [project]);
  
  // Check if URL is YouTube when linkUrl changes
  useEffect(() => {
    // Only update isYouTube if linkUrl has a value and avoid unnecessary state updates
    if (linkUrl) {
      const youtubeUrl = isYoutubeUrl(linkUrl);
      // Only set state if it's different from current value
      if (isYouTube !== youtubeUrl) {
        setIsYouTube(youtubeUrl);
      }
    } else if (isYouTube) {
      // Only update state if isYouTube is currently true
      setIsYouTube(false);
    }
  }, [linkUrl, isYouTube]);
  
  // Track brain dump analyze status
  useEffect(() => {
    if (brainDump?.status === 'analyzing') {
      setIsAnalyzing(true);
      setLoadingMessage('Analyzing your content...');
      setLoadingStep(2);
    } else if (brainDump?.status === 'analyzed') {
      setIsAnalyzing(false);
    }
  }, [brainDump?.status]);
  
  // Watch the global loading state to update our UI
  useEffect(() => {
    if (!loading) {
      setIsSaving(false);
      setIsAnalyzing(false);
    }
  }, [loading]);

  /**
   * Handles scanning content for YouTube URLs and extracting transcripts
   */
  const scanContentForYouTubeLinks = async (content: string) => {
    if (!content || typeof content !== 'string') return;
    
    // Use the enhanced regex from the library
    const matches = [...content.matchAll(youtubeUrlRegex)];
    
    if (matches.length === 0) return;
    
    // Show a subtle notification if YouTube URLs are found
    const newLinks = matches.length;
    if (newLinks > 0) {
      // Show a temporary "toast" notification (if we had a toast component)
      // For now, we'll just use the error state with a positive message
      const message = `Found ${newLinks} YouTube URL${newLinks > 1 ? 's' : ''}. Transcripts will be automatically extracted.`;
      console.log(message);
      // Only set this as a non-error status message if we don't already have an error
      if (!error) {
        setError(null);
        setTimeout(() => {
          // Add a small UI indicator that shows YouTube links are being processed
          const youtubeElement = document.createElement('div');
          youtubeElement.className = 'youtube-processing-indicator';
          youtubeElement.style.cssText = 'position: fixed; bottom: 8px; left: 8px; background-color: rgba(255,0,0,0.1); color: #cc0000; padding: 4px 12px; border-radius: 4px; font-size: 12px; z-index: 1000; font-family: sans-serif;';
          youtubeElement.textContent = 'YouTube Transcripts: Processing...';
          document.body.appendChild(youtubeElement);
          
          // Remove it after a short while
          setTimeout(() => {
            if (document.body.contains(youtubeElement)) {
              document.body.removeChild(youtubeElement);
            }
          }, 3000);
        }, 100);
      }
    }
    
    // Process each unique YouTube URL
    const processedVideoIds = new Set();
    
    for (const match of matches) {
      const fullUrl = match[0];
      // Use the improved extraction function for reliability
      const videoId = extractYoutubeVideoId(fullUrl);
      
      // Skip if no video ID or already processed
      if (!videoId || processedVideoIds.has(videoId)) continue;
      
      // Check if we're already fetching this transcript
      if (activeTranscriptFetches.current.has(videoId)) {
        console.log(`Skipping duplicate fetch for video ${videoId}`);
        continue;
      }
      
      // Add to processed set and active fetches
      processedVideoIds.add(videoId);
      activeTranscriptFetches.current.add(videoId);
      
      // Check if this video is already in brainDumpLinks
      const existingLink = brainDumpLinks.find(link => 
        link.link_type === 'youtube' && (
          link.url.includes(videoId) || 
          (link.url.includes('youtube') && extractYoutubeVideoId(link.url) === videoId)
        )
      );
      
      // If it's already been added with a transcript or is loading, skip
      if (existingLink && (existingLink.transcript || existingLink.isLoadingTranscript)) {
        activeTranscriptFetches.current.delete(videoId);
        continue;
      }
      
      // If it exists but doesn't have a transcript, update it
      if (existingLink) {
        try {
          // Update to loading state
          await addBrainDumpLink(
            existingLink.url,
            existingLink.title,
            'youtube',
            existingLink.id,
            existingLink.thumbnail,
            undefined,
            true,
            undefined
          );
          
          // Set a timeout for fetch operations
          let hasCompleted = false;
          const timeoutId = setTimeout(() => {
            if (!hasCompleted) {
              console.warn(`Transcript fetch timeout for video ${videoId}`);
              addBrainDumpLink(
                existingLink.url,
                existingLink.title,
                'youtube',
                existingLink.id,
                existingLink.thumbnail,
                undefined,
                false,
                "Transcript fetch timed out. Try again later."
              );
              activeTranscriptFetches.current.delete(videoId);
            }
          }, 30000); // 30 second timeout
          
          try {
            // Fetch transcript
            const transcriptResult = await fetchYoutubeTranscript(videoId);
            hasCompleted = true;
            clearTimeout(timeoutId);
            
            if (transcriptResult.error) {
              await addBrainDumpLink(
                existingLink.url,
                existingLink.title,
                'youtube',
                existingLink.id,
                existingLink.thumbnail,
                undefined,
                false,
                transcriptResult.error
              );
            } else if (transcriptResult.transcript) {
              await addBrainDumpLink(
                existingLink.url,
                existingLink.title,
                'youtube',
                existingLink.id,
                existingLink.thumbnail,
                transcriptResult.transcript,
                false,
                undefined
              );
            }
          } catch (fetchErr) {
            hasCompleted = true;
            clearTimeout(timeoutId);
            console.error("Error fetching transcript:", fetchErr);
            await addBrainDumpLink(
              existingLink.url,
              existingLink.title,
              'youtube',
              existingLink.id,
              existingLink.thumbnail,
              undefined,
              false,
              `Failed to fetch transcript: ${fetchErr.message || "Unknown error"}`
            );
          }
        } catch (err: any) {
          console.error("Error updating transcript for existing link:", err);
          await addBrainDumpLink(
            existingLink.url,
            existingLink.title,
            'youtube',
            existingLink.id,
            existingLink.thumbnail,
            undefined,
            false,
            `Failed to extract transcript: ${err.message || "Unknown error"}`
          );
        } finally {
          // Always remove from active fetches
          activeTranscriptFetches.current.delete(videoId);
        }
      } else {
        // Create a new link
        try {
          const title = `YouTube Video: ${videoId}`;
          const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
          
          // First add link without transcript (loading state)
          const linkId = await addBrainDumpLink(
            fullUrl,
            title,
            'youtube',
            undefined,
            thumbnail,
            undefined,
            true
          );
          
          // Set a timeout for fetch operations
          let hasCompleted = false;
          const timeoutId = setTimeout(() => {
            if (!hasCompleted) {
              console.warn(`Transcript fetch timeout for video ${videoId}`);
              addBrainDumpLink(
                fullUrl,
                title,
                'youtube',
                linkId,
                thumbnail,
                undefined,
                false,
                "Transcript fetch timed out. Try again later."
              );
              activeTranscriptFetches.current.delete(videoId);
            }
          }, 30000); // 30 second timeout
          
          try {
            // Fetch transcript
            const transcriptResult = await fetchYoutubeTranscript(videoId);
            hasCompleted = true;
            clearTimeout(timeoutId);
            
            if (transcriptResult.error) {
              await addBrainDumpLink(
                fullUrl,
                title,
                'youtube',
                linkId,
                thumbnail,
                undefined,
                false,
                transcriptResult.error
              );
            } else if (transcriptResult.transcript) {
              await addBrainDumpLink(
                fullUrl,
                title,
                'youtube',
                linkId,
                thumbnail,
                transcriptResult.transcript,
                false,
                undefined
              );
            }
          } catch (fetchErr) {
            hasCompleted = true;
            clearTimeout(timeoutId);
            console.error("Error fetching transcript:", fetchErr);
            await addBrainDumpLink(
              fullUrl,
              title,
              'youtube',
              linkId,
              thumbnail,
              undefined,
              false,
              `Failed to fetch transcript: ${fetchErr.message || "Unknown error"}`
            );
          }
        } catch (err: any) {
          console.error("Error creating new link with transcript:", err);
          // Let the error pass without creating a partial link
        } finally {
          // Always remove from active fetches
          activeTranscriptFetches.current.delete(videoId);
        }
      }
    }
  };

  /**
   * Handles content changes
   */
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
  };

  /**
   * Debounced function to scan for YouTube links when content changes
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      scanContentForYouTubeLinks(content);
    }, 3000); // Delay to avoid too many API calls while typing
    
    return () => clearTimeout(timer);
  }, [content, brainDumpLinks, addBrainDumpLink]);

  /**
   * Handles saving the brain dump to the database
   */
  const handleSave = async () => {
    if (!content.trim() && brainDumpFiles.length === 0 && brainDumpLinks.length === 0) {
      setError('Please add some content to analyze. You can paste text, upload files, or add links.');
      return;
    }

    setIsSaving(true);
    setLoadingMessage('Saving your content...');
    setError(null);

    try {
      await saveBrainDump(content);
      
      // Scan content for YouTube links after saving
      await scanContentForYouTubeLinks(content);
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles opening the save for later dialog
   */
  const handleOpenSaveDialog = () => {
    if (!content.trim() && brainDumpFiles.length === 0 && brainDumpLinks.length === 0) {
      setError('Please add some content before saving. You can paste text, upload files, or add links.');
      return;
    }
    
    // Set default title if not already set
    if (!saveTitle) {
      setSaveTitle(project?.title ? `${project.title} - Brain Dump` : 'Brain Dump');
    }
    
    setSaveDialogOpen(true);
  };
  
  /**
   * Handles saving brain dump for later use
   */
  const handleSaveForLater = async () => {
    setIsSavingForLater(true);
    setSavingSuccess(false);
    setError(null);
    
    try {
      // First save to the workflow context if we have unsaved changes
      if (content !== brainDump?.raw_content) {
        await saveBrainDump(content);
      }
      
      // Then save as a standalone brain dump
      const result = await saveBrainDumpFromWorkflow(
        saveTitle || 'Brain Dump',
        content,
        brainDump?.analyzed_content,
        brainDumpFiles,
        brainDumpLinks
      );
      
      if (result) {
        setSavingSuccess(true);
        // Auto-close after 2 seconds
        setTimeout(() => {
          setSaveDialogOpen(false);
          setSavingSuccess(false);
        }, 2000);
      } else {
        throw new Error('Failed to save brain dump for later use');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save brain dump for later use');
    } finally {
      setIsSavingForLater(false);
    }
  };

  /**
   * Handles text dropped into a container
   */
  const handleTextDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.items) {
      const items = Array.from(e.dataTransfer.items);
      
      // Check for plain text
      const textItem = items.find(item => item.kind === 'string' && item.type === 'text/plain');
      if (textItem) {
        textItem.getAsString((text) => {
          setContent(prevText => prevText ? `${prevText}\n\n${text}` : text);
        });
        return;
      }
      
      // Handle files
      const fileItems = items.filter(item => item.kind === 'file');
      if (fileItems.length > 0) {
        const droppedFiles = fileItems.map(item => item.getAsFile()).filter(Boolean) as File[];
        
        droppedFiles.forEach(async (file) => {
          try {
            await addBrainDumpFile(file);
          } catch (err: any) {
            setError(err.message || 'Failed to add file');
          }
        });
      }
    }
  };

  /**
   * Handles text dropped into a textarea element
   */
  const handleTextAreaDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.items) {
      const items = Array.from(e.dataTransfer.items);
      
      // Check for plain text
      const textItem = items.find(item => item.kind === 'string' && item.type === 'text/plain');
      if (textItem) {
        textItem.getAsString((text) => {
          setContent(prevText => prevText ? `${prevText}\n\n${text}` : text);
        });
        return;
      }
      
      // Handle files
      const fileItems = items.filter(item => item.kind === 'file');
      if (fileItems.length > 0) {
        const droppedFiles = fileItems.map(item => item.getAsFile()).filter(Boolean) as File[];
        
        droppedFiles.forEach(async (file) => {
          try {
            await addBrainDumpFile(file);
          } catch (err: any) {
            setError(err.message || 'Failed to add file');
          }
        });
      }
    }
  };

  /**
   * Handles file selection from file input
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      for (const file of files) {
        try {
          await addBrainDumpFile(file);
          
          // For text-based files, read the content to scan for YouTube URLs
          if (file.type === 'text/plain' || 
              file.type === 'text/markdown' || 
              file.type === 'application/rtf' ||
              file.name.endsWith('.txt') || 
              file.name.endsWith('.md') || 
              file.name.endsWith('.rtf')) {
            
            const reader = new FileReader();
            
            reader.onload = async (event) => {
              const fileContent = event.target?.result as string;
              if (fileContent) {
                await scanContentForYouTubeLinks(fileContent);
              }
            };
            
            reader.readAsText(file);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to add file');
          break;
        }
      }
      
      // Reset the input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  /**
   * Adds a link to the brain dump
   */
  const handleLinkAdd = async () => {
    if (!linkUrl) return;
    
    // Simple URL validation
    let validatedUrl = linkUrl;
    try {
      // Attempt to create a URL (this will throw if invalid)
      new URL(validatedUrl);
    } catch (e) {
      // If it fails, try adding https:// prefix and try again
      try {
        validatedUrl = 'https://' + validatedUrl;
        new URL(validatedUrl); // This will throw if still invalid
      } catch (e2) {
        setError('Please enter a valid URL');
        return;
      }
    }
    
    setError(null);
    
    // Check if the link is a YouTube URL
    const youtubeUrl = isYoutubeUrl(validatedUrl);
    
    // Extract YouTube video ID if applicable
    const videoId = youtubeUrl ? extractYoutubeVideoId(validatedUrl) : null;
    
    // If it's a YouTube URL but we couldn't extract a video ID, show an error
    if (youtubeUrl && !videoId) {
      setError('Could not extract video ID from YouTube URL. Please check the URL format.');
      return;
    }
    
    // Create title based on URL type
    const title = youtubeUrl 
      ? `YouTube Video: ${videoId || 'Unknown'}`
      : `Web Page: ${new URL(validatedUrl).hostname}`;
    
    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : undefined;
    
    try {
      // First add the link with initial properties
      const linkId = await addBrainDumpLink(
        validatedUrl, 
        title, 
        youtubeUrl ? 'youtube' : 'webpage',
        undefined,
        thumbnail
      );
      
      // For YouTube links, automatically extract transcript
      if (youtubeUrl && videoId) {
        // Check if this video is already being fetched
        if (activeTranscriptFetches.current.has(videoId)) {
          console.log(`Skipping duplicate fetch for video ${videoId}`);
          return;
        }
        
        // Update the link to show loading state
        await addBrainDumpLink(
          validatedUrl,
          title,
          'youtube',
          linkId,
          thumbnail,
          undefined,
          true,
          undefined
        );
        
        // Mark as currently fetching to prevent duplicates
        activeTranscriptFetches.current.add(videoId);
        
        // Set a timeout for fetch operation
        let hasCompleted = false;
        const timeoutId = setTimeout(() => {
          if (!hasCompleted) {
            console.warn(`Transcript fetch timeout for video ${videoId}`);
            addBrainDumpLink(
              validatedUrl,
              title,
              'youtube',
              linkId,
              thumbnail,
              undefined,
              false,
              "Transcript fetch timed out. Try again later."
            );
            activeTranscriptFetches.current.delete(videoId);
          }
        }, 30000); // 30 second timeout
        
        try {
          // Fetch the transcript
          const transcriptResult = await fetchYoutubeTranscript(videoId);
          hasCompleted = true;
          clearTimeout(timeoutId);
          
          if (transcriptResult.error) {
            // Update with error
            await addBrainDumpLink(
              validatedUrl,
              title,
              'youtube',
              linkId,
              thumbnail,
              undefined,
              false,
              transcriptResult.error
            );
          } else if (transcriptResult.transcript) {
            // Update with transcript
            await addBrainDumpLink(
              validatedUrl,
              title,
              'youtube',
              linkId,
              thumbnail,
              transcriptResult.transcript,
              false,
              undefined
            );
          }
        } catch (transcriptErr: any) {
          // Handle any unexpected errors
          hasCompleted = true;
          clearTimeout(timeoutId);
          
          console.error("Error extracting transcript:", transcriptErr);
          await addBrainDumpLink(
            validatedUrl,
            title,
            'youtube',
            linkId,
            thumbnail,
            undefined,
            false,
            "Failed to extract transcript: " + (transcriptErr.message || "Unknown error")
          );
        } finally {
          // Always remove from active fetches
          activeTranscriptFetches.current.delete(videoId);
        }
      }
      
      // Reset form
      setLinkUrl('');
      setIsYouTube(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add link');
    }
  };

  /**
   * Formats file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Validates if there is enough content to analyze without setting error state
   */
  const isContentValid = (): boolean => {
    // Check if we have enough content to analyze
    const wordCount = content.trim().split(/\s+/).length;
    
    if (!content.trim() && brainDumpFiles.length === 0 && brainDumpLinks.length === 0) {
      return false;
    }
    
    if (content.trim() && wordCount < 50 && brainDumpFiles.length === 0 && brainDumpLinks.length === 0) {
      return false;
    }
    
    return true;
  };
  
  /**
   * Sets appropriate error message based on content validation
   */
  const validateContent = (): boolean => {
    // Check if we have enough content to analyze
    const wordCount = content.trim().split(/\s+/).length;
    
    if (!content.trim() && brainDumpFiles.length === 0 && brainDumpLinks.length === 0) {
      setError('Please add some content to analyze. You can paste text, upload files, or add links.');
      return false;
    }
    
    if (content.trim() && wordCount < 50 && brainDumpFiles.length === 0 && brainDumpLinks.length === 0) {
      setError('Please add more content to analyze. We need at least 50 words to generate meaningful ideas.');
      return false;
    }
    
    return true;
  };
  
  /**
   * Handles analyzing the brain dump content
   */
  const handleAnalyze = async () => {
    // Validate content before proceeding
    if (!validateContent()) {
      return;
    }

    // Check if analysis is already in progress
    if (isAnalyzing) {
      return;
    }

    // Set local loading state
    setIsAnalyzing(true);
    setLoadingStep(1);
    setLoadingMessage('Preparing content for analysis...');
    setError(null);
    
    // Hard timeout - Force UI update after 60 seconds if stuck
    const HARD_TIMEOUT = 60000; // 60 seconds
    const hardTimeoutId = setTimeout(() => {
      console.warn("Hard timeout triggered - analysis taking too long");
      setError("Analysis is taking longer than expected but should complete soon.");
      
      // Don't stop analyzing - just update the message
      setLoadingMessage("Still working... This may take another minute.");
      
      // Set a final timeout to ensure we don't get completely stuck
      setTimeout(() => {
        if (isAnalyzing) {
          setIsAnalyzing(false);
          setCurrentStep('idea-selection');
        }
      }, 60000); // Wait another minute before forcing advancement
    }, HARD_TIMEOUT);
    
    // Check if no updates are happening
    let lastProgressUpdate = Date.now();
    const progressCheckId = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastProgressUpdate;
      if (timeSinceLastUpdate > 15000) { // No updates for 15 seconds
        console.warn("No progress updates for 15 seconds");
        setLoadingMessage("Analysis is processing. Please wait while we work on your content...");
      }
    }, 5000);

    try {
      // Step 1: Save any unsaved content first
      if (content !== brainDump?.raw_content) {
        try {
          await saveBrainDump(content);
          // Only update UI if still in analyzing state (not cancelled)
          if (isAnalyzing) {
            setLoadingStep(2);
            setLoadingMessage('Content saved! Starting analysis...');
            lastProgressUpdate = Date.now(); // Reset progress timestamp
          } else {
            clearTimeout(hardTimeoutId);
            clearInterval(progressCheckId);
            return; // Analysis was cancelled during save
          }
        } catch (saveErr) {
          console.error("Error saving content before analysis:", saveErr);
          setLoadingStep(2);
          setLoadingMessage('Using local content for analysis...');
          lastProgressUpdate = Date.now(); // Reset progress timestamp
        }
      } else {
        setLoadingStep(2);
        setLoadingMessage('Content ready. Starting analysis...');
        lastProgressUpdate = Date.now();
      }

      // Ensure all YouTube transcripts are processed before analysis
      if (brainDumpLinks.some(link => link.link_type === 'youtube' && link.isLoadingTranscript)) {
        try {
          // Check for any YouTube links that are still loading transcripts
          const loadingLinks = brainDumpLinks.filter(link => 
            link.link_type === 'youtube' && link.isLoadingTranscript
          );
          
          if (loadingLinks.length > 0) {
            setLoadingMessage(`Waiting for ${loadingLinks.length} YouTube transcript${loadingLinks.length > 1 ? 's' : ''} to complete...`);
            
            // Wait for a reasonable time for transcripts to complete (max 15 seconds)
            let waitTime = 0;
            const MAX_WAIT = 15000; // 15 seconds max wait (increased from 10)
            const WAIT_INTERVAL = 500; // Check every 500ms
            
            // To track progress changes
            let previousLoadingCount = loadingLinks.length;
            
            while (waitTime < MAX_WAIT) {
              // Check if any links are still loading
              const currentlyLoadingLinks = brainDumpLinks.filter(link => 
                link.link_type === 'youtube' && link.isLoadingTranscript
              );
              
              const stillLoadingCount = currentlyLoadingLinks.length;
              
              // Update message if progress has been made
              if (stillLoadingCount < previousLoadingCount) {
                previousLoadingCount = stillLoadingCount;
                setLoadingMessage(`Processing YouTube transcripts: ${stillLoadingCount} remaining...`);
                lastProgressUpdate = Date.now(); // Update progress timestamp
              }
              
              if (stillLoadingCount === 0) {
                break; // All transcripts are loaded
              }
              
              // Wait a bit before checking again
              await new Promise(resolve => setTimeout(resolve, WAIT_INTERVAL));
              waitTime += WAIT_INTERVAL;
            }
            
            // If some transcripts are still loading after timeout, proceed anyway
            const remainingLoading = brainDumpLinks.filter(link => 
              link.link_type === 'youtube' && link.isLoadingTranscript
            );
            
            if (remainingLoading.length > 0) {
              console.warn(`Proceeding with analysis with ${remainingLoading.length} incomplete transcripts`);
              setLoadingMessage(`Proceeding with analysis (${remainingLoading.length} transcript${remainingLoading.length > 1 ? 's' : ''} still processing)...`);
              
              // Cancel any remaining fetches to avoid race conditions during analysis
              remainingLoading.forEach(link => {
                const videoId = extractYoutubeVideoId(link.url);
                if (videoId && activeTranscriptFetches.current.has(videoId)) {
                  console.log(`Cancelling transcript fetch for ${videoId} due to analysis starting`);
                  activeTranscriptFetches.current.delete(videoId);
                  
                  // Update link to not be in loading state
                  addBrainDumpLink(
                    link.url,
                    link.title,
                    'youtube',
                    link.id,
                    link.thumbnail,
                    undefined,
                    false,
                    "Cancelled due to analysis starting"
                  ).catch(err => console.error("Error updating cancelled transcript link:", err));
                }
              });
            } else {
              setLoadingMessage('All transcripts processed, starting analysis...');
            }
          }
        } catch (transcriptErr) {
          // Log but continue even if there's an issue with transcript processing
          console.error("Error handling transcripts before analysis:", transcriptErr);
        }
      }

      // Step 2: Analyze content
      setLoadingStep(3);
      setLoadingMessage('Analyzing your content...');
      lastProgressUpdate = Date.now();
      
      try {
        // Define a custom progress callback to update UI status
        const progressCallback = (statusMessage: string) => {
          if (isAnalyzing) {
            console.log("Progress update:", statusMessage);
            setLoadingMessage(statusMessage);
            lastProgressUpdate = Date.now();
          }
        };
        
        // Capture the current content to avoid race conditions if content changes during analysis
        const contentToAnalyze = content;
        
        // Call analyzeBrainDump with progress callback
        await analyzeBrainDump(progressCallback);
        
        // Clean up and let the workflow navigate to next step
        clearTimeout(hardTimeoutId);
        clearInterval(progressCheckId);
        
        // Wait a bit for state updates to propagate
        setTimeout(() => {
          setIsAnalyzing(false);
          setCurrentStep('idea-selection');
        }, 500);
      } catch (err: any) {
        clearTimeout(hardTimeoutId);
        clearInterval(progressCheckId);
        
        console.error("Analysis error:", err);
        
        // Check if this is an OpenRouter API key error
        if (err.message && (
            err.message.includes("No valid OpenRouter API key found") || 
            err.message.includes("OpenRouter API key is invalid") ||
            err.message.includes("API authentication") ||
            err.message.includes("No auth credentials found")
        )) {
          // Show a more helpful OpenRouter API error to the user
          setError(`OpenRouter API key error: You need to add a valid API key to use AI features. 
            Please add your OpenRouter API key to the .env file: VITE_OPENROUTER_API_KEY=your-key-here
            Get a free API key from https://openrouter.ai`);
          setIsAnalyzing(false);
          return; // Don't proceed to the next step
        }
        
        // For other errors, log but still move forward
        setError('Analysis completed with basic ideas. Moving to next step.');
        
        // Force navigation after a brief delay
        setTimeout(() => {
          setIsAnalyzing(false);
          setCurrentStep('idea-selection');
        }, 1000);
      }
    } catch (err: any) {
      clearTimeout(hardTimeoutId);
      clearInterval(progressCheckId);
      console.error("Outer analysis error:", err);
      setError('An error occurred but we can continue to the next step.');
      setIsAnalyzing(false);
      
      // In case of a severe error, still try to advance
      setTimeout(() => {
        setCurrentStep('idea-selection');
      }, 1000);
    }
  };

  // Ensure proper cleanup of object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up object URLs to prevent memory leaks
      brainDumpFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      
      // Clear the active transcript fetches set
      activeTranscriptFetches.current.clear();
      
      // Clear any pending timeouts
      const currentTimeoutId = window.setTimeout(() => {}, 0);
      for (let i = currentTimeoutId; i > currentTimeoutId - 100; i--) {
        window.clearTimeout(i);
      }
    };
  }, [brainDumpFiles]);

  return (
    <div className="space-y-8">
      {/* Loading overlay */}
      <LoadingOverlay 
        visible={isSaving} 
        message="Saving your content..."
        status="saving"
        onCancel={() => setIsSaving(false)}
      />
      
      <LoadingOverlay 
        visible={isAnalyzing} 
        message={loadingMessage}
        step={loadingStep}
        totalSteps={3}
        status="analyzing"
        onCancel={() => {
          // Only allow cancellation during early steps
          if (loadingStep < 3) {
            setIsAnalyzing(false);
            setError("Analysis cancelled by user");
            // Clear any remaining timeouts
            const currentTimeoutId = window.setTimeout(() => {}, 0);
            // Clear recent timeout IDs (safer approach than using subtraction on timeout IDs)
            for (let i = currentTimeoutId; i > currentTimeoutId - 100; i--) {
              window.clearTimeout(i);
            }
          }
        }}
      />
      
      {/* YouTube transcript processing indicator */}
      <YouTubeTranscriptIndicator />
      
      {/* Word count indicator */}
      {content.trim() && !isAnalyzing && !isSaving && (
        <div className="fixed bottom-4 right-4 z-50 bg-accent-primary/90 text-white py-2 px-4 rounded-full shadow-sm flex items-center gap-2 text-sm transition-opacity duration-300 opacity-90 hover:opacity-100">
          <FileText className="h-4 w-4" />
          <span>{content.trim().split(/\s+/).length.toLocaleString()} words</span>
          {content.trim().split(/\s+/).length < 50 && (
            <span className="bg-yellow-400 text-ink-dark text-xs px-2 py-0.5 rounded-full ml-1">Need 50+ words</span>
          )}
        </div>
      )}
      
      <div>
        <h2 className="text-2xl font-display text-ink-dark mb-4">
          Brain Dump
        </h2>
        <p className="text-ink-light font-serif max-w-3xl">
          Add all your unstructured content, ideas, and research. Upload files, paste text, 
          or add links. Our AI will analyze and organize it into structured eBook ideas.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start text-red-700">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <p className="font-serif text-sm">{error}</p>
        </div>
      )}

      <div className="border border-accent-tertiary/20 rounded-lg bg-paper shadow-textera p-6 space-y-6">
        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-cream border border-accent-tertiary/20">
            <TabsTrigger 
              value="paste" 
              className="data-[state=active]:bg-paper data-[state=active]:text-accent-primary flex items-center gap-2 text-ink-light font-serif"
            >
              <FileText className="h-4 w-4" />
              Paste Text
            </TabsTrigger>
            <TabsTrigger 
              value="upload" 
              className="data-[state=active]:bg-paper data-[state=active]:text-accent-primary flex items-center gap-2 text-ink-light font-serif"
            >
              <Upload className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger 
              value="link" 
              className="data-[state=active]:bg-paper data-[state=active]:text-accent-primary flex items-center gap-2 text-ink-light font-serif"
            >
              <LinkIcon className="h-4 w-4" />
              Add Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="content" className="form-label">Content</Label>
                <span className="text-xs text-ink-faded font-serif">
                  {content.length} characters
                </span>
              </div>
              <Textarea
                className="w-full min-h-[250px] font-serif text-ink-dark"
                placeholder="Paste your content here or drag and drop files..."
                value={content}
                onChange={handleContentChange}
                onDrop={handleTextAreaDrop}
                onDragOver={(e) => e.preventDefault()}
              />
              <p className="text-xs text-ink-faded font-serif">
                You can drag and drop text or files directly into this area.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div 
              className="border-2 border-dashed border-accent-tertiary/30 rounded-lg p-12 text-center"
              onDrop={handleTextDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="h-12 w-12 mx-auto text-ink-faded mb-4" />
              <h3 className="text-lg font-medium text-ink-dark mb-2 font-display">
                Drag & drop files here
              </h3>
              <p className="text-sm text-ink-light mb-4 font-serif">
                Support for .docx, .pdf, .txt, .md, and more
              </p>
              <div className="flex flex-col gap-2 md:flex-row mt-6">
                <Button
                  variant="workflowGold"
                  className="gap-2 text-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>
                
                <Button
                  variant="workflowOutline"
                  className="gap-2"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Image className="h-4 w-4" />
                  Add Image
                </Button>
              </div>
              <input 
                ref={fileInputRef} 
                type="file" 
                className="hidden" 
                accept=".pdf,.docx,.doc,.txt,.rtf,.ppt,.pptx,.epub,.csv"
                multiple
                onChange={handleFileChange}
              />
              <input 
                ref={imageInputRef} 
                type="file" 
                className="hidden" 
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
              <p className="text-xs text-ink-faded mt-4 font-serif">
                Supported formats: PDF, DOCX, TXT, RTF, PPT, PPTX, EPUB, CSV, and common image formats
              </p>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content-url" className="form-label">URL</Label>
              <div className="flex gap-3 items-center">
                <Input
                  value={linkUrl}
                  onChange={(e) => {
                    setLinkUrl(e.target.value);
                  }}
                  placeholder={isYouTube ? "YouTube URL" : "Link to website or article"}
                  className="flex-1"
                />
                <Button
                  onClick={handleLinkAdd}
                  disabled={!linkUrl}
                  variant="workflow"
                  className="gap-2 text-white"
                >
                  <span>{isYouTube ? 'Add Video' : 'Add Link'}</span>
                  {isYouTube ? <Youtube className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-4">
          <Button 
            variant={isSaving ? "secondary" : "outline"}
            className={cn(
              "flex-1 font-serif transition-all duration-200",
              isSaving 
                ? "bg-accent-primary/10 text-accent-primary" 
                : "border-accent-primary/20 text-accent-primary hover:bg-accent-primary/5"
            )}
            onClick={handleSave}
            disabled={isSaving || isAnalyzing}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>Save Content</>
            )}
          </Button>
          
          <Button 
            variant="outline"
            className="flex-1 font-serif transition-all duration-200 border-accent-tertiary/40 text-ink-dark hover:bg-accent-tertiary/5"
            onClick={handleOpenSaveDialog}
            disabled={isSaving || isAnalyzing || !content.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            Save for Later
          </Button>
        </div>
      </div>

      {/* Display added content */}
      {(brainDumpFiles.length > 0 || brainDumpLinks.length > 0) && (
        <div className="border border-accent-tertiary/20 rounded-lg bg-paper shadow-textera p-6 space-y-4">
          <h3 className="font-serif font-semibold text-ink-dark">Added Content ({brainDumpFiles.length + brainDumpLinks.length})</h3>
          
          {/* Files */}
          {brainDumpFiles.length > 0 && (
            <div className="mb-4">
              <h4 className="font-serif text-sm text-ink-light mb-2">Files & Images ({brainDumpFiles.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {brainDumpFiles.map(file => (
                  <div 
                    key={file.id} 
                    className="p-3 bg-cream rounded-md border border-accent-tertiary/20 flex items-center"
                  >
                    {file.type === 'image' && file.preview ? (
                      <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 mr-3 bg-paper">
                        <img src={file.preview} alt={file.file_name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 mr-3 bg-paper flex items-center justify-center">
                        <FileText className="w-6 h-6 text-accent-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-ink-dark text-sm truncate" title={file.file_name}>
                        {file.file_name}
                      </p>
                      <p className="font-serif text-ink-faded text-xs">
                        {formatFileSize(file.file_size)}
                      </p>
                    </div>
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBrainDumpFile(file.id)}
                      className="p-1.5 text-ink-faded hover:text-red-500 transition-colors"
                      disabled={isSaving || isAnalyzing}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Links */}
          {brainDumpLinks.length > 0 && (
            <div>
              <h4 className="font-serif text-sm text-ink-light mb-2">Links ({brainDumpLinks.length})</h4>
              <div className="grid grid-cols-1 gap-2">
                {brainDumpLinks.map(link => (
                  <div 
                    key={link.id} 
                    className="p-3 bg-cream rounded-md border border-accent-tertiary/20 flex items-start"
                    data-youtube-link={link.link_type === 'youtube' ? 'true' : 'false'}
                    data-youtube-loading={link.link_type === 'youtube' && link.isLoadingTranscript ? 'true' : 'false'}
                    data-youtube-completed={link.link_type === 'youtube' && link.transcript ? 'true' : 'false'}
                  >
                    {link.link_type === 'youtube' && link.thumbnail ? (
                      <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0 mr-3 bg-paper">
                        <img src={link.thumbnail} alt={link.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 mr-3 bg-paper flex items-center justify-center">
                        {link.link_type === 'youtube' ? (
                          <Youtube className="w-5 h-5 text-red-500" />
                        ) : (
                          <LinkIcon className="w-5 h-5 text-accent-primary" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="font-serif text-ink-dark text-sm truncate" title={link.title}>
                          {link.title}
                        </p>
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBrainDumpLink(link.id)}
                          className="p-1.5 text-ink-faded hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                          disabled={isSaving || isAnalyzing}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="font-serif text-ink-faded text-xs truncate mb-1" title={link.url}>
                        {link.url}
                      </p>
                      
                      {/* Transcript status for YouTube links */}
                      {link.link_type === 'youtube' && (
                        <div className="mt-1">
                          {link.isLoadingTranscript ? (
                            <p className="text-xs text-amber-600 flex items-center">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Extracting transcript...
                            </p>
                          ) : link.transcriptError ? (
                            <p className="text-xs text-red-600 flex items-center" title={link.transcriptError}>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {link.transcriptError.slice(0, 50)}{link.transcriptError.length > 50 ? '...' : ''}
                            </p>
                          ) : link.transcript ? (
                            <div>
                              <div 
                                className="text-xs text-green-600 flex items-center cursor-pointer hover:underline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Toggle transcript preview
                                  const transcriptPreview = document.getElementById(`transcript-preview-${link.id}`);
                                  if (transcriptPreview) {
                                    const isHidden = transcriptPreview.classList.contains('hidden');
                                    if (isHidden) {
                                      transcriptPreview.classList.remove('hidden');
                                    } else {
                                      transcriptPreview.classList.add('hidden');
                                    }
                                  }
                                }}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Transcript extracted ({(link.transcript.length / 1000).toFixed(1)}k characters)
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </div>
                              <div 
                                id={`transcript-preview-${link.id}`} 
                                className="hidden mt-2 p-2 bg-cream/50 border border-accent-tertiary/20 rounded-sm text-xs text-ink-dark max-h-40 overflow-y-auto break-words font-serif whitespace-pre-line"
                              >
                                {link.transcript.slice(0, 1000)}
                                {link.transcript.length > 1000 && (
                                  <>
                                    <span>...</span>
                                    <button 
                                      className="ml-1 text-accent-primary hover:underline"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        
                                        // Create and show a modal with the full transcript
                                        const modalOverlay = document.createElement('div');
                                        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
                                        modalOverlay.id = 'transcript-modal-overlay';
                                        
                                        const modalContent = document.createElement('div');
                                        modalContent.className = 'bg-paper rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[80vh] flex flex-col';
                                        
                                        const modalHeader = document.createElement('div');
                                        modalHeader.className = 'flex justify-between items-center mb-4';
                                        
                                        const modalTitle = document.createElement('h3');
                                        modalTitle.className = 'font-display text-lg text-ink-dark';
                                        modalTitle.textContent = 'YouTube Transcript';
                                        
                                        const closeButton = document.createElement('button');
                                        closeButton.className = 'text-ink-faded hover:text-red-500 transition-colors';
                                        closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                                        closeButton.onclick = () => {
                                          document.body.removeChild(modalOverlay);
                                        };
                                        
                                        modalHeader.appendChild(modalTitle);
                                        modalHeader.appendChild(closeButton);
                                        
                                        const transcriptText = document.createElement('div');
                                        transcriptText.className = 'overflow-y-auto flex-1 font-serif text-sm whitespace-pre-line text-ink-dark bg-cream/30 p-4 rounded';
                                        transcriptText.textContent = link.transcript || '';
                                        
                                        modalContent.appendChild(modalHeader);
                                        modalContent.appendChild(transcriptText);
                                        
                                        modalOverlay.appendChild(modalContent);
                                        document.body.appendChild(modalOverlay);
                                        
                                        // Add click outside to close
                                        modalOverlay.addEventListener('click', (e) => {
                                          if (e.target === modalOverlay) {
                                            document.body.removeChild(modalOverlay);
                                          }
                                        });
                                      }}
                                    >
                                      View full transcript
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-ink-faded">No transcript available</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-8">
        <Button
          variant="workflowOutline"
          className="gap-2"
          onClick={() => setCurrentStep('creator')}
        >
          Back to Project Info
        </Button>
        
        {/* Show analyze button if we have content */}
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !isContentValid()}
          variant="workflow"
          className="gap-2 text-white"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze Content
            </>
          )}
        </Button>
      </div>
      
      {/* Save for later dialog */}
      <Dialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
      >
        <DialogContent className="bg-paper rounded-xl p-6 max-w-md w-full shadow-textera border border-accent-tertiary/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-ink-dark">Save Brain Dump for Later</DialogTitle>
            <DialogDescription className="text-ink-light font-serif">
              Save this brain dump to use later in other projects or review independently.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="save-title" className="font-medium text-ink-dark">Title</Label>
              <Input
                id="save-title"
                placeholder="Enter a title for your brain dump"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                className="font-serif"
                disabled={isSavingForLater}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="save-description" className="font-medium text-ink-dark">Description (Optional)</Label>
              <Textarea
                id="save-description"
                placeholder="Add a description to help you find this later"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                className="font-serif"
                disabled={isSavingForLater}
              />
            </div>
            
            <div className="text-sm text-ink-light font-serif">
              <p className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                <span>{content.trim().split(/\s+/).length.toLocaleString()} words</span>
              </p>
              {brainDumpFiles.length > 0 && (
                <p className="flex items-center gap-1 mt-1">
                  <File className="h-3.5 w-3.5" />
                  <span>{brainDumpFiles.length} files</span>
                </p>
              )}
              {brainDumpLinks.length > 0 && (
                <p className="flex items-center gap-1 mt-1">
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>{brainDumpLinks.length} links</span>
                </p>
              )}
            </div>
          </div>
          
          {savingSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center text-emerald-700 mb-4">
              <div className="bg-emerald-100 rounded-full p-1 mr-2">
                <Check className="h-4 w-4" />
              </div>
              <p className="font-serif text-sm">Brain dump saved successfully!</p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setSaveDialogOpen(false)}
              disabled={isSavingForLater}
              className="font-serif"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveForLater}
              disabled={isSavingForLater || !saveTitle.trim()}
              variant="workflow"
              className="gap-2 text-white font-serif"
            >
              {isSavingForLater ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Brain Dump
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrainDumpStep;