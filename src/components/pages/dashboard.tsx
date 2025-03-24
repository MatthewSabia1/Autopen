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
      <div className="space-y-8 animate-fade-in">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-ink-dark dark:text-gray-100 mb-2">
              Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ' Back'}!
            </h2>
            <p className="font-serif text-ink-light dark:text-gray-400">Continue working on your e-book products</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Button 
              onClick={() => handleNavigate('/settings')}
              variant="outline" 
              className="px-5 py-2 font-serif text-accent-primary border border-accent-primary/30 hover:bg-accent-primary/5 flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button 
              onClick={() => handleNavigate('/brain-dump')}
              className="px-5 py-2 font-serif bg-accent-primary text-white rounded flex items-center hover:bg-accent-primary/90 transition-colors"
            >
              <PenTool className="w-4 h-4 mr-2" />
              New Brain Dump
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-paper dark:bg-gray-800 p-4 border border-accent-tertiary/20 dark:border-gray-700 shadow-textera">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent-secondary/10 dark:bg-accent-secondary/20 rounded-full flex items-center justify-center mr-3">
                  <Award className="w-5 h-5 text-accent-secondary" />
                </div>
                <div>
                  <p className="text-ink-light dark:text-gray-400 text-sm font-serif">Completed Products</p>
                  <p className="text-ink-dark dark:text-gray-100 text-xl font-display">{dashboardStats.completedProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-paper dark:bg-gray-800 p-4 border border-accent-tertiary/20 dark:border-gray-700 shadow-textera">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center mr-3">
                  <BookText className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <p className="text-ink-light dark:text-gray-400 text-sm font-serif">Draft Products</p>
                  <p className="text-ink-dark dark:text-gray-100 text-xl font-display">{dashboardStats.draftProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-paper dark:bg-gray-800 p-4 border border-accent-tertiary/20 dark:border-gray-700 shadow-textera">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent-tertiary/20 dark:bg-accent-tertiary/30 rounded-full flex items-center justify-center mr-3">
                  <FileText className="w-5 h-5 text-accent-tertiary" />
                </div>
                <div>
                  <p className="text-ink-light dark:text-gray-400 text-sm font-serif">Words Written</p>
                  <p className="text-ink-dark dark:text-gray-100 text-xl font-display">{dashboardStats.wordsWritten.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-paper dark:bg-gray-800 p-4 border border-accent-tertiary/20 dark:border-gray-700 shadow-textera">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center mr-3">
                  <Sparkles className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <p className="text-ink-light dark:text-gray-400 text-sm font-serif">AI Credits</p>
                  <p className="text-ink-dark dark:text-gray-100 text-xl font-display">{dashboardStats.aiCredits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Left column - Now starting with Quick Actions followed by Recent Products */}
          <div className="lg:col-span-2">
            {/* Quick Actions - Now first */}
            <Card className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-textera mb-6">
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-accent-secondary mr-2" />
                  <CardTitle className="font-display text-xl text-ink-dark dark:text-gray-100">Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleNavigate('/brain-dump')}
                    variant="outline"
                    className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 hover:shadow-textera transition-shadow flex items-start justify-start h-auto"
                  >
                    <div className="w-8 h-8 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-primary/20 dark:group-hover:bg-accent-primary/30 transition-colors">
                      <PenTool className="w-4 h-4 text-accent-primary" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100 group-hover:text-accent-primary transition-colors">Brain Dump</h4>
                      <p className="font-serif text-xs text-ink-light dark:text-gray-400 mt-1">
                        Transform your ideas into organized content
                      </p>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => handleNavigate('/creator')}
                    variant="outline"
                    className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 hover:shadow-textera transition-shadow flex items-start justify-start h-auto"
                  >
                    <div className="w-8 h-8 bg-accent-secondary/10 dark:bg-accent-secondary/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-secondary/20 dark:group-hover:bg-accent-secondary/30 transition-colors">
                      <Wand2 className="w-4 h-4 text-accent-secondary" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100 group-hover:text-accent-secondary transition-colors">AI Creator</h4>
                      <p className="font-serif text-xs text-ink-light dark:text-gray-400 mt-1">
                        Generate complete content with AI
                      </p>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => handleNavigate('/products')}
                    variant="outline"
                    className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 hover:shadow-textera transition-shadow flex items-start justify-start h-auto"
                  >
                    <div className="w-8 h-8 bg-accent-tertiary/20 dark:bg-accent-tertiary/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-tertiary/30 dark:group-hover:bg-accent-tertiary/40 transition-colors">
                      <BookText className="w-4 h-4 text-accent-tertiary" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100 group-hover:text-accent-tertiary transition-colors">All Products</h4>
                      <p className="font-serif text-xs text-ink-light dark:text-gray-400 mt-1">
                        View and manage all your e-books
                      </p>
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={() => handleNavigate('/settings')}
                    variant="outline"
                    className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 hover:shadow-textera transition-shadow flex items-start justify-start h-auto"
                  >
                    <div className="w-8 h-8 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-primary/20 dark:group-hover:bg-accent-primary/30 transition-colors">
                      <Settings className="w-4 h-4 text-accent-primary" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100 group-hover:text-accent-primary transition-colors">Settings</h4>
                      <p className="font-serif text-xs text-ink-light dark:text-gray-400 mt-1">
                        Customize your account preferences
                      </p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Products */}
            <Card className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-textera mb-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-accent-primary mr-2" />
                    <CardTitle className="font-display text-xl text-ink-dark dark:text-gray-100">Recent Products</CardTitle>
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
              <CardContent>
                {recentProducts.length > 0 ? (
                  <div className="space-y-4">
                    {recentProducts.map(product => (
                      <div 
                        key={product.id} 
                        className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md hover:shadow-textera-md transition-shadow cursor-pointer"
                        onClick={() => handleNavigate(`/products/${product.id}`)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100">{product.title}</h4>
                            <div className="flex items-center mt-1">
                              <Badge variant="outline" className="text-xs font-serif bg-accent-secondary/10 dark:bg-accent-secondary/20 text-accent-secondary dark:text-gray-400 mr-2">
                                {product.category}
                              </Badge>
                              <span className="text-xs font-serif text-ink-faded dark:text-gray-500">
                                Updated {product.date}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-accent-tertiary dark:text-gray-400" />
                        </div>
                        <div className="w-full bg-cream dark:bg-gray-700 rounded-full h-2 mt-3 mb-2">
                          <Progress value={product.progress} className="h-2 bg-accent-primary dark:bg-gray-200" />
                        </div>
                        <div className="flex justify-between text-xs font-serif">
                          <span className="text-ink-light dark:text-gray-400">Progress</span>
                          <span className="text-accent-primary dark:text-gray-200">{product.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookText className="w-12 h-12 text-accent-tertiary/40 dark:text-gray-400 mx-auto mb-3" />
                    <p className="font-serif text-ink-light dark:text-gray-400 mb-4">You haven't created any products yet</p>
                    <Button 
                      onClick={() => handleNavigate('/products')}
                      className="px-4 py-2 font-serif text-sm bg-accent-primary dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-accent-primary/90 dark:hover:bg-gray-300"
                    >
                      Create Your First Product
                    </Button>
                  </div>
                )}
                
                {recentProducts.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-accent-tertiary/20 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-3">
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
            <Card className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-textera mb-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Brain className="w-5 h-5 text-accent-secondary mr-2" />
                    <CardTitle className="font-display text-xl text-ink-dark dark:text-gray-100">Recent Brain Dumps</CardTitle>
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
              <CardContent>
                {brainDumps.length > 0 ? (
                  <div className="space-y-4">
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
                          className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md hover:shadow-textera-md transition-shadow cursor-pointer"
                          onClick={() => handleNavigate(`/brain-dump/${dump.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100">{dump.title}</h4>
                              <div className="flex items-center mt-1">
                                <span className="text-xs font-serif text-ink-faded dark:text-gray-500">
                                  Created {formattedDate}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-accent-tertiary dark:text-gray-400" />
                          </div>
                          {summary && (
                            <p className="mt-3 font-serif text-sm text-ink-light dark:text-gray-400 line-clamp-2">
                              {summary}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-accent-tertiary/40 dark:text-gray-400 mx-auto mb-3" />
                    <p className="font-serif text-ink-light dark:text-gray-400 mb-4">You haven't created any brain dumps yet</p>
                    <Button 
                      onClick={() => handleNavigate('/brain-dump')}
                      className="px-4 py-2 font-serif text-sm bg-accent-primary dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-accent-primary/90 dark:hover:bg-gray-300 transition-colors"
                    >
                      Create Your First Brain Dump
                    </Button>
                  </div>
                )}
                
                {brainDumps.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-accent-tertiary/20 dark:border-gray-700">
                    <Button 
                      onClick={() => handleNavigate('/brain-dump')}
                      variant="outline"
                      className="w-full px-3 py-2 text-sm font-serif bg-accent-secondary/10 dark:bg-accent-secondary/20 text-accent-secondary dark:text-accent-secondary/90 border border-accent-secondary/20 dark:border-accent-secondary/30 rounded hover:bg-accent-secondary/20 dark:hover:bg-accent-secondary/30 transition-colors flex items-center justify-center"
                    >
                      <Brain className="w-4 h-4 mr-1.5" />
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
            <Card className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-textera">
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <Layers className="w-5 h-5 text-accent-secondary mr-2" />
                  <CardTitle className="font-display text-xl text-ink-dark dark:text-gray-100">Product Templates</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates.map(template => (
                    <div 
                      key={template.id}
                      className={`p-4 border ${activeTemplate === template.id ? 'border-accent-primary bg-accent-primary/5' : 'border-accent-tertiary/20 dark:border-gray-700'} rounded-md cursor-pointer transition-all`}
                      onClick={() => setActiveTemplate(activeTemplate === template.id ? null : template.id)}
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100">{template.name}</h4>
                        <ChevronRight className={`w-4 h-4 text-accent-primary dark:text-gray-200 transition-transform ${activeTemplate === template.id ? 'rotate-90' : ''}`} />
                      </div>
                      
                      <p className="font-serif text-xs text-ink-light dark:text-gray-400 mt-1 mb-2">
                        {template.description}
                      </p>
                      
                      {activeTemplate === template.id && (
                        <div className="mt-3 pt-3 border-t border-accent-tertiary/20 dark:border-gray-700">
                          <ul className="space-y-1 mb-3">
                            {template.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start text-xs font-serif text-ink-light dark:text-gray-400">
                                <div className="w-3 h-3 rounded-full border border-white dark:border-gray-700 flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">
                                  <div className="w-1.5 h-1.5 bg-white dark:bg-gray-700 rounded-full"></div>
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
            <Card className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-textera">
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  <Lightning className="w-5 h-5 text-accent-primary mr-2" />
                  <CardTitle className="font-display text-xl text-ink-dark dark:text-gray-100">Writing Tips</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {writingTips.map((tip, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-6 h-6 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-accent-primary dark:text-gray-200 font-serif text-xs font-semibold">
                        {index + 1}
                      </div>
                      <p className="font-serif text-sm text-ink-light dark:text-gray-400">{tip}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-accent-tertiary/20 dark:border-gray-700">
                  <Button 
                    variant="link"
                    className="w-full text-accent-primary dark:text-gray-200 text-sm font-serif flex items-center justify-center hover:underline"
                  >
                    View All Tips
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          
            {/* Pro Features Teaser */}
            <div className="bg-gradient-to-r from-accent-primary to-accent-secondary dark:bg-gray-800 rounded-lg shadow-textera-md p-6 text-white dark:text-gray-200">
              <div className="flex items-center mb-3">
                <Crown className="w-5 h-5 mr-2" />
                <h3 className="font-display text-xl">Textera Pro</h3>
              </div>
              
              <p className="font-serif text-sm mb-4 opacity-90 dark:opacity-80">
                Unlock advanced features to take your e-book creation to the next level.
              </p>
              
              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-sm font-serif">
                  <div className="w-4 h-4 rounded-full border border-white dark:border-gray-700 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 bg-white dark:bg-gray-700 rounded-full"></div>
                  </div>
                  Premium templates and layouts
                </li>
                <li className="flex items-center text-sm font-serif">
                  <div className="w-4 h-4 rounded-full border border-white dark:border-gray-700 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 bg-white dark:bg-gray-700 rounded-full"></div>
                  </div>
                  Advanced AI writing assistance
                </li>
                <li className="flex items-center text-sm font-serif">
                  <div className="w-4 h-4 rounded-full border border-white dark:border-gray-700 flex items-center justify-center mr-2">
                    <div className="w-2 h-2 bg-white dark:bg-gray-700 rounded-full"></div>
                  </div>
                  Export to multiple formats
                </li>
              </ul>
              
              <Button 
                className="w-full py-2 bg-white dark:bg-gray-200 text-accent-primary dark:text-gray-900 font-serif rounded hover:bg-opacity-90 dark:hover:bg-opacity-80 transition-colors text-sm"
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
