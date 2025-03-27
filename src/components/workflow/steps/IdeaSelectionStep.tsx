import React, { useState } from 'react';
import { useWorkflow } from '@/lib/contexts/WorkflowContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, Lightbulb, Loader2, PencilLine, Plus, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

/**
 * The third step in the eBook creation workflow.
 * Users select an eBook idea from the AI-generated options,
 * or create a custom idea.
 */
const IdeaSelectionStep = () => {
  const {
    brainDump,
    ebookIdeas,
    selectedIdeaId,
    selectEbookIdea,
    setCurrentStep,
    createEbook
  } = useWorkflow();

  const [selectedIdea, setSelectedIdea] = useState<string | null>(selectedIdeaId);
  const [customMode, setCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles idea selection
   */
  const handleIdeaSelect = (id: string) => {
    // Add selection animation effect
    setSelectedIdea(id);
    setCustomMode(false);
    
    // Remove auto-scrolling functionality
  };

  /**
   * Handles enabling custom idea mode
   */
  const handleCustomMode = () => {
    setSelectedIdea(null);
    setCustomMode(true);
  };

  /**
   * Validates an idea title and description
   */
  const validateIdea = (title: string, description: string): boolean => {
    if (!title.trim()) {
      setError('Please enter a title for your eBook');
      return false;
    }
    
    if (title.length < 5) {
      setError('Your eBook title is too short. Please make it at least 5 characters long.');
      return false;
    }
    
    if (description.trim().length < 20 && customMode) {
      setError('Please provide a more detailed description (at least 20 characters) to help generate better content.');
      return false;
    }
    
    return true;
  };
  
  /**
   * Proceeds to the next step with the selected idea
   */
  const handleProceed = async () => {
    try {
      setIsCreating(true);
      setError(null);
      
      if (customMode) {
        // Validate custom idea
        if (!validateIdea(customTitle, customDescription)) {
          setIsCreating(false);
          return;
        }
        
        // Create eBook with custom title and description
        await createEbook(customTitle, customDescription);
      } else if (selectedIdea) {
        // Find the selected idea
        const idea = ebookIdeas.find(idea => idea.id === selectedIdea);
        if (!idea) {
          setError('Selected idea not found');
          setIsCreating(false);
          return;
        }
        
        // Select the idea in context
        await selectEbookIdea(selectedIdea);
        
        // Create eBook with selected idea's title and description
        if (!validateIdea(idea.title, idea.description || '')) {
          setIsCreating(false);
          return;
        }
        
        await createEbook(idea.title, idea.description || '');
      } else {
        setError('Please select an idea or create your own');
        setIsCreating(false);
        return;
      }
      
      // Explicitly handle the step transition after state updates
      setCurrentStep('ebook-writing');
    } catch (err: any) {
      setError(err.message || 'Failed to proceed with the selected idea');
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display text-ink-dark dark:text-ink-dark mb-4">
          Select an eBook Idea
        </h2>
        <p className="text-ink-light dark:text-ink-light/80 font-serif max-w-3xl">
          Based on your content, we've generated some eBook ideas for you. 
          Select one that resonates with your vision, or create your own custom idea.
        </p>
        
        {/* Selection instructions - added for clarity */}
        <div className="mt-4 p-3 bg-accent-primary/5 dark:bg-accent-primary/20 rounded-lg border border-accent-primary/10 dark:border-accent-primary/30 inline-flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-accent-primary bg-paper dark:bg-card flex items-center justify-center">
            <Check className="h-3 w-3 text-accent-primary" />
          </div>
          <p className="text-sm text-accent-primary dark:text-accent-primary/90 font-serif">
            Click on an idea card and select the circle to choose that option
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-md p-3">
          <p className="text-red-700 dark:text-red-400 text-sm font-serif">{error}</p>
        </div>
      )}

      {/* Analysis results summary */}
      {brainDump?.analyzed_content && (
        <div className="bg-accent-primary/5 dark:bg-accent-primary/15 border border-accent-primary/20 dark:border-accent-primary/30 rounded-lg p-5">
          <h3 className="font-display text-lg text-ink-dark dark:text-ink-dark mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent-primary" />
            Content Analysis Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-serif">
            <div>
              <h4 className="text-sm font-medium text-ink-dark dark:text-ink-dark mb-2">Main Topics</h4>
              <ul className="text-sm text-ink-light dark:text-ink-light/80 space-y-1">
                {brainDump.analyzed_content.topics?.map((topic: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/70 dark:bg-accent-primary/90 flex-shrink-0"></span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-ink-dark dark:text-ink-dark mb-2">Key Points</h4>
              <ul className="text-sm text-ink-light dark:text-ink-light/80 space-y-1">
                {brainDump.analyzed_content.keyPoints?.slice(0, 3).map((point: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/70 dark:bg-accent-primary/90 flex-shrink-0"></span>
                    <span className="line-clamp-1">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-ink-dark dark:text-ink-dark mb-2">Content Insights</h4>
              <ul className="text-sm text-ink-light dark:text-ink-light/80 space-y-1">
                {brainDump.analyzed_content.sentiment && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/70 dark:bg-accent-primary/90 flex-shrink-0"></span>
                    <span>Tone: {brainDump.analyzed_content.sentiment}</span>
                  </li>
                )}
                {brainDump.analyzed_content.readability && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/70 dark:bg-accent-primary/90 flex-shrink-0"></span>
                    <span>Readability: {brainDump.analyzed_content.readability}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Idea cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {ebookIdeas.map((idea) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className={cn(
                  "h-full border cursor-pointer transition-all duration-200 overflow-hidden relative",
                  selectedIdea === idea.id 
                    ? "border-accent-primary/50 bg-accent-primary/5 dark:bg-accent-primary/20 shadow-md dark:shadow-lg" 
                    : "border-accent-tertiary/20 dark:border-accent-tertiary/30 bg-paper dark:bg-card hover:border-accent-tertiary/40 dark:hover:border-accent-tertiary/50 hover:shadow-sm dark:hover:shadow-md"
                )}
                onClick={() => handleIdeaSelect(idea.id)}
              >
                {/* Selection checkbox - made larger and more prominent */}
                <div className="absolute top-4 right-4 z-10">
                  <div 
                    className={cn(
                      "w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
                      selectedIdea === idea.id
                        ? "border-accent-primary bg-accent-primary text-white scale-110"
                        : "border-accent-tertiary/60 dark:border-accent-tertiary/80 bg-paper dark:bg-card hover:border-accent-primary/60 dark:hover:border-accent-primary/80 hover:scale-105"
                    )}
                  >
                    {selectedIdea === idea.id ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-accent-tertiary/60 dark:bg-accent-tertiary/80 group-hover:bg-accent-primary/60"></div>
                    )}
                  </div>
                </div>
                
                <CardContent className="pt-6 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display text-lg text-ink-dark dark:text-ink-dark flex-1">{idea.title}</h3>
                  </div>
                  <p className="text-ink-light dark:text-ink-light/80 font-serif text-sm mb-4">
                    {idea.description}
                  </p>
                  {idea.source_data && (
                    <div className="mt-auto pt-3 border-t border-accent-tertiary/10 dark:border-accent-tertiary/20">
                      <p className="text-xs text-ink-faded dark:text-ink-light/60 font-serif italic">
                        <span className="font-medium">Source:</span> {idea.source_data}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {/* Custom idea card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card 
              className={cn(
                "h-full border overflow-hidden relative",
                customMode 
                  ? "border-accent-primary/50 bg-accent-primary/5 dark:bg-accent-primary/20 shadow-md dark:shadow-lg" 
                  : "border-accent-tertiary/20 dark:border-accent-tertiary/30 bg-paper dark:bg-card hover:border-accent-tertiary/40 dark:hover:border-accent-tertiary/50 hover:shadow-sm dark:hover:shadow-md cursor-pointer"
              )}
              onClick={customMode ? undefined : handleCustomMode}
            >
              {/* Custom mode selection indicator */}
              {customMode ? (
                <div className="absolute top-4 right-4 z-10">
                  <div className="w-7 h-7 rounded-full border-2 border-accent-primary bg-accent-primary text-white scale-110 flex items-center justify-center transition-all duration-200">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              ) : (
                <div className="absolute top-4 right-4 z-10">
                  <div className="w-7 h-7 rounded-full border-2 border-accent-tertiary/60 dark:border-accent-tertiary/80 flex items-center justify-center bg-paper dark:bg-card hover:border-accent-primary/60 dark:hover:border-accent-primary/80 hover:scale-105 transition-all duration-200">
                    <div className="w-2 h-2 rounded-full bg-accent-tertiary/60 dark:bg-accent-tertiary/80"></div>
                  </div>
                </div>
              )}
              
              <CardContent className={`${customMode ? 'pt-6' : 'p-6'} h-full`}>
                {customMode ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom-title" className="text-ink-dark dark:text-ink-dark">
                        Custom eBook Title <span className="text-red-500 dark:text-red-400">*</span>
                      </Label>
                      <Input
                        id="custom-title"
                        placeholder="Enter your eBook title"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="font-serif"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-description" className="text-ink-dark dark:text-ink-dark">
                        Description
                      </Label>
                      <Textarea
                        id="custom-description"
                        placeholder="Describe what your eBook will be about"
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        className="font-serif min-h-[120px]"
                      />
                    </div>
                    <Button
                      variant="workflowOutline"
                      size="sm"
                      className="text-accent-primary dark:text-accent-primary/90 hover:bg-accent-primary/5 dark:hover:bg-accent-primary/20"
                      onClick={() => setCustomMode(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-accent-tertiary/10 dark:bg-accent-tertiary/20 flex items-center justify-center mb-4">
                      <PencilLine className="h-6 w-6 text-accent-primary/70 dark:text-accent-primary/90" />
                    </div>
                    <h3 className="font-display text-lg text-ink-dark dark:text-ink-dark mb-2">Create Your Own</h3>
                    <p className="text-ink-light dark:text-ink-light/80 font-serif text-sm mb-4">
                      Have a specific idea in mind? Define your own custom eBook concept.
                    </p>
                    <Button 
                      variant="workflowOutline" 
                      size="sm"
                      className="flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Custom Idea
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-8" data-proceed-buttons>
        <Button
          variant="workflowOutline"
          onClick={() => setCurrentStep('brain-dump')}
          className="gap-2"
        >
          Back
        </Button>
        <Button
          className="gap-2 text-white"
          variant={(!selectedIdea && !customMode) ? "workflow" : "workflowGold"}
          onClick={handleProceed}
          disabled={(!selectedIdea && !customMode) || isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating eBook...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default IdeaSelectionStep; 