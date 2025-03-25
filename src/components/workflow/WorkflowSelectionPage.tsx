import React from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Workflow type definitions - will expand as we add more types
  const workflowTypes = [
    {
      id: 'ebook',
      title: 'E-Book Creation',
      description: 'Create a professional eBook with AI-powered chapter generation and export to PDF, EPUB, and Markdown.',
      icon: <BookOpen className="h-12 w-12 text-accent-primary" />,
      active: true,
      comingSoon: false
    },
    {
      id: 'course',
      title: 'Online Course',
      description: 'Generate a structured online course with lessons, modules, and assessments.',
      icon: <GraduationCap className="h-12 w-12 text-accent-tertiary/60" />,
      active: false,
      comingSoon: true
    },
    {
      id: 'video',
      title: 'Video Content',
      description: 'Create video scripts, storyboards, and production plans.',
      icon: <Video className="h-12 w-12 text-accent-tertiary/60" />,
      active: false,
      comingSoon: true
    },
    {
      id: 'blog',
      title: 'Blog Series',
      description: 'Generate a series of connected blog posts for content marketing.',
      icon: <FileText className="h-12 w-12 text-accent-tertiary/60" />,
      active: false,
      comingSoon: true
    },
    {
      id: 'social',
      title: 'Social Media Campaign',
      description: 'Create a coordinated set of posts across multiple platforms.',
      icon: <MessageSquare className="h-12 w-12 text-accent-tertiary/60" />,
      active: false,
      comingSoon: true
    }
  ];

  return (
    <DashboardLayout activeTab="eBook Workflow">
      <div className="space-y-8 animate-fade-in">
        {/* Hero section */}
        <div className="bg-gradient-to-br from-accent-primary/10 to-accent-tertiary/5 rounded-xl p-6 md:p-8 shadow-textera mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-lg">
              <h1 className="text-3xl font-display text-ink-dark mb-3">Content Creation Workflows</h1>
              <p className="text-ink-light font-serif text-lg mb-4">
                Choose a workflow to begin creating AI-powered content. Each workflow provides a structured process 
                tailored to specific content types.
              </p>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative w-48 h-48 flex-shrink-0">
                <div className="absolute w-full h-full bg-accent-primary/20 rounded-full animate-pulse-slow"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-16 w-16 text-accent-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflowTypes.map((workflow) => (
            <div
              key={workflow.id}
              className={`p-6 rounded-xl border shadow-textera transition-all duration-200 ${
                workflow.active
                  ? 'bg-paper border-accent-primary/20 hover:shadow-textera-md cursor-pointer'
                  : 'bg-paper/70 border-accent-tertiary/10'
              }`}
              onClick={() => {
                if (workflow.active) {
                  navigate(`/workflow/${workflow.id}`);
                }
              }}
            >
              <div className="flex flex-col h-full">
                <div className={`p-4 rounded-lg mb-4 inline-flex ${
                  workflow.active ? 'bg-accent-primary/10' : 'bg-accent-tertiary/10'
                }`}>
                  {workflow.icon}
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-display text-ink-dark">{workflow.title}</h3>
                  {workflow.comingSoon && (
                    <span className="text-xs bg-accent-tertiary/20 text-accent-tertiary px-2 py-1 rounded-full font-serif">
                      Coming Soon
                    </span>
                  )}
                </div>
                
                <p className="font-serif text-sm text-ink-light mb-6 flex-grow">
                  {workflow.description}
                </p>
                
                {workflow.active ? (
                  <Button
                    className="gap-2 bg-accent-primary hover:bg-accent-primary/90 text-white font-serif w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/workflow/${workflow.id}`);
                    }}
                  >
                    Start Workflow
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="gap-2 bg-accent-tertiary/30 text-ink-faded font-serif w-full cursor-not-allowed"
                  >
                    Coming Soon
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Workflow Process Overview */}
        <div className="bg-accent-primary/5 p-6 rounded-lg border border-accent-primary/20">
          <h3 className="text-xl font-display text-ink-dark mb-4">How Workflows Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center mb-4">
                <span className="font-display text-xl text-accent-primary">1</span>
              </div>
              <h4 className="font-serif font-medium text-ink-dark mb-2">Input & Brainstorm</h4>
              <p className="font-serif text-sm text-ink-light">
                Start by providing your raw ideas and content. Our AI helps organize and structure them.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center mb-4">
                <span className="font-display text-xl text-accent-primary">2</span>
              </div>
              <h4 className="font-serif font-medium text-ink-dark mb-2">Generate & Refine</h4>
              <p className="font-serif text-sm text-ink-light">
                The system generates professional content with your guidance, maintaining consistency throughout.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center mb-4">
                <span className="font-display text-xl text-accent-primary">3</span>
              </div>
              <h4 className="font-serif font-medium text-ink-dark mb-2">Export & Share</h4>
              <p className="font-serif text-sm text-ink-light">
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