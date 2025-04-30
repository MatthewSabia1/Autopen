import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  Save
} from "lucide-react";
import { useBrainDumps, SavedBrainDump } from "@/hooks/useBrainDumps";
import { isYoutubeUrl, extractYoutubeVideoId, fetchYoutubeTranscript, youtubeUrlRegex } from "@/lib/youtubeTranscript";
import { generateStructuredDocument } from '@/lib/brainDumpAnalyzer';
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/components/ui/use-toast";

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
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { 
    getBrainDumpById, 
    updateBrainDump, 
    saveBrainDumpFromWorkflow,
    analyzeBrainDumpContent,
    getOrCreateBrainDumpForProject
  } = useBrainDumps();
  const { toast } = useToast();
  
  // State
  const [brainDumpId, setBrainDumpId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isMarkdownEditMode, setIsMarkdownEditMode] = useState<boolean>(false);
  const [editableMarkdown, setEditableMarkdown] = useState<string>('');
  const [brainDumpTitle, setBrainDumpTitle] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  
  // Content state
  const [content, setContent] = useState<string>('');
  
  // Files & links
  const [files, setFiles] = useState<FileItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [isYouTube, setIsYouTube] = useState<boolean>(false);
  const [isLoadingLink, setIsLoadingLink] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Analyze
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<string | null>(null);
  const [analyzedContent, setAnalyzedContent] = useState<any | null>(null);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [isInvalidLink, setIsInvalidLink] = useState<boolean>(false);

  // Added state for YouTube link processing
  const [youtubeProcessingState, setYoutubeProcessingState] = useState<{ total: number; loading: number; completed: number }>({ total: 0, loading: 0, completed: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Track active transcript fetching operations to prevent race conditions
  const activeTranscriptFetches = useRef<Set<string>>(new Set());

  // Load brain dump data based on URL context
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingLink(true);
        setError(null);
        
        let brainDump: SavedBrainDump | null = null; // Use correct type
        // Declare editParam here so it's in scope for all paths
        const editParam = new URLSearchParams(location.search).get('edit');

        if (location.pathname.startsWith('/workflow/')) {
          // --- Workflow Context --- 
          // Default to edit mode when loading via workflow
          setIsEditMode(true); 
          const projectId = params.id;
          if (!projectId) {
            throw new Error("Workflow/Project ID missing from URL.");
          }
          console.log(`Loading in workflow context for Project ID: ${projectId}`);
          // Attempt to get or create the brain dump associated with the project
          brainDump = await getOrCreateBrainDumpForProject(projectId);
          if (!brainDump) {
             throw new Error(`Failed to get or create brain dump for project ${projectId}.`);
          }
          console.log(`Loaded/Created BrainDump ID: ${brainDump.id} for Project ${projectId}`);

        } else if (location.pathname.startsWith('/brain-dump/')) {
          // --- Direct Brain Dump Load --- 
          setIsEditMode(editParam === 'true');

          const directBrainDumpId = params.id;
          if (!directBrainDumpId) {
            throw new Error("Brain Dump ID missing from URL.");
          }
          console.log(`Loading brain dump directly: ${directBrainDumpId}`);
          brainDump = await getBrainDumpById(directBrainDumpId);
        } else {
          // --- New Standalone Brain Dump --- 
          // Not in a known context, likely creating new standalone
          console.log('Not in workflow or direct brain dump context. Ready for new input.');
          setIsEditMode(true); // Default to edit for new standalone
          setIsLoadingLink(false);
          return; // Exit early, nothing to load
        }

        if (!brainDump) {
          setError('Brain dump not found');
          setIsLoadingLink(false);
          return;
        }
        
        // --- Set state based on loaded/created brainDump --- 
        setBrainDumpId(brainDump.id); // Set the ID state
        setBrainDumpTitle(brainDump.title || 'Brain Dump Analysis');
        
        // If there's existing content, set it directly as editable markdown
        // Prioritize structuredDocument from metadata if available
        if (brainDump.metadata && brainDump.metadata.structuredDocument) {
          setEditableMarkdown(brainDump.metadata.structuredDocument);
        } else if (brainDump.content) {
          setEditableMarkdown(brainDump.content);
        }
        
        if (brainDump.metadata) {
          // Load analyzed content if available
          if (brainDump.metadata.analyzedContent) {
            setAnalyzedContent(brainDump.metadata.analyzedContent);
          }
          
          // Use type assertion for metadata access
          const metadata = brainDump.metadata as any;

          if (isEditMode) { // Use isEditMode state which is set based on editParam
            // Populate the form with original input data if in edit mode
            setContent(metadata?.originalContent?.mainContent || brainDump.content || '');
            
            if (metadata?.files && Array.isArray(metadata.files)) {
              setFiles(metadata.files);
            }
            
            if (metadata?.links && Array.isArray(metadata.links)) {
              setLinks(metadata.links);
            }
          } else {
            // For view mode, we still need the content in case user switches to edit mode
            setContent(metadata?.originalContent?.mainContent || brainDump.content || '');
            if (metadata?.files && Array.isArray(metadata.files)) {
              setFiles(metadata.files);
            }
            if (metadata?.links && Array.isArray(metadata.links)) {
              setLinks(metadata.links);
            }
          }
        } else {
          // Fallback to basic content if no metadata is available
          setContent(brainDump.content || '');
        }
        
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load brain dump');
      } finally {
        setIsLoadingLink(false);
      }
    };
    
    loadData();
  }, [params.id, location.pathname, location.search]);

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
      
      // For text-based files, read the content to scan for YouTube URLs
      newFiles.forEach(fileItem => {
        const file = fileItem.file;
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
      });
      
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

  const scanContentForYouTubeLinks = async (content: string) => {
    if (!content || typeof content !== 'string') return;
    const matches = [...content.matchAll(youtubeUrlRegex)];
    if (matches.length === 0) return;

    const newLinksFound: LinkItem[] = [];
    const processedVideoIds = new Set<string>();

    for (const match of matches) {
      const fullUrl = match[0];
      const videoId = extractYoutubeVideoId(fullUrl);
      if (!videoId || processedVideoIds.has(videoId)) continue;
      if (activeTranscriptFetches.current.has(videoId)) continue;
      
      const existingLink = links.find(link => 
        link.type === 'youtube' && (
          link.url.includes(videoId) || 
          (link.url.includes('youtube') && extractYoutubeVideoId(link.url) === videoId)
        )
      );
      if (existingLink) continue;

      processedVideoIds.add(videoId);
      
      try {
        const title = `YouTube Video: ${videoId}`;
        const newLinkId = generateUniqueId();
        const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        
        const newLink: LinkItem = {
          id: newLinkId,
          url: fullUrl,
          title: title,
          type: 'youtube',
          thumbnail: thumbnail,
          isLoadingTranscript: true
        };
        newLinksFound.push(newLink);
      } catch (err) {
        console.error("Error preparing YouTube link object:", err);
      }
    }

    if (newLinksFound.length > 0) {
      // Use toast notification
      toast({ 
        title: "YouTube URLs Detected", 
        description: `Found ${newLinksFound.length} new YouTube URL(s). Fetching transcripts...`, 
        variant: "default"
      });
      
      // Add new links to state and start fetching transcripts
      setLinks(prev => [...prev, ...newLinksFound]);
      newLinksFound.forEach(link => fetchTranscriptForLink(link.id, extractYoutubeVideoId(link.url)!));
    }
  };

  // Separate function to fetch transcript for a specific link ID and video ID
  const fetchTranscriptForLink = async (linkId: string, videoId: string) => {
    if (activeTranscriptFetches.current.has(videoId)) {
      // console.log(`Skipping fetch for ${videoId}, already in progress`);
      return;
    }
    activeTranscriptFetches.current.add(videoId);

    // Update overall processing state
    setYoutubeProcessingState(prev => ({ ...prev, total: prev.total + 1, loading: prev.loading + 1 }));

    let hasCompleted = false;
    const timeoutId = setTimeout(() => {
      if (!hasCompleted) {
        console.warn(`Transcript fetch timeout for video ${videoId}`);
        setLinks(prev => prev.map(link => link.id === linkId ? { ...link, isLoadingTranscript: false, transcriptError: "Transcript fetch timed out." } : link));
        activeTranscriptFetches.current.delete(videoId);
        setYoutubeProcessingState(prev => ({ ...prev, loading: Math.max(0, prev.loading - 1) })); // Decrement loading, not completed
      }
    }, 30000); // 30 second timeout

    try {
      const transcriptResult = await fetchYoutubeTranscript(videoId);
      hasCompleted = true;
      clearTimeout(timeoutId);

      setLinks(prev => prev.map(link => {
        if (link.id === linkId) {
          if (transcriptResult.error) {
            return { ...link, isLoadingTranscript: false, transcriptError: transcriptResult.error };
          } else if (transcriptResult.transcript) {
            return { ...link, isLoadingTranscript: false, transcript: transcriptResult.transcript };
          }
        }
        return link;
      }));
      // Update counts after successful fetch or fetch returning an error message
      setYoutubeProcessingState(prev => ({ ...prev, loading: Math.max(0, prev.loading - 1), completed: prev.completed + 1 }));

    } catch (fetchErr: any) {
      hasCompleted = true;
      clearTimeout(timeoutId);
      console.error("Error fetching transcript:", fetchErr);
      setLinks(prev => prev.map(link => link.id === linkId ? { ...link, isLoadingTranscript: false, transcriptError: "Failed to fetch transcript: " + (fetchErr.message || "Unknown error") } : link));
      setYoutubeProcessingState(prev => ({ ...prev, loading: Math.max(0, prev.loading - 1) })); // Decrement loading on error, not completed
    } finally {
      activeTranscriptFetches.current.delete(videoId);
    }
  };

  // Scan for YouTube links when content changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      scanContentForYouTubeLinks(content);
    }, 3000); // Delay remains
    return () => clearTimeout(timer);
  }, [content]); // Removed links/setLinks dependency, scan should only depend on content

  const handleLinkAdd = () => {
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
    
    // Create the new link item
    const newLinkId = generateUniqueId();
    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : undefined;
    
    const newLink: LinkItem = {
      id: newLinkId,
      url: validatedUrl,
      title: youtubeUrl 
        ? `YouTube Video: ${videoId || 'Unknown'}`
        : `Web Page: ${new URL(validatedUrl).hostname}`,
      type: youtubeUrl ? 'youtube' : 'webpage',
      thumbnail: thumbnail
    };
    
    // Add the link to state
    setLinks(prev => [...prev, newLink]);
    
    if (youtubeUrl && videoId) {
      if (activeTranscriptFetches.current.has(videoId)) {
        // console.log(`Skipping duplicate fetch for video ${videoId}`);
      } else {
        fetchTranscriptForLink(newLinkId, videoId);
      }
    }
    
    // Reset form
    setLinkUrl('');
    setIsYouTube(false);
  };

  const removeFile = (id: string) => {
    // Don't allow removal in read-only mode
    if (brainDumpId && !isEditMode) return;
    
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
    // Don't allow removal in read-only mode
    if (brainDumpId && !isEditMode) return;
    
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAnalyzeContent = async () => {
    // --- Validation ---
    if (!content.trim() && files.length === 0 && links.length === 0) {
      setError('Please add some content to analyze. You can paste text, upload files, or add links.');
      return;
    }
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount < 50 && files.length === 0 && links.length === 0) {
      setError('Please add more content to analyze. We need at least 50 words to generate meaningful ideas.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setAnalysisProgress(null); // Reset progress

    let currentBrainDumpTitle = brainDumpTitle;

    try {
      // useEffect should guarantee brainDumpId is set by now
      if (!brainDumpId) {
        throw new Error("BrainDump ID is not set. Cannot proceed with analysis.");
      }

      // --- Step 1: Save/Update Content First ---
      setAnalysisProgress('Saving content...');
      
      // Prepare data for saving
      const saveData = {
        title: currentBrainDumpTitle || null,
        content: content, 
        metadata: {
          originalContent: { mainContent: content, timestamp: new Date().toISOString() },
          files: files,
          links: links,
          updatedAt: new Date().toISOString(),
          wordCount: content.trim().split(/\s+/).length,
          fileCount: files.length,
          linkCount: links.length
        }
      };

      // Always perform an UPDATE using the state ID
      const updateResult = await updateBrainDump(brainDumpId, saveData);
      if (!updateResult) { 
         throw new Error("Failed to update brain dump before analysis.");
      }
      console.log("Brain dump updated before analysis:", brainDumpId);

      // --- Step 2: Analyze Content ---
      if (!brainDumpId) { // Re-check just in case
          // Safety check - should not happen if save was successful
          throw new Error("Brain Dump ID is missing after save attempt.");
      }
      
      setAnalysisProgress('Analyzing content...');
      const analysisResult = await analyzeBrainDumpContent(
        brainDumpId, // Pass the state ID
        [content], // Wrap content string in an array
        files, // Pass files array
        // Reinstate progress callback as 4th argument
        (message) => { 
          setAnalysisProgress(message);
        }
      );
      if (!analysisResult) throw new Error("Analysis failed to return results.");
      
      setAnalyzedContent(analysisResult);
      const structuredDoc = generateCustomStructuredDocument(analysisResult);
      setEditableMarkdown(structuredDoc);
      
      // --- Step 3: Auto-Save Analysis Results (Now effectively an update) ---
      // This will update the record with the analysis results metadata
      setAnalysisProgress('Saving analysis results...');
      await autoSaveAnalysisResults(analysisResult, structuredDoc, brainDumpId, currentBrainDumpTitle);
      
      setIsEditMode(false);
      setIsMarkdownEditMode(false);
      
    } catch (err: any) {
      console.error("Analysis Process Error:", err); // Keep detailed log
      setError(err.message || "An unexpected error occurred during the process.");
      // Clear potentially misleading analysis state if error occurred
      // setAnalyzedContent(null);
      // setEditableMarkdown('');
    } finally {
      setIsProcessing(false);
      setAnalysisProgress(null);
    }
  };
  
  /**
   * Automatically save analysis results without user interaction
   */
  const autoSaveAnalysisResults = async (analysisResult: any, structuredDocument: string, id: string | null, title: string | null) => {
    try {
      // Generate the structured document for storage without title and stats
      const formattedContent = generateCustomStructuredDocument(analysisResult);
      
      // Create metadata object with original input preserved
      const metadata = {
        wordCount: content.trim().split(/\s+/).length,
        fileCount: files.length,
        linkCount: links.length,
        summary: analysisResult.summary || content.substring(0, 150) + (content.length > 150 ? '...' : ''),
        files,
        links,
        analyzedContent: analysisResult,
        structuredDocument: formattedContent,
        keywords: analysisResult.keywords || [],
        // Save document statistics separately in metadata
        documentStats: analysisResult.stats || {
          wordCount: content.trim().split(/\s+/).length,
          sentenceCount: content.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
          readingTimeMinutes: Math.ceil(content.trim().split(/\s+/).length / 225),
          sectionCount: analysisResult.sections?.length || 1,
          topicCount: analysisResult.topics?.length || 1,
          fileCount: files.length,
          linkCount: links.length
        },
        // Save the original input content to preserve it
        originalContent: {
          mainContent: content,
          timestamp: new Date().toISOString()
        },
        autoSaved: true,
        savedAt: new Date().toISOString()
      };
      
      let result;
      
      if (id) {
        // Update existing brain dump
        result = await updateBrainDump(id, {
          title: title || 'Brain Dump Analysis', // Use passed title
          content: formattedContent, // Store the formatted output as the main content
          metadata
        });
      } else {
        // Create new brain dump with auto-generated title
        result = await saveBrainDumpFromWorkflow(
          null, // Pass null to trigger auto-generation of title
          formattedContent, // Store the formatted output as the main content
          analysisResult,
          files,
          links
        );
      }
      
      if (result) {
        if (!id) {
          setBrainDumpId(result.id || null);
          if (result.title) setBrainDumpTitle(result.title);
           // Update URL without full page reload if new dump was created
          if (result.id) navigate(`/brain-dump/${result.id}`, { replace: true });
        }
        
        setError(null);
        
        // Use toast for success message
        toast({ 
          title: "Analysis Saved", 
          description: "Results saved successfully.", 
          variant: "default" 
        });
      } else {
        console.error("Failed to save brain dump automatically"); // Keep error log
        // Throw an error to be caught below?
        throw new Error("Save operation did not return a result.");
      }
    } catch (err: any) {
      console.error('Error auto-saving analysis results:', err); // Keep error log
      // Use toast for error
      toast({ 
        title: "Auto-Save Error", 
        description: err.message || "Failed to automatically save analysis results.", 
        variant: "destructive" 
      });
    }
  };

  // Clean up active transcript fetches on component unmount
  useEffect(() => {
    return () => {
      // Clean up object URLs to prevent memory leaks
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      
      // Clear the active transcript fetches set
      activeTranscriptFetches.current.clear();
    };
  }, [files]);

  /**
   * Generates a custom structured document without the title, document statistics, and footer
   * @param analysisResult The analysis result to generate document from
   * @returns A modified markdown document string
   */
  const generateCustomStructuredDocument = (analysisResult: any): string => {
    if (!analysisResult) return '';
    
    // Generate the complete structured document first
    const fullDocument = generateStructuredDocument(analysisResult);
    
    // Split the document into lines
    const lines = fullDocument.split('\n');
    
    // Find the sections to remove
    let documentStatsSectionStartIndex = -1;
    let documentStatsSectionEndIndex = -1;
    let footerStartIndex = -1;
    
    // Process lines to find sections to remove
    const resultLines = [];
    let skipLine = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip the title (first h1)
      if (line.startsWith('# ') && i === 0) {
        skipLine = true;
        continue;
      }
      
      // Detect Document Statistics section
      if (line.startsWith('## Document Statistics')) {
        documentStatsSectionStartIndex = i;
        skipLine = true;
        continue;
      }
      
      // If we're in the Document Statistics section, check if we've reached the next section
      if (documentStatsSectionStartIndex !== -1 && documentStatsSectionEndIndex === -1) {
        if (line.startsWith('## ')) {
          documentStatsSectionEndIndex = i;
          skipLine = false;
        } else {
          skipLine = true;
          continue;
        }
      }
      
      // Detect footer (horizontal rule followed by timestamp and word count)
      if (line.startsWith('---')) {
        footerStartIndex = i;
        skipLine = true;
        continue;
      }
      
      // Skip any lines after the footer separator
      if (footerStartIndex !== -1) {
        skipLine = true;
        continue;
      }
      
      if (!skipLine) {
        resultLines.push(line);
      }
    }
    
    return resultLines.join('\n');
  };

  // Determine the project ID from URL params if available
  const projectIdFromUrl = location.pathname.startsWith('/workflow/') ? params.id : null;

  if (isLoadingLink) {
    return (
      <DashboardLayout activeTab="Brain Dump">
        <div className="flex h-[60vh] w-full items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 animate-spin h-16 w-16 rounded-full border-4 border-accent-primary/10 border-t-accent-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="h-7 w-7 text-accent-primary/70" />
              </div>
            </div>
            <p className="text-ink-light font-serif text-base mt-4">Loading brain dump...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab={brainDumpId && !isEditMode ? "Brain Dumps" : "Brain Dump"}>
      {/* YouTube Processing Indicator - using state now */}
      {youtubeProcessingState.loading > 0 && (
        <div className="fixed bottom-4 right-4 z-50 bg-accent-primary/95 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in flex items-center gap-3">
          <div className="relative h-6 w-6">
             <Youtube className="h-6 w-6 z-10 relative" />
             <div className="absolute inset-0 bg-accent-primary rounded-full animate-ping opacity-30"></div>
          </div>
          <div className="text-sm">
            <p className="font-medium">Processing YouTube Transcripts</p>
            <p className="text-xs opacity-80">
              {youtubeProcessingState.completed} of {youtubeProcessingState.total} completed ({youtubeProcessingState.loading} loading)
            </p>
          </div>
          <div className="w-20 h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${youtubeProcessingState.total > 0 ? (youtubeProcessingState.completed / youtubeProcessingState.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            {brainDumpId && isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={brainDumpTitle}
                  onChange={(e) => setBrainDumpTitle(e.target.value)}
                  className="text-xl font-display text-ink-dark w-full max-w-md"
                  autoFocus
                />
                <Button 
                  size="sm" 
                  onClick={() => {
                    setIsEditingTitle(false);
                    // Save the title change
                    if (brainDumpId) {
                      updateBrainDump(brainDumpId, { title: brainDumpTitle })
                        .catch(err => {
                          console.error('Error updating title:', err);
                          setError('Failed to update title');
                        });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsEditingTitle(false)}
                  className="border-red-300 hover:bg-red-50 text-red-600"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <h1 
                className={`text-2xl font-display text-ink-dark ${brainDumpId ? 'group flex items-center gap-2' : ''}`}
              >
                {brainDumpId ? (
                  <>
                    <span>{brainDumpTitle}</span>
                    <button 
                      onClick={() => setIsEditingTitle(true)} 
                      className="opacity-0 group-hover:opacity-100 text-accent-tertiary hover:text-accent-primary transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                    </button>
                  </>
                ) : 'New Brain Dump'}
              </h1>
            )}
            <p className="text-ink-light mt-1 font-serif text-[15px]">
              {brainDumpId 
                ? (isEditMode 
                    ? 'Edit your brain dump content and analyze it again'
                    : isMarkdownEditMode
                      ? 'Edit the generated markdown content directly'
                      : 'View the analysis results of your saved brain dump') 
                : 'Upload your thoughts, notes, or content in any format. Autopen will analyze and organize it into structured e-book ideas.'}
            </p>
          </div>
          
          {brainDumpId && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/brain-dumps')}
                className="border-accent-tertiary/20 hover:bg-accent-tertiary/5 text-ink-dark"
              >
                Back to List
              </Button>
              
              {!isEditMode && !isMarkdownEditMode ? (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      // Enter markdown edit mode
                      setIsMarkdownEditMode(true);
                      // Use either existing editable markdown or generate from analyzedContent
                      if (!editableMarkdown && analyzedContent) {
                        setEditableMarkdown(generateCustomStructuredDocument(analyzedContent));
                      }
                    }}
                    className="bg-accent-tertiary/20 hover:bg-accent-tertiary/30 text-ink-dark"
                  >
                    Edit Content
                  </Button>
                  <Button
                    onClick={() => setIsEditMode(true)}
                    className="bg-accent-primary hover:bg-accent-primary/90 text-white"
                  >
                    Add Data
                  </Button>
                </div>
              ) : isEditMode ? (
                <Button
                  onClick={() => setIsEditMode(false)}
                  className="bg-accent-tertiary/20 hover:bg-accent-tertiary/30 text-ink-dark"
                >
                  View Results
                </Button>
              ) : (
                <Button
                  onClick={() => setIsMarkdownEditMode(false)}
                  className="bg-accent-tertiary/20 hover:bg-accent-tertiary/30 text-ink-dark"
                >
                  View Results
                </Button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex items-start text-red-700">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="font-serif text-[14px]">{error}</p>
          </div>
        )}

        {/* Only show input forms if in edit mode or creating a new brain dump */}
        {(!brainDumpId || isEditMode) && (
          <>
            <div className="brain-dump-container">
              <div className="pb-4 border-b border-accent-tertiary/30">
                <h2 className="font-display text-lg text-ink-dark">
                  Content Input
                </h2>
              </div>
              <div className="pt-4">
                <Tabs defaultValue="paste" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border border-accent-tertiary/40">
                    <TabsTrigger 
                      value="paste" 
                      className="data-[state=active]:bg-white data-[state=active]:text-accent-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-primary flex items-center gap-2 text-ink-light font-serif text-[14px]"
                    >
                      <FileText className="h-4 w-4" />
                      Paste Text
                    </TabsTrigger>
                    <TabsTrigger 
                      value="upload" 
                      className="data-[state=active]:bg-white data-[state=active]:text-accent-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-primary flex items-center gap-2 text-ink-light font-serif text-[14px]"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Files
                    </TabsTrigger>
                    <TabsTrigger 
                      value="link" 
                      className="data-[state=active]:bg-white data-[state=active]:text-accent-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-primary flex items-center gap-2 text-ink-light font-serif text-[14px]"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Add Link
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="paste" className="space-y-4">
                    <div className="space-y-2 form-field">
                      <div className="flex justify-between">
                        <Label htmlFor="content" className="form-label text-[14px]">Content</Label>
                        <span className="text-xs text-ink-faded font-serif">
                          {content.length} characters
                        </span>
                      </div>
                      <Textarea
                        id="content"
                        placeholder="Paste your unorganized notes, ideas, or content here..."
                        className="brain-dump-textarea min-h-[300px] text-[14px]"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onDrop={handleTextAreaDrop}
                        onDragOver={(e) => e.preventDefault()}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4">
                    <div 
                      className="border-2 border-dashed border-accent-tertiary/40 rounded p-12 text-center"
                      onDrop={handleTextDrop}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <Upload className="h-12 w-12 mx-auto text-ink-faded mb-4" />
                      <h3 className="text-lg font-medium text-ink-dark mb-2 font-display">
                        Drag & drop files here
                      </h3>
                      <p className="text-[14px] text-ink-light mb-4 font-serif">
                        Support for .docx, .pdf, .txt, .md, and more
                      </p>
                      <div className="flex justify-center space-x-3">
                        <Button 
                          variant="outline" 
                          className="text-[14px]"
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
                          <Button
                            type="submit"
                            className="bg-accent-primary text-white rounded-r-md"
                            onClick={handleLinkAdd}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex justify-center mt-6">
                <Button 
                  onClick={handleAnalyzeContent}
                  disabled={isProcessing}
                  className="bg-accent-primary hover:bg-accent-secondary text-white shadow-blue-sm text-[15px]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Analyze Content <Sparkles className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
              
              {/* Display added content (files and links) */}
              {(files.length > 0 || links.length > 0) && (
                <div className="border border-accent-tertiary/20 rounded-lg bg-paper shadow-textera p-6 space-y-4 mt-6">
                  <h3 className="font-serif font-semibold text-ink-dark">Added Content</h3>
                  
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
                              disabled={isProcessing}
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
                            data-youtube-link={link.type === 'youtube' ? 'true' : 'false'}
                            data-youtube-loading={link.type === 'youtube' && link.isLoadingTranscript ? 'true' : 'false'}
                            data-youtube-completed={link.type === 'youtube' && link.transcript ? 'true' : 'false'}
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
                                  disabled={isProcessing}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="font-serif text-ink-faded text-xs truncate mb-1" title={link.url}>
                                {link.url}
                              </p>
                              
                              {/* Transcript status for YouTube links */}
                              {link.type === 'youtube' && (
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
                                        className="hidden mt-2 p-2 bg-paper/50 border border-accent-tertiary/20 rounded-sm text-xs text-ink-dark max-h-40 overflow-y-auto break-words font-serif whitespace-pre-line"
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
            </div>
          </>
        )}
        
        {/* Analysis Progress */}
        {isProcessing && analysisProgress && (
          <div className="mt-6 p-4 bg-accent-primary/10 border border-accent-primary/20 rounded">
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 mr-3 text-accent-primary animate-spin" />
              <div>
                <h4 className="font-serif font-medium text-accent-primary">Analysis in Progress</h4>
                <p className="font-serif text-sm text-ink-dark">{analysisProgress}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Analysis Results */}
        {analyzedContent && !isProcessing && (
          <div className="mt-8 space-y-6">
            <Card className="border-accent-primary/20 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="font-display text-lg text-ink-dark">
                  Analysis Results
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMarkdownEditMode(true)}
                    disabled={isMarkdownEditMode}
                    className="border-accent-tertiary/40 hover:bg-accent-tertiary/5 text-ink-dark text-xs"
                  >
                    {isMarkdownEditMode ? 'Editing...' : 'Edit Markdown'}
                  </Button>
                  {/* === ADDED TRANSITION BUTTON === */} 
                  {projectIdFromUrl && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/ebook-workflow/${projectIdFromUrl}`)} // Navigate to ebook workflow
                      className="bg-accent-primary hover:bg-accent-primary/90 text-white text-xs"
                      disabled={isMarkdownEditMode} // Disable if editing markdown
                    >
                      Create eBook Product <ArrowRight className="w-3 h-3 ml-1.5" />
                    </Button>
                  )}
                  {/* ============================= */} 
                </div>
              </CardHeader>
              <CardContent>
                {isMarkdownEditMode ? (
                  <div className="space-y-4">
                    <Textarea 
                      value={editableMarkdown}
                      onChange={(e) => setEditableMarkdown(e.target.value)}
                      rows={25}
                      className="font-mono text-sm border-accent-tertiary/40 focus:border-accent-primary"
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          // Optionally reset changes or just exit edit mode
                          setIsMarkdownEditMode(false);
                          // Reload original markdown if needed
                          // setEditableMarkdown(generateCustomStructuredDocument(analyzedContent)); 
                        }}
                        className="text-ink-light hover:text-ink-dark"
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={async () => {
                          if (!brainDumpId) return;
                          
                          try {
                            setIsProcessing(true);
                            setAnalysisProgress('Saving edited content...');
                            
                            // Update the brain dump with edited markdown
                            const brainDump = await getBrainDumpById(brainDumpId);
                            
                            if (!brainDump) {
                              throw new Error('Failed to load brain dump for updating');
                            }
                            
                            await updateBrainDump(brainDumpId, {
                              content: editableMarkdown, // Save edited markdown as main content
                              title: brainDumpTitle,
                              // Update metadata as well if necessary
                              metadata: { 
                                ...brainDump.metadata, // Preserve existing metadata
                                structuredDocument: editableMarkdown, 
                                updatedAt: new Date().toISOString()
                              }
                            });
                            
                            setIsMarkdownEditMode(false);
                            toast({ title: "Content Saved", description: "Edited markdown saved successfully.", variant: "default" });
                          } catch (err: any) {
                            console.error("Error saving edited markdown:", err);
                            setError(err.message || "Failed to save edited content.");
                          } finally {
                            setIsProcessing(false);
                            setAnalysisProgress(null);
                          }
                        }}
                        className="bg-accent-primary hover:bg-accent-primary/90 text-white"
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />} 
                        Save Edited Content
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none font-serif text-ink-dark">
                    <ReactMarkdown>{editableMarkdown}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BrainDump;