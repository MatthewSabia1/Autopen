import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow, WorkflowType } from '@/lib/contexts/WorkflowContext';
import DashboardLayout from '../layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Video, FileText, GraduationCap, MessageSquare } from 'lucide-react';

/**
 * Workflow Selection Page - Entry point for all workflow types
 * 
 * This component serves as a hub for selecting different content creation workflows.
 * As we add more workflow types beyond eBooks, they'll be added to this selection page.
 */
const WorkflowSelectionPage = () => {
  const navigate = useNavigate();
  const { setWorkflowType, resetWorkflow } = useWorkflow();

  // Workflow type definitions - will expand as we add more types
  const workflowTypes = [
    {
      id: 'ebook',
      title: 'E-Book Creation',
      description: 'Create a professional eBook with AI-powered chapter generation and export to PDF, EPUB, and Markdown.',
      icon: <BookOpen className="h-12 w-12 text-[#ccb595] dark:text-accent-yellow" />,
      active: true,
      comingSoon: false
    },
    {
      id: 'course',
      title: 'Online Course',
      description: 'Generate a structured online course with lessons, modules, and assessments.',
      icon: <GraduationCap className="h-12 w-12 text-[#738996] dark:text-accent-primary opacity-70" />,
      active: false,
      comingSoon: true
    },
    {
      id: 'video',
      title: 'Video Content',
      description: 'Create video scripts, storyboards, and production plans.',
      icon: <Video className="h-12 w-12 text-[#738996] dark:text-accent-primary opacity-70" />,
      active: false,
      comingSoon: true
    },
    {
      id: 'blog',
      title: 'Blog Series',
      description: 'Generate a series of connected blog posts for content marketing.',
      icon: <FileText className="h-12 w-12 text-[#738996] dark:text-accent-primary opacity-70" />,
      active: false,
      comingSoon: true
    },
    {
      id: 'social',
      title: 'Social Media Campaign',
      description: 'Create a coordinated set of posts across multiple platforms.',
      icon: <MessageSquare className="h-12 w-12 text-[#738996] dark:text-accent-primary opacity-70" />,
      active: false,
      comingSoon: true
    }
  ];

  return (
    <DashboardLayout activeTab="AI Workflows">
      <div className="space-y-10 animate-fade-in">
        {/* Hero section */}
        <div className="bg-gradient-to-br from-[#738996]/10 to-[#738996]/5 dark:from-accent-primary/20 dark:to-accent-primary/10 rounded-xl p-8 shadow-sm dark:shadow-md border border-[#738996]/10 dark:border-accent-primary/30 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-lg">
              <h1 className="text-3xl font-georgia text-gray-800 dark:text-ink-dark mb-4">Content Creation Workflows</h1>
              <p className="text-gray-600 dark:text-ink-light font-georgia text-lg mb-4">
                Choose a workflow to begin creating AI-powered content. Each workflow provides a structured process 
                tailored to specific content types.
              </p>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative w-48 h-48 flex-shrink-0">
                <div className="absolute w-full h-full bg-[#738996]/20 dark:bg-accent-primary/30 rounded-full animate-pulse-slow"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-16 w-16 text-[#738996] dark:text-accent-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {workflowTypes.map((workflow) => (
            <div
              key={workflow.id}
              className={`p-8 rounded-xl border shadow-sm dark:shadow-md transition-all duration-300 ${
                workflow.active
                  ? 'bg-white dark:bg-card border-[#ccb595]/30 dark:border-accent-yellow/30 hover:shadow-md dark:hover:shadow-lg hover:border-[#ccb595]/50 dark:hover:border-accent-yellow/50 cursor-pointer'
                  : 'bg-white/90 dark:bg-card/90 border-gray-100 dark:border-accent-tertiary/20'
              }`}
              onClick={() => {
                if (workflow.active) {
                  // Set workflow type and navigate
                  console.log(`Selecting workflow type: ${workflow.id}`);
                  const workflowType: WorkflowType = workflow.id as WorkflowType;
                  resetWorkflow(workflowType);
                }
              }}
            >
              <div className="flex flex-col h-full">
                <div className={`p-4 rounded-lg mb-5 inline-flex ${
                  workflow.active 
                    ? 'bg-[#ccb595]/10 dark:bg-accent-yellow/20'
                    : 'bg-gray-100 dark:bg-accent-tertiary/10'
                }`}>
                  {workflow.icon}
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xl font-georgia text-gray-800 dark:text-ink-dark">{workflow.title}</h3>
                  {workflow.comingSoon && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                      Coming Soon
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-ink-light mb-6 flex-grow">
                  {workflow.description}
                </p>
                
                {workflow.active ? (
                  <Button
                    className="gap-2 bg-[#738996] dark:bg-accent-primary hover:bg-[#637885] dark:hover:bg-accent-primary/90 text-white w-full shadow-sm dark:shadow-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Starting workflow from button: ${workflow.id}`);
                      const workflowType: WorkflowType = workflow.id as WorkflowType;
                      resetWorkflow(workflowType);
                    }}
                  >
                    Start Workflow
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="gap-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 w-full cursor-not-allowed"
                  >
                    Coming Soon
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Workflow Process Overview */}
        <div className="bg-[#738996]/5 dark:bg-accent-primary/10 p-8 rounded-lg border border-[#738996]/20 dark:border-accent-primary/30 shadow-sm dark:shadow-md">
          <h3 className="text-xl font-georgia text-gray-800 dark:text-ink-dark mb-6">How Workflows Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#ccb595]/20 dark:bg-accent-yellow/20 flex items-center justify-center mb-4 shadow-sm dark:shadow-md">
                <span className="font-georgia text-xl text-[#ccb595] dark:text-accent-yellow">1</span>
              </div>
              <h4 className="font-georgia font-medium text-gray-800 dark:text-ink-dark mb-2">Input & Brainstorm</h4>
              <p className="text-sm text-gray-600 dark:text-ink-light">
                Start by providing your raw ideas and content. Our AI helps organize and structure them.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#738996]/20 dark:bg-accent-primary/20 flex items-center justify-center mb-4 shadow-sm dark:shadow-md">
                <span className="font-georgia text-xl text-[#738996] dark:text-accent-primary">2</span>
              </div>
              <h4 className="font-georgia font-medium text-gray-800 dark:text-ink-dark mb-2">Generate & Refine</h4>
              <p className="text-sm text-gray-600 dark:text-ink-light">
                The system generates professional content with your guidance, maintaining consistency throughout.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#738996]/20 dark:bg-accent-primary/20 flex items-center justify-center mb-4 shadow-sm dark:shadow-md">
                <span className="font-georgia text-xl text-[#738996] dark:text-accent-primary">3</span>
              </div>
              <h4 className="font-georgia font-medium text-gray-800 dark:text-ink-dark mb-2">Export & Share</h4>
              <p className="text-sm text-gray-600 dark:text-ink-light">
                When complete, export your content in multiple formats ready for distribution or publication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WorkflowSelectionPage;