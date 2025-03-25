import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkflow } from '@/lib/contexts/WorkflowContext';
import EbookCreationWorkflow from './EbookCreationWorkflow';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * WorkflowContainer - Dynamic wrapper for different workflow types
 * 
 * This component loads the appropriate workflow component based on the URL parameter.
 * It provides a common framework for all workflow types and handles cases where
 * the workflow type is invalid or not yet implemented.
 */
const WorkflowContainer: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { resetWorkflow } = useWorkflow();

  // Verify that the workflow type is valid
  useEffect(() => {
    if (!type) {
      setError('No workflow type specified');
      return;
    }

    // Define which workflow types are currently available
    const availableWorkflows = ['ebook'];
    
    if (!availableWorkflows.includes(type)) {
      setError(`Workflow type "${type}" is not yet available`);
    } else {
      setError(null);
    }
  }, [type]);

  // Back to workflow selection
  const handleBack = () => {
    resetWorkflow();
    navigate('/workflow');
  };

  // Error display
  if (error) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-paper">
        <div className="max-w-md w-full p-8 bg-paper border border-accent-tertiary/20 rounded-lg shadow-textera text-center">
          <h2 className="text-2xl font-display text-ink-dark mb-4">Workflow Not Available</h2>
          <p className="text-ink-light font-serif mb-6">{error}</p>
          <Button
            onClick={handleBack}
            className="gap-2 bg-accent-primary hover:bg-accent-primary/90 text-white font-serif"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workflow Selection
          </Button>
        </div>
      </div>
    );
  }

  // Render the appropriate workflow based on type
  return (
    <>
      {type === 'ebook' && <EbookCreationWorkflow />}
      {/* Future workflow types will be added here */}
      {/* {type === 'course' && <CourseCreationWorkflow />} */}
      {/* {type === 'video' && <VideoContentWorkflow />} */}
      {/* etc. */}
    </>
  );
};

export default WorkflowContainer;