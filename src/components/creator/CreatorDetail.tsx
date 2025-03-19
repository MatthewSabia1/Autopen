import React, { useState } from 'react';
import { ChevronLeft, Save, Edit, Wand2, BookText, AlertCircle, Loader, BookOpen, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const CreatorDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Mock content data for the initial version
  const [content] = useState({
    id: id || '1',
    title: 'The Art of Productivity',
    description: 'A comprehensive guide to boosting your productivity and managing your time effectively.',
    type: 'e-book',
    status: 'draft',
    sections: [
      { id: "sec1", title: "Introduction", content: "In today's fast-paced world, productivity has become a crucial skill..." },
      { id: "sec2", title: "Chapter 1: Understanding Productivity", content: "Productivity is not about doing more, but about doing what matters..." },
      { id: "sec3", title: "Chapter 2: Time Management Techniques", content: "Time is our most valuable resource. Here are methods to manage it effectively..." },
      { id: "sec4", title: "Chapter 3: Digital Tools", content: "The right digital tools can significantly enhance your productivity..." },
      { id: "sec5", title: "Conclusion", content: "By implementing these productivity techniques, you'll find yourself..." }
    ],
    created_at: "2025-03-15T10:30:00.000Z",
    updated_at: "2025-03-15T14:42:00.000Z"
  });

  const [activeSection, setActiveSection] = useState(content.sections[0]?.id);
  const [sectionContent, setSectionContent] = useState(content.sections[0]?.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sectionTitles, setSectionTitles] = useState(
    content.sections.reduce((acc, section) => ({
      ...acc,
      [section.id]: section.title
    }), {})
  );
  
  const handleSectionSelect = (sectionId: string) => {
    // In a real app, first save current content before switching
    setActiveSection(sectionId);
    const section = content.sections.find(s => s.id === sectionId);
    setSectionContent(section?.content || "");
  };
  
  const handleSaveContent = () => {
    // Mock save function
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };
  
  const handleGenerateContent = () => {
    // Mock AI generation
    setIsGenerating(true);
    setTimeout(() => {
      // Simulate new content being generated
      const section = content.sections.find(s => s.id === activeSection);
      if (section) {
        const newContent = "AI-generated content for " + section.title + ":\n\n" + 
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl nec ultricies lacinia, nisl nisl aliquam nisl, nec ultricies nisl nisl nec nisl. Nullam auctor, nisl nec ultricies lacinia, nisl nisl aliquam nisl, nec ultricies nisl nisl nec nisl.\n\n" + 
          "Nullam auctor, nisl nec ultricies lacinia, nisl nisl aliquam nisl, nec ultricies nisl nisl nec nisl. Nullam auctor, nisl nec ultricies lacinia, nisl nisl aliquam nisl, nec ultricies nisl nisl nec nisl.";
        setSectionContent(newContent);
      }
      setIsGenerating(false);
    }, 2000);
  };

  const handleSectionTitleChange = (sectionId: string, newTitle: string) => {
    setSectionTitles(prev => ({
      ...prev,
      [sectionId]: newTitle
    }));
  };

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
              <span className="text-xs font-serif text-ink-faded">
                Created on {new Date(content.created_at).toLocaleDateString()}
              </span>
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
        
        {/* Content preview */}
        <div className="bg-cream rounded-lg p-6 border border-accent-tertiary/20">
          <div className="flex items-center justify-center h-96">
            <BookOpen className="w-16 h-16 text-accent-primary/30" />
          </div>
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