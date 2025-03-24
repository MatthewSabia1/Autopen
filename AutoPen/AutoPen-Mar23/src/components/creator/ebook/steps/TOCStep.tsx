import React, { useState, useEffect } from 'react';
import { List, RefreshCw, Check, PlusCircle, X, Edit3, Info, GripVertical } from 'lucide-react';
import { EbookContent, EbookChapter } from '../../../../types/ebook.types';

interface TOCStepProps {
  contentData: EbookContent;
  onGenerate: () => Promise<{ toc?: EbookChapter[]; error: string | null }>;
  onSaveTOC: (toc: EbookChapter[]) => Promise<{ error: string | null }>;
  generating: boolean;
}

const TOCStep: React.FC<TOCStepProps> = ({
  contentData,
  onGenerate,
  onSaveTOC,
  generating
}) => {
  const [toc, setToc] = useState<EbookChapter[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (contentData?.chapters?.length) {
      setToc(contentData.chapters);
    }
  }, [contentData]);

  const handleGenerate = async () => {
    if (!contentData?.title) {
      setError('A title is required before generating a table of contents');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const { toc: generatedTOC, error: generateError } = await onGenerate();
      
      if (generateError) {
        throw new Error(generateError);
      }
      
      if (generatedTOC) {
        setToc(generatedTOC);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate table of contents');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTOC = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const { error: saveError } = await onSaveTOC(toc);
      
      if (saveError) {
        throw new Error(saveError);
      }
      
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save table of contents');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setEditingIndex(null);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setIsAdding(false);
    setEditingIndex(null);
    
    // Revert to original TOC
    if (contentData?.chapters?.length) {
      setToc(contentData.chapters);
    }
  };

  const handleAddChapter = () => {
    setIsAdding(true);
    setNewChapterTitle('');
  };

  const handleSaveNewChapter = () => {
    if (newChapterTitle.trim()) {
      setToc([...toc, { title: newChapterTitle.trim(), content: '', chapterIndex: toc.length }]);
      setIsAdding(false);
      setNewChapterTitle('');
    }
  };

  const handleEditChapter = (index: number) => {
    setEditingIndex(index);
    setNewChapterTitle(toc[index].title);
  };

  const handleUpdateChapter = () => {
    if (editingIndex !== null && newChapterTitle.trim()) {
      const updatedToc = [...toc];
      updatedToc[editingIndex] = { ...updatedToc[editingIndex], title: newChapterTitle.trim() };
      setToc(updatedToc);
      setEditingIndex(null);
    }
  };

  const handleDeleteChapter = (index: number) => {
    const updatedToc = [...toc];
    updatedToc.splice(index, 1);
    setToc(updatedToc);
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    const newToc = [...toc];
    const draggedItem = newToc[draggedItemIndex];
    
    newToc.splice(draggedItemIndex, 1);
    newToc.splice(index, 0, draggedItem);
    
    // Update chapter indices
    newToc.forEach((chapter, idx) => {
      chapter.chapterIndex = idx;
    });
    
    setToc(newToc);
    setDraggedItemIndex(index);
  };

  return (
    <div>
      <h2 className="text-xl font-display text-ink-dark dark:text-gray-200 mb-2">
        Table of Contents
      </h2>
      <p className="text-ink-light dark:text-gray-400 font-serif mb-6">
        Define the structure of your eBook by creating or generating a table of contents.
      </p>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">There was an error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400 font-serif">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-cream dark:bg-gray-850 p-6 rounded-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-ink-dark dark:text-gray-200 flex items-center">
            <List className="w-5 h-5 mr-2 text-accent-primary" />
            {contentData.title ? `Contents for "${contentData.title}"` : 'Table of Contents'}
          </h3>
          {toc.length > 0 && !isEditing && (
            <button
              type="button"
              onClick={handleStartEditing}
              className="px-3 py-1.5 text-sm border border-accent-tertiary/30 dark:border-gray-600 text-ink-dark dark:text-gray-300 rounded hover:bg-accent-tertiary/10 dark:hover:bg-gray-800 transition-colors flex items-center"
            >
              <Edit3 className="w-4 h-4 mr-1.5" />
              Edit
            </button>
          )}
        </div>
        
        {toc.length > 0 ? (
          <div>
            <ul className="space-y-2 mb-6">
              {toc.map((chapter, index) => (
                <li 
                  key={index} 
                  className="flex items-center p-3 rounded border border-accent-tertiary/20 dark:border-gray-700 bg-white dark:bg-gray-800"
                  draggable={isEditing}
                  onDragStart={() => isEditing && handleDragStart(index)}
                  onDragOver={(e) => isEditing && handleDragOver(e, index)}
                >
                  {isEditing && (
                    <div className="flex-shrink-0 mr-2 cursor-grab text-ink-light dark:text-gray-500">
                      <GripVertical size={18} />
                    </div>
                  )}
                  
                  {editingIndex === index ? (
                    <div className="flex-grow flex items-center">
                      <input
                        type="text"
                        value={newChapterTitle}
                        onChange={(e) => setNewChapterTitle(e.target.value)}
                        className="flex-grow p-1.5 border border-accent-primary/30 dark:border-accent-primary/40 rounded bg-white dark:bg-gray-700 font-serif text-ink-dark dark:text-gray-200"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleUpdateChapter}
                        className="ml-2 p-1.5 bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(null)}
                        className="ml-2 p-1.5 border border-red-200 dark:border-red-800 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-grow font-serif text-ink-dark dark:text-gray-200">
                        {chapter.title}
                      </span>
                      
                      {isEditing && (
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditChapter(index)}
                            className="p-1.5 text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChapter(index)}
                            className="p-1.5 text-ink-light dark:text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
            
            {isEditing && (
              <div className="space-y-4">
                {isAdding ? (
                  <div className="flex items-center p-3 rounded border border-accent-primary/30 dark:border-accent-primary/50 bg-white dark:bg-gray-800">
                    <input
                      type="text"
                      value={newChapterTitle}
                      onChange={(e) => setNewChapterTitle(e.target.value)}
                      placeholder="Enter chapter title"
                      className="flex-grow p-1.5 border border-accent-primary/30 dark:border-accent-primary/40 rounded bg-white dark:bg-gray-700 font-serif text-ink-dark dark:text-gray-200"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveNewChapter}
                      className="ml-2 p-1.5 bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="ml-2 p-1.5 border border-red-200 dark:border-red-800 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddChapter}
                    className="w-full p-3 border border-dashed border-accent-tertiary/40 dark:border-gray-600 rounded hover:bg-accent-tertiary/5 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-center text-accent-primary"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Chapter
                  </button>
                )}
                
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    className="px-4 py-2 border border-accent-tertiary/30 dark:border-gray-600 text-ink-dark dark:text-gray-300 rounded hover:bg-accent-tertiary/10 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTOC}
                    disabled={isSaving}
                    className={`px-4 py-2 rounded flex items-center ${
                      isSaving
                        ? 'bg-accent-primary/50 cursor-not-allowed text-white/80'
                        : 'bg-accent-primary text-white hover:bg-accent-primary/90'
                    } transition-colors`}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-accent-tertiary/30 dark:border-gray-700 rounded-md">
            <List className="w-12 h-12 text-accent-primary/50 mx-auto mb-4" />
            <p className="text-ink-light dark:text-gray-400 font-serif mb-4">
              {contentData.title 
                ? `Generate a table of contents for "${contentData.title}" or create one manually.`
                : 'Generate or create a table of contents for your eBook.'}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || generating || !contentData.title}
                className={`px-5 py-2 rounded flex items-center justify-center ${
                  isGenerating || generating || !contentData.title
                    ? 'bg-accent-primary/50 cursor-not-allowed text-white/80'
                    : 'bg-accent-primary text-white hover:bg-accent-primary/90'
                } transition-colors`}
              >
                {isGenerating || generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <List className="w-4 h-4 mr-2" />
                    Generate Table of Contents
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setToc([]);
                  setIsEditing(true);
                  handleAddChapter();
                }}
                className="px-5 py-2 border border-accent-tertiary/30 dark:border-gray-600 text-ink-dark dark:text-gray-300 rounded hover:bg-accent-tertiary/10 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Manually
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">About this step</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-400 font-serif">
              <p>
                The table of contents defines the structure of your eBook. You can generate one automatically 
                based on your content, or create and organize chapters manually. Drag and drop to reorder chapters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TOCStep; 