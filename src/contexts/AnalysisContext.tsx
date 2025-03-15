import React, { createContext, useContext, useState } from 'react';
import { AnalysisResult } from '../types/BrainDumpTypes';

type AnalysisContextType = {
  analysisResult: AnalysisResult | null;
  isAnalysisComplete: boolean;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setIsAnalysisComplete: (complete: boolean) => void;
  resetAnalysis: () => void;
};

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState<boolean>(false);

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setIsAnalysisComplete(false);
  };

  return (
    <AnalysisContext.Provider 
      value={{ 
        analysisResult, 
        isAnalysisComplete, 
        setAnalysisResult, 
        setIsAnalysisComplete,
        resetAnalysis
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};