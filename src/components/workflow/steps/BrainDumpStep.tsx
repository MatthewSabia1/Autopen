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

// Loading overlay component with fancy animations
const LoadingOverlay = ({ 
  visible, 
  message, 
  step, 
  totalSteps,
  status,
  onCancel
}: { 
  visible: boolean; 
  message: string;
  step?: number;
  totalSteps?: number;
  status?: string;
  onCancel?: () => void;
}) => {
  // Use AnimatePresence for proper exit animations
  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3 }}
            className="bg-paper rounded-xl p-8 max-w-md w-full shadow-textera border border-accent-tertiary/20"
          >
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
              
              {/* Show additional helper text for long-running operations */}
              {status === 'analyzing' && !message.includes("failed") && !message.includes("error") && (
                <p className="text-xs text-ink-faded mt-3 font-serif max-w-sm mx-auto">
                  For large content, this could take 2-3 minutes. You'll see updates here as processing continues.
                </p>
              )}
              
              {/* Optional cancel button */}
              {onCancel && (
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="mt-4 text-ink-light hover:text-ink-dark font-serif"
                >
                  Cancel
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
    
    // Check if the link is a YouTube URL
    const isYouTubeLink = isYoutubeUrl(linkUrl);
    
    // Create title based on URL type
    const title = isYouTubeLink 
      ? `YouTube Video: ${extractYoutubeVideoId(linkUrl) || 'Unknown'}`
      : `Web Page: ${new URL(linkUrl).hostname}`;
    
    try {
      await addBrainDumpLink(
        linkUrl, 
        title, 
        isYouTubeLink ? 'youtube' : 'webpage'
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
   * Validates if there is enough content to analyze
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
    
    // Set a failsafe timeout - if analysis takes more than 3 minutes, 
    // show an error and allow the user to try again
    const failsafeTimeout = setTimeout(() => {
      if (isAnalyzing) {
        setIsAnalyzing(false);
        setError('Analysis took longer than expected. Please try again with a smaller amount of content or verify your internet connection.');
      }
    }, 180000); // 3 minutes

    try {
      // Step 1: Save any unsaved content first
      if (content !== brainDump?.raw_content) {
        try {
          await saveBrainDump(content);
          // Only update UI if still in analyzing state (not cancelled)
          if (isAnalyzing) {
            setLoadingStep(2);
            setLoadingMessage('Content saved! Starting analysis...');
          } else {
            clearTimeout(failsafeTimeout);
            return; // Analysis was cancelled during save
          }
        } catch (err: any) {
          clearTimeout(failsafeTimeout);
          setError(err.message || 'Failed to save content before analysis');
          setIsAnalyzing(false);
          return;
        }
      } else {
        setLoadingStep(2);
        setLoadingMessage('Starting analysis...');
      }

      // Short delay to show the loading steps
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Only proceed if we haven't been cancelled
      if (!isAnalyzing) {
        clearTimeout(failsafeTimeout);
        return;
      }
      
      // Step 3: Analyze content
      setLoadingStep(3);
      setLoadingMessage('Analyzing your content...');
      
      try {
        // Call analyzeBrainDump without parameters - we'll handle status updates in the context
        await analyzeBrainDump();
        // If we reach here successfully, the workflow will automatically navigate to next step
        clearTimeout(failsafeTimeout);
      } catch (err: any) {
        clearTimeout(failsafeTimeout);
        // Specific error handling
        if (err.message?.includes('timeout') || err.message?.includes('time out')) {
          setError('Analysis timed out. Please try again with a smaller amount of content or fewer files.');
        } else if (err.message?.includes('permission')) {
          setError('You don\'t have permission to perform this action. Please check your account settings.');
        } else {
          setError(err.message || 'Failed to analyze content. Please try again.');
        }
        setIsAnalyzing(false);
      }
    } catch (err: any) {
      clearTimeout(failsafeTimeout);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setIsAnalyzing(false);
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
              <div className="flex justify-center space-x-3">
                <Button 
                  variant="outline" 
                  className="text-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <File className="w-4 h-4 mr-1.5" />
                  Documents
                </Button>
                <Button 
                  variant="outline" 
                  className="text-sm"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Image className="w-4 h-4 mr-1.5" />
                  Images
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
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0">
                <div className="flex flex-1">
                  <div 
                    className={`flex-shrink-0 bg-cream border border-accent-tertiary/30 rounded-l-md p-3 flex items-center cursor-pointer ${isYouTube ? 'text-red-500' : 'text-accent-primary'}`}
                    onClick={() => setIsYouTube(!isYouTube)}
                  >
                    {isYouTube ? (
                      <Youtube className="w-5 h-5" />
                    ) : (
                      <LinkIcon className="w-5 h-5" />
                    )}
                  </div>
                  <Input
                    type="url" 
                    id="content-url"
                    placeholder={isYouTube ? "https://www.youtube.com/watch?v=..." : "https://example.com"}
                    value={linkUrl}
                    onChange={(e) => {
                      setLinkUrl(e.target.value);
                      // Auto-detect if it's a YouTube link
                      if (isYoutubeUrl(e.target.value) && !isYouTube) {
                        setIsYouTube(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && linkUrl) {
                        handleLinkAdd();
                      }
                    }}
                    className="w-full border-l-0 rounded-r-md focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                </div>
                <Button
                  onClick={handleLinkAdd}
                  disabled={!linkUrl}
                  className="sm:ml-3"
                >
                  Add Link
                </Button>
              </div>
              <div className="flex mt-2 text-sm">
                <button
                  type="button"
                  onClick={() => setIsYouTube(false)}
                  className={`mr-4 py-1 font-serif ${!isYouTube ? 'text-accent-primary border-b border-accent-primary' : 'text-ink-light'}`}
                >
                  Webpage
                </button>
                <button
                  type="button"
                  onClick={() => setIsYouTube(true)}
                  className={`py-1 font-serif ${isYouTube ? 'text-red-500 border-b border-red-500' : 'text-ink-light'}`}
                >
                  YouTube Video
                </button>
              </div>
              {isYouTube && (
                <p className="mt-2 text-xs text-ink-faded font-serif">
                  YouTube videos will be processed to extract the transcript for analysis if available.
                </p>
              )}
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

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('creator')}
          className="font-serif"
          disabled={isSaving || isAnalyzing}
        >
          Back
        </Button>
        <Button
          className={cn(
            "gap-2 font-serif transition-all duration-300",
            isAnalyzing 
              ? "bg-accent-secondary text-ink-dark shadow-yellow-sm" 
              : "bg-accent-primary hover:bg-accent-secondary hover:shadow-yellow-sm text-ink-dark"
          )}
          onClick={handleAnalyze}
          disabled={
            (!content.trim() && brainDumpFiles.length === 0 && brainDumpLinks.length === 0) || 
            isSaving || 
            isAnalyzing
          }
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