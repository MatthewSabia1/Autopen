import React, { useState, useEffect } from 'react';
import { useWorkflow } from '@/lib/contexts/WorkflowContext';
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
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useProducts } from '@/hooks/useProducts';

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
   * Converts markdown to HTML for preview
   */
  const getHtmlContent = (): string => {
    const markdown = getFullEbookContent();
    
    // Simple markdown to HTML conversion
    return markdown
      .replace(/# (.*)/g, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
      .replace(/### (.*)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/- (.*)/g, '<li class="ml-6">$1</li>')
      .replace(/\n\n/g, '<p class="mb-4"></p>')
      .replace(/\n/g, '<br />');
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
        setError(`⏳ ${finalizingSteps[i]}`);
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
              setError(err.message || 'Failed to finalize eBook');
              setIsGenerating(null);
            });
        }
        
        // Pause between steps
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      // Return early since we're handling the finalization and state updates in the callback above
      return;
    } catch (err: any) {
      setError(err.message || 'Failed to finalize eBook');
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
      
      // Import the markdown generator
      const { generateMarkdown } = await import('@/lib/pdfGenerator');
      
      // Generate the markdown file
      const markdownBlob = generateMarkdown(
        ebook?.title || 'Untitled eBook',
        ebook?.description || '',
        ebookChapters
      );
      
      // Download the markdown file
      const url = URL.createObjectURL(markdownBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ebook?.title || 'ebook'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
      
      // Import the PDF generator
      const { generatePdf } = await import('@/lib/pdfGenerator');
      
      try {
        // Generate the PDF
        const pdfBlob = await generatePdf(
          ebook.title,
          ebook.description || '',
          ebookChapters,
          { withCover: true, includeTableOfContents: true }
        );
        
        // Download the PDF
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ebook.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (pdfError: any) {
        // If PDF fails (likely due to missing html2pdf.js), offer markdown download
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
          a.download = `${ebook.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          throw pdfError;
        }
      }
    } catch (err: any) {
      setError(`${err.message}`);
      console.error('Export error:', err);
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
      
      // Import the EPUB generator
      const { generateEpub } = await import('@/lib/pdfGenerator');
      
      // Generate the EPUB
      const epubBlob = await generateEpub(
        ebook?.title || 'Untitled eBook',
        ebook?.description || '',
        ebookChapters
      );
      
      // Download the EPUB
      const url = URL.createObjectURL(epubBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ebook?.title || 'ebook'}.epub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display text-ink-dark mb-4">
          Preview & Download
        </h2>
        <p className="text-ink-light font-serif max-w-3xl">
          Your eBook is now ready! Preview the content and download it in your preferred format.
        </p>
        
        {/* Book statistics */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4">
          <div className="flex items-center gap-2 text-accent-primary text-sm">
            <span className="font-bold">{totalWords.toLocaleString()}</span> words
          </div>
          <div className="flex items-center gap-2 text-accent-primary text-sm">
            <span className="font-bold">{pageCount}</span> pages
          </div>
          <div className="flex items-center gap-2 text-accent-primary text-sm">
            <span className="font-bold">{readingTimeDisplay}</span> reading time
          </div>
          <div className="flex items-center gap-2 text-accent-primary text-sm">
            <span className="font-bold">{ebookChapters.length}</span> chapters
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm font-serif">{error}</p>
        </div>
      )}
      
      {productSaved && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start">
          <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 text-sm font-serif">
            Your eBook has been saved to your products library and can be accessed from your dashboard.
          </p>
        </div>
      )}

      {/* Book information */}
      <Card className="border border-accent-tertiary/20 bg-paper shadow-textera">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-accent-primary/10 p-3 rounded-lg">
              <BookText className="h-10 w-10 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg text-ink-dark mb-1">
                {ebook?.title}
              </h3>
              {ebook?.description && (
                <p className="text-ink-light font-serif text-sm mb-4">
                  {ebook.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="bg-green-50 px-3 py-1 rounded-full text-xs font-serif text-green-700 flex items-center">
                  <Check className="h-3 w-3 mr-1" />
                  {ebookChapters.length} chapters
                </div>
                <div className="bg-accent-primary/10 px-3 py-1 rounded-full text-xs font-serif text-accent-primary">
                  {getFullEbookContent().split(' ').length.toLocaleString()} words
                </div>
                <div className="bg-accent-tertiary/10 px-3 py-1 rounded-full text-xs font-serif text-ink-dark">
                  {getFullEbookContent().split('\n').length.toLocaleString()} paragraphs
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Preview and Download */}
      <Tabs 
        defaultValue="preview" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 w-full md:w-80">
          <TabsTrigger 
            value="preview"
            className="data-[state=active]:bg-accent-primary data-[state=active]:text-white font-serif"
          >
            Preview
          </TabsTrigger>
          <TabsTrigger 
            value="download"
            className="data-[state=active]:bg-accent-primary data-[state=active]:text-white font-serif"
          >
            Download
          </TabsTrigger>
        </TabsList>
        
        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card className="border border-accent-tertiary/20">
            <CardContent className="p-6">
              <div 
                className="prose prose-sm max-w-none font-serif text-ink-dark"
                dangerouslySetInnerHTML={{ __html: getHtmlContent() }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Download Tab */}
        <TabsContent value="download" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Markdown Download */}
            <Card className="border border-accent-tertiary/20 bg-paper shadow-textera hover:shadow-textera-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <FileText className="h-12 w-12 text-accent-primary mb-4" />
                  <h3 className="font-display text-lg text-ink-dark mb-2">Markdown</h3>
                  <p className="text-sm text-ink-light font-serif mb-4">
                    Download as a Markdown file, perfect for further editing in text editors.
                  </p>
                  <Button
                    onClick={handleDownloadMarkdown}
                    className="gap-2 w-full"
                    variant="workflowOutline"
                    disabled={isGenerating !== null}
                  >
                    {isGenerating === 'markdown' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Downloaded
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Markdown (.md)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* PDF Download */}
            <Card className="border border-accent-tertiary/20 bg-paper shadow-textera hover:shadow-textera-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <FileDown className="h-12 w-12 text-accent-primary mb-4" />
                  <h3 className="font-display text-lg text-ink-dark mb-2">PDF</h3>
                  <p className="text-sm text-ink-light font-serif mb-4">
                    Download as a PDF file, ideal for reading on any device or printing.
                  </p>
                  <Button
                    onClick={handleDownloadPdf}
                    className="gap-2 w-full text-white"
                    variant="workflow"
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
                        PDF Document
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* ePub Download */}
            <Card className="border border-accent-tertiary/20 bg-paper shadow-textera hover:shadow-textera-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <BookText className="h-12 w-12 text-accent-primary mb-4" />
                  <h3 className="font-display text-lg text-ink-dark mb-2">ePub</h3>
                  <p className="text-sm text-ink-light font-serif mb-4">
                    Download as an ePub file, perfect for e-readers like Kindle and Kobo.
                  </p>
                  <Button
                    onClick={handleDownloadEpub}
                    className="gap-2 w-full"
                    variant="workflowOutline"
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
                        ePub eBook
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <Button
          variant="workflowOutline"
          onClick={() => setCurrentStep('ebook-writing')}
          className="gap-2"
        >
          Back to Editor
        </Button>
        
        <Button
          className="gap-2 relative overflow-hidden text-white"
          variant={isFinalized ? "workflowGold" : "workflow"}
          onClick={handleFinalize}
          disabled={!allChaptersGenerated || isFinalized || isGenerating === 'finalizing'}
        >
          {isGenerating === 'finalizing' ? (
            <>
              <div className="absolute inset-0 bg-accent-primary animate-pulse"></div>
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
              <ArrowRight className="h-4 w-4" />
              Complete eBook
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EbookPreviewStep; 