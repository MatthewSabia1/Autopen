import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { useAuth } from '../../contexts/AuthContext';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup';
};

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  initialView = 'login'
}) => {
  const [view, setView] = useState<'login' | 'signup'>(initialView);
  const { user } = useAuth();

  // Close modal automatically when user is authenticated
  useEffect(() => {
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  // Update view when initialView prop changes
  useEffect(() => {
    if (initialView) {
      setView(initialView);
    }
  }, [initialView]);

  if (!isOpen) return null;

  const toggleView = () => {
    setView(view === 'login' ? 'signup' : 'login');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-ink-dark bg-opacity-75" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-paper rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
          <button
            className="absolute top-4 right-4 text-ink-light hover:text-ink-dark focus:outline-none"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="px-4 pt-5 pb-4 bg-paper sm:p-8">
            {view === 'login' ? (
              <LoginForm onToggle={toggleView} />
            ) : (
              <SignupForm onToggle={toggleView} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;