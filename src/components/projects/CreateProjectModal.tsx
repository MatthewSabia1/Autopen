import React, { useState } from 'react';
import { X, BookOpen, Loader, Check, Wand2, BookText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useProjects } from '../../hooks/useProjects';

type FormValues = {
  title: string;
  description: string;
  template: string;
};

const TEMPLATES = [
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

const CreateProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: () => void;
}> = ({ isOpen, onClose, onProjectCreated }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      template: 'ebook'
    }
  });
  const selectedTemplate = watch('template');
  const { createProject } = useProjects();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const onSubmit = async (data: FormValues) => {
    setIsCreating(true);
    setError(null);
    
    try {
      // Create initial content structure based on template
      let initialContent = {};
      
      if (data.template === 'ebook') {
        initialContent = {
          type: 'ebook',
          sections: [
            { title: 'Introduction', content: '' },
            { title: 'Chapter 1', content: '' },
            { title: 'Chapter 2', content: '' },
            { title: 'Chapter 3', content: '' },
            { title: 'Conclusion', content: '' }
          ]
        };
      } else if (data.template === 'course') {
        initialContent = {
          type: 'course',
          sections: [
            { title: 'Course Overview', content: '' },
            { title: 'Module 1: Getting Started', content: '' },
            { title: 'Module 2: Core Concepts', content: '' },
            { title: 'Module 3: Advanced Techniques', content: '' },
            { title: 'Final Project', content: '' }
          ]
        };
      } else if (data.template === 'blog') {
        initialContent = {
          type: 'blog',
          sections: [
            { title: 'Introduction', content: '' },
            { title: 'Main Content', content: '' },
            { title: 'Conclusion', content: '' }
          ]
        };
      } else if (data.template === 'video_script') {
        initialContent = {
          type: 'video_script',
          scenes: [
            { title: 'Opening', content: '', duration: 30 },
            { title: 'Main Point 1', content: '', duration: 60 },
            { title: 'Main Point 2', content: '', duration: 60 },
            { title: 'Main Point 3', content: '', duration: 60 },
            { title: 'Closing/Call to Action', content: '', duration: 30 }
          ],
          totalDuration: 240
        };
      } else if (data.template === 'newsletter') {
        initialContent = {
          type: 'newsletter',
          sections: [
            { title: 'Header/Introduction', content: '' },
            { title: 'Main Story', content: '' },
            { title: 'Secondary Story', content: '' },
            { title: 'Call-to-Action', content: '' },
            { title: 'Footer/Contact Information', content: '' }
          ]
        };
      } else if (data.template === 'social_media') {
        initialContent = {
          type: 'social_media',
          platforms: [
            { 
              name: 'Instagram',
              posts: [
                { title: 'Post 1', content: '', hashtags: [] }
              ]
            },
            { 
              name: 'Twitter',
              posts: [
                { title: 'Tweet 1', content: '', hashtags: [] }
              ]
            },
            { 
              name: 'Facebook',
              posts: [
                { title: 'Post 1', content: '' }
              ]
            }
          ]
        };
      } else {
        // Fallback for any other template
        initialContent = {
          type: 'ebook',
          sections: [
            { title: 'Untitled Section', content: '' }
          ]
        };
      }
      
      // Call the createProject function and await its result
      const { data: product, error } = await createProject({
        title: data.title,
        description: data.description,
        content: initialContent,
        status: 'draft'
      });
      
      if (error) {
        throw new Error(error);
      }
      
      // First close the modal to avoid UI lag
      onClose();

      // Then immediately notify parent of successful creation
      if (onProjectCreated) {
        console.log('Calling onProjectCreated callback with new project:', product?.id);
        onProjectCreated();
      }
      
      // Show a success message after creation (as a notification or toast)
      setTimeout(() => {
        // Optional: Could add a toast notification here
        console.log('Project creation completed successfully');
      }, 500);
      
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to create product');
      setIsCreating(false);  // Only set isCreating to false on error
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-black dark:bg-opacity-80" 
          aria-hidden="true" 
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="px-4 pt-5 pb-4 bg-white dark:bg-dark-bg-secondary sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-900/40 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary" id="modal-title">
                  Create New Project
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-tertiary">
                  Start a new AI-assisted content creation project.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-md">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  id="title"
                  className={`w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg-tertiary border ${errors.title ? 'border-red-500 dark:border-red-700' : 'border-gray-300 dark:border-dark-border-primary'} rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-dark-text-primary dark:placeholder-dark-text-muted`}
                  placeholder="Enter a title for your project"
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
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className={`w-full px-4 py-2 bg-gray-50 dark:bg-dark-bg-tertiary border ${errors.description ? 'border-red-500 dark:border-red-700' : 'border-gray-300 dark:border-dark-border-primary'} rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 dark:text-dark-text-primary dark:placeholder-dark-text-muted`}
                  placeholder="Briefly describe your project (optional)"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                  Project Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map((template) => (
                    <div 
                      key={template.id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedTemplate === template.id 
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-600' 
                          : 'border-gray-300 dark:border-dark-border-primary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary/70'
                      }`}
                      onClick={() => setValue('template', template.id)}
                    >
                      <div className="flex items-start">
                        <div className={`w-4 h-4 mt-0.5 rounded-full border flex-shrink-0 mr-2 ${
                          selectedTemplate === template.id 
                            ? 'border-amber-500 bg-amber-500 dark:border-amber-500 dark:bg-amber-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedTemplate === template.id && (
                            <Check className="w-3 h-3 text-white dark:text-dark-bg-secondary" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-dark-text-primary text-sm">
                            {template.name}
                          </h4>
                          <p className="text-gray-500 dark:text-dark-text-tertiary text-xs">
                            {template.description}
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        className="hidden"
                        value={template.id}
                        {...register('template', { required: true })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-dark-bg-tertiary p-4 rounded-md border border-gray-200 dark:border-dark-border-primary mt-4">
                <div className="flex items-start">
                  <BookText className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-dark-text-primary text-sm">Next: Brain Dump Tool</h4>
                    <p className="text-gray-500 dark:text-dark-text-tertiary text-xs mt-1">
                      After creating your project, you'll be directed to the Brain Dump tool to gather and analyze your raw content. This helps our AI understand your ideas and generate better results.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-200 dark:border-dark-border-primary flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-border-primary text-gray-700 dark:text-dark-text-secondary rounded hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-amber-600 dark:bg-amber-600 text-white rounded hover:bg-amber-700 dark:hover:bg-amber-700 transition-colors flex items-center disabled:opacity-70"
                >
                  {isCreating ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;