import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Wand2, Loader, Check, BookText, PenTool } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useCreator } from '../../hooks/useCreator';

type FormValues = {
  title: string;
  description: string;
  type: string;
};

const CONTENT_TYPES = [
  {
    id: 'ebook',
    name: 'E-Book',
    description: 'Create a complete digital book with chapters and sections'
  },
  {
    id: 'course',
    name: 'Online Course',
    description: 'Educational content organized into modules and lessons'
  },
  {
    id: 'blog',
    name: 'Blog Post',
    description: 'Article format with introduction, body, and conclusion'
  },
  {
    id: 'video_script',
    name: 'Video Script',
    description: 'Script for video production with sections and talking points'
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Email newsletter format with sections and call-to-actions'
  },
  {
    id: 'social_media',
    name: 'Social Media',
    description: 'Content for social media platforms in various formats'
  }
];

const CreateContentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      type: 'ebook'
    }
  });
  const selectedType = watch('type');
  const { createContent } = useCreator();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSuccessfully, setCreatedSuccessfully] = useState(false);

  if (!isOpen) return null;

  const onSubmit = async (data: FormValues) => {
    setIsCreating(true);
    setError(null);
    
    try {
      const selectedTypeInfo = CONTENT_TYPES.find(t => t.id === data.type);
      
      // Create initial minimal content structure based on type
      let initialContent = {};
      
      if (data.type === 'ebook') {
        initialContent = {
          sections: [
            { title: 'Introduction', content: '' },
            { title: 'Chapter 1', content: '' },
            { title: 'Conclusion', content: '' }
          ]
        };
      } else if (data.type === 'course') {
        initialContent = {
          modules: [
            { 
              title: 'Module 1: Introduction', 
              lessons: [
                { title: 'Lesson 1: Overview', content: '' }
              ]
            }
          ]
        };
      } else if (data.type === 'blog') {
        initialContent = {
          sections: [
            { title: 'Introduction', content: '' },
            { title: 'Conclusion', content: '' }
          ]
        };
      } else if (data.type === 'video_script') {
        initialContent = {
          scenes: [
            { title: 'Opening', content: '', duration: 30 },
            { title: 'Closing', content: '', duration: 30 }
          ],
          totalDuration: 60
        };
      } else {
        // Fallback for any other content type
        initialContent = {
          sections: [
            { title: 'Section 1', content: '' }
          ]
        };
      }
      
      const { data: content, error } = await createContent({
        title: data.title,
        description: data.description,
        type: data.type,
        content: initialContent,
        status: 'draft',
        metadata: {
          needsContent: true,
          brainDumpComplete: false,
          creationType: 'blank'
        }
      });
      
      if (error) {
        throw new Error(error);
      }
      
      // On success, show success message and prepare to redirect
      setCreatedSuccessfully(true);
      
      // Wait a moment to show success UI, then redirect to brain dump
      setTimeout(() => {
        onClose();
        navigate('/brain-dump');
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating content:', err);
      setError(err.message || 'Failed to create content');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white dark:bg-gray-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
          <button
            className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="px-4 pt-5 pb-4 bg-white dark:bg-gray-800 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                <Wand2 className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                  Create AI Content
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start a new AI-assisted content creation project.
                </p>
              </div>
            </div>

            {createdSuccessfully ? (
              <div className="mt-6 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-500" />
                </div>
                <h4 className="text-xl text-gray-900 dark:text-gray-100 mb-2">Content Created!</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Now you'll be redirected to the Brain Dump tool to gather content for your project.
                </p>
                <div className="animate-pulse flex justify-center">
                  <PenTool className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md">
                    {error}
                  </div>
                )}
                
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${errors.title ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-gray-100`}
                    placeholder="Enter a title for your content"
                    {...register('title', { 
                      required: 'Title is required',
                      maxLength: {
                        value: 100,
                        message: 'Title must be 100 characters or less'
                      }
                    })}
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.title.message}</p>}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border ${errors.description ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-gray-100`}
                    placeholder="Briefly describe your content (optional)"
                    {...register('description', { 
                      maxLength: {
                        value: 500,
                        message: 'Description must be 500 characters or less'
                      }
                    })}
                  ></textarea>
                  {errors.description && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.description.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {CONTENT_TYPES.map((type) => (
                      <div 
                        key={type.id}
                        className={`p-3 border rounded-md cursor-pointer transition-colors ${
                          selectedType === type.id 
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-500/70' 
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => setValue('type', type.id)}
                      >
                        <div className="flex items-start">
                          <div className={`w-4 h-4 mt-0.5 rounded-full border flex-shrink-0 mr-2 ${
                            selectedType === type.id 
                              ? 'border-amber-500 bg-amber-500' 
                              : 'border-gray-300 dark:border-gray-500'
                          }`}>
                            {selectedType === type.id && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {type.name}
                            </h4>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              {type.description}
                            </p>
                          </div>
                        </div>
                        <input
                          type="radio"
                          className="hidden"
                          value={type.id}
                          {...register('type', { required: true })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600 mt-4">
                  <div className="flex items-start">
                    <BookText className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Next: Brain Dump Tool</h4>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        After creating your content, you'll be directed to the Brain Dump tool to gather and analyze your raw content. This helps our AI understand your ideas and generate better results.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors flex items-center"
                  >
                    {isCreating ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Create Content
                      </>
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

export default CreateContentModal;