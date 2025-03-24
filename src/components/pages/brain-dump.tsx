import React, { useState, useRef } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Upload,
  Link as LinkIcon,
  Sparkles,
  ArrowRight,
  Loader2,
  X,
  File,
  Image,
  Trash2,
  AlertCircle,
  Check,
  Youtube,
  ChevronRight,
} from "lucide-react";

interface FileItem {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document';
  name: string;
  size: number;
}

interface LinkItem {
  id: string;
  url: string;
  title: string;
  type: 'youtube' | 'webpage';
  thumbnail?: string;
  transcript?: string;
  isLoadingTranscript?: boolean;
  transcriptError?: string;
}

const BrainDump = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isYouTube, setIsYouTube] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => {
        // Determine if it's an image or document
        const isImage = file.type.startsWith('image/');
        
        return {
          id: generateUniqueId(),
          file,
          preview: isImage ? URL.createObjectURL(file) : undefined,
          type: isImage ? 'image' : 'document',
          name: file.name,
          size: file.size
        } as FileItem;
      });
      
      setFiles(prev => [...prev, ...newFiles]);
      
      // Reset the input value to allow selecting the same file again
      e.target.value = '';
    }
  };

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
        
        const newFiles = droppedFiles.map(file => {
          const isImage = file.type.startsWith('image/');
          
          return {
            id: generateUniqueId(),
            file,
            preview: isImage ? URL.createObjectURL(file) : undefined,
            type: isImage ? 'image' : 'document',
            name: file.name,
            size: file.size
          } as FileItem;
        });
        
        setFiles(prev => [...prev, ...newFiles]);
      }
    }
  };

  const handleLinkAdd = () => {
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
    
    // Extract YouTube video ID if applicable
    const videoId = isYouTubeLink ? extractYoutubeVideoId(linkUrl) : null;
    
    // Create the new link item
    const newLinkId = generateUniqueId();
    const newLink: LinkItem = {
      id: newLinkId,
      url: linkUrl,
      title: isYouTubeLink 
        ? `YouTube Video: ${videoId || 'Unknown'}`
        : `Web Page: ${new URL(linkUrl).hostname}`,
      type: isYouTubeLink ? 'youtube' : 'webpage',
      thumbnail: isYouTubeLink && videoId
        ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        : undefined
    };
    
    // Add the link to state
    setLinks(prev => [...prev, newLink]);
    
    // Reset form
    setLinkUrl('');
    setIsYouTube(false);
  };

  const isYoutubeUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      return hostname.includes('youtube.com') || hostname.includes('youtu.be');
    } catch {
      return false;
    }
  };

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

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      // Revoke object URL if it exists to avoid memory leaks
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };
  
  const removeLink = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAnalyzeContent = () => {
    if (!content.trim() && files.length === 0 && links.length === 0) {
      setError('Please add some content to analyze. You can paste text, upload files, or add links.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <DashboardLayout activeTab="Brain Dump">
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-display text-ink-dark">Brain Dump</h1>
          <p className="text-ink-light mt-1 font-serif">
            Upload your thoughts, notes, or content in any format. Textera will
            analyze and organize it into structured e-book ideas.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start text-red-700">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="font-serif text-sm">{error}</p>
          </div>
        )}

        <div className="brain-dump-container">
          <div className="pb-4 border-b border-accent-tertiary/10">
            <h2 className="font-display text-lg text-ink-dark">
              Content Input
            </h2>
          </div>
          <div className="pt-4">
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
                <div className="space-y-2 form-field">
                  <Label htmlFor="content-title" className="form-label">Document Title</Label>
                  <Input
                    id="content-title"
                    placeholder="Enter a title for your content"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2 form-field">
                  <div className="flex justify-between">
                    <Label htmlFor="content" className="form-label">Content</Label>
                    <span className="text-xs text-ink-faded font-serif">
                      {content.length} characters
                    </span>
                  </div>
                  <Textarea
                    id="content"
                    placeholder="Paste your unorganized notes, ideas, or content here..."
                    className="brain-dump-textarea min-h-[300px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onDrop={handleTextDrop}
                    onDragOver={(e) => e.preventDefault()}
                  />
                </div>
                <div className="space-y-2 form-field">
                  <Label htmlFor="content-type" className="form-label">Content Type</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger id="content-type" className="form-input">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent className="bg-paper border-accent-tertiary/20">
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="notes">Meeting Notes</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
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
                <div className="space-y-2 form-field">
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
          </div>
        </div>

        {/* Display uploaded files and links */}
        {(files.length > 0 || links.length > 0) && (
          <div className="mb-6">
            <h3 className="font-serif font-semibold text-ink-dark mb-3">Added Content ({files.length + links.length})</h3>
            
            {/* Files */}
            {files.length > 0 && (
              <div className="mb-4">
                <h4 className="font-serif text-sm text-ink-light mb-2">Files & Images ({files.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {files.map(file => (
                    <div 
                      key={file.id} 
                      className="p-3 bg-cream rounded-md border border-accent-tertiary/20 flex items-center"
                    >
                      {file.type === 'image' && file.preview ? (
                        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 mr-3 bg-paper">
                          <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 mr-3 bg-paper flex items-center justify-center">
                          <FileText className="w-6 h-6 text-accent-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-ink-dark text-sm truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="font-serif text-ink-faded text-xs">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button 
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
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
            {links.length > 0 && (
              <div>
                <h4 className="font-serif text-sm text-ink-light mb-2">Links ({links.length})</h4>
                <div className="grid grid-cols-1 gap-2">
                  {links.map(link => (
                    <div 
                      key={link.id} 
                      className="p-3 bg-cream rounded-md border border-accent-tertiary/20 flex items-start"
                    >
                      {link.type === 'youtube' && link.thumbnail ? (
                        <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0 mr-3 bg-paper">
                          <img src={link.thumbnail} alt={link.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 mr-3 bg-paper flex items-center justify-center">
                          {link.type === 'youtube' ? (
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
                            onClick={() => removeLink(link.id)}
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

        <div className="mt-6 flex justify-end">
          <Button
            className="gap-2"
            onClick={handleAnalyzeContent}
            disabled={isProcessing || (!content.trim() && files.length === 0 && links.length === 0)}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze Content
              </>
            )}
          </Button>
        </div>

        <div className="brain-dump-container">
          <div className="pb-4 border-b border-accent-tertiary/10">
            <h2 className="font-display text-lg text-ink-dark">
              How It Works
            </h2>
          </div>
          <div className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-accent-primary/10 p-3 rounded-full mb-4">
                  <FileText className="h-6 w-6 text-accent-primary" />
                </div>
                <h3 className="font-display font-medium text-ink-dark mb-2">
                  1. Input Your Content
                </h3>
                <p className="text-sm text-ink-light font-serif">
                  Paste text, upload files, or provide a URL to extract content
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-accent-primary/10 p-3 rounded-full mb-4">
                  <Sparkles className="h-6 w-6 text-accent-primary" />
                </div>
                <h3 className="font-display font-medium text-ink-dark mb-2">
                  2. AI Analysis
                </h3>
                <p className="text-sm text-ink-light font-serif">
                  Our AI analyzes your content, identifies key topics, and
                  organizes information
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-accent-primary/10 p-3 rounded-full mb-4">
                  <ArrowRight className="h-6 w-6 text-accent-primary" />
                </div>
                <h3 className="font-display font-medium text-ink-dark mb-2">
                  3. Structured Output
                </h3>
                <p className="text-sm text-ink-light font-serif">
                  Receive organized, structured content ready for further
                  refinement or publication
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BrainDump;
