import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkflow, WorkflowStep } from '@/lib/contexts/WorkflowContext';
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
    
    // First check for workflow resumption data (this takes priority)
    const resumeWorkflowData = sessionStorage.getItem('resumeWorkflow');
    
    if (resumeWorkflowData) {
      try {
        const resumeData = JSON.parse(resumeWorkflowData);
        console.log('Found workflow resumption data:', resumeData);
        
        if (resumeData.type === 'ebook' && resumeData.projectId) {
          // If we have a project ID, we can load the project directly
          console.log('Resuming workflow at step:', resumeData.step);
          
          // Validate that the step is a valid workflow step
          const validSteps: WorkflowStep[] = [
            'creator', 'brain-dump', 'idea-selection', 'ebook-structure', 
            'ebook-writing', 'ebook-preview', 'completed'
          ];
          
          if (resumeData.step && validSteps.includes(resumeData.step as WorkflowStep)) {
            // Set the step to ensure we resume at the right place
            // We'll need to delay this until after project load to avoid race conditions
            setTimeout(() => {
              setCurrentStep(resumeData.step as WorkflowStep);
            }, 500); // Short delay to let project load
          }
          
          // Note: We don't need to redirect since we should already be at the right URL
          // (/workflow/{projectId})
          
          // Clean up session storage
          sessionStorage.removeItem('resumeWorkflow');
          
          // Exit early - we've handled the resumption
          return;
        }
      } catch (e) {
        console.error('Error parsing workflow resumption data:', e);
        sessionStorage.removeItem('resumeWorkflow');
      }
    }
    
    // Check for new project data (for creating new projects)
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
        
        {/* Hero section - UPDATED TO BE MORE COMPACT */}
        <div className="bg-gradient-to-br from-accent-primary/15 to-accent-primary/5 rounded-lg p-4 shadow-sm mb-4 border border-accent-tertiary/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F9F7F4] rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
              <BookText className="h-5 w-5 text-[#738996]" />
            </div>
            <div>
              <h1 className="text-lg font-display text-ink-dark leading-tight tracking-tight flex items-center gap-1">
                {project ? project.title : 'Create New eBook'}
              </h1>
              <p className="text-sm text-ink-light font-serif line-clamp-1">
                {project?.description || 'Transform your ideas into a polished eBook with our guided AI-powered workflow.'}
              </p>
            </div>
          </div>
          
          {/* Back to dashboard button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 border-[#E8E8E8] hover:bg-[#F5F5F5] hover:border-[#E8E8E8] transition-all duration-200"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Button>
        </div>

        {/* Progress indicator - enhanced design */}
        <div className="hidden md:block mb-10">
          <div className="bg-paper rounded-xl border border-accent-tertiary/20 shadow-textera overflow-hidden p-4">
            <div className="flex items-center justify-between relative">
              {/* Progress line underneath - shows completion */}
              <div className="absolute top-6 left-0 h-[3px] bg-accent-yellow/70" 
                   style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }} />
              
              {/* Background line */}
              <div className="absolute top-6 left-0 h-[3px] w-full bg-slate-200/70" />
              
              {/* Steps */}
              {steps.map((step, i) => {
                const isActive = currentStep === step.id;
                const isCompleted = i < currentStepIndex;
                const isDisabled = i > currentStepIndex && !isActive;
                
                return (
                  <div key={step.id} className="z-10 flex flex-col items-center relative">
                    {/* Step circle */}
                    <div 
                      className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 mb-3",
                        isActive 
                          ? "bg-accent-primary text-white shadow-md ring-4 ring-accent-primary/20" 
                          : isCompleted 
                            ? "bg-accent-yellow text-white" 
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{i + 1}</span>
                      )}
                    </div>
                    
                    {/* Step title with icon */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "flex items-center justify-center mb-1",
                        isActive 
                          ? "text-accent-primary" 
                          : isCompleted 
                            ? "text-accent-yellow" 
                            : "text-slate-500"
                      )}>
                        {step.icon}
                      </div>
                      <span className={cn(
                        "text-xs font-medium font-serif text-center whitespace-nowrap px-1",
                        isActive 
                          ? "text-accent-primary" 
                          : isCompleted 
                            ? "text-accent-yellow" 
                            : "text-slate-500"
                      )}>
                        {step.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Active step description */}
          <div className="text-center mt-4">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-primary/5 rounded-full border border-accent-primary/10">
              {steps.find(s => s.id === currentStep)?.icon}
              <span className="font-serif text-sm text-accent-primary">
                {steps.find(s => s.id === currentStep)?.description}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile progress indicator */}
        <div className="md:hidden mb-8">
          <div className="bg-paper rounded-xl border border-accent-tertiary/20 shadow-textera-sm p-4">
            {/* Progress bar */}
            <div className="relative h-2 bg-slate-100 rounded-full mb-5 overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent-primary to-accent-yellow rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Current step info */}
            <div className="flex items-center gap-4">
              <div 
                className="h-10 w-10 rounded-full bg-accent-primary text-white flex items-center justify-center flex-shrink-0 shadow-sm"
              >
                <span className="text-xs font-medium">{currentStepIndex + 1}</span>
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {steps.find(s => s.id === currentStep)?.icon}
                  <span className="font-serif font-medium text-ink-dark">
                    {steps.find(s => s.id === currentStep)?.title || 'Unknown Step'}
                  </span>
                </div>
                
                <span className="text-xs text-ink-light font-serif mt-0.5">
                  {steps.find(s => s.id === currentStep)?.description}
                </span>
              </div>
            </div>
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