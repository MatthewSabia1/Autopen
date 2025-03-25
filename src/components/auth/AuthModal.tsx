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
  DialogClose,
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
      <DialogContent className="sm:max-w-md p-0 border-accent-tertiary/20 bg-paper">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PenTool className="h-8 w-8 text-accent-primary" />
            <h1 className="text-3xl font-bold text-slate-800">Autopen</h1>
          </div>
          <DialogTitle className="text-center text-slate-600">
            {view === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4 text-ink-light hover:text-ink-dark">
            <X className="h-5 w-5" />
          </DialogClose>
        </DialogHeader>
        <div className="p-6">
          {view === 'login' ? (
            <div className="py-4">
              <LoginForm />
              <div className="mt-4 text-center text-sm text-slate-600">
                Don't have an account?{" "}
                <button
                  onClick={toggleView}
                  className="text-accent-primary hover:text-accent-primary/80 font-medium"
                >
                  Sign up
                </button>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <SignUpForm />
              <div className="mt-4 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <button
                  onClick={toggleView}
                  className="text-accent-primary hover:text-accent-primary/80 font-medium"
                >
                  Sign in
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal; 