import React, { useState, useEffect, useRef } from "react";
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
import { useTheme } from "@/lib/contexts/ThemeContext";

const Dashboard = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { products, isLoading, error, refreshProducts } = useProducts();
  const [forceUpdate, setForceUpdate] = useState(0);
  const productsRef = useRef(products);
  
  // Sync products with ref for more reliable access
  useEffect(() => {
    if (products && products.length > 0 && JSON.stringify(productsRef.current) !== JSON.stringify(products)) {
      console.log('Dashboard: Products changed, count:', products.length);
      productsRef.current = products;
      setForceUpdate(prev => prev + 1);
    }
  }, [products]);
  
  // Load products when component mounts
  useEffect(() => {
    console.log('Dashboard: Component mounted, refreshing products...');
    refreshProducts().then(freshProducts => {
      console.log('Dashboard: Products refreshed, count:', freshProducts?.length || 0);
      if (freshProducts && freshProducts.length > 0) {
        productsRef.current = freshProducts;
        setForceUpdate(prev => prev + 1);
      }
    });
  }, []);
  
  // Mock data for dashboard stats
  const dashboardStats = {
    completedProducts: 5,
    draftProducts: 7,
    wordsWritten: 24350
  };

  // Get recent products from the real data
  const getRecentProducts = (): Product[] => {
    const currentProducts = productsRef.current || [];
    if (!currentProducts || currentProducts.length === 0) return [];
    
    // Sort by updated_at (newest first) and take the first 3
    return [...currentProducts]
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

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    // Map the status to normalized status names
    let normalizedStatus = status;
    if (status === "in_progress") normalizedStatus = "inProgress";
    if (status === "pending") normalizedStatus = "inProgress";
    if (status === "processing") normalizedStatus = "generating";
    
    // Define status variants with consistent styling
    const variants = {
      draft: { 
        bg: "bg-[#F9F7F4] dark:bg-[#888888]/20", 
        text: "text-[#888888] dark:text-[#AAAAAA]",
        border: "border-[#E8E8E8] dark:border-[#888888]/40",
        dot: "bg-[#888888] dark:bg-[#AAAAAA]",
        label: "Draft"
      },
      complete: { 
        bg: "bg-[#F1F8F4] dark:bg-[#10B981]/20", 
        text: "text-[#10B981] dark:text-[#10B981]",
        border: "border-[#D1E9D8] dark:border-[#10B981]/40",
        dot: "bg-[#10B981] dark:bg-[#10B981]",
        label: "Complete"
      },
      inProgress: { 
        bg: "bg-[#738996]/10 dark:bg-accent-primary/25", 
        text: "text-[#738996] dark:text-accent-primary",
        border: "border-[#738996]/20 dark:border-accent-primary/50",
        dot: "bg-[#738996] dark:bg-accent-primary",
        label: "In Progress"
      },
      published: { 
        bg: "bg-[#ccb595]/10 dark:bg-accent-yellow/25", 
        text: "text-[#ccb595] dark:text-accent-yellow",
        border: "border-[#ccb595]/20 dark:border-accent-yellow/50",
        dot: "bg-[#ccb595] dark:bg-accent-yellow",
        label: "Published"
      },
      generating: { 
        bg: "bg-[#8B5CF6]/10 dark:bg-[#8B5CF6]/25", 
        text: "text-[#8B5CF6] dark:text-[#A78BFA]",
        border: "border-[#8B5CF6]/20 dark:border-[#8B5CF6]/50",
        dot: "bg-[#8B5CF6] dark:bg-[#A78BFA]",
        label: "Generating"
      }
    };
    
    // Get the variant or default to draft
    const variant = variants[normalizedStatus as keyof typeof variants] || variants.draft;
    
    // For processing/pending states, use the appropriate label
    let statusLabel = variant.label;
    if (status === "pending") statusLabel = "Pending";
    if (status === "processing") statusLabel = "Processing";
    
    return (
      <div className="flex items-center">
        <div className={`inline-flex items-center px-1.5 py-0.5 rounded ${variant.bg} ${variant.text} text-[10px] font-serif ${variant.border} border`}>
          <div className={`mr-1 h-1 w-1 rounded-full ${variant.dot} animate-pulse`}></div>
          <span>{statusLabel}</span>
        </div>
      </div>
    );
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

  // For debugging
  const recentProducts = getRecentProducts();
  console.log('Dashboard render:', {
    productsCount: productsRef.current?.length || 0,
    recentProductsCount: recentProducts.length,
    isLoading,
    forceUpdate
  });

  return (
    <DashboardLayout activeTab="Dashboard">
      <div className="w-full mx-auto space-y-6 sm:space-y-8 md:space-y-12 bg-cream dark:bg-background p-3 xs:p-4 sm:p-6 md:p-8">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl font-display font-medium text-ink-dark dark:text-ink-dark tracking-tight">
              Welcome Back!
            </h2>
            <p className="text-sm sm:text-base font-serif text-ink-light dark:text-ink-light opacity-80 dark:opacity-90">Continue working on your e-book products</p>
          </div>
          <div className="flex items-center space-x-3 mt-3 md:mt-0">
            <Button 
              onClick={() => handleNavigate('/settings')}
              variant="outline" 
              className="border-accent-tertiary/30 text-ink-dark dark:text-ink-dark hover:border-accent-primary/30 dark:hover:border-accent-primary/70 h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
            >
              <Settings className="w-4 h-4 mr-1.5 sm:mr-2" />
              Settings
            </Button>
            <Button 
              onClick={() => handleNavigate('/creator')}
              className="bg-accent-primary text-white hover:bg-accent-secondary dark:bg-accent-primary dark:hover:bg-accent-secondary shadow-blue-sm dark:shadow-md hover:shadow-blue dark:hover:shadow-lg h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
            >
              <Sparkles className="w-4 h-4 mr-1.5 sm:mr-2" />
              Create Content
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card variant="stat" className="overflow-hidden group hover:border-accent-yellow/50 hover:shadow-yellow-sm dark:hover:shadow-md transition-all duration-300 transform hover:scale-102 border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-white dark:bg-card">
            <CardContent className="p-0">
              <div className="flex flex-col p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <p className="text-ink-light dark:text-ink-light font-medium uppercase tracking-wide text-[10px] sm:text-[11px]">COMPLETED PRODUCTS</p>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-tertiary/40 dark:bg-accent-tertiary/30 rounded-full flex items-center justify-center group-hover:bg-accent-yellow/10 dark:group-hover:bg-accent-yellow/20 transition-colors duration-300">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-accent-yellow dark:text-accent-yellow group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <p className="text-ink-dark dark:text-ink-dark text-2xl sm:text-3xl md:text-4xl font-serif font-medium">{dashboardStats.completedProducts}</p>
                  <div className="text-[10px] sm:text-[11px] text-accent-yellow dark:text-accent-yellow font-medium px-1.5 py-0.5 bg-accent-yellow/10 dark:bg-accent-yellow/20 rounded-sm flex items-center">
                    <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                    2 this month
                  </div>
                </div>
              </div>
              <div className="h-1 w-full bg-accent-yellow/10 dark:bg-accent-yellow/20">
                <div className="h-1 bg-accent-yellow dark:bg-accent-yellow w-1/3 transition-all duration-1000"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="stat" className="overflow-hidden group hover:border-accent-primary/50 hover:shadow-blue-sm dark:hover:shadow-md transition-all duration-300 transform hover:scale-102 border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-white dark:bg-card">
            <CardContent className="p-0">
              <div className="flex flex-col p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <p className="text-ink-light dark:text-ink-light font-medium uppercase tracking-wide text-[10px] sm:text-[11px]">DRAFT PRODUCTS</p>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-tertiary/40 dark:bg-accent-tertiary/30 rounded-full flex items-center justify-center group-hover:bg-accent-primary/10 dark:group-hover:bg-accent-primary/30 transition-colors duration-300">
                    <BookText className="w-4 h-4 sm:w-5 sm:h-5 text-accent-primary dark:text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <p className="text-ink-dark dark:text-ink-dark text-2xl sm:text-3xl md:text-4xl font-serif font-medium">{dashboardStats.draftProducts}</p>
                  <div className="text-[10px] sm:text-[11px] text-accent-primary dark:text-accent-primary font-medium px-1.5 py-0.5 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-sm">
                    In progress
                  </div>
                </div>
              </div>
              <div className="h-1 w-full bg-accent-primary/10 dark:bg-accent-primary/20">
                <div className="h-1 bg-accent-primary dark:bg-accent-primary w-2/3 transition-all duration-1000"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="stat" className="col-span-1 xs:col-span-2 md:col-span-1 overflow-hidden group hover:border-accent-yellow/50 hover:shadow-yellow-sm dark:hover:shadow-md transition-all duration-300 transform hover:scale-102 border border-[#E8E8E8] dark:border-accent-tertiary/50 bg-white dark:bg-card">
            <CardContent className="p-0">
              <div className="flex flex-col p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <p className="text-ink-light dark:text-ink-light font-medium uppercase tracking-wide text-[10px] sm:text-[11px]">WORDS WRITTEN</p>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-tertiary/40 dark:bg-accent-tertiary/20 rounded-full flex items-center justify-center group-hover:bg-accent-yellow/10 dark:group-hover:bg-accent-yellow/20 transition-colors duration-300">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-accent-yellow group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <p className="text-ink-dark dark:text-ink-dark text-2xl sm:text-3xl md:text-4xl font-serif font-medium">{dashboardStats.wordsWritten.toLocaleString()}</p>
                  <div className="text-[10px] sm:text-[11px] text-accent-yellow font-medium px-1.5 py-0.5 bg-accent-yellow/10 dark:bg-accent-yellow/20 rounded-sm flex items-center">
                    <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                    3.2k this week
                  </div>
                </div>
              </div>
              <div className="h-1 w-full bg-accent-yellow/10 dark:bg-accent-yellow/20">
                <div className="h-1 bg-accent-yellow dark:bg-accent-yellow w-4/5 transition-all duration-1000"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Left column with Quick Actions and Recent Products */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-10">
            {/* Quick Actions */}
            <Card className="overflow-hidden bg-white dark:bg-card shadow-sm dark:shadow-lg border border-[#E8E8E8] dark:border-accent-tertiary/40">
              <CardHeader className="pb-3 pt-4 sm:pb-4 sm:pt-6 px-4 sm:px-6 border-b border-[#F0F0F0] dark:border-accent-tertiary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <PenTool className="w-4 h-4 sm:w-5 sm:h-5 text-accent-yellow dark:text-accent-yellow mr-2" />
                    <CardTitle className="text-base sm:text-lg font-medium font-serif text-[#333333] dark:text-ink-dark">Quick Actions</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-3 py-3 sm:px-5 sm:py-4">
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                  <Card 
                    variant="action"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleNavigate('/brain-dump'); } }}
                    className="transform transition-transform duration-300 hover:scale-102 bg-white dark:bg-card/80 border-[#E8E8E8] dark:border-accent-tertiary/40 shadow-none dark:shadow-none hover:shadow-sm dark:hover:shadow-md"
                    onClick={() => handleNavigate('/brain-dump')}
                  >
                    <CardContent className="p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-center relative z-10">
                        <div className="w-8 h-8 bg-accent-tertiary/40 dark:bg-accent-tertiary/20 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0 group-hover:bg-white dark:group-hover:bg-accent-tertiary/40 transition-colors duration-300">
                          <PenTool className="w-4 h-4 text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-ink-dark dark:text-ink-dark font-medium text-sm sm:text-base leading-tight">Brain Dump</h4>
                          <p className="text-ink-light dark:text-ink-light text-xs mt-0.5 line-clamp-2">
                            Transform your ideas into organized content
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    variant="action"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleNavigate('/creator'); } }}
                    className="transform transition-transform duration-300 hover:scale-102 bg-white dark:bg-card/80 border-[#E8E8E8] dark:border-accent-tertiary/40 shadow-none dark:shadow-none hover:shadow-sm dark:hover:shadow-md"
                    onClick={() => handleNavigate('/creator')}
                  >
                    <CardContent className="p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-center relative z-10">
                        <div className="w-8 h-8 bg-accent-tertiary/40 dark:bg-accent-tertiary/20 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0 group-hover:bg-white dark:group-hover:bg-accent-tertiary/40 transition-colors duration-300">
                          <Wand2 className="w-4 h-4 text-accent-yellow group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-ink-dark dark:text-ink-dark font-medium text-sm sm:text-base leading-tight">AI Creator</h4>
                          <p className="text-ink-light dark:text-ink-light text-xs mt-0.5 line-clamp-2">
                            Generate complete content with AI
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    variant="action"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleNavigate('/products'); } }}
                    className="transform transition-transform duration-300 hover:scale-102 bg-white dark:bg-card/80 border-[#E8E8E8] dark:border-accent-tertiary/40 shadow-none dark:shadow-none hover:shadow-sm dark:hover:shadow-md"
                    onClick={() => handleNavigate('/products')}
                  >
                    <CardContent className="p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-center relative z-10">
                        <div className="w-8 h-8 bg-accent-tertiary/40 dark:bg-accent-tertiary/20 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0 group-hover:bg-white dark:group-hover:bg-accent-tertiary/40 transition-colors duration-300">
                          <BookText className="w-4 h-4 text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-ink-dark dark:text-ink-dark font-medium text-sm sm:text-base leading-tight">All Products</h4>
                          <p className="text-ink-light dark:text-ink-light text-xs mt-0.5 line-clamp-2">
                            View and manage all your e-books
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    variant="action"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleNavigate('/settings'); } }}
                    className="transform transition-transform duration-300 hover:scale-102 bg-white dark:bg-card/80 border-[#E8E8E8] dark:border-accent-tertiary/40 shadow-none dark:shadow-none hover:shadow-sm dark:hover:shadow-md"
                    onClick={() => handleNavigate('/settings')}
                  >
                    <CardContent className="p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-center relative z-10">
                        <div className="w-8 h-8 bg-accent-tertiary/40 dark:bg-accent-tertiary/20 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0 group-hover:bg-white dark:group-hover:bg-accent-tertiary/40 transition-colors duration-300">
                          <Settings className="w-4 h-4 text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-ink-dark dark:text-ink-dark font-medium text-sm sm:text-base leading-tight">Settings</h4>
                          <p className="text-ink-light dark:text-ink-light text-xs mt-0.5 line-clamp-2">
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
            <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-white dark:bg-card shadow-sm dark:shadow-lg rounded-lg overflow-hidden hover:shadow-md dark:hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2 pt-4 sm:pb-3 sm:pt-5 px-4 sm:px-6 border-b border-[#F0F0F0] dark:border-accent-tertiary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#738996] dark:text-accent-primary mr-2" />
                    <CardTitle className="text-base sm:text-lg font-medium font-serif text-[#333333] dark:text-ink-dark">Recent Products</CardTitle>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button 
                      onClick={() => refreshProducts()}
                      variant="ghost"
                      size="sm"
                      className="text-[#738996] dark:text-accent-primary/90 text-xs flex items-center hover:text-[#738996]/80 dark:hover:text-accent-primary font-medium transition-colors px-1 sm:px-2 h-8"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-0.5 sm:mr-1" />
                      Refresh
                    </Button>
                    <Button 
                      onClick={() => handleNavigate('/products')}
                      variant="link"
                      className="text-[#738996] dark:text-accent-primary/90 text-xs sm:text-sm flex items-center hover:text-[#738996]/80 dark:hover:text-accent-primary font-medium transition-colors"
                    >
                      View All
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 sm:ml-1" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 py-4 sm:px-6 sm:py-6">
                {error && (
                  <div className="p-3 sm:p-4 border border-red-200 dark:border-red-800/60 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 mb-4">
                    <p className="text-sm font-medium mb-1">Error loading products</p>
                    <p className="text-xs">{error}</p>
                    <Button 
                      onClick={() => refreshProducts()} 
                      size="sm"
                      className="bg-red-700 dark:bg-red-700/90 text-white hover:bg-red-800 dark:hover:bg-red-600 mt-2"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                )}
                
                {isLoading ? (
                  <div className="py-8 sm:py-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#738996] dark:text-accent-primary animate-spin mb-3 sm:mb-4" />
                    <p className="text-[#666666] dark:text-ink-light text-sm font-medium">Loading your products...</p>
                  </div>
                ) : recentProducts.length === 0 ? (
                  <div className="py-8 sm:py-12 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F5F5F5] dark:bg-accent-tertiary/20 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                      <BookText className="w-8 h-8 sm:w-10 sm:h-10 text-[#CCCCCC] dark:text-accent-tertiary/70" />
                    </div>
                    <p className="text-[#666666] dark:text-ink-light text-center text-xs sm:text-sm max-w-sm">No products found. Get started by creating your first content!</p>
                    <Button 
                      onClick={() => handleNavigate('/creator')}
                      className="mt-4 sm:mt-6 bg-[#738996] dark:bg-accent-primary text-white px-4 sm:px-6 h-9 text-xs sm:text-sm shadow-sm dark:shadow-md hover:shadow-md dark:hover:shadow-lg"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Create Product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-5">
                    {recentProducts.map(product => (
                      <Card 
                        key={product.id}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { navigate(`/products/${product.id}`); } }}
                        className="border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-white dark:bg-card hover:border-[#738996]/30 dark:hover:border-accent-primary/50 transition-all cursor-pointer shadow-none dark:shadow-sm hover:shadow-sm dark:hover:shadow-md rounded-lg overflow-hidden group transform transition-transform duration-300 hover:scale-102"
                        onClick={() => {
                          console.log("Dashboard: navigating to product:", product.id);
                          navigate(`/products/${product.id}`);
                        }}
                      >
                        <CardContent className="p-3 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#738996]/5 dark:from-transparent dark:to-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative z-10">
                            <div className="flex justify-between items-center">
                              <div className="flex items-start">
                                <div className="w-8 h-8 rounded-full bg-accent-tertiary/5 dark:bg-accent-tertiary/30 flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-primary/10 dark:group-hover:bg-accent-primary/40 transition-colors duration-300">
                                  {product.type.includes('ebook') && <BookText className="h-4 w-4 text-accent-primary dark:text-accent-primary" />}
                                  {product.type === 'brain_dump' && <FileText className="h-4 w-4 text-accent-tertiary dark:text-accent-tertiary/90" />}
                                  {!product.type.includes('ebook') && product.type !== 'brain_dump' && <PenTool className="h-4 w-4 text-accent-secondary dark:text-accent-secondary" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[#2A2A2A] dark:text-ink-dark font-medium text-sm mb-0.5 truncate pr-4">{product.title}</h4>
                                  <div className="flex items-center flex-wrap gap-2">
                                    <Badge className="bg-[#F9F5ED] dark:bg-accent-yellow/15 text-[#ccb595] dark:text-accent-yellow border-[#ccb595] dark:border-accent-yellow/50 border font-normal px-2 py-0.5 rounded text-xs">
                                      {getProductCategory(product)}
                                    </Badge>
                                    {renderStatusBadge(product.status)}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#666666] dark:text-ink-light/80 group-hover:text-[#738996] dark:group-hover:text-accent-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                            </div>
                            
                            <div className="mt-3 space-y-1.5">
                              <div className="w-full bg-[#E8E8E8] dark:bg-accent-tertiary/40 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-1000 ${
                                    calculateProgress(product) >= 100 
                                      ? 'bg-[#10B981] dark:bg-[#10B981]' 
                                      : calculateProgress(product) > 75
                                        ? 'bg-[#ccb595] dark:bg-accent-yellow'
                                        : 'bg-[#738996] dark:bg-accent-primary'
                                  }`}
                                  style={{ width: `${calculateProgress(product)}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-[#666666] dark:text-ink-light/90 flex items-center">
                                  <Clock className="w-3 h-3 mr-1 opacity-70 dark:opacity-90 dark:text-ink-light/90" />
                                  {formatRelativeDate(product.updated_at)}
                                </span>
                                <span className="text-[#2A2A2A] dark:text-ink-dark font-medium">{calculateProgress(product)}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[#F0F0F0] dark:border-accent-tertiary/30 flex gap-2 sm:gap-4">
                  <Button 
                    onClick={() => handleNavigate('/creator')}
                    className="flex-1 bg-[#ccb595] dark:bg-accent-yellow text-white hover:bg-[#ccb595]/90 dark:hover:bg-accent-yellow/90 font-medium shadow-sm dark:shadow-md hover:shadow-md dark:hover:shadow-lg transition-all duration-300 h-9 text-xs sm:text-sm"
                  >
                    <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    New AI Content
                  </Button>
                  <Button 
                    onClick={() => handleNavigate('/products')}
                    variant="outline"
                    className="flex-1 border-[#E8E8E8] dark:border-accent-tertiary/50 text-[#2A2A2A] dark:text-ink-dark font-medium hover:bg-[#F9F7F4] dark:hover:bg-accent-tertiary/30 transition-colors duration-300 h-9 text-xs sm:text-sm"
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    New Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right sidebar column */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6 md:space-y-10">
            {/* Product Templates */}
            <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-white dark:bg-card shadow-sm dark:shadow-lg rounded-lg overflow-hidden hover:shadow-md dark:hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3 pt-4 sm:pb-4 sm:pt-6 px-4 sm:px-6 border-b border-[#F0F0F0] dark:border-accent-tertiary/30">
                <div className="flex items-center">
                  <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[#ccb595] dark:text-accent-yellow mr-2" />
                  <CardTitle className="text-base sm:text-lg font-medium font-serif text-[#333333] dark:text-ink-dark">Product Templates</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 py-3 sm:px-5 sm:py-4">
                <div className="space-y-2 sm:space-y-3">
                  {templates.map(template => (
                    <Card 
                      key={template.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleNavigate(`/creator?template=${template.id}`); } }}
                      className="border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-white dark:bg-card hover:border-[#ccb595]/40 dark:hover:border-accent-yellow/60 transition-all cursor-pointer shadow-none dark:shadow-none hover:shadow-sm dark:hover:shadow-md rounded-lg overflow-hidden group transform transition-transform duration-300 hover:scale-102"
                      onClick={() => handleNavigate(`/creator?template=${template.id}`)}
                    >
                      <CardContent className="p-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#ccb595]/5 dark:from-transparent dark:to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="flex justify-between items-center relative z-10">
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="text-[#2A2A2A] dark:text-ink-dark font-medium text-sm sm:text-base leading-tight">{template.name}</h4>
                            <p className="text-[#666666] dark:text-ink-light text-xs mt-0.5 line-clamp-2">
                              {template.description}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#738996] dark:text-accent-yellow/80 group-hover:text-[#ccb595] dark:group-hover:text-accent-yellow group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          
            {/* Writing Tips */}
            <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-white dark:bg-card shadow-sm dark:shadow-lg rounded-lg overflow-hidden hover:shadow-md dark:hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3 pt-4 sm:pb-4 sm:pt-6 px-4 sm:px-6 border-b border-[#F0F0F0] dark:border-accent-tertiary/30">
                <div className="flex items-center">
                  <CloudLightning className="w-4 h-4 sm:w-5 sm:h-5 text-[#738996] dark:text-accent-primary mr-2" />
                  <CardTitle className="text-base sm:text-lg font-medium font-serif text-[#333333] dark:text-ink-dark">Writing Tips</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 py-4 sm:px-6 sm:py-6">
                <div className="space-y-3 sm:space-y-5">
                  {writingTips.map((tip, index) => (
                    <div key={index} className="flex items-start group cursor-default">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#F5F5F5] dark:bg-accent-tertiary/30 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 text-[#666666] dark:text-ink-light text-xs sm:text-sm font-medium group-hover:bg-[#738996]/10 dark:group-hover:bg-accent-primary/30 group-hover:text-[#738996] dark:group-hover:text-accent-primary transition-colors duration-300">
                        {index + 1}
                      </div>
                      <p className="text-[#666666] dark:text-ink-light text-xs sm:text-sm group-hover:text-[#333333] dark:group-hover:text-ink-dark transition-colors duration-300">{tip}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#F0F0F0] dark:border-accent-tertiary/30">
                  <Button 
                    variant="link"
                    className="w-full text-[#738996] dark:text-accent-primary text-xs sm:text-sm flex items-center justify-center hover:text-[#738996]/80 dark:hover:text-accent-primary/90 font-medium transition-colors"
                  >
                    View All Tips
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
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
