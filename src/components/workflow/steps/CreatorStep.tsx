import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '@/lib/contexts/WorkflowContext';
import { useAuth } from '../../../../supabase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Wand2, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * The first step in the eBook creation workflow.
 * Users enter a title and description for their eBook project.
 */
const CreatorStep = () => {
  const { createProject } = useWorkflow();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /**
   * Handles form submission to create a new project
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user) {
      setError('You must be logged in to create an eBook project');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title for your eBook');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const projectId = await createProject(title, description);
      // Navigate to the project's workflow with the new project ID
      navigate(`/workflow/${projectId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Navigate to login page
   */
  const handleLoginRedirect = () => {
    // Store the current state so user can return after login
    sessionStorage.setItem('returnToCreator', JSON.stringify({
      title,
      description
    }));
    navigate('/login');
  };
  
  // Try to restore form data if returning from login
  useEffect(() => {
    const savedData = sessionStorage.getItem('returnToCreator');
    if (savedData) {
      try {
        const { title: savedTitle, description: savedDescription } = JSON.parse(savedData);
        setTitle(savedTitle || '');
        setDescription(savedDescription || '');
        // Clear saved data after restoring
        sessionStorage.removeItem('returnToCreator');
      } catch (e) {
        console.error('Error parsing saved creator data', e);
      }
    }
  }, []);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-display text-ink-dark mb-4">Create Your eBook</h2>
        <p className="text-ink-light font-serif mb-6">
          Start your eBook creation journey by giving your project a title and 
          brief description. This will help you stay organized and focused throughout the process.
        </p>
        
        {!user && !authLoading && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
            <h3 className="font-display text-amber-800 text-lg mb-2">Authentication Required</h3>
            <p className="text-amber-700 text-sm font-serif mb-3">
              You need to be logged in to create an eBook project and save your work.
            </p>
            <Button 
              variant="outline" 
              className="bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
              onClick={handleLoginRedirect}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to Continue
            </Button>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
            <p className="text-red-700 text-sm font-serif">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-ink-dark">
              eBook Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter a title for your eBook"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-serif"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-ink-dark">Description</Label>
            <Textarea
              id="description"
              placeholder="Briefly describe what your eBook will be about"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="font-serif min-h-[120px]"
            />
          </div>
          
          <Button 
            type="submit" 
            className="gap-2 bg-accent-primary hover:bg-accent-primary/90 text-white font-serif"
            disabled={isSubmitting || !user}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⌛</span>
                Creating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Create eBook Project
              </>
            )}
          </Button>
        </form>
      </div>
      
      <div className="flex flex-col justify-center">
        <Card className="bg-cream border-accent-tertiary/20 shadow-textera">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-accent-primary/10 p-3 rounded-lg">
                <BookOpen className="h-10 w-10 text-accent-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg text-ink-dark mb-2">
                  About the eBook Creator
                </h3>
                <div className="space-y-4 text-ink-light font-serif">
                  <p>
                    Our eBook creation process guides you through each step from 
                    brainstorming to publishing your final product.
                  </p>
                  
                  <div className="space-y-2">
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-start gap-2"
                    >
                      <div className="h-5 w-5 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-sm">
                        <span className="font-medium text-ink-dark">Create Project</span> - 
                        Set up your eBook's title and description
                      </p>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-start gap-2"
                    >
                      <div className="h-5 w-5 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="text-sm">
                        <span className="font-medium text-ink-dark">Brain Dump</span> - 
                        Upload or paste your unorganized content, notes, and ideas
                      </p>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex items-start gap-2"
                    >
                      <div className="h-5 w-5 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <p className="text-sm">
                        <span className="font-medium text-ink-dark">Select Idea</span> - 
                        Choose one of the AI-generated eBook ideas
                      </p>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="flex items-start gap-2"
                    >
                      <div className="h-5 w-5 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        4
                      </div>
                      <p className="text-sm">
                        <span className="font-medium text-ink-dark">Generate Content</span> - 
                        AI creates high-quality content for each chapter
                      </p>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 }}
                      className="flex items-start gap-2"
                    >
                      <div className="h-5 w-5 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        5
                      </div>
                      <p className="text-sm">
                        <span className="font-medium text-ink-dark">Download</span> - 
                        Get your eBook in PDF, Markdown, or ePub format
                      </p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatorStep;