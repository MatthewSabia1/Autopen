import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import BrainDump from './components/BrainDump';
import ResultsDisplay from './components/ResultsDisplay';
import UserDashboard from './components/UserDashboard';
import { useAuth } from './contexts/AuthContext';
import { BookOpen } from 'lucide-react';
import AuthModal from './components/auth/AuthModal';
import SettingsLayout from './components/settings/SettingsLayout';
import { useNavigation } from './contexts/NavigationContext';
import ProjectsList from './components/projects/ProjectsList';
import ProjectDetail from './components/projects/ProjectDetail';
import { useAnalysis } from './contexts/AnalysisContext';
import Creator from './components/creator/Creator';
import CreatorDetail from './components/creator/CreatorDetail';

function App() {
  const { user, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialAuthView, setInitialAuthView] = useState<'login' | 'signup'>('signup');
  const { activeView } = useNavigation();
  const { isAnalysisComplete } = useAnalysis();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="font-serif text-ink-light">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const handleOpenAuthModal = (view: 'login' | 'signup') => {
    setInitialAuthView(view);
    setIsAuthModalOpen(true);
  };

  // Helper for rendering authenticated user content
  const renderAuthenticatedContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <UserDashboard />;
      case 'brainDump':
        return (
          <div className="w-full max-w-6xl mx-auto px-6 py-8">
            <BrainDump />
            {isAnalysisComplete && <ResultsDisplay />}
          </div>
        );
      case 'projects':
        return <ProjectsList />;
      case 'projectDetail':
        return <ProjectDetail />;
      case 'creator':
        return <Creator />;
      case 'creatorDetail':
        return <CreatorDetail />;
      case 'settings':
        return <SettingsLayout />;
      case 'support':
        return (
          <div className="w-full max-w-4xl mx-auto bg-paper rounded-lg shadow-sm border border-accent-tertiary/20 p-8 my-8">
            <h2 className="font-display text-3xl text-ink-dark mb-6">Support</h2>
            <p className="font-serif text-ink-light mb-4">
              Need help with Textera? Our support team is here to assist you.
            </p>
            <div className="bg-cream p-6 rounded-md border border-accent-tertiary/20 mb-6">
              <h3 className="font-display text-xl text-ink-dark mb-3">Contact Support</h3>
              <p className="font-serif text-ink-light mb-4">
                Send us an email at support@textera.com and we'll get back to you as soon as possible.
              </p>
              <button className="px-5 py-2 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors">
                Email Support
              </button>
            </div>
            <div className="bg-cream p-6 rounded-md border border-accent-tertiary/20">
              <h3 className="font-display text-xl text-ink-dark mb-3">Frequently Asked Questions</h3>
              <ul className="space-y-4">
                <li>
                  <h4 className="font-serif font-semibold text-ink-dark">How do I create my first e-book?</h4>
                  <p className="font-serif text-ink-light">
                    Use the Brain Dump Tool to start organizing your ideas, then follow the prompts to transform them into structured content.
                  </p>
                </li>
                <li>
                  <h4 className="font-serif font-semibold text-ink-dark">Can I export my e-books to different formats?</h4>
                  <p className="font-serif text-ink-light">
                    Yes, Textera supports exporting to EPUB, PDF, and MOBI formats for compatibility with different e-readers.
                  </p>
                </li>
                <li>
                  <h4 className="font-serif font-semibold text-ink-dark">How do I update my account information?</h4>
                  <p className="font-serif text-ink-light">
                    Visit the Account Settings page to update your profile information, change your password, or manage notification preferences.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        );
      default:
        return <UserDashboard />;
    }
  };
  
  return (
    <div className="min-h-screen bg-cream font-serif text-ink-dark">
      <Header />
      
      <main>
        {user ? (
          renderAuthenticatedContent()
        ) : (
          <>
            <Hero />
            
            <div className="w-full max-w-6xl mx-auto px-6 py-8">
              <div className="flex justify-center">
                <h2 className="inline-block font-display text-3xl mb-6 pb-2 border-b-2 border-accent-primary">Brain Dump Tool</h2>
              </div>
              <p className="text-center max-w-3xl mx-auto mb-10 text-ink-light">
                Upload your unorganized content and let our AI transform it into structured e-book ideas, chapter outlines, and content recommendations.
              </p>
              
              <div className="bg-paper p-6 rounded-lg border border-accent-tertiary/20 shadow-sm mb-8">
                <div className="text-center mb-6">
                  <h3 className="font-display text-xl text-ink-dark mb-2">Get Started with Textera</h3>
                  <p className="font-serif text-ink-light">
                    Create a free account to save your projects and access all features
                  </p>
                </div>
                <div className="flex justify-center space-x-4">
                  <button 
                    onClick={() => handleOpenAuthModal('login')}
                    className="px-5 py-2 font-serif text-accent-primary border border-accent-primary/30 rounded hover:bg-accent-primary/5 transition-colors"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => handleOpenAuthModal('signup')}
                    className="px-5 py-2 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
                  >
                    Create Account
                  </button>
                </div>
              </div>
              
              <BrainDump />
              
              {isAnalysisComplete && <ResultsDisplay />}
            </div>
          </>
        )}
      </main>
      
      <footer className="bg-paper py-8 border-t border-accent-tertiary/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpenIcon className="w-5 h-5 text-accent-primary" />
                <span className="font-display text-xl text-ink-dark">Textera</span>
              </div>
              <p className="text-ink-light text-sm">AI-powered e-book creation and publishing</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-4">
              <div>
                <h4 className="font-display text-ink-dark mb-2">Product</h4>
                <ul className="space-y-1">
                  <li><a href="#" className="text-ink-light hover:text-accent-primary text-sm">Features</a></li>
                  <li><a href="#" className="text-ink-light hover:text-accent-primary text-sm">Pricing</a></li>
                  <li><a href="#" className="text-ink-light hover:text-accent-primary text-sm">Examples</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-display text-ink-dark mb-2">Resources</h4>
                <ul className="space-y-1">
                  <li><a href="#" className="text-ink-light hover:text-accent-primary text-sm">Blog</a></li>
                  <li><a href="#" className="text-ink-light hover:text-accent-primary text-sm">Tutorials</a></li>
                  <li><a href="#" className="text-ink-light hover:text-accent-primary text-sm">Support</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-display text-ink-dark mb-2">Company</h4>
                <ul className="space-y-1">
                  <li><a href="#" className="text-ink-light hover:text-accent-primary text-sm">About</a></li>
                  <li><a href="#" className="text-ink-light hover:text-accent-primary text-sm">Contact</a></li>
                  <li><a href="#" className="text-ink-light hover:text-accent-primary text-sm">Privacy</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-accent-tertiary/10 mt-8 pt-8 text-center text-ink-faded text-sm">
            <p>© {new Date().getFullYear()} Textera. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialView={initialAuthView}
      />
    </div>
  );
}

// BookOpen icon from Lucide React
const BookOpenIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

export default App;