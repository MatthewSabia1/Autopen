import React, { useState, useEffect } from 'react';
import { Pen, Info, Upload, PlusCircle, Search, Wand2 } from 'lucide-react';
import { EbookContent } from '../../../../types/ebook.types';

interface InputStepProps {
  contentData: EbookContent;
  onDataProvided: (content: Partial<EbookContent>) => Promise<{ error: string | null }>;
}

const InputStep: React.FC<InputStepProps> = ({ contentData, onDataProvided }) => {
  const [inputMethod, setInputMethod] = useState<'manual' | 'brain-dump'>('manual');
  const [rawData, setRawData] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Initialize form with existing data if available
  useEffect(() => {
    if (contentData.rawData) {
      setRawData(contentData.rawData);
      setSubmitted(true);
    }
  }, [contentData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rawData.trim()) {
      setError('Please enter some content for your eBook');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const { error } = await onDataProvided({ rawData });
      
      if (error) {
        throw new Error(error);
      }
      
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save content');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-display text-ink-dark dark:text-gray-200 mb-2">Input Data</h2>
      <p className="text-ink-light dark:text-gray-400 font-serif mb-6">
        Provide data for your eBook. This can be notes, bullet points, or any text that will form the basis of your content.
      </p>
      
      {submitted && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <PlusCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Data received</h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-400 font-serif">
                <p>Your data has been saved and is ready for processing. You can now auto-generate your complete eBook or manually customize each step.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
      
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <Wand2 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Auto-Generation Available</h3>
            <div className="mt-1 text-sm text-blue-700 dark:text-blue-400 font-serif">
              <p>
                After submitting your data, you'll have the option to auto-generate your complete eBook in one step, 
                or you can proceed manually to customize each part of the creation process.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex border-b border-accent-tertiary/20 dark:border-gray-700">
          <button
            type="button"
            className={`px-4 py-2 font-serif text-sm flex items-center ${
              inputMethod === 'manual'
                ? 'border-b-2 border-accent-primary text-accent-primary dark:text-accent-primary'
                : 'text-ink-light dark:text-gray-400 hover:text-accent-primary/90 dark:hover:text-accent-primary/80'
            }`}
            onClick={() => setInputMethod('manual')}
          >
            <Pen className="w-4 h-4 mr-2" />
            Manual Input
          </button>
          <button
            type="button"
            className={`px-4 py-2 font-serif text-sm flex items-center ${
              inputMethod === 'brain-dump'
                ? 'border-b-2 border-accent-primary text-accent-primary dark:text-accent-primary'
                : 'text-ink-light dark:text-gray-400 hover:text-accent-primary/90 dark:hover:text-accent-primary/80'
            }`}
            onClick={() => setInputMethod('brain-dump')}
          >
            <Search className="w-4 h-4 mr-2" />
            From Brain Dump
          </button>
        </div>
      </div>
      
      {inputMethod === 'manual' ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="raw-data" className="block text-sm font-medium text-ink-dark dark:text-gray-300 mb-2">
              Enter your eBook data
            </label>
            <textarea
              id="raw-data"
              rows={15}
              className="w-full px-4 py-3 border border-accent-tertiary/30 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-ink-dark dark:text-gray-200 font-serif focus:border-accent-primary focus:ring focus:ring-accent-primary/20 dark:focus:ring-accent-primary/30 transition-colors"
              placeholder="Enter your notes, research, or any information you want to use as the basis for your eBook..."
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              disabled={isSubmitting}
            ></textarea>
            <p className="mt-2 text-xs text-ink-light dark:text-gray-500 font-serif">
              The more detailed and structured your input, the better your eBook will be.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !rawData.trim()}
              className={`px-5 py-2 rounded-md flex items-center ${
                isSubmitting || !rawData.trim()
                  ? 'bg-accent-primary/50 cursor-not-allowed text-white/80'
                  : 'bg-accent-primary text-white hover:bg-accent-primary/90'
              } transition-colors`}
            >
              {isSubmitting ? 'Saving...' : submitted ? 'Update Data' : 'Save Data'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-cream dark:bg-gray-850 rounded-md p-6 text-center">
          <h3 className="text-lg font-medium text-ink-dark dark:text-gray-200 mb-2">
            Select from Brain Dump
          </h3>
          <p className="text-ink-light dark:text-gray-400 font-serif mb-4">
            Choose content you've already created in the Brain Dump tool.
          </p>
          <p className="text-ink-light dark:text-gray-400 font-serif mb-4">
            This feature is coming soon. Please use manual input for now.
          </p>
          <button
            type="button"
            className="px-5 py-2 rounded-md bg-accent-secondary text-white hover:bg-accent-secondary/90 transition-colors flex items-center mx-auto"
            onClick={() => setInputMethod('manual')}
          >
            <Pen className="w-4 h-4 mr-2" />
            Switch to Manual Input
          </button>
        </div>
      )}
    </div>
  );
};

export default InputStep; 