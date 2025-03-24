import React, { useState, useEffect } from 'react';
import { X, Search, PlusCircle, Book, BookOpen, FileText, VideoIcon, SendIcon, Calendar } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useFolders } from '../../hooks/useFolders';

interface SelectContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  onComplete: () => void;
}

const SelectContentModal: React.FC<SelectContentModalProps> = ({
  isOpen,
  onClose,
  folderId,
  onComplete
}) => {
  const { projects, loading: projectsLoading } = useProjects();
  const { addContentToFolder } = useFolders();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter projects based on search query
  const filteredProjects = projects.filter(project => {
    if (!project) return false;
    
    const titleMatch = project.title && project.title.toLowerCase().includes(searchQuery.toLowerCase());
    const descriptionMatch = project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return titleMatch || descriptionMatch;
  });
  
  // Handle adding content to project
  const handleAddContent = async () => {
    if (!selectedContent) {
      setError('Please select a content item first');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Find the selected project to get its title
      const selectedProject = projects.find(p => p.id === selectedContent);
      const contentTitle = selectedProject?.title || 'content';
      
      const { error } = await addContentToFolder(
        folderId,
        selectedContent,
        'product' // Default content type - currently not used in DB
      );
      
      if (error) {
        throw new Error(error);
      }
      
      onComplete();
      onClose();
    } catch (err: any) {
      console.error('Error in handleAddContent:', err);
      setError(err.message || 'Failed to add content to project');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get content type icon
  const getContentIcon = (project: any) => {
    const type = project?.content?.type || 'ebook';
    
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
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-paper rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-xl text-ink-dark">Add Content to Project</h3>
          <button 
            onClick={onClose}
            className="text-ink-light hover:text-ink-dark"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        
        <p className="text-ink-light mb-4">
          Select content to add to your project
        </p>
        
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded w-4 h-4" />
          <input
            type="text"
            placeholder="Search content..."
            className="w-full pl-9 pr-4 py-2 font-serif bg-cream border border-accent-tertiary/30 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {projectsLoading ? (
          <div className="py-4 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-6 text-center">
            <Book className="w-12 h-12 text-accent-tertiary/40 mx-auto mb-2" />
            <p className="text-ink-light mb-4">You don't have any content yet</p>
            <button
              onClick={() => {
                onClose();
                window.location.href = '/products/new';
              }}
              className="px-4 py-2 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors inline-flex items-center"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create New Content
            </button>
          </div>
        ) : (
          <>
            <div className="max-h-60 overflow-y-auto mb-6 border border-accent-tertiary/20 rounded-md">
              <ul className="divide-y divide-accent-tertiary/20">
                {filteredProjects.map(project => (
                  <li key={project.id}>
                    <button
                      onClick={() => setSelectedContent(project.id)}
                      className={`w-full px-4 py-3 text-left flex items-center hover:bg-cream/50 transition-colors ${
                        selectedContent === project.id ? 'bg-cream/70' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded bg-accent-secondary/10 flex items-center justify-center mr-3 flex-shrink-0">
                        {getContentIcon(project)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-medium text-ink-dark truncate">{project.title}</h4>
                        {project.description && (
                          <p className="font-serif text-xs text-ink-light truncate">
                            {project.description}
                          </p>
                        )}
                      </div>
                      {selectedContent === project.id && (
                        <div className="w-4 h-4 rounded-full bg-accent-primary flex-shrink-0"></div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  onClose();
                  window.location.href = '/products/new';
                }}
                className="text-accent-primary font-serif hover:text-accent-primary/80 flex items-center"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                New Content
              </button>
              <button
                onClick={handleAddContent}
                disabled={!selectedContent || isSubmitting}
                className={`px-4 py-2 rounded font-serif ${
                  selectedContent && !isSubmitting
                    ? 'bg-accent-primary text-white hover:bg-accent-primary/90' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Adding...' : 'Add to Project'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SelectContentModal; 