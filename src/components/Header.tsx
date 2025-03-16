import React, { useState, useEffect } from 'react';
import { BookOpen, Menu, LogOut, User, X, Settings, BookText, LifeBuoy, WifiOff, RefreshCw, Wand2, PenTool } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import AuthModal from './auth/AuthModal';
import { useNavigation, ViewType } from '../contexts/NavigationContext';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { profile, isOffline, retry } = useProfile();
  const { navigateTo } = useNavigation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialView, setInitialView] = useState<'login' | 'signup'>('login');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleOpenAuthModal = (view: 'login' | 'signup') => {
    setInitialView(view);
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigate = (view: ViewType) => {
    navigateTo(view);
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };
  
  const handleRetryConnection = () => {
    setIsRetrying(true);
    retry();
    setTimeout(() => setIsRetrying(false), 1500);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileDropdownOpen && !(event.target as Element).closest('.profile-dropdown-container')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  return (
    <header className="py-4 px-6 md:px-10 bg-paper border-b border-accent-tertiary/30">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-8 h-8 text-accent-primary" />
          <h1 className="font-display text-2xl font-semibold text-ink-dark">Autopen</h1>
        </div>
        
        <nav className="hidden md:flex space-x-8">
          {user ? (
            <>
              <button 
                onClick={() => handleNavigate('dashboard')} 
                className="font-serif text-ink-light hover:text-ink-dark transition-colors focus:outline-none"
              >
                Dashboard
              </button>
              <button 
                onClick={() => handleNavigate('brainDump')} 
                className="font-serif text-ink-light hover:text-ink-dark transition-colors focus:outline-none"
              >
                Brain Dump
              </button>
              <button 
                onClick={() => handleNavigate('creator')} 
                className="font-serif text-ink-light hover:text-ink-dark transition-colors focus:outline-none"
              >
                Creator
              </button>
              <button 
                onClick={() => handleNavigate('projects')} 
                className="font-serif text-ink-light hover:text-ink-dark transition-colors focus:outline-none"
              >
                Products
              </button>
            </>
          ) : (
            <>
              <button className="font-serif text-ink-light hover:text-ink-dark transition-colors focus:outline-none">Home</button>
              <button className="font-serif text-ink-light hover:text-ink-dark transition-colors focus:outline-none">Features</button>
              <button className="font-serif text-ink-light hover:text-ink-dark transition-colors focus:outline-none">Pricing</button>
              <button className="font-serif text-ink-light hover:text-ink-dark transition-colors focus:outline-none">About</button>
            </>
          )}
        </nav>
        
        <div className="flex items-center space-x-4">
          {isOffline && (
            <button 
              onClick={handleRetryConnection}
              disabled={isRetrying}
              className="hidden md:flex items-center text-amber-600 border border-amber-300 rounded-full px-2 py-1 text-xs hover:bg-amber-50 transition-colors"
            >
              {isRetrying ? (
                <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 mr-1" />
              )}
              <span className="font-serif">{isRetrying ? 'Connecting...' : 'Offline'}</span>
            </button>
          )}
          
          {user ? (
            <div className="relative profile-dropdown-container">
              <button 
                onClick={toggleProfileDropdown}
                className="flex items-center space-x-2 px-3 py-2 rounded-full border border-accent-tertiary/30 hover:bg-cream transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-accent-primary/20 flex items-center justify-center text-accent-primary font-serif">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.email ? user.email[0].toUpperCase() : <User className="w-5 h-5" />
                  )}
                </div>
                <span className="hidden sm:block font-serif text-ink-light">
                  {profile?.username || user.email?.split('@')[0] || 'Account'}
                </span>
              </button>
              
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-paper rounded-md shadow-lg py-1 border border-accent-tertiary/20 z-50">
                  <button
                    onClick={() => handleNavigate('brainDump')}
                    className="flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light hover:bg-cream text-left"
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    Brain Dump
                  </button>
                  <button
                    onClick={() => handleNavigate('creator')}
                    className="flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light hover:bg-cream text-left"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Creator
                  </button>
                  <button
                    onClick={() => handleNavigate('projects')}
                    className="flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light hover:bg-cream text-left"
                  >
                    <BookText className="w-4 h-4 mr-2" />
                    My Products
                  </button>
                  <button
                    onClick={() => handleNavigate('settings')}
                    className="flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light hover:bg-cream text-left"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </button>
                  <button
                    onClick={() => handleNavigate('support')}
                    className="flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light hover:bg-cream text-left"
                  >
                    <LifeBuoy className="w-4 h-4 mr-2" />
                    Support
                  </button>
                  <div className="border-t border-accent-tertiary/20 my-1"></div>
                  {isOffline && (
                    <button
                      onClick={handleRetryConnection}
                      className="flex items-center w-full px-4 py-2 text-sm font-serif text-amber-600 hover:bg-cream text-left"
                    >
                      {isRetrying ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <WifiOff className="w-4 h-4 mr-2" />
                      )}
                      {isRetrying ? 'Connecting...' : 'Reconnect'}
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm font-serif text-red-600 hover:bg-cream text-left"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button 
                onClick={() => handleOpenAuthModal('login')}
                className="hidden md:block px-5 py-2 font-serif text-accent-primary border border-accent-primary/30 rounded hover:bg-accent-primary/5 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => handleOpenAuthModal('signup')}
                className="hidden md:block px-5 py-2 font-serif bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
              >
                Sign Up
              </button>
            </>
          )}
          <button className="md:hidden" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-ink-light" />
            ) : (
              <Menu className="w-6 h-6 text-ink-light" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden pt-4 pb-3 border-t border-accent-tertiary/20 mt-4">
          <nav className="flex flex-col space-y-3">
            {user ? (
              <>
                <button 
                  onClick={() => handleNavigate('dashboard')}
                  className="font-serif px-4 py-2 text-ink-light hover:bg-cream text-left"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => handleNavigate('brainDump')}
                  className="font-serif px-4 py-2 text-ink-light hover:bg-cream text-left"
                >
                  Brain Dump
                </button>
                <button 
                  onClick={() => handleNavigate('creator')}
                  className="font-serif px-4 py-2 text-ink-light hover:bg-cream text-left"
                >
                  Creator
                </button>
                <button 
                  onClick={() => handleNavigate('projects')}
                  className="font-serif px-4 py-2 text-ink-light hover:bg-cream text-left"
                >
                  My Products
                </button>
                <button 
                  onClick={() => handleNavigate('settings')}
                  className="font-serif px-4 py-2 text-ink-light hover:bg-cream text-left"
                >
                  Account Settings
                </button>
                <button 
                  onClick={() => handleNavigate('support')}
                  className="font-serif px-4 py-2 text-ink-light hover:bg-cream text-left"
                >
                  Support
                </button>
                {isOffline && (
                  <button
                    onClick={handleRetryConnection}
                    className="font-serif px-4 py-2 text-amber-600 hover:bg-cream text-left flex items-center"
                  >
                    {isRetrying ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <WifiOff className="w-4 h-4 mr-2" />
                    )}
                    {isRetrying ? 'Connecting...' : 'Reconnect'}
                  </button>
                )}
                <button 
                  onClick={handleSignOut}
                  className="font-serif px-4 py-2 text-red-600 hover:bg-cream text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button className="font-serif px-4 py-2 text-ink-light hover:bg-cream text-left">
                  Home
                </button>
                <button className="font-serif px-4 py-2 text-ink-light hover:bg-cream text-left">
                  Features
                </button>
                <button className="font-serif px-4 py-2 text-ink-light hover:bg-cream text-left">
                  Pricing
                </button>
                <button className="font-serif px-4 py-2 text-ink-light hover:bg-cream text-left">
                  About
                </button>
                
                <div className="flex flex-col space-y-2 pt-2 border-t border-accent-tertiary/20">
                  <button 
                    onClick={() => handleOpenAuthModal('login')}
                    className="font-serif px-4 py-2 text-accent-primary hover:bg-cream text-left"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => handleOpenAuthModal('signup')}
                    className="font-serif mx-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialView={initialView}
      />
    </header>
  );
};

export default Header;