import React from 'react';
import { BookOpen, Type, PenTool, BookText, Wand2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';

const Hero: React.FC = () => {
  const { user } = useAuth();
  const { navigateTo } = useNavigation();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [initialView, setInitialView] = React.useState<'login' | 'signup'>('signup');

  const handleOpenAuthModal = (view: 'login' | 'signup') => {
    setInitialView(view);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 md:py-20">
      <div className="flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-8 md:mb-0 md:pr-12">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-ink-dark leading-tight mb-4">
            Transform your <span className="text-accent-primary">ideas</span> into beautiful e-books
          </h1>
          <p className="font-serif text-lg text-ink-light leading-relaxed mb-8">
            Autopen uses AI to help you format, create, style, and publish professional e-books from your unorganized content.
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            {user ? (
              <>
                <button 
                  onClick={() => navigateTo('dashboard')}
                  className="px-6 py-3 font-serif bg-accent-primary text-white rounded-md hover:bg-accent-primary/90 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button 
                  onClick={() => navigateTo('creator')}
                  className="px-6 py-3 font-serif border border-accent-secondary/50 text-accent-secondary rounded-md hover:bg-accent-secondary/5 transition-colors flex items-center"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Try Creator Tool
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => handleOpenAuthModal('signup')}
                  className="px-6 py-3 font-serif bg-accent-primary text-white rounded-md hover:bg-accent-primary/90 transition-colors"
                >
                  Get Started
                </button>
                <button 
                  className="px-6 py-3 font-serif border border-accent-primary/30 text-accent-primary rounded-md hover:bg-accent-primary/5 transition-colors"
                >
                  How It Works
                </button>
              </>
            )}
          </div>
        </div>
        <div className="md:w-1/2">
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-full h-full bg-accent-secondary/10 rounded-lg"></div>
            <img 
              src="https://images.unsplash.com/photo-1519791883288-dc8bd696e667?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
              alt="Open book on desk with typewriter" 
              className="relative z-10 rounded-lg shadow-lg w-full h-auto"
            />
          </div>
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