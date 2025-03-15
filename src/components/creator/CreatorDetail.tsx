import React, { useState } from 'react';
import { ChevronLeft, Save, Edit, Wand2, BookText, AlertCircle, Loader } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';

const CreatorDetail: React.FC = () => {
  const { navigateTo } = useNavigation();
  
  // Mock content data for the initial version
  const [content] = useState({
    id: "demo-content-id",
    title: "The Ultimate Guide to Productivity",
    description: "A comprehensive guide to achieving more with less effort using proven techniques and tools.",
    type: "ebook",
    status: "draft",
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
    <div className="w-full min-h-screen bg-cream">
      <header className="bg-paper border-b border-accent-tertiary/30 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => navigateTo('creator')}
              className="mr-4 p-1.5 text-ink-light hover:text-ink-dark rounded-full hover:bg-cream transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="font-display text-xl md:text-2xl text-ink-dark">{content.title}</h1>
              {content.description && (
                <p className="font-serif text-sm text-ink-light">{content.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleSaveContent}
              disabled={isSaving}
              className="px-4 py-1.5 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors flex items-center text-sm"
            >
              {isSaving ? (
                <>
                  <Loader className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <div className="bg-paper rounded-lg shadow-sm border border-accent-tertiary/20 overflow-hidden">
            <div className="p-4 border-b border-accent-tertiary/20 flex justify-between items-center">
              <h2 className="font-serif font-semibold text-ink-dark">Sections</h2>
              <div className="flex space-x-1">
                <button 
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                  className={`p-1.5 rounded-full ${isGenerating ? 'text-accent-secondary/50' : 'text-accent-secondary hover:bg-accent-secondary/10'} transition-colors`}
                  title="Generate content with AI"
                >
                  {isGenerating ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                </button>
                <button 
                  className="p-1.5 text-ink-light hover:text-ink-dark hover:bg-cream transition-colors rounded-full"
                  title="Edit sections"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              <ul className="divide-y divide-accent-tertiary/10">
                {content.sections.map((section) => (
                  <li key={section.id}>
                    <button 
                      className={`p-3 flex items-start w-full text-left hover:bg-cream/50 transition-colors ${
                        activeSection === section.id ? 'bg-cream' : ''
                      }`}
                      onClick={() => handleSectionSelect(section.id)}
                    >
                      <span className="font-serif text-sm text-ink-dark">{sectionTitles[section.id] || section.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 border-t border-accent-tertiary/20 bg-cream/30">
              <button 
                onClick={handleGenerateContent}
                disabled={isGenerating}
                className="w-full px-4 py-2 font-serif bg-accent-secondary text-white rounded hover:bg-accent-secondary/90 disabled:bg-accent-secondary/50 transition-colors flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
        
        {/* Main editor */}
        <div className="md:col-span-3">
          <div className="bg-paper rounded-lg shadow-sm border border-accent-tertiary/20 p-6">
            {activeSection ? (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    value={sectionTitles[activeSection] || content.sections.find(s => s.id === activeSection)?.title || ""}
                    onChange={(e) => handleSectionTitleChange(activeSection, e.target.value)}
                    className="font-display text-2xl text-ink-dark bg-transparent border-b border-accent-tertiary/30 focus:border-accent-primary px-2 py-1 w-full focus:outline-none"
                  />
                </div>
                
                <textarea
                  value={sectionContent}
                  onChange={(e) => setSectionContent(e.target.value)}
                  className="w-full min-h-[60vh] p-2 font-serif text-ink-dark bg-transparent border-0 focus:outline-none focus:ring-0 resize-none"
                  placeholder="Start writing or use AI to generate content..."
                ></textarea>
              </>
            ) : (
              <div className="text-center py-12">
                <BookText className="w-16 h-16 text-accent-tertiary/40 mx-auto mb-4" />
                <h3 className="font-serif text-xl text-ink-dark mb-2">No section selected</h3>
                <p className="font-serif text-ink-light mb-6">
                  Select a section from the sidebar to start editing.
                </p>
              </div>
            )}
          </div>
          
          {isGenerating && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-accent-tertiary/20 shadow-sm">
              <div className="flex items-center">
                <Loader className="w-5 h-5 text-accent-secondary animate-spin mr-3" />
                <div>
                  <h3 className="font-serif font-semibold text-ink-dark text-sm">AI is working on your content</h3>
                  <p className="font-serif text-xs text-ink-light">Generating high-quality content. This may take a moment...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreatorDetail;