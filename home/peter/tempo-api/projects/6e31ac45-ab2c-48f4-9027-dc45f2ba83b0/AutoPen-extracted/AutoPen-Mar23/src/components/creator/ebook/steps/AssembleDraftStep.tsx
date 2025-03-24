import React, { useState } from 'react';
import { BookOpen, RefreshCw, CheckCircle, Info, Check } from 'lucide-react';
import { EbookContent, EbookChapter } from '../../../../types/ebook.types';

interface AssembleDraftStepProps {
  contentData: EbookContent;
  chapters: EbookChapter[];
  onAssemble: () => Promise<{ error: string | null }>;
  generating: boolean;
}

const AssembleDraftStep: React.FC<AssembleDraftStepProps> = ({
  contentData,
  chapters,
  onAssemble,
  generating
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Check if all components are available
  const hasMissingComponents = !contentData.title || 
                              !contentData.introduction || 
                              !contentData.conclusion || 
                              chapters.length === 0;

  // Count the content completeness
  const totalComponents = 3 + (chapters?.length || 0); // Title, Intro, Conclusion + Chapters
  const completedComponents = [
    contentData.title ? 1 : 0, 
    contentData.introduction ? 1 : 0, 
    contentData.conclusion ? 1 : 0
  ].reduce((a, b) => a + b, 0) + chapters.filter(ch => ch.content).length;
  
  const completionPercentage = totalComponents > 0 
    ? Math.round((completedComponents / totalComponents) * 100) 
    : 0;

  const handleAssemble = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const { error: assembleError } = await onAssemble();
      
      if (assembleError) {
        throw new Error(assembleError);
      }
      
      setIsComplete(true);
    } catch (err: any) {
      setError(err.message || 'Failed to assemble draft');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-display text-ink-dark dark:text-gray-200 mb-2">
        Assemble Draft
      </h2>
      <p className="text-ink-light dark:text-gray-400 font-serif mb-6">
        Combine all components into a cohesive draft eBook ready for review.
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
            <BookOpen className="w-5 h-5 mr-2 text-accent-primary" />
            Draft Assembly
          </h3>
          <div className="text-sm text-ink-light dark:text-gray-400">
            <span className={completionPercentage === 100 ? 'text-green-600 dark:text-green-400' : ''}>
              {completionPercentage}% Complete
            </span>
          </div>
        </div>
        
        <div className="space-y-4 mb-8">
          <div className={`p-4 rounded-md border ${
            contentData.title 
              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30' 
              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-center">
              {contentData.title ? (
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 mr-2"></div>
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  contentData.title 
                    ? 'text-green-800 dark:text-green-300' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Title
                </h4>
                {contentData.title && (
                  <p className="text-sm text-green-700 dark:text-green-400 font-serif mt-1">
                    {contentData.title}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-md border ${
            contentData.introduction 
              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30' 
              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-start">
              {contentData.introduction ? (
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 mr-2 mt-0.5"></div>
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  contentData.introduction 
                    ? 'text-green-800 dark:text-green-300' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Introduction
                </h4>
                {contentData.introduction && (
                  <p className="text-sm text-green-700 dark:text-green-400 font-serif mt-1 line-clamp-2">
                    {contentData.introduction.substring(0, 100)}...
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-md border ${
            chapters.length > 0 
              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30' 
              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-start">
              {chapters.length > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 mr-2 mt-0.5"></div>
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  chapters.length > 0 
                    ? 'text-green-800 dark:text-green-300' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Chapters
                </h4>
                {chapters.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {chapters.map((chapter, index) => (
                      <div 
                        key={chapter.id || index} 
                        className="flex items-center text-sm"
                      >
                        {chapter.content ? (
                          <Check className="h-4 w-4 text-green-500 dark:text-green-400 mr-1.5" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 mr-1.5"></div>
                        )}
                        <span className={chapter.content 
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-500'
                        }>
                          Chapter {index + 1}: {chapter.title}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-500 font-serif mt-1">
                    No chapters available
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className={`p-4 rounded-md border ${
            contentData.conclusion 
              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30' 
              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-start">
              {contentData.conclusion ? (
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 mr-2 mt-0.5"></div>
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  contentData.conclusion 
                    ? 'text-green-800 dark:text-green-300' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  Conclusion
                </h4>
                {contentData.conclusion && (
                  <p className="text-sm text-green-700 dark:text-green-400 font-serif mt-1 line-clamp-2">
                    {contentData.conclusion.substring(0, 100)}...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          {isComplete ? (
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-md p-4">
              <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400 mx-auto mb-2" />
              <h4 className="text-green-800 dark:text-green-300 font-medium">Draft assembled successfully!</h4>
              <p className="text-sm text-green-700 dark:text-green-400 font-serif mt-1">
                Your eBook draft is now ready for AI review and revision.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAssemble}
              disabled={isGenerating || generating || hasMissingComponents}
              className={`px-5 py-2 rounded mx-auto flex items-center justify-center ${
                isGenerating || generating || hasMissingComponents
                  ? 'bg-accent-primary/50 cursor-not-allowed text-white/80'
                  : 'bg-accent-primary text-white hover:bg-accent-primary/90'
              } transition-colors`}
            >
              {isGenerating || generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Assembling Draft...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Assemble Draft
                </>
              )}
            </button>
          )}
        </div>
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
                This step combines all your eBook components (title, introduction, chapters, and conclusion)
                into a cohesive draft. Make sure all components are complete before assembling your draft.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssembleDraftStep; 