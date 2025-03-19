import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, ExternalLink, Calendar, BookOpen, Share } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';

const ProjectDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id, projectId, folderId } = useParams<{ id: string; projectId: string; folderId: string }>();
  const location = useLocation();
  const isFromFolder = location.pathname.includes('/projects/folder/');
  const { getProject } = useProjects();
  
  // Use projectId from folder route if available, otherwise use id
  const currentProjectId = projectId || id;
  
  // Handle back navigation
  const handleBack = () => {
    if (isFromFolder && folderId) {
      navigate(`/projects/folder/${folderId}`);
    } else {
      navigate('/products');
    }
  };
  
  // Project state
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch project data
  useEffect(() => {
    let isMounted = true;
    const fetchProject = async () => {
      if (!currentProjectId) return;
      
      // Prevent duplicate loading
      if (loading) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching project:', currentProjectId);
        const { data, error } = await getProject(currentProjectId);
        
        if (!isMounted) return;
        
        if (error) {
          setError(error);
          return;
        }
        
        if (data) {
          setProject(data);
        } else {
          setError('Project not found');
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Error fetching project:', err);
        setError(err.message || 'Failed to fetch project');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchProject();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [currentProjectId, getProject]);
  
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
  
  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
        <button
          onClick={handleBack}
          className="inline-flex items-center px-4 py-2 border border-transparent bg-accent-primary rounded-md shadow-sm text-sm font-medium text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isFromFolder ? 'Back to Project' : 'Back to Products'}
        </button>
      </div>
    );
  }
  
  // Not found state
  if (!project) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white border border-accent-tertiary/30 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-ink-dark mb-2">Project not found</h3>
          <p className="text-ink-light mb-6">The project you're looking for doesn't exist or has been deleted</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-transparent bg-accent-primary rounded-md shadow-sm text-sm font-medium text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isFromFolder ? 'Back to Project' : 'Back to Products'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-ink-light hover:text-accent-primary mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {isFromFolder ? 'Back to Project' : 'Back to Products'}
        </button>
      </div>
      
      {/* Project details header */}
      <div className="bg-paper rounded-xl shadow-sm border border-accent-tertiary/20 mb-8">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="font-display text-2xl text-ink-dark">{project.title}</h2>
            <div className="flex space-x-2">
              <button className="p-2 text-accent-primary border border-accent-primary/20 rounded hover:bg-accent-primary/5 transition-colors">
                <Save className="w-4 h-4" />
              </button>
              <button className="p-2 text-red-500 border border-red-200 rounded hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {project.description && (
            <p className="mt-2 font-serif text-ink-light">{project.description}</p>
          )}
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-serif text-ink-faded flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                Updated {formatDate(project.updated_at)}
              </span>
              <span className="text-xs font-serif bg-accent-tertiary/10 text-accent-tertiary px-2 py-0.5 rounded">
                {project.status || 'Draft'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-xs font-serif text-ink-faded hover:text-ink-light flex items-center">
                <Share className="w-3 h-3 mr-1" />
                Share
              </button>
              <button className="text-xs font-serif text-ink-faded hover:text-ink-light flex items-center">
                <ExternalLink className="w-3 h-3 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Project content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-paper rounded-xl shadow-sm border border-accent-tertiary/20 p-6">
            <h3 className="font-serif font-semibold text-ink-dark mb-2">Content</h3>
            <div className="space-y-3">
              {project.content && project.content.sections && (
                project.content.sections.map((section: any, index: number) => (
                  <div key={index} className="p-3 border border-accent-tertiary/20 rounded bg-white">
                    <h4 className="font-serif font-medium text-ink-dark">{section.title}</h4>
                    <p className="font-serif text-ink-light text-sm mt-1">
                      {section.content || 'No content yet'}
                    </p>
                  </div>
                ))
              )}
              
              {project.content && project.content.chapters && (
                project.content.chapters.map((chapter: any, index: number) => (
                  <div key={index} className="p-3 border border-accent-tertiary/20 rounded bg-white">
                    <h4 className="font-serif font-medium text-ink-dark">{chapter.title}</h4>
                    <p className="font-serif text-ink-light text-sm mt-1">
                      {chapter.content || 'No content yet'}
                    </p>
                  </div>
                ))
              )}
              
              {project.content && project.content.scenes && (
                project.content.scenes.map((scene: any, index: number) => (
                  <div key={index} className="p-3 border border-accent-tertiary/20 rounded bg-white">
                    <div className="flex justify-between items-start">
                      <h4 className="font-serif font-medium text-ink-dark">{scene.title}</h4>
                      <span className="text-xs text-ink-faded">{scene.duration}s</span>
                    </div>
                    <p className="font-serif text-ink-light text-sm mt-1">
                      {scene.content || 'No content yet'}
                    </p>
                  </div>
                ))
              )}
              
              {(!project.content || 
                (!project.content.sections && 
                 !project.content.chapters && 
                 !project.content.scenes)) && (
                <div className="p-3 border border-accent-tertiary/20 rounded bg-white text-center">
                  <p className="font-serif text-ink-light">No content structure found</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-paper rounded-xl shadow-sm border border-accent-tertiary/20 p-6 mb-6">
            <h3 className="font-serif font-semibold text-ink-dark mb-4">Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-serif text-ink-faded">Type</p>
                <p className="font-serif text-ink-dark">{project.content?.type || 'Product'}</p>
              </div>
              <div>
                <p className="text-xs font-serif text-ink-faded">Status</p>
                <p className="font-serif text-ink-dark">{project.status || 'Draft'}</p>
              </div>
              <div>
                <p className="text-xs font-serif text-ink-faded">Created</p>
                <p className="font-serif text-ink-dark">{formatDate(project.created_at)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-paper rounded-xl shadow-sm border border-accent-tertiary/20 p-6">
            <h3 className="font-serif font-semibold text-ink-dark mb-4">Actions</h3>
            <div className="space-y-3">
              <button 
                className="w-full font-serif px-4 py-2 flex items-center justify-center bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Edit Content
              </button>
              <button 
                className="w-full font-serif px-4 py-2 flex items-center justify-center border border-accent-tertiary/30 text-ink-dark rounded hover:bg-gray-50 transition-colors"
              >
                <Share className="w-4 h-4 mr-2" />
                Share Product
              </button>
              <button 
                className="w-full font-serif px-4 py-2 flex items-center justify-center border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Product
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;