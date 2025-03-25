import React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, FileText, BookOpen, GraduationCap, FileEdit, Video, Mail, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
        className="sm:max-w-[550px] md:max-w-[580px] bg-white border-gray-200 p-0 shadow-md rounded-xl flex flex-col overflow-hidden"
        style={{ 
          maxHeight: "calc(100vh - 40px)",
          width: "calc(100vw - 32px)"
        }}
      >
        <div className="bg-gradient-to-r from-[#738996]/10 to-white border-b border-gray-100">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-3 mb-2 font-georgia text-2xl text-gray-800">
              <div className="bg-[#738996]/10 p-1.5 rounded-md">
                <Wand2 className="h-5 w-5 text-[#738996]" />
              </div>
              Create AI Content
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-[15px]">
              Start a new AI-assisted content creation project.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="overflow-y-auto px-6 pt-4 pb-4 flex-grow" style={{ maxHeight: "calc(100vh - 250px)" }}>
          <form id="createContentForm" onSubmit={handleSubmit} className="space-y-6 py-2">
            <div className="space-y-2">
              <label htmlFor="content-title" className="block font-medium text-[15px] text-gray-700">
                Content Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="content-title"
                placeholder="Enter a title for your content"
                className="bg-white border-gray-300 focus:border-[#738996] focus:ring-[#738996]/20 shadow-sm transition-all duration-200 text-[15px] rounded-md"
                value={contentData.title}
                onChange={(e) => setContentData({ ...contentData, title: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="block font-medium text-[15px] text-gray-700">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Briefly describe your content (optional)"
                className="bg-white border-gray-300 min-h-[80px] focus:border-[#738996] focus:ring-[#738996]/20 shadow-sm transition-all duration-200 text-[15px] rounded-md"
                value={contentData.description}
                onChange={(e) => setContentData({ ...contentData, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-3">
              <label className="block font-medium text-[15px] text-gray-700">
                Content Type <span className="text-red-500">*</span>
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* E-Book Option */}
                <label 
                  className={cn(
                    "relative border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                    contentData.contentType === 'e-book' 
                      ? 'border-[#ccb595] bg-[#ccb595]/5 shadow-sm ring-1 ring-[#ccb595]/20' 
                      : 'border-gray-200 hover:border-[#ccb595]/30 bg-white'
                  )}
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
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", 
                      contentData.contentType === 'e-book'
                        ? 'bg-[#ccb595]/10 text-[#ccb595]' 
                        : 'bg-gray-100 text-gray-400'
                    )}>
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-georgia font-medium text-gray-800 text-[15px]">E-Book</div>
                      <div className="text-[13px] text-gray-500 mt-1">
                        Create a complete digital book with chapters and sections
                      </div>
                    </div>
                  </div>
                </label>
                
                {/* Online Course Option */}
                <label 
                  className={cn(
                    "relative border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                    contentData.contentType === 'online-course' 
                      ? 'border-[#ccb595] bg-[#ccb595]/5 shadow-sm ring-1 ring-[#ccb595]/20' 
                      : 'border-gray-200 hover:border-[#ccb595]/30 bg-white'
                  )}
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
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", 
                      contentData.contentType === 'online-course'
                        ? 'bg-[#ccb595]/10 text-[#ccb595]' 
                        : 'bg-gray-100 text-gray-400'
                    )}>
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-georgia font-medium text-gray-800 text-[15px]">Online Course</div>
                      <div className="text-[13px] text-gray-500 mt-1">
                        Educational content organized into modules and lessons
                      </div>
                    </div>
                  </div>
                </label>
                
                {/* Blog Post Option */}
                <label 
                  className={cn(
                    "relative border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                    contentData.contentType === 'blog-post' 
                      ? 'border-[#ccb595] bg-[#ccb595]/5 shadow-sm ring-1 ring-[#ccb595]/20' 
                      : 'border-gray-200 hover:border-[#ccb595]/30 bg-white'
                  )}
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
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", 
                      contentData.contentType === 'blog-post'
                        ? 'bg-[#ccb595]/10 text-[#ccb595]' 
                        : 'bg-gray-100 text-gray-400'
                    )}>
                      <FileEdit className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-georgia font-medium text-gray-800 text-[15px]">Blog Post</div>
                      <div className="text-[13px] text-gray-500 mt-1">
                        Article format with introduction, body, and conclusion
                      </div>
                    </div>
                  </div>
                </label>
                
                {/* Video Script Option */}
                <label 
                  className={cn(
                    "relative border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                    contentData.contentType === 'video-script' 
                      ? 'border-[#ccb595] bg-[#ccb595]/5 shadow-sm ring-1 ring-[#ccb595]/20' 
                      : 'border-gray-200 hover:border-[#ccb595]/30 bg-white'
                  )}
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
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", 
                      contentData.contentType === 'video-script'
                        ? 'bg-[#ccb595]/10 text-[#ccb595]' 
                        : 'bg-gray-100 text-gray-400'
                    )}>
                      <Video className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-georgia font-medium text-gray-800 text-[15px]">Video Script</div>
                      <div className="text-[13px] text-gray-500 mt-1">
                        Script for video production with sections and talking points
                      </div>
                    </div>
                  </div>
                </label>
                
                {/* Newsletter Option */}
                <label 
                  className={cn(
                    "relative border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                    contentData.contentType === 'newsletter' 
                      ? 'border-[#ccb595] bg-[#ccb595]/5 shadow-sm ring-1 ring-[#ccb595]/20' 
                      : 'border-gray-200 hover:border-[#ccb595]/30 bg-white'
                  )}
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
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", 
                      contentData.contentType === 'newsletter'
                        ? 'bg-[#ccb595]/10 text-[#ccb595]' 
                        : 'bg-gray-100 text-gray-400'
                    )}>
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-georgia font-medium text-gray-800 text-[15px]">Newsletter</div>
                      <div className="text-[13px] text-gray-500 mt-1">
                        Email newsletter format with sections and call-to-actions
                      </div>
                    </div>
                  </div>
                </label>
                
                {/* Social Media Option */}
                <label 
                  className={cn(
                    "relative border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                    contentData.contentType === 'social-media' 
                      ? 'border-[#ccb595] bg-[#ccb595]/5 shadow-sm ring-1 ring-[#ccb595]/20' 
                      : 'border-gray-200 hover:border-[#ccb595]/30 bg-white'
                  )}
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
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", 
                      contentData.contentType === 'social-media'
                        ? 'bg-[#ccb595]/10 text-[#ccb595]' 
                        : 'bg-gray-100 text-gray-400'
                    )}>
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-georgia font-medium text-gray-800 text-[15px]">Social Media</div>
                      <div className="text-[13px] text-gray-500 mt-1">
                        Content for social media platforms in various formats
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[#738996]/5 to-white border border-gray-200 p-5 rounded-lg shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-[#738996]/10 p-2 rounded-md flex-shrink-0 mt-0.5">
                  <FileText className="h-5 w-5 text-[#738996]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-georgia font-medium text-gray-800 mb-1">Next: Brain Dump Tool</h3>
                  <p className="text-[13px] text-gray-600">
                    After creating your content, you'll be directed to the Brain Dump tool
                    to gather and analyze your raw content. This helps our AI understand
                    your ideas and generate better results.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <DialogFooter className="border-t border-gray-200 p-5 bg-gradient-to-r from-[#738996]/5 to-white mt-auto flex-shrink-0 sticky bottom-0 rounded-b-xl" style={{ boxShadow: "0 -2px 10px rgba(0,0,0,0.03)" }}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-200 text-[14px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="createContentForm"
            variant="default"
            disabled={isSubmitting}
            className="gap-2 bg-[#738996] hover:bg-[#647989] text-white border-none shadow-sm text-[14px] min-w-24"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContentModal; 