import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart3,
  BookText,
  FileText,
  PenTool,
  Plus,
  Sparkles,
  Users,
  Zap,
  Award,
  Brain,
  ChevronRight,
  Settings,
  Clock,
  CloudLightning as Lightning,
  Wand2,
  Layers,
  Crown,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../../supabase/auth";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  
  // Mock data for dashboard stats
  const dashboardStats = {
    completedProducts: 5,
    draftProducts: 7,
    wordsWritten: 24350,
    aiCredits: 850
  };

  // Mock data for recent products
  const recentProducts = [
    { id: 1, title: "Business Leadership Guide", date: "2 days ago", progress: 80, category: "Business" },
    { id: 2, title: "Cooking Techniques", date: "1 week ago", progress: 45, category: "Food" },
    { id: 3, title: "Travel Photography Tips", date: "2 weeks ago", progress: 90, category: "Photography" }
  ];

  // Mock brain dumps
  const brainDumps = [
    { id: 1, title: "Marketing Strategy Notes", created_at: "2023-05-15T10:30:00", content: JSON.stringify({summary: "Key insights on digital marketing trends and strategies for Q3"}) },
    { id: 2, title: "Book Chapter Ideas", created_at: "2023-05-12T14:20:00", content: JSON.stringify({summary: "Outline and concepts for my upcoming non-fiction book on productivity"}) },
    { id: 3, title: "Conference Notes", created_at: "2023-05-08T09:15:00", content: JSON.stringify({summary: "Important takeaways from the annual industry conference panels and workshops"}) }
  ];

  // Mock writing tips
  const writingTips = [
    "Break your content into logical chapters to improve readability.",
    "Use consistent formatting throughout your e-book for a professional look.",
    "Include engaging visuals to complement your written content.",
    "Start with a compelling introduction that hooks your readers."
  ];

  // Template options with descriptions
  const templates = [
    {
      id: "ebook",
      name: "E-Book",
      description: "Create a structured digital book with chapters and sections",
      features: ["Chapter organization", "Table of contents", "Multiple page layouts", "Footnotes & citations"]
    },
    {
      id: "course",
      name: "Online Course",
      description: "Educational content organized into modules and lessons",
      features: ["Module structure", "Progress tracking", "Quizzes & exercises", "Instructor notes"]
    },
    {
      id: "blog",
      name: "Blog Collection",
      description: "Compile blog posts into a cohesive publication",
      features: ["Post categorization", "Author profiles", "Comment highlights", "Unified styling"]
    },
    {
      id: "memoir",
      name: "Memoir/Biography",
      description: "Tell a personal or historical story with timeline features",
      features: ["Chronological organization", "Personal anecdotes", "Photo galleries", "Timeline view"]
    }
  ];

  // Helper function to navigate
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <DashboardLayout activeTab="Dashboard">
      <div className="space-y-4 animate-fade-in">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h2 className="font-display text-2xl text-ink-dark/90 dark:text-gray-100/90 mb-1 font-medium">
              Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ' Back'}!
            </h2>
            <p className="font-serif text-ink-light/80 dark:text-gray-400/90 text-sm">Continue working on your e-book products</p>
          </div>
          <div className="flex items-center space-x-3 mt-2 md:mt-0">
            <Button 
              onClick={() => handleNavigate('/settings')}
              variant="outline" 
              className="px-3 py-1.5 text-sm font-serif text-accent-primary/90 border border-accent-primary/20 hover:bg-accent-primary/5 flex items-center"
            >
              <Settings className="w-3.5 h-3.5 mr-1.5 opacity-80" />
              Settings
            </Button>
            <Button 
              onClick={() => handleNavigate('/brain-dump')}
              className="px-3 py-1.5 text-sm font-serif bg-accent-primary/90 text-white/95 rounded flex items-center hover:bg-accent-primary/80 transition-colors shadow-sm"
            >
              <PenTool className="w-3.5 h-3.5 mr-1.5 opacity-90" />
              New Brain Dump
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-paper dark:bg-gray-800 p-4 border border-accent-tertiary/10 dark:border-gray-700/80 shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-accent-secondary/5 dark:bg-accent-secondary/10 rounded-full flex items-center justify-center mr-3">
                  <Award className="w-3.5 h-3.5 text-accent-secondary/80" />
                </div>
                <div>
                  <p className="text-ink-light/80 dark:text-gray-400/90 text-xs font-serif">Completed Products</p>
                  <p className="text-ink-dark/90 dark:text-gray-100/90 text-xl font-display font-medium">{dashboardStats.completedProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-paper dark:bg-gray-800 p-4 border border-accent-tertiary/10 dark:border-gray-700/80 shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-accent-primary/5 dark:bg-accent-primary/10 rounded-full flex items-center justify-center mr-3">
                  <BookText className="w-3.5 h-3.5 text-accent-primary/80" />
                </div>
                <div>
                  <p className="text-ink-light/80 dark:text-gray-400/90 text-xs font-serif">Draft Products</p>
                  <p className="text-ink-dark/90 dark:text-gray-100/90 text-xl font-display font-medium">{dashboardStats.draftProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-paper dark:bg-gray-800 p-4 border border-accent-tertiary/10 dark:border-gray-700/80 shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-accent-tertiary/5 dark:bg-accent-tertiary/10 rounded-full flex items-center justify-center mr-3">
                  <FileText className="w-3.5 h-3.5 text-accent-tertiary/80" />
                </div>
                <div>
                  <p className="text-ink-light/80 dark:text-gray-400/90 text-xs font-serif">Words Written</p>
                  <p className="text-ink-dark/90 dark:text-gray-100/90 text-xl font-display font-medium">{dashboardStats.wordsWritten.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left column - Now starting with Quick Actions followed by Recent Products */}
          <div className="lg:col-span-2">
            {/* Quick Actions - Now first */}
            <Card className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/10 dark:border-gray-700/80 shadow-sm mb-6">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center">
                  <Zap className="w-4 h-4 text-accent-secondary/80 mr-2" />
                  <CardTitle className="font-display text-lg text-ink-dark/80 dark:text-gray-100/90 font-medium">Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleNavigate('/brain-dump')}
                    variant="outline"
                    className="p-3 border border-accent-tertiary/10 dark:border-gray-700/80 rounded-md bg-white dark:bg-gray-700 hover:shadow-sm transition-all flex items-start justify-start h-auto group"
                  >
                    <div className="w-7 h-7 bg-accent-primary/5 dark:bg-accent-primary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-primary/10 dark:group-hover:bg-accent-primary/20 transition-colors">
                      <PenTool className="w-3 h-3 text-accent-primary/80" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-serif font-medium text-ink-dark/90 dark:text-gray-100/90 group-hover:text-accent-primary/90 transition-colors text-sm">Brain Dump</h4>
                      <p className="font-serif text-xs text-ink-light/70 dark:text-gray-400/80 mt-0.5">
                        Transform your ideas into organized content
                      </p>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => handleNavigate('/creator')}
                    variant="outline"
                    className="p-3 border border-accent-tertiary/10 dark:border-gray-700/80 rounded-md bg-white dark:bg-gray-700 hover:shadow-sm transition-all flex items-start justify-start h-auto group"
                  >
                    <div className="w-7 h-7 bg-accent-secondary/5 dark:bg-accent-secondary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-secondary/10 dark:group-hover:bg-accent-secondary/20 transition-colors">
                      <Wand2 className="w-3 h-3 text-accent-secondary/80" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-serif font-medium text-ink-dark/90 dark:text-gray-100/90 group-hover:text-accent-secondary/90 transition-colors text-sm">AI Creator</h4>
                      <p className="font-serif text-xs text-ink-light/70 dark:text-gray-400/80 mt-0.5">
                        Generate complete content with AI
                      </p>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => handleNavigate('/products')}
                    variant="outline"
                    className="p-3 border border-accent-tertiary/10 dark:border-gray-700/80 rounded-md bg-white dark:bg-gray-700 hover:shadow-sm transition-all flex items-start justify-start h-auto group"
                  >
                    <div className="w-7 h-7 bg-accent-tertiary/5 dark:bg-accent-tertiary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-tertiary/10 dark:group-hover:bg-accent-tertiary/20 transition-colors">
                      <BookText className="w-3 h-3 text-accent-tertiary/80" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-serif font-medium text-ink-dark/90 dark:text-gray-100/90 group-hover:text-accent-tertiary/90 transition-colors text-sm">All Products</h4>
                      <p className="font-serif text-xs text-ink-light/70 dark:text-gray-400/80 mt-0.5">
                        View and manage all your e-books
                      </p>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => handleNavigate('/settings')}
                    variant="outline"
                    className="p-3 border border-accent-tertiary/10 dark:border-gray-700/80 rounded-md bg-white dark:bg-gray-700 hover:shadow-sm transition-all flex items-start justify-start h-auto group"
                  >
                    <div className="w-7 h-7 bg-accent-primary/5 dark:bg-accent-primary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-primary/10 dark:group-hover:bg-accent-primary/20 transition-colors">
                      <Settings className="w-3 h-3 text-accent-primary/80" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-serif font-medium text-ink-dark/90 dark:text-gray-100/90 group-hover:text-accent-primary/90 transition-colors text-sm">Settings</h4>
                      <p className="font-serif text-xs text-ink-light/70 dark:text-gray-400/80 mt-0.5">
                        Customize your account preferences
                      </p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Products */}
            <Card className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/10 dark:border-gray-700/80 shadow-sm mb-6">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-accent-primary/80 mr-2" />
                    <CardTitle className="font-display text-lg text-ink-dark/80 dark:text-gray-100/90 font-medium">Recent Products</CardTitle>
                  </div>
                  <Button 
                    onClick={() => handleNavigate('/products')}
                    variant="link"
                    className="text-accent-primary dark:text-gray-100 text-sm font-serif flex items-center hover:underline p-0"
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {recentProducts.length > 0 ? (
                  <div className="space-y-3">
                    {recentProducts.map(product => (
                      <div 
                        key={product.id} 
                        className="p-3 border border-accent-tertiary/10 dark:border-gray-700/80 rounded-md hover:shadow-sm transition-all cursor-pointer bg-white/50 dark:bg-gray-800/50"
                        onClick={() => handleNavigate(`/products/${product.id}`)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-serif font-medium text-ink-dark/90 dark:text-gray-100/90 text-sm">{product.title}</h4>
                            <div className="flex items-center mt-1">
                              <Badge variant="outline" className="text-xs font-serif bg-accent-secondary/5 dark:bg-accent-secondary/10 text-accent-secondary/80 dark:text-gray-400/90 mr-2 px-1.5 py-0">
                                {product.category}
                              </Badge>
                              <span className="text-xs font-serif text-ink-faded/70 dark:text-gray-500/80">
                                Updated {product.date}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-accent-tertiary/70 dark:text-gray-400/70" />
                        </div>
                        <div className="w-full bg-cream/50 dark:bg-gray-700/50 rounded-full h-1.5 mt-2 mb-1">
                          <Progress value={product.progress} className="h-1.5 bg-accent-primary/80 dark:bg-gray-200/90" />
                        </div>
                        <div className="flex justify-between text-xs font-serif">
                          <span className="text-ink-light/70 dark:text-gray-400/80 text-[10px]">Progress</span>
                          <span className="text-accent-primary/80 dark:text-gray-200/80 text-[10px]">{product.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BookText className="w-10 h-10 text-accent-tertiary/40 dark:text-gray-400 mx-auto mb-2" />
                    <p className="font-serif text-ink-light dark:text-gray-400 mb-3">You haven't created any products yet</p>
                    <Button 
                      onClick={() => handleNavigate('/products')}
                      className="px-3 py-1.5 font-serif text-sm bg-accent-primary dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-accent-primary/90 dark:hover:bg-gray-300"
                    >
                      Create Your First Product
                    </Button>
                  </div>
                )}
                
                {recentProducts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-accent-tertiary/20 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={() => handleNavigate('/creator')}
                        className="flex-1 px-3 py-1.5 text-xs font-serif bg-accent-secondary dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-accent-secondary/90 dark:hover:bg-gray-300 transition-colors flex items-center justify-center"
                      >
                        <Wand2 className="w-3 h-3 mr-1.5" />
                        New AI Content
                      </Button>
                      <Button 
                        onClick={() => handleNavigate('/products')}
                        variant="outline"
                        className="flex-1 px-3 py-1.5 text-xs font-serif bg-accent-primary/10 dark:bg-gray-700 text-accent-primary dark:text-gray-200 rounded hover:bg-accent-primary/20 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3 mr-1.5" />
                        New Product
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Brain Dumps */}
            <Card className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/10 dark:border-gray-700/80 shadow-sm mb-6">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Brain className="w-4 h-4 text-accent-secondary/80 mr-2" />
                    <CardTitle className="font-display text-lg text-ink-dark/80 dark:text-gray-100/90 font-medium">Recent Brain Dumps</CardTitle>
                  </div>
                  <Button 
                    onClick={() => handleNavigate('/brain-dumps')}
                    variant="link"
                    className="text-accent-primary dark:text-gray-100 text-sm font-serif flex items-center hover:underline p-0"
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {brainDumps.length > 0 ? (
                  <div className="space-y-3">
                    {brainDumps.map(dump => {
                      // Try to parse the content to get the summary
                      let summary = '';
                      try {
                        if (dump.content) {
                          const parsedContent = JSON.parse(dump.content);
                          summary = parsedContent.summary || '';
                        }
                      } catch (e) {
                        console.error('Error parsing brain dump content:', e);
                      }
                      
                      // Format date
                      const formattedDate = new Date(dump.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });
                      
                      return (
                        <div 
                          key={dump.id} 
                          className="p-3 border border-accent-tertiary/10 dark:border-gray-700/80 rounded-md hover:shadow-sm transition-all cursor-pointer bg-white/50 dark:bg-gray-800/50"
                          onClick={() => handleNavigate(`/brain-dump/${dump.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-serif font-medium text-ink-dark/90 dark:text-gray-100/90 text-sm">{dump.title}</h4>
                              <div className="flex items-center mt-1">
                                <span className="text-xs font-serif text-ink-faded/70 dark:text-gray-500/80">
                                  Created {formattedDate}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-accent-tertiary/70 dark:text-gray-400/70" />
                          </div>
                          {summary && (
                            <p className="mt-1.5 font-serif text-xs text-ink-light/80 dark:text-gray-400/90 line-clamp-2">
                              {summary}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Brain className="w-10 h-10 text-accent-tertiary/40 dark:text-gray-400 mx-auto mb-2" />
                    <p className="font-serif text-ink-light dark:text-gray-400 mb-3">You haven't created any brain dumps yet</p>
                    <Button 
                      onClick={() => handleNavigate('/brain-dump')}
                      className="px-3 py-1.5 font-serif text-sm bg-accent-primary dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-accent-primary/90 dark:hover:bg-gray-300 transition-colors"
                    >
                      Create Your First Brain Dump
                    </Button>
                  </div>
                )}
                
                {brainDumps.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-accent-tertiary/20 dark:border-gray-700">
                    <Button 
                      onClick={() => handleNavigate('/brain-dump')}
                      variant="outline"
                      className="w-full px-3 py-1.5 text-xs font-serif bg-accent-secondary/10 dark:bg-accent-secondary/20 text-accent-secondary dark:text-accent-secondary/90 border border-accent-secondary/20 dark:border-accent-secondary/30 rounded hover:bg-accent-secondary/20 dark:hover:bg-accent-secondary/30 transition-colors flex items-center justify-center"
                    >
                      <Brain className="w-3 h-3 mr-1.5" />
                      New Brain Dump
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right sidebar column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Product Templates */}
            <Card className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/10 dark:border-gray-700/80 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center">
                  <Layers className="w-4 h-4 text-accent-secondary/80 mr-2" />
                  <CardTitle className="font-display text-lg text-ink-dark/80 dark:text-gray-100/90 font-medium">Product Templates</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {templates.map(template => (
                    <div 
                      key={template.id}
                      className={`p-3 border ${activeTemplate === template.id ? 'border-accent-primary/50 bg-accent-primary/5' : 'border-accent-tertiary/10 dark:border-gray-700/80'} rounded-md cursor-pointer transition-all bg-white/50 dark:bg-gray-800/50`}
                      onClick={() => setActiveTemplate(activeTemplate === template.id ? null : template.id)}
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-serif font-medium text-ink-dark/90 dark:text-gray-100/90 text-sm">{template.name}</h4>
                        <ChevronRight className={`w-3.5 h-3.5 text-accent-primary/70 dark:text-gray-200/70 transition-transform ${activeTemplate === template.id ? 'rotate-90' : ''}`} />
                      </div>
                      
                      <p className="font-serif text-xs text-ink-light/80 dark:text-gray-400/90 mt-0.5 mb-1">
                        {template.description}
                      </p>
                      
                      {activeTemplate === template.id && (
                        <div className="mt-2 pt-2 border-t border-accent-tertiary/20 dark:border-gray-700">
                          <ul className="space-y-1 mb-2">
                            {template.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start text-xs font-serif text-ink-light/70 dark:text-gray-400/80">
                                <div className="w-2 h-2 rounded-full border border-white/80 dark:border-gray-700/80 flex items-center justify-center mt-0.5 mr-1.5 flex-shrink-0">
                                  <div className="w-0.5 h-0.5 bg-white/90 dark:bg-gray-700/90 rounded-full"></div>
                                </div>
                                {feature}
                              </li>
                            ))}
                          </ul>
                          
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleNavigate('/creator')}
                              className="flex-1 px-3 py-1.5 text-xs font-serif bg-accent-secondary dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-accent-secondary/90 dark:hover:bg-gray-300 transition-colors flex items-center justify-center"
                            >
                              <Wand2 className="w-3 h-3 mr-1.5" />
                              AI Create
                            </Button>
                            <Button
                              onClick={() => handleNavigate('/products')}
                              variant="outline"
                              className="flex-1 px-3 py-1.5 text-xs font-serif bg-accent-primary/10 dark:bg-gray-700 text-accent-primary dark:text-gray-200 rounded hover:bg-accent-primary/20 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3 mr-1.5" />
                              Manual
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          
            {/* Writing Tips */}
            <Card className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/10 dark:border-gray-700/80 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center">
                  <Lightning className="w-4 h-4 text-accent-primary/80 mr-2" />
                  <CardTitle className="font-display text-lg text-ink-dark/80 dark:text-gray-100/90 font-medium">Writing Tips</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {writingTips.map((tip, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-4.5 h-4.5 bg-accent-primary/5 dark:bg-accent-primary/10 rounded-full flex items-center justify-center mr-2 flex-shrink-0 text-accent-primary/80 dark:text-gray-200/90 font-serif text-[10px] font-medium">
                        {index + 1}
                      </div>
                      <p className="font-serif text-xs text-ink-light/80 dark:text-gray-400/90">{tip}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 pt-3 border-t border-accent-tertiary/10 dark:border-gray-700/80">
                  <Button 
                    variant="link"
                    className="w-full text-accent-primary/80 dark:text-gray-200/90 text-sm font-serif flex items-center justify-center hover:underline"
                  >
                    View All Tips
                    <ArrowRight className="w-2.5 h-2.5 ml-1 opacity-80" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          
            {/* Pro Features Teaser */}
            <div className="bg-gradient-to-r from-accent-primary/90 to-accent-secondary/90 dark:bg-gray-800 rounded-lg shadow-sm p-4 text-white/95 dark:text-gray-200/95">
              <div className="flex items-center mb-2">
                <Crown className="w-4 h-4 mr-2 opacity-90" />
                <h3 className="font-display text-lg font-medium">Autopen Pro</h3>
              </div>
              
              <p className="font-serif text-xs mb-3 opacity-90 dark:opacity-80">
                Unlock advanced features to take your e-book creation to the next level.
              </p>
              
              <ul className="space-y-1.5 mb-3">
                <li className="flex items-center text-xs font-serif">
                  <div className="w-3 h-3 rounded-full border border-white/80 dark:border-gray-700/80 flex items-center justify-center mr-1.5">
                    <div className="w-1 h-1 bg-white/90 dark:bg-gray-700/90 rounded-full"></div>
                  </div>
                  Premium templates and layouts
                </li>
                <li className="flex items-center text-xs font-serif">
                  <div className="w-3 h-3 rounded-full border border-white/80 dark:border-gray-700/80 flex items-center justify-center mr-1.5">
                    <div className="w-1 h-1 bg-white/90 dark:bg-gray-700/90 rounded-full"></div>
                  </div>
                  Advanced AI writing assistance
                </li>
                <li className="flex items-center text-xs font-serif">
                  <div className="w-3 h-3 rounded-full border border-white/80 dark:border-gray-700/80 flex items-center justify-center mr-1.5">
                    <div className="w-1 h-1 bg-white/90 dark:bg-gray-700/90 rounded-full"></div>
                  </div>
                  Export to multiple formats
                </li>
              </ul>
              
              <Button 
                className="w-full py-1.5 bg-white/95 dark:bg-gray-200/95 text-accent-primary/90 dark:text-gray-900/90 font-serif rounded hover:bg-opacity-90 dark:hover:bg-opacity-80 transition-colors text-xs shadow-sm"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;