import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookText, ArrowLeft, Trash2, Loader, AlertCircle, Wand2, BookCopy, Check } from 'lucide-react';
import { useBrainDump } from '../hooks/useBrainDump';
import { AnalysisResult } from '../types/BrainDumpTypes';

const BrainDumpDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBrainDump, deleteBrainDump, convertToCreatorContent } = useBrainDump();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brainDump, setBrainDump] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  
  useEffect(() => {
    const fetchBrainDump = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await getBrainDump(id);
        
        if (error) {
          setError(error);
          return;
        }
        
        if (data) {
          setBrainDump(data);
          
          // Parse the JSON content
          if (data.content) {
            try {
              const parsed = JSON.parse(data.content);
              setAnalysisResult(parsed);
            } catch (parseError) {
              console.error('Error parsing brain dump content:', parseError);
              setError('Error parsing brain dump content');
            }
          }
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching brain dump');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBrainDump();
  }, [id, getBrainDump]);
  
  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      const { error } = await deleteBrainDump(id);
      
      if (error) {
        setError(`Error deleting brain dump: ${error}`);
        return;
      }
      
      // Navigate back to the list after successful deletion
      navigate('/brain-dumps');
    } catch (err: any) {
      setError(err.message || 'Error deleting brain dump');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleCreateEbook = async () => {
    if (!id || !brainDump) return;
    
    try {
      setIsConverting(true);
      setError(null);
      
      // Check if we have analysis result content
      if (!analysisResult) {
        setError("Cannot create eBook: Missing or invalid analysis data");
        setIsConverting(false);
        return;
      }
      
      const { data, error } = await convertToCreatorContent(id, 'ebook', brainDump.title);
      
      if (error) {
        setError(`Error creating eBook: ${error}`);
        return;
      }
      
      if (data) {
        // Redirect to the creator page with the content ID
        navigate(`/creator/ebook/${data.id}`);
      } else {
        setError("Failed to create eBook: No data returned from the server");
      }
    } catch (err: any) {
      console.error("Error in handleCreateEbook:", err);
      setError(err.message || 'Error creating eBook');
    } finally {
      setIsConverting(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-paper dark:bg-gray-800 rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-gray-700 p-6 mt-6">
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 text-accent-primary animate-spin" />
        </div>
      </div>
    );
  }
  
  if (error || !brainDump || !analysisResult) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-paper dark:bg-gray-800 rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-gray-700 p-6 mt-6">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate('/brain-dumps')}
            className="mr-3 p-2 rounded-full hover:bg-accent-tertiary/10 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-ink-light dark:text-gray-400" />
          </button>
          <h2 className="font-display text-2xl text-ink-dark dark:text-gray-200">Brain Dump</h2>
        </div>
        
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md flex items-start text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-serif font-semibold mb-1">Error</p>
            <p className="font-serif text-sm">{error || 'Could not load brain dump data'}</p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate('/brain-dumps')}
            className="px-4 py-2 font-serif text-sm bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
          >
            Back to Brain Dumps
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto bg-paper dark:bg-gray-800 rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-gray-700 p-6 mt-6 mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/brain-dumps')}
            className="mr-3 p-2 rounded-full hover:bg-accent-tertiary/10 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-ink-light dark:text-gray-400" />
          </button>
          <div>
            <h2 className="font-display text-2xl text-ink-dark dark:text-gray-200">{brainDump.title}</h2>
            <p className="font-serif text-sm text-ink-faded dark:text-gray-500">
              Created {formatDate(brainDump.created_at)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {isDeleting ? (
            <button className="p-2 text-ink-faded dark:text-gray-500 cursor-not-allowed">
              <Loader className="w-5 h-5 animate-spin" />
            </button>
          ) : (
            <button
              onClick={handleDelete}
              className="p-2 text-ink-faded dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Delete brain dump"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md flex items-start text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <p className="font-serif text-sm">{error}</p>
        </div>
      )}
      
      {/* Brain Dump Content */}
      <div className="mb-8">
        <div className="mb-6 p-4 bg-cream dark:bg-gray-700 rounded-md border border-accent-tertiary/20 dark:border-gray-600">
          <h3 className="font-serif font-semibold text-lg text-ink-dark dark:text-gray-200 mb-2">Content Summary</h3>
          <p className="font-serif text-ink-light dark:text-gray-300 leading-relaxed">
            {analysisResult.summary}
          </p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <BookText className="w-5 h-5 text-accent-secondary mr-2" />
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
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 border-t border-accent-tertiary/20 dark:border-gray-700 pt-6">
        <button
          onClick={handleCreateEbook}
          disabled={isConverting}
          className={`px-6 py-3 font-serif rounded flex items-center justify-center ${
            isConverting
              ? 'bg-accent-secondary/50 text-white/70 cursor-not-allowed'
              : 'bg-accent-secondary text-white hover:bg-accent-secondary/90 transition-colors'
          }`}
        >
          {isConverting ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Creating eBook...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Create eBook with AI
            </>
          )}
        </button>
        
        <button
          onClick={() => navigate('/creator')}
          className="px-6 py-3 font-serif bg-accent-primary/10 dark:bg-accent-primary/20 text-accent-primary dark:text-accent-primary/90 border border-accent-primary/20 dark:border-accent-primary/30 rounded hover:bg-accent-primary/20 dark:hover:bg-accent-primary/30 transition-colors flex items-center justify-center"
        >
          <BookCopy className="w-5 h-5 mr-2" />
          Develop Manually
        </button>
      </div>
    </div>
  );
};

export default BrainDumpDetail;