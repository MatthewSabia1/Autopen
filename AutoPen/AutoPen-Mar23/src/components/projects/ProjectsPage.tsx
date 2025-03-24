import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, PlusCircle, Search, FileText, Book, Grid, List, ChevronRight, FolderPlus, Trash2, Edit, Eye } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useFolders } from '../../hooks/useFolders';
import CreateProjectModal from './CreateProjectModal';
import DeleteProjectModal from './DeleteProjectModal';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading, error: projectsError, fetchProjects } = useProjects();
  const { 
    folders,
    loading: foldersLoading, 
    error: foldersError,
    createFolder,
    deleteFolder,
    fetchFolders
  } = useFolders();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const refreshRequiredRef = useRef(false);

  // Add effect to log when folders change but don't trigger refreshes
  useEffect(() => {
    console.log('Folders updated in ProjectsPage:', folders.length);
  }, [folders]);

  // Handle project creation completion
  const handleProjectCreated = useCallback(() => {
    console.log('Project created in ProjectsPage');
    
    // Immediately fetch projects instead of using a delay
    if (fetchProjects) {
      fetchProjects();
    }
    
    // Also keep the folder refresh for related updates
    setTimeout(() => {
      fetchFolders();
    }, 500);
  }, [fetchProjects, fetchFolders]);

  // Filter folders based on search query
  const filteredFolders = folders.filter(folder => {
    if (!folder || typeof folder !== 'object') return false;
    
    const nameMatch = folder.name && folder.name.toLowerCase().includes(searchQuery.toLowerCase());
    const descriptionMatch = folder.description && folder.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return nameMatch || descriptionMatch;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle folder click
  const handleFolderClick = (folderId: string) => {
    navigate(`/projects/folder/${folderId}`);
  };

  // Handle create folder
  const handleCreateFolder = () => {
    setIsCreateFolderModalOpen(true);
  };

  // Handle create project
  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };
  
  // Handle folder submission
  const handleFolderSubmit = async (name: string, description: string) => {
    try {
      console.log('Submitting folder creation:', { name, description });
      
      if (!name || name.trim() === '') {
        alert('Project name cannot be empty');
        return;
      }
      
      setIsCreateFolderModalOpen(false); // Close modal first to improve perceived performance
      
      const result = await createFolder({
        name,
        description: description || null
      });
      
      if (result.error) {
        console.error('Error creating folder:', result.error);
        alert(`Failed to create project: ${result.error}`);
        return;
      }
      
      console.log('Folder created successfully:', result.data);
      
      // Safely navigate to the new folder if we have valid data
      if (result.data && typeof result.data === 'object' && result.data.id) {
        // Wait a moment before navigating to let state updates complete
        setTimeout(() => {
          navigate(`/projects/folder/${result.data.id}`);
        }, 500);
      } else {
        console.warn('Successfully created folder but received invalid data structure:', result.data);
      }
    } catch (error: any) {
      console.error('Exception in handleFolderSubmit:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  // Handle delete project
  const handleDeleteClick = (e: React.MouseEvent, folder: any) => {
    e.stopPropagation();
    setFolderToDelete({ id: folder.id, name: folder.name });
    setIsDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async (deleteContent: boolean) => {
    if (!folderToDelete) return;
    
    try {
      if (deleteContent) {
        console.log(`Deleting folder ${folderToDelete.id} with all content`);
      } else {
        console.log(`Deleting folder ${folderToDelete.id} without content`);
      }
      
      const result = await deleteFolder(folderToDelete.id, deleteContent);
      
      if (result.error) {
        alert(`Failed to delete project: ${result.error}`);
      }
      
      setFolderToDelete(null);
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert('An error occurred while deleting the project');
    }
  };

  // Loading state
  const isLoading = projectsLoading || foldersLoading;
  
  // Combined error
  const error = projectsError || foldersError;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-ink-dark dark:text-gray-200 mb-2">Projects</h1>
        <p className="text-ink-light dark:text-gray-400">Organize your content and projects into folders</p>
      </div>

      {/* Actions and filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex space-x-2">
          <button 
            onClick={handleCreateFolder}
            className="inline-flex items-center px-4 py-2 border border-accent-secondary bg-white dark:bg-gray-800 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-ink-dark dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary dark:focus:ring-offset-gray-900"
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            New Project
          </button>
          <button 
            onClick={handleCreateProject}
            className="inline-flex items-center px-4 py-2 border border-transparent bg-accent-primary rounded-md shadow-sm text-sm font-medium text-white hover:bg-accent-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary dark:focus:ring-offset-gray-900"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Product
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Empty state when no folders */}
      {!isLoading && folders.length === 0 && (
        <div className="bg-white dark:bg-gray-800 border border-accent-tertiary/30 dark:border-gray-700 rounded-lg p-8 text-center">
          <FolderPlus className="w-12 h-12 text-accent-tertiary/50 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ink-dark dark:text-gray-200 mb-2">No folders yet</h3>
          <p className="text-ink-light dark:text-gray-400 mb-6">Create folders to organize your content and projects</p>
          <button
            onClick={handleCreateFolder}
            className="inline-flex items-center px-4 py-2 border border-transparent bg-accent-primary rounded-md shadow-sm text-sm font-medium text-white hover:bg-accent-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary dark:focus:ring-offset-gray-900"
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            Create First Project
          </button>
        </div>
      )}

      {/* Folders list */}
      {!isLoading && folders.length > 0 && (
        <div className="bg-paper dark:bg-gray-800 rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-accent-tertiary/20 dark:border-gray-700">
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="w-full pl-9 pr-4 py-2 font-serif bg-cream dark:bg-gray-900 border border-accent-tertiary/30 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary dark:text-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-cream/50 dark:bg-gray-900/50">
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light dark:text-gray-400">Project</th>
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light dark:text-gray-400">Description</th>
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light dark:text-gray-400">Created</th>
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light dark:text-gray-400">Items</th>
                  <th className="px-6 py-3 text-right font-serif text-sm font-semibold text-ink-light dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-tertiary/10 dark:divide-gray-700">
                {filteredFolders.map(folder => (
                  <tr 
                    key={folder.id}
                    className="hover:bg-cream/30 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-accent-secondary/10 dark:bg-accent-secondary/5 flex items-center justify-center mr-3 flex-shrink-0">
                          <Folder className="w-5 h-5 text-accent-primary" />
                        </div>
                        <div>
                          <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-200">{folder.name}</h4>
                          {folder.description && (
                            <p className="font-serif text-sm text-ink-light dark:text-gray-400 line-clamp-1">
                              {folder.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-serif text-sm text-ink-light dark:text-gray-400">
                      {folder.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 font-serif text-sm text-ink-light dark:text-gray-400">
                      {formatDate(folder.created_at)}
                    </td>
                    <td className="px-6 py-4 font-serif text-sm text-ink-light dark:text-gray-400">
                      {folder.itemCount || 0} items
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFolderClick(folder.id);
                          }}
                          className="p-1.5 text-accent-primary hover:text-accent-primary/80 transition-colors bg-accent-primary/10 dark:bg-accent-primary/20 rounded-md"
                          title="View Project"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/folder/${folder.id}/edit`);
                          }}
                          className="p-1.5 text-accent-secondary hover:text-accent-secondary/80 transition-colors bg-accent-secondary/10 dark:bg-accent-secondary/20 rounded-md"
                          title="Edit Project"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, folder)}
                          className="p-1.5 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors bg-red-50 dark:bg-red-900/20 rounded-md"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}

      {/* Create Folder Modal */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-ink-dark dark:text-gray-200 mb-4">Create New Project</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const description = formData.get('description') as string;
              
              handleFolderSubmit(name, description);
            }}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-ink-dark dark:text-gray-300 mb-1">Project Name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="w-full px-3 py-2 border border-accent-tertiary/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded-md focus:outline-none focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="My Project"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-ink-dark dark:text-gray-300 mb-1">Description (optional)</label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-accent-tertiary/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded-md focus:outline-none focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="What's this project for?"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderModalOpen(false)}
                  className="px-4 py-2 border border-accent-tertiary/30 dark:border-gray-600 rounded-md text-ink-dark dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent-primary text-white rounded-md hover:bg-accent-primary-dark"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {folderToDelete && (
        <DeleteProjectModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDeleteConfirm}
          projectName={folderToDelete.name}
        />
      )}
    </div>
  );
};

export default ProjectsPage; 