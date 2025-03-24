import React, { useState } from 'react';
import { BookText, Lightbulb, BookCopy, Check, AlertCircle, Wand2, Save, Loader } from 'lucide-react';
import { useAnalysis } from '../contexts/AnalysisContext';
import { useNavigate } from 'react-router-dom';
import { useBrainDump } from '../hooks/useBrainDump';
import { useAuth } from '../contexts/AuthContext';

const ResultsDisplay: React.FC = () => {
  const { analysisResult, isAnalysisComplete } = useAnalysis();
  const { saveBrainDump, convertToCreatorContent } = useBrainDump();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [title, setTitle] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  if (!isAnalysisComplete || !analysisResult) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-paper dark:bg-gray-800 rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-gray-700 p-6 mt-8 mb-12">
        <div className="text-center py-8">
          <BookText className="w-12 h-12 text-accent-tertiary/40 dark:text-gray-600 mx-auto mb-3" />
          <p className="font-serif text-ink-light dark:text-gray-400 mb-4">
            Submit content using the Brain Dump tool above to see AI-generated e-book ideas.
          </p>
        </div>
      </div>
    );
  }
  
  // Check if user is signed in
  const isAuthenticated = !!user;

  // Handle save action
  const handleSave = async () => {
    if (!isAuthenticated) {
      setSaveError('Please sign in to save your analysis');
      return;
    }
    
    if (!title.trim()) {
      setSaveError('Please enter a title for your analysis');
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const { data, error } = await saveBrainDump(analysisResult, title);
      
      if (error) {
        setSaveError(error);
      } else if (data) {
        setSaveSuccess(true);
        setShowSaveForm(false);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error saving analysis');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Create eBook from brain dump analysis
  const handleCreateEbook = async () => {
    if (!isAuthenticated) {
      setSaveError('Please sign in to create an eBook');
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // First save the brain dump
      let brainDumpId;
      
      if (!saveSuccess) {
        const saveTitle = title.trim() || 'Untitled Analysis';
        const { data, error } = await saveBrainDump(analysisResult, saveTitle);
        
        if (error) {
          setSaveError(`Failed to save analysis: ${error}`);
          setIsSaving(false);
          return;
        }
        
        brainDumpId = data?.id;
      }
      
      // If successfully saved or already saved, convert to creator content
      if (brainDumpId) {
        const { data, error } = await convertToCreatorContent(brainDumpId, 'ebook', title);
        
        if (error) {
          setSaveError(`Failed to create eBook: ${error}`);
        } else if (data) {
          // Redirect to the creator page with the content ID
          navigate(`/creator/ebook/${data.id}`);
          return;
        }
      } else {
        setSaveError('Could not create eBook: Missing brain dump ID');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error creating eBook');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if there was an error during analysis
  // Note: If we have mock data, we still want to show it even with an error
  const hasError = !!analysisResult.error && 
    (!analysisResult.error.includes('Using mock data:') || !analysisResult.ebookIdeas?.length);

  return (
    <div className="w-full max-w-4xl mx-auto bg-paper dark:bg-gray-800 rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-gray-700 p-6 mt-8 mb-12">
      <div className="flex items-center mb-4">
        <BookText className="w-6 h-6 text-accent-primary mr-2" />
        <h2 className="font-display text-2xl text-ink-dark dark:text-gray-200">Analysis Results</h2>
      </div>

      {hasError ? (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800/30 flex items-start text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-serif font-semibold mb-1">Analysis Error</p>
            <p className="font-serif text-sm">{analysisResult.error}</p>
            
            {/* Specific guidance for auth errors */}
            {(analysisResult.error?.includes('auth') || analysisResult.error?.includes('API key')) && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded border border-amber-200 dark:border-amber-800/20 text-amber-700 dark:text-amber-400 text-xs">
                <p className="font-semibold mb-1">Authentication Issue</p>
                <p className="mb-2">The application is unable to access the AI service due to authentication issues.</p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Check that you have a valid OpenRouter API key configured</li>
                  <li>Verify that the API key has proper permissions</li>
                  <li>Contact support if issues persist</li>
                </ul>
              </div>
            )}
            
            {/* Show mock data notification if in development with mock data */}
            {analysisResult.error?.includes('Using mock data:') && analysisResult.ebookIdeas?.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded border border-blue-200 dark:border-blue-800/20 text-blue-700 dark:text-blue-400 text-xs">
                <p className="font-semibold">Development Mode</p>
                <p>Using mock data for development. Connect a valid API key for production use.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Show mock data notification at the top when showing mock results */}
          {analysisResult.error?.includes('Using mock data:') && (
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/10 rounded border border-blue-200 dark:border-blue-800/20 text-blue-700 dark:text-blue-400 text-sm flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Development Mode</p>
                <p className="text-xs">Using mock data for development. To see real AI analysis, connect a valid API key for production use.</p>
              </div>
            </div>
          )}
        
          <div className="mb-6 p-4 bg-cream dark:bg-gray-700 rounded-md border border-accent-tertiary/20 dark:border-gray-600">
            <h3 className="font-serif font-semibold text-lg text-ink-dark dark:text-gray-200 mb-2">Content Summary</h3>
            <p className="font-serif text-ink-light dark:text-gray-300 leading-relaxed">
              {analysisResult.summary}
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-4">
              <Lightbulb className="w-5 h-5 text-accent-secondary mr-2" />
              <h3 className="font-serif font-semibold text-lg text-ink-dark dark:text-gray-200">E-book Ideas</h3>
            </div>

            <div className="space-y-4">
              {analysisResult.ebookIdeas.map((idea, index) => (
                <div key={index} className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md hover:shadow-md transition-shadow dark:bg-gray-750">
                  <h4 className="font-display text-xl text-ink-dark dark:text-gray-200 mb-2">"{idea.title}"</h4>
                  <p className="font-serif text-ink-light dark:text-gray-300 mb-3">{idea.description}</p>
                  
                  <div className="mt-4">
                    <h5 className="font-serif font-semibold text-ink-light dark:text-gray-400 text-sm mb-2">Suggested Chapters:</h5>
                    <ul className="space-y-1">
                      {idea.chapters.map((chapter, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className="w-4 h-4 text-accent-primary mt-1 mr-2 flex-shrink-0" />
                          <span className="font-serif text-ink-light dark:text-gray-300">{chapter}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => {
                        // Use this idea title as the default title if not set already
                        if (!title) {
                          setTitle(idea.title);
                        }
                        
                        // Show the save form if not already saved
                        if (!isAuthenticated && !saveSuccess) {
                          setShowSaveForm(true);
                          setSaveError('Please sign in to create an eBook or save your work');
                        } else {
                          handleCreateEbook();
                        }
                      }}
                      disabled={isSaving}
                      className={`flex-1 px-4 py-2 font-serif text-sm border rounded flex items-center justify-center
                        ${isSaving 
                          ? 'bg-accent-secondary/50 text-white/70 border-accent-secondary/50 cursor-not-allowed' 
                          : 'bg-accent-secondary text-white border-accent-secondary hover:bg-accent-secondary/90 transition-colors'}`}
                    >
                      {isSaving ? (
                        <>
                          <Loader className="w-4 h-4 mr-1 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-1" />
                          Create eBook
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => navigate('/products')}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 font-serif text-sm bg-accent-primary/10 dark:bg-accent-primary/20 text-accent-primary dark:text-accent-primary/90 border border-accent-primary/20 dark:border-accent-primary/30 rounded hover:bg-accent-primary/20 dark:hover:bg-accent-primary/30 transition-colors flex items-center justify-center"
                    >
                      <BookCopy className="w-4 h-4 mr-1" />
                      Develop Manually
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Save Analysis Form */}
      {showSaveForm && (
        <div className="mb-6 p-4 bg-cream dark:bg-gray-700 rounded-md border border-accent-tertiary/20 dark:border-gray-600">
          <h3 className="font-serif font-semibold text-lg text-ink-dark dark:text-gray-200 mb-2">Save Analysis</h3>
          
          <div className="mb-4">
            <label htmlFor="analysisTitle" className="block font-serif text-sm text-ink-light dark:text-gray-400 mb-1">Analysis Title</label>
            <input
              type="text"
              id="analysisTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your analysis"
              className="w-full p-2 font-serif bg-paper dark:bg-gray-800 border border-accent-tertiary/30 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary dark:text-gray-200"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowSaveForm(false)}
              className="px-3 py-1.5 font-serif text-sm text-ink-light dark:text-gray-400 hover:text-ink-dark dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className={`flex items-center px-4 py-1.5 font-serif text-sm text-white rounded
                ${isSaving || !title.trim() ? 'bg-accent-primary/40 cursor-not-allowed' : 'bg-accent-primary hover:bg-accent-primary/90 transition-colors'}`}
            >
              {isSaving ? (
                <>
                  <Loader className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save Analysis
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Save/Error Messages */}
      {saveError && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800/30 flex items-start text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
          <p className="font-serif text-sm">{saveError}</p>
        </div>
      )}
      
      {saveSuccess && (
        <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800/30 flex items-start text-green-700 dark:text-green-400">
          <Check className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
          <p className="font-serif text-sm">Analysis saved successfully! You can now access it from your dashboard.</p>
        </div>
      )}
      
      <div className="flex justify-between items-center border-t border-accent-tertiary/20 dark:border-gray-700 pt-4 mt-6">
        <p className="font-serif text-sm text-ink-faded dark:text-gray-500">
          Analysis {hasError ? 'failed' : 'completed successfully'}
        </p>
        <div className="flex space-x-3">
          {!showSaveForm && !saveSuccess && (
            <button 
              onClick={() => setShowSaveForm(true)}
              className="px-4 py-2 font-serif text-sm flex items-center bg-accent-secondary/10 dark:bg-accent-secondary/20 text-accent-secondary dark:text-accent-secondary/90 border border-accent-secondary/20 dark:border-accent-secondary/30 rounded hover:bg-accent-secondary/20 dark:hover:bg-accent-secondary/30 transition-colors"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save Analysis
            </button>
          )}
          <button 
            onClick={() => navigate('/products')}
            className="px-4 py-2 font-serif text-sm bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
          >
            Start New Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;