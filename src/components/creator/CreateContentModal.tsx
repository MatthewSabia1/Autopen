import React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateContent: (contentData: ContentData) => void;
}

export interface ContentData {
  title: string;
  description: string;
  contentType: 'e-book' | 'online-course' | 'blog-post' | 'video-script' | 'newsletter' | 'social-media';
}

const CreateContentModal: React.FC<CreateContentModalProps> = ({
  isOpen,
  onClose,
  onCreateContent
}) => {
  const [contentData, setContentData] = useState<ContentData>({
    title: '',
    description: '',
    contentType: 'e-book'
  });

  // Track submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!contentData.title.trim()) {
      alert("Please enter a title for your content");
      return;
    }
    
    setIsSubmitting(true);
    
    // Store the full content data including contentType in sessionStorage
    sessionStorage.setItem('newProjectData', JSON.stringify({
      title: contentData.title,
      description: contentData.description,
      contentType: contentData.contentType
    }));
    
    // Log what's happening
    console.log('Submitting content creation form:', contentData);
    
    // Call the onCreateContent handler and show visual feedback
    try {
      onCreateContent(contentData);
    } catch (error) {
      console.error('Error in content creation:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[550px] md:max-w-[580px] bg-white border-accent-tertiary/20 p-0 shadow-sm rounded-lg flex flex-col"
        style={{ 
          maxHeight: "calc(100vh - 40px)",
          width: "calc(100vw - 32px)"
        }}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-3 mb-1 font-display text-xl text-ink-dark">
            <Wand2 className="h-5 w-5 text-accent-primary" />
            Create AI Content
          </DialogTitle>
          <DialogDescription className="text-ink-light font-serif text-[14px]">
            Start a new AI-assisted content creation project.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto px-6 pt-2 pb-4 flex-grow" style={{ maxHeight: "calc(100vh - 250px)" }}>
          <form id="createContentForm" onSubmit={handleSubmit} className="space-y-5 py-4">
            <div className="space-y-2">
              <label htmlFor="content-title" className="block font-serif text-[14px] text-accent-primary font-medium">
                Content Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="content-title"
                placeholder="Enter a title for your content"
                className="bg-cream/50 border-accent-primary/30 font-serif focus:border-accent-primary focus:ring-accent-primary/20 shadow-inner transition-all duration-200 text-[14px]"
                value={contentData.title}
                onChange={(e) => setContentData({ ...contentData, title: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="block font-serif text-[14px] text-accent-primary font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Briefly describe your content (optional)"
                className="bg-cream/50 border-accent-primary/30 font-serif min-h-[80px] focus:border-accent-primary focus:ring-accent-primary/20 shadow-inner transition-all duration-200 text-[14px]"
                value={contentData.description}
                onChange={(e) => setContentData({ ...contentData, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-3">
              <label className="block font-serif text-[14px] text-accent-primary font-medium">
                Content Type <span className="text-red-500">*</span>
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* E-Book Option */}
                <label 
                  className={`relative border rounded-md p-3 cursor-pointer transition-all duration-200
                    ${contentData.contentType === 'e-book' 
                      ? 'border-accent-yellow/60 bg-accent-yellow/5 shadow-sm' 
                      : 'border-accent-tertiary/30 hover:border-accent-yellow/40 hover:shadow-sm bg-cream/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="contentType"
                    value="e-book"
                    className="sr-only"
                    checked={contentData.contentType === 'e-book'}
                    onChange={() => setContentData({ ...contentData, contentType: 'e-book' })}
                  />
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5
                      ${contentData.contentType === 'e-book'
                        ? 'border-accent-yellow bg-accent-yellow/10'
                        : 'border-accent-tertiary/50'
                      }`}
                    >
                      {contentData.contentType === 'e-book' && (
                        <div className="w-2 h-2 bg-accent-yellow rounded-full m-auto" />
                      )}
                    </div>
                    <div>
                      <div className="font-serif font-medium text-ink-dark text-[14px]">E-Book</div>
                      <div className="text-[12px] font-serif text-ink-light mt-1">
                        Create a complete digital book with chapters and sections
                      </div>
                    </div>
                  </div>
                </label>
                
                {/* Online Course Option */}
                <label 
                  className={`relative border rounded-md p-3 cursor-pointer transition-all duration-200
                    ${contentData.contentType === 'online-course' 
                      ? 'border-accent-yellow/60 bg-accent-yellow/5 shadow-sm' 
                      : 'border-accent-tertiary/30 hover:border-accent-yellow/40 hover:shadow-sm bg-cream/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="contentType"
                    value="online-course"
                    className="sr-only"
                    checked={contentData.contentType === 'online-course'}
                    onChange={() => setContentData({ ...contentData, contentType: 'online-course' })}
                  />
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5
                      ${contentData.contentType === 'online-course'
                        ? 'border-accent-yellow bg-accent-yellow/10'
                        : 'border-accent-tertiary/50'
                      }`}
                    >
                      {contentData.contentType === 'online-course' && (
                        <div className="w-2 h-2 bg-accent-yellow rounded-full m-auto" />
                      )}
                    </div>
                    <div>
                      <div className="font-serif font-medium text-ink-dark text-[14px]">Online Course</div>
                      <div className="text-[12px] font-serif text-ink-light mt-1">
                        Educational content organized into modules and lessons
                      </div>
                    </div>
                  </div>
                </label>
                
                {/* Blog Post Option */}
                <label 
                  className={`relative border rounded-md p-3 cursor-pointer transition-all duration-200
                    ${contentData.contentType === 'blog-post' 
                      ? 'border-accent-yellow/60 bg-accent-yellow/5 shadow-sm' 
                      : 'border-accent-tertiary/30 hover:border-accent-yellow/40 hover:shadow-sm bg-cream/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="contentType"
                    value="blog-post"
                    className="sr-only"
                    checked={contentData.contentType === 'blog-post'}
                    onChange={() => setContentData({ ...contentData, contentType: 'blog-post' })}
                  />
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5
                      ${contentData.contentType === 'blog-post'
                        ? 'border-accent-yellow bg-accent-yellow/10'
                        : 'border-accent-tertiary/50'
                      }`}
                    >
                      {contentData.contentType === 'blog-post' && (
                        <div className="w-2 h-2 bg-accent-yellow rounded-full m-auto" />
                      )}
                    </div>
                    <div>
                      <div className="font-serif font-medium text-ink-dark text-[14px]">Blog Post</div>
                      <div className="text-[12px] font-serif text-ink-light mt-1">
                        Article format with introduction, body, and conclusion
                      </div>
                    </div>
                  </div>
                </label>
                
                {/* Video Script Option */}
                <label 
                  className={`relative border rounded-md p-3 cursor-pointer transition-all duration-200
                    ${contentData.contentType === 'video-script' 
                      ? 'border-accent-yellow/60 bg-accent-yellow/5 shadow-sm' 
                      : 'border-accent-tertiary/30 hover:border-accent-yellow/40 hover:shadow-sm bg-cream/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="contentType"
                    value="video-script"
                    className="sr-only"
                    checked={contentData.contentType === 'video-script'}
                    onChange={() => setContentData({ ...contentData, contentType: 'video-script' })}
                  />
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5
                      ${contentData.contentType === 'video-script'
                        ? 'border-accent-yellow bg-accent-yellow/10'
                        : 'border-accent-tertiary/50'
                      }`}
                    >
                      {contentData.contentType === 'video-script' && (
                        <div className="w-2 h-2 bg-accent-yellow rounded-full m-auto" />
                      )}
                    </div>
                    <div>
                      <div className="font-serif font-medium text-ink-dark text-[14px]">Video Script</div>
                      <div className="text-[12px] font-serif text-ink-light mt-1">
                        Script for video production with sections and talking points
                      </div>
                    </div>
                  </div>
                </label>
                
                {/* Newsletter Option */}
                <label 
                  className={`relative border rounded-md p-3 cursor-pointer transition-all duration-200
                    ${contentData.contentType === 'newsletter' 
                      ? 'border-accent-yellow/60 bg-accent-yellow/5 shadow-sm' 
                      : 'border-accent-tertiary/30 hover:border-accent-yellow/40 hover:shadow-sm bg-cream/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="contentType"
                    value="newsletter"
                    className="sr-only"
                    checked={contentData.contentType === 'newsletter'}
                    onChange={() => setContentData({ ...contentData, contentType: 'newsletter' })}
                  />
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5
                      ${contentData.contentType === 'newsletter'
                        ? 'border-accent-yellow bg-accent-yellow/10'
                        : 'border-accent-tertiary/50'
                      }`}
                    >
                      {contentData.contentType === 'newsletter' && (
                        <div className="w-2 h-2 bg-accent-yellow rounded-full m-auto" />
                      )}
                    </div>
                    <div>
                      <div className="font-serif font-medium text-ink-dark text-[14px]">Newsletter</div>
                      <div className="text-[12px] font-serif text-ink-light mt-1">
                        Email newsletter format with sections and call-to-actions
                      </div>
                    </div>
                  </div>
                </label>
                
                {/* Social Media Option */}
                <label 
                  className={`relative border rounded-md p-3 cursor-pointer transition-all duration-200
                    ${contentData.contentType === 'social-media' 
                      ? 'border-accent-yellow/60 bg-accent-yellow/5 shadow-sm' 
                      : 'border-accent-tertiary/30 hover:border-accent-yellow/40 hover:shadow-sm bg-cream/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="contentType"
                    value="social-media"
                    className="sr-only"
                    checked={contentData.contentType === 'social-media'}
                    onChange={() => setContentData({ ...contentData, contentType: 'social-media' })}
                  />
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5
                      ${contentData.contentType === 'social-media'
                        ? 'border-accent-yellow bg-accent-yellow/10'
                        : 'border-accent-tertiary/50'
                      }`}
                    >
                      {contentData.contentType === 'social-media' && (
                        <div className="w-2 h-2 bg-accent-yellow rounded-full m-auto" />
                      )}
                    </div>
                    <div>
                      <div className="font-serif font-medium text-ink-dark text-[14px]">Social Media</div>
                      <div className="text-[12px] font-serif text-ink-light mt-1">
                        Content for social media platforms in various formats
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="bg-cream/70 border border-accent-primary/20 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-accent-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-[14px] font-serif font-medium text-ink-dark">Next: Brain Dump Tool</h3>
                  <p className="text-[12px] font-serif text-ink-light mt-1">
                    After creating your content, you'll be directed to the Brain Dump tool
                    to gather and analyze your raw content. This helps our AI understand
                    your ideas and generate better results.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div className="border-t border-accent-tertiary/30 p-4 bg-accent-yellow/10 mt-auto flex-shrink-0 flex justify-end gap-3 sticky bottom-0 rounded-b-lg" style={{ boxShadow: "0 -2px 10px rgba(0,0,0,0.05)" }}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="font-serif border-accent-primary/30 text-ink-light hover:bg-accent-tertiary/10 transition-all duration-200 text-[14px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="createContentForm"
            variant="default"
            size="sm"
            disabled={isSubmitting}
            className="gap-2 font-serif bg-accent-primary hover:bg-accent-secondary text-white border border-accent-primary/30 shadow-blue-sm text-[14px]"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full" />
                Creating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Continue
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContentModal; 