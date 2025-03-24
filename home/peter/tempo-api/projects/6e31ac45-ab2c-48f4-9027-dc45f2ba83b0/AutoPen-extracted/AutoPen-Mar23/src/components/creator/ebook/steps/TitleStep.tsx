import React, { useState, useEffect } from 'react';
import { Wand2, RefreshCw, Info, Pencil, CheckCircle } from 'lucide-react';
import { EbookContent } from '../../../../types/ebook.types';

interface TitleStepProps {
  contentData: EbookContent;
  onGenerate: (rawData: string) => Promise<{ title?: string; error: string | null }>;
  onSaveTitle: (content: Partial<EbookContent>) => Promise<{ error: string | null }>;
  generating: boolean;
}

const TitleStep: React.FC<TitleStepProps> = ({
  contentData,
  onGenerate,
  onSaveTitle,
  generating
}) => {
  const [title, setTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);

  // Initialize with existing title if available
  useEffect(() => {
    if (contentData.title) {
      setTitle(contentData.title);
      setGenerationComplete(true);
    }
  }, [contentData]);

  const handleGenerate = async () => {
    if (!contentData.rawData) {
      setError('No data available for title generation. Please go back to the Input step.');
      return;
    }
    
    try {
      setIsGenerating(true);
      setError(null);
      
      const { title: generatedTitle, error: generateError } = await onGenerate(contentData.rawData);
      
      if (generateError) {
        throw new Error(generateError);
      }
      
      if (generatedTitle) {
        setTitle(generatedTitle);
        setGenerationComplete(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate title');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!title.trim()) {
      setError('Please enter a title for your eBook');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      const { error: saveError } = await onSaveTitle({ title });
      
      if (saveError) {
        throw new Error(saveError);
      }
      
      setIsEditing(false);
      setGenerationComplete(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save title');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-display text-ink-dark dark:text-gray-200 mb-2">Generate a Title</h2>
      <p className="text-ink-light dark:text-gray-400 font-serif mb-6">
        Create an attention-grabbing title for your eBook based on your input data.
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
          <h3 className="text-lg font-medium text-ink-dark dark:text-gray-200">
            Your eBook Title
          </h3>
          {generationComplete && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-accent-primary hover:text-accent-primary/80 transition-colors flex items-center text-sm"
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-xl font-display border border-accent-tertiary/30 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-ink-dark dark:text-gray-200 focus:border-accent-primary focus:ring focus:ring-accent-primary/20 dark:focus:ring-accent-primary/30 transition-colors mb-4"
              placeholder="Enter a title for your eBook..."
              disabled={isSaving}
            />
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setTitle(contentData.title || '');
                }}
                className="px-4 py-2 border border-accent-tertiary/30 dark:border-gray-600 text-ink-light dark:text-gray-400 rounded hover:bg-accent-tertiary/10 dark:hover:bg-gray-800 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTitle}
                disabled={isSaving || !title.trim()}
                className={`px-5 py-2 rounded flex items-center ${
                  isSaving || !title.trim()
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
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Title
                  </>
                )}
              </button>
            </div>
          </div>
        ) : generationComplete ? (
          <div className="bg-white dark:bg-gray-800 p-5 rounded border border-accent-tertiary/20 dark:border-gray-700">
            <h2 className="text-2xl text-ink-dark dark:text-gray-200 font-display text-center">
              {title}
            </h2>
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-accent-tertiary/30 dark:border-gray-700 rounded-md">
            <p className="text-ink-light dark:text-gray-400 font-serif mb-4">
              Click the button below to generate a title for your eBook based on your input data.
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
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Title
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
                A good eBook title should be attention-grabbing, clear, and reflect the content of your book.
                We use AI to analyze your input data and create a title that will appeal to your target audience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleStep; 