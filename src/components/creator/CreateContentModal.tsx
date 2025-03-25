import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Wand2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateContent(contentData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] bg-paper border-accent-tertiary/20 p-0 overflow-hidden shadow-blue-md rounded-lg">
        <div className="relative">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-3 mb-1 font-display text-xl text-ink-dark">
              <Wand2 className="h-5 w-5 text-accent-yellow" />
              Create AI Content
            </DialogTitle>
            <DialogDescription className="text-ink-light font-serif text-sm">
              Start a new AI-assisted content creation project.
            </DialogDescription>
          </DialogHeader>
          <button
            className="absolute top-6 right-6 text-ink-faded hover:text-accent-yellow"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5 px-6">
          <div className="space-y-2">
            <label htmlFor="content-title" className="block font-serif text-sm text-accent-yellow font-medium">
              Content Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="content-title"
              placeholder="Enter a title for your content"
              className="bg-cream border-accent-yellow/30 font-serif focus:border-accent-yellow focus:ring-accent-yellow/20 shadow-inner transition-all duration-200"
              value={contentData.title}
              onChange={(e) => setContentData({ ...contentData, title: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="block font-serif text-sm text-accent-yellow font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Briefly describe your content (optional)"
              className="bg-cream border-accent-yellow/30 font-serif min-h-[100px] focus:border-accent-yellow focus:ring-accent-yellow/20 shadow-inner transition-all duration-200"
              value={contentData.description}
              onChange={(e) => setContentData({ ...contentData, description: e.target.value })}
            />
          </div>
          
          <div className="space-y-3">
            <label className="block font-serif text-sm text-accent-yellow font-medium">
              Content Type <span className="text-red-500">*</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* E-Book Option */}
              <label 
                className={`relative border rounded-md p-4 cursor-pointer transition-all duration-200
                  ${contentData.contentType === 'e-book' 
                    ? 'border-accent-yellow/60 bg-accent-yellow/5 shadow-yellow-sm' 
                    : 'border-accent-tertiary/20 hover:border-accent-yellow/40 hover:shadow-sm bg-cream'
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
                <div className="flex items-start gap-3">
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
                    <div className="font-serif font-medium text-ink-dark">E-Book</div>
                    <div className="text-xs font-serif text-ink-light mt-1">
                      Create a complete digital book with chapters and sections
                    </div>
                  </div>
                </div>
              </label>
              
              {/* Online Course Option */}
              <label 
                className={`relative border rounded-md p-4 cursor-pointer transition-all duration-200
                  ${contentData.contentType === 'online-course' 
                    ? 'border-accent-yellow/60 bg-accent-yellow/5 shadow-yellow-sm' 
                    : 'border-accent-tertiary/20 hover:border-accent-yellow/40 hover:shadow-sm bg-cream'
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
                <div className="flex items-start gap-3">
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
                    <div className="font-serif font-medium text-ink-dark">Online Course</div>
                    <div className="text-xs font-serif text-ink-light mt-1">
                      Educational content organized into modules and lessons
                    </div>
                  </div>
                </div>
              </label>
              
              {/* Blog Post Option */}
              <label 
                className={`relative border rounded-md p-4 cursor-pointer transition-all duration-200
                  ${contentData.contentType === 'blog-post' 
                    ? 'border-accent-yellow/60 bg-accent-yellow/5 shadow-yellow-sm' 
                    : 'border-accent-tertiary/20 hover:border-accent-yellow/40 hover:shadow-sm bg-cream'
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
                <div className="flex items-start gap-3">
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
                    <div className="font-serif font-medium text-ink-dark">Blog Post</div>
                    <div className="text-xs font-serif text-ink-light mt-1">
                      Article format with introduction, body, and conclusion
                    </div>
                  </div>
                </div>
              </label>
              
              {/* Video Script Option */}
              <label 
                className={`relative border rounded-md p-4 cursor-pointer transition-all duration-200
                  ${contentData.contentType === 'video-script' 
                    ? 'border-accent-yellow/60 bg-accent-yellow/5 shadow-yellow-sm' 
                    : 'border-accent-tertiary/20 hover:border-accent-yellow/40 hover:shadow-sm bg-cream'
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
                <div className="flex items-start gap-3">
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
                    <div className="font-serif font-medium text-ink-dark">Video Script</div>
                    <div className="text-xs font-serif text-ink-light mt-1">
                      Script for video production with sections and talking points
                    </div>
                  </div>
                </div>
              </label>
              
              {/* Newsletter Option */}
              <label 
                className={`relative border rounded-md p-4 cursor-pointer transition-all duration-200
                  ${contentData.contentType === 'newsletter' 
                    ? 'border-accent-yellow/60 bg-accent-yellow/5 shadow-yellow-sm' 
                    : 'border-accent-tertiary/20 hover:border-accent-yellow/40 hover:shadow-sm bg-cream'
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
                <div className="flex items-start gap-3">
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
                    <div className="font-serif font-medium text-ink-dark">Newsletter</div>
                    <div className="text-xs font-serif text-ink-light mt-1">
                      Email newsletter format with sections and call-to-actions
                    </div>
                  </div>
                </div>
              </label>
              
              {/* Social Media Option */}
              <label 
                className={`relative border rounded-md p-4 cursor-pointer transition-all duration-200
                  ${contentData.contentType === 'social-media' 
                    ? 'border-accent-yellow/60 bg-accent-yellow/5 shadow-yellow-sm' 
                    : 'border-accent-tertiary/20 hover:border-accent-yellow/40 hover:shadow-sm bg-cream'
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
                <div className="flex items-start gap-3">
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
                    <div className="font-serif font-medium text-ink-dark">Social Media</div>
                    <div className="text-xs font-serif text-ink-light mt-1">
                      Content for social media platforms in various formats
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          <div className="bg-accent-yellow/10 border border-accent-yellow/20 p-4 rounded-md">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-accent-yellow flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-serif font-medium text-ink-dark">Next: Brain Dump Tool</h3>
                <p className="text-xs font-serif text-ink-light mt-1">
                  After creating your content, you'll be directed to the Brain Dump tool
                  to gather and analyze your raw content. This helps our AI understand
                  your ideas and generate better results.
                </p>
              </div>
            </div>
          </div>
        </form>
        
        <DialogFooter className="bg-cream/80 border-t border-accent-tertiary/30 p-4 gap-3 shadow-inner">
          <Button
            variant="outline"
            onClick={onClose}
            className="font-serif border-accent-tertiary/40 text-ink-light hover:bg-accent-tertiary/10 transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="gap-2 font-serif bg-accent-yellow hover:bg-accent-yellow/90 text-white border border-accent-yellow/50 shadow-yellow-sm"
          >
            <Wand2 className="h-4 w-4" />
            Create Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContentModal; 