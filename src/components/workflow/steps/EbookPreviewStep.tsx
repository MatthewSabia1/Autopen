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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

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
    project
  } = useWorkflow();
  const { createProduct, updateProduct } = useProducts();

  const [activeTab, setActiveTab] = useState('preview');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [productSaved, setProductSaved] = useState(false);
  
  // Save the ebook as a product when the preview step loads
  useEffect(() => {
    const saveEbookAsProduct = async () => {
      if (!ebook || !project) return;
      
      try {
        console.log('Saving ebook as product...');
        
        // Sort chapters for consistent display
        const sortedChapters = [...ebookChapters].sort((a, b) => a.order_index - b.order_index);
        
        // Calculate word count
        const wordCount = sortedChapters.reduce((count, chapter) => {
          if (!chapter.content) return count;
          return count + chapter.content.split(/\s+/).length;
        }, 0);
        
        // Create optimized metadata object with ebook content
        // Balance between storage size and completeness
        const metadata = {
          ebookData: {
            id: ebook.id,
            title: ebook.title,
            description: ebook.description || '',
            wordCount,
            // Optimized chapter storage
            chapters: sortedChapters.map(chapter => {
              const baseChapter = {
                id: chapter.id,
                title: chapter.title,
                order_index: chapter.order_index,
                status: chapter.status
              };
              
              // Only include content if it exists and isn't too large
              if (chapter.content) {
                if (chapter.content.length > 30000) {
                  // For very large chapters, store a truncated version
                  return {
                    ...baseChapter,
                    contentPreview: chapter.content.substring(0, 1000) + '... (truncated)',
                    contentLength: chapter.content.length,
                    // Store a hash or identifier for retrieval from DB if needed
                    contentId: `${chapter.id}_${chapter.content.length}`
                  };
                } else {
                  // For manageable sized chapters, store the full content
                  return { ...baseChapter, content: chapter.content };
                }
              }
              
              return baseChapter;
            })
          },
          coverImage: ebook.cover_image_url || '',
          wordCount,
          generationInfo: {
            model: "claude-3-opus-20240229",
            generatedAt: new Date().toISOString()
          },
          // Add progress data to maintain consistency with writing step
          progress: 100, // At preview stage, content is 100% generated
          completedChapters: sortedChapters.length,
          totalChapters: sortedChapters.length
        };
        
        // Create the product entry
        const result = await createProduct({
          title: ebook.title,
          description: ebook.description || '',
          type: 'ebook',
          status: 'draft',
          project_id: project.id,
          metadata,
          workflow_step: 'ebook-preview' as WorkflowStep
        });
        
        if (result) {
          console.log('Ebook saved as product:', result);
          setProductSaved(true);
        }
      } catch (err) {
        console.error('Error saving ebook as product:', err);
        // Don't show error to user, as this is a background operation
      }
    };
    
    saveEbookAsProduct();
  }, [ebook, project, ebookChapters]);

  // Check if all chapters are generated
  const allChaptersGenerated = ebookChapters.every(c => c.status === 'generated');

  /**
   * Generates the combined eBook content
   */
  const getFullEbookContent = (): string => {
    const title = ebook?.title || 'Untitled eBook';
    const description = ebook?.description || '';
    
    // Start with title and description
    let content = `# ${title}\n\n`;
    if (description) {
      content += `*${description}*\n\n`;
    }
    
    // Add table of contents
    content += `## Table of Contents\n\n`;
    ebookChapters.forEach((chapter, index) => {
      content += `${index + 1}. ${chapter.title}\n`;
    });
    content += '\n\n';
    
    // Add each chapter's content
    ebookChapters.forEach((chapter) => {
      // Only include content if it exists
      if (chapter.content) {
        content += `## ${chapter.title}\n\n${chapter.content}\n\n`;
      } else {
        content += `## ${chapter.title}\n\n*Content not generated*\n\n`;
      }
    });
    
    return content;
  };

  /**
   * Converts eBook markdown content to HTML for preview
   */
  const getHtmlContent = (): string => {
    try {
      const content = getFullEbookContent();
      
      // Convert markdown to HTML using a more robust method with dark mode support
      const html = content
        // Headers - do these first to avoid conflicts with bold/italic markdown
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 mt-6 text-ink-dark dark:text-ink-dark">$1</h1>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-3 mt-5 text-ink-dark dark:text-ink-dark">$1</h2>')
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mb-2 mt-4 text-ink-dark dark:text-ink-dark">$1</h3>')
        
        // Bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-ink-dark dark:text-ink-dark">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="text-ink-dark dark:text-ink-light">$1</em>')
        
        // Lists - multi-step to handle nested lists properly
        .replace(/^\s*\n\* (.*)/gm, '<ul class="list-disc pl-5 space-y-1 my-3">\n<li class="text-ink-light dark:text-ink-light">$1</li>')
        .replace(/^\* (.*)/gm, '<li class="text-ink-light dark:text-ink-light">$1</li>')
        .replace(/^\s*\n(\d+\. .*)/gm, '<ol class="list-decimal pl-5 space-y-1 my-3">\n<li class="text-ink-light dark:text-ink-light">$1</li>')
        .replace(/^(\d+\. .*)/gm, '<li class="text-ink-light dark:text-ink-light">$1</li>')
        .replace(/<\/ul>\s*\n<ul>/g, '')
        .replace(/<\/ol>\s*\n<ol>/g, '')
        
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-800 p-3 my-3 rounded-md overflow-x-auto text-ink-dark dark:text-ink-light"><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm text-ink-dark dark:text-ink-light">$1</code>')
        
        // Blockquotes
        .replace(/^>\s*(.*)/gm, '<blockquote class="border-l-4 border-accent-tertiary/50 dark:border-accent-tertiary/30 pl-4 py-1 my-3 italic text-ink-light dark:text-ink-light/80">$1</blockquote>')
        
        // Horizontal rule
        .replace(/^---$/gm, '<hr class="my-6 border-t border-accent-tertiary/30 dark:border-accent-tertiary/20">')
        
        // Paragraphs - careful to maintain appropriate spacing
        .replace(/^\s*\n(?!\<)/gm, '</p>\n<p class="text-ink-light dark:text-ink-light leading-relaxed mb-4">')
        
        // Fix any leftover trailing line breaks
        .replace(/\n+$/g, '');
      
      // Ensure the content is properly wrapped in paragraphs
      let htmlContent = html;
      if (!htmlContent.startsWith('<')) {
        htmlContent = '<p class="text-ink-light dark:text-ink-light leading-relaxed mb-4">' + htmlContent;
      }
      if (!htmlContent.endsWith('>')) {
        htmlContent += '</p>';
      }
      
      // Remove any empty paragraphs
      htmlContent = htmlContent.replace(/<p\s[^>]*>\s*<\/p>/g, '');
      htmlContent = htmlContent.replace(/<p>\s*<\/p>/g, '');
      
      return htmlContent;
    } catch (error) {
      console.error('Error converting markdown to HTML:', error);
      return '<p class="text-red-500 dark:text-red-400">Error converting content to HTML for preview.</p>';
    }
  };

  /**
   * Handles finalizing the eBook
   */
  const handleFinalize = async () => {
    try {
      setError(null);
      setIsGenerating('finalizing');
      
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
        setError(`✨ ${finalizingSteps[i]}`);
        // Log to console as well
        console.log(`Finalization step ${i+1}/${finalizingSteps.length}: ${finalizingSteps[i]}`);
        
        // If this is the last step, start the actual eBook finalization in parallel with the animation
        if (i === finalizingSteps.length - 1) {
          // Don't await here - let it run in parallel with the timeout
          finalizeEbook()
            .then(async () => {
              setIsFinalized(true);
              setError("✅ eBook successfully finalized! Redirecting to completed page...");
              
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
                      // Always include workflow step in metadata for consistency
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
    try {
      setIsGenerating('markdown');
      setError(null);
      
      if (!ebook) {
        throw new Error('No ebook data available');
      }
      
      // Create a properly formatted filename preserving the eBook title case
      const safeFilename = `${ebook.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')}.md`;
      
      // Import the markdown generator
      const { generateMarkdown } = await import('@/lib/pdfGenerator');
      
      // Generate the markdown file
      const markdownBlob = generateMarkdown(
        ebook.title,
        ebook.description || '',
        ebookChapters
      );
      
      // Download the markdown file
      const url = URL.createObjectURL(markdownBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setError('✅ Markdown successfully generated and downloaded');
    } catch (err: any) {
      setError(`Failed to generate markdown: ${err.message}`);
      console.error('Markdown generation error:', err);
    } finally {
      setIsGenerating(null);
    }
  };

  /**
   * Handles downloading the eBook as PDF
   */
  const handleDownloadPdf = async () => {
    try {
      setIsGenerating('pdf');
      setError(null);
      
      // Check if all required data is available
      if (!ebook) {
        throw new Error('No ebook data available');
      }
      
      if (!ebookChapters || ebookChapters.length === 0) {
        throw new Error('No chapters available for PDF generation');
      }
      
      // Validate chapters have content
      const emptyChapters = ebookChapters.filter(chapter => !chapter.content || chapter.content.trim().length === 0);
      if (emptyChapters.length > 0) {
        throw new Error(`${emptyChapters.length} chapter(s) have no content. Please generate content for all chapters before exporting.`);
      }
      
      // Import the PDF generator
      const { generatePdf } = await import('@/lib/pdfGenerator');
      
      try {
        // Create a properly formatted filename preserving the eBook title case
        const safeFilename = `${ebook.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')}.pdf`;
        
        // Generate the PDF
        const pdfBlob = await generatePdf(
          ebook.title,
          ebook.description || '',
          ebookChapters,
          { 
            withCover: true, 
            includeTableOfContents: true,
            filename: safeFilename
          }
        );
        
        // Download the PDF
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setError('✅ PDF successfully generated and downloaded');
        
      } catch (pdfError: any) {
        console.error('PDF generation error details:', pdfError);
        
        // If PDF fails due to missing html2pdf.js
        if (pdfError.message.includes('html2pdf') || pdfError.message.includes('not installed')) {
          setError('PDF generation requires html2pdf.js. Please run: npm install --save html2pdf.js');
          
          // Import the markdown generator
          const { generateMarkdown } = await import('@/lib/pdfGenerator');
          
          // Generate markdown
          const markdownBlob = generateMarkdown(
            ebook.title,
            ebook.description || '',
            ebookChapters
          );
          
          // Download as markdown instead
          const url = URL.createObjectURL(markdownBlob);
          const a = document.createElement('a');
          a.href = url;
          // Use the same filename format for consistency
          a.download = `${ebook.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')}.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          throw pdfError;
        }
      }
    } catch (err: any) {
      console.error('Export error:', err);
      setError(`Error generating PDF: ${err.message}`);
    } finally {
      setIsGenerating(null);
    }
  };

  /**
   * Handles downloading the eBook as ePub
   */
  const handleDownloadEpub = async () => {
    try {
      setIsGenerating('epub');
      setError(null);
      
      if (!ebook) {
        throw new Error('No ebook data available');
      }
      
      // Create a properly formatted filename preserving the eBook title case
      const safeFilename = `${ebook.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')}.epub`;
      
      // Import the EPUB generator
      const { generateEpub } = await import('@/lib/pdfGenerator');
      
      // Generate the EPUB
      const epubBlob = await generateEpub(
        ebook.title,
        ebook.description || '',
        ebookChapters
      );
      
      // Download the EPUB
      const url = URL.createObjectURL(epubBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setError('✅ EPUB successfully generated and downloaded');
    } catch (err: any) {
      setError(`Failed to generate EPUB: ${err.message}`);
      console.error('EPUB generation error:', err);
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
        <h2 className="text-2xl font-display text-ink-dark mb-4 tracking-tight">
          Preview & Download
        </h2>
        <p className="text-ink-light font-serif max-w-3xl leading-relaxed">
          Your eBook is now ready! Preview the content and download it in your preferred format.
        </p>
        
        {/* Book statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <motion.div 
            className="bg-[#F9F7F4] px-4 py-3 rounded-lg border border-[#E8E8E8] flex items-center"
            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 bg-[#738996]/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <FileText className="h-5 w-5 text-[#738996]" />
            </div>
            <div>
              <p className="text-xs text-ink-light font-serif">Words</p>
              <p className="text-ink-dark font-display font-medium">{totalWords.toLocaleString()}</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-[#F9F7F4] px-4 py-3 rounded-lg border border-[#E8E8E8] flex items-center"
            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 bg-[#738996]/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <BookOpen className="h-5 w-5 text-[#738996]" />
            </div>
            <div>
              <p className="text-xs text-ink-light font-serif">Pages</p>
              <p className="text-ink-dark font-display font-medium">{pageCount}</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-[#F9F7F4] px-4 py-3 rounded-lg border border-[#E8E8E8] flex items-center"
            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 bg-[#738996]/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <Clock className="h-5 w-5 text-[#738996]" />
            </div>
            <div>
              <p className="text-xs text-ink-light font-serif">Reading Time</p>
              <p className="text-ink-dark font-display font-medium">{readingTimeDisplay}</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-[#F9F7F4] px-4 py-3 rounded-lg border border-[#E8E8E8] flex items-center"
            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 bg-[#738996]/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <FileType className="h-5 w-5 text-[#738996]" />
            </div>
            <div>
              <p className="text-xs text-ink-light font-serif">Chapters</p>
              <p className="text-ink-dark font-display font-medium">{ebookChapters.length}</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "border rounded-md p-4 flex items-start",
              error.startsWith('✅') || error.startsWith('✨')
                ? "bg-accent-primary/5 border-accent-primary/20 text-accent-primary"
                : "bg-red-50 border-red-200 text-red-700"
            )}
          >
            {error.startsWith('✅') ? (
              <div className="bg-accent-primary/10 p-1 rounded-full mr-3 flex-shrink-0">
                <Check className="h-4 w-4 text-accent-primary" />
              </div>
            ) : error.startsWith('✨') ? (
              <div className="bg-[#ccb595]/10 p-1 rounded-full mr-3 flex-shrink-0">
                <Sparkles className="h-4 w-4 text-[#ccb595]" />
              </div>
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-serif">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {productSaved && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start"
          >
            <div className="bg-green-100 p-1 rounded-full mr-3 flex-shrink-0">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-green-700 text-sm font-serif">
              Your eBook has been saved to your products library and can be accessed from your dashboard.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book information */}
      <motion.div variants={itemVariants}>
        <Card className="border border-[#E8E8E8] bg-gradient-to-br from-white to-[#F9F7F4]/30 shadow-sm rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-[#738996]/10 rounded-full flex items-center justify-center flex-shrink-0 group transition-all duration-300 hover:scale-105 hover:bg-[#738996]/20">
                <BookText className="h-8 w-8 text-[#738996] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl text-ink-dark mb-1 tracking-tight">
                  {ebook?.title}
                </h3>
                {ebook?.description && (
                  <p className="text-ink-light font-serif text-sm leading-relaxed">
                    {ebook.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="bg-green-50 px-3 py-1 rounded-full text-xs font-serif text-green-700 border border-green-100 shadow-sm flex items-center">
                    <Check className="h-3 w-3 mr-1.5" />
                    {ebookChapters.length} chapters
                  </div>
                  <div className="bg-[#738996]/10 px-3 py-1 rounded-full text-xs font-serif text-[#738996] border border-[#738996]/10 shadow-sm">
                    {totalWords.toLocaleString()} words
                  </div>
                  <div className="bg-[#F9F7F4] px-3 py-1 rounded-full text-xs font-serif text-ink-dark border border-[#E8E8E8] shadow-sm">
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
          <TabsList className="grid grid-cols-2 w-full md:w-80 p-1 gap-1 bg-[#F9F7F4] border border-[#E8E8E8] rounded-lg">
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
                <Card className="border border-[#E8E8E8] rounded-lg shadow-sm overflow-hidden">
                  <div className="border-b border-[#E8E8E8] bg-[#F9F7F4] py-2 px-4 flex items-center">
                    <BookText className="h-5 w-5 text-[#738996] mr-2" />
                    <span className="text-sm font-medium text-ink-dark font-serif">eBook Preview</span>
                  </div>
                  <CardContent className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                    <div 
                      className="prose prose-sm max-w-none font-serif text-ink-dark prose-headings:font-display prose-headings:text-ink-dark prose-p:text-ink-light prose-p:leading-relaxed prose-headings:mb-3 prose-li:text-ink-light"
                      dangerouslySetInnerHTML={{ __html: getHtmlContent() }}
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
                    <Card className="border border-[#E8E8E8] bg-white rounded-lg overflow-hidden h-full transition-all duration-300 hover:border-[#738996]/30">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex-1 flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-[#F9F7F4] rounded-full flex items-center justify-center mb-4 group transition-all duration-300 hover:bg-[#738996]/10">
                            <FileText className="h-7 w-7 text-[#738996] group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          <h3 className="font-display text-lg text-ink-dark mb-2">Markdown</h3>
                          <p className="text-sm text-ink-light font-serif mb-5 leading-relaxed">
                            Download as a Markdown file, perfect for further editing in text editors.
                          </p>
                          <Button
                            onClick={handleDownloadMarkdown}
                            className={cn(
                              "gap-2 w-full mt-auto border border-[#738996]/30 transition-all duration-300",
                              isGenerating === 'markdown'
                                ? "bg-[#738996]/10 text-[#738996]"
                                : "text-[#738996] hover:bg-[#738996]/5 hover:border-[#738996]/40"
                            )}
                            variant="outline"
                            disabled={isGenerating !== null}
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
                    <Card className="border border-[#ccb595]/30 bg-white rounded-lg overflow-hidden h-full transition-all duration-300 hover:border-[#ccb595]/50">
                      <div className="h-1.5 bg-[#ccb595]"></div>
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex-1 flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-[#ccb595]/10 rounded-full flex items-center justify-center mb-4 group transition-all duration-300 hover:bg-[#ccb595]/20">
                            <FileDown className="h-7 w-7 text-[#ccb595] group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          <div className="bg-[#ccb595]/10 text-[#ccb595] text-xs font-medium px-2.5 py-0.5 rounded-full mb-2">
                            Recommended
                          </div>
                          <h3 className="font-display text-lg text-ink-dark mb-2">PDF</h3>
                          <p className="text-sm text-ink-light font-serif mb-5 leading-relaxed">
                            Download as a PDF file, ideal for reading on any device or printing.
                          </p>
                          <Button
                            onClick={handleDownloadPdf}
                            className="gap-2 w-full mt-auto bg-gradient-to-r from-[#ccb595] to-[#ccb595]/90 text-white hover:from-[#ccb595]/90 hover:to-[#ccb595]/80 transition-all duration-300 shadow-sm hover:shadow"
                            disabled={isGenerating !== null}
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
                            disabled={isGenerating !== null}
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
          disabled={isGenerating !== null || isFinalized}
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
          disabled={!allChaptersGenerated || isFinalized || isGenerating === 'finalizing'}
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