import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkflow, WorkflowType } from '@/lib/contexts/WorkflowContext';
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
  const { resetWorkflow, setWorkflowType, workflowType } = useWorkflow();

  // Define which workflow types are currently available
  const availableWorkflows: WorkflowType[] = ['ebook'];

  // Verify that the workflow type is valid and set it in the context
  useEffect(() => {
    console.log('WorkflowContainer - Current type param:', type);
    console.log('WorkflowContainer - Current workflowType from context:', workflowType);
    console.log('WorkflowContainer - Available workflows:', availableWorkflows);
    
    if (!type) {
      console.error('WorkflowContainer - No workflow type specified');
      setError('No workflow type specified');
      return;
    }
    
    // Check if type is a valid UUID pattern - if so, treat as "ebook" for backward compatibility
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(type);
    
    if (isUuid) {
      console.log(`WorkflowContainer - Detected UUID: "${type}" - Converting to "ebook" workflow`);
      
      // If it's a UUID, we'll handle it as an "ebook" workflow
      // This is for backward compatibility with existing data
      setError(null);
      
      // Set the workflow type in the context to ebook
      if (workflowType !== 'ebook') {
        console.log(`WorkflowContainer - Setting workflow type from ${workflowType} to ${'ebook'}`);
        setWorkflowType('ebook'); 
      }
      
      return;
    }
    
    // Normal path for standard workflow types
    if (!availableWorkflows.includes(type as WorkflowType)) {
      console.error(`WorkflowContainer - Workflow type "${type}" is not in available workflows:`, availableWorkflows);
      setError(`Workflow type "${type}" is not yet available`);
    } else {
      console.log(`WorkflowContainer - Valid workflow type: ${type}`);
      setError(null);
      
      // Set the workflow type in the context if it doesn't match
      if (workflowType !== type) {
        console.log(`WorkflowContainer - Setting workflow type from ${workflowType} to ${type}`);
        setWorkflowType(type as WorkflowType); // Cast to WorkflowType safely since we've validated it
      }
    }
  }, [type, workflowType, setWorkflowType]);

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

  // Helper function to determine if we should show the ebook workflow
  const shouldShowEbookWorkflow = () => {
    // Show ebook workflow if the type is explicitly 'ebook'
    if (type === 'ebook') return true;
    
    // Also show ebook workflow if the type is a UUID (for backward compatibility)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(type || '')) {
      return true;
    }
    
    return false;
  };

  // Render the appropriate workflow based on type
  return (
    <>
      {shouldShowEbookWorkflow() && <EbookCreationWorkflow />}
      {/* Future workflow types will be added here */}
      {/* {type === 'course' && <CourseCreationWorkflow />} */}
      {/* {type === 'video' && <VideoContentWorkflow />} */}
      {/* etc. */}
    </>
  );
};

export default WorkflowContainer;