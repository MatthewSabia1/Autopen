import React, { useState, useEffect } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Book, AlertCircle, Trash2, MoreHorizontal, Edit, Eye, BookOpen, FileText, VideoIcon, SendIcon, Calendar } from 'lucide-react';
import CreateProjectModal from './CreateProjectModal';
import DeleteProjectModal from './DeleteProjectModal';

// Helper function to safely get the content type
const getContentType = (content: any): string => {
  if (!content) return 'ebook';
  if (typeof content === 'object' && content !== null && 'type' in content) {
    return content.type as string;
  }
  return 'ebook'; // Default fallback
};

// Type definition for project content
interface ProjectContent {
  type?: string;
  sections?: { content: string }[];
  [key: string]: any;
}

const ProjectsList: React.FC = () => {
  const { projects, loading, error, deleteProject, fetchProjects } = useProjects();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Effect to fetch projects on component mount
  useEffect(() => {
    // Initial fetch
    console.log('Initial projects fetch in ProjectsList');
    fetchProjects();
  }, [fetchProjects]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.dropdown-area')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown]);

  // Filter projects based on search query and status filter
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === null || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === statusFilter ? null : status);
  };

  const toggleDropdown = (projectId: string) => {
    setActiveDropdown(activeDropdown === projectId ? null : projectId);
  };
  
  const navigateToProject = (projectId: string, project: any) => {
    const contentType = getContentType(project.content);
    
    if (contentType === 'ebook') {
      // For ebooks, navigate to the ebook workflow
      navigate(`/creator/ebook/${projectId}`);
    } else {
      // For other types, navigate to the standard project view
      navigate(`/projects/${projectId}`);
    }
  };

  const handleDeleteClick = (project: any) => {
    setProjectToDelete({ id: project.id, title: project.title });
    setIsDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDeleteConfirm = async (deleteContent: boolean) => {
    if (!projectToDelete) return;
    
    try {
      if (deleteContent) {
        console.log(`Deleting project ${projectToDelete.id} with all content`);
      } else {
        console.log(`Deleting project ${projectToDelete.id} without content`);
      }
      
      const { error } = await deleteProject(projectToDelete.id, deleteContent);
      
      if (error) {
        alert(`Failed to delete product: ${error}`);
      }
      
      setProjectToDelete(null);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert('An error occurred while deleting the product');
    }
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
        return <BookOpen className="w-5 h-5 text-gray-800 dark:text-white" />;
      case 'course':
        return <Calendar className="w-5 h-5 text-gray-800 dark:text-white" />;
      case 'blog':
        return <FileText className="w-5 h-5 text-gray-800 dark:text-white" />;
      case 'video_script':
        return <VideoIcon className="w-5 h-5 text-gray-800 dark:text-white" />;
      case 'newsletter':
        return <SendIcon className="w-5 h-5 text-gray-800 dark:text-white" />;
      default:
        return <Book className="w-5 h-5 text-gray-800 dark:text-white" />;
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

  const getStatusColor = (status: string | null): string => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800/80 text-gray-800 dark:text-gray-300';
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

  const handleCreateProject = () => {
    // Close the modal first
    setIsCreateModalOpen(false);
    
    // Setup timeout to allow modal closing animation
    setTimeout(() => {
      console.log('Refreshing projects after create');
      fetchProjects();
    }, 1000);
  };

  return (
    <div className="min-h-[calc(100vh-100px)] max-w-6xl mx-auto px-4 py-6 dark:bg-dark-bg-primary">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary dark:border-accent-primary"></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-md bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 flex items-center">
          <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
          <span>Error loading projects. Please try again.</span>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif font-medium text-ink-dark dark:text-dark-text-primary mb-0">Products</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-md bg-accent-secondary text-white dark:bg-accent-secondary hover:bg-accent-secondary/90 dark:hover:bg-accent-secondary/90 flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Product
            </button>
          </div>

          <div className="bg-paper dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-dark-border-secondary overflow-hidden mb-8">
            <div className="p-6 border-b border-accent-tertiary/20 dark:border-dark-border-secondary dark:border-opacity-100">
              <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded dark:text-dark-text-muted w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search products..." 
                    className="w-full pl-9 pr-4 py-2.5 font-serif bg-cream dark:bg-dark-bg-tertiary dark:text-dark-text-primary border border-accent-tertiary/30 dark:border-dark-border-primary rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary dark:placeholder-dark-text-muted"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex space-x-3 overflow-x-auto pb-2 md:pb-0">
                  <button 
                    className={`px-4 py-2 rounded-md font-serif text-sm flex items-center whitespace-nowrap ${statusFilter === 'draft' ? 'bg-accent-tertiary/10 dark:bg-accent-tertiary/30 text-accent-primary dark:text-accent-primary' : 'bg-cream dark:bg-dark-bg-tertiary text-ink-light dark:text-dark-text-tertiary'}`}
                    onClick={() => handleStatusFilter('draft')}
                  >
                    Draft
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md font-serif text-sm flex items-center whitespace-nowrap ${statusFilter === 'in_progress' ? 'bg-accent-tertiary/10 dark:bg-accent-tertiary/30 text-accent-primary dark:text-accent-primary' : 'bg-cream dark:bg-dark-bg-tertiary text-ink-light dark:text-dark-text-tertiary'}`}
                    onClick={() => handleStatusFilter('in_progress')}
                  >
                    In Progress
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-md font-serif text-sm flex items-center whitespace-nowrap ${statusFilter === 'completed' ? 'bg-accent-tertiary/10 dark:bg-accent-tertiary/30 text-accent-primary dark:text-accent-primary' : 'bg-cream dark:bg-dark-bg-tertiary text-ink-light dark:text-dark-text-tertiary'}`}
                    onClick={() => handleStatusFilter('completed')}
                  >
                    Completed
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto dark:bg-dark-bg-secondary">
              <table className="w-full dark:bg-dark-bg-secondary">
                <thead>
                  <tr className="bg-cream/50 dark:bg-dark-bg-tertiary/70">
                    <th className="px-6 py-4 text-left font-serif text-sm font-semibold text-ink-light dark:text-dark-text-tertiary">Product</th>
                    <th className="px-6 py-4 text-left font-serif text-sm font-semibold text-ink-light dark:text-dark-text-tertiary">Type</th>
                    <th className="px-6 py-4 text-left font-serif text-sm font-semibold text-ink-light dark:text-dark-text-tertiary">Status</th>
                    <th className="px-6 py-4 text-left font-serif text-sm font-semibold text-ink-light dark:text-dark-text-tertiary">Content</th>
                    <th className="px-6 py-4 text-left font-serif text-sm font-semibold text-ink-light dark:text-dark-text-tertiary">Created</th>
                    <th className="px-6 py-4 text-right font-serif text-sm font-semibold text-ink-light dark:text-dark-text-tertiary">Actions</th>
                  </tr>
                </thead>
                
                <tbody className="dark:bg-dark-bg-secondary">
                  {filteredProjects.length === 0 ? (
                    <tr className="dark:bg-dark-bg-secondary">
                      <td colSpan={6} className="px-6 py-8 text-center text-ink-faded dark:text-dark-text-muted font-serif">
                        {searchQuery || statusFilter ? 
                          "No products match your filters." : 
                          "No products yet. Click 'New Product' to create one."}
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map(project => (
                      <tr 
                        key={project.id}
                        className="border-t border-accent-tertiary/10 dark:border-dark-border-secondary hover:bg-accent-tertiary/5 dark:hover:bg-dark-bg-tertiary/70 cursor-pointer transition-colors"
                        onClick={(e) => {
                          // Prevent navigation if clicking on the dropdown or delete button
                          if ((e.target as Element).closest('.dropdown-area')) return;
                          navigateToProject(project.id, project);
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-md bg-accent-primary/10 dark:bg-dark-bg-tertiary/80 mr-3 flex items-center justify-center text-accent-primary">
                              {getTypeIcon(getContentType(project.content))}
                            </div>
                            <div>
                              <h3 className="font-medium text-ink-dark dark:text-dark-text-primary mb-1">{project.title}</h3>
                              {project.description && (
                                <p className="text-sm text-ink-faded dark:text-dark-text-muted line-clamp-1">{project.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-serif text-sm text-ink-light dark:text-dark-text-tertiary">
                          {getTypeLabel(getContentType(project.content))}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {getStatusLabel(project.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-serif text-sm text-ink-light dark:text-dark-text-tertiary">
                          {project.content && typeof project.content === 'object' && project.content !== null ? (
                            <div>
                              {(project.content as ProjectContent).sections && Array.isArray((project.content as ProjectContent).sections) && (
                                <span>
                                  {((project.content as ProjectContent).sections || []).length} section{((project.content as ProjectContent).sections || []).length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span>No content</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-serif text-sm text-ink-light dark:text-dark-text-tertiary">
                          {formatDate(project.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right relative dropdown-area">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(project.id);
                            }}
                            className="text-ink-light dark:text-dark-text-muted hover:text-ink-dark dark:hover:text-dark-text-primary focus:outline-none p-1.5 rounded-full hover:bg-accent-tertiary/10 dark:hover:bg-dark-bg-tertiary/80"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                          
                          {activeDropdown === project.id && (
                            <div className="absolute right-2 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-dark-bg-secondary border border-accent-tertiary/20 dark:border-dark-border-primary z-10">
                              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                <button
                                  className="flex items-center w-full px-4 py-2.5 text-sm text-ink-light dark:text-dark-text-tertiary hover:bg-accent-tertiary/10 dark:hover:bg-dark-bg-tertiary/90 cursor-pointer text-left"
                                  role="menuitem"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToProject(project.id, project);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Project
                                </button>
                                <a
                                  href={`/projects/${project.id}/edit`}
                                  className="flex items-center px-4 py-2.5 text-sm text-ink-light dark:text-dark-text-tertiary hover:bg-accent-tertiary/10 dark:hover:bg-dark-bg-tertiary/90 cursor-pointer"
                                  role="menuitem"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Details
                                </a>
                                <button
                                  className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-accent-tertiary/10 dark:hover:bg-dark-bg-tertiary/90 cursor-pointer"
                                  role="menuitem"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(project);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Project
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onProjectCreated={handleCreateProject}
      />
      
      <DeleteProjectModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDeleteConfirm}
        projectName={projectToDelete?.title || ''}
      />
    </div>
  );
};

export default ProjectsList;