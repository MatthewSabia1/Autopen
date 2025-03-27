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

const Dashboard = () => {
  const { user } = useAuth();
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
        bg: "bg-[#F9F7F4]", 
        text: "text-[#888888]",
        border: "border-[#E8E8E8]",
        dot: "bg-[#888888]",
        label: "Draft"
      },
      complete: { 
        bg: "bg-[#F1F8F4]", 
        text: "text-[#10B981]",
        border: "border-[#D1E9D8]",
        dot: "bg-[#10B981]",
        label: "Complete"
      },
      inProgress: { 
        bg: "bg-[#738996]/10", 
        text: "text-[#738996]",
        border: "border-[#738996]/20",
        dot: "bg-[#738996]",
        label: "In Progress"
      },
      published: { 
        bg: "bg-[#ccb595]/10", 
        text: "text-[#ccb595]",
        border: "border-[#ccb595]/20",
        dot: "bg-[#ccb595]",
        label: "Published"
      },
      generating: { 
        bg: "bg-[#8B5CF6]/10", 
        text: "text-[#8B5CF6]",
        border: "border-[#8B5CF6]/20",
        dot: "bg-[#8B5CF6]",
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
      <div className="max-w-7xl mx-auto space-y-12 bg-cream p-8 md:p-10">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-medium text-ink-dark tracking-tight">
              Welcome Back!
            </h2>
            <p className="text-body font-serif text-ink-light opacity-80">Continue working on your e-book products</p>
          </div>
          <div className="flex items-center space-x-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card variant="stat" className="overflow-hidden group hover:border-accent-yellow/50 hover:shadow-yellow-sm transition-all duration-300 transform hover:scale-102 border border-[#E8E8E8]">
            <CardContent className="p-0">
              <div className="flex flex-col p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-ink-light font-medium uppercase tracking-wide text-[11px]">Completed Products</p>
                  <div className="w-10 h-10 bg-accent-tertiary/40 rounded-full flex items-center justify-center group-hover:bg-accent-yellow/10 transition-colors duration-300">
                    <Award className="w-5 h-5 text-accent-yellow group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <p className="text-ink-dark text-4xl font-serif font-medium">{dashboardStats.completedProducts}</p>
                  <div className="text-[11px] text-accent-yellow font-medium px-1.5 py-0.5 bg-accent-yellow/10 rounded-sm flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                    2 this month
                  </div>
                </div>
              </div>
              <div className="h-1 w-full bg-accent-yellow/10">
                <div className="h-1 bg-accent-yellow w-1/3 transition-all duration-1000"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="stat" className="overflow-hidden group hover:border-accent-primary/50 hover:shadow-blue-sm transition-all duration-300 transform hover:scale-102 border border-[#E8E8E8]">
            <CardContent className="p-0">
              <div className="flex flex-col p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-ink-light font-medium uppercase tracking-wide text-[11px]">Draft Products</p>
                  <div className="w-10 h-10 bg-accent-tertiary/40 rounded-full flex items-center justify-center group-hover:bg-accent-primary/10 transition-colors duration-300">
                    <BookText className="w-5 h-5 text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <p className="text-ink-dark text-4xl font-serif font-medium">{dashboardStats.draftProducts}</p>
                  <div className="text-[11px] text-accent-primary font-medium px-1.5 py-0.5 bg-accent-primary/10 rounded-sm">
                    In progress
                  </div>
                </div>
              </div>
              <div className="h-1 w-full bg-accent-primary/10">
                <div className="h-1 bg-accent-primary w-2/3 transition-all duration-1000"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="stat" className="overflow-hidden group hover:border-accent-yellow/50 hover:shadow-yellow-sm transition-all duration-300 transform hover:scale-102 border border-[#E8E8E8]">
            <CardContent className="p-0">
              <div className="flex flex-col p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-ink-light font-medium uppercase tracking-wide text-[11px]">Words Written</p>
                  <div className="w-10 h-10 bg-accent-tertiary/40 rounded-full flex items-center justify-center group-hover:bg-accent-yellow/10 transition-colors duration-300">
                    <FileText className="w-5 h-5 text-accent-yellow group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <p className="text-ink-dark text-4xl font-serif font-medium">{dashboardStats.wordsWritten.toLocaleString()}</p>
                  <div className="text-[11px] text-accent-yellow font-medium px-1.5 py-0.5 bg-accent-yellow/10 rounded-sm flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                    3.2k this week
                  </div>
                </div>
              </div>
              <div className="h-1 w-full bg-accent-yellow/10">
                <div className="h-1 bg-accent-yellow w-4/5 transition-all duration-1000"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column with Quick Actions and Recent Products */}
          <div className="lg:col-span-2 space-y-10">
            {/* Quick Actions */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F0F0F0]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <PenTool className="w-5 h-5 text-accent-yellow mr-2" />
                    <CardTitle className="text-lg font-medium font-serif text-[#333333]">Quick Actions</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card 
                    variant="action"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleNavigate('/brain-dump'); } }}
                    className="transform transition-transform duration-300 hover:scale-102"
                    onClick={() => handleNavigate('/brain-dump')}
                  >
                    <CardContent className="p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-center relative z-10">
                        <div className="w-8 h-8 bg-accent-tertiary/40 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0 group-hover:bg-white transition-colors duration-300">
                          <PenTool className="w-4 h-4 text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-ink-dark font-medium text-base leading-tight">Brain Dump</h4>
                          <p className="text-ink-light text-xs mt-0.5 line-clamp-2">
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
                    className="transform transition-transform duration-300 hover:scale-102"
                    onClick={() => handleNavigate('/creator')}
                  >
                    <CardContent className="p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-center relative z-10">
                        <div className="w-8 h-8 bg-accent-tertiary/40 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0 group-hover:bg-white transition-colors duration-300">
                          <Wand2 className="w-4 h-4 text-accent-yellow group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-ink-dark font-medium text-base leading-tight">AI Creator</h4>
                          <p className="text-ink-light text-xs mt-0.5 line-clamp-2">
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
                    className="transform transition-transform duration-300 hover:scale-102"
                    onClick={() => handleNavigate('/products')}
                  >
                    <CardContent className="p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-center relative z-10">
                        <div className="w-8 h-8 bg-accent-tertiary/40 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0 group-hover:bg-white transition-colors duration-300">
                          <BookText className="w-4 h-4 text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-ink-dark font-medium text-base leading-tight">All Products</h4>
                          <p className="text-ink-light text-xs mt-0.5 line-clamp-2">
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
                    className="transform transition-transform duration-300 hover:scale-102"
                    onClick={() => handleNavigate('/settings')}
                  >
                    <CardContent className="p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-center relative z-10">
                        <div className="w-8 h-8 bg-accent-tertiary/40 rounded-full flex items-center justify-center mr-2.5 flex-shrink-0 group-hover:bg-white transition-colors duration-300">
                          <Settings className="w-4 h-4 text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-ink-dark font-medium text-base leading-tight">Settings</h4>
                          <p className="text-ink-light text-xs mt-0.5 line-clamp-2">
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
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => refreshProducts()}
                      variant="ghost"
                      size="sm"
                      className="text-[#738996] text-xs flex items-center hover:text-[#738996]/80 font-medium transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Refresh
                    </Button>
                    <Button 
                      onClick={() => handleNavigate('/products')}
                      variant="link"
                      className="text-[#738996] text-sm flex items-center hover:text-[#738996]/80 font-medium transition-colors"
                    >
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-6">
                {error && (
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700 mb-4">
                    <p className="text-sm font-medium mb-1">Error loading products</p>
                    <p className="text-xs">{error}</p>
                    <Button 
                      onClick={() => refreshProducts()} 
                      size="sm"
                      className="bg-red-700 text-white hover:bg-red-800 mt-2"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                )}
                
                {isLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-[#738996] animate-spin mb-4" />
                    <p className="text-[#666666] text-sm font-medium">Loading your products...</p>
                  </div>
                ) : recentProducts.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-6">
                      <BookText className="w-10 h-10 text-[#CCCCCC]" />
                    </div>
                    <p className="text-[#666666] text-center text-sm max-w-sm">No products found. Get started by creating your first content!</p>
                    <Button 
                      onClick={() => handleNavigate('/creator')}
                      className="mt-6 bg-[#738996] text-white px-6"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {recentProducts.map(product => (
                      <Card 
                        key={product.id}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { navigate(`/products/${product.id}`); } }}
                        className="border border-[#E8E8E8] bg-white hover:border-[#738996]/30 transition-all cursor-pointer shadow-none rounded-lg overflow-hidden group transform transition-transform duration-300 hover:scale-102"
                        onClick={() => {
                          console.log("Dashboard: navigating to product:", product.id);
                          navigate(`/products/${product.id}`);
                        }}
                      >
                        <CardContent className="p-3 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#738996]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative z-10">
                            <div className="flex justify-between items-center">
                              <div className="flex items-start">
                                <div className="w-8 h-8 rounded-full bg-accent-tertiary/5 flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-primary/10 transition-colors duration-300">
                                  {product.type.includes('ebook') && <BookText className="h-4 w-4 text-accent-primary" />}
                                  {product.type === 'brain_dump' && <FileText className="h-4 w-4 text-accent-tertiary" />}
                                  {!product.type.includes('ebook') && product.type !== 'brain_dump' && <PenTool className="h-4 w-4 text-accent-secondary" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[#2A2A2A] font-medium text-sm mb-0.5 truncate pr-4">{product.title}</h4>
                                  <div className="flex items-center flex-wrap gap-2">
                                    <Badge className="bg-[#F9F5ED] text-[#ccb595] border-[#ccb595] border font-normal px-2 py-0.5 rounded text-xs">
                                      {getProductCategory(product)}
                                    </Badge>
                                    {renderStatusBadge(product.status)}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#666666] group-hover:text-[#738996] group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                            </div>
                            
                            <div className="mt-3 space-y-1.5">
                              <div className="w-full bg-[#E8E8E8] rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-1000 ${
                                    calculateProgress(product) >= 100 
                                      ? 'bg-[#10B981]' 
                                      : calculateProgress(product) > 75
                                        ? 'bg-[#ccb595]'
                                        : 'bg-[#738996]'
                                  }`}
                                  style={{ width: `${calculateProgress(product)}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-[#666666] flex items-center">
                                  <Clock className="w-3 h-3 mr-1 opacity-70" />
                                  {formatRelativeDate(product.updated_at)}
                                </span>
                                <span className="text-[#2A2A2A] font-medium">{calculateProgress(product)}%</span>
                              </div>
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
          <div className="lg:col-span-1 space-y-10">
            {/* Product Templates */}
            <Card className="border border-[#E8E8E8] bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F0F0F0]">
                <div className="flex items-center">
                  <Layers className="w-5 h-5 text-[#ccb595] mr-2" />
                  <CardTitle className="text-lg font-medium font-serif text-[#333333]">Product Templates</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-5 py-4">
                <div className="space-y-3">
                  {templates.map(template => (
                    <Card 
                      key={template.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleNavigate(`/creator?template=${template.id}`); } }}
                      className="border border-[#E8E8E8] bg-white hover:border-[#ccb595]/40 transition-all cursor-pointer shadow-none rounded-lg overflow-hidden group transform transition-transform duration-300 hover:scale-102"
                      onClick={() => handleNavigate(`/creator?template=${template.id}`)}
                    >
                      <CardContent className="p-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#ccb595]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="flex justify-between items-center relative z-10">
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="text-[#2A2A2A] font-medium text-base leading-tight">{template.name}</h4>
                            <p className="text-[#666666] text-xs mt-0.5 line-clamp-2">
                              {template.description}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#738996] group-hover:text-[#ccb595] group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          
            {/* Writing Tips */}
            <Card className="border border-[#E8E8E8] bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-4 pt-6 px-6 border-b border-[#F0F0F0]">
                <div className="flex items-center">
                  <CloudLightning className="w-5 h-5 text-[#738996] mr-2" />
                  <CardTitle className="text-lg font-medium font-serif text-[#333333]">Writing Tips</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-6">
                <div className="space-y-5">
                  {writingTips.map((tip, index) => (
                    <div key={index} className="flex items-start group cursor-default">
                      <div className="w-7 h-7 bg-[#F5F5F5] rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-[#666666] text-sm font-medium group-hover:bg-[#738996]/10 group-hover:text-[#738996] transition-colors duration-300">
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
