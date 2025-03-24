import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import BrainDump from './components/BrainDump';
import ResultsDisplay from './components/ResultsDisplay';
import BrainDumpList from './components/BrainDumpList';
import BrainDumpDetail from './components/BrainDumpDetail';
import UserDashboard from './components/UserDashboard';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthModal from './components/auth/AuthModal';
import SettingsLayout from './components/settings/SettingsLayout';
import ProjectsList from './components/projects/ProjectsList';
import ProjectDetail from './components/projects/ProjectDetail';
import ProjectsPage from './components/projects/ProjectsPage';
import FolderDetail from './components/projects/FolderDetail';
import { useAnalysis } from './contexts/AnalysisContext';
import Creator from './components/creator/Creator';
import CreatorDetail from './components/creator/CreatorDetail';
import EbookWorkflow from './components/creator/ebook/EbookWorkflow';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="font-serif text-ink-light dark:text-gray-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { user, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialAuthView, setInitialAuthView] = useState<'login' | 'signup'>('signup');
  const { isAnalysisComplete } = useAnalysis();
  
  // Debug current route
  useEffect(() => {
    console.log('App component mounted');
    console.log('Current routes initialized');
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="font-serif text-ink-light dark:text-gray-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const handleOpenAuthModal = (view: 'login' | 'signup') => {
    setInitialAuthView(view);
    setIsAuthModalOpen(true);
  };
  
  // Home page content for non-authenticated users
  const HomeContent = () => (
    <>
      <Hero />
      
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-center">
          <h2 className="inline-block font-display text-3xl mb-6 pb-2 border-b-2 border-accent-primary">Brain Dump Tool</h2>
        </div>
        <p className="text-center max-w-3xl mx-auto mb-10 text-ink-light dark:text-gray-400">
          Upload your unorganized content and let our AI transform it into structured e-book ideas, chapter outlines, and content recommendations.
        </p>
        
        <div className="bg-paper dark:bg-gray-800 p-6 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-sm mb-8">
          <div className="text-center mb-6">
            <h3 className="font-display text-xl text-ink-dark dark:text-gray-200 mb-2">Get Started with Autopen</h3>
            <p className="font-serif text-ink-light dark:text-gray-400">
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
  );

  // Support page content
  const SupportContent = () => (
    <div className="w-full max-w-4xl mx-auto bg-paper dark:bg-gray-800 rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-gray-700 p-8 my-8">
      <h2 className="font-display text-3xl text-ink-dark dark:text-gray-200 mb-6">Support</h2>
      <p className="font-serif text-ink-light dark:text-gray-400 mb-4">
        Need help with Autopen? Our support team is here to assist you.
      </p>
      <div className="bg-cream dark:bg-gray-900 p-6 rounded-md border border-accent-tertiary/20 dark:border-gray-700 mb-6">
        <h3 className="font-display text-xl text-ink-dark dark:text-gray-200 mb-3">Contact Support</h3>
        <p className="font-serif text-ink-light dark:text-gray-400 mb-4">
          Send us an email at support@autopen.com and we'll get back to you as soon as possible.
        </p>
        <button className="px-5 py-2 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors">
          Email Support
        </button>
      </div>
      <div className="bg-cream dark:bg-gray-900 p-6 rounded-md border border-accent-tertiary/20 dark:border-gray-700">
        <h3 className="font-display text-xl text-ink-dark dark:text-gray-200 mb-3">Frequently Asked Questions</h3>
        <ul className="space-y-4">
          <li>
            <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-200">How do I create my first e-book?</h4>
            <p className="font-serif text-ink-light dark:text-gray-400">
              Use the Brain Dump Tool to start organizing your ideas, then follow the prompts to transform them into structured content.
            </p>
          </li>
          <li>
            <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-200">Can I export my e-books to different formats?</h4>
            <p className="font-serif text-ink-light dark:text-gray-400">
              Yes, Autopen supports exporting to EPUB, PDF, and MOBI formats for compatibility with different e-readers.
            </p>
          </li>
          <li>
            <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-200">How do I update my account information?</h4>
            <p className="font-serif text-ink-light dark:text-gray-400">
              Visit the Account Settings page to update your profile information, change your password, or manage notification preferences.
            </p>
          </li>
        </ul>
      </div>
    </div>
  );

  // Brain Dump page with results
  const BrainDumpContent = () => (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      <BrainDump />
      {isAnalysisComplete && <ResultsDisplay />}
    </div>
  );
  
  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="min-h-screen bg-cream dark:bg-gray-900 font-serif text-ink-dark dark:text-gray-100 transition-colors duration-200">
          <Header />
          
          <main className="dark:text-gray-200">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <HomeContent />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              <Route path="/brain-dump" element={<ProtectedRoute><BrainDumpContent /></ProtectedRoute>} />
              <Route path="/brain-dumps" element={<ProtectedRoute><BrainDumpList /></ProtectedRoute>} />
              <Route path="/brain-dump/:id" element={<ProtectedRoute><BrainDumpDetail /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
              <Route path="/projects/folder/:id" element={<ProtectedRoute><FolderDetail /></ProtectedRoute>} />
              <Route path="/projects/folder/:folderId/view/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><ProjectsList /></ProtectedRoute>} />
              <Route path="/products/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
              <Route path="/creator" element={<ProtectedRoute><Creator /></ProtectedRoute>} />
              
              {/* This specific route must come before the generic creator/:id route */}
              <Route path="/creator/ebook/:contentId" element={<ProtectedRoute><EbookWorkflow /></ProtectedRoute>} />
              <Route path="/creator/:id" element={<ProtectedRoute><CreatorDetail /></ProtectedRoute>} />
              
              <Route path="/settings" element={<ProtectedRoute><SettingsLayout /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><SupportContent /></ProtectedRoute>} />
              
              {/* Fallback for unknown routes */}
              <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
            </Routes>
          </main>
          
          <footer className="bg-paper dark:bg-gray-800 py-8 border-t border-accent-tertiary/20 dark:border-gray-700 transition-colors duration-200">
            <div className="max-w-6xl mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-6 md:mb-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpenIcon className="w-5 h-5 text-accent-primary" />
                    <span className="font-display text-xl text-ink-dark dark:text-gray-100">Autopen</span>
                  </div>
                  <p className="text-ink-light dark:text-gray-400 text-sm">AI-powered e-book creation and publishing</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-4">
                  <div>
                    <h4 className="font-display text-ink-dark dark:text-gray-200 mb-2">Product</h4>
                    <ul className="space-y-1">
                      <li><a href="#" className="text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary text-sm">Features</a></li>
                      <li><a href="#" className="text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary text-sm">Pricing</a></li>
                      <li><a href="#" className="text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary text-sm">Examples</a></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-display text-ink-dark dark:text-gray-200 mb-2">Resources</h4>
                    <ul className="space-y-1">
                      <li><a href="#" className="text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary text-sm">Blog</a></li>
                      <li><a href="#" className="text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary text-sm">Tutorials</a></li>
                      <li><a href="#" className="text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary text-sm">Support</a></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-display text-ink-dark dark:text-gray-200 mb-2">Company</h4>
                    <ul className="space-y-1">
                      <li><a href="#" className="text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary text-sm">About</a></li>
                      <li><a href="#" className="text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary text-sm">Contact</a></li>
                      <li><a href="#" className="text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary text-sm">Privacy</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-accent-tertiary/10 dark:border-gray-700 mt-8 pt-8 text-center text-ink-faded dark:text-gray-500 text-sm">
                <p> {new Date().getFullYear()} Autopen. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
        
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          initialView={initialAuthView}
        />
      </ThemeProvider>
    </BrowserRouter>
  );
}

// Pen icon for Autopen
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
    <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
    <path d="M2 2l7.586 7.586"></path>
    <circle cx="11" cy="11" r="2"></circle>
  </svg>
);

export default App;