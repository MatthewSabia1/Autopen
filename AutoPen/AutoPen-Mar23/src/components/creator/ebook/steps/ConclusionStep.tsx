import React, { useState, useEffect } from 'react';
import { ScrollText, RefreshCw, Check, Edit3, Info } from 'lucide-react';
import { EbookContent } from '../../../../types/ebook.types';

interface ConclusionStepProps {
  contentData: EbookContent;
  onGenerate: () => Promise<{ conclusion?: string; error: string | null }>;
  onSaveConclusion: (content: Partial<EbookContent>) => Promise<{ error: string | null }>;
  generating: boolean;
}

const ConclusionStep: React.FC<ConclusionStepProps> = ({
  contentData,
  onGenerate,
  onSaveConclusion,
  generating
}) => {
  const [conclusion, setConclusion] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with existing conclusion if available
  useEffect(() => {
    if (contentData.conclusion) {
      setConclusion(contentData.conclusion);
    }
  }, [contentData]);

  const handleGenerate = async () => {
    if (!contentData?.title || !contentData?.tableOfContents) {
      setError('Title and table of contents are required before generating a conclusion.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const { conclusion: generatedConclusion, error: generateError } = await onGenerate();
      
      if (generateError) {
        throw new Error(generateError);
      }
      
      if (generatedConclusion) {
        setConclusion(generatedConclusion);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate conclusion');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveConclusion = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const { error: saveError } = await onSaveConclusion({ conclusion });
      
      if (saveError) {
        throw new Error(saveError);
      }
      
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save conclusion');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setConclusion(contentData.conclusion || '');
  };

  return (
    <div>
      <h2 className="text-xl font-display text-ink-dark dark:text-gray-200 mb-2">
        Conclusion
      </h2>
      <p className="text-ink-light dark:text-gray-400 font-serif mb-6">
        Create a compelling conclusion that summarizes key points and leaves readers with a lasting impression.
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
            <ScrollText className="w-5 h-5 mr-2 text-accent-primary" />
            {contentData.title ? `Conclusion for "${contentData.title}"` : 'eBook Conclusion'}
          </h3>
          {conclusion && !isEditing && (
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
        
        {conclusion && !isEditing ? (
          <div className="bg-white dark:bg-gray-800 p-5 rounded border border-accent-tertiary/20 dark:border-gray-700">
            <div className="prose prose-sm dark:prose-invert max-w-none font-serif prose-headings:font-display">
              <div dangerouslySetInnerHTML={{ __html: conclusion.replace(/\n/g, '<br>') }} />
            </div>
          </div>
        ) : isEditing ? (
          <div>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              className="w-full px-4 py-3 border border-accent-tertiary/30 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-ink-dark dark:text-gray-200 font-serif focus:border-accent-primary focus:ring focus:ring-accent-primary/20 dark:focus:ring-accent-primary/30 transition-colors"
              rows={15}
              placeholder="Write your conclusion here..."
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
                onClick={handleSaveConclusion}
                disabled={isSaving || !conclusion.trim()}
                className={`px-4 py-2 rounded flex items-center ${
                  isSaving || !conclusion.trim()
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
                    Save Conclusion
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-accent-tertiary/30 dark:border-gray-700 rounded-md">
            <ScrollText className="w-12 h-12 text-accent-primary/50 mx-auto mb-4" />
            <p className="text-ink-light dark:text-gray-400 font-serif mb-4">
              {contentData.title && contentData.tableOfContents
                ? `Generate a conclusion for "${contentData.title}" that summarizes your chapters.`
                : 'You need a title and table of contents before generating a conclusion.'}
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
                  <ScrollText className="w-4 h-4 mr-2" />
                  Generate Conclusion
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
                A good conclusion summarizes the key points from your chapters, reinforces your central message,
                and provides the reader with actionable takeaways or a memorable closing thought.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConclusionStep; 