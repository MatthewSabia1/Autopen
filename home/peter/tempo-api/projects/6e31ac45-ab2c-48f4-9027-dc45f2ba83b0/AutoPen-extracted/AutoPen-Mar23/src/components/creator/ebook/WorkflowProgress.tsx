import React from 'react';
import { Check, Pen, BookText, List, Pencil, BookOpen, ScrollText, FileSearch, FileText } from 'lucide-react';
import { EbookWorkflowStep } from '../../../types/ebook.types';

interface WorkflowProgressProps {
  currentStep: EbookWorkflowStep | null;
  completedSteps: EbookWorkflowStep[] | undefined;
  onStepChange: (step: EbookWorkflowStep) => void;
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  currentStep,
  completedSteps = [], // Provide a default empty array if undefined
  onStepChange
}) => {
  // Step configuration with labels and icons
  const steps = [
    {
      id: EbookWorkflowStep.INPUT_HANDLING,
      label: 'Input',
      icon: <Pen className="w-4 h-4" />
    },
    {
      id: EbookWorkflowStep.GENERATE_TITLE,
      label: 'Title',
      icon: <Pencil className="w-4 h-4" />
    },
    {
      id: EbookWorkflowStep.GENERATE_TOC,
      label: 'Contents',
      icon: <List className="w-4 h-4" />
    },
    {
      id: EbookWorkflowStep.GENERATE_CHAPTERS,
      label: 'Chapters',
      icon: <BookText className="w-4 h-4" />
    },
    {
      id: EbookWorkflowStep.GENERATE_INTRODUCTION,
      label: 'Intro',
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      id: EbookWorkflowStep.GENERATE_CONCLUSION,
      label: 'Conclusion',
      icon: <ScrollText className="w-4 h-4" />
    },
    {
      id: EbookWorkflowStep.ASSEMBLE_DRAFT,
      label: 'Draft',
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      id: EbookWorkflowStep.AI_REVIEW,
      label: 'Review',
      icon: <FileSearch className="w-4 h-4" />
    },
    {
      id: EbookWorkflowStep.GENERATE_PDF,
      label: 'PDF',
      icon: <FileText className="w-4 h-4" />
    }
  ];

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center min-w-max">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || completedSteps.includes(steps[index - 1]?.id);
          
          return (
            <React.Fragment key={step.id}>
              {/* Step button */}
              <button
                onClick={() => isClickable && onStepChange(step.id)}
                disabled={!isClickable}
                className={`flex flex-col items-center relative ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                {/* Step circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : isCurrent
                      ? 'bg-accent-primary/10 text-accent-primary dark:bg-accent-primary/20'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.icon}
                </div>
                
                {/* Step label */}
                <span
                  className={`text-xs mt-1 font-serif ${
                    isCurrent
                      ? 'text-accent-primary dark:text-accent-primary/90 font-medium'
                      : 'text-ink-light dark:text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
                
                {/* Current step indicator */}
                {isCurrent && (
                  <div className="absolute -bottom-1 w-full flex justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-primary"></div>
                  </div>
                )}
              </button>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    completedSteps.includes(step.id)
                      ? 'bg-green-400 dark:bg-green-600/80'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                ></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowProgress; 