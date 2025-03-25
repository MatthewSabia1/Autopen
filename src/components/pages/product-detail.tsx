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
  Link2
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
        const workflowStep = product.metadata.workflow_step;
        
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
        if (stepProgressMap[workflowStep]) {
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
    if (type.includes('ebook')) return <BookText className="h-5 w-5 text-[#738996]" />;
    if (type === 'brain_dump' || type === 'notes') return <FileText className="h-5 w-5 text-[#ccb595]" />;
    if (type === 'course') return <Layers className="h-5 w-5 text-[#738996]" />;
    if (type === 'blog') return <FileType className="h-5 w-5 text-[#738996]" />;
    return <PenTool className="h-5 w-5 text-[#738996]" />;
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
    
    // Set temporary loading state for all continue buttons
    const mainBtn = document.querySelector('#continue-button') as HTMLButtonElement;
    const sidebarBtn = document.querySelector('#continue-button-sidebar') as HTMLButtonElement;
    const headerBtn = document.querySelector('#continue-button-header') as HTMLButtonElement;
    
    const setLoadingState = (btn: HTMLButtonElement | null) => {
      if (btn) {
        btn.disabled = true;
        const loadingHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Continuing...';
        btn.innerHTML = loadingHTML;
      }
    };
    
    setLoadingState(mainBtn);
    setLoadingState(sidebarBtn);
    setLoadingState(headerBtn);
    
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
        setTimeout(() => {
          navigate(`/workflow/${product.project_id}`);
        }, 400); // Small delay to show the loading state
        return;
      }
    }
    
    // Default fallback - go to creator
    setTimeout(() => {
      navigate(`/creator?id=${product.id}`);
    }, 400); // Small delay to show the loading state
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
            <div className="w-16 h-16 relative mb-4">
              <div className="absolute inset-0 animate-spin h-16 w-16 rounded-full border-4 border-[#738996]/10 border-t-[#738996]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BookText className="h-7 w-7 text-[#738996]/70" />
              </div>
            </div>
            <p className="font-serif text-base text-[#666666] mb-1">Loading product details...</p>
            <p className="text-[#888888] text-sm">This may take a moment</p>
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
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="text-[#333333] font-serif text-center max-w-lg px-6 mb-5">
            <h3 className="text-2xl font-display font-medium mb-3">Couldn't Load Product</h3>
            <p className="text-[#666666]">{error || hookError || "Product not found"}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => navigate("/products")} 
              variant="outline"
              className="flex items-center gap-2 border-[#E8E8E8] text-[#333333] hover:bg-[#F5F5F5] transition-all duration-300"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Products
            </Button>
            <Button 
              onClick={handleRefresh} 
              className="bg-[#738996] text-white hover:bg-[#738996]/90 flex items-center gap-2 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button 
              onClick={() => navigate("/creator")} 
              className="bg-[#ccb595] text-white hover:bg-[#ccb595]/90 flex items-center gap-2 shadow-yellow-sm transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              Create New Product
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab={product.title}>
      <div className="space-y-8 animate-fade-in">
        {/* Header with back button and actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center">
            <Button 
              onClick={() => navigate("/products")} 
              variant="outline" 
              className="mr-4 border-[#E8E8E8] text-[#555555] hover:bg-[#F5F5F5] transition-all duration-300"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-display font-medium text-[#333333] tracking-tight">
                  {product.title}
                </h2>
                {renderStatusBadge(product.status)}
              </div>
              <div className="flex flex-wrap items-center mt-1.5 text-[#666666] text-sm">
                <span className="flex items-center text-[#666666]">
                  <Clock className="w-4 h-4 mr-1 opacity-70" />
                  Updated {formatDate(product.updated_at)}
                </span>
                <span className="mx-2 text-[#CCCCCC]">•</span>
                <Badge className="bg-[#F9F5ED] text-[#ccb595] border-[#ccb595] border font-normal px-2 py-0.5 rounded text-xs">
                  {getProductCategory(product)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleRefresh}
              variant="outline" 
              className="text-sm font-serif font-medium border-[#E8E8E8] text-[#555555] hover:bg-[#F5F5F5] transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleEdit}
              variant="outline" 
              className="text-sm font-serif font-medium border-[#E8E8E8] text-[#555555] hover:bg-[#F5F5F5] transition-all duration-300"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              id="continue-button-header"
              onClick={handleContinue}
              className="bg-[#738996] text-white hover:bg-[#738996]/90 text-sm font-serif font-medium transition-all duration-300"
              disabled={product.status === 'complete' || product.status === 'published'}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Continue
            </Button>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Product overview card */}
            <Card className="border border-[#E8E8E8] bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-3 pt-5 px-6 border-b border-[#F0F0F0]">
                <div className="flex items-center">
                  <div className="bg-[#738996]/10 p-1.5 rounded-md mr-2">
                    {getProductIcon(product.type)}
                  </div>
                  <CardTitle className="text-lg font-medium font-display text-[#333333]">
                    Product Overview
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-5">
                <div className="space-y-6">
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#666666] font-medium font-serif">Overall Progress</span>
                      <span className="text-[#333333] font-medium font-serif">{calculateProgress(product)}%</span>
                    </div>
                    <div className="w-full bg-[#E8E8E8] rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-[#738996] h-2 rounded-full transition-all duration-1000 ease-in-out" 
                        style={{ width: `${calculateProgress(product)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Summary if available */}
                  {product.metadata?.summary && (
                    <div className="space-y-2 bg-[#F9F9F6] rounded-lg p-5 border border-[#F0F0F0]">
                      <h3 className="text-[#333333] font-medium font-display flex items-center">
                        <Info className="w-4 h-4 mr-2 text-[#738996]" />
                        Summary
                      </h3>
                      <p className="text-[#666666] text-sm leading-relaxed font-serif">
                        {product.metadata.summary}
                      </p>
                    </div>
                  )}

                  {/* Word Count and other stats if available */}
                  <div className="pt-5 border-t border-[#F0F0F0]">
                    <h3 className="text-[#333333] font-medium font-display mb-4 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2 text-[#738996]" />
                      Content Statistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.metadata?.wordCount && (
                        <div className="bg-gradient-to-br from-white to-[#F9F7F4] rounded-lg p-5 border border-[#E8E8E8] group hover:border-[#738996]/30 hover:shadow-blue-sm transition-all duration-300">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[#666666] text-sm font-medium">Word Count</span>
                            <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center group-hover:bg-[#738996]/10 transition-colors duration-300">
                              <FileText className="w-5 h-5 text-[#738996] group-hover:scale-110 transition-transform duration-300" />
                            </div>
                          </div>
                          <div className="flex items-baseline">
                            <p className="text-[#2A2A2A] text-3xl font-display font-medium">
                              {product.metadata.wordCount.toLocaleString()}
                            </p>
                            <div className="ml-2 text-xs text-[#738996] font-medium px-1.5 py-0.5 bg-[#738996]/10 rounded">
                              words
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Display content type info */}
                      <div className="bg-gradient-to-br from-white to-[#F9F7F4] rounded-lg p-5 border border-[#E8E8E8] group hover:border-[#738996]/30 hover:shadow-blue-sm transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[#666666] text-sm font-medium">Content Type</span>
                          <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center group-hover:bg-[#738996]/10 transition-colors duration-300">
                            <FileType className="w-5 h-5 text-[#738996] group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                        <div className="flex items-baseline">
                          <p className="text-[#2A2A2A] text-2xl font-display font-medium">
                            {getProductCategory(product)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional metadata if available */}
                  {product.metadata && Object.keys(product.metadata).length > 0 && 
                   !['summary', 'wordCount', 'coverImage', 'generationInfo', 'category', 'workflow_step'].includes(Object.keys(product.metadata)[0]) && (
                    <div className="pt-5 border-t border-[#F0F0F0]">
                      <h3 className="text-[#333333] font-medium font-display mb-4 flex items-center">
                        <Tag className="w-4 h-4 mr-2 text-[#738996]" />
                        Additional Details
                      </h3>
                      <div className="bg-[#FAF9F5] rounded-lg p-5 border border-[#E8E8E8]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(product.metadata).map(([key, value]) => {
                            // Skip already displayed or irrelevant metadata
                            if (['summary', 'wordCount', 'coverImage', 'generationInfo', 'category', 'workflow_step'].includes(key)) {
                              return null;
                            }
                            
                            // Check if value is displayable
                            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                              return (
                                <div key={key} className="flex items-center space-x-2">
                                  <span className="text-[#666666] text-sm capitalize font-serif">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                                  <span className="text-[#333333] font-medium truncate">{String(value)}</span>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-5 border-t border-[#F0F0F0] flex justify-end">
                  <Button 
                    id="continue-button"
                    onClick={handleContinue}
                    className="bg-[#738996] text-white hover:bg-[#738996]/90 transition-all duration-300 font-serif"
                    disabled={product.status === 'complete' || product.status === 'published'}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Continue Editing
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cover Image Preview if available */}
            {product.metadata?.coverImage && (
              <Card className="border border-[#E8E8E8] bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-3 pt-5 px-6 border-b border-[#F0F0F0]">
                  <div className="flex items-center">
                    <div className="bg-[#ccb595]/10 p-1.5 rounded-md mr-2">
                      <Bookmark className="h-5 w-5 text-[#ccb595]" />
                    </div>
                    <CardTitle className="text-lg font-medium font-display text-[#333333]">
                      Cover Image
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex justify-center">
                  <div className="relative group">
                    <img 
                      src={product.metadata.coverImage} 
                      alt={`Cover for ${product.title}`} 
                      className="max-h-[350px] rounded-md shadow-sm border border-[#E8E8E8] group-hover:shadow-md transition-all duration-300"
                    />
                    {product.status === 'published' && (
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-white/90 backdrop-blur-sm border-[#E8E8E8] text-[#555555]"
                          onClick={() => window.open(product.metadata?.coverImage, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Full Size
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar with details */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border border-[#E8E8E8] bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-3 pt-5 px-6 border-b border-[#F0F0F0]">
                <div className="flex items-center">
                  <div className="bg-[#738996]/10 p-1.5 rounded-md mr-2">
                    <Info className="h-5 w-5 text-[#738996]" />
                  </div>
                  <CardTitle className="text-lg font-medium font-display text-[#333333]">
                    Details
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-5">
                <div className="space-y-4">
                  <div className="flex items-start group">
                    <div className="w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center mr-3 mt-0.5 group-hover:bg-[#738996]/10 transition-colors duration-300">
                      <CalendarCheck className="w-4 h-4 text-[#738996] group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <p className="text-sm text-[#666666] font-serif">Created</p>
                      <p className="text-[#333333] font-medium">{formatDateTime(product.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start group">
                    <div className="w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center mr-3 mt-0.5 group-hover:bg-[#738996]/10 transition-colors duration-300">
                      <Clock className="w-4 h-4 text-[#738996] group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <p className="text-sm text-[#666666] font-serif">Last Updated</p>
                      <p className="text-[#333333] font-medium">{formatDateTime(product.updated_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start group">
                    <div className="w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center mr-3 mt-0.5 group-hover:bg-[#738996]/10 transition-colors duration-300">
                      <User className="w-4 h-4 text-[#738996] group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <p className="text-sm text-[#666666] font-serif">Author</p>
                      <p className="text-[#333333] font-medium">You</p>
                    </div>
                  </div>
                  
                  {/* Project ID if available */}
                  {product.project_id && (
                    <div className="flex items-start group">
                      <div className="w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center mr-3 mt-0.5 group-hover:bg-[#738996]/10 transition-colors duration-300">
                        <Link2 className="w-4 h-4 text-[#738996] group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div>
                        <p className="text-sm text-[#666666] font-serif">Project ID</p>
                        <p className="text-[#333333] font-medium text-sm truncate max-w-[190px]">{product.project_id}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Generation info if available */}
                  {product.metadata?.generationInfo && (
                    <div className="mt-6 pt-4 border-t border-[#F0F0F0]">
                      <h3 className="text-[#333333] font-medium mb-4 font-display flex items-center">
                        <div className="bg-[#ccb595]/10 p-1 rounded-md mr-2 inline-flex">
                          <Wand2 className="w-4 h-4 text-[#ccb595]" />
                        </div>
                        AI Generation
                      </h3>
                      <div className="space-y-4">
                        {product.metadata.generationInfo.model && (
                          <div className="flex items-start group">
                            <div className="w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center mr-3 mt-0.5 group-hover:bg-[#ccb595]/10 transition-colors duration-300">
                              <Wand2 className="w-4 h-4 text-[#ccb595] group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div>
                              <p className="text-sm text-[#666666] font-serif">Model</p>
                              <p className="text-[#333333] font-medium">{product.metadata.generationInfo.model}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Token usage if available */}
                        {(product.metadata.generationInfo.promptTokens || product.metadata.generationInfo.completionTokens) && (
                          <div className="bg-gradient-to-br from-white to-[#F9F7F4] rounded-lg p-4 border border-[#E8E8E8] shadow-xs">
                            <p className="text-sm font-medium text-[#333333] mb-3 font-serif flex items-center">
                              <BarChart3 className="w-4 h-4 mr-2 text-[#ccb595]" />
                              Token Usage
                            </p>
                            {product.metadata.generationInfo.promptTokens && (
                              <div className="flex justify-between text-xs mb-2">
                                <span className="text-[#666666] font-serif">Prompt Tokens:</span>
                                <span className="text-[#333333] font-medium">{product.metadata.generationInfo.promptTokens.toLocaleString()}</span>
                              </div>
                            )}
                            {product.metadata.generationInfo.completionTokens && (
                              <div className="flex justify-between text-xs mb-2">
                                <span className="text-[#666666] font-serif">Completion Tokens:</span>
                                <span className="text-[#333333] font-medium">{product.metadata.generationInfo.completionTokens.toLocaleString()}</span>
                              </div>
                            )}
                            {product.metadata.generationInfo.promptTokens && product.metadata.generationInfo.completionTokens && (
                              <div className="flex justify-between text-xs pt-2 border-t border-[#E8E8E8] mt-2">
                                <span className="text-[#666666] font-serif">Total:</span>
                                <span className="text-[#333333] font-medium">
                                  {(product.metadata.generationInfo.promptTokens + product.metadata.generationInfo.completionTokens).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="px-6 pt-4 pb-5 border-t border-[#F0F0F0] flex flex-col gap-3">
                <Button 
                  onClick={handleEdit}
                  variant="outline" 
                  className="w-full justify-center text-sm font-serif font-medium border-[#E8E8E8] text-[#555555] hover:bg-[#F5F5F5] transition-all duration-300"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Product
                </Button>
                <Button 
                  id="continue-button-sidebar"
                  onClick={handleContinue}
                  className="w-full justify-center bg-[#738996] text-white hover:bg-[#738996]/90 text-sm font-serif font-medium transition-all duration-300"
                  disabled={product.status === 'complete' || product.status === 'published'}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continue Editing
                </Button>
                {product.status === 'published' && (
                  <Button 
                    onClick={() => window.open(`/products/preview/${product.id}`, '_blank')}
                    className="w-full justify-center bg-[#ccb595] text-white hover:bg-[#ccb595]/90 text-sm font-serif font-medium shadow-yellow-sm transition-all duration-300"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Product
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
