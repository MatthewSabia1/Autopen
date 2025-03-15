import React from 'react';
import { BookText, Lightbulb, BookCopy, Check, AlertCircle, Wand2 } from 'lucide-react';
import { useAnalysis } from '../contexts/AnalysisContext';
import { useNavigation } from '../contexts/NavigationContext';

const ResultsDisplay: React.FC = () => {
  const { analysisResult, isAnalysisComplete } = useAnalysis();
  const { navigateTo } = useNavigation();

  if (!isAnalysisComplete || !analysisResult) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-paper rounded-lg shadow-sm border border-accent-tertiary/20 p-6 mt-8 mb-12">
        <div className="text-center py-8">
          <BookText className="w-12 h-12 text-accent-tertiary/40 mx-auto mb-3" />
          <p className="font-serif text-ink-light mb-4">
            Submit content using the Brain Dump tool above to see AI-generated e-book ideas.
          </p>
        </div>
      </div>
    );
  }

  // Check if there was an error during analysis
  const hasError = !!analysisResult.error;

  return (
    <div className="w-full max-w-4xl mx-auto bg-paper rounded-lg shadow-sm border border-accent-tertiary/20 p-6 mt-8 mb-12">
      <div className="flex items-center mb-4">
        <BookText className="w-6 h-6 text-accent-primary mr-2" />
        <h2 className="font-display text-2xl text-ink-dark">Analysis Results</h2>
      </div>

      {hasError ? (
        <div className="mb-6 p-4 bg-red-50 rounded-md border border-red-200 flex items-start text-red-700">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-serif font-semibold mb-1">Analysis Error</p>
            <p className="font-serif text-sm">{analysisResult.error}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 bg-cream rounded-md border border-accent-tertiary/20">
            <h3 className="font-serif font-semibold text-lg text-ink-dark mb-2">Content Summary</h3>
            <p className="font-serif text-ink-light leading-relaxed">
              {analysisResult.summary}
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-4">
              <Lightbulb className="w-5 h-5 text-accent-secondary mr-2" />
              <h3 className="font-serif font-semibold text-lg text-ink-dark">E-book Ideas</h3>
            </div>

            <div className="space-y-4">
              {analysisResult.ebookIdeas.map((idea, index) => (
                <div key={index} className="p-4 border border-accent-tertiary/20 rounded-md hover:shadow-md transition-shadow">
                  <h4 className="font-display text-xl text-ink-dark mb-2">"{idea.title}"</h4>
                  <p className="font-serif text-ink-light mb-3">{idea.description}</p>
                  
                  <div className="mt-4">
                    <h5 className="font-serif font-semibold text-ink-light text-sm mb-2">Suggested Chapters:</h5>
                    <ul className="space-y-1">
                      {idea.chapters.map((chapter, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className="w-4 h-4 text-accent-primary mt-1 mr-2 flex-shrink-0" />
                          <span className="font-serif text-ink-light">{chapter}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => navigateTo('creator')}
                      className="flex-1 px-4 py-2 font-serif text-sm bg-accent-secondary text-white border border-accent-secondary rounded hover:bg-accent-secondary/90 transition-colors flex items-center justify-center"
                    >
                      <Wand2 className="w-4 h-4 mr-1" />
                      Create with AI
                    </button>
                    <button 
                      onClick={() => navigateTo('projects')}
                      className="flex-1 px-4 py-2 font-serif text-sm bg-accent-primary/10 text-accent-primary border border-accent-primary/20 rounded hover:bg-accent-primary/20 transition-colors flex items-center justify-center"
                    >
                      <BookCopy className="w-4 h-4 mr-1" />
                      Develop Manually
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex justify-between items-center border-t border-accent-tertiary/20 pt-4 mt-6">
        <p className="font-serif text-sm text-ink-faded">
          Analysis {hasError ? 'failed' : 'completed successfully'}
        </p>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigateTo('projects')}
            className="px-4 py-2 font-serif text-sm bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
          >
            Start New Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;