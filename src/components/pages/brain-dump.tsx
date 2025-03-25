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
            Upload your thoughts, notes, or content in any format. Autopen will
            analyze and organize it into structured e-book ideas.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex items-start text-red-700">
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
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border border-accent-tertiary">
                <TabsTrigger 
                  value="paste" 
                  className="data-[state=active]:bg-white data-[state=active]:text-accent-primary flex items-center gap-2 text-ink-light font-serif"
                >
                  <FileText className="h-4 w-4" />
                  Paste Text
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="data-[state=active]:bg-white data-[state=active]:text-accent-primary flex items-center gap-2 text-ink-light font-serif"
                >
                  <Upload className="h-4 w-4" />
                  Upload Files
                </TabsTrigger>
                <TabsTrigger 
                  value="link" 
                  className="data-[state=active]:bg-white data-[state=active]:text-accent-primary flex items-center gap-2 text-ink-light font-serif"
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
                    onDrop={handleTextAreaDrop}
                    onDragOver={(e) => e.preventDefault()}
                  />
                </div>
                <div className="space-y-2 form-field">
                  <Label htmlFor="content-type" className="form-label">Content Type</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger id="content-type" className="form-input">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent className="bg-paper border-accent-tertiary">
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
                  className="border-2 border-dashed border-accent-tertiary rounded p-12 text-center"
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
                        {isYouTube ? 'YouTube' : 'Web Page'}
                      </div>
                    </div>
                    <div className="flex flex-1">
                      <Input
                        id="content-url"
                        placeholder="Enter URL"
                        className="form-input"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="mt-6">
          <Button
            variant="default"
            className="w-full"
            onClick={handleAnalyzeContent}
          >
            Analyze Content <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BrainDump;