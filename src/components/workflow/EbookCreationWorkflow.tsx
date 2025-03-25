import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkflow } from '@/lib/contexts/WorkflowContext';
import DashboardLayout from '../layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BookText,
  Brain,
  FileText,
  Lightbulb,
  PenTool,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import CreatorStep from './steps/CreatorStep';
import BrainDumpStep from './steps/BrainDumpStep';
import IdeaSelectionStep from './steps/IdeaSelectionStep';
import EbookWritingStep from './steps/EbookWritingStep';
import EbookPreviewStep from './steps/EbookPreviewStep';
import CompletedStep from './steps/CompletedStep';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * The main component for the eBook creation workflow.
 */
export default function EbookCreationWorkflow() {
  const navigate = useNavigate();
  const { id: projectId, type: urlType } = useParams<{ id?: string; type?: string }>();
  
  const {
    currentStep,
    setCurrentStep,
    project,
    loadProject,
    createProject,
    loading,
    error,
    resetWorkflow,
    workflowType
  } = useWorkflow();
  
  // Safety check - ensure we're in the ebook workflow
  useEffect(() => {
    // Check workflow type in context matches component
    if (workflowType !== 'ebook') {
      console.warn('EbookCreationWorkflow being used with incorrect workflow type:', workflowType);
    }
    
    // Check URL param matches workflow type
    if (urlType !== 'ebook' && urlType !== undefined) {
      console.warn('URL workflow type does not match component:', urlType);
      navigate('/workflow/ebook', { replace: true });
    }
  }, [workflowType, urlType, navigate]);

  // Use ref to avoid render loop with storage check
  const hasCheckedStorageRef = useRef(false);
  const shouldRedirectRef = useRef(false);
  const hasTransitionedFromStructureRef = useRef(false);
  
  // Loading state for project creation
  const [isCreating, setIsCreating] = useState(false);

  // Handle one-time navigation only
  useEffect(() => {
    if (shouldRedirectRef.current) {
      navigate('/creator', { replace: true });
      shouldRedirectRef.current = false;
    }
  }, [navigate]);
  
  // Load project data if we have an ID
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId, loadProject]);

  // One-time check for project data in session storage
  useEffect(() => {
    // Skip if we already checked storage or we have a project/projectId
    if (hasCheckedStorageRef.current || project || projectId) {
      return;
    }
    
    // Mark that we've checked
    hasCheckedStorageRef.current = true;
    
    const storedProjectData = sessionStorage.getItem('newProjectData');
    
    if (storedProjectData) {
      try {
        const { title, description } = JSON.parse(storedProjectData);
        
        if (title) {
          setIsCreating(true);
          
          createProject(title, description || '')
            .then(newProjectId => {
              sessionStorage.removeItem('newProjectData');
              navigate(`/workflow/${newProjectId}`, { replace: true });
            })
            .catch(error => {
              console.error('Error creating project from stored data:', error);
              shouldRedirectRef.current = true;
            })
            .finally(() => {
              setIsCreating(false);
            });
        } else {
          shouldRedirectRef.current = true;
        }
      } catch (e) {
        console.error('Error parsing stored project data:', e);
        sessionStorage.removeItem('newProjectData');
        shouldRedirectRef.current = true;
      }
    } else {
      // No project data found, mark for redirection
      shouldRedirectRef.current = true;
    }
  }, []); // Empty dependency array - run once only

  // Special case for ebook structure step
  useEffect(() => {
    if (currentStep === 'ebook-structure' && !hasTransitionedFromStructureRef.current) {
      hasTransitionedFromStructureRef.current = true;
      setCurrentStep('ebook-writing');
    }
  }, [currentStep, setCurrentStep]);

  // Step configuration with titles and icons
  const steps = [
    { 
      id: 'creator', 
      title: 'Project Info', 
      icon: <FileText className="h-4 w-4" /> 
    },
    { 
      id: 'brain-dump', 
      title: 'Brain Dump', 
      icon: <Brain className="h-4 w-4" /> 
    },
    { 
      id: 'idea-selection', 
      title: 'Select Idea', 
      icon: <Lightbulb className="h-4 w-4" /> 
    },
    { 
      id: 'ebook-structure', 
      title: 'Structure', 
      icon: <BookText className="h-4 w-4" /> 
    },
    { 
      id: 'ebook-writing', 
      title: 'Writing', 
      icon: <PenTool className="h-4 w-4" /> 
    },
    { 
      id: 'ebook-preview', 
      title: 'Preview', 
      icon: <Sparkles className="h-4 w-4" /> 
    },
    { 
      id: 'completed', 
      title: 'Completed', 
      icon: <CheckCircle className="h-4 w-4" /> 
    },
  ];
  
  // Calculate current step index
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  // Calculate progress percentage
  const progress = currentStepIndex >= 0 ? 
    Math.round(((currentStepIndex) / (steps.length - 1)) * 100) : 0;
  
  // Render the current step content - NO STATE UPDATES during render
  const renderStepContent = () => {
    switch (currentStep) {
      case 'creator':
        return <CreatorStep />;
      case 'brain-dump':
        return <BrainDumpStep />;
      case 'idea-selection':
        return <IdeaSelectionStep />;
      case 'ebook-structure':
        // Structure step is handled by useEffect, show loading
        return (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
          </div>
        );
      case 'ebook-writing':
        return <EbookWritingStep />;
      case 'ebook-preview':
        return <EbookPreviewStep />;
      case 'completed':
        return <CompletedStep />;
      default:
        return <div>Invalid step</div>;
    }
  };

  // For cases when we have no project but component is still rendering
  // while the navigation occurs
  if (!project && !projectId && !isCreating && shouldRedirectRef.current) {
    return (
      <DashboardLayout activeTab="Creator">
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-accent-primary" />
          <span className="ml-3 text-ink-light font-serif">Redirecting...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="Creator">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Loading indicator during project creation */}
        {isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-lg">
              <Loader2 className="h-10 w-10 text-accent-primary animate-spin mb-4" />
              <p className="font-serif text-ink-light">Creating your eBook project...</p>
            </div>
          </div>
        )}
        
        {/* Hero section */}
        <div className="bg-gradient-to-br from-accent-primary/20 to-accent-primary/5 rounded-xl p-6 md:p-8 shadow-blue-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-display text-ink-dark mb-2 flex items-center gap-2">
                <BookText className="h-7 w-7 text-accent-primary" />
                {project ? project.title : 'Create New eBook'}
              </h1>
              <p className="text-ink-light font-serif max-w-xl">
                {project?.description || 'Transform your ideas into a polished eBook with our guided AI-powered workflow.'}
              </p>
            </div>
            
            {/* Back to dashboard button */}
            <Button
              variant="outline"
              className="flex-shrink-0"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="hidden md:flex items-center mb-8 bg-paper p-1 rounded-lg border border-accent-tertiary/20">
          {steps.map((step, i) => {
            const isActive = currentStep === step.id;
            const isCompleted = i < currentStepIndex;
            const isDisabled = i > currentStepIndex && !isActive;
            
            return (
              <div 
                key={step.id} 
                className={cn(
                  "flex items-center justify-center py-3 px-4 rounded-md transition-all duration-300 flex-1 relative",
                  isActive ? "bg-accent-primary/10 text-ink-dark font-medium" : 
                  isCompleted ? "text-accent-primary" : 
                  "text-ink-light hover:text-ink-dark"
                )}
              >
                <div className="flex items-center">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0",
                    isActive ? "bg-accent-primary text-white shadow-blue-sm" :
                    isCompleted ? "bg-accent-primary/80 text-white" :
                    "bg-accent-tertiary/30 text-ink-light"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{i + 1}</span>
                    )}
                  </div>
                  <span className="font-serif text-sm">{step.title}</span>
                </div>
                
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 z-10">
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile progress indicator */}
        <div className="md:hidden mb-4">
          <div className="flex justify-between text-xs text-ink-light font-serif mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="mt-2 text-sm font-medium text-ink-dark font-serif">
            {steps.find(s => s.id === currentStep)?.title || 'Unknown Step'}
          </div>
        </div>

        {/* Step content with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[300px]"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}