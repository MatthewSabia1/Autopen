import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '@/lib/contexts/WorkflowContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BookText, Check, Download, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * The final step in the eBook creation workflow.
 * Shows a success message and offers next steps.
 */
const CompletedStep = () => {
  const { ebook, resetWorkflow } = useWorkflow();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-8 text-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-display text-ink-dark mb-3">
          Your eBook Is Complete!
        </h2>
        <p className="text-ink-light font-serif max-w-2xl mb-6">
          Congratulations! Your eBook "{ebook?.title}" has been successfully created and 
          saved to your account. You can access it anytime from your dashboard.
        </p>
      </motion.div>

      {/* Next steps cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Card className="border border-accent-tertiary/20 bg-paper shadow-textera h-full">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="bg-accent-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Download className="h-6 w-6 text-accent-primary" />
              </div>
              <h3 className="font-display text-lg text-ink-dark mb-2">
                Download Your eBook
              </h3>
              <p className="text-sm text-ink-light font-serif mb-6 flex-grow">
                Download your eBook in different formats: PDF for printing, ePub for e-readers, or 
                Markdown for further editing.
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="gap-2 mt-auto"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card className="border border-accent-tertiary/20 bg-paper shadow-textera h-full">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="bg-accent-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <BookText className="h-6 w-6 text-accent-primary" />
              </div>
              <h3 className="font-display text-lg text-ink-dark mb-2">
                View Your eBook
              </h3>
              <p className="text-sm text-ink-light font-serif mb-6 flex-grow">
                Preview your completed eBook directly in your browser and make any final adjustments if needed.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="gap-2 mt-auto"
              >
                View in Library
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card className="border border-accent-tertiary/20 bg-paper shadow-textera h-full">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="bg-accent-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-accent-primary" />
              </div>
              <h3 className="font-display text-lg text-ink-dark mb-2">
                Create New Project
              </h3>
              <p className="text-sm text-ink-light font-serif mb-6 flex-grow">
                Ready for your next project? Start creating a new eBook or try other content types like courses or blog posts.
              </p>
              <Button
                onClick={() => resetWorkflow()}
                className="gap-2 mt-auto bg-accent-primary hover:bg-accent-primary/90"
              >
                <ArrowRight className="h-4 w-4" />
                Create New
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Testimonial section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <Card className="border border-accent-tertiary/20 bg-accent-primary/5">
          <CardContent className="p-6">
            <blockquote className="font-serif text-ink-dark italic relative">
              <div className="text-6xl text-accent-primary/20 absolute -left-2 -top-8 font-display">"</div>
              <p className="relative z-10">
                I was amazed at how quickly I was able to transform my scattered notes into a 
                polished eBook. The AI assistance made the entire process smooth and enjoyable.
              </p>
              <footer className="mt-4 text-sm font-medium">
                <span className="text-ink-dark">Sarah J.</span>
                <span className="text-ink-light"> — Author and Content Creator</span>
              </footer>
            </blockquote>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex justify-center mt-8">
        <Button
          className="gap-2 bg-accent-primary hover:bg-accent-primary/90 text-white font-serif"
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default CompletedStep; 