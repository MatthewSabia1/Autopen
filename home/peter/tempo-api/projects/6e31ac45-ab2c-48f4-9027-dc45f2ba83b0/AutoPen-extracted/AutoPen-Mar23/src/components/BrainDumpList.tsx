import React, { useEffect, useState } from 'react';
import { BookText, File, Trash2, ArrowRight, FileText, Loader, Search, Filter, Plus } from 'lucide-react';
import { useBrainDump } from '../hooks/useBrainDump';
import { useNavigate } from 'react-router-dom';

const BrainDumpList: React.FC = () => {
  const { brainDumps, loading, error, fetchBrainDumps, deleteBrainDump, convertToCreatorContent } = useBrainDump();
  const navigate = useNavigate();
  
  const [search, setSearch] = useState('');
  const [isDeleting, setIsDeleting] = useState<{[key: string]: boolean}>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [converting, setConverting] = useState<{[key: string]: boolean}>({});
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alpha'>('newest');
  
  // Re-fetch brain dumps on component mount
  useEffect(() => {
    fetchBrainDumps();
  }, [fetchBrainDumps]);
  
  // Filter brain dumps based on search term
  const filteredBrainDumps = brainDumps.filter(dump => 
    dump.title.toLowerCase().includes(search.toLowerCase())
  );

  // Sort brain dumps based on selected sort order
  const sortedBrainDumps = [...filteredBrainDumps].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    } else if (sortOrder === 'oldest') {
      return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });
  
  // Handle delete
  const handleDelete = async (id: string) => {
    setIsDeleting(prev => ({ ...prev, [id]: true }));
    setDeleteError(null);
    
    try {
      const { error } = await deleteBrainDump(id);
      if (error) {
        setDeleteError(`Error deleting: ${error}`);
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting brain dump');
    } finally {
      setIsDeleting(prev => ({ ...prev, [id]: false }));
    }
  };
  
  // Convert to eBook
  const handleConvertToEbook = async (id: string, title: string) => {
    setConverting(prev => ({ ...prev, [id]: true }));
    
    try {
      const { data, error } = await convertToCreatorContent(id, 'ebook', title);
      
      if (error) {
        console.error('Error converting to eBook:', error);
      } else if (data) {
        navigate(`/creator/ebook/${data.id}`);
      }
    } catch (err) {
      console.error('Error in conversion:', err);
    } finally {
      setConverting(prev => ({ ...prev, [id]: false }));
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Get summary excerpt
  const getSummaryExcerpt = (content: string | null): string => {
    if (!content) return 'No content available';
    
    try {
      const parsed = JSON.parse(content);
      if (parsed?.summary) {
        // Return first 120 characters of summary with ellipsis if longer
        return parsed.summary.length > 120 
          ? parsed.summary.substring(0, 120) + '...'
          : parsed.summary;
      }
      return 'No summary available';
    } catch (e) {
      return 'Invalid content format';
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto bg-paper dark:bg-gray-800 rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-gray-700 p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BookText className="w-6 h-6 text-accent-primary mr-2" />
          <h2 className="font-display text-2xl text-ink-dark dark:text-gray-200">Your Brain Dumps</h2>
        </div>
        <button
          onClick={() => navigate('/brain-dump')}
          className="flex items-center px-4 py-2 font-serif text-sm bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Brain Dump
        </button>
      </div>
      
      {/* Error message */}
      {(error || deleteError) && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md flex items-start text-red-700 dark:text-red-400">
          <div className="font-serif text-sm">{error || deleteError}</div>
        </div>
      )}
      
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-ink-faded dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search brain dumps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 font-serif bg-cream dark:bg-gray-900 border border-accent-tertiary/30 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary dark:text-gray-200"
          />
        </div>
        <div className="flex space-x-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'alpha')}
            className="px-4 py-2 font-serif text-sm bg-cream dark:bg-gray-900 border border-accent-tertiary/30 dark:border-gray-700 rounded-md text-ink-light dark:text-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-primary"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alpha">Alphabetical</option>
          </select>
          <button
            className="flex items-center px-4 py-2 font-serif text-sm bg-cream dark:bg-gray-900 border border-accent-tertiary/30 dark:border-gray-700 rounded-md text-ink-light dark:text-gray-400 hover:text-ink-dark dark:hover:text-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4 mr-1.5" />
            <span className="mr-1">Filter</span>
          </button>
        </div>
      </div>
      
      {/* Brain dumps list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-accent-primary animate-spin" />
        </div>
      ) : sortedBrainDumps.length > 0 ? (
        <div className="space-y-4">
          {sortedBrainDumps.map(dump => (
            <div key={dump.id} className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md hover:shadow-md transition-shadow dark:bg-gray-750">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className="p-2 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-md mr-3">
                    <FileText className="w-6 h-6 text-accent-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-ink-dark dark:text-gray-200">{dump.title}</h3>
                    <p className="font-serif text-sm text-ink-faded dark:text-gray-500">
                      Created: {formatDate(dump.created_at)}
                      {dump.updated_at !== dump.created_at && ` · Updated: ${formatDate(dump.updated_at)}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {isDeleting[dump.id] ? (
                    <div className="p-2 text-ink-faded animate-pulse">
                      <Loader className="w-4 h-4 animate-spin" />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDelete(dump.id)}
                      className="p-2 text-ink-faded dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Summary and actions */}
              <div className="mt-3 mb-4 ml-11">
                <p className="font-serif text-sm text-ink-light dark:text-gray-400 line-clamp-2">
                  {getSummaryExcerpt(dump.content)}
                </p>
              </div>
              
              <div className="ml-11 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(`/brain-dump/${dump.id}`)}
                  className="px-3 py-1.5 font-serif text-xs bg-cream dark:bg-gray-900 border border-accent-tertiary/30 dark:border-gray-700 rounded-md text-ink-light dark:text-gray-400 hover:text-ink-dark dark:hover:text-gray-200 transition-colors flex items-center"
                >
                  <File className="w-3.5 h-3.5 mr-1" />
                  View Details
                </button>
                
                <button
                  onClick={() => handleConvertToEbook(dump.id, dump.title)}
                  disabled={converting[dump.id]}
                  className={`px-3 py-1.5 font-serif text-xs rounded-md flex items-center ${
                    converting[dump.id]
                      ? 'bg-accent-secondary/40 text-white/70 cursor-not-allowed'
                      : 'bg-accent-secondary text-white hover:bg-accent-secondary/90 transition-colors'
                  }`}
                >
                  {converting[dump.id] ? (
                    <>
                      <Loader className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-3.5 h-3.5 mr-1" />
                      Create eBook
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-accent-tertiary/30 dark:border-gray-700 rounded-lg">
          <BookText className="w-12 h-12 text-accent-tertiary/40 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="font-serif font-semibold text-lg text-ink-dark dark:text-gray-300 mb-1">No brain dumps found</h3>
          <p className="font-serif text-ink-light dark:text-gray-400 mb-4">
            {search ? 'No results match your search.' : 'Start creating brain dumps to see them listed here.'}
          </p>
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="font-serif text-accent-primary dark:text-accent-primary/90 hover:underline"
            >
              Clear search
            </button>
          ) : (
            <button
              onClick={() => navigate('/brain-dump')}
              className="px-4 py-2 font-serif text-sm bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
            >
              Create Your First Brain Dump
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BrainDumpList;