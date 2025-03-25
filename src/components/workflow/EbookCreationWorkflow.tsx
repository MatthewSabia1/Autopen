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
  AlertCircle,
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
    workflowType,
    brainDump,
    ebookIdeas,
    ebook,
  } = useWorkflow();
  
  // Safety check - ensure we're in the ebook workflow
  useEffect(() => {
    // Check workflow type in context matches component
    if (workflowType !== 'ebook') {
      console.warn('EbookCreationWorkflow being used with incorrect workflow type:', workflowType);
    }
    
    // Check if urlType is a UUID pattern - if so, it's allowed as a project ID
    const isUuid = urlType && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(urlType);
    
    // Check URL param matches workflow type or is a UUID (for backward compatibility)
    if (urlType !== 'ebook' && urlType !== undefined && !isUuid) {
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
  // State for database warning banner
  const [showDatabaseWarning, setShowDatabaseWarning] = useState(false);

  // Check for database errors and show warning if needed
  useEffect(() => {
    if (error && (
      error.includes('database') || 
      error.includes('400') || 
      error.includes('Warning:') || 
      error.includes("won't affect your analysis")
    )) {
      setShowDatabaseWarning(true);
    }
  }, [error]);

  // Handle one-time navigation only
  useEffect(() => {
    if (shouldRedirectRef.current) {
      console.log('Redirecting to creator page');
      navigate('/creator', { replace: true });
      shouldRedirectRef.current = false;
    }
  }, [navigate]);
  
  // Reset workflow if needed when mounting this component
  useEffect(() => {
    // If there's no project and no project ID, and we're not in the process of creating one,
    // reset the workflow to ensure a clean slate
    if (!project && !projectId && !isCreating && workflowType !== 'ebook') {
      console.log('Resetting workflow type to ebook');
      resetWorkflow('ebook');
    }
  }, [project, projectId, isCreating, workflowType, resetWorkflow]);
  
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

  // Special case for ebook structure step and auto-advancing when needed
  useEffect(() => {
    // Auto-transition from structure to writing step
    if (currentStep === 'ebook-structure' && !hasTransitionedFromStructureRef.current) {
      hasTransitionedFromStructureRef.current = true;
      console.log('Auto-transitioning from ebook-structure to ebook-writing step');
      
      // Use short timeout to ensure state has settled
      setTimeout(() => setCurrentStep('ebook-writing'), 100);
    }
    
    // Auto-transition to completed step if needed when all ebook steps are done
    if (currentStep === 'ebook-preview' && project?.status === 'completed') {
      console.log('eBook is finalized, auto-transitioning to completed step');
      setCurrentStep('completed');
    }
    
    // Handle recovery from potentially stuck states
    if (project && brainDump) {
      // If we're on brain-dump step but already have analyzed content, advance
      if (currentStep === 'brain-dump' && brainDump.status === 'analyzed' && ebookIdeas.length > 0) {
        console.log('Brain dump already analyzed, advancing to idea selection');
        setCurrentStep('idea-selection');
      }
      
      // If we're on idea selection but already have an ebook, advance
      if (currentStep === 'idea-selection' && ebook) {
        console.log('eBook already created, advancing to writing step');
        setCurrentStep('ebook-writing');
      }
    }
  }, [currentStep, setCurrentStep, project?.status, brainDump?.status, ebookIdeas.length, ebook]);

  // Dismiss database warning
  const dismissDatabaseWarning = () => {
    setShowDatabaseWarning(false);
  };

  // Step configuration with titles, icons, and descriptions
  const steps = [
    { 
      id: 'creator', 
      title: 'Project Info', 
      icon: <FileText className="h-4 w-4" />,
      description: 'Set up your eBook project with title and description.'
    },
    { 
      id: 'brain-dump', 
      title: 'Brain Dump', 
      icon: <Brain className="h-4 w-4" />,
      description: 'Add your ideas, research and content for analysis.'
    },
    { 
      id: 'idea-selection', 
      title: 'Select Idea', 
      icon: <Lightbulb className="h-4 w-4" />,
      description: 'Choose from AI-generated eBook concepts or create your own.'
    },
    { 
      id: 'ebook-structure', 
      title: 'Structure', 
      icon: <BookText className="h-4 w-4" />,
      description: 'System automatically organizes your eBook structure.'
    },
    { 
      id: 'ebook-writing', 
      title: 'Writing', 
      icon: <PenTool className="h-4 w-4" />,
      description: 'Generate content for each chapter of your eBook.'
    },
    { 
      id: 'ebook-preview', 
      title: 'Preview', 
      icon: <Sparkles className="h-4 w-4" />,
      description: 'Preview and download your completed eBook.'
    },
    { 
      id: 'completed', 
      title: 'Completed', 
      icon: <CheckCircle className="h-4 w-4" />,
      description: 'Your eBook is finalized and ready to share'
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
            <div className="bg-paper rounded-lg p-8 flex flex-col items-center shadow-blue">
              <Loader2 className="h-10 w-10 text-accent-primary animate-spin mb-4" />
              <p className="font-serif text-ink-light">Creating your eBook project...</p>
            </div>
          </div>
        )}
        
        {/* Database warning banner */}
        {showDatabaseWarning && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700 font-serif">
                  We encountered database connection issues. Your work is still being saved locally, 
                  and you can continue creating your eBook. Some features might be limited.
                </p>
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={dismissDatabaseWarning}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Hero section */}
        <div className="bg-gradient-to-br from-accent-primary/20 to-accent-primary/5 rounded-xl p-8 md:p-10 shadow-blue-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-page-title font-display text-ink-dark mb-2 flex items-center gap-2 tracking-tight">
                <BookText className="h-7 w-7 text-accent-primary" />
                {project ? project.title : 'Create New eBook'}
              </h1>
              <p className="text-body text-ink-light font-serif max-w-xl">
                {project?.description || 'Transform your ideas into a polished eBook with our guided AI-powered workflow.'}
              </p>
            </div>
            
            {/* Back to dashboard button */}
            <Button
              variant="outline"
              className="flex-shrink-0 border-accent-tertiary/30 hover:border-accent-primary/30"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="hidden md:flex items-center mb-8 bg-paper p-1 rounded-lg border border-accent-tertiary/20 shadow-soft">
          {steps.map((step, i) => {
            const isActive = currentStep === step.id;
            const isCompleted = i < currentStepIndex;
            const isDisabled = i > currentStepIndex && !isActive;
            
            return (
              <div 
                key={step.id} 
                className={cn(
                  "flex items-center justify-center py-3 px-4 rounded-md transition-all duration-300 flex-1 relative group",
                  isActive ? "bg-accent-primary/10 text-ink-dark font-medium" : 
                  isCompleted ? "text-accent-primary" : 
                  "text-ink-light hover:text-ink-dark hover:bg-accent-tertiary/5"
                )}
              >
                <div className="flex flex-col items-start">
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
                    <span className="font-serif text-small font-medium">{step.title}</span>
                  </div>
                  
                  {/* Only show description for active step or on hover */}
                  <div className={cn(
                    "hidden md:block ml-8 text-xs text-ink-light font-serif max-w-[140px] mt-1",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                    "transition-opacity duration-200"
                  )}>
                    {step.description}
                  </div>
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
          <Progress value={progress} className="h-2 bg-accent-tertiary/30">
            <div 
              className="h-full bg-accent-primary rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </Progress>
          <div className="mt-2 text-small font-medium text-ink-dark font-serif">
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