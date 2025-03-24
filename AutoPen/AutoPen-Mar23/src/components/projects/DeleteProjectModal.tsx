import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (deleteContent: boolean) => Promise<void>;
  projectName: string;
}

const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  projectName
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteContent, setDeleteContent] = useState(false);
  
  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(deleteContent);
      onClose();
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-ink-dark/50 dark:bg-black/70 transition-opacity" 
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-paper dark:bg-dark-bg-secondary p-6 text-left shadow-xl transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-ink-light dark:text-dark-text-muted hover:text-ink-dark dark:hover:text-dark-text-secondary focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 p-1.5 bg-red-100 dark:bg-red-900/40 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-ink-dark dark:text-dark-text-primary">Delete Project</h3>
              <p className="mt-2 font-serif text-ink-light dark:text-dark-text-secondary">
                Are you sure you want to delete <span className="font-semibold text-ink-dark dark:text-dark-text-primary">{projectName}</span>? This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Delete options */}
          <div className="mt-6 space-y-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="delete-content"
                checked={deleteContent}
                onChange={(e) => setDeleteContent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-accent-tertiary/30 dark:border-dark-border-primary text-accent-primary focus:ring-accent-primary/20 dark:bg-dark-bg-tertiary dark:checked:bg-accent-primary"
              />
              <div>
                <label 
                  htmlFor="delete-content" 
                  className="font-serif font-medium text-ink-dark dark:text-dark-text-primary"
                >
                  Also delete all content
                </label>
                <p className="text-sm font-serif text-ink-light dark:text-dark-text-tertiary">
                  Delete all Brain Dumps, Products, and other content associated with this project.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-serif text-ink-light dark:text-dark-text-secondary border border-accent-tertiary/30 dark:border-dark-border-primary rounded-md hover:bg-cream/50 dark:hover:bg-dark-bg-tertiary/70 transition-colors disabled:opacity-70"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 font-serif text-white bg-red-600 dark:bg-red-700 rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors flex items-center disabled:opacity-70"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Deleting...
                </>
              ) : (
                'Delete Project'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectModal;