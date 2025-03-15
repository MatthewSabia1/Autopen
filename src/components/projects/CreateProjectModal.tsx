import React, { useState } from 'react';
import { X, BookOpen, Loader, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useProjects } from '../../hooks/useProjects';
import { useNavigation } from '../../contexts/NavigationContext';

type FormValues = {
  title: string;
  description: string;
  template: string;
};

const TEMPLATES = [
  {
    id: 'ebook',
    name: 'eBook',
    description: 'Create a structured digital book with chapters and sections'
  },
  {
    id: 'course',
    name: 'Course',
    description: 'Educational content organized into modules and lessons'
  },
  {
    id: 'blog',
    name: 'Blog Post',
    description: 'Article format with introduction, body, and conclusion'
  }
];

type CreateProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      template: 'ebook'
    }
  });
  const selectedTemplate = watch('template');
  const { createProject } = useProjects();
  const { navigateTo } = useNavigation();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSuccessfully, setCreatedSuccessfully] = useState(false);

  if (!isOpen) return null;

  const onSubmit = async (data: FormValues) => {
    setIsCreating(true);
    setError(null);
    
    try {
      const templateData = TEMPLATES.find(t => t.id === data.template);
      
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
      } else {
        // Fallback for any other template
        initialContent = {
          type: 'ebook',
          sections: [
            { title: 'Untitled Section', content: '' }
          ]
        };
      }
      
      const { data: product, error } = await createProject({
        title: data.title,
        description: data.description,
        content: initialContent,
        status: 'draft',
        progress: 0
      });
      
      if (error) {
        throw new Error(error);
      }
      
      // On success, show success message then close after a brief moment
      setCreatedSuccessfully(true);
      
      setTimeout(() => {
        // Close modal and stay on products list to see the new product
        onClose();
        setCreatedSuccessfully(false);
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to create product');
    } finally {
      if (!createdSuccessfully) {
        setIsCreating(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-ink-dark bg-opacity-75" aria-hidden="true" onClick={createdSuccessfully ? null : onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-paper rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
          {!createdSuccessfully && (
            <button
              className="absolute top-4 right-4 text-ink-light hover:text-ink-dark focus:outline-none"
              onClick={onClose}
            >
              <X className="w-6 h-6" />
            </button>
          )}

          <div className="px-4 pt-5 pb-4 bg-paper sm:p-6 sm:pb-4">
            {createdSuccessfully ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-display text-2xl text-ink-dark mb-3">Product Created!</h3>
                <p className="font-serif text-ink-light mb-4">
                  Your new product has been created successfully and will appear in your products list.
                </p>
              </div>
            ) : (
              <>
                <div className="sm:flex sm:items-start">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-accent-primary/10 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                    <BookOpen className="w-6 h-6 text-accent-primary" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-display text-ink-dark" id="modal-title">
                      Create New Product
                    </h3>
                    <p className="mt-1 text-sm font-serif text-ink-light">
                      Start a new e-book product with your desired settings.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                  {error && (
                    <div className="p-3 text-sm font-serif text-red-700 bg-red-50 border border-red-200 rounded-md">
                      {error}
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="title" className="block font-serif text-sm text-ink-light mb-1">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      className={`w-full px-4 py-2 font-serif bg-cream border ${errors.title ? 'border-red-500' : 'border-accent-tertiary/30'} rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary`}
                      placeholder="Enter a title for your product"
                      {...register('title', { 
                        required: 'Title is required',
                        maxLength: {
                          value: 100,
                          message: 'Title must be 100 characters or less'
                        }
                      })}
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="description" className="block font-serif text-sm text-ink-light mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      className={`w-full px-4 py-2 font-serif bg-cream border ${errors.description ? 'border-red-500' : 'border-accent-tertiary/30'} rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary`}
                      placeholder="Briefly describe your product (optional)"
                      {...register('description', { 
                        maxLength: {
                          value: 500,
                          message: 'Description must be 500 characters or less'
                        }
                      })}
                    ></textarea>
                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
                  </div>

                  <div>
                    <label className="block font-serif text-sm text-ink-light mb-2">
                      Product Template
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {TEMPLATES.map((template) => (
                        <div 
                          key={template.id}
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedTemplate === template.id 
                              ? 'border-accent-primary bg-accent-primary/5' 
                              : 'border-accent-tertiary/30 hover:bg-cream'
                          }`}
                          onClick={() => setValue('template', template.id)}
                        >
                          <div className="flex items-start">
                            <div className={`w-4 h-4 mt-0.5 rounded-full border flex-shrink-0 mr-2 ${
                              selectedTemplate === template.id 
                                ? 'border-accent-primary bg-accent-primary' 
                                : 'border-accent-tertiary'
                            }`}>
                              {selectedTemplate === template.id && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-serif font-semibold text-ink-dark text-sm">
                                {template.name}
                              </h4>
                              <p className="font-serif text-ink-light text-xs">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          <input
                            type="radio"
                            className="hidden"
                            value={template.id}
                            {...register('template')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-accent-tertiary/20 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 font-serif border border-accent-tertiary/30 text-ink-light rounded hover:bg-cream transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-4 py-2 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors flex items-center"
                    >
                      {isCreating ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Product'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;