import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, Search, FolderOpen, Edit, Trash2, PlusCircle, ChevronRight } from 'lucide-react';
import { useFolders } from '../../hooks/useFolders';
import SelectContentModal from './SelectContentModal';

const FolderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    folders, 
    loading: foldersLoading,
    getProjectsInFolder,
    updateFolder,
    deleteFolder
  } = useFolders();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState<string | null>(null);

  // New state for Add Content modal
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Find current folder
  const currentFolder = folders.find(folder => folder.id === id);

  // Fetch folder projects
  useEffect(() => {
    if (!id) return;
    
    let isMounted = true;
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await getProjectsInFolder(id);
        
        if (!isMounted) return;
        
        if (error) {
          throw new Error(error);
        }
        
        setProjects(data || []);
      } catch (e: any) {
        if (!isMounted) return;
        console.error('Error fetching folder projects:', e);
        setError(e.message || 'Failed to load projects in this folder');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProjects();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [id, getProjectsInFolder]);

  // Set initial folder info for editing
  useEffect(() => {
    if (currentFolder) {
      setFolderName(currentFolder.name);
      setFolderDescription(currentFolder.description);
    }
  }, [currentFolder]);

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle folder update
  const handleUpdateFolder = async () => {
    if (!id) return;
    
    const result = await updateFolder(id, {
      name: folderName,
      description: folderDescription
    });
    
    if (result.error) {
      setError(`Failed to update folder: ${result.error}`);
    } else {
      setIsEditModalOpen(false);
    }
  };

  // Handle folder delete
  const handleDeleteFolder = async () => {
    if (!id) return;
    
    const result = await deleteFolder(id);
    
    if (result.error) {
      setError(`Failed to delete folder: ${result.error}`);
    } else {
      navigate('/projects');
    }
  };

  if (foldersLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!currentFolder) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-accent-tertiary/30 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-ink-dark mb-2">Folder not found</h3>
          <p className="text-ink-light mb-6">The folder you're looking for doesn't exist or has been deleted</p>
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center px-4 py-2 border border-transparent bg-accent-primary rounded-md shadow-sm text-sm font-medium text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center text-ink-light hover:text-accent-primary mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Projects
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <FolderOpen className="h-8 w-8 text-accent-primary mr-3" />
              <h1 className="text-3xl font-display font-bold text-ink-dark">{currentFolder.name}</h1>
            </div>
            {currentFolder.description && (
              <p className="mt-2 text-ink-light">{currentFolder.description}</p>
            )}
            <p className="mt-1 text-sm text-ink-light">
              Created {formatDate(currentFolder.created_at)} • {currentFolder.itemCount || 0} items
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsAddContentModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent bg-accent-primary rounded-md text-sm font-serif text-white hover:bg-accent-primary/90"
            >
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Add Content
            </button>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-accent-tertiary/30 rounded-md text-sm font-serif text-ink-dark hover:bg-gray-50"
            >
              <Edit className="mr-1.5 h-4 w-4" />
              Edit
            </button>
            <button 
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-red-200 rounded-md text-sm font-serif text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div className="bg-paper border border-accent-tertiary/20 rounded-lg p-8 text-center shadow-sm">
          <Book className="w-12 h-12 text-accent-tertiary/50 mx-auto mb-4" />
          <h3 className="text-lg font-serif font-medium text-ink-dark mb-2">No content in this project</h3>
          <p className="font-serif text-ink-light mb-6">Add products, brain dumps, or other content to this project</p>
          <button
            onClick={() => setIsAddContentModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent bg-accent-primary rounded-md text-sm font-serif text-white hover:bg-accent-primary/90"
          >
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Add Content
          </button>
        </div>
      )}

      {/* Projects list */}
      {!loading && projects.length > 0 && (
        <div className="bg-paper rounded-lg shadow-sm border border-accent-tertiary/20 overflow-hidden">
          <div className="p-4 border-b border-accent-tertiary/20">
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search content in this project..."
                  className="w-full pl-9 pr-4 py-2 font-serif bg-cream border border-accent-tertiary/30 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => setIsAddContentModalOpen(true)}
                className="inline-flex items-center px-4 py-2 md:py-0 border border-transparent bg-accent-primary rounded-md text-sm font-serif text-white hover:bg-accent-primary/90 whitespace-nowrap"
              >
                <PlusCircle className="mr-1.5 h-4 w-4" />
                Add Content
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-cream/50">
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light">Content</th>
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light">Type</th>
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light">Last Updated</th>
                  <th className="px-6 py-3 text-left font-serif text-sm font-semibold text-ink-light">Status</th>
                  <th className="px-6 py-3 text-right font-serif text-sm font-semibold text-ink-light">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-tertiary/10">
                {filteredProjects.map(project => (
                  <tr 
                    key={project.id}
                    className="hover:bg-cream/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-accent-secondary/10 flex items-center justify-center mr-3 flex-shrink-0">
                          <Book className="w-5 h-5 text-accent-primary" />
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-serif text-ink-light">
                      {project.content && typeof project.content === 'object' && 'type' in project.content 
                        ? (project.content as any).type 
                        : 'Product'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-serif text-ink-light">
                      {project.updated_at ? formatDate(project.updated_at) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-serif text-ink-light">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${project.id}`);
                          }}
                          className="p-1.5 text-accent-primary hover:text-accent-primary/80 transition-colors bg-accent-primary/10 rounded-md"
                          title="View Content"
                        >
                          <ChevronRight className="w-4 h-4" />
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

      {/* Edit Folder Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-ink-dark mb-4">Edit Folder</h3>
            <div>
              <div className="mb-4">
                <label htmlFor="edit-name" className="block text-sm font-medium text-ink-dark mb-1">Folder Name</label>
                <input
                  type="text"
                  id="edit-name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-3 py-2 border border-accent-tertiary/30 rounded-md focus:outline-none focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="My Folder"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="edit-description" className="block text-sm font-medium text-ink-dark mb-1">Description (optional)</label>
                <textarea
                  id="edit-description"
                  value={folderDescription || ''}
                  onChange={(e) => setFolderDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-accent-tertiary/30 rounded-md focus:outline-none focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="What's this folder for?"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-accent-tertiary/30 rounded-md text-ink-dark hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateFolder}
                  className="px-4 py-2 bg-accent-primary text-white rounded-md hover:bg-accent-primary-dark"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-ink-dark mb-2">Delete Folder</h3>
            <p className="text-ink-light mb-6">
              Are you sure you want to delete "{currentFolder.name}"? This action cannot be undone.
              {currentFolder.itemCount && currentFolder.itemCount > 0 
                ? ` The ${currentFolder.itemCount} projects in this folder will not be deleted, but they will no longer be associated with this folder.` 
                : ''}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-accent-tertiary/30 rounded-md text-ink-dark hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFolder}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Content Modal */}
      {isAddContentModalOpen && id && (
        <SelectContentModal
          isOpen={isAddContentModalOpen}
          onClose={() => setIsAddContentModalOpen(false)}
          folderId={id}
          onComplete={() => {
            // Refresh the project list
            getProjectsInFolder(id).then(result => {
              if (result.data) setProjects(result.data);
            });
          }}
        />
      )}
    </div>
  );
};

export default FolderDetail; 