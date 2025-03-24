import React, { useState, useEffect } from 'react';
import { FileSearch, RefreshCw, Info, ArrowRight, CheckCircle } from 'lucide-react';
import { EbookContent } from '../../../../types/ebook.types';

interface AIReviewStepProps {
  contentData: EbookContent;
  onReview: () => Promise<{ revisedContent?: any; error: string | null }>;
  generating: boolean;
}

const AIReviewStep: React.FC<AIReviewStepProps> = ({
  contentData,
  onReview,
  generating
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<{ before: any, after: any } | null>(null);

  // Check if draft has been assembled
  const isDraftAssembled = !!(contentData.title && 
                         contentData.introduction && 
                         contentData.conclusion && 
                         contentData.chapters && 
                         contentData.chapters.length > 0);

  useEffect(() => {
    // Check if previously completed (all components exist and not currently generating)
    if (isDraftAssembled) {
      setIsComplete(isDraftAssembled && !generating && !isGenerating);
    }
  }, [contentData, generating, isGenerating, isDraftAssembled]);

  const handleReview = async () => {
    if (!isDraftAssembled) {
      setError('You need to assemble the draft before reviewing.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      // Store a copy of the current content for before/after comparison
      const beforeContent = {
        title: contentData.title,
        introduction: contentData.introduction?.substring(0, 100) + '...',
        chapters: contentData.chapters?.map(ch => ({
          title: ch.title,
          preview: ch.content?.substring(0, 50) + '...'
        })),
        conclusion: contentData.conclusion?.substring(0, 100) + '...'
      };
      
      const { revisedContent, error: reviewError } = await onReview();
      
      if (reviewError) {
        throw new Error(reviewError);
      }
      
      // If review was successful, create an after summary for display
      if (revisedContent) {
        const afterContent = {
          title: revisedContent.title,
          introduction: revisedContent.introduction?.substring(0, 100) + '...',
          chapters: revisedContent.chapters?.map((ch: any) => ({
            title: ch.title,
            preview: ch.content?.substring(0, 50) + '...'
          })),
          conclusion: revisedContent.conclusion?.substring(0, 100) + '...'
        };
        
        setReviewSummary({ before: beforeContent, after: afterContent });
      }
      
      setIsComplete(true);
    } catch (err: any) {
      setError(err.message || 'Failed to review and revise the eBook');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-display text-ink-dark dark:text-gray-200 mb-2">
        AI Review and Revision
      </h2>
      <p className="text-ink-light dark:text-gray-400 font-serif mb-6">
        Let AI review your eBook for coherence, flow, and quality, and suggest improvements.
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
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-ink-dark dark:text-gray-200 flex items-center">
            <FileSearch className="w-5 h-5 mr-2 text-accent-primary" />
            Review and Revision
          </h3>
        </div>
        
        {!isComplete ? (
          <div className="text-center p-8 border border-dashed border-accent-tertiary/30 dark:border-gray-700 rounded-md">
            <FileSearch className="w-12 h-12 text-accent-primary/50 mx-auto mb-4" />
            <p className="text-ink-light dark:text-gray-400 font-serif mb-4">
              {isDraftAssembled 
                ? 'Your draft is ready to be reviewed by AI for improvements in clarity, coherence, and engagement.'
                : 'You need to assemble your draft before it can be reviewed.'}
            </p>
            <button
              type="button"
              onClick={handleReview}
              disabled={isGenerating || generating || !isDraftAssembled}
              className={`px-5 py-2 rounded mx-auto flex items-center justify-center ${
                isGenerating || generating || !isDraftAssembled
                  ? 'bg-accent-primary/50 cursor-not-allowed text-white/80'
                  : 'bg-accent-primary text-white hover:bg-accent-primary/90'
              } transition-colors`}
            >
              {isGenerating || generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Reviewing and Revising...
                </>
              ) : (
                <>
                  <FileSearch className="w-4 h-4 mr-2" />
                  Start AI Review
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-md p-4">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400 mr-3" />
                <div>
                  <h4 className="text-green-800 dark:text-green-300 font-medium">Review and revision complete!</h4>
                  <p className="text-sm text-green-700 dark:text-green-400 font-serif mt-1">
                    Your eBook has been reviewed and improved for clarity, coherence, and engagement.
                  </p>
                </div>
              </div>
            </div>
            
            {reviewSummary && (
              <div className="bg-white dark:bg-gray-800 rounded-md border border-accent-tertiary/20 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-850 border-b border-accent-tertiary/20 dark:border-gray-700">
                  <h4 className="font-medium text-ink-dark dark:text-gray-200">Review Summary</h4>
                </div>
                
                <div className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0">
                    <div className="flex-1 md:pr-4">
                      <h5 className="text-sm font-medium text-ink-light dark:text-gray-400 mb-2">Before</h5>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-ink-light dark:text-gray-500">Title:</p>
                          <p className="text-sm text-ink-dark dark:text-gray-300 font-serif">
                            {reviewSummary.before.title}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-ink-light dark:text-gray-500">Introduction:</p>
                          <p className="text-sm text-ink-dark dark:text-gray-300 font-serif line-clamp-2">
                            {reviewSummary.before.introduction}
                          </p>
                        </div>
                        {reviewSummary.before.chapters && reviewSummary.before.chapters.length > 0 && (
                          <div>
                            <p className="text-xs text-ink-light dark:text-gray-500">Chapters:</p>
                            <ul className="space-y-1">
                              {reviewSummary.before.chapters.slice(0, 2).map((ch: any, idx: number) => (
                                <li key={idx} className="text-sm text-ink-dark dark:text-gray-300 font-serif">
                                  <span className="font-medium">{ch.title}:</span> {ch.preview}
                                </li>
                              ))}
                              {reviewSummary.before.chapters.length > 2 && (
                                <li className="text-sm text-ink-light dark:text-gray-500 italic">
                                  ...and {reviewSummary.before.chapters.length - 2} more chapters
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-ink-light dark:text-gray-500">Conclusion:</p>
                          <p className="text-sm text-ink-dark dark:text-gray-300 font-serif line-clamp-2">
                            {reviewSummary.before.conclusion}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center md:pt-12">
                      <ArrowRight className="h-6 w-6 text-accent-primary" />
                    </div>
                    
                    <div className="flex-1 md:pl-4">
                      <h5 className="text-sm font-medium text-ink-light dark:text-gray-400 mb-2">After</h5>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-ink-light dark:text-gray-500">Title:</p>
                          <p className="text-sm text-ink-dark dark:text-gray-300 font-serif">
                            {reviewSummary.after.title}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-ink-light dark:text-gray-500">Introduction:</p>
                          <p className="text-sm text-ink-dark dark:text-gray-300 font-serif line-clamp-2">
                            {reviewSummary.after.introduction}
                          </p>
                        </div>
                        {reviewSummary.after.chapters && reviewSummary.after.chapters.length > 0 && (
                          <div>
                            <p className="text-xs text-ink-light dark:text-gray-500">Chapters:</p>
                            <ul className="space-y-1">
                              {reviewSummary.after.chapters.slice(0, 2).map((ch: any, idx: number) => (
                                <li key={idx} className="text-sm text-ink-dark dark:text-gray-300 font-serif">
                                  <span className="font-medium">{ch.title}:</span> {ch.preview}
                                </li>
                              ))}
                              {reviewSummary.after.chapters.length > 2 && (
                                <li className="text-sm text-ink-light dark:text-gray-500 italic">
                                  ...and {reviewSummary.after.chapters.length - 2} more chapters
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-ink-light dark:text-gray-500">Conclusion:</p>
                          <p className="text-sm text-ink-dark dark:text-gray-300 font-serif line-clamp-2">
                            {reviewSummary.after.conclusion}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                The AI review evaluates your eBook for overall coherence, narrative flow, consistency in tone and style,
                completeness of arguments, and reader engagement. It then applies improvements to enhance clarity,
                strengthen transitions, and make your content more compelling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIReviewStep; 