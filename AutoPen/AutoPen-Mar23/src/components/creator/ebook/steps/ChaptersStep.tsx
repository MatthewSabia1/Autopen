import React, { useState, useEffect } from 'react';
import { BookText, RefreshCw, Check, Edit3, Info, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import { EbookContent, EbookChapter } from '../../../../types/ebook.types';

interface ChaptersStepProps {
  contentData: EbookContent;
  chapters: EbookChapter[];
  onGenerate: () => Promise<{ chapters?: EbookChapter[]; error: string | null }>;
  onSaveChapter: (chapter: EbookChapter) => Promise<{ error: string | null }>;
  onDeleteChapter: (chapterId: string) => Promise<{ error: string | null }>;
  generating: boolean;
  progress: number;
}

const ChaptersStep: React.FC<ChaptersStepProps> = ({
  contentData,
  chapters,
  onGenerate,
  onSaveChapter,
  onDeleteChapter,
  generating,
  progress
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingChapterIndex, setEditingChapterIndex] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!contentData?.tableOfContents) {
      setError('A table of contents is required before generating chapters');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const { chapters: generatedChapters, error: generateError } = await onGenerate();
      
      if (generateError) {
        throw new Error(generateError);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate chapters');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditChapter = (index: number) => {
    setEditingChapterIndex(index);
    setEditedContent(chapters[index].content || '');
  };

  const handleSaveChapter = async () => {
    if (editingChapterIndex === null) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      const updatedChapter = {
        ...chapters[editingChapterIndex],
        content: editedContent
      };
      
      const { error: saveError } = await onSaveChapter(updatedChapter);
      
      if (saveError) {
        throw new Error(saveError);
      }
      
      setEditingChapterIndex(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save chapter');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingChapterIndex(null);
  };

  const handleDeleteChapter = async (chapterId?: string) => {
    if (!chapterId) {
      setError('Invalid chapter ID');
      return;
    }
    
    try {
      setError(null);
      const { error: deleteError } = await onDeleteChapter(chapterId);
      
      if (deleteError) {
        throw new Error(deleteError);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete chapter');
    }
  };

  const toggleChapterExpansion = (index: number) => {
    const newExpandedChapters = new Set(expandedChapters);
    if (newExpandedChapters.has(index)) {
      newExpandedChapters.delete(index);
    } else {
      newExpandedChapters.add(index);
    }
    setExpandedChapters(newExpandedChapters);
  };

  return (
    <div>
      <h2 className="text-xl font-display text-ink-dark dark:text-gray-200 mb-2">
        Chapter Content
      </h2>
      <p className="text-ink-light dark:text-gray-400 font-serif mb-6">
        Generate or edit the content for each chapter of your eBook.
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
      
      {(isGenerating || generating) && progress > 0 && progress < 100 && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Generating chapters</h3>
              <div className="mt-2">
                <div className="bg-blue-200 dark:bg-blue-800/50 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-accent-primary h-2 rounded-full transition-all duration-500 ease-in-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 font-serif text-right">
                  {Math.round(progress)}% complete
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-cream dark:bg-gray-850 p-6 rounded-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-ink-dark dark:text-gray-200 flex items-center">
            <BookText className="w-5 h-5 mr-2 text-accent-primary" />
            {contentData.title ? `Chapters for "${contentData.title}"` : 'eBook Chapters'}
          </h3>
        </div>
        
        {chapters && chapters.length > 0 ? (
          <div className="space-y-4">
            {chapters.map((chapter, index) => (
              <div 
                key={chapter.id || index} 
                className="border border-accent-tertiary/20 dark:border-gray-700 rounded-md overflow-hidden"
              >
                <div className="bg-white dark:bg-gray-800 p-4 flex justify-between items-center">
                  <h4 className="font-medium text-ink-dark dark:text-gray-200">
                    Chapter {index + 1}: {chapter.title}
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => toggleChapterExpansion(index)}
                      className="p-1.5 text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary transition-colors"
                    >
                      {expandedChapters.has(index) ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditChapter(index)}
                      className="p-1.5 text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary transition-colors"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChapter(chapter.id)}
                      className="p-1.5 text-ink-light dark:text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {expandedChapters.has(index) && (
                  <div className="border-t border-accent-tertiary/20 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    {editingChapterIndex === index ? (
                      <div>
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="w-full px-4 py-3 border border-accent-tertiary/30 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-ink-dark dark:text-gray-200 font-serif focus:border-accent-primary focus:ring focus:ring-accent-primary/20 dark:focus:ring-accent-primary/30 transition-colors"
                          rows={15}
                        ></textarea>
                        <div className="flex justify-end space-x-3 mt-4">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 border border-accent-tertiary/30 dark:border-gray-600 text-ink-light dark:text-gray-400 rounded hover:bg-accent-tertiary/10 dark:hover:bg-gray-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveChapter}
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
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none font-serif prose-headings:font-display">
                        {chapter.content ? (
                          <div dangerouslySetInnerHTML={{ __html: chapter.content.replace(/\n/g, '<br>') }} />
                        ) : (
                          <p className="text-ink-light dark:text-gray-500 italic">No content yet. Click the edit button to add content.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-accent-tertiary/30 dark:border-gray-700 rounded-md">
            <BookText className="w-12 h-12 text-accent-primary/50 mx-auto mb-4" />
            <p className="text-ink-light dark:text-gray-400 font-serif mb-4">
              {contentData.tableOfContents 
                ? `Generate chapter content based on your table of contents.`
                : 'You need to create a table of contents before generating chapters.'}
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || generating || !contentData.tableOfContents}
              className={`px-5 py-2 rounded mx-auto flex items-center ${
                isGenerating || generating || !contentData.tableOfContents
                  ? 'bg-accent-primary/50 cursor-not-allowed text-white/80'
                  : 'bg-accent-primary text-white hover:bg-accent-primary/90'
              } transition-colors`}
            >
              {isGenerating || generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Chapters...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate All Chapters
                </>
              )}
            </button>
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
                Each chapter is generated based on your table of contents and input data. This is the most 
                time-consuming part of the eBook creation process, as the AI writes detailed content for each chapter.
                You can edit any chapter content manually if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChaptersStep; 