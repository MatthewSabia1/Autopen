import React, { useState, useRef } from 'react';
import { Upload, FileText, Link as LinkIcon, Youtube, ArrowRight, X, File, Image, Trash2, Loader, AlertCircle, Check } from 'lucide-react';
import { FileItem, LinkItem, AnalysisData } from '../types/BrainDumpTypes';
import { analyzeContent } from '../lib/openRouter';
import { useAnalysis } from '../contexts/AnalysisContext';
import { extractYoutubeVideoId, getFormattedTranscript, isYoutubeUrl } from '../lib/youtubeTranscript';

const BrainDump: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'link'>('paste');
  const [textContent, setTextContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isYouTube, setIsYouTube] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for multiple files, links
  const [files, setFiles] = useState<FileItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Context for analysis results
  const { setAnalysisResult, setIsAnalysisComplete } = useAnalysis();

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
          setTextContent(prevText => prevText ? `${prevText}\n\n${text}` : text);
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
  
  const fetchYoutubeTranscript = async (linkItem: LinkItem) => {
    // Update the link's state to indicate loading
    setLinks(prevLinks => 
      prevLinks.map(link => 
        link.id === linkItem.id 
          ? { ...link, isLoadingTranscript: true, transcriptError: undefined } 
          : link
      )
    );

    try {
      // Call our transcript service
      const { text, error } = await getFormattedTranscript(linkItem.url);
      
      if (error && !text) {
        // Update the link with the error but don't show it as a critical error
        // since many YouTube videos legitimately don't have transcripts
        setLinks(prevLinks => 
          prevLinks.map(link => 
            link.id === linkItem.id 
              ? { 
                  ...link, 
                  isLoadingTranscript: false, 
                  transcriptError: error,
                  // Still mark the video as usable for analysis even without transcript
                  title: link.title.includes('(No transcript)') 
                    ? link.title 
                    : `${link.title} (No transcript)`
                } 
              : link
          )
        );
        
        console.log(`No transcript available for ${linkItem.url}: ${error}`);
        return;
      }
      
      // Update the link with the transcript (even if it has an error but still has text)
      setLinks(prevLinks => 
        prevLinks.map(link => 
          link.id === linkItem.id 
            ? { 
                ...link, 
                isLoadingTranscript: false, 
                transcript: text,
                transcriptError: error, // Might be a note about mock transcript
                // Update the title to include transcript info
                title: link.title.includes('(Transcript') 
                  ? link.title 
                  : error 
                    ? `${link.title} (Transcript with limitations)`
                    : `${link.title} (Transcript available)`
              } 
            : link
        )
      );
      
      console.log(`Successfully fetched transcript for ${linkItem.url}${error ? ' with note: ' + error : ''}`);
    } catch (err) {
      console.error('Error fetching transcript:', err);
      
      // Update the link with a generic error message
      setLinks(prevLinks => 
        prevLinks.map(link => 
          link.id === linkItem.id 
            ? { 
                ...link, 
                isLoadingTranscript: false, 
                transcriptError: 'Failed to fetch transcript. Please try again later.' 
              } 
            : link
        )
      );
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
    
    setIsLoading(true);
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
    setIsLoading(false);
    
    // If it's a YouTube link, fetch the transcript
    if (isYouTubeLink && videoId) {
      setTimeout(() => fetchYoutubeTranscript(newLink), 100); // Short delay to ensure UI updates first
    }
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
  
  const handleRetryTranscript = (linkItem: LinkItem) => {
    fetchYoutubeTranscript(linkItem);
  };
  
  const handleSubmit = async () => {
    if ((!textContent && files.length === 0 && links.length === 0) || isAnalyzing) {
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    // Prepare analysis data
    const analysisData: AnalysisData = {
      files,
      links,
      text: textContent
    };
    
    try {
      // Process files to the format needed for the AI
      const processedFiles = files.map(file => ({
        file: file.file,
        type: file.type
      }));
      
      // Include transcript content in analysis
      let transcriptContent = '';
      links.forEach(link => {
        if (link.type === 'youtube' && link.transcript) {
          transcriptContent += `YouTube Video Transcript (${link.url}):\n${link.transcript}\n\n`;
        } else if (link.type === 'youtube') {
          // Include reference to videos without transcripts
          transcriptContent += `YouTube Video (${link.url}) - No transcript available\n\n`;
        }
      });
      
      // Call the AI analysis service with the combined content
      const result = await analyzeContent({
        text: transcriptContent ? `${textContent}\n\n${transcriptContent}` : textContent,
        files: processedFiles,
        links: links
      });
      
      // Set the result in context for display in ResultsDisplay component
      setAnalysisResult(result);
      setIsAnalysisComplete(true);
      
      // Handle errors from the AI
      if (result.error) {
        setError(`Analysis error: ${result.error}`);
      }
    } catch (err) {
      console.error('Error during analysis:', err);
      setError('An unexpected error occurred during analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto bg-paper rounded-lg shadow-sm border border-accent-tertiary/20 p-6 mt-6">
      <h2 className="font-display text-2xl text-ink-dark mb-4">Brain Dump</h2>
      <p className="font-serif text-ink-light mb-6">
        Upload your thoughts, notes, or content in any format. Autopen will analyze and organize it into structured e-book ideas.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start text-red-700">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <p className="font-serif text-sm">{error}</p>
        </div>
      )}

      <div className="flex border-b border-accent-tertiary/20 mb-6">
        <button 
          className={`flex items-center px-4 py-3 font-serif ${activeTab === 'paste' ? 'text-ink-dark border-b-2 border-accent-primary' : 'text-ink-faded'}`}
          onClick={() => setActiveTab('paste')}
        >
          <FileText className="w-4 h-4 mr-2" />
          Paste Text
        </button>
        <button 
          className={`flex items-center px-4 py-3 font-serif ${activeTab === 'upload' ? 'text-ink-dark border-b-2 border-accent-primary' : 'text-ink-faded'}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </button>
        <button 
          className={`flex items-center px-4 py-3 font-serif ${activeTab === 'link' ? 'text-ink-dark border-b-2 border-accent-primary' : 'text-ink-faded'}`}
          onClick={() => setActiveTab('link')}
        >
          <LinkIcon className="w-4 h-4 mr-2" />
          Add Link
        </button>
      </div>

      <div className="mb-6">
        {activeTab === 'paste' && (
          <div>
            <label htmlFor="content" className="block font-serif text-ink-light mb-2">Paste your content below</label>
            <textarea 
              id="content"
              className="w-full h-64 p-4 font-serif bg-cream border border-accent-tertiary/30 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary"
              placeholder="Paste your unorganized notes, ideas, or content here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              onDrop={handleTextDrop}
              onDragOver={(e) => e.preventDefault()}
            ></textarea>
          </div>
        )}

        {activeTab === 'upload' && (
          <div>
            <div 
              className="flex flex-col items-center justify-center h-40 bg-cream border-2 border-dashed border-accent-tertiary/40 rounded-md"
              onDrop={handleTextDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="w-10 h-10 text-accent-primary/70 mb-3" />
              <p className="font-serif text-ink-light mb-1">Drag & drop your files here</p>
              <p className="font-serif text-ink-faded text-sm mb-3">or select files to upload</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-1.5 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors flex items-center"
                >
                  <File className="w-4 h-4 mr-1.5" />
                  Documents
                </button>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="px-4 py-1.5 font-serif bg-accent-secondary text-white rounded hover:bg-accent-secondary/90 transition-colors flex items-center"
                >
                  <Image className="w-4 h-4 mr-1.5" />
                  Images
                </button>
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
            </div>
            <p className="font-serif text-ink-faded text-xs mt-2">
              Supported formats: PDF, DOCX, TXT, RTF, PPT, PPTX, EPUB, CSV, and common image formats
            </p>
          </div>
        )}

        {activeTab === 'link' && (
          <div>
            <label htmlFor="link" className="block font-serif text-ink-light mb-2">Enter a webpage URL or YouTube video link</label>
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
                <input 
                  type="url" 
                  id="link"
                  className="w-full p-3 font-serif bg-cream border border-accent-tertiary/30 border-l-0 rounded-r-md focus:outline-none focus:ring-1 focus:ring-accent-primary"
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
                />
              </div>
              <button
                onClick={handleLinkAdd}
                disabled={!linkUrl || isLoading}
                className={`sm:ml-3 px-4 py-2 font-serif rounded flex items-center justify-center ${
                  !linkUrl || isLoading
                    ? 'bg-accent-primary/40 text-white/70 cursor-not-allowed'
                    : 'bg-accent-primary text-white hover:bg-accent-primary/90'
                } transition-colors`}
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Add Link</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </>
                )}
              </button>
            </div>
            <div className="flex mt-2 text-sm">
              <button
                onClick={() => setIsYouTube(false)}
                className={`mr-4 py-1 font-serif ${!isYouTube ? 'text-accent-primary border-b border-accent-primary' : 'text-ink-light'}`}
              >
                Webpage
              </button>
              <button
                onClick={() => setIsYouTube(true)}
                className={`py-1 font-serif ${isYouTube ? 'text-red-500 border-b border-red-500' : 'text-ink-light'}`}
              >
                YouTube Video
              </button>
            </div>
            {isYouTube && (
              <p className="mt-2 text-xs text-ink-faded font-serif">
                YouTube videos will be processed to extract the transcript for analysis if available. Note that not all videos have transcripts.
              </p>
            )}
          </div>
        )}
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
                    <button 
                      onClick={() => removeFile(file.id)}
                      className="p-1.5 text-ink-faded hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                        <button 
                          onClick={() => removeLink(link.id)}
                          className="p-1.5 text-ink-faded hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-serif text-ink-faded text-xs truncate mb-1" title={link.url}>
                        {link.url}
                      </p>
                      
                      {/* YouTube transcript status */}
                      {link.type === 'youtube' && (
                        <div className="mt-1">
                          {link.isLoadingTranscript ? (
                            <div className="flex items-center text-xs text-ink-light">
                              <Loader className="w-3 h-3 mr-1.5 animate-spin" />
                              Fetching transcript...
                            </div>
                          ) : link.transcriptError && !link.transcript ? (
                            <div className="flex items-center text-xs text-amber-600">
                              <AlertCircle className="w-3 h-3 mr-1.5" />
                              {link.transcriptError.includes("No transcript available") 
                                ? "No transcript available for this video" 
                                : link.transcriptError}
                              <button 
                                onClick={() => handleRetryTranscript(link)}
                                className="ml-2 text-accent-primary underline"
                              >
                                Retry
                              </button>
                            </div>
                          ) : link.transcript ? (
                            <div className="flex items-center text-xs text-green-600">
                              <Check className="w-3 h-3 mr-1.5" />
                              {link.transcriptError 
                                ? "Using mock transcript for analysis" 
                                : `Transcript available (${Math.floor(link.transcript.length / 5)} words)`}
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleRetryTranscript(link)}
                              className="text-xs text-accent-primary flex items-center"
                            >
                              <Youtube className="w-3 h-3 mr-1.5" />
                              Fetch transcript for analysis
                            </button>
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

      <div className="flex justify-end">
        <button 
          onClick={handleSubmit}
          disabled={isAnalyzing || (textContent === '' && files.length === 0 && links.length === 0)}
          className={`flex items-center px-6 py-3 font-serif text-white rounded
            ${isAnalyzing || (textContent === '' && files.length === 0 && links.length === 0)
              ? 'bg-accent-primary/40 cursor-not-allowed' 
              : 'bg-accent-primary hover:bg-accent-primary/90 transition-colors'}`}
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              Analyze Content
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BrainDump;