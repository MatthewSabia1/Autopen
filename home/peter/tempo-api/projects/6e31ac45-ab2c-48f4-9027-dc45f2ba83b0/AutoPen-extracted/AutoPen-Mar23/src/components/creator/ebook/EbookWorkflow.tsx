import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, ArrowLeft, ChevronRight, Loader2, AlertCircle, BookCopy, CheckCircle2, PlayCircle, StopCircle } from 'lucide-react';
import { useEbookCreator } from '../../../hooks/useEbookCreator';
import { EbookWorkflowStep } from '../../../types/ebook.types';
import WorkflowProgress from './WorkflowProgress';
import AutoGenerationStatus from './AutoGenerationStatus';
import InputStep from './steps/InputStep';
import TitleStep from './steps/TitleStep';
import TOCStep from './steps/TOCStep';
import ChaptersStep from './steps/ChaptersStep';
import IntroductionStep from './steps/IntroductionStep';
import ConclusionStep from './steps/ConclusionStep';
import AssembleDraftStep from './steps/AssembleDraftStep';
import AIReviewStep from './steps/AIReviewStep';
import PDFStep from './steps/PDFStep';

const EbookWorkflow: React.FC = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<EbookWorkflowStep | null>(null);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const [autoGenerationProgress, setAutoGenerationProgress] = useState(0);
  const [currentAutoStep, setCurrentAutoStep] = useState<EbookWorkflowStep | null>(null);
  const [autoGenerationError, setAutoGenerationError] = useState<string | null>(null);
  const [buttonText, setButtonText] = useState('Auto-Generate Complete eBook');
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const isMounted = useRef(true);
  
  const {
    loading,
    error,
    ebookContent,
    chapters,
    workflowProgress,
    generating,
    previewUrl,
    saveEbookContent,
    saveChapter,
    deleteChapter,
    generateTitle,
    generateTableOfContents,
    generateChapters,
    generateIntroduction,
    generateConclusion,
    assembleDraft,
    reviewAndRevise,
    generatePDF,
    executeNextStep,
    downloadPDF
  } = useEbookCreator(contentId);

  // Ensure we have valid workflow progress data
  const safeWorkflowProgress = {
    currentStep: workflowProgress?.currentStep || null,
    totalSteps: workflowProgress?.totalSteps || 9,
    stepsCompleted: Array.isArray(workflowProgress?.stepsCompleted) ? workflowProgress.stepsCompleted : []
  };

  // Check if we can start auto-generation
  const canStartAutoGeneration = 
    ebookContent && 
    ebookContent.rawData && 
    !isAutoGenerating && 
    !generating && 
    !(safeWorkflowProgress.stepsCompleted.length === safeWorkflowProgress.totalSteps);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Debug component mounting and contentId
  useEffect(() => {
    console.log('EbookWorkflow component mounted');
    console.log('Content ID from URL params:', contentId);
    
    // Reset auto-generation state on component mount
    if (isMounted.current) {
      setIsAutoGenerating(false);
      isGeneratingRef.current = false;
      setAutoGenerationProgress(0);
      setCurrentAutoStep(null);
      setAutoGenerationError(null);
    }
    
    // Verify URL construction
    const currentUrl = window.location.pathname;
    console.log('Current URL path:', currentUrl);
    console.log('Window location:', window.location.href);
    
    if (!contentId) {
      console.error('No content ID found in URL params');
    } else {
      console.log('Will attempt to load content with ID:', contentId);
    }
  }, [contentId]);

  // Set active step from workflow progress
  useEffect(() => {
    if (!isMounted.current) return;

    // Handle case when workflowProgress is not yet available
    if (!workflowProgress) {
      console.log('Workflow progress not yet available, defaulting to input step');
      setActiveStep(EbookWorkflowStep.INPUT_HANDLING);
      return;
    }
    
    // Ensure stepsCompleted exists and is an array
    const stepsCompleted = Array.isArray(workflowProgress.stepsCompleted) 
      ? workflowProgress.stepsCompleted 
      : [];
      
    console.log('Setting active step with workflowProgress:', { 
      currentStep: workflowProgress.currentStep,
      stepsCompleted
    });
    
    if (workflowProgress.currentStep) {
      setActiveStep(workflowProgress.currentStep);
    } else if (stepsCompleted.length === 0) {
      // If no steps completed, start at input handling
      setActiveStep(EbookWorkflowStep.INPUT_HANDLING);
    } else if (stepsCompleted.includes(EbookWorkflowStep.GENERATE_PDF)) {
      // If all steps completed, show PDF step
      setActiveStep(EbookWorkflowStep.GENERATE_PDF);
    } else {
      // Determine the next step
      const stepsInOrder = [
        EbookWorkflowStep.INPUT_HANDLING,
        EbookWorkflowStep.GENERATE_TITLE,
        EbookWorkflowStep.GENERATE_TOC,
        EbookWorkflowStep.GENERATE_CHAPTERS,
        EbookWorkflowStep.GENERATE_INTRODUCTION,
        EbookWorkflowStep.GENERATE_CONCLUSION,
        EbookWorkflowStep.ASSEMBLE_DRAFT,
        EbookWorkflowStep.AI_REVIEW,
        EbookWorkflowStep.GENERATE_PDF
      ];
      
      const nextStepIndex = stepsInOrder.findIndex(step => !stepsCompleted.includes(step));
      
      if (nextStepIndex !== -1) {
        setActiveStep(stepsInOrder[nextStepIndex]);
      } else {
        // If all steps completed but GENERATE_PDF not in the list, show PDF step
        setActiveStep(EbookWorkflowStep.GENERATE_PDF);
      }
    }
  }, [workflowProgress]);

  // Function to run complete auto-generation process
  const runAutoGeneration = useCallback(async () => {
    if (!isMounted.current) return;
    console.log('runAutoGeneration called');
    
    // Safety checks
    if (!contentId) {
      console.error('No content ID available');
      setAutoGenerationError('Missing content ID');
      return;
    }
    
    if (!ebookContent) {
      console.error('No ebook content available');
      setAutoGenerationError('No ebook content available');
      return;
    }
    
    if (!ebookContent.rawData) {
      console.error('No raw data available for auto-generation');
      setAutoGenerationError('No content data available. Please add content in the Input step.');
      return;
    }
    
    if (isAutoGenerating || isGeneratingRef.current) {
      console.log('Already auto-generating, aborting');
      return;
    }
    
    if (generating) {
      console.log('Currently generating content, cannot start auto-generation');
      return;
    }
    
    console.log('Starting auto-generation process');
    
    const stepsInOrder = [
      EbookWorkflowStep.GENERATE_TITLE,
      EbookWorkflowStep.GENERATE_TOC,
      EbookWorkflowStep.GENERATE_CHAPTERS,
      EbookWorkflowStep.GENERATE_INTRODUCTION,
      EbookWorkflowStep.GENERATE_CONCLUSION,
      EbookWorkflowStep.ASSEMBLE_DRAFT,
      EbookWorkflowStep.AI_REVIEW,
      EbookWorkflowStep.GENERATE_PDF
    ];
    
    // Find first uncompleted step
    const completedSteps = workflowProgress?.stepsCompleted || [];
    const startIndex = stepsInOrder.findIndex(step => !completedSteps.includes(step));
    
    console.log(`Starting from step index: ${startIndex}`);
    console.log('Raw data available:', !!ebookContent.rawData);
    
    if (startIndex === -1) {
      console.log('All steps already completed, nothing to do');
      return; // All steps completed
    }
    
    try {
      console.log('Setting auto-generation state to active');
      // Set both the state and the ref
      if (isMounted.current) {
        setIsAutoGenerating(true);
        isGeneratingRef.current = true;
        setAutoGenerationError(null);
        setAutoGenerationProgress(0);
      }
      
      // Run through each step sequentially
      for (let i = startIndex; i < stepsInOrder.length; i++) {
        // Check the ref instead of the state and if component is still mounted
        if (!isGeneratingRef.current || !isMounted.current) {
          console.log('Auto-generation was cancelled or component unmounted');
          break;
        }
        
        const step = stepsInOrder[i];
        console.log(`Executing step: ${step}`);
        if (isMounted.current) {
          setCurrentAutoStep(step);
          setActiveStep(step);
          setAutoGenerationProgress(Math.round(((i - startIndex) / (stepsInOrder.length - startIndex)) * 100));
        }
        
        try {
          // Force state update to take effect before continuing
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
            }, 100);
          });
          
          // Execute the appropriate step based on the current step
          console.log(`Executing specific function for step: ${step}`);
          
          let result;
          switch (step) {
            case EbookWorkflowStep.GENERATE_TITLE:
              result = await generateTitle(ebookContent.rawData);
              break;
              
            case EbookWorkflowStep.GENERATE_TOC:
              // Ensure we have both title and raw data before generating TOC
              if (!ebookContent.title) {
                throw new Error('Title must be generated before table of contents');
              }
              result = await generateTableOfContents();
              break;
              
            case EbookWorkflowStep.GENERATE_CHAPTERS:
              result = await generateChapters();
              break;
              
            case EbookWorkflowStep.GENERATE_INTRODUCTION:
              result = await generateIntroduction();
              break;
              
            case EbookWorkflowStep.GENERATE_CONCLUSION:
              result = await generateConclusion();
              break;
              
            case EbookWorkflowStep.ASSEMBLE_DRAFT:
              result = await assembleDraft();
              break;
              
            case EbookWorkflowStep.AI_REVIEW:
              result = await reviewAndRevise();
              break;
              
            case EbookWorkflowStep.GENERATE_PDF:
              result = await generatePDF();
              break;
              
            default:
              throw new Error(`Unknown step: ${step}`);
          }
          
          if (result && result.error) {
            console.error(`Error in step ${step}:`, result.error);
            throw new Error(`Error in step ${step}: ${result.error}`);
          }
          
          console.log(`Completed step: ${step}`);
          
          // Sleep to prevent potential race conditions
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (stepError: any) {
          console.error(`Error executing step ${step}:`, stepError);
          throw new Error(`Error at step ${step}: ${stepError.message || 'Unknown error'}`);
        }
      }
      
      // Set to 100% when done
      console.log('Auto-generation completed successfully');
      if (isMounted.current) {
        setAutoGenerationProgress(100);
        setCurrentAutoStep(null);
      }
      
    } catch (error: any) {
      console.error('Auto-generation failed:', error);
      if (isMounted.current) {
        setAutoGenerationError(error.message || 'An error occurred during auto-generation');
      }
    } finally {
      if (isMounted.current) {
        setIsAutoGenerating(false);
        isGeneratingRef.current = false;
        setButtonDisabled(false);
        setButtonText('Auto-Generate Complete eBook');
      }
    }
  }, [
    contentId, 
    ebookContent, 
    workflowProgress, 
    isAutoGenerating, 
    generating,
    generateTitle,
    generateTableOfContents,
    generateChapters,
    generateIntroduction,
    generateConclusion,
    assembleDraft,
    reviewAndRevise,
    generatePDF
  ]);

  const cancelAutoGeneration = () => {
    if (isMounted.current) {
      setIsAutoGenerating(false);
      isGeneratingRef.current = false;
      setCurrentAutoStep(null);
      setAutoGenerationProgress(0);
      setAutoGenerationError(null);
      setButtonDisabled(false);
      setButtonText('Auto-Generate Complete eBook');
    }
  };

  // Handle navigation back to the creator dashboard
  const handleBackToDashboard = () => {
    navigate('/creator');
  };

  // Handle navigation between steps
  const handleStepChange = (step: EbookWorkflowStep) => {
    if (isMounted.current) {
      setActiveStep(step);
    }
  };

  // Monitor auto-generation capabilities
  useEffect(() => {
    console.log('Auto-generation capability status:', canStartAutoGeneration);
    console.log('Current rawData status:', !!ebookContent?.rawData);
  }, [canStartAutoGeneration, ebookContent]);

  // Render the active step
  const renderActiveStep = () => {
    if (!activeStep) return null;
    
    console.log(`Rendering active step: ${activeStep}`);
    
    switch (activeStep) {
      case EbookWorkflowStep.INPUT_HANDLING:
        return (
          <>
            <InputStep onDataProvided={saveEbookContent} contentData={ebookContent} />
            {ebookContent?.rawData && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-md">
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-green-800 dark:text-green-300 font-medium">Data received successfully!</h3>
                    <p className="text-sm text-green-700 dark:text-green-400 font-serif mt-1">
                      You can now continue with automatic generation or manually customize each step.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => {
                      console.log('Manual step button clicked');
                      try {
                        executeNextStep();
                      } catch (error) {
                        console.error('Error executing next step:', error);
                      }
                    }}
                    disabled={generating}
                    className="px-4 py-2 border border-accent-tertiary/30 dark:border-gray-600 text-ink-dark dark:text-gray-300 rounded hover:bg-accent-tertiary/10 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Manual Step-by-Step
                  </button>
                  <button
                    onClick={() => {
                      console.log('Auto-generate button clicked in InputStep');
                      setButtonDisabled(true);
                      setButtonText('Starting...');
                      try {
                        runAutoGeneration();
                      } catch (error) {
                        console.error('Error starting auto-generation:', error);
                        setAutoGenerationError('Failed to start auto-generation process');
                        setButtonDisabled(false);
                        setButtonText('Auto-Generate Complete eBook');
                      }
                    }}
                    disabled={!canStartAutoGeneration || buttonDisabled}
                    className={`px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors flex items-center justify-center ${
                      !canStartAutoGeneration || buttonDisabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {buttonDisabled ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {buttonText}
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        {buttonText}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        );
      
      case EbookWorkflowStep.GENERATE_TITLE:
        return (
          <TitleStep
            contentData={ebookContent}
            onGenerate={generateTitle}
            onSaveTitle={saveEbookContent}
            generating={generating}
          />
        );
      
      case EbookWorkflowStep.GENERATE_TOC:
        return (
          <TOCStep
            contentData={ebookContent}
            onGenerate={generateTableOfContents}
            onSaveTOC={saveEbookContent}
            generating={generating}
          />
        );
      
      case EbookWorkflowStep.GENERATE_CHAPTERS:
        return (
          <ChaptersStep
            contentData={ebookContent}
            chapters={chapters}
            onGenerate={generateChapters}
            onSaveChapter={saveChapter}
            onDeleteChapter={deleteChapter}
            generating={generating}
            progress={workflowProgress.stepProgress?.[EbookWorkflowStep.GENERATE_CHAPTERS] || 0}
          />
        );
      
      case EbookWorkflowStep.GENERATE_INTRODUCTION:
        return (
          <IntroductionStep
            contentData={ebookContent}
            onGenerate={generateIntroduction}
            onSaveIntroduction={saveEbookContent}
            generating={generating}
          />
        );
      
      case EbookWorkflowStep.GENERATE_CONCLUSION:
        return (
          <ConclusionStep
            contentData={ebookContent}
            onGenerate={generateConclusion}
            onSaveConclusion={saveEbookContent}
            generating={generating}
          />
        );
      
      case EbookWorkflowStep.ASSEMBLE_DRAFT:
        return (
          <AssembleDraftStep
            contentData={ebookContent}
            chapters={chapters}
            onAssemble={assembleDraft}
            generating={generating}
          />
        );
      
      case EbookWorkflowStep.AI_REVIEW:
        return (
          <AIReviewStep
            contentData={ebookContent}
            onReview={reviewAndRevise}
            generating={generating}
          />
        );
      
      case EbookWorkflowStep.GENERATE_PDF:
        return (
          <PDFStep
            contentData={ebookContent}
            onGenerate={(options) => generatePDF(options)}
            onDownload={(options) => downloadPDF(options)}
            generating={generating}
            previewUrl={previewUrl}
          />
        );
      
      default:
        return <div>Invalid step</div>;
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-ink-light dark:text-gray-400 font-serif">Loading eBook workflow...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        <button 
          onClick={() => navigate('/creator')}
          className="flex items-center text-accent-primary mb-6 font-serif hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Creator
        </button>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="font-display text-xl text-red-800 dark:text-red-300 mb-2">Error Loading eBook</h2>
          <p className="text-red-700 dark:text-red-400 font-serif">
            {error || "The requested eBook could not be loaded. It may have been deleted or you may not have permission to access it."}
          </p>
          <button
            onClick={() => navigate('/creator')}
            className="px-4 py-2 bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors flex items-center mx-auto mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Creator Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center mb-8">
        <button
          onClick={handleBackToDashboard}
          className="text-ink-light dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-primary/90 transition-colors flex items-center mr-6"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span className="font-serif">Back</span>
        </button>
        
        <div className="flex-1">
          <div className="flex items-center">
            <BookCopy className="w-5 h-5 text-accent-primary mr-2" />
            <h1 className="font-display text-2xl text-ink-dark dark:text-gray-200">
              {ebookContent?.title || 'Create eBook'}
            </h1>
          </div>
          <p className="font-serif text-ink-light dark:text-gray-400 mt-1">
            {safeWorkflowProgress.stepsCompleted.length === safeWorkflowProgress.totalSteps
              ? 'eBook complete! You can download your finished eBook.'
              : `Step ${safeWorkflowProgress.stepsCompleted.length + 1} of ${safeWorkflowProgress.totalSteps}`}
          </p>
        </div>
      </div>
      
      <div className="mb-8">
        <WorkflowProgress
          currentStep={activeStep}
          completedSteps={safeWorkflowProgress.stepsCompleted}
          onStepChange={handleStepChange}
        />
      </div>
      
      {/* Auto-generation status */}
      {(isAutoGenerating || autoGenerationProgress === 100 || autoGenerationError) && (
        <div className="mb-8">
          <AutoGenerationStatus
            isGenerating={isAutoGenerating}
            progress={autoGenerationProgress}
            currentStep={currentAutoStep}
            completedSteps={safeWorkflowProgress.stepsCompleted}
            onCancel={cancelAutoGeneration}
            error={autoGenerationError}
          />
        </div>
      )}
      
      <div className="bg-paper dark:bg-gray-800 rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          {renderActiveStep()}
        </div>
        
        <div className="p-4 bg-cream dark:bg-gray-900 border-t border-accent-tertiary/20 dark:border-gray-700 flex justify-between">
          <button
            onClick={handleBackToDashboard}
            className="px-4 py-2 border border-accent-tertiary/30 dark:border-gray-600 text-ink-light dark:text-gray-400 rounded hover:bg-accent-tertiary/10 dark:hover:bg-gray-800 transition-colors flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          {activeStep === EbookWorkflowStep.INPUT_HANDLING && ebookContent?.rawData ? (
            <button
              onClick={() => {
                console.log('Auto-generate button clicked in footer');
                setButtonDisabled(true);
                setButtonText('Starting...');
                try {
                  runAutoGeneration();
                } catch (error) {
                  console.error('Error starting auto-generation:', error);
                  setAutoGenerationError('Failed to start auto-generation process');
                  setButtonDisabled(false);
                  setButtonText('Auto-Generate Complete eBook');
                }
              }}
              disabled={!canStartAutoGeneration || buttonDisabled}
              className={`px-4 py-2 rounded flex items-center ${
                !canStartAutoGeneration || buttonDisabled
                  ? 'bg-accent-primary/50 cursor-not-allowed text-white/80'
                  : 'bg-accent-primary text-white hover:bg-accent-primary/90'
              } transition-colors`}
            >
              {buttonDisabled ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {buttonText}
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {buttonText}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => executeNextStep()}
              disabled={generating || isAutoGenerating || safeWorkflowProgress.stepsCompleted.length === safeWorkflowProgress.totalSteps}
              className={`px-4 py-2 rounded flex items-center ${
                generating || isAutoGenerating || safeWorkflowProgress.stepsCompleted.length === safeWorkflowProgress.totalSteps
                  ? 'bg-accent-primary/50 cursor-not-allowed text-white/80'
                  : 'bg-accent-primary text-white hover:bg-accent-primary/90'
              } transition-colors`}
            >
              {generating || isAutoGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : safeWorkflowProgress.stepsCompleted.length === safeWorkflowProgress.totalSteps ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete
                </>
              ) : (
                <>
                  Generate Next Step
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EbookWorkflow;