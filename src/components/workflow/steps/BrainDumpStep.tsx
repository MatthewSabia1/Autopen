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
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

  const [content, setContent] = useState(brainDump?.raw_content || '');
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isYouTube, setIsYouTube] = useState(false);
  
  // Local loading states for better UX control
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [loadingMessage, setLoadingMessage] = useState('Processing content...');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load brain dump data when available
  useEffect(() => {
    if (brainDump?.raw_content) {
      setContent(brainDump.raw_content);
    }
  }, [brainDump]);
  
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
   * Handles text content changes
   */
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

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
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save content');
    } finally {
      setIsSaving(false);
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
    try {
      new URL(linkUrl);
    } catch (e) {
      setError('Please enter a valid URL');
      return;
    }
    
    setError(null);
    
    // Create title based on URL type
    const title = isYouTube 
      ? `YouTube Video: ${extractYoutubeVideoId(linkUrl) || 'Unknown'}`
      : `Web Page: ${new URL(linkUrl).hostname}`;
    
    try {
      await addBrainDumpLink(
        linkUrl, 
        title, 
        isYouTube ? 'youtube' : 'webpage'
      );
      
      // Reset form
      setLinkUrl('');
      setIsYouTube(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add link');
    }
  };

  /**
   * Helper function to check if URL is a YouTube URL
   */
  const isYoutubeUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      return hostname.includes('youtube.com') || hostname.includes('youtu.be');
    } catch {
      return false;
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

        <Button 
          variant={isSaving ? "secondary" : "outline"}
          className={cn(
            "w-full font-serif transition-all duration-200",
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
    </div>
  );
};

export default BrainDumpStep;