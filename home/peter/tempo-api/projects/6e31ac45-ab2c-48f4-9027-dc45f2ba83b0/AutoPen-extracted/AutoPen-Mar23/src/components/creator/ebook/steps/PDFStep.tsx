import React, { useState } from 'react';
import { FileText, RefreshCw, Download, Info, BookOpen, Eye, Layout } from 'lucide-react';
import { EbookContent } from '../../../../types/ebook.types';
import { RadioGroup, RadioGroupItem } from '../../../ui/radio-group';
import { Label } from '../../../ui/label';
import { Checkbox } from '../../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';

interface PDFStepProps {
  contentData: EbookContent;
  onGenerate: (options?: {
    paperSize?: 'a4' | 'letter';
    withCover?: boolean;
    includeTableOfContents?: boolean;
    template?: 'modern' | 'classic' | 'minimal' | 'academic';
    author?: string;
  }) => Promise<{ pdfUrl?: string; error: string | null }>;
  onDownload: (options?: any) => void;
  generating: boolean;
  previewUrl: string | null;
}

const PDFStep: React.FC<PDFStepProps> = ({
  contentData,
  onGenerate,
  onDownload,
  generating,
  previewUrl
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // PDF generation options
  const [template, setTemplate] = useState<'modern' | 'classic' | 'minimal' | 'academic'>('modern');
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4');
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true);
  const [includeCover, setIncludeCover] = useState(true);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Pass the custom options to the generate function
      const options = {
        template,
        paperSize,
        includeTableOfContents,
        withCover: includeCover,
        author: contentData.author || 'Created with AutoPen'
      };
      
      const { error: generateError } = await onGenerate(options);
      
      if (generateError) {
        throw new Error(generateError);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle download with the current options
  const handleDownload = () => {
    const options = {
      template,
      paperSize,
      includeTableOfContents,
      withCover: includeCover,
      author: contentData.author || 'Created with AutoPen'
    };
    
    onDownload(options);
  };

  // Template descriptions for the UI
  const templateDescriptions = {
    modern: "Clean, contemporary design with modern typography and spacing",
    classic: "Traditional book layout with serif fonts and elegant spacing",
    minimal: "Minimalist design with ample whitespace and clean lines",
    academic: "Formal layout suitable for academic or scholarly works"
  };

  return (
    <div>
      <h2 className="text-xl font-display text-ink-dark dark:text-gray-200 mb-2">Generate PDF</h2>
      <p className="text-ink-light dark:text-gray-400 font-serif mb-6">
        Generate and download your finished eBook as a professionally formatted PDF.
      </p>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">There was an error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400 font-serif">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-cream dark:bg-gray-850 p-6 rounded-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-ink-dark dark:text-gray-200 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-accent-primary" />
            Your eBook PDF
          </h3>
        </div>
        
        {previewUrl ? (
          <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
              <div>
                <h4 className="text-ink-dark dark:text-gray-200 font-medium">
                  {contentData.title || 'Your eBook'}
                </h4>
                <p className="text-ink-light dark:text-gray-400 font-serif text-sm">
                  {contentData.chapters?.length || 0} chapters • PDF format • {template} template
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className="px-4 py-2 border border-accent-tertiary/30 dark:border-gray-600 text-ink-dark dark:text-gray-300 rounded hover:bg-accent-tertiary/10 dark:hover:bg-gray-800 transition-colors flex items-center"
                >
                  {isPreviewOpen ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
            
            {isPreviewOpen && (
              <div className="border border-accent-tertiary/20 dark:border-gray-700 rounded-md overflow-hidden">
                <iframe
                  src={previewUrl}
                  className="w-full h-[600px] bg-white"
                  title="PDF Preview"
                ></iframe>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-accent-tertiary/20 dark:border-gray-700">
              <h4 className="text-ink-dark dark:text-gray-200 font-medium mb-4 flex items-center">
                <Layout className="w-4 h-4 mr-2 text-accent-primary" />
                Regenerate with Different Options
              </h4>
              
              {/* Regeneration options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <Label className="text-ink-dark dark:text-gray-300 mb-2 block">Design Template</Label>
                  <RadioGroup value={template} onValueChange={(value: any) => setTemplate(value)} className="space-y-2">
                    {(['modern', 'classic', 'minimal', 'academic'] as const).map((tmpl) => (
                      <div key={tmpl} className="flex items-start space-x-2">
                        <RadioGroupItem value={tmpl} id={`template-${tmpl}`} />
                        <div className="grid gap-1">
                          <Label htmlFor={`template-${tmpl}`} className="font-medium">
                            {tmpl.charAt(0).toUpperCase() + tmpl.slice(1)}
                          </Label>
                          <p className="text-xs text-ink-light dark:text-gray-400">
                            {templateDescriptions[tmpl]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="paper-size" className="text-ink-dark dark:text-gray-300 mb-2 block">Paper Size</Label>
                    <Select value={paperSize} onValueChange={(value: any) => setPaperSize(value)}>
                      <SelectTrigger id="paper-size" className="w-full">
                        <SelectValue placeholder="Select paper size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                        <SelectItem value="letter">US Letter (8.5 × 11 in)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-toc" 
                        checked={includeTableOfContents}
                        onCheckedChange={(checked) => setIncludeTableOfContents(checked as boolean)}
                      />
                      <Label htmlFor="include-toc" className="text-ink-dark dark:text-gray-300">
                        Include Table of Contents
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="include-cover" 
                        checked={includeCover}
                        onCheckedChange={(checked) => setIncludeCover(checked as boolean)}
                      />
                      <Label htmlFor="include-cover" className="text-ink-dark dark:text-gray-300">
                        Include Cover Page
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || generating}
                className={`px-5 py-2 rounded flex items-center ${
                  isGenerating || generating
                    ? 'bg-accent-primary/50 cursor-not-allowed text-white/80'
                    : 'bg-accent-primary text-white hover:bg-accent-primary/90'
                } transition-colors`}
              >
                {isGenerating || generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Regenerating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Regenerate PDF
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-ink-dark dark:text-gray-300 mb-2 block">Design Template</Label>
                <RadioGroup value={template} onValueChange={(value: any) => setTemplate(value)} className="space-y-2">
                  {(['modern', 'classic', 'minimal', 'academic'] as const).map((tmpl) => (
                    <div key={tmpl} className="flex items-start space-x-2">
                      <RadioGroupItem value={tmpl} id={`template-${tmpl}`} />
                      <div className="grid gap-1">
                        <Label htmlFor={`template-${tmpl}`} className="font-medium">
                          {tmpl.charAt(0).toUpperCase() + tmpl.slice(1)}
                        </Label>
                        <p className="text-xs text-ink-light dark:text-gray-400">
                          {templateDescriptions[tmpl]}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="paper-size" className="text-ink-dark dark:text-gray-300 mb-2 block">Paper Size</Label>
                  <Select value={paperSize} onValueChange={(value: any) => setPaperSize(value)}>
                    <SelectTrigger id="paper-size" className="w-full">
                      <SelectValue placeholder="Select paper size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                      <SelectItem value="letter">US Letter (8.5 × 11 in)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-toc" 
                      checked={includeTableOfContents}
                      onCheckedChange={(checked) => setIncludeTableOfContents(checked as boolean)}
                    />
                    <Label htmlFor="include-toc" className="text-ink-dark dark:text-gray-300">
                      Include Table of Contents
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-cover" 
                      checked={includeCover}
                      onCheckedChange={(checked) => setIncludeCover(checked as boolean)}
                    />
                    <Label htmlFor="include-cover" className="text-ink-dark dark:text-gray-300">
                      Include Cover Page
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center p-8 border border-dashed border-accent-tertiary/30 dark:border-gray-700 rounded-md">
              <BookOpen className="w-12 h-12 text-accent-primary/50 mx-auto mb-4" />
              <p className="text-ink-light dark:text-gray-400 font-serif mb-4">
                Generate your eBook as a professionally formatted PDF document with your selected options.
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || generating}
                className={`px-5 py-2 rounded mx-auto flex items-center ${
                  isGenerating || generating
                    ? 'bg-accent-primary/50 cursor-not-allowed text-white/80'
                    : 'bg-accent-primary text-white hover:bg-accent-primary/90'
                } transition-colors`}
              >
                {isGenerating || generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">About this step</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-400 font-serif">
              <p>
                The PDF generator creates a professionally formatted document with proper page layouts, headings, and styling.
                You can select from different design templates and customize options like page size and content structure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFStep; 