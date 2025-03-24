import React, { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, Check, Edit3, Info } from 'lucide-react';
import { EbookContent } from '../../../../types/ebook.types';

interface IntroductionStepProps {
  contentData: EbookContent;
  onGenerate: () => Promise<{ introduction?: string; error: string | null }>;
  onSaveIntroduction: (content: Partial<EbookContent>) => Promise<{ error: string | null }>;
  generating: boolean;
}

const IntroductionStep: React.FC<IntroductionStepProps> = ({
  contentData,
  onGenerate,
  onSaveIntroduction,
  generating
}) => {
  const [introduction, setIntroduction] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with existing introduction if available
  useEffect(() => {
    if (contentData.introduction) {
      setIntroduction(contentData.introduction);
    }
  }, [contentData]);

  const handleGenerate = async () => {
    if (!contentData?.title || !contentData?.tableOfContents) {
      setError('Title and table of contents are required before generating an introduction.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const { introduction: generatedIntroduction, error: generateError } = await onGenerate();
      
      if (generateError) {
        throw new Error(generateError);
      }
      
      if (generatedIntroduction) {
        setIntroduction(generatedIntroduction);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate introduction');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveIntroduction = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const { error: saveError } = await onSaveIntroduction({ introduction });
      
      if (saveError) {
        throw new Error(saveError);
      }
      
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save introduction');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setIntroduction(contentData.introduction || '');
  };

  return (
    <div>
      <h2 className="text-xl font-display text-ink-dark dark:text-gray-200 mb-2">
        Introduction
      </h2>
      <p className="text-ink-light dark:text-gray-400 font-serif mb-6">
        Create an engaging introduction for your eBook that hooks readers and sets expectations.
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
            <BookOpen className="w-5 h-5 mr-2 text-accent-primary" />
            {contentData.title ? `Introduction for "${contentData.title}"` : 'eBook Introduction'}
          </h3>
          {introduction && !isEditing && (
            <button
              type="button"
              onClick={handleStartEditing}
              className="px-3 py-1.5 text-sm border border-accent-tertiary/30 dark:border-gray-600 text-ink-dark dark:text-gray-300 rounded hover:bg-accent-tertiary/10 dark:hover:bg-gray-800 transition-colors flex items-center"
            >
              <Edit3 className="w-4 h-4 mr-1.5" />
              Edit
            </button>
          )}
        </div>
        
        {introduction && !isEditing ? (
          <div className="bg-white dark:bg-gray-800 p-5 rounded border border-accent-tertiary/20 dark:border-gray-700">
            <div className="prose prose-sm dark:prose-invert max-w-none font-serif prose-headings:font-display">
              <div dangerouslySetInnerHTML={{ __html: introduction.replace(/\n/g, '<br>') }} />
            </div>
          </div>
        ) : isEditing ? (
          <div>
            <textarea
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              className="w-full px-4 py-3 border border-accent-tertiary/30 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-ink-dark dark:text-gray-200 font-serif focus:border-accent-primary focus:ring focus:ring-accent-primary/20 dark:focus:ring-accent-primary/30 transition-colors"
              rows={15}
              placeholder="Write your introduction here..."
            ></textarea>
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={handleCancelEditing}
                className="px-4 py-2 border border-accent-tertiary/30 dark:border-gray-600 text-ink-dark dark:text-gray-300 rounded hover:bg-accent-tertiary/10 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveIntroduction}
                disabled={isSaving || !introduction.trim()}
                className={`px-4 py-2 rounded flex items-center ${
                  isSaving || !introduction.trim()
                    ? 'bg-accent-primary/50 cursor-not-allowed text-white/80'
                    : 'bg-accent-primary text-white hover:bg-accent-primary/90'
                } transition-colors`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Introduction
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-accent-tertiary/30 dark:border-gray-700 rounded-md">
            <BookOpen className="w-12 h-12 text-accent-primary/50 mx-auto mb-4" />
            <p className="text-ink-light dark:text-gray-400 font-serif mb-4">
              {contentData.title && contentData.tableOfContents
                ? `Generate an introduction for "${contentData.title}" based on your table of contents.`
                : 'You need a title and table of contents before generating an introduction.'}
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || generating || !contentData.title || !contentData.tableOfContents}
              className={`px-5 py-2 rounded mx-auto flex items-center ${
                isGenerating || generating || !contentData.title || !contentData.tableOfContents
                  ? 'bg-accent-primary/50 cursor-not-allowed text-white/80'
                  : 'bg-accent-primary text-white hover:bg-accent-primary/90'
              } transition-colors`}
            >
              {isGenerating || generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Generate Introduction
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
                A strong introduction hooks your readers and sets clear expectations for the eBook.
                The AI will generate an introduction based on your title and table of contents,
                but you can also edit it to add your personal touch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroductionStep; 