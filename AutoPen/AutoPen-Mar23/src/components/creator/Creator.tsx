import React, { useState } from 'react';
import { useCreator } from '../../hooks/useCreator';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, AlertCircle, Trash2, MoreHorizontal, Edit, Archive, Wand2, BookText, FileText, PenSquare, VideoIcon, SendIcon, Calendar } from 'lucide-react';
import CreateContentModal from './CreateContentModal';

const Creator: React.FC = () => {
  const { contents, loading, error, deleteContent } = useCreator();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Filter contents based on search query and type filter
  const filteredContents = contents.filter(content => {
    // Guard against null or undefined content
    if (!content) return false;
    
    const matchesSearch = content.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (content.description && content.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === null || content.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleTypeFilter = (type: string | null) => {
    setTypeFilter(type === typeFilter ? null : type);
  };

  const toggleDropdown = (contentId: string) => {
    setActiveDropdown(activeDropdown === contentId ? null : contentId);
  };

  const handleDeleteContent = async (contentId: string) => {
    if (window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      const { error } = await deleteContent(contentId);
      if (error) {
        alert(`Failed to delete content: ${error}`);
      }
    }
    setActiveDropdown(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ebook':
        return <BookText className="w-5 h-5 text-purple-600" />;
      case 'course':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'blog':
        return <PenSquare className="w-5 h-5 text-green-600" />;
      case 'video_script':
        return <VideoIcon className="w-5 h-5 text-red-600" />;
      case 'newsletter':
        return <SendIcon className="w-5 h-5 text-orange-600" />;
      case 'social_media':
        return <FileText className="w-5 h-5 text-pink-600" />;
      default:
        return <FileText className="w-5 h-5 text-accent-primary" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'published':
        return 'bg-purple-100 text-purple-800';
      case 'archived':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'published':
        return 'Published';
      case 'archived':
        return 'Archived';
      default:
        return 'Draft';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ebook':
        return 'E-Book';
      case 'course':
        return 'Course';
      case 'blog':
        return 'Blog Post';
      case 'video_script':
        return 'Video Script';
      case 'newsletter':
        return 'Newsletter';
      case 'social_media':
        return 'Social Media';
      default:
        return 'Other';
    }
  };

  if (loading && contents.length === 0) {
    return (
      <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="font-serif text-ink-light dark:text-gray-400">Loading your content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink-dark dark:text-gray-200 mb-2">AI Creator</h1>
          <p className="font-serif text-ink-light dark:text-gray-400">Generate high-quality content with AI assistance</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="mt-4 md:mt-0 px-5 py-2 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors flex items-center"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Create New Content
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
          <p className="font-serif">{error}</p>
        </div>
      )}

      <div className="bg-paper dark:bg-gray-800 rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-accent-tertiary/20 dark:border-gray-700">
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search content..."
                className="w-full pl-9 pr-4 py-2 font-serif bg-cream dark:bg-gray-900 border border-accent-tertiary/30 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary dark:text-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
              <button 
                onClick={() => handleTypeFilter('ebook')}
                className={`px-3 py-1.5 rounded-md font-serif text-sm flex items-center whitespace-nowrap ${
                  typeFilter === 'ebook' ? 'bg-accent-primary/10 dark:bg-accent-primary/20 text-accent-primary dark:text-accent-primary' : 'bg-cream dark:bg-gray-700 text-ink-light dark:text-gray-300'
                }`}
              >
                <BookText className="w-3.5 h-3.5 mr-1.5" />
                E-Books
              </button>
              <button 
                onClick={() => handleTypeFilter('course')}
                className={`px-3 py-1.5 rounded-md font-serif text-sm flex items-center whitespace-nowrap ${
                  typeFilter === 'course' ? 'bg-accent-primary/10 dark:bg-accent-primary/20 text-accent-primary dark:text-accent-primary' : 'bg-cream dark:bg-gray-700 text-ink-light dark:text-gray-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Courses
              </button>
              <button 
                onClick={() => handleTypeFilter('blog')}
                className={`px-3 py-1.5 rounded-md font-serif text-sm flex items-center whitespace-nowrap ${
                  typeFilter === 'blog' ? 'bg-accent-primary/10 dark:bg-accent-primary/20 text-accent-primary dark:text-accent-primary' : 'bg-cream dark:bg-gray-700 text-ink-light dark:text-gray-300'
                }`}
              >
                <PenSquare className="w-3.5 h-3.5 mr-1.5" />
                Blog Posts
              </button>
              <button 
                onClick={() => handleTypeFilter('video_script')}
                className={`px-3 py-1.5 rounded-md font-serif text-sm flex items-center whitespace-nowrap ${
                  typeFilter === 'video_script' ? 'bg-accent-primary/10 dark:bg-accent-primary/20 text-accent-primary dark:text-accent-primary' : 'bg-cream dark:bg-gray-700 text-ink-light dark:text-gray-300'
                }`}
              >
                <VideoIcon className="w-3.5 h-3.5 mr-1.5" />
                Videos
              </button>
            </div>
          </div>
        </div>

        {filteredContents.length === 0 ? (
          <div className="py-16 text-center">
            <Wand2 className="w-16 h-16 text-accent-tertiary/40 dark:text-gray-600 mx-auto mb-4" />
            {contents.length === 0 ? (
              <>
                <h3 className="font-serif text-xl text-ink-dark dark:text-gray-200 mb-2">No AI content yet</h3>
                <p className="font-serif text-ink-light dark:text-gray-400 mb-6 max-w-lg mx-auto">
                  Start creating high-quality content with AI assistance by clicking the Create New Content button above.
                </p>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-5 py-2 font-serif bg-accent-secondary text-white rounded hover:bg-accent-secondary/90 transition-colors inline-flex items-center"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Create Your First AI Content
                </button>
              </>
            ) : (
              <>
                <h3 className="font-serif text-xl text-ink-dark dark:text-gray-200 mb-2">No matching content</h3>
                <p className="font-serif text-ink-light dark:text-gray-400 mb-6 max-w-lg mx-auto">
                  Try adjusting your search criteria or filter settings.
                </p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter(null);
                  }}
                  className="px-5 py-2 font-serif border border-accent-primary/30 dark:border-accent-primary/50 text-accent-primary dark:text-accent-primary/90 rounded hover:bg-accent-primary/5 dark:hover:bg-accent-primary/10 transition-colors inline-flex items-center"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-cream/50 dark:bg-gray-900/50">
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light dark:text-gray-400">Content</th>
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light dark:text-gray-400">Type</th>
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light dark:text-gray-400">Status</th>
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light dark:text-gray-400">Last Updated</th>
                  <th className="px-6 py-3 text-right font-serif text-sm font-semibold text-ink-light dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-tertiary/10 dark:divide-gray-700">
                {filteredContents.map((content) => (
                  <tr 
                    key={content.id} 
                    className="hover:bg-cream/30 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                    onClick={() => {
                      // Route based on content type using React Router navigate
                      const path = content.type === 'ebook'
                        ? `/creator/ebook/${content.id}`
                        : `/creator/${content.id}`;
                      console.log('Navigating to:', path);
                      navigate(path);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-accent-secondary/10 dark:bg-accent-secondary/5 flex items-center justify-center mr-3 flex-shrink-0">
                          {getTypeIcon(content.type)}
                        </div>
                        <div>
                          <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-200">{content.title}</h4>
                          {content.description && (
                            <p className="font-serif text-sm text-ink-light dark:text-gray-400 line-clamp-1">
                              {content.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-serif text-sm text-ink-light dark:text-gray-400">
                      {getTypeLabel(content.type)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(content.status)}`}>
                        {getStatusLabel(content.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-serif text-sm text-ink-light dark:text-gray-400">
                      {formatDate(content.updated_at)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="relative flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleDropdown(content.id)}
                          className="p-1 text-ink-light dark:text-gray-400 hover:text-ink-dark dark:hover:text-gray-300 transition-colors"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        
                        {activeDropdown === content.id && (
                          <div className="absolute right-0 mt-8 w-48 bg-paper dark:bg-gray-800 rounded-md shadow-lg py-1 border border-accent-tertiary/20 dark:border-gray-700 z-20">
                            <button
                              onClick={() => {
                                toggleDropdown(content.id);
                                // Route based on content type using React Router navigate
                                const path = content.type === 'ebook'
                                  ? `/creator/ebook/${content.id}`
                                  : `/creator/${content.id}`;
                                console.log('Navigating to:', path);
                                navigate(path);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light dark:text-gray-300 hover:bg-cream dark:hover:bg-gray-700 text-left"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Content
                            </button>
                            <button
                              onClick={() => {
                                // Handle archive content
                                toggleDropdown(content.id);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light dark:text-gray-300 hover:bg-cream dark:hover:bg-gray-700 text-left"
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Archive Content
                            </button>
                            <div className="border-t border-accent-tertiary/20 dark:border-gray-700 my-1"></div>
                            <button
                              onClick={() => handleDeleteContent(content.id)}
                              className="flex items-center w-full px-4 py-2 text-sm font-serif text-red-600 dark:text-red-400 hover:bg-cream dark:hover:bg-gray-700 text-left"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Content
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateContentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Creator;