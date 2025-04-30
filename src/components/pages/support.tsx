import React, { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AtSign, HelpCircle, Info, Mail, MessageCircle, Send, User } from 'lucide-react';
import { useAuth } from '../../../supabase/auth';

const Support = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [formState, setFormState] = useState({
    name: profile?.username || '',
    email: user?.email || '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form fields
    if (!formState.name || !formState.email || !formState.subject || !formState.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before submitting.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate API call - in production this would send data to a backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear form
      setFormState({
        ...formState,
        subject: '',
        message: ''
      });
      
      // Show success toast
      toast({
        title: "Message Sent",
        description: "Your support request has been submitted. We'll respond shortly.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error submitting support request:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportFAQs = [
    {
      question: "How do I create my first eBook?",
      answer: "Navigate to the Creator section and select 'eBook' from the available options. Follow the guided workflow to generate content."
    },
    {
      question: "Can I edit my generated content?",
      answer: "Yes, all generated content can be edited in the workflow. You can modify text, change formatting, and update any section."
    },
    {
      question: "How do I export my finished product?",
      answer: "After completing your product, go to the Products page, select your item, and click the Export button to download in your preferred format."
    },
    {
      question: "What's the difference between Brain Dump and Creator?",
      answer: "Brain Dump is for capturing quick ideas and notes, while Creator offers structured workflows for creating complete, published products."
    }
  ];

  return (
    <DashboardLayout activeTab="Support">
      <div className="py-16 px-4">
        <h1 className="text-3xl font-display font-medium text-ink-dark text-center mb-8 tracking-tight">Support</h1>
        <div className="max-w-3xl mx-auto">
          <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-white dark:bg-card shadow-sm dark:shadow-md rounded-lg overflow-hidden transition-all duration-300">
            <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F0F0F0] dark:border-accent-tertiary/30">
              <div className="flex items-center">
                <div className="bg-[#738996]/10 dark:bg-accent-primary/20 p-2 rounded-md mr-3">
                  <MessageCircle className="h-6 w-6 text-[#738996] dark:text-accent-primary" />
                </div>
                <CardTitle className="text-2xl font-display font-medium text-ink-dark">Contact Support</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="name" className="block font-serif text-sm text-ink-light mb-1">
                      Name
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded">
                        <User className="h-4 w-4" />
                      </div>
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        value={formState.name}
                        onChange={handleChange}
                        className="pl-10 font-serif"
                        placeholder="Your name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="block font-serif text-sm text-ink-light mb-1">
                      Email
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded">
                        <Mail className="h-4 w-4" />
                      </div>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formState.email}
                        onChange={handleChange}
                        className="pl-10 font-serif"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="subject" className="block font-serif text-sm text-ink-light mb-1">
                    Subject
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded">
                      <Info className="h-4 w-4" />
                    </div>
                    <Input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formState.subject}
                      onChange={handleChange}
                      className="pl-10 font-serif"
                      placeholder="What can we help you with?"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="message" className="block font-serif text-sm text-ink-light mb-1">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    rows={6}
                    className="font-serif resize-none"
                    placeholder="Please describe your issue or question in detail..."
                  />
                </div>
                
                <div className="pt-2">
                  <Button 
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Support; 