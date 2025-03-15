import React, { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { Plus, Search, Book, Filter, AlertCircle, Trash2, MoreHorizontal, Edit, Archive, Eye, BookOpen, FileText, VideoIcon, SendIcon, Calendar } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import CreateProjectModal from './CreateProjectModal';

// Type for content count display
type ContentCount = {
  sections?: number;
  words?: number;
  characters?: number;
};

const ProjectsList: React.FC = () => {
  const { projects, loading, error, deleteProject } = useProjects();
  const { navigateTo } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Filter projects based on search query and status filter
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === null || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status === statusFilter ? null : status);
  };

  const toggleDropdown = (projectId: string) => {
    setActiveDropdown(activeDropdown === projectId ? null : projectId);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      const { error } = await deleteProject(projectId);
      if (error) {
        alert(`Failed to delete product: ${error}`);
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
        return <BookOpen className="w-5 h-5 text-purple-600" />;
      case 'course':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'blog':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'video_script':
        return <VideoIcon className="w-5 h-5 text-red-600" />;
      case 'newsletter':
        return <SendIcon className="w-5 h-5 text-orange-600" />;
      default:
        return <Book className="w-5 h-5 text-accent-secondary" />;
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

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
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
      case 'archived':
        return 'Archived';
      default:
        return 'Draft';
    }
  };

  // Get content count for display purposes
  const getContentCount = (content: any): ContentCount => {
    const count: ContentCount = {};
    
    // If there are sections
    if (content && content.sections && Array.isArray(content.sections)) {
      count.sections = content.sections.length;
      
      // Count words in all sections
      let wordCount = 0;
      let charCount = 0;
      
      content.sections.forEach((section: any) => {
        if (section && section.content) {
          const text = section.content.toString();
          charCount += text.length;
          wordCount += text.split(/\s+/).filter(Boolean).length;
        }
      });
      
      count.words = wordCount;
      count.characters = charCount;
    }
    
    return count;
  };

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="font-serif text-ink-light">Loading your products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink-dark mb-2">Products</h1>
          <p className="font-serif text-ink-light">Create and manage your e-book products</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="mt-4 md:mt-0 px-5 py-2 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
          <p className="font-serif">{error}</p>
        </div>
      )}

      <div className="bg-paper rounded-lg shadow-sm border border-accent-tertiary/20 overflow-hidden">
        <div className="p-4 border-b border-accent-tertiary/20">
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 font-serif bg-cream border border-accent-tertiary/30 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
              <button 
                onClick={() => handleStatusFilter('draft')}
                className={`px-3 py-1.5 rounded-md font-serif text-sm flex items-center whitespace-nowrap ${
                  statusFilter === 'draft' ? 'bg-accent-primary/10 text-accent-primary' : 'bg-cream text-ink-light'
                }`}
              >
                Draft
              </button>
              <button 
                onClick={() => handleStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-md font-serif text-sm flex items-center whitespace-nowrap ${
                  statusFilter === 'in_progress' ? 'bg-accent-primary/10 text-accent-primary' : 'bg-cream text-ink-light'
                }`}
              >
                In Progress
              </button>
              <button 
                onClick={() => handleStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-md font-serif text-sm flex items-center whitespace-nowrap ${
                  statusFilter === 'completed' ? 'bg-accent-primary/10 text-accent-primary' : 'bg-cream text-ink-light'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="py-16 text-center">
            <Book className="w-16 h-16 text-accent-tertiary/40 mx-auto mb-4" />
            {projects.length === 0 ? (
              <>
                <h3 className="font-serif text-xl text-ink-dark mb-2">No products yet</h3>
                <p className="font-serif text-ink-light mb-6 max-w-lg mx-auto">
                  Start creating your first e-book product by clicking the New Product button above.
                </p>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-5 py-2 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Product
                </button>
              </>
            ) : (
              <>
                <h3 className="font-serif text-xl text-ink-dark mb-2">No matching products</h3>
                <p className="font-serif text-ink-light mb-6 max-w-lg mx-auto">
                  Try adjusting your search criteria or filter settings.
                </p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter(null);
                  }}
                  className="px-5 py-2 font-serif border border-accent-primary/30 text-accent-primary rounded hover:bg-accent-primary/5 transition-colors inline-flex items-center"
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
                <tr className="bg-cream/50">
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light">Product</th>
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light">Type</th>
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light">Status</th>
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light">Content</th>
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light">Last Updated</th>
                  <th className="px-6 py-3 text-right font-serif text-sm font-semibold text-ink-light">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-tertiary/10">
                {filteredProjects.map((project) => {
                  const contentCount = getContentCount(project.content);
                  return (
                    <tr 
                      key={project.id} 
                      className="hover:bg-cream/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded bg-accent-secondary/10 flex items-center justify-center mr-3 flex-shrink-0">
                            {getTypeIcon(project.content?.type || 'ebook')}
                          </div>
                          <div>
                            <h4 className="font-serif font-semibold text-ink-dark">{project.title}</h4>
                            {project.description && (
                              <p className="font-serif text-sm text-ink-light line-clamp-1">
                                {project.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-serif text-sm text-ink-light">
                        {getTypeLabel(project.content?.type || 'ebook')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-serif text-sm text-ink-light">
                        {contentCount.sections ? (
                          <div>
                            <span className="text-accent-primary font-semibold">{contentCount.sections}</span> sections
                            {contentCount.words ? (
                              <span className="text-ink-faded ml-2">
                                (~{contentCount.words} words)
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-ink-faded italic">Empty</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-serif text-sm text-ink-light">
                        {formatDate(project.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => navigateTo('projectDetail')}
                            className="p-1.5 text-accent-primary hover:text-accent-primary/80 transition-colors bg-accent-primary/10 rounded-md"
                            title="View Product"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigateTo('projectDetail')}
                            className="p-1.5 text-accent-secondary hover:text-accent-secondary/80 transition-colors bg-accent-secondary/10 rounded-md"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleDropdown(project.id)}
                              className="p-1.5 text-ink-light hover:text-ink-dark transition-colors bg-cream rounded-md"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            
                            {activeDropdown === project.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-paper rounded-md shadow-lg py-1 border border-accent-tertiary/20 z-20">
                                <button
                                  onClick={() => {
                                    toggleDropdown(project.id);
                                    navigateTo('projectDetail');
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light hover:bg-cream text-left"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Product
                                </button>
                                <button
                                  onClick={() => {
                                    // Handle archive project
                                    toggleDropdown(project.id);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light hover:bg-cream text-left"
                                >
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive Product
                                </button>
                                <div className="border-t border-accent-tertiary/20 my-1"></div>
                                <button
                                  onClick={() => handleDeleteProject(project.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm font-serif text-red-600 hover:bg-cream text-left"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Product
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};

export default ProjectsList;