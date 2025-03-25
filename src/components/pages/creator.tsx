import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkflow, WorkflowType } from "@/lib/contexts/WorkflowContext";
import DashboardLayout from "../layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookText,
  FileText,
  MessageSquare,
  PenTool,
  Plus,
  Search,
  Sparkles,
  Video,
  Wand2,
  Clock,
  Star,
  BookOpen,
  BookCopy,
  Layout,
  FileEdit,
  Calendar,
  Share2,
} from "lucide-react";
import CreateContentModal, { ContentData } from "../creator/CreateContentModal";

const Creator = () => {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();
  const { resetWorkflow } = useWorkflow();

  // Sample templates for the gallery
  const templates = [
    {
      id: "1",
      title: "Blog Post",
      description: "Create engaging blog content with SEO optimization",
      category: "content",
      icon: <FileEdit className="h-10 w-10 text-accent-primary" />,
      featured: true,
    },
    {
      id: "2",
      title: "E-Book (NEW!)",
      description:
        "Generate a complete digital book with our new AI-powered workflow",
      category: "ebook",
      icon: <BookOpen className="h-10 w-10 text-accent-primary" />,
      featured: true,
    },
    {
      id: "3",
      title: "Video Script",
      description: "Create compelling scripts for video content",
      category: "video",
      icon: <Video className="h-10 w-10 text-accent-primary" />,
      featured: false,
    },
    {
      id: "4",
      title: "Newsletter",
      description: "Design email newsletters with engaging content",
      category: "content",
      icon: <FileText className="h-10 w-10 text-accent-primary" />,
      featured: false,
    },
    {
      id: "5",
      title: "Social Media Posts",
      description: "Generate posts for various social media platforms",
      category: "social",
      icon: <MessageSquare className="h-10 w-10 text-accent-primary" />,
      featured: true,
    },
    {
      id: "6",
      title: "Online Course",
      description:
        "Create educational content organized into modules and lessons",
      category: "ebook",
      icon: <BookCopy className="h-10 w-10 text-accent-primary" />,
      featured: false,
    },
    {
      id: "7",
      title: "Landing Page Content",
      description: "Craft compelling landing page copy that converts",
      category: "content",
      icon: <Layout className="h-10 w-10 text-accent-primary" />,
      featured: false,
    },
    {
      id: "8",
      title: "Event Promotion",
      description: "Create promotional content for events and webinars",
      category: "social",
      icon: <Calendar className="h-10 w-10 text-accent-primary" />,
      featured: false,
    },
  ];

  // Recent creations data
  const recentCreations = [
    {
      id: "c1",
      title: "Marketing E-Book",
      type: "E-Book",
      date: "2 days ago",
      progress: 75,
      icon: <BookOpen className="h-4 w-4 text-accent-primary" />,
    },
    {
      id: "c2",
      title: "Weekly Newsletter",
      type: "Newsletter",
      date: "1 week ago",
      progress: 100,
      icon: <FileText className="h-4 w-4 text-accent-primary" />,
    },
    {
      id: "c3",
      title: "Product Launch Posts",
      type: "Social Media",
      date: "3 days ago",
      progress: 90,
      icon: <Share2 className="h-4 w-4 text-accent-primary" />,
    },
  ];

  const featuredTemplates = templates.filter(template => template.featured);
  
  const filteredTemplates =
    activeFilter === "all"
      ? templates
      : templates.filter((template) => template.category === activeFilter);

  const handleCreateContent = (data: ContentData) => {
    // For e-book content type, navigate to the integrated workflow
    if (data.contentType === 'e-book') {
      // Store the content data in session storage for the workflow to use
      sessionStorage.setItem('newProjectData', JSON.stringify({
        title: data.title,
        description: data.description
      }));
      
      // Reset workflow and navigate to ebook workflow
      resetWorkflow('ebook');
    } else {
      // For other content types, show placeholder for now
      console.log("Creating content:", data);
      // Here you would typically navigate to the Brain Dump tool
      // or start the content creation process
      setOpen(false);
    }
  };

  return (
    <DashboardLayout activeTab="Creator">
      <div className="space-y-8 animate-fade-in">
        {/* Hero section */}
        <div className="bg-gradient-to-br from-accent-primary/10 to-accent-tertiary/5 rounded-xl p-6 md:p-8 shadow-textera mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-lg">
              <h1 className="text-3xl font-display text-ink-dark mb-3">AI Creator Studio</h1>
              <p className="text-ink-light font-serif text-lg mb-4">
                Transform your ideas into polished content with the power of AI assistance.
                Try our <b>NEW eBook Workflow</b> for creating professional eBooks!
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="gap-2 bg-accent-primary hover:bg-accent-primary/90 text-white font-serif px-6 py-5 text-base"
                  onClick={() => setOpen(true)}
                >
                  <Wand2 className="h-5 w-5" />
                  Create New Content
                </Button>
                <Button
                  className="gap-2 bg-accent-tertiary hover:bg-accent-tertiary/90 text-white font-serif px-6 py-5 text-base"
                  onClick={() => resetWorkflow('ebook')}
                >
                  <BookOpen className="h-5 w-5" />
                  Try eBook Workflow
                </Button>
              </div>
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

        {/* Featured templates section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display text-ink-dark">Featured Templates</h2>
            <Button 
              variant="ghost" 
              className="text-accent-primary hover:text-accent-primary/80 font-serif"
              onClick={() => setActiveFilter("all")}
            >
              View All Templates
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredTemplates.map((template) => (
              <Card 
                key={template.id}
                className="bg-paper border-accent-tertiary/20 shadow-textera hover:shadow-textera-md transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-accent-primary/10 p-3 rounded-lg">
                      {template.icon}
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-ink-dark mb-1">
                        {template.title}
                      </h3>
                      <p className="text-sm text-ink-light font-serif mb-4">
                        {template.description}
                      </p>
                      <Button 
                        className="bg-accent-primary hover:bg-accent-primary/90 text-white font-serif w-full"
                        onClick={() => {
                          if (template.category === 'ebook') {
                            resetWorkflow('ebook');
                          } else {
                            setOpen(true);
                          }
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent creations section */}
        <section className="mb-8">
          <h2 className="text-xl font-display text-ink-dark mb-4">Recent Creations</h2>
          <div className="bg-paper rounded-lg border border-accent-tertiary/20 shadow-textera overflow-hidden">
            <div className="divide-y divide-accent-tertiary/10">
              {recentCreations.map((item) => (
                <div key={item.id} className="p-4 hover:bg-accent-primary/5 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-accent-primary/10 p-2 rounded-md">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-serif font-medium text-ink-dark">{item.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-ink-light mt-1">
                          <span>{item.type}</span>
                          <span className="h-1 w-1 bg-ink-faded rounded-full"></span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {item.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-accent-tertiary/10 rounded-full h-2">
                        <div 
                          className="bg-accent-primary h-2 rounded-full" 
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-accent-primary hover:bg-accent-primary/10">
                        Continue
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All templates section */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-display text-ink-dark">All Templates</h2>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faded h-4 w-4" />
                <Input placeholder="Search templates..." className="pl-10 font-serif bg-cream border-accent-tertiary/20" />
              </div>

              <Tabs
                defaultValue="all"
                className="w-full md:w-auto"
                onValueChange={setActiveFilter}
                value={activeFilter}
              >
                <TabsList className="grid grid-cols-5 w-full md:w-auto bg-cream border border-accent-tertiary/20">
                  <TabsTrigger value="all" className="data-[state=active]:bg-paper data-[state=active]:text-accent-primary font-serif">All</TabsTrigger>
                  <TabsTrigger value="content" className="data-[state=active]:bg-paper data-[state=active]:text-accent-primary font-serif">Content</TabsTrigger>
                  <TabsTrigger value="ebook" className="data-[state=active]:bg-paper data-[state=active]:text-accent-primary font-serif">E-Books</TabsTrigger>
                  <TabsTrigger value="social" className="data-[state=active]:bg-paper data-[state=active]:text-accent-primary font-serif">Social</TabsTrigger>
                  <TabsTrigger value="video" className="data-[state=active]:bg-paper data-[state=active]:text-accent-primary font-serif">Video</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-paper p-6 rounded-lg border border-accent-tertiary/20 shadow-textera hover:shadow-textera-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-accent-primary/10 p-3 rounded-lg">
                      {template.icon}
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-ink-dark">
                        {template.title}
                      </h3>
                      <p className="text-sm text-ink-light mt-1 font-serif">
                        {template.description}
                      </p>
                      <Button 
                        className="mt-4 bg-accent-primary hover:bg-accent-primary/90 text-white font-serif"
                        onClick={() => {
                          if (template.category === 'ebook') {
                            resetWorkflow('ebook');
                          } else {
                            setOpen(true);
                          }
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-paper rounded-lg border border-accent-tertiary/20 shadow-textera">
              <Sparkles className="h-12 w-12 mx-auto text-ink-faded mb-4" />
              <h3 className="text-xl font-display text-ink-dark mb-2">
                No templates found
              </h3>
              <p className="text-ink-light max-w-md mx-auto mb-6 font-serif">
                We couldn't find any templates matching your search criteria.
                Try adjusting your filters or search term.
              </p>
              <Button
                variant="outline"
                onClick={() => setActiveFilter("all")}
                className="mx-auto font-serif"
              >
                View All Templates
              </Button>
            </div>
          )}
        </section>

        <div className="bg-accent-primary/5 p-6 rounded-lg border border-accent-primary/20">
          <div className="flex items-start gap-4">
            <div className="bg-accent-primary/20 p-3 rounded-full">
              <Star className="h-6 w-6 text-accent-primary" />
            </div>
            <div>
              <h3 className="text-lg font-display text-ink-dark mb-2">
                Pro Tips for Better Content
              </h3>
              <ul className="text-ink-light font-serif space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary font-medium">•</span>
                  <span>Provide detailed instructions in your content description for more tailored results.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary font-medium">•</span>
                  <span>Use the Brain Dump feature to organize your thoughts before generating content.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary font-medium">•</span>
                  <span>Review and edit AI-generated content to add your personal voice and style.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <CreateContentModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onCreateContent={handleCreateContent}
      />
    </DashboardLayout>
  );
};

export default Creator;
