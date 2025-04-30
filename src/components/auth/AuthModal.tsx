import React, { useState, useEffect } from 'react';
import { X, PenTool } from 'lucide-react';
import { useAuth } from '../../../supabase/auth';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const toggleView = () => {
    setView(view === 'login' ? 'signup' : 'login');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-paper rounded-lg shadow-lg border-0 p-6">
        <DialogHeader className="px-0 pt-0 pb-4 space-y-4">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <PenTool className="h-8 w-8 text-accent-primary" />
            <h1 className="text-3xl font-bold text-ink-dark">Autopen</h1>
          </div>
          <DialogTitle className="text-center text-ink-secondary">
            {view === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </DialogTitle>
        </DialogHeader>
        {view === 'login' ? (
          <div>
            <LoginForm onToggle={toggleView} />
            <div className="mt-4 text-center text-sm text-ink-secondary">
              Don't have an account?{" "}
              <button
                onClick={toggleView}
                className="text-accent-primary hover:text-accent-primary/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/50 rounded"
              >
                Sign up
              </button>
            </div>
          </div>
        ) : (
          <div>
            <SignUpForm onToggle={toggleView} />
            <div className="mt-4 text-center text-sm text-ink-secondary">
              Already have an account?{" "}
              <button
                onClick={toggleView}
                className="text-accent-primary hover:text-accent-primary/80 font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/50 rounded"
              >
                Sign in
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;