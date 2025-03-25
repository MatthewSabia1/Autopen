import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookText,
  FileText,
  PenTool,
  Plus,
  ChevronRight,
  Settings,
  Clock,
  CloudLightning,
  Wand2,
  Layers,
  ArrowRight,
  Award,
  Sparkles,
  TrendingUp,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { useProducts, Product } from "../../hooks/useProducts";
import { formatDistance } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { products, isLoading, error } = useProducts();
  
  // Mock data for dashboard stats
  const dashboardStats = {
    completedProducts: 5,
    draftProducts: 7,
    wordsWritten: 24350
  };

  // Get recent products from the real data
  const getRecentProducts = (): Product[] => {
    if (!products || products.length === 0) return [];
    
    // Sort by updated_at (newest first) and take the first 3
    return [...products]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3);
  };

  // Format the date to relative time (e.g. "2 days ago")
  const formatRelativeDate = (dateString: string): string => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
    } catch (e) {
      return "Unknown date";
    }
  };

  // Calculate progress based on product status
  const calculateProgress = (product: Product): number => {
    if (product.status === "published") return 100;
    if (product.status === "draft" && product.metadata?.wordCount) {
      // If we have word count, use it as a factor in progress calculation
      const wordCount = product.metadata.wordCount;
      // Assuming 1000 words is about 40% progress, 5000 words is about 80% progress
      if (wordCount >= 5000) return 80;
      if (wordCount >= 1000) return 40 + (wordCount - 1000) / 4000 * 40;
      return Math.min(Math.max(wordCount / 1000 * 40, 10), 40); // At least 10%, at most 40%
    }
    // Default values based on status
    if (product.status === "draft") return 50;
    if (product.status === "in_progress") return 75;
    return 30; // Default progress
  };

  // Get category from product type or metadata
  const getProductCategory = (product: Product): string => {
    if (product.metadata?.category && typeof product.metadata.category === 'string') {
      return product.metadata.category;
    }
    
    if (product.type === "ebook") return "eBook";
    if (product.type === "brain_dump") return "Notes";
    if (product.type === "course") return "Course";
    if (product.type === "blog") return "Blog";
    
    return product.type.charAt(0).toUpperCase() + product.type.slice(1);
  };

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
      description: "Create a structured digital book with chapters and sections"
    },
    {
      id: "course",
      name: "Online Course",
      description: "Educational content organized into modules and lessons"
    },
    {
      id: "blog",
      name: "Blog Collection",
      description: "Compile blog posts into a cohesive publication"
    },
    {
      id: "memoir",
      name: "Memoir/Biography",
      description: "Tell a personal or historical story with timeline features"
    }
  ];

  // Helper function to navigate
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <DashboardLayout activeTab="Dashboard">
      <div className="space-y-8 bg-cream p-8 md:p-10">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-page-title font-display mb-1 text-ink-dark tracking-tight">
              Welcome Back!
            </h2>
            <p className="text-body font-serif text-ink-light">Continue working on your e-book products</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => handleNavigate('/settings')}
              variant="outline" 
              className="border-accent-tertiary/30 text-ink-dark hover:border-accent-primary/30"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button 
              onClick={() => handleNavigate('/creator')}
              className="bg-accent-primary text-white hover:bg-accent-secondary shadow-blue-sm hover:shadow-blue"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Content
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          <Card variant="stat" className="overflow-hidden group hover:border-accent-yellow/50 hover:shadow-yellow-sm transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex flex-col p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-ink-light text-small font-medium">Completed Products</p>
                  <div className="w-10 h-10 bg-accent-tertiary/40 rounded-full flex items-center justify-center group-hover:bg-accent-yellow/10 transition-colors duration-300">
                    <Award className="w-5 h-5 text-accent-yellow group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="flex items-baseline">
                  <p className="text-ink-dark text-3xl font-serif font-medium">{dashboardStats.completedProducts}</p>
                  <div className="ml-2 text-xs text-accent-yellow font-medium px-1.5 py-0.5 bg-accent-yellow/10 rounded flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                    2 this month
                  </div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-accent-yellow/10">
                <div className="h-1.5 bg-accent-yellow w-1/3 rounded-r-full transition-all duration-1000"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="stat" className="overflow-hidden group hover:border-accent-primary/50 hover:shadow-blue-sm transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex flex-col p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-ink-light text-small font-medium">Draft Products</p>
                  <div className="w-10 h-10 bg-accent-tertiary/40 rounded-full flex items-center justify-center group-hover:bg-accent-primary/10 transition-colors duration-300">
                    <BookText className="w-5 h-5 text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="flex items-baseline">
                  <p className="text-ink-dark text-3xl font-serif font-medium">{dashboardStats.draftProducts}</p>
                  <div className="ml-2 text-xs text-accent-primary font-medium px-1.5 py-0.5 bg-accent-primary/10 rounded">
                    In progress
                  </div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-accent-primary/10">
                <div className="h-1.5 bg-accent-primary w-2/3 rounded-r-full transition-all duration-1000"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="stat" className="overflow-hidden group hover:border-accent-yellow/50 hover:shadow-yellow-sm transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex flex-col p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-ink-light text-small font-medium">Words Written</p>
                  <div className="w-10 h-10 bg-accent-tertiary/40 rounded-full flex items-center justify-center group-hover:bg-accent-yellow/10 transition-colors duration-300">
                    <FileText className="w-5 h-5 text-accent-yellow group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="flex items-baseline">
                  <p className="text-ink-dark text-3xl font-serif font-medium">{dashboardStats.wordsWritten.toLocaleString()}</p>
                  <div className="ml-2 text-xs text-accent-yellow font-medium px-1.5 py-0.5 bg-accent-yellow/10 rounded flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                    3.2k this week
                  </div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-accent-yellow/10">
                <div className="h-1.5 bg-accent-yellow w-4/5 rounded-r-full transition-all duration-1000"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {/* Left column with Quick Actions and Recent Products */}
          <div className="lg:col-span-2 space-y-7">
            {/* Quick Actions */}
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center">
                  <PenTool className="w-5 h-5 text-accent-yellow mr-2" />
                  <CardTitle>Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card 
                    variant="action"
                    onClick={() => handleNavigate('/brain-dump')}
                  >
                    <CardContent className="p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-start relative z-10">
                        <div className="w-10 h-10 bg-accent-tertiary/40 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-white transition-colors duration-300">
                          <PenTool className="w-5 h-5 text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div>
                          <h4 className="text-ink-dark font-medium mb-1">Brain Dump</h4>
                          <p className="text-ink-light text-small">
                            Transform your ideas into organized content
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    variant="action"
                    onClick={() => handleNavigate('/creator')}
                  >
                    <CardContent className="p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-start relative z-10">
                        <div className="w-10 h-10 bg-accent-tertiary/40 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-white transition-colors duration-300">
                          <Wand2 className="w-5 h-5 text-accent-yellow group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div>
                          <h4 className="text-ink-dark font-medium mb-1">AI Creator</h4>
                          <p className="text-ink-light text-small">
                            Generate complete content with AI
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    variant="action"
                    onClick={() => handleNavigate('/products')}
                  >
                    <CardContent className="p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-start relative z-10">
                        <div className="w-10 h-10 bg-accent-tertiary/40 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-white transition-colors duration-300">
                          <BookText className="w-5 h-5 text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div>
                          <h4 className="text-ink-dark font-medium mb-1">All Products</h4>
                          <p className="text-ink-light text-small">
                            View and manage all your e-books
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    variant="action"
                    onClick={() => handleNavigate('/settings')}
                  >
                    <CardContent className="p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-start relative z-10">
                        <div className="w-10 h-10 bg-accent-tertiary/40 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-white transition-colors duration-300">
                          <Settings className="w-5 h-5 text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div>
                          <h4 className="text-ink-dark font-medium mb-1">Settings</h4>
                          <p className="text-ink-light text-small">
                            Customize your account preferences
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Products */}
            <Card className="border border-[#E8E8E8] bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-3 pt-5 px-6 border-b border-[#F0F0F0]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-[#738996] mr-2" />
                    <CardTitle className="text-lg font-medium font-serif text-[#333333]">Recent Products</CardTitle>
                  </div>
                  <Button 
                    onClick={() => handleNavigate('/products')}
                    variant="link"
                    className="text-[#738996] text-sm flex items-center hover:text-[#738996]/80 font-medium transition-colors"
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-5">
                {error && (
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700 mb-4">
                    <p className="text-sm font-medium mb-1">Error loading products</p>
                    <p className="text-xs">{error}</p>
                    <Button 
                      onClick={() => window.location.reload()} 
                      size="sm"
                      className="bg-red-700 text-white hover:bg-red-800 mt-2"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                )}
                
                {isLoading ? (
                  <div className="py-10 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#738996] animate-spin mb-3" />
                    <p className="text-[#666666] text-sm">Loading your products...</p>
                  </div>
                ) : getRecentProducts().length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4">
                      <BookText className="w-8 h-8 text-[#CCCCCC]" />
                    </div>
                    <p className="text-[#666666] text-center">No products found. Get started by creating your first content!</p>
                    <Button 
                      onClick={() => handleNavigate('/creator')}
                      className="mt-4 bg-[#738996] text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getRecentProducts().map(product => (
                      <Card 
                        key={product.id} 
                        className="border border-[#E8E8E8] bg-white hover:border-[#738996]/30 transition-all cursor-pointer shadow-none rounded-lg overflow-hidden group"
                        onClick={() => {
                          console.log("Dashboard: navigating to product:", product.id);
                          navigate(`/products/${product.id}`);
                        }}
                      >
                        <CardContent className="p-4 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#738996]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="text-[#2A2A2A] font-medium mb-1">{product.title}</h4>
                                <div className="flex items-center">
                                  <Badge className="bg-[#F9F5ED] text-[#ccb595] border-[#ccb595] border mr-2 font-normal px-2 py-0.5 rounded text-xs">
                                    {getProductCategory(product)}
                                  </Badge>
                                  <span className="text-xs text-[#666666]">
                                    Updated {formatRelativeDate(product.updated_at)}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#666666] group-hover:text-[#738996] group-hover:translate-x-1 transition-all duration-300" />
                            </div>
                            <div className="w-full bg-[#E8E8E8] rounded-full h-1.5 mb-1">
                              <div className="bg-[#738996] h-1.5 rounded-full transition-all duration-1000" style={{ width: `${calculateProgress(product)}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-[#666666]">Progress</span>
                              <span className="text-[#2A2A2A] font-medium">{calculateProgress(product)}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-[#F0F0F0] flex gap-4">
                  <Button 
                    onClick={() => handleNavigate('/creator')}
                    className="flex-1 bg-[#ccb595] text-white hover:bg-[#ccb595]/90 font-medium shadow-sm hover:shadow transition-all duration-300"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    New AI Content
                  </Button>
                  <Button 
                    onClick={() => handleNavigate('/products')}
                    variant="outline"
                    className="flex-1 border-[#E8E8E8] text-[#2A2A2A] font-medium hover:bg-[#F9F7F4] transition-colors duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right sidebar column */}
          <div className="lg:col-span-1 space-y-7">
            {/* Product Templates */}
            <Card className="border border-[#E8E8E8] bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-3 pt-5 px-6 border-b border-[#F0F0F0]">
                <div className="flex items-center">
                  <Layers className="w-5 h-5 text-[#ccb595] mr-2" />
                  <CardTitle className="text-lg font-medium font-serif text-[#333333]">Product Templates</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-5">
                <div className="space-y-3">
                  {templates.map(template => (
                    <Card 
                      key={template.id}
                      className="border border-[#E8E8E8] bg-white hover:border-[#ccb595]/40 transition-all cursor-pointer shadow-none rounded-lg overflow-hidden group"
                      onClick={() => handleNavigate(`/creator?template=${template.id}`)}
                    >
                      <CardContent className="p-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#ccb595]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="flex justify-between items-start relative z-10">
                          <div>
                            <h4 className="text-[#2A2A2A] font-medium mb-1">{template.name}</h4>
                            <p className="text-[#666666] text-sm">
                              {template.description}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#738996] group-hover:text-[#ccb595] group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          
            {/* Writing Tips */}
            <Card className="border border-[#E8E8E8] bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-3 pt-5 px-6 border-b border-[#F0F0F0]">
                <div className="flex items-center">
                  <CloudLightning className="w-5 h-5 text-[#738996] mr-2" />
                  <CardTitle className="text-lg font-medium font-serif text-[#333333]">Writing Tips</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-5">
                <div className="space-y-4">
                  {writingTips.map((tip, index) => (
                    <div key={index} className="flex items-start group cursor-default">
                      <div className="w-6 h-6 bg-[#F5F5F5] rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-[#666666] text-sm group-hover:bg-[#738996]/10 group-hover:text-[#738996] transition-colors duration-300">
                        {index + 1}
                      </div>
                      <p className="text-[#666666] text-sm group-hover:text-[#333333] transition-colors duration-300">{tip}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-[#F0F0F0]">
                  <Button 
                    variant="link"
                    className="w-full text-[#738996] text-sm flex items-center justify-center hover:text-[#738996]/80 font-medium transition-colors"
                  >
                    View All Tips
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
