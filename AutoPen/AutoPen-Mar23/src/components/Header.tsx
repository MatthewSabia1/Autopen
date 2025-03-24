import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Menu, 
  LogOut, 
  X, 
  Settings, 
  BookText, 
  LifeBuoy, 
  WifiOff, 
  RefreshCw, 
  Wand2, 
  Brain, 
  Folder, 
  HomeIcon, 
  LayoutDashboard, 
  Moon, 
  Sun 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../contexts/ThemeContext';
import AuthModal from './auth/AuthModal';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { profile, retry } = useProfile();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false); // For offline detection
  const [isRetrying, setIsRetrying] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Check for offline status and set up auto-reconnect attempt
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOffline(!navigator.onLine);
    };

    // Initialize
    setIsOffline(!navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  const handleOpenAuthModal = (view: 'login' | 'signup') => {
    setAuthModalType(view);
    setAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsProfileDropdownOpen(false);
      setIsMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileAction = (action: () => void) => {
    if (!user) {
      handleOpenAuthModal('login');
      return;
    }
    action();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      className={`bg-paper dark:bg-gray-800 border-b border-accent-tertiary/20 dark:border-gray-700 transition-colors duration-200 ${isTransitioning ? 'opacity-50' : ''}`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-accent-primary" />
              <span className="font-display text-xl text-ink-dark dark:text-gray-100">Autopen</span>
            </Link>
            
            {user && (
              <nav className="hidden md:flex space-x-6">
                <Link 
                  to="/dashboard" 
                  className={`font-serif ${location.pathname === '/dashboard' ? 'text-accent-primary' : 'text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary'}`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/brain-dump" 
                  className={`font-serif ${location.pathname === '/brain-dump' ? 'text-accent-primary' : 'text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary'}`}
                >
                  Brain Dump
                </Link>
                <Link 
                  to="/brain-dumps" 
                  className={`font-serif ${location.pathname === '/brain-dumps' ? 'text-accent-primary' : 'text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary'}`}
                >
                  Saved Analyses
                </Link>
                <Link 
                  to="/projects" 
                  className={`font-serif ${location.pathname === '/projects' ? 'text-accent-primary' : 'text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary'}`}
                >
                  Projects
                </Link>
                <Link 
                  to="/creator" 
                  className={`font-serif ${location.pathname === '/creator' ? 'text-accent-primary' : 'text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary'}`}
                >
                  Creator
                </Link>
                <Link 
                  to="/products" 
                  className={`font-serif ${location.pathname === '/products' ? 'text-accent-primary' : 'text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary'}`}
                >
                  Products
                </Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {isOffline && (
              <div className="relative">
                <button 
                  onClick={() => setIsRetrying(true)}
                  className="flex items-center text-danger px-2 py-1 rounded text-sm border border-danger/30 hover:bg-danger/5"
                >
                  <WifiOff className="w-3 h-3 mr-1" />
                  <span className="text-xs hidden sm:inline">Offline</span>
                </button>
                
                {isRetrying && (
                  <div className="absolute right-0 mt-2 w-64 bg-paper dark:bg-gray-700 rounded shadow-lg z-10 border border-accent-tertiary/20 dark:border-gray-600">
                    <div className="p-4">
                      <h4 className="font-display text-ink-dark dark:text-gray-100 text-sm mb-2">Limited connectivity mode</h4>
                      <p className="text-ink-light dark:text-gray-300 text-xs mb-3">
                        You are currently working offline. Some features might be limited.
                      </p>
                      <button 
                        onClick={() => {
                          retry();
                          setIsRetrying(false);
                        }}
                        className="flex items-center justify-center w-full text-xs px-3 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/90"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Reconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2"
                >
                  <div className="h-8 w-8 rounded-full bg-accent-primary text-white flex items-center justify-center text-sm uppercase">
                    {profile?.username ? profile.username[0] : user?.email ? user.email[0] : 'U'}
                  </div>
                  {profile?.username && <span className="font-serif text-ink-light dark:text-gray-300 hidden md:inline-block">{profile.username}</span>}
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-paper dark:bg-gray-700 rounded shadow-lg z-10 border border-accent-tertiary/20 dark:border-gray-600 transition-all duration-200">
                    <button 
                      onClick={() => handleProfileAction(() => navigate('/settings'))}
                      className="flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light dark:text-gray-300 hover:bg-cream dark:hover:bg-gray-600 text-left"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </button>
                    <button
                      onClick={() => handleProfileAction(() => toggleDarkMode())}
                      className="flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light dark:text-gray-300 hover:bg-cream dark:hover:bg-gray-600 text-left"
                    >
                      {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                      {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button
                      onClick={() => handleProfileAction(() => navigate('/support'))}
                      className="flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light dark:text-gray-300 hover:bg-cream dark:hover:bg-gray-600 text-left"
                    >
                      <LifeBuoy className="w-4 h-4 mr-2" />
                      Support
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm font-serif text-danger hover:bg-cream dark:hover:bg-gray-600 text-left border-t border-accent-tertiary/20 dark:border-gray-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <button 
                  onClick={() => handleOpenAuthModal('login')}
                  className="px-4 py-1 font-serif text-accent-primary border border-accent-primary/30 rounded hover:bg-accent-primary/5 transition-colors hidden md:block dark:text-accent-primary dark:border-accent-primary/50 dark:hover:bg-accent-primary/10"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => handleOpenAuthModal('signup')}
                  className="px-4 py-1 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
            
            <button className="md:hidden" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-ink-light dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-ink-light dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-accent-tertiary/20 dark:border-gray-700 mt-4">
            <nav className="flex flex-col space-y-3">
              {user ? (
                <>
                  <Link 
                    to="/dashboard"
                    className={`font-serif px-4 py-2 ${location.pathname === '/dashboard' ? 'text-accent-primary' : 'text-ink-light dark:text-gray-300'} hover:bg-cream dark:hover:bg-gray-700 text-left flex items-center`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link 
                    to="/brain-dump"
                    className={`font-serif px-4 py-2 ${location.pathname === '/brain-dump' ? 'text-accent-primary' : 'text-ink-light dark:text-gray-300'} hover:bg-cream dark:hover:bg-gray-700 text-left flex items-center`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Brain Dump
                  </Link>
                  <Link 
                    to="/brain-dumps"
                    className={`font-serif px-4 py-2 ${location.pathname === '/brain-dumps' ? 'text-accent-primary' : 'text-ink-light dark:text-gray-300'} hover:bg-cream dark:hover:bg-gray-700 text-left flex items-center`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BookText className="w-4 h-4 mr-2" />
                    Saved Analyses
                  </Link>
                  <Link 
                    to="/projects"
                    className={`font-serif px-4 py-2 ${location.pathname === '/projects' ? 'text-accent-primary' : 'text-ink-light dark:text-gray-300'} hover:bg-cream dark:hover:bg-gray-700 text-left flex items-center`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    Projects
                  </Link>
                  <Link 
                    to="/creator"
                    className={`font-serif px-4 py-2 ${location.pathname === '/creator' ? 'text-accent-primary' : 'text-ink-light dark:text-gray-300'} hover:bg-cream dark:hover:bg-gray-700 text-left flex items-center`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Creator
                  </Link>
                  <Link 
                    to="/products"
                    className={`font-serif px-4 py-2 ${location.pathname === '/products' ? 'text-accent-primary' : 'text-ink-light dark:text-gray-300'} hover:bg-cream dark:hover:bg-gray-700 text-left flex items-center`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BookText className="w-4 h-4 mr-2" />
                    Products
                  </Link>
                  <button
                    onClick={() => handleProfileAction(() => toggleDarkMode())}
                    className="font-serif px-4 py-2 text-ink-light dark:text-gray-300 hover:bg-cream dark:hover:bg-gray-700 text-left flex items-center"
                  >
                    {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <Link 
                    to="/support"
                    className={`font-serif px-4 py-2 ${location.pathname === '/support' ? 'text-accent-primary' : 'text-ink-light dark:text-gray-300'} hover:bg-cream dark:hover:bg-gray-700 text-left flex items-center`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LifeBuoy className="w-4 h-4 mr-2" />
                    Support
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="font-serif px-4 py-2 text-danger hover:bg-cream dark:hover:bg-gray-700 text-left border-t border-accent-tertiary/20 dark:border-gray-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/"
                    className="font-serif px-4 py-2 text-ink-light dark:text-gray-300 hover:bg-cream dark:hover:bg-gray-700 text-left flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <HomeIcon className="w-4 h-4 mr-2" />
                    Home
                  </Link>
                  <Link 
                    to="/#features"
                    className="font-serif px-4 py-2 text-ink-light dark:text-gray-300 hover:bg-cream dark:hover:bg-gray-700 text-left"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link 
                    to="/#pricing"
                    className="font-serif px-4 py-2 text-ink-light dark:text-gray-300 hover:bg-cream dark:hover:bg-gray-700 text-left"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link 
                    to="/#about"
                    className="font-serif px-4 py-2 text-ink-light dark:text-gray-300 hover:bg-cream dark:hover:bg-gray-700 text-left"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                  <button 
                    onClick={() => handleOpenAuthModal('login')}
                    className="font-serif px-4 py-2 text-accent-primary hover:bg-cream dark:hover:bg-gray-700 text-left"
                  >
                    Sign In
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
      
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        initialView={authModalType}
      />
    </header>
  );
};

export default Header;