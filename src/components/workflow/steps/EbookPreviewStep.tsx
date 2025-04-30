import React, { useState, useEffect } from 'react';
import { useWorkflow, WorkflowStep } from '@/lib/contexts/WorkflowContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  ArrowRight,
  BookText,
  Download,
  FileDown,
  Loader2,
  Check,
  FileText,
  ArrowLeft,
  Clock,
  BookOpen,
  FileType,
  Sparkles,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';
import { marked } from 'marked';
import { formatEbookForExport } from '@/lib/openRouter';

/**
 * The eBook preview step in the workflow.
 * Allows users to preview the generated eBook and download in various formats.
 */
const EbookPreviewStep = () => {
  const { 
    ebook, 
    ebookChapters, 
    finalizeEbook,
    setCurrentStep,
    project,
    loading
  } = useWorkflow();
  const { createProduct, updateProduct } = useProducts();

  const [activeTab, setActiveTab] = useState('preview');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [fullContent, setFullContent] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  
  // Check if all chapters are generated
  const allChaptersGenerated = ebookChapters.every(c => c.status === 'generated');

  /**
   * Generates the combined eBook content
   */
  const getFullEbookContent = (): string => {
    try {
      // Validate if ebook and chapters exist
      if (!ebook || !ebookChapters || ebookChapters.length === 0) {
        console.error('Cannot generate ebook content: Missing ebook data or chapters', {
          ebook: !!ebook,
          chaptersLength: ebookChapters?.length || 0
        });
        return 'Error: Missing ebook data or chapters';
      }

      // Debug log content before formatting
      console.log('Generating full ebook content:', {
        title: ebook.title || 'No title available',
        description: ebook.description || 'No description available',
        chaptersCount: ebookChapters.length,
        chaptersWithContent: ebookChapters.filter(ch => ch.content && ch.content.trim().length > 0).length
      });

      // Check if we have a valid title
      if (!ebook.title || ebook.title.trim() === '' || ebook.title === 'Untitled eBook') {
        console.warn('Ebook has missing or default title:', ebook.title);
        // Set a default title if missing
        ebook.title = 'Untitled eBook';
      }

      // Use the formatter to get the content
      const content = formatEbookForExport(
        ebook.title, 
        ebook.description || '', 
        ebookChapters
      );
      
      // Add debug message with content length
      console.log(`Generated ebook content: ${content.length} characters, ${content.split('\n').length} lines`);
      
      return content;
    } catch (error) {
      console.error('Error generating ebook content:', error);
      return `Error generating ebook content: ${error.message}`;
    }
  };

  // Load all ebook content and update when ebook or chapters change
  useEffect(() => {
    try {
      // Skip if we don't have an ebook or chapters yet
      if (!ebook || !ebookChapters || ebookChapters.length === 0) {
        console.log('Waiting for ebook data to load...');
        return;
      }
      
      // Debug ebook data
      console.log('Ebook data loaded:', {
        title: ebook.title || 'No title available',
        description: ebook.description?.substring(0, 30) || 'No description',
        chaptersCount: ebookChapters.length
      });
      
      // Check for chapters without content
      const emptyChapters = ebookChapters.filter(ch => !ch.content || ch.content.trim() === '');
      if (emptyChapters.length > 0) {
        console.warn(`${emptyChapters.length} chapters have no content:`, 
          emptyChapters.map(ch => ({ id: ch.id, title: ch.title }))
        );
      }

      // Generate full content and update state
      setFullContent(getFullEbookContent());
      
      // Generate HTML preview
      setHtmlContent(getHtmlContent());
    } catch (error) {
      console.error('Error in content loading effect:', error);
      setError(`Error loading ebook content: ${error.message}`);
    }
  }, [ebook, ebookChapters]);

  /**
   * Converts markdown content to HTML for preview
   */
  const getHtmlContent = (): string => {
    try {
      // Access the full content from our state
      const content = fullContent || getFullEbookContent();
      
      // Log the content we're converting for debugging
      console.log(`Converting markdown to HTML: ${content.length} characters`);
      
      // Use marked to parse markdown to HTML
      if (typeof window !== 'undefined') {
        // Configure marked options
        marked.setOptions({
          breaks: false,        // Changed to false for standard paragraph behavior
          gfm: true,            // GitHub Flavored Markdown
          headerIds: true,      // Include IDs in headers
          mangle: false,        // Don't escape HTML
          smartLists: true,     // Use smarter list behavior
          smartypants: true,    // Use "smart" typographic punctuation
        });
        
        // Convert markdown to HTML
        const htmlContent = marked.parse(content);
        
        // Apply some basic styling to make it look better
        const styledHtml = `
          <style>
            .markdown-preview {
              font-family: 'Merriweather', Georgia, serif;
              line-height: 1.8;
              color: #333;
              max-width: 100%;
            }
            .markdown-preview h1 {
              font-family: 'Montserrat', Arial, sans-serif;
              font-size: 1.75rem;
              margin: 1.5rem 0 1rem;
              padding-bottom: 0.5rem;
              border-bottom: 1px solid #eee;
              color: #222;
            }
            .markdown-preview h2 {
              font-family: 'Montserrat', Arial, sans-serif;
              font-size: 1.5rem;
              margin: 1.4rem 0 0.8rem;
              color: #333;
            }
            .markdown-preview h3 {
              font-family: 'Montserrat', Arial, sans-serif;
              font-size: 1.25rem; 
              margin: 1.2rem 0 0.6rem;
              color: #444;
            }
            .markdown-preview p {
              margin: 0 0 1rem;
            }
            .markdown-preview ul, .markdown-preview ol {
              margin-bottom: 1rem;
              padding-left: 2rem;
            }
            .markdown-preview blockquote {
              margin: 1rem 0;
              padding: 0.5rem 1rem;
              border-left: 4px solid #ddd;
              background-color: #f9f9f9;
              font-style: italic;
            }
            .markdown-preview code {
              font-family: 'Courier New', monospace;
              background-color: #f5f5f5;
              padding: 0.2em 0.4em;
              border-radius: 3px;
              font-size: 0.9em;
            }
            .markdown-preview table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 1rem;
            }
            .markdown-preview th, .markdown-preview td {
              padding: 0.5rem;
              border: 1px solid #ddd;
              text-align: left;
            }
            .markdown-preview th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .dark .markdown-preview {
              color: #e0e0e0;
            }
            .dark .markdown-preview h1 {
              color: #f0f0f0;
              border-bottom-color: #444;
            }
            .dark .markdown-preview h2, .dark .markdown-preview h3 {
              color: #e8e8e8;
            }
            .dark .markdown-preview blockquote {
              border-left-color: #555;
              background-color: #333;
            }
            .dark .markdown-preview code {
              background-color: #333;
            }
            .dark .markdown-preview th, .dark .markdown-preview td {
              border-color: #555;
            }
            .dark .markdown-preview th {
              background-color: #444;
            }
          </style>
          <div class="markdown-preview">
            ${htmlContent}
          </div>
        `;
        
        return styledHtml;
      }
      
      // Fallback if we're not in a browser or marked isn't available
      return `<div style="white-space: pre-wrap;">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
    } catch (error) {
      console.error('Error converting markdown to HTML:', error);
      return `<div style="color: red; font-weight: bold;">Error generating preview: ${error.message}</div>`;
    }
  };

  /**
   * Handles finalizing the eBook
   */
  const handleFinalize = async () => {
    try {
      setError(null);
      setIsGenerating('finalizing');
      setNotification(null);
      
      // Show finalizing progress message
      const finalizingSteps = [
        "Compiling all chapters...",
        "Formatting content...", 
        "Creating metadata...",
        "Finalizing eBook..."
      ];
      
      // Create a little animation for the steps
      for (let i = 0; i < finalizingSteps.length; i++) {
        // Use a visual indicator that this is a status, not an error
        setNotification({ message: finalizingSteps[i], type: 'info' });
        // Log to console as well
        console.log(`Finalization step ${i+1}/${finalizingSteps.length}: ${finalizingSteps[i]}`);
        
        // If this is the last step, start the actual eBook finalization in parallel with the animation
        if (i === finalizingSteps.length - 1) {
          // Don't await here - let it run in parallel with the timeout
          finalizeEbook()
            .then(async () => {
              setIsFinalized(true);
              setNotification({ message: "eBook successfully finalized! Redirecting to completed page...", type: 'success' });
              
              // Update the product status to 'complete' when finalizing
              if (project) {
                try {
                  console.log('Updating product status to complete...');
                  // Try to find any products with this project_id
                  const result = await updateProduct(project.id, {
                    status: 'complete',
                    workflow_step: 'completed' as WorkflowStep,
                    metadata: {
                      // Preserve existing metadata and add completion details
                      completed: true,
                      completedAt: new Date().toISOString(),
                      workflow_step: 'completed' as WorkflowStep
                    }
                  });
                  
                  console.log('Product status updated:', result);
                } catch (updateErr) {
                  console.error('Error updating product status:', updateErr);
                  // Don't block the completion flow if product update fails
                }
              }
              
              // Transition to completed step
              setTimeout(() => {
                setCurrentStep('completed');
              }, 1500);
            })
            .catch((err) => {
              console.error("Finalization error:", err);
              
              // Handle specific errors
              if (err.message?.includes('Bucket not found') || err.message?.includes('storage')) {
                // Storage-related error
                setError(`⚠️ Your eBook was finalized, but couldn't be saved to cloud storage. You can still download it using the options above.`);
                setNotification({ message: `Your eBook was finalized, but couldn't be saved to cloud storage. You can still download it using the options above.`, type: 'warning' });
                
                // Show the successful state even with storage error
                setIsFinalized(true);
                
                // Move to completed step after a delay
                setTimeout(() => {
                  setCurrentStep('completed');
                }, 3000);
              } else {
                // Other errors
                setError(`Error: ${err.message || 'Failed to finalize eBook'}`);
                setIsGenerating(null);
              }
            });
        }
        
        // Pause between steps
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Return early since we're handling the finalization and state updates in the callback above
      return;
    } catch (err: any) {
      console.error("Error in handleFinalize:", err);
      setError(`Error: ${err.message || 'Failed to finalize eBook'}`);
      setIsGenerating(null);
    }
  };

  /**
   * Handles downloading the eBook in markdown format
   */
  const handleDownloadMarkdown = async () => {
    console.log('[handleDownloadMarkdown] Attempting download...');
    try {
      setIsGenerating('markdown');
      setError(null);
      setNotification(null);

      if (!ebook) {
        console.error('[handleDownloadMarkdown] Error: No ebook data available');
        throw new Error('No ebook data available');
      }

      // Ensure chapters is an array
      if (!Array.isArray(ebookChapters)) {
        console.error('[handleDownloadMarkdown] Error: ebookChapters is not an array', ebookChapters);
        throw new Error('Invalid chapter data');
      }

      // Filter out empty chapters for download validation
      const chaptersForDownload = ebookChapters.filter(chapter => chapter.content && chapter.content.trim().length > 0);
      if (chaptersForDownload.length === 0) {
        console.error('[handleDownloadMarkdown] Error: All chapters are empty');
        throw new Error('Cannot generate markdown: All chapters are empty. Please generate content first.');
      }

      // Log data being passed
      console.log('[handleDownloadMarkdown] Generating with:', {
        title: ebook.title,
        descriptionLength: ebook.description?.length || 0,
        chaptersCount: chaptersForDownload.length
      });

      // Create a properly formatted filename preserving the eBook title case
      let safeFilename = ebook.title
        .replace(/[^a-zA-Z0-9 ]+/g, '_') // Replace one or more invalid chars (except space) with _
        .replace(/\s+/g, '_')           // Replace spaces with _
        .replace(/_+/g, '_')             // Collapse multiple underscores
        .trim() || 'ebook';              // Ensure not empty
      safeFilename += '.md';

      // Import the markdown generator
      const { generateMarkdown } = await import('@/lib/pdfGenerator');

      // Generate the markdown file
      const markdownBlob = generateMarkdown(
        ebook.title,
        ebook.description || '',
        chaptersForDownload // Pass only chapters with content
      );

      // Log blob info
      console.log('[handleDownloadMarkdown] Blob generated:', { type: markdownBlob.type, size: markdownBlob.size });
      if (markdownBlob.size === 0) {
        throw new Error('Generated markdown file is empty.');
      }

      // Download the markdown file
      const url = URL.createObjectURL(markdownBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('[handleDownloadMarkdown] Download triggered for:', safeFilename);

      setNotification({ message: 'Markdown successfully generated and downloaded', type: 'success' });
    } catch (err: any) {
      console.error('[handleDownloadMarkdown] Markdown generation error:', err);
      setError(`Failed to generate markdown: ${err.message || 'Unknown error'}`);
      setNotification({ message: `Markdown generation failed: ${err.message || 'Unknown error'}`, type: 'error' }); // Show error notification
    } finally {
      setIsGenerating(null);
    }
  };

  /**
   * Handles downloading the eBook as PDF
   */
  const handleDownloadPdf = async () => {
    console.log('[handleDownloadPdf] Attempting download...');
    try {
      setIsGenerating('pdf');
      setError(null);
      setNotification(null);

      // Check if all required data is available
      if (!ebook) {
        console.error('[handleDownloadPdf] Error: No ebook data available');
        throw new Error('No ebook data available');
      }

      if (!Array.isArray(ebookChapters) || ebookChapters.length === 0) {
        console.error('[handleDownloadPdf] Error: No chapters available or invalid format', ebookChapters);
        throw new Error('No chapters available for PDF generation');
      }

      // Validate chapters have content
      const chaptersWithContent = ebookChapters.filter(chapter => chapter.content && chapter.content.trim().length > 0);
      const emptyChaptersCount = ebookChapters.length - chaptersWithContent.length;

      if (chaptersWithContent.length === 0) {
        console.error('[handleDownloadPdf] Error: All chapters are empty');
        throw new Error('Cannot generate PDF: All chapters are empty');
      }

      if (emptyChaptersCount > 0) {
        console.warn(`[handleDownloadPdf] ${emptyChaptersCount} chapter(s) have no content and will be skipped.`);
        setNotification({
          message: `Note: ${emptyChaptersCount} chapter(s) have no content and will be skipped in the PDF.`,
          type: 'warning'
        });
      } else {
        // Clear previous warning if all chapters now have content
        setNotification(null);
      }
      
      const effectiveTitle = (ebook.title || 'Untitled eBook').trim();
      if (effectiveTitle === 'Untitled eBook') {
          console.warn('[handleDownloadPdf] Using default title for PDF generation');
      }

      // Log data being passed
      console.log('[handleDownloadPdf] Generating with:', {
        title: effectiveTitle,
        descriptionLength: ebook.description?.length || 0,
        chaptersCount: chaptersWithContent.length
      });

      // Import the PDF generator
      const { generatePdf } = await import('@/lib/pdfGenerator');

      try {
        // Create a properly formatted filename preserving the eBook title case
        let safeFilename = effectiveTitle
          .replace(/[^a-zA-Z0-9 ]+/g, '_') // Replace one or more invalid chars (except space) with _
          .replace(/\s+/g, '_')           // Replace spaces with _
          .replace(/_+/g, '_')             // Collapse multiple underscores
          .trim() || 'ebook';              // Ensure not empty
        safeFilename += '.pdf';

        // Generate the PDF using only chapters with content
        const pdfBlob = await generatePdf(
          effectiveTitle,
          ebook.description || '',
          chaptersWithContent,
          {
            withCover: true,
            includeTableOfContents: true,
            filename: safeFilename
          }
        );

        // Log blob info
        console.log('[handleDownloadPdf] Blob generated:', { type: pdfBlob.type, size: pdfBlob.size });
        if (pdfBlob.size === 0) {
          throw new Error('Generated PDF file is empty.');
        }

        // Download the PDF
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('[handleDownloadPdf] Download triggered for:', safeFilename);

        setNotification({ message: 'PDF successfully generated and downloaded', type: 'success' });

      } catch (pdfError: any) {
        console.error('[handleDownloadPdf] PDF generation internal error details:', pdfError);

        // Handle specific library loading error separately
        if (pdfError.message.includes('html2pdf') || pdfError.message.includes('not installed') || pdfError.message.includes('library is not available')) {
          setError('PDF Library Error: html2pdf.js not found. Please run: npm install --save html2pdf.js');
          setNotification(null); // Clear any previous notifications
        } else {
          // Throw other PDF generation errors to the outer catch block
          throw pdfError;
        }
      }
    } catch (err: any) {
      console.error('[handleDownloadPdf] Export error:', err);
      setError(`Error generating PDF: ${err.message || 'Unknown error'}`);
      setNotification({ message: `PDF generation failed: ${err.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsGenerating(null);
    }
  };

  /**
   * Handles downloading the eBook as ePub
   */
  const handleDownloadEpub = async () => {
    console.log('[handleDownloadEpub] Attempting download...');
    try {
      setIsGenerating('epub');
      setError(null);
      setNotification(null);

      if (!ebook) {
        console.error('[handleDownloadEpub] Error: No ebook data available');
        throw new Error('No ebook data available');
      }

      if (!Array.isArray(ebookChapters)) {
        console.error('[handleDownloadEpub] Error: ebookChapters is not an array', ebookChapters);
        throw new Error('Invalid chapter data');
      }

      // Validate chapters have content
      const chaptersForDownload = ebookChapters.filter(chapter => chapter.content && chapter.content.trim().length > 0);
      if (chaptersForDownload.length === 0) {
        console.error('[handleDownloadEpub] Error: All chapters are empty');
        throw new Error('Cannot generate EPUB: All chapters are empty. Please generate content first.');
      }
      
      const effectiveTitle = (ebook.title || 'Untitled eBook').trim();
      if (effectiveTitle === 'Untitled eBook') {
          console.warn('[handleDownloadEpub] Using default title for EPUB generation');
      }

      // Log data being passed
      console.log('[handleDownloadEpub] Generating with:', {
        title: effectiveTitle,
        descriptionLength: ebook.description?.length || 0,
        chaptersCount: chaptersForDownload.length
      });

      // Create a properly formatted filename preserving the eBook title case
      let safeFilename = effectiveTitle
        .replace(/[^a-zA-Z0-9 ]+/g, '_') // Replace one or more invalid chars (except space) with _
        .replace(/\s+/g, '_')           // Replace spaces with _
        .replace(/_+/g, '_')             // Collapse multiple underscores
        .trim() || 'ebook';              // Ensure not empty
      safeFilename += '.epub';

      // Import the EPUB generator
      const { generateEpub } = await import('@/lib/pdfGenerator');

      // Generate the EPUB
      const epubBlob = await generateEpub(
        effectiveTitle,
        ebook.description || '',
        chaptersForDownload // Pass only chapters with content
      );

      // Log blob info
      console.log('[handleDownloadEpub] Blob generated:', { type: epubBlob.type, size: epubBlob.size });
      if (epubBlob.size === 0) {
        throw new Error('Generated EPUB file is empty.');
      }

      // Download the EPUB
      const url = URL.createObjectURL(epubBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('[handleDownloadEpub] Download triggered for:', safeFilename);

      setNotification({ message: 'EPUB successfully generated and downloaded', type: 'success' });
    } catch (err: any) {
      console.error('[handleDownloadEpub] EPUB generation error:', err);
      setError(`Failed to generate EPUB: ${err.message || 'Unknown error'}`);
      setNotification({ message: `EPUB generation failed: ${err.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsGenerating(null);
    }
  };

  // Calculate book statistics
  const calculateBookStats = () => {
    const totalWords = ebookChapters.reduce((sum, chapter) => {
      return sum + (chapter.content ? chapter.content.split(/\s+/).length : 0);
    }, 0);
    
    const readingTimeMinutes = Math.ceil(totalWords / 225); // Average reading speed 225 wpm
    const readingTimeDisplay = readingTimeMinutes >= 60 
      ? `${Math.floor(readingTimeMinutes / 60)}h ${readingTimeMinutes % 60}m` 
      : `${readingTimeMinutes} minutes`;
    
    const pageCount = Math.ceil(totalWords / 400); // Approx 400 words per page
    
    return { totalWords, readingTimeDisplay, pageCount };
  };
  
  const { totalWords, readingTimeDisplay, pageCount } = calculateBookStats();

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="animate-fade-in">
        <h2 className="text-2xl font-display text-ink-dark dark:text-ink-dark mb-4 tracking-tight">
          Preview & Download
        </h2>
        <p className="text-ink-light dark:text-ink-light font-serif max-w-3xl leading-relaxed">
          Your eBook is now ready! Preview the content and download it in your preferred format.
        </p>
        
        {/* Book statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <motion.div 
            className="bg-[#F9F7F4] dark:bg-card px-4 py-3 rounded-lg border border-[#E8E8E8] dark:border-accent-tertiary/50 flex items-center"
            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 bg-[#738996]/10 dark:bg-[#738996]/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <FileText className="h-5 w-5 text-[#738996] dark:text-[#738996]/90" />
            </div>
            <div>
              <p className="text-xs text-ink-light dark:text-ink-light font-serif">Words</p>
              <p className="text-ink-dark dark:text-ink-dark font-display font-medium">{totalWords.toLocaleString()}</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-[#F9F7F4] dark:bg-card px-4 py-3 rounded-lg border border-[#E8E8E8] dark:border-accent-tertiary/50 flex items-center"
            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 bg-[#738996]/10 dark:bg-[#738996]/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <BookOpen className="h-5 w-5 text-[#738996] dark:text-[#738996]/90" />
            </div>
            <div>
              <p className="text-xs text-ink-light dark:text-ink-light font-serif">Pages</p>
              <p className="text-ink-dark dark:text-ink-dark font-display font-medium">{pageCount}</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-[#F9F7F4] dark:bg-card px-4 py-3 rounded-lg border border-[#E8E8E8] dark:border-accent-tertiary/50 flex items-center"
            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 bg-[#738996]/10 dark:bg-[#738996]/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <Clock className="h-5 w-5 text-[#738996] dark:text-[#738996]/90" />
            </div>
            <div>
              <p className="text-xs text-ink-light dark:text-ink-light font-serif">Reading Time</p>
              <p className="text-ink-dark dark:text-ink-dark font-display font-medium">{readingTimeDisplay}</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-[#F9F7F4] dark:bg-card px-4 py-3 rounded-lg border border-[#E8E8E8] dark:border-accent-tertiary/50 flex items-center"
            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 bg-[#738996]/10 dark:bg-[#738996]/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <FileType className="h-5 w-5 text-[#738996] dark:text-[#738996]/90" />
            </div>
            <div>
              <p className="text-xs text-ink-light dark:text-ink-light font-serif">Chapters</p>
              <p className="text-ink-dark dark:text-ink-dark font-display font-medium">{ebookChapters.length}</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Notification Area */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "border rounded-md p-4 flex items-start",
              notification.type === 'success' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400",
              notification.type === 'info' && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-400",
              notification.type === 'warning' && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30 text-yellow-700 dark:text-yellow-500",
              notification.type === 'error' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400"
            )}
          >
            {notification.type === 'success' && <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />}
            {notification.type === 'info' && <Sparkles className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />}
            {notification.type === 'warning' && <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />}
            {notification.type === 'error' && <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />}
            <p className="text-sm font-serif">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Area */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "border rounded-md p-4 flex items-start",
              "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400"
            )}
          >
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-serif">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book information */}
      <motion.div variants={itemVariants}>
        <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/50 bg-gradient-to-br from-white to-[#F9F7F4]/30 dark:from-card dark:to-dark-bg shadow-sm dark:shadow-dark-sm rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md dark:hover:shadow-dark">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-[#738996]/10 dark:bg-[#738996]/20 rounded-full flex items-center justify-center flex-shrink-0 group transition-all duration-300 hover:scale-105 hover:bg-[#738996]/20 dark:hover:bg-[#738996]/30">
                <BookText className="h-8 w-8 text-[#738996] dark:text-[#738996]/90 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl text-ink-dark dark:text-ink-dark mb-1 tracking-tight">
                  {ebook?.title}
                </h3>
                {ebook?.description && (
                  <p className="text-ink-light dark:text-ink-light font-serif text-sm leading-relaxed">
                    {ebook.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full text-xs font-serif text-green-700 dark:text-green-500 border border-green-100 dark:border-green-900/30 shadow-sm dark:shadow-dark-sm flex items-center">
                    <Check className="h-3 w-3 mr-1.5" />
                    {ebookChapters.length} chapters
                  </div>
                  <div className="bg-[#738996]/10 dark:bg-[#738996]/20 px-3 py-1 rounded-full text-xs font-serif text-[#738996] dark:text-[#738996]/90 border border-[#738996]/10 dark:border-[#738996]/30 shadow-sm dark:shadow-dark-sm">
                    {totalWords.toLocaleString()} words
                  </div>
                  <div className="bg-[#F9F7F4] dark:bg-card px-3 py-1 rounded-full text-xs font-serif text-ink-dark dark:text-ink-light border border-[#E8E8E8] dark:border-accent-tertiary/50 shadow-sm dark:shadow-dark-sm">
                    {getFullEbookContent().split('\n').length.toLocaleString()} paragraphs
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs for Preview and Download */}
      <motion.div variants={itemVariants}>
        <Tabs 
          defaultValue="preview" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-2 w-full md:w-80 p-1 gap-1 bg-[#F9F7F4] dark:bg-card border border-[#E8E8E8] dark:border-accent-tertiary/50 rounded-lg">
            <TabsTrigger 
              value="preview"
              className="rounded-md data-[state=active]:bg-[#738996] data-[state=active]:text-white data-[state=active]:shadow-sm font-serif transition-all duration-200"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger 
              value="download"
              className="rounded-md data-[state=active]:bg-[#738996] data-[state=active]:text-white data-[state=active]:shadow-sm font-serif transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </TabsTrigger>
          </TabsList>
          
          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key="preview-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/50 rounded-lg shadow-sm dark:shadow-dark-sm overflow-hidden">
                  <div className="border-b border-[#E8E8E8] dark:border-accent-tertiary/50 bg-[#F9F7F4] dark:bg-card py-2 px-4 flex items-center">
                    <BookText className="h-5 w-5 text-[#738996] dark:text-[#738996]/90 mr-2" />
                    <span className="text-sm font-medium text-ink-dark dark:text-ink-dark font-serif">eBook Preview</span>
                  </div>
                  <CardContent className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                    <div 
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
          
          {/* Download Tab */}
          <TabsContent value="download" className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key="download-options"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Markdown Download */}
                  <motion.div 
                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/50 bg-white dark:bg-card rounded-lg overflow-hidden h-full transition-all duration-300 hover:border-[#738996]/30 dark:hover:border-[#738996]/40">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex-1 flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-[#F9F7F4] dark:bg-[#738996]/10 rounded-full flex items-center justify-center mb-4 group transition-all duration-300 hover:bg-[#738996]/10 dark:hover:bg-[#738996]/20">
                            <FileText className="h-7 w-7 text-[#738996] dark:text-[#738996]/90 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          <h3 className="font-display text-lg text-ink-dark dark:text-ink-dark mb-2">Markdown</h3>
                          <p className="text-sm text-ink-light dark:text-ink-light font-serif mb-5 leading-relaxed">
                            Download as a Markdown file, perfect for further editing in text editors.
                          </p>
                          <Button
                            onClick={handleDownloadMarkdown}
                            className={cn(
                              "gap-2 w-full mt-auto border border-[#738996]/30 dark:border-[#738996]/40 transition-all duration-300",
                              isGenerating === 'markdown'
                                ? "bg-[#738996]/10 dark:bg-[#738996]/20 text-[#738996] dark:text-[#738996]/90"
                                : "text-[#738996] dark:text-[#738996]/90 hover:bg-[#738996]/5 dark:hover:bg-[#738996]/15 hover:border-[#738996]/40 dark:hover:border-[#738996]/50"
                            )}
                            variant="outline"
                            disabled={isGenerating !== null || loading}
                          >
                            {isGenerating === 'markdown' ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                Download .md
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  {/* PDF Download */}
                  <motion.div 
                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border border-[#ccb595]/30 dark:border-[#ccb595]/40 bg-white dark:bg-card rounded-lg overflow-hidden h-full transition-all duration-300 hover:border-[#ccb595]/50 dark:hover:border-[#ccb595]/60">
                      <div className="h-1.5 bg-[#ccb595] dark:bg-[#ccb595]/90"></div>
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex-1 flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-[#ccb595]/10 dark:bg-[#ccb595]/20 rounded-full flex items-center justify-center mb-4 group transition-all duration-300 hover:bg-[#ccb595]/20 dark:hover:bg-[#ccb595]/30">
                            <FileDown className="h-7 w-7 text-[#ccb595] dark:text-[#ccb595]/90 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          <div className="bg-[#ccb595]/10 dark:bg-[#ccb595]/20 text-[#ccb595] dark:text-[#ccb595]/90 text-xs font-medium px-2.5 py-0.5 rounded-full mb-2">
                            Recommended
                          </div>
                          <h3 className="font-display text-lg text-ink-dark dark:text-ink-dark mb-2">PDF</h3>
                          <p className="text-sm text-ink-light dark:text-ink-light font-serif mb-5 leading-relaxed">
                            Download as a PDF file, ideal for reading on any device or printing.
                          </p>
                          <Button
                            onClick={handleDownloadPdf}
                            className="gap-2 w-full mt-auto bg-gradient-to-r from-[#ccb595] to-[#ccb595]/90 dark:from-[#ccb595]/90 dark:to-[#ccb595]/80 text-white hover:from-[#ccb595]/90 hover:to-[#ccb595]/80 dark:hover:from-[#ccb595]/80 dark:hover:to-[#ccb595]/70 transition-all duration-300 shadow-sm dark:shadow-dark-sm hover:shadow dark:hover:shadow-dark"
                            disabled={isGenerating !== null || loading}
                          >
                            {isGenerating === 'pdf' ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                Download PDF
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  {/* ePub Download */}
                  <motion.div 
                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border border-[#E8E8E8] bg-white rounded-lg overflow-hidden h-full transition-all duration-300 hover:border-[#738996]/30">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex-1 flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-[#F9F7F4] rounded-full flex items-center justify-center mb-4 group transition-all duration-300 hover:bg-[#738996]/10">
                            <BookText className="h-7 w-7 text-[#738996] group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          <h3 className="font-display text-lg text-ink-dark mb-2">ePub</h3>
                          <p className="text-sm text-ink-light font-serif mb-5 leading-relaxed">
                            Download as an ePub file, perfect for e-readers like Kindle and Kobo.
                          </p>
                          <Button
                            onClick={handleDownloadEpub}
                            className={cn(
                              "gap-2 w-full mt-auto border border-[#738996]/30 transition-all duration-300",
                              isGenerating === 'epub'
                                ? "bg-[#738996]/10 text-[#738996]"
                                : "text-[#738996] hover:bg-[#738996]/5 hover:border-[#738996]/40"
                            )}
                            variant="outline"
                            disabled={isGenerating !== null || loading}
                          >
                            {isGenerating === 'epub' ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                Download ePub
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                <p className="text-xs text-ink-faded text-center mt-4 font-serif">
                  All downloads include a complete, formatted copy of your eBook with table of contents.
                </p>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Actions */}
      <motion.div 
        variants={itemVariants}
        className="flex justify-between mt-10"
      >
        <Button
          variant="outline"
          onClick={() => setCurrentStep('ebook-writing')}
          className="gap-2 border-[#E8E8E8] dark:border-accent-tertiary/40 hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 hover:border-[#E8E8E8] dark:hover:border-accent-tertiary/50 transition-all duration-200"
          disabled={isGenerating !== null || isFinalized || loading}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Editor
        </Button>
        
        <Button
          className={cn(
            "gap-2 relative overflow-hidden shadow-sm dark:shadow-md hover:shadow dark:hover:shadow-lg transition-all duration-300",
            isFinalized 
              ? "bg-gradient-to-r from-[#ccb595] to-[#ccb595]/90 dark:from-accent-yellow dark:to-accent-yellow/90 hover:from-[#ccb595]/90 hover:to-[#ccb595]/80 dark:hover:from-accent-yellow/90 dark:hover:to-accent-yellow/80 text-white" 
              : "bg-[#738996] dark:bg-accent-primary hover:bg-[#637885] dark:hover:bg-accent-primary/90 text-white"
          )}
          onClick={handleFinalize}
          disabled={!allChaptersGenerated || isFinalized || isGenerating === 'finalizing' || loading}
        >
          {isGenerating === 'finalizing' ? (
            <>
              <div className="absolute inset-0 bg-[#738996] dark:bg-accent-primary opacity-90">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
              </div>
              <div className="relative flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Finalizing...
              </div>
            </>
          ) : isFinalized ? (
            <>
              <Check className="h-4 w-4" />
              eBook Finalized
            </>
          ) : (
            <>
              <ChevronRight className="h-4 w-4" />
              Complete eBook
            </>
          )}
        </Button>
      </motion.div>
      
      {/* Add custom style for scrollbar in the preview section */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9f7f4;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #738996;
        }
        
        @media (prefers-color-scheme: dark) {
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1f2937;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #60a5fa;
          }
        }
        
        @keyframes shine {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
        .animate-shine {
          animation: shine 1.5s infinite linear;
        }
      `}</style>
    </motion.div>
  );
};

export default EbookPreviewStep; 