import React, { useState } from 'react';
import { FileText, RefreshCw, Download, Info, BookOpen, Eye } from 'lucide-react';
import { EbookContent } from '../../../../types/ebook.types';

interface PDFStepProps {
  contentData: EbookContent;
  onGenerate: () => Promise<{ pdfUrl?: string; error: string | null }>;
  onDownload: () => void;
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

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const { error: generateError } = await onGenerate();
      
      if (generateError) {
        throw new Error(generateError);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
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
                  {contentData.chapters?.length || 0} chapters • PDF format
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
                  onClick={onDownload}
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
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-accent-tertiary/30 dark:border-gray-700 rounded-md">
            <BookOpen className="w-12 h-12 text-accent-primary/50 mx-auto mb-4" />
            <p className="text-ink-light dark:text-gray-400 font-serif mb-4">
              Generate your eBook as a professionally formatted PDF document.
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
                You can preview the document and download it to your device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFStep; 