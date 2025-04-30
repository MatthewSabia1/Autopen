import React, { createContext, useContext, useState } from 'react';
import { AnalysisResult } from '../types/BrainDumpTypes';

type AnalysisContextType = {
  analysisResult: AnalysisResult | null;
  isAnalysisComplete: boolean;
  generatedTitle?: string;
  setAnalysisResult: (result: AnalysisResult | null, title?: string) => void;
  setIsAnalysisComplete: (complete: boolean) => void;
  resetAnalysis: () => void;
};

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [analysisResult, setAnalysisResultInternal] = useState<AnalysisResult | null>(null);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState<boolean>(false);
  const [generatedTitle, setGeneratedTitle] = useState<string | undefined>(undefined);

  const setAnalysisResult = (result: AnalysisResult | null, title?: string) => {
    setAnalysisResultInternal(result);
    setGeneratedTitle(title);
  };

  const resetAnalysis = () => {
    setAnalysisResultInternal(null);
    setIsAnalysisComplete(false);
    setGeneratedTitle(undefined);
  };

  return (
    <AnalysisContext.Provider 
      value={{ 
        analysisResult, 
        isAnalysisComplete, 
        generatedTitle,
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