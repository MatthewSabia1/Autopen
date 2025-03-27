import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import DashboardLayout from "../layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookText,
  FileText,
  PenTool,
  ChevronLeft,
  Clock,
  Pencil,
  ArrowRight,
  Loader2,
  Calendar,
  User,
  Wand2,
  Tag,
  Bookmark,
  Layers,
  RefreshCw,
  Plus,
  Eye,
  FileType,
  Info,
  BarChart3,
  CalendarCheck,
  Link2,
  ChevronRight,
  History
} from "lucide-react";
import { useProducts, Product } from "../../hooks/useProducts";
import React from "react";
import { cn } from "@/lib/utils";

/**
 */
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProductById, isLoading: hookLoading, error: hookError } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'history'>('overview');
  
  // Use a ref to capture the getProductById function and prevent re-renders
  const getProductByIdRef = React.useRef(getProductById);
  
  // Update the ref when the function changes, but don't cause a re-render
  React.useEffect(() => {
    getProductByIdRef.current = getProductById;
  }, [getProductById]);

  useEffect(() => {
    // Don't do anything if no ID is provided
    if (!id) {
      setError("No product ID provided");
      setLoading(false);
      return;
    }
    
    // Clear previous state only when ID changes
    setProduct(null);
    setError(null);
    setLoading(true);
    
    console.log("Loading product with ID:", id);
    
    // Prevent multiple simultaneous fetches
    let isMounted = true;
    let fetchTimeout: number | null = null;
    
    // More efficient product fetching with error handling
    const fetchProduct = async () => {
      try {
        // Set a timeout for the fetch operation
        const fetchPromise = getProductByIdRef.current(id);
        const timeoutPromise = new Promise<null>((_, reject) => {
          fetchTimeout = window.setTimeout(() => {
            reject(new Error("Request timed out"));
          }, 15000);
        });
        
        // Race between actual fetch and timeout
        const fetchedProduct = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]) as Product | null;
        
        // If component is unmounted, don't update state
        if (!isMounted) return;
        
        if (fetchTimeout) {
          clearTimeout(fetchTimeout);
          fetchTimeout = null;
        }
        
        console.log("Fetched product:", fetchedProduct);
        
        if (fetchedProduct) {
          // Preload the metadata to avoid rendering issues
          if (fetchedProduct.metadata) {
            Object.keys(fetchedProduct.metadata).forEach(key => {
              // Touch each property to ensure it's loaded
              const _ = fetchedProduct.metadata![key];
            });
          }
          
          setProduct(fetchedProduct);
        } else {
          setError("Product not found. It may have been deleted or you don't have access to it.");
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error("Error fetching product:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchProduct();
    
    // Cleanup function to handle component unmounting during fetch
    return () => {
      isMounted = false;
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
    };
  }, [id]); // Only re-run when ID changes, not when getProductById changes

  // Format date safely
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMMM d, yyyy');
    } catch (error) {
      console.error("Invalid date format:", dateStr);
      return "Unknown date";
    }
  };

  // Format date with time
  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error("Invalid date format:", dateStr);
      return "Unknown date";
    }
  };

  // Calculate progress based on product status and metadata
  const calculateProgress = (product: Product): number => {
    // If the product is published or complete, it's 100% done
    if (product.status === "published") return 100;
    if (product.status === "complete") return 100;
    
    // For products in draft status, calculate based on metadata if available
    if (product.status === "draft") {
      // If we have word count, use it as a factor in progress calculation
      if (product.metadata?.wordCount) {
        const wordCount = product.metadata.wordCount;
        
        // Based on the product type, we can have different word count targets
        const getWordCountTarget = () => {
          if (product.type === "blog") return 1500; // blogs are typically shorter
          if (product.type === "ebook") return 10000; // ebooks are longer
          if (product.type === "course") return 5000; // courses are medium length
          return 3000; // default target
        };
        
        const wordCountTarget = getWordCountTarget();
        const progressFromWords = Math.min(Math.round((wordCount / wordCountTarget) * 100), 80); // Cap at 80% for drafts
        
        // Ensure at least 10% progress if there's any words at all
        return Math.max(progressFromWords, wordCount > 0 ? 10 : 0);
      }
      
      // If there's a summary but no word count, it's at least started
      if (product.metadata?.summary) return 25;
      
      // Basic draft without much metadata
      return 10;
    }
    
    // For products in progress
    if (product.status === "in_progress") {
      // If we have workflow step information, use that for more precise progress
      if (product.metadata?.workflow_step) {
        const workflowStep = product.metadata.workflow_step as string;
        
        // Map common workflow steps to progress percentages
        const stepProgressMap: Record<string, number> = {
          'brain-dump': 30,
          'outline': 45,
          'ebook-writing': 60,
          'review': 75,
          'editing': 85,
          'final-review': 95
        };
        
        // If we have a mapping for this step, use it
        if (typeof workflowStep === 'string' && workflowStep in stepProgressMap) {
          return stepProgressMap[workflowStep];
        }
        
        // Default for in_progress
        return 60;
      }
      
      // If no specific step but has word count, make a more educated guess
      if (product.metadata?.wordCount) {
        const wordCount = product.metadata.wordCount;
        if (wordCount > 5000) return 75;
        if (wordCount > 2000) return 65;
        return 55;
      }
      
      // Default for in_progress
      return 50;
    }
    
    // For "generating" or other states
    if (product.status === "generating" || product.status === "processing") return 40;
    if (product.status === "pending") return 20;
    
    // Fallback default
    return 15;
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

  // Get icon based on product type
  const getProductIcon = (type: string) => {
    if (type.includes('ebook')) return <BookText className="h-5 w-5 text-[#738996] dark:text-accent-primary" />;
    if (type === 'brain_dump' || type === 'notes') return <FileText className="h-5 w-5 text-[#ccb595] dark:text-accent-yellow" />;
    if (type === 'course') return <Layers className="h-5 w-5 text-[#738996] dark:text-accent-primary" />;
    if (type === 'blog') return <FileType className="h-5 w-5 text-[#738996] dark:text-accent-primary" />;
    return <PenTool className="h-5 w-5 text-[#738996] dark:text-accent-primary" />;
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    // Map the status to our normalized status names
    let normalizedStatus = status;
    if (status === "in_progress") normalizedStatus = "inProgress";
    if (status === "pending") normalizedStatus = "inProgress";
    if (status === "processing") normalizedStatus = "generating";
    
    // Define status variants with consistent styling - using brand colors to match app theme
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
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-md ${variant.bg} ${variant.text} text-xs font-serif ${variant.border} border shadow-xs transition-all duration-300`}>
          <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${variant.dot} animate-pulse`}></div>
          <span>{statusLabel}</span>
        </div>
      </div>
    );
  };

  // Handle edit button click
  const handleEdit = () => {
    if (!product) return;
    navigate(`/creator?id=${product.id}&mode=edit`);
  };

  // Handle continue button click
  const handleContinue = () => {
    if (!product) return;
    
    // Skip if product is already complete or published
    if (product.status === 'complete' || product.status === 'published') return;
    
    // For ebooks in progress, check for workflow metadata and project_id
    if (product.type === 'ebook' && product.project_id) {
      // Determine the correct step to resume from
      const resumeStep = product.metadata?.workflow_step ||
                       (product.status === 'in_progress' ? 'ebook-writing' : 
                        product.status === 'draft' ? 'brain-dump' : null);
      
      if (resumeStep) {
        console.log('Continuing ebook workflow at step:', resumeStep);
        
        // Store resumption data in session storage for the workflow to pick up
        sessionStorage.removeItem('resumeWorkflow');
        
        sessionStorage.setItem('resumeWorkflow', JSON.stringify({
          productId: product.id,
          projectId: product.project_id,
          step: resumeStep,
          type: 'ebook',
          timestamp: Date.now()
        }));
        
        // Navigate directly to the workflow with project ID
        console.log(`Navigating to workflow/${product.project_id} to resume at ${resumeStep}`);
        navigate(`/workflow/${product.project_id}`);
        return;
      }
    }
    
    // Default fallback - go to creator
    navigate(`/creator?id=${product.id}`);
  };
  
  // Manually refresh the page
  const handleRefresh = () => {
    window.location.reload();
  };

  // If we're loading, show a loading spinner
  if (loading || hookLoading) {
    return (
      <DashboardLayout activeTab="Product">
        <div className="flex h-[60vh] w-full items-center justify-center">
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-16 h-16 relative mb-5">
              <div className="absolute inset-0 animate-spin h-16 w-16 rounded-full border-4 border-[#738996]/10 dark:border-accent-primary/20 border-t-[#738996] dark:border-t-accent-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BookText className="h-7 w-7 text-[#738996]/70 dark:text-accent-primary/70" />
              </div>
            </div>
            <p className="font-serif text-base text-[#666666] dark:text-ink-light mb-1">Loading product details...</p>
            <p className="text-[#888888] dark:text-ink-light/70 text-sm">This may take a moment</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If there's an error or no product, show an error message
  if (error || hookError || !product) {
    return (
      <DashboardLayout activeTab="Product">
        <div className="flex flex-col h-[60vh] w-full items-center justify-center animate-fade-in">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-5 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 dark:text-red-400">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="text-[#333333] dark:text-ink-dark font-serif text-center max-w-lg px-6 mb-5">
            <h3 className="text-2xl font-display font-medium mb-3">Couldn't Load Product</h3>
            <p className="text-[#666666] dark:text-ink-light">{error || hookError || "Product not found"}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => navigate("/products")} 
              variant="outline"
              className="flex items-center gap-2 border-[#E8E8E8] dark:border-accent-tertiary/40 text-[#333333] dark:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 transition-all duration-300"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Products
            </Button>
            <Button 
              onClick={handleRefresh} 
              className="bg-[#738996] dark:bg-accent-primary text-white hover:bg-[#738996]/90 dark:hover:bg-accent-primary/90 flex items-center gap-2 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab={product.title}>
      <div className="w-full mx-auto animate-fade-in animate-duration-500 px-2 xs:px-3 sm:px-4 md:px-6 pb-6 sm:pb-10">
        {/* Header with back button and product title */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center mb-2 sm:mb-3">
            <Button 
              onClick={() => navigate("/products")} 
              variant="outline" 
              size="sm"
              className="mr-2 sm:mr-3 border-[#E8E8E8] dark:border-accent-tertiary/40 text-[#555555] dark:text-ink-light hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 transition-all duration-300 group min-h-9 min-w-9 p-0 sm:px-2"
            >
              <ChevronLeft className="h-4 w-4 mx-1 sm:mr-1 group-hover:-translate-x-0.5 transition-transform duration-300" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            
            <Badge className="bg-[#F9F5ED] dark:bg-accent-yellow/15 text-[#ccb595] dark:text-accent-yellow border-[#ccb595] dark:border-accent-yellow/50 border font-normal px-2 py-0.5 rounded text-xs mr-2">
              {getProductCategory(product)}
            </Badge>
            
            {renderStatusBadge(product.status)}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-medium text-[#333333] dark:text-ink-dark tracking-tight mb-2">
                {product.title}
              </h1>
              <div className="flex flex-wrap items-center text-[#666666] dark:text-ink-light text-xs sm:text-sm">
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 opacity-70" />
                  Updated {formatDate(product.updated_at)}
                </span>
                <span className="mx-2 text-[#CCCCCC] dark:text-[#555555]">•</span>
                <span className="flex items-center">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 opacity-70" />
                  Created by you
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 mt-2 sm:mt-0">
              <Button 
                onClick={handleEdit}
                variant="outline" 
                className="text-xs sm:text-sm font-serif font-medium border-[#E8E8E8] dark:border-accent-tertiary/40 text-[#555555] dark:text-ink-light hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 transition-all duration-300 group h-9 px-2 sm:px-3"
              >
                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 group-hover:scale-110 transition-transform duration-300" />
                Edit
              </Button>
              
              <Button 
                onClick={handleContinue}
                className="bg-[#738996] dark:bg-accent-primary text-white hover:bg-[#738996]/90 dark:hover:bg-accent-primary/90 text-xs sm:text-sm font-serif font-medium transition-all duration-300 shadow-sm dark:shadow-md hover:shadow dark:hover:shadow-lg group h-9 px-2 sm:px-3"
                disabled={product.status === 'complete' || product.status === 'published'}
              >
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 group-hover:translate-x-0.5 transition-transform duration-300" />
                Continue
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-5 sm:mb-8">
          {/* Main KPI Card */}
          <Card className="col-span-1 md:col-span-2 border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-white dark:bg-card shadow-sm dark:shadow-md rounded-lg overflow-hidden hover:shadow-blue-sm dark:hover:shadow-lg transition-all duration-300">
            <CardContent className="p-3 sm:p-4 md:p-5">
              <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
                {/* Progress tracker */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-[#333333] dark:text-ink-dark font-medium font-serif text-sm sm:text-base">Progress</span>
                    <span className="text-[#738996] dark:text-accent-primary text-xs sm:text-sm font-medium">{calculateProgress(product)}%</span>
                  </div>
                  <div className="w-full bg-[#E8E8E8] dark:bg-accent-tertiary/30 rounded-full h-2 sm:h-2.5 overflow-hidden">
                    <div 
                      className={`h-2 sm:h-2.5 rounded-full transition-all duration-1000 ease-in-out ${
                        calculateProgress(product) >= 100 
                          ? 'bg-[#10B981] dark:bg-[#10B981]' 
                          : calculateProgress(product) > 75
                            ? 'bg-[#ccb595] dark:bg-accent-yellow'
                            : 'bg-[#738996] dark:bg-accent-primary'
                      }`} 
                      style={{ width: `${calculateProgress(product)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Status & dates */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  <div className="bg-[#FAF9F5] dark:bg-accent-tertiary/10 rounded-lg p-2 sm:p-2.5 md:p-3 border border-[#E8E8E8] dark:border-accent-tertiary/30">
                    <p className="text-[#666666] dark:text-ink-light text-xs mb-1">Status</p>
                    <div className="flex items-center">
                      {renderStatusBadge(product.status)}
                    </div>
                  </div>
                  
                  {product.metadata?.wordCount && (
                    <div className="bg-[#FAF9F5] dark:bg-accent-tertiary/10 rounded-lg p-2 sm:p-2.5 md:p-3 border border-[#E8E8E8] dark:border-accent-tertiary/30">
                      <p className="text-[#666666] dark:text-ink-light text-xs mb-1">Word Count</p>
                      <p className="text-[#333333] dark:text-ink-dark font-medium text-sm sm:text-base">{product.metadata.wordCount.toLocaleString()}</p>
                    </div>
                  )}
                  
                  <div className="bg-[#FAF9F5] dark:bg-accent-tertiary/10 rounded-lg p-2 sm:p-2.5 md:p-3 border border-[#E8E8E8] dark:border-accent-tertiary/30">
                    <p className="text-[#666666] dark:text-ink-light text-xs mb-1">Created</p>
                    <p className="text-[#333333] dark:text-ink-dark font-medium text-sm sm:text-base">{format(new Date(product.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  
                  <div className="bg-[#FAF9F5] dark:bg-accent-tertiary/10 rounded-lg p-2 sm:p-2.5 md:p-3 border border-[#E8E8E8] dark:border-accent-tertiary/30">
                    <p className="text-[#666666] dark:text-ink-light text-xs mb-1">Last Updated</p>
                    <p className="text-[#333333] dark:text-ink-dark font-medium text-sm sm:text-base">{format(new Date(product.updated_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick actions card */}
          <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-white dark:bg-card shadow-sm dark:shadow-md rounded-lg overflow-hidden">
            <CardHeader className="pb-2 pt-3 sm:pb-3 sm:pt-4 md:pt-5 px-3 sm:px-4 md:px-6 border-b border-[#F0F0F0] dark:border-accent-tertiary/30">
              <div className="flex items-center">
                <div className="bg-[#738996]/10 dark:bg-accent-primary/20 p-1.5 rounded-md mr-2">
                  <Wand2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#738996] dark:text-accent-primary" />
                </div>
                <CardTitle className="text-base sm:text-lg font-medium font-display text-[#333333] dark:text-ink-dark">
                  Quick Actions
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#F0F0F0] dark:divide-accent-tertiary/30">
                <Button 
                  onClick={handleContinue}
                  variant="ghost" 
                  className="w-full justify-start rounded-none py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 md:px-6 text-[#333333] dark:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 transition-all duration-300 group text-sm h-auto"
                  disabled={product.status === 'complete' || product.status === 'published'}
                >
                  <ArrowRight className="h-4 w-4 mr-2 sm:mr-3 text-[#738996] dark:text-accent-primary group-hover:translate-x-0.5 transition-transform duration-300" />
                  Continue Editing
                </Button>
                
                <Button 
                  onClick={handleEdit}
                  variant="ghost" 
                  className="w-full justify-start rounded-none py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 md:px-6 text-[#333333] dark:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 transition-all duration-300 group text-sm h-auto"
                >
                  <Pencil className="h-4 w-4 mr-2 sm:mr-3 text-[#738996] dark:text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                  Edit Details
                </Button>
                
                {product.project_id && (
                  <Button 
                    onClick={() => navigate(`/workflow/${product.project_id}`)}
                    variant="ghost" 
                    className="w-full justify-start rounded-none py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 md:px-6 text-[#333333] dark:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 transition-all duration-300 group text-sm h-auto"
                  >
                    <Layers className="h-4 w-4 mr-2 sm:mr-3 text-[#738996] dark:text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                    View Workflow
                  </Button>
                )}
                
                <Button 
                  onClick={handleRefresh}
                  variant="ghost" 
                  className="w-full justify-start rounded-none py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 md:px-6 text-[#333333] dark:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 transition-all duration-300 group text-sm h-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2 sm:mr-3 text-[#738996] dark:text-accent-primary group-hover:rotate-180 transition-transform duration-700" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tab navigation */}
        <div className="border-b border-[#E8E8E8] dark:border-accent-tertiary/30 mb-3 sm:mb-4 md:mb-6 overflow-x-auto -mx-2 px-2 xs:-mx-3 xs:px-3 sm:-mx-4 sm:px-4 md:-mx-0 md:px-0 pb-0.5">
          <div className="flex space-x-3 sm:space-x-4 md:space-x-6 min-w-fit">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 sm:pb-3 pt-1 px-1.5 sm:px-2 font-serif font-medium text-sm border-b-2 transition-all duration-200 min-h-[40px] sm:min-h-[44px] min-w-[60px] sm:min-w-[70px] ${
                activeTab === 'overview' 
                  ? 'border-[#738996] dark:border-accent-primary text-[#333333] dark:text-ink-dark' 
                  : 'border-transparent text-[#666666] dark:text-ink-light hover:text-[#333333] dark:hover:text-ink-dark'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-2.5 sm:pb-3 pt-1 px-1.5 sm:px-2 font-serif font-medium text-sm border-b-2 transition-all duration-200 min-h-[40px] sm:min-h-[44px] min-w-[60px] sm:min-w-[70px] ${
                activeTab === 'details' 
                  ? 'border-[#738996] dark:border-accent-primary text-[#333333] dark:text-ink-dark' 
                  : 'border-transparent text-[#666666] dark:text-ink-light hover:text-[#333333] dark:hover:text-ink-dark'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 sm:pb-3 pt-1 px-1.5 sm:px-2 font-serif font-medium text-sm border-b-2 transition-all duration-200 min-h-[40px] sm:min-h-[44px] min-w-[60px] sm:min-w-[70px] ${
                activeTab === 'history' 
                  ? 'border-[#738996] dark:border-accent-primary text-[#333333] dark:text-ink-dark' 
                  : 'border-transparent text-[#666666] dark:text-ink-light hover:text-[#333333] dark:hover:text-ink-dark'
              }`}
            >
              History
            </button>
          </div>
        </div>
        
        {/* Tab content */}
        <div>
          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in">
              {/* Summary card */}
              {product.metadata?.summary && (
                <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-white dark:bg-card shadow-sm dark:shadow-md rounded-lg overflow-hidden">
                  <CardHeader className="pb-2 pt-3 sm:pt-4 md:pt-5 px-3 sm:px-4 md:px-6 border-b border-[#F0F0F0] dark:border-accent-tertiary/30">
                    <div className="flex items-center">
                      <div className="bg-[#738996]/10 dark:bg-accent-primary/20 p-1.5 rounded-md mr-2">
                        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-[#738996] dark:text-accent-primary" />
                      </div>
                      <CardTitle className="text-base sm:text-lg font-medium font-display text-[#333333] dark:text-ink-dark">
                        Summary
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5">
                    <p className="text-[#666666] dark:text-ink-light text-sm leading-relaxed font-serif">
                      {product.metadata.summary}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Additional overview cards */}
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {/* Product Type */}
                <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-gradient-to-br from-white via-white to-[#F9F7F4] dark:from-card dark:via-card dark:to-card/90 shadow-sm dark:shadow-md rounded-lg overflow-hidden">
                  <CardContent className="p-3 sm:p-4 md:p-5">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <p className="text-[#666666] dark:text-ink-light text-xs sm:text-sm font-medium">Product Type</p>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#F5F5F5] dark:bg-accent-tertiary/20 rounded-full flex items-center justify-center">
                        {getProductIcon(product.type)}
                      </div>
                    </div>
                    <div className="flex items-baseline">
                      <p className="text-[#2A2A2A] dark:text-ink-dark text-base sm:text-lg md:text-xl font-display font-medium">
                        {getProductCategory(product)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Word Count */}
                {product.metadata?.wordCount && (
                  <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-gradient-to-br from-white via-white to-[#F9F7F4] dark:from-card dark:via-card dark:to-card/90 shadow-sm dark:shadow-md rounded-lg overflow-hidden">
                    <CardContent className="p-3 sm:p-4 md:p-5">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <p className="text-[#666666] dark:text-ink-light text-xs sm:text-sm font-medium">Word Count</p>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#F5F5F5] dark:bg-accent-tertiary/20 rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#738996] dark:text-accent-primary" />
                        </div>
                      </div>
                      <div className="flex items-baseline">
                        <p className="text-[#2A2A2A] dark:text-ink-dark text-base sm:text-lg md:text-xl font-display font-medium">
                          {product.metadata.wordCount.toLocaleString()}
                        </p>
                        <span className="ml-2 text-xs text-[#738996] dark:text-accent-primary font-medium px-1.5 py-0.5 bg-[#738996]/10 dark:bg-accent-primary/20 rounded">
                          words
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Project Link */}
                {product.project_id && (
                  <Card 
                    className="border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-gradient-to-br from-white via-white to-[#F9F7F4] dark:from-card dark:via-card dark:to-card/90 shadow-sm dark:shadow-md hover:shadow-blue-sm dark:hover:shadow-lg rounded-lg overflow-hidden transition-all duration-300 group cursor-pointer"
                    onClick={() => navigate(`/workflow/${product.project_id}`)}
                  >
                    <CardContent className="p-3 sm:p-4 md:p-5">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <p className="text-[#666666] dark:text-ink-light text-xs sm:text-sm font-medium">Connected Workflow</p>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#F5F5F5] dark:bg-accent-tertiary/20 group-hover:bg-[#738996]/10 dark:group-hover:bg-accent-primary/30 rounded-full flex items-center justify-center transition-colors duration-300">
                          <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[#738996] dark:text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[#2A2A2A] dark:text-ink-dark text-sm sm:text-base font-display font-medium">
                          View Workflow
                        </p>
                        <ChevronRight className="h-4 w-4 text-[#738996] dark:text-accent-primary group-hover:translate-x-0.5 transition-transform duration-300" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
          
          {/* Details tab */}
          {activeTab === 'details' && (
            <div className="space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in">
              {/* Product details grid */}
              <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-white dark:bg-card shadow-sm dark:shadow-md rounded-lg overflow-hidden">
                <CardHeader className="pb-2 pt-3 sm:pt-4 md:pt-5 px-3 sm:px-4 md:px-6 border-b border-[#F0F0F0] dark:border-accent-tertiary/30">
                  <div className="flex items-center">
                    <div className="bg-[#738996]/10 dark:bg-accent-primary/20 p-1.5 rounded-md mr-2">
                      {getProductIcon(product.type)}
                    </div>
                    <CardTitle className="text-base sm:text-lg font-medium font-display text-[#333333] dark:text-ink-dark">
                      Product Details
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    {/* Basic info */}
                    <div className="bg-[#FAF9F5] dark:bg-accent-tertiary/10 rounded-lg p-3 sm:p-4 md:p-5 border border-[#E8E8E8] dark:border-accent-tertiary/30 hover:shadow-xs dark:hover:shadow-md transition-all duration-300">
                      <h3 className="text-[#333333] dark:text-ink-dark font-medium font-display mb-2 sm:mb-3 md:mb-4 text-sm">Basic Information</h3>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-center p-2 bg-white dark:bg-card rounded-md border border-[#F0F0F0] dark:border-accent-tertiary/20">
                          <span className="text-[#666666] dark:text-ink-light text-xs">Product Type</span>
                          <span className="text-[#333333] dark:text-ink-dark font-medium text-xs sm:text-sm">
                            {getProductCategory(product)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white dark:bg-card rounded-md border border-[#F0F0F0] dark:border-accent-tertiary/20">
                          <span className="text-[#666666] dark:text-ink-light text-xs">Created On</span>
                          <span className="text-[#333333] dark:text-ink-dark font-medium text-xs sm:text-sm">
                            {formatDate(product.created_at)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white dark:bg-card rounded-md border border-[#F0F0F0] dark:border-accent-tertiary/20">
                          <span className="text-[#666666] dark:text-ink-light text-xs">Last Updated</span>
                          <span className="text-[#333333] dark:text-ink-dark font-medium text-xs sm:text-sm">
                            {formatDateTime(product.updated_at)}
                          </span>
                        </div>
                        {product.metadata?.wordCount && (
                          <div className="flex justify-between items-center p-2 bg-white dark:bg-card rounded-md border border-[#F0F0F0] dark:border-accent-tertiary/20">
                            <span className="text-[#666666] dark:text-ink-light text-xs">Word Count</span>
                            <span className="text-[#333333] dark:text-ink-dark font-medium text-xs sm:text-sm">
                              {product.metadata.wordCount.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  
                    {/* Additional metadata if available */}
                    {product.metadata && Object.keys(product.metadata).some(key => 
                      !['summary', 'wordCount', 'coverImage', 'generationInfo', 'category', 'workflow_step'].includes(key)
                    ) && (
                      <div className="bg-[#FAF9F5] dark:bg-accent-tertiary/10 rounded-lg p-3 sm:p-4 md:p-5 border border-[#E8E8E8] dark:border-accent-tertiary/30 hover:shadow-xs dark:hover:shadow-md transition-all duration-300">
                        <h3 className="text-[#333333] dark:text-ink-dark font-medium font-display mb-2 sm:mb-3 md:mb-4 text-sm">Additional Details</h3>
                        <div className="space-y-2 sm:space-y-3">
                          {Object.entries(product.metadata).map(([key, value]) => {
                            // Skip already displayed or irrelevant metadata
                            if (['summary', 'wordCount', 'coverImage', 'generationInfo', 'category', 'workflow_step'].includes(key)) {
                              return null;
                            }
                          
                            // Check if value is displayable
                            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                              return (
                                <div key={key} className="flex justify-between items-center p-2 bg-white dark:bg-card rounded-md border border-[#F0F0F0] dark:border-accent-tertiary/20">
                                  <span className="text-[#666666] dark:text-ink-light text-xs capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                  <span className="text-[#333333] dark:text-ink-dark text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[150px]" title={String(value)}>
                                    {String(value)}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* History tab */}
          {activeTab === 'history' && (
            <div className="space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in">
              <Card className="border border-[#E8E8E8] dark:border-accent-tertiary/40 bg-white dark:bg-card shadow-sm dark:shadow-md rounded-lg overflow-hidden">
                <CardHeader className="pb-2 pt-3 sm:pt-4 md:pt-5 px-3 sm:px-4 md:px-6 border-b border-[#F0F0F0] dark:border-accent-tertiary/30">
                  <div className="flex items-center">
                    <div className="bg-[#738996]/10 dark:bg-accent-primary/20 p-1.5 rounded-md mr-2">
                      <History className="h-4 w-4 sm:h-5 sm:w-5 text-[#738996] dark:text-accent-primary" />
                    </div>
                    <CardTitle className="text-base sm:text-lg font-medium font-display text-[#333333] dark:text-ink-dark">
                      Activity History
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5">
                  <div className="relative border-l-2 border-[#F0F0F0] dark:border-accent-tertiary/30 pl-5 sm:pl-6 md:pl-8 ml-2 space-y-4 sm:space-y-6 md:space-y-8">
                    {/* Most recent update */}
                    <div className="relative">
                      <div className="absolute -left-8 sm:-left-9 top-0 w-5 h-5 sm:w-6 sm:h-6 bg-[#738996] dark:bg-accent-primary rounded-full flex items-center justify-center">
                        <Pencil className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-[#333333] dark:text-ink-dark font-medium">Updated product</p>
                        <p className="text-xs text-[#666666] dark:text-ink-light">{formatDateTime(product.updated_at)}</p>
                      </div>
                    </div>
                    
                    {/* Creation event */}
                    <div className="relative">
                      <div className="absolute -left-8 sm:-left-9 top-0 w-5 h-5 sm:w-6 sm:h-6 bg-[#ccb595] dark:bg-accent-yellow rounded-full flex items-center justify-center">
                        <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-[#333333] dark:text-ink-dark font-medium">Created product</p>
                        <p className="text-xs text-[#666666] dark:text-ink-light">{formatDateTime(product.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
