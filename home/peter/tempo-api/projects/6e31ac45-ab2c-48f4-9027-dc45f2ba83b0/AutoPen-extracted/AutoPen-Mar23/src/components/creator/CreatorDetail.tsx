import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, Edit, Wand2, BookText, AlertCircle, Loader, BookOpen, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreator } from '../../hooks/useCreator';

const CreatorDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getContent } = useCreator();
  
  // State for actual content data
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for editing
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sectionContent, setSectionContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sectionTitles, setSectionTitles] = useState<Record<string, string>>({});
  
  // Fetch the actual content data
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          throw new Error('Content ID is required');
        }
        
        console.log('Fetching content with ID:', id);
        
        // Fetch content using useCreator hook
        const { data, error: fetchError } = await getContent(id);
        
        if (fetchError) {
          console.error('Error fetching content:', fetchError);
          throw new Error(fetchError);
        }
        
        console.log('Fetched content:', data);
        
        // If content is an eBook, redirect to the eBook workflow
        if (data && data.type === 'ebook') {
          console.log('Content is eBook, redirecting to workflow');
          
          // Use React Router for redirection instead of window.location
          navigate(`/creator/ebook/${id}`);
          return;
        }
        
        // If it's not an eBook, display it normally
        console.log('Setting content for display:', data);
        setContent(data);
        setError(null);
      } catch (err: any) {
        console.error('Error in CreatorDetail:', err);
        setError(err.message || 'Failed to load content');
        setContent(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [id, getContent, navigate]);
  
  // Initialize section data when content loads
  useEffect(() => {
    if (content && content.sections && content.sections.length > 0) {
      setActiveSection(content.sections[0].id);
      setSectionContent(content.sections[0].content || "");
      
      const titles = content.sections.reduce((acc: Record<string, string>, section: any) => ({
        ...acc,
        [section.id]: section.title
      }), {});
      
      setSectionTitles(titles);
    }
  }, [content]);
  
  const handleSectionSelect = (sectionId: string) => {
    // In a real app, first save current content before switching
    setActiveSection(sectionId);
    
    if (content && content.sections) {
      const section = content.sections.find((s: any) => s.id === sectionId);
      setSectionContent(section?.content || "");
    }
  };
  
  const handleSaveContent = () => {
    // Replace with actual save logic
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };
  
  const handleGenerateContent = () => {
    // Replace with actual AI generation logic
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 1000);
  };

  const handleSectionTitleChange = (sectionId: string, newTitle: string) => {
    setSectionTitles(prev => ({
      ...prev,
      [sectionId]: newTitle
    }));
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 py-8 flex justify-center items-center min-h-[400px]">
        <Loader className="w-8 h-8 text-accent-primary animate-spin" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        <button 
          onClick={() => navigate('/creator')}
          className="flex items-center text-accent-primary mb-6 font-serif hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Creator
        </button>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="font-display text-xl text-red-800 dark:text-red-300 mb-2">Content Not Found</h2>
          <p className="text-red-700 dark:text-red-400 font-serif">
            {error || "The requested content could not be found. Please try again or create new content."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      <button 
        onClick={() => navigate('/creator')}
        className="flex items-center text-accent-primary mb-6 font-serif hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Creator
      </button>
      
      {/* Content details */}
      <div className="bg-paper rounded-lg border border-accent-tertiary/20 shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div>
            <h2 className="font-display text-3xl text-ink-dark mb-2">{content.title}</h2>
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-xs font-serif bg-accent-tertiary/10 text-accent-tertiary px-2 py-0.5 rounded">
                {content.type}
              </span>
              {content.created_at && (
                <span className="text-xs font-serif text-ink-faded">
                  Created on {new Date(content.created_at).toLocaleDateString()}
                </span>
              )}
              <span className="text-xs font-serif bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                {content.status}
              </span>
            </div>
            <p className="text-ink-light font-serif max-w-2xl">
              {content.description}
            </p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <button className="p-2 text-accent-primary hover:bg-accent-primary/5 rounded">
              <Edit className="w-5 h-5" />
            </button>
            <button className="p-2 text-accent-primary hover:bg-accent-primary/5 rounded">
              <BookOpen className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content preview section - show dynamic content or placeholder */}
        <div className="bg-cream rounded-lg p-6 border border-accent-tertiary/20">
          {content.sections && content.sections.length > 0 ? (
            <div className="prose prose-sm max-w-none font-serif">
              {/* Render actual content here */}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <BookOpen className="w-16 h-16 text-accent-primary/30" />
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-4">
        <button className="px-5 py-2 font-serif text-accent-primary border border-accent-primary/30 rounded hover:bg-accent-primary/5 transition-colors">
          Save Draft
        </button>
        <button className="px-5 py-2 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors">
          Publish
        </button>
      </div>
    </div>
  );
};

export default CreatorDetail;