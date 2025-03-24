import React from 'react';
import { Loader2, CheckCircle, AlertCircle, Zap, BookText, Wand2, BookCopy, ScrollText, FileText, FileSearch, StopCircle } from 'lucide-react';
import { EbookWorkflowStep } from '../../../types/ebook.types';

interface AutoGenerationStatusProps {
  isGenerating: boolean;
  progress: number;
  currentStep: EbookWorkflowStep | null;
  completedSteps: EbookWorkflowStep[] | undefined;
  onCancel: () => void;
  error: string | null;
}

interface StepInfo {
  label: string;
  description: string;
  icon: React.ReactNode;
}

type StepDataType = {
  [key in EbookWorkflowStep]?: StepInfo;
};

const AutoGenerationStatus: React.FC<AutoGenerationStatusProps> = ({
  isGenerating,
  progress,
  currentStep,
  completedSteps,
  onCancel,
  error
}) => {
  const getStepInfo = (step: EbookWorkflowStep): StepInfo => {
    const stepData: StepDataType = {
      [EbookWorkflowStep.GENERATE_TITLE]: {
        label: 'Generating Title',
        description: 'Creating an engaging title for your eBook...',
        icon: <Wand2 className="w-4 h-4" />
      },
      [EbookWorkflowStep.GENERATE_TOC]: {
        label: 'Creating Table of Contents',
        description: 'Structuring your eBook with chapters and sections...',
        icon: <BookText className="w-4 h-4" />
      },
      [EbookWorkflowStep.GENERATE_CHAPTERS]: {
        label: 'Writing Chapters',
        description: 'Creating detailed content for each chapter...',
        icon: <BookCopy className="w-4 h-4" />
      },
      [EbookWorkflowStep.GENERATE_INTRODUCTION]: {
        label: 'Crafting Introduction',
        description: 'Writing an engaging introduction to hook your readers...',
        icon: <ScrollText className="w-4 h-4" />
      },
      [EbookWorkflowStep.GENERATE_CONCLUSION]: {
        label: 'Creating Conclusion',
        description: 'Summarizing key points and crafting a memorable ending...',
        icon: <ScrollText className="w-4 h-4" />
      },
      [EbookWorkflowStep.ASSEMBLE_DRAFT]: {
        label: 'Assembling Draft',
        description: 'Bringing all sections together into a cohesive eBook...',
        icon: <BookCopy className="w-4 h-4" />
      },
      [EbookWorkflowStep.AI_REVIEW]: {
        label: 'AI Review & Revisions',
        description: 'Polishing content for clarity, flow, and engagement...',
        icon: <FileSearch className="w-4 h-4" />
      },
      [EbookWorkflowStep.GENERATE_PDF]: {
        label: 'Creating PDF',
        description: 'Formatting your eBook as a professional document...',
        icon: <FileText className="w-4 h-4" />
      }
      // INPUT_HANDLING doesn't have an entry as it's done before auto-generation
    };
    
    return stepData[step] || { 
      label: 'Processing', 
      description: 'Working on your eBook...', 
      icon: <Loader2 className="w-4 h-4 animate-spin" /> 
    };
  };

  const stepStatus = (step: EbookWorkflowStep) => {
    const steps = Array.isArray(completedSteps) ? completedSteps : [];
    if (steps.includes(step)) {
      return 'completed';
    }
    if (step === currentStep) {
      return 'current';
    }
    return 'pending';
  };

  // Get list of steps in order for auto-generation (skipping INPUT_HANDLING)
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

  if (!isGenerating && !error && progress === 100) {
    return (
      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-md p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-green-800 dark:text-green-300 font-medium">eBook Generated Successfully!</h3>
            <p className="text-sm text-green-700 dark:text-green-400 font-serif mt-1">
              Your complete eBook has been generated. You can now download it or customize any section if needed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-red-800 dark:text-red-300 font-medium">Generation Error</h3>
            <p className="text-sm text-red-700 dark:text-red-400 font-serif mt-1">
              {error || "An error occurred during eBook generation. You can continue manually."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-md p-5">
      <div className="flex items-center mb-4">
        <Zap className="w-5 h-5 text-accent-primary mr-2" />
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">
          Auto-Generating Your eBook
        </h3>
        <div className="ml-auto">
          <button
            onClick={() => {
              console.log('Auto-generation cancel button clicked');
              // Add immediate visual feedback
              const button = document.activeElement as HTMLButtonElement;
              if (button) {
                button.disabled = true;
                button.textContent = 'Cancelling...';
              }
              onCancel();
            }}
            className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center text-sm"
          >
            <StopCircle className="w-3.5 h-3.5 mr-1.5" />
            Cancel
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-blue-700 dark:text-blue-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="bg-blue-200 dark:bg-blue-800/50 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-accent-primary h-2.5 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-3 mt-6">
        {stepsInOrder.map((step) => {
          const status = stepStatus(step);
          const { label, description, icon } = getStepInfo(step);
          
          return (
            <div 
              key={step}
              className={`flex items-start p-3 rounded-md ${
                status === 'current' 
                  ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30' 
                  : status === 'completed'
                  ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30' 
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                status === 'current' 
                  ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300' 
                  : status === 'completed'
                  ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}>
                {status === 'current' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  icon
                )}
              </div>
              
              <div>
                <h4 className={`font-medium ${
                  status === 'current' 
                    ? 'text-blue-800 dark:text-blue-300' 
                    : status === 'completed'
                    ? 'text-green-800 dark:text-green-300'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {label}
                </h4>
                <p className={`text-sm mt-0.5 ${
                  status === 'current' 
                    ? 'text-blue-700 dark:text-blue-400' 
                    : status === 'completed'
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-500'
                }`}>
                  {description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-blue-700 dark:text-blue-400 font-serif">
          Your eBook is being generated automatically. This may take a few minutes depending on the length and complexity.
        </p>
      </div>
    </div>
  );
};

export default AutoGenerationStatus; 