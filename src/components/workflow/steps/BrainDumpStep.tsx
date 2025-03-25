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
  ArrowRight
} from 'lucide-react';

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
    setCurrentStep
  } = useWorkflow();

  const [content, setContent] = useState(brainDump?.raw_content || '');
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isYouTube, setIsYouTube] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load brain dump data when available
  useEffect(() => {
    if (brainDump?.raw_content) {
      setContent(brainDump.raw_content);
    }
  }, [brainDump]);

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
   * Handles analyzing the brain dump content
   */
  const handleAnalyze = async () => {
    if (!content.trim() && brainDumpFiles.length === 0 && brainDumpLinks.length === 0) {
      setError('Please add some content to analyze. You can paste text, upload files, or add links.');
      return;
    }

    // First save any unsaved content
    if (content !== brainDump?.raw_content) {
      try {
        await saveBrainDump(content);
      } catch (err: any) {
        setError(err.message || 'Failed to save content before analysis');
        return;
      }
    }

    try {
      await analyzeBrainDump();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze content');
    }
  };

  return (
    <div className="space-y-8">
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
          variant="outline" 
          className="w-full border-accent-primary/20 text-accent-primary hover:bg-accent-primary/5 font-serif"
          onClick={handleSave}
          disabled={isSaving}
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
        >
          Back
        </Button>
        <Button
          className="gap-2 bg-accent-primary hover:bg-accent-primary/90 text-white font-serif"
          onClick={handleAnalyze}
          disabled={(!content.trim() && brainDumpFiles.length === 0 && brainDumpLinks.length === 0)}
        >
          <Sparkles className="h-4 w-4" />
          Analyze Content
        </Button>
      </div>
    </div>
  );
};

export default BrainDumpStep; 