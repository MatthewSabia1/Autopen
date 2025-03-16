import React, { useState, useEffect } from 'react';
import { Folder, Search, PlusCircle, X, Loader } from 'lucide-react';
import { useFolders } from '../../hooks/useFolders';

interface AddToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  contentId: string;
  contentType: string;
  contentTitle: string;
}

const AddToProjectModal: React.FC<AddToProjectModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  contentId,
  contentType,
  contentTitle
}) => {
  const { folders, loading, createFolder, addContentToFolder } = useFolders();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Filter folders based on search
  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle add to project
  const handleAddToProject = async () => {
    if (!selectedFolderId) {
      setError('Please select a project first');
      return;
    }
    
    setError(null);
    setIsProcessing(true);
    
    try {
      const { error } = await addContentToFolder(
        selectedFolderId, 
        contentId, 
        contentType
      );
      
      if (error) {
        throw new Error(error);
      }
      
      onComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add to project');
      setIsProcessing(false);
    }
  };
  
  // Handle create folder and add
  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFolderName.trim()) {
      setError('Project name is required');
      return;
    }
    
    setError(null);
    setIsProcessing(true);
    
    try {
      const { data, error } = await createFolder({
        name: newFolderName,
        description: newFolderDesc || null
      });
      
      if (error || !data) {
        throw new Error(error || 'Failed to create project');
      }
      
      // Now add content to the newly created folder
      const addResult = await addContentToFolder(
        data.id,
        contentId,
        contentType
      );
      
      if (addResult.error) {
        throw new Error(addResult.error);
      }
      
      onComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project and add content');
      setIsProcessing(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-amber-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                <Folder className="w-6 h-6 text-amber-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                  Add to Project
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Adding <span className="font-medium">{contentTitle}</span> to a project
                </p>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            {!isCreatingFolder ? (
              <div className="mt-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {loading ? (
                  <div className="py-12 text-center">
                    <Loader className="w-8 h-8 mx-auto text-amber-600 animate-spin" />
                    <p className="mt-2 text-sm text-gray-500">Loading projects...</p>
                  </div>
                ) : folders.length === 0 ? (
                  <div className="py-8 text-center">
                    <Folder className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 mb-4">You don't have any projects yet</p>
                    <button
                      onClick={() => setIsCreatingFolder(true)}
                      className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors inline-flex items-center"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Your First Project
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {filteredFolders.map(folder => (
                        <li key={folder.id}>
                          <button
                            onClick={() => setSelectedFolderId(folder.id)}
                            className={`w-full px-4 py-3 text-left flex items-center hover:bg-gray-50 transition-colors ${
                              selectedFolderId === folder.id ? 'bg-amber-50' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center mr-3 flex-shrink-0">
                              <Folder className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{folder.name}</h4>
                              {folder.description && (
                                <p className="text-xs text-gray-500 truncate">
                                  {folder.description}
                                </p>
                              )}
                            </div>
                            {selectedFolderId === folder.id && (
                              <div className="w-4 h-4 rounded-full bg-amber-500 flex-shrink-0"></div>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {folders.length > 0 && (
                  <div className="pt-4 mt-2 border-t border-gray-200 flex justify-between items-center">
                    <button
                      onClick={() => setIsCreatingFolder(true)}
                      className="text-amber-600 hover:text-amber-700 flex items-center text-sm"
                    >
                      <PlusCircle className="w-4 h-4 mr-1" />
                      New Project
                    </button>
                    <button
                      onClick={handleAddToProject}
                      disabled={!selectedFolderId || isProcessing}
                      className={`px-4 py-2 rounded flex items-center ${
                        selectedFolderId && !isProcessing
                          ? 'bg-amber-600 text-white hover:bg-amber-700' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add to Project'
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCreateAndAdd} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="My New Project"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="description"
                    value={newFolderDesc}
                    onChange={(e) => setNewFolderDesc(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                    rows={3}
                    placeholder="What's this project for?"
                  />
                </div>
                
                <div className="pt-4 mt-2 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors flex items-center"
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create & Add'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToProjectModal; 