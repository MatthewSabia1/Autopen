import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Type, PenTool, BookText, Wand2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Hero: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [initialView, setInitialView] = React.useState<'login' | 'signup'>('signup');

  const handleOpenAuthModal = (view: 'login' | 'signup') => {
    setInitialView(view);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="bg-gradient-to-br from-accent-primary/5 to-accent-secondary/5 pt-16 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-lg bg-accent-primary/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-accent-primary" />
          </div>
        </div>
        
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-ink-dark mb-6 leading-tight">
          Transform your ideas into <span className="text-accent-primary">published e-books</span>
        </h1>
        
        <p className="font-serif text-lg md:text-xl text-ink-light mb-10 max-w-3xl mx-auto leading-relaxed">
          Autopen helps content creators organize their thoughts, structure their ideas, and 
          create professional e-books with an AI-powered writing assistant.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="px-8 py-3 bg-accent-primary text-white rounded-md font-serif hover:bg-accent-primary/90 transition-colors">
            Try It Now – It's Free
          </button>
          <button className="px-8 py-3 border border-accent-primary/30 text-accent-primary rounded-md font-serif hover:bg-accent-primary/5 transition-colors">
            Learn More
          </button>
        </div>
      </div>
      
      <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-paper p-6 rounded-lg border border-accent-tertiary/20 shadow-sm">
          <div className="w-12 h-12 bg-accent-primary/10 rounded-full flex items-center justify-center mb-4">
            <Type className="w-6 h-6 text-accent-primary" />
          </div>
          <h3 className="font-display text-xl text-ink-dark mb-2">Brain Dump</h3>
          <p className="font-serif text-ink-light">
            Upload documents, paste text, or link content. Our AI will analyze and organize it into structured e-book concepts.
          </p>
        </div>
        
        <div className="bg-paper p-6 rounded-lg border border-accent-tertiary/20 shadow-sm">
          <div className="w-12 h-12 bg-accent-secondary/10 rounded-full flex items-center justify-center mb-4">
            <Wand2 className="w-6 h-6 text-accent-secondary" />
          </div>
          <h3 className="font-display text-xl text-ink-dark mb-2">AI Creator</h3>
          <p className="font-serif text-ink-light">
            Use AI to generate complete e-books, courses, blog posts, and more from your ideas or Brain Dump results.
          </p>
        </div>
        
        <div className="bg-paper p-6 rounded-lg border border-accent-tertiary/20 shadow-sm">
          <div className="w-12 h-12 bg-accent-tertiary/20 rounded-full flex items-center justify-center mb-4">
            <BookText className="w-6 h-6 text-accent-tertiary" />
          </div>
          <h3 className="font-display text-xl text-ink-dark mb-2">Publishing</h3>
          <p className="font-serif text-ink-light">
            Export your finished e-book in multiple formats ready for publishing platforms and digital distribution.
          </p>
        </div>
      </div>
      
      {!user && (
        <div className="mt-16 text-center">
          <div className="inline-block bg-paper p-8 rounded-lg border border-accent-tertiary/20 shadow-sm">
            <h2 className="font-display text-2xl text-ink-dark mb-4">Create Your Free Account</h2>
            <p className="font-serif text-ink-light mb-6 max-w-lg mx-auto">
              Sign up today to transform your content into professional e-books. No credit card required to get started.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => handleOpenAuthModal('signup')}
                className="px-6 py-3 font-serif bg-accent-primary text-white rounded-md hover:bg-accent-primary/90 transition-colors"
              >
                Create Account
              </button>
              <button 
                onClick={() => handleOpenAuthModal('login')}
                className="px-6 py-3 font-serif border border-accent-primary/30 text-accent-primary rounded-md hover:bg-accent-primary/5 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hero;