import React, { createContext, useContext, useState } from 'react';

export type ViewType = 'dashboard' | 'brainDump' | 'projects' | 'projectDetail' | 'settings' | 'support' | 'creator' | 'creatorDetail';

type NavigationContextType = {
  activeView: ViewType;
  navigateTo: (view: ViewType) => void;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');

  const navigateTo = (view: ViewType) => {
    setActiveView(view);
    // Scroll to top when navigating to a new view
    window.scrollTo(0, 0);
  };

  return (
    <NavigationContext.Provider value={{ activeView, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};