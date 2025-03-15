import React, { useState, useEffect } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useNavigation } from '../../contexts/NavigationContext';
import { ChevronLeft, Save, Edit, Plus, Trash2, MoveUp, MoveDown, BookOpen, Loader, AlertCircle } from 'lucide-react';

const ProjectDetail: React.FC = () => {
  // In a real app, you would get the product ID from the URL or a state management solution
  // For now, we'll just use a fake ID for demonstration
  const productId = "demo-project-id";
  const { getProject, updateProject } = useProjects();
  const { navigateTo } = useNavigation();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  
  // Mock data for demonstration
  const [mockProduct] = useState({
    id: productId,
    title: "The Art of Mindful Productivity",
    description: "A comprehensive guide to achieving more while working less through mindfulness techniques and strategic planning.",
    status: "in_progress",
    progress: 42,
    content: {
      sections: [
        { id: "sec1", title: "Introduction", content: "This book explores the intersection of mindfulness and productivity..." },
        { id: "sec2", title: "Chapter 1: Mindfulness Fundamentals", content: "Mindfulness is the practice of being fully present and engaged..." },
        { id: "sec3", title: "Chapter 2: Productivity Systems", content: "There are numerous productivity systems that can be enhanced with mindfulness..." },
        { id: "sec4", title: "Chapter 3: Implementation", content: "Implementing these techniques requires consistent practice..." },
        { id: "sec5", title: "Conclusion", content: "By combining mindfulness with productivity strategies..." }
      ]
    },
    created_at: "2025-01-15T10:30:00.000Z",
    updated_at: "2025-03-10T14:42:00.000Z"
  });

  const [sections, setSections] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sectionContent, setSectionContent] = useState("");

  // Simulate loading the product from the database
  useEffect(() => {
    // In a real app, you would fetch the product data here
    // const fetchProduct = async () => {
    //   try {
    //     setLoading(true);
    //     const { data, error } = await getProject(productId);
    //     if (error) throw new Error(error);
    //     setProduct(data);
    //     if (data?.content?.sections) {
    //       setSections(data.content.sections);
    //       if (data.content.sections.length > 0) {
    //         setActiveSection(data.content.sections[0].id);
    //         setSectionContent(data.content.sections[0].content || "");
    //       }
    //     }
    //   } catch (err: any) {
    //     setError(err.message);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    
    // fetchProduct();
    
    // Using mock data for now
    setTimeout(() => {
      setProduct(mockProduct);
      setSections(mockProduct.content.sections);
      setActiveSection(mockProduct.content.sections[0].id);
      setSectionContent(mockProduct.content.sections[0].content || "");
      setEditedTitle(mockProduct.title);
      setEditedDescription(mockProduct.description || "");
      setLoading(false);
    }, 1000);
  }, [productId]);

  const handleSaveContent = async () => {
    if (!activeSection) return;
    
    // Update the current section content
    const updatedSections = sections.map(section => 
      section.id === activeSection 
        ? { ...section, content: sectionContent } 
        : section
    );
    
    setSections(updatedSections);
    
    // In a real app, you would save this to the database
    setSaving(true);
    
    try {
      // Simulate saving
      // const { error } = await updateProject(productId, {
      //   content: {
      //     ...product.content,
      //     sections: updatedSections
      //   }
      // });
      
      // if (error) throw new Error(error);
      
      // Success feedback
      setTimeout(() => {
        setSaving(false);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleSelectSection = (sectionId: string) => {
    // First save any current changes
    if (activeSection) {
      const updatedSections = sections.map(section => 
        section.id === activeSection 
          ? { ...section, content: sectionContent } 
          : section
      );
      setSections(updatedSections);
    }
    
    // Then switch to the new section
    setActiveSection(sectionId);
    const section = sections.find(s => s.id === sectionId);
    setSectionContent(section?.content || "");
  };

  const handleAddSection = () => {
    const newSectionId = `sec${Date.now()}`;
    const newSection = {
      id: newSectionId,
      title: `New Section`,
      content: ""
    };
    
    const newSections = [...sections, newSection];
    setSections(newSections);
    handleSelectSection(newSectionId);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (sections.length <= 1) {
      setError("Cannot delete the only section. Products must have at least one section.");
      return;
    }
    
    const newSections = sections.filter(section => section.id !== sectionId);
    setSections(newSections);
    
    // If the deleted section was active, select the first section
    if (activeSection === sectionId) {
      setActiveSection(newSections[0].id);
      setSectionContent(newSections[0].content || "");
    }
  };

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;
    
    const newSections = [...sections];
    if (direction === 'up' && sectionIndex > 0) {
      // Swap with previous section
      [newSections[sectionIndex], newSections[sectionIndex - 1]] = 
      [newSections[sectionIndex - 1], newSections[sectionIndex]];
    } else if (direction === 'down' && sectionIndex < sections.length - 1) {
      // Swap with next section
      [newSections[sectionIndex], newSections[sectionIndex + 1]] = 
      [newSections[sectionIndex + 1], newSections[sectionIndex]];
    }
    
    setSections(newSections);
  };

  const handleSaveProductDetails = async () => {
    if (isEditing) {
      // Save the edited details
      setProduct({
        ...product,
        title: editedTitle,
        description: editedDescription
      });
      
      // In a real app, save to the database:
      // await updateProject(productId, {
      //   title: editedTitle,
      //   description: editedDescription
      // });
      
      setIsEditing(false);
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="font-serif text-ink-light">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-ink-dark mb-3">Product Not Found</h1>
          <p className="font-serif text-ink-light mb-6">
            The product you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button 
            onClick={() => navigateTo('projects')}
            className="px-5 py-2 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-cream">
      <header className="bg-paper border-b border-accent-tertiary/30 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => navigateTo('projects')}
              className="mr-4 p-1.5 text-ink-light hover:text-ink-dark rounded-full hover:bg-cream transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {isEditing ? (
              <div className="flex-1">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="font-display text-xl md:text-2xl text-ink-dark bg-cream px-3 py-1 border border-accent-tertiary/30 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary w-full mb-1"
                />
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="font-serif text-sm text-ink-light bg-cream px-3 py-1 border border-accent-tertiary/30 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary w-full"
                  rows={2}
                  placeholder="Add a description..."
                ></textarea>
              </div>
            ) : (
              <div>
                <h1 className="font-display text-xl md:text-2xl text-ink-dark">{product.title}</h1>
                {product.description && (
                  <p className="font-serif text-sm text-ink-light">{product.description}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleSaveProductDetails}
              className={`px-4 py-1.5 font-serif rounded flex items-center text-sm ${
                isEditing
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-cream text-ink-light hover:bg-cream/70'
              } transition-colors`}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Details
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-1.5" />
                  Edit Details
                </>
              )}
            </button>
            
            <div className="h-6 border-r border-accent-tertiary/30"></div>
            
            <button 
              onClick={handleSaveContent}
              disabled={saving}
              className="px-4 py-1.5 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors flex items-center text-sm"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Product
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
              <button 
                onClick={handleAddSection}
                className="p-1.5 text-ink-light hover:text-accent-primary transition-colors rounded-full hover:bg-cream"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              <ul className="divide-y divide-accent-tertiary/10">
                {sections.map((section) => (
                  <li key={section.id}>
                    <div 
                      className={`p-3 flex items-start hover:bg-cream/50 transition-colors group ${
                        activeSection === section.id ? 'bg-cream' : ''
                      }`}
                    >
                      <button 
                        className="flex-1 text-left"
                        onClick={() => handleSelectSection(section.id)}
                      >
                        <span className="font-serif text-sm text-ink-dark">{section.title}</span>
                      </button>
                      
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleMoveSection(section.id, 'up')}
                          className="p-1 text-ink-light hover:text-ink-dark transition-colors"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleMoveSection(section.id, 'down')}
                          className="p-1 text-ink-light hover:text-ink-dark transition-colors"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-1 text-ink-light hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 border-t border-accent-tertiary/20 bg-cream/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif text-xs text-ink-light">Product Progress</span>
                <span className="font-serif text-xs font-semibold text-accent-primary">{product.progress}%</span>
              </div>
              <div className="w-full bg-cream rounded-full h-2">
                <div 
                  className="bg-accent-primary h-2 rounded-full" 
                  style={{ width: `${product.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-paper rounded-lg shadow-sm border border-accent-tertiary/20 p-4">
            <div className="flex items-center mb-3">
              <BookOpen className="w-5 h-5 text-accent-secondary mr-2" />
              <h3 className="font-serif font-semibold text-ink-dark">Preview</h3>
            </div>
            <p className="font-serif text-sm text-ink-light mb-3">
              See how your e-book will look on different devices.
            </p>
            <button className="w-full px-4 py-2 font-serif text-sm border border-accent-secondary/30 text-accent-secondary rounded hover:bg-accent-secondary/5 transition-colors">
              Open Preview
            </button>
          </div>
        </aside>
        
        {/* Main editor */}
        <div className="md:col-span-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <p className="font-serif text-sm">{error}</p>
            </div>
          )}
          
          <div className="bg-paper rounded-lg shadow-sm border border-accent-tertiary/20 p-6">
            {activeSection && (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    value={sections.find(s => s.id === activeSection)?.title || ""}
                    onChange={(e) => {
                      const updatedSections = sections.map(section => 
                        section.id === activeSection 
                          ? { ...section, title: e.target.value } 
                          : section
                      );
                      setSections(updatedSections);
                    }}
                    className="font-display text-2xl text-ink-dark bg-transparent border-b border-accent-tertiary/30 focus:border-accent-primary px-2 py-1 w-full focus:outline-none"
                  />
                </div>
                
                <textarea
                  value={sectionContent}
                  onChange={(e) => setSectionContent(e.target.value)}
                  className="w-full min-h-[60vh] p-2 font-serif text-ink-dark bg-transparent border-0 focus:outline-none focus:ring-0 resize-none"
                  placeholder="Start writing..."
                ></textarea>
              </>
            )}
            
            {!activeSection && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-accent-tertiary/40 mx-auto mb-4" />
                <h3 className="font-serif text-xl text-ink-dark mb-2">No section selected</h3>
                <p className="font-serif text-ink-light mb-6">
                  Select a section from the sidebar to start editing.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetail;