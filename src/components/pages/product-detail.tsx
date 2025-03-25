import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import DashboardLayout from "../layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus
} from "lucide-react";
import { useProducts, Product } from "../../hooks/useProducts";

/**
 */
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProductById, isLoading: hookLoading, error: hookError } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const fetchPromise = getProductById(id);
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
  }, [id, getProductById]);

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

  // Calculate progress based on product status
  const calculateProgress = (product: Product): number => {
    if (product.status === "published") return 100;
    if (product.status === "complete") return 100;
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

  // Get icon based on product type
  const getProductIcon = (type: string) => {
    if (type.includes('ebook')) return <BookText className="h-5 w-5 text-[#738996]" />;
    if (type === 'brain_dump') return <FileText className="h-5 w-5 text-[#ccb595]" />;
    if (type === 'course') return <Layers className="h-5 w-5 text-[#738996]" />;
    return <PenTool className="h-5 w-5 text-[#738996]" />;
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    // Map the status to our normalized status names
    let normalizedStatus = status;
    if (status === "in_progress") normalizedStatus = "inProgress";
    if (status === "pending") normalizedStatus = "inProgress";
    if (status === "processing") normalizedStatus = "generating";
    
    // Define status variants with consistent styling - using pastel colors to match app theme
    const variants = {
      draft: { 
        bg: "bg-amber-50", 
        text: "text-amber-700",
        border: "border-amber-100",
        dot: "bg-amber-400",
        label: "Draft"
      },
      complete: { 
        bg: "bg-emerald-50", 
        text: "text-emerald-700",
        border: "border-emerald-100",
        dot: "bg-emerald-400",
        label: "Complete"
      },
      inProgress: { 
        bg: "bg-blue-50", 
        text: "text-blue-700",
        border: "border-blue-100",
        dot: "bg-blue-400",
        label: "In Progress"
      },
      published: { 
        bg: "bg-green-50", 
        text: "text-green-700",
        border: "border-green-100",
        dot: "bg-green-400",
        label: "Published"
      },
      generating: { 
        bg: "bg-violet-50", 
        text: "text-violet-700",
        border: "border-violet-100",
        dot: "bg-violet-400",
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
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-md ${variant.bg} ${variant.text} text-xs font-serif ${variant.border} border shadow-xs`}>
          <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${variant.dot}`}></div>
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
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 animate-spin h-16 w-16 rounded-full border-4 border-[#738996]/10 border-t-[#738996]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BookText className="h-7 w-7 text-[#738996]/70" />
              </div>
            </div>
            <p className="text-[#666666] font-serif text-base mt-4">Loading product details...</p>
            <p className="text-[#999999] text-sm mt-2">This may take a moment</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If there's an error or no product, show an error message
  if (error || hookError || !product) {
    return (
      <DashboardLayout activeTab="Product">
        <div className="flex flex-col h-[60vh] w-full items-center justify-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="text-[#333333] font-serif text-center max-w-lg px-4 mb-4">
            <h3 className="text-xl font-display mb-2">Couldn't Load Product</h3>
            <p className="mb-4">{error || hookError || "Product not found"}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => navigate("/products")} 
              variant="outline"
              className="flex items-center gap-2 border-[#E8E8E8] text-[#333333]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Products
            </Button>
            <Button 
              onClick={handleRefresh} 
              className="bg-[#738996] text-white flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button 
              onClick={() => navigate("/creator")} 
              className="bg-[#ccb595] text-white flex items-center gap-2"
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center">
            <Button 
              onClick={() => navigate("/products")} 
              variant="outline" 
              className="mr-4 border-[#E8E8E8] text-[#555555] hover:bg-[#F5F5F5]"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-serif font-bold text-[#333333]">
                  {product.title}
                </h2>
                {renderStatusBadge(product.status)}
              </div>
              <div className="flex flex-wrap items-center mt-1 text-[#666666] text-sm">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1 opacity-70" />
                  Updated {formatDate(product.updated_at)}
                </span>
                <span className="mx-2">•</span>
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
              className="text-sm font-medium border-[#E8E8E8] text-[#555555] hover:bg-[#F5F5F5]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleEdit}
              variant="outline" 
              className="text-sm font-medium border-[#E8E8E8] text-[#555555] hover:bg-[#F5F5F5]"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              onClick={handleContinue}
              className="bg-[#738996] text-white hover:bg-[#738996]/90 text-sm font-medium"
              disabled={product.status === 'complete' || product.status === 'published'}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Continue
            </Button>
          </div>
        </div>

        {/* Product overview card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border border-[#E8E8E8] bg-white shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-6 border-b border-[#F0F0F0]">
                <div className="flex items-center">
                  {getProductIcon(product.type)}
                  <CardTitle className="text-lg font-medium font-serif text-[#333333] ml-2">
                    Product Overview
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-5">
                <div className="space-y-6">
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#666666] font-medium">Overall Progress</span>
                      <span className="text-[#333333] font-medium">{calculateProgress(product)}%</span>
                    </div>
                    <div className="w-full bg-[#E8E8E8] rounded-full h-2">
                      <div 
                        className="bg-[#738996] h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${calculateProgress(product)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Summary if available */}
                  {product.metadata?.summary && (
                    <div className="space-y-2">
                      <h3 className="text-[#333333] font-medium">Summary</h3>
                      <p className="text-[#666666] text-sm leading-relaxed">
                        {product.metadata.summary}
                      </p>
                    </div>
                  )}

                  {/* Word Count and other stats if available */}
                  <div className="pt-4 border-t border-[#F0F0F0]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.metadata?.wordCount && (
                        <div className="bg-[#F9F7F4] rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <FileText className="w-4 h-4 text-[#ccb595] mr-2" />
                            <span className="text-[#333333] font-medium">Word Count</span>
                          </div>
                          <p className="text-2xl text-[#333333] font-serif">
                            {product.metadata.wordCount.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {/* Display content type info */}
                      <div className="bg-[#F9F7F4] rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Tag className="w-4 h-4 text-[#738996] mr-2" />
                          <span className="text-[#333333] font-medium">Content Type</span>
                        </div>
                        <p className="text-lg text-[#333333] font-serif">
                          {getProductCategory(product)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional metadata if available */}
                  {product.metadata && Object.keys(product.metadata).length > 0 && 
                   !['summary', 'wordCount', 'coverImage', 'generationInfo', 'category'].includes(Object.keys(product.metadata)[0]) && (
                    <div className="pt-4 border-t border-[#F0F0F0]">
                      <h3 className="text-[#333333] font-medium mb-3">Additional Details</h3>
                      <div className="bg-[#F9F7F4] rounded-lg p-4">
                        {Object.entries(product.metadata).map(([key, value]) => {
                          // Skip already displayed or irrelevant metadata
                          if (['summary', 'wordCount', 'coverImage', 'generationInfo', 'category'].includes(key)) {
                            return null;
                          }
                          
                          // Check if value is displayable
                          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                            return (
                              <div key={key} className="mb-2 last:mb-0">
                                <span className="text-[#666666] text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                                <span className="text-[#333333] font-medium">{String(value)}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-4 border-t border-[#F0F0F0] flex justify-end">
                  <Button 
                    onClick={handleContinue}
                    className="bg-[#738996] text-white hover:bg-[#738996]/90"
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
              <Card className="border border-[#E8E8E8] bg-white shadow-sm rounded-lg overflow-hidden mt-6">
                <CardHeader className="pb-3 pt-5 px-6 border-b border-[#F0F0F0]">
                  <div className="flex items-center">
                    <Bookmark className="h-5 w-5 text-[#ccb595] mr-2" />
                    <CardTitle className="text-lg font-medium font-serif text-[#333333]">
                      Cover Image
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex justify-center">
                  <img 
                    src={product.metadata.coverImage} 
                    alt={`Cover for ${product.title}`} 
                    className="max-h-[300px] rounded-md shadow-sm border border-[#E8E8E8]"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar with details */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border border-[#E8E8E8] bg-white shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-6 border-b border-[#F0F0F0]">
                <CardTitle className="text-lg font-medium font-serif text-[#333333]">
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-5">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-[#738996] mr-3" />
                    <div>
                      <p className="text-sm text-[#666666]">Created</p>
                      <p className="text-[#333333] font-medium">{formatDateTime(product.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-[#738996] mr-3" />
                    <div>
                      <p className="text-sm text-[#666666]">Last Updated</p>
                      <p className="text-[#333333] font-medium">{formatDateTime(product.updated_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-[#738996] mr-3" />
                    <div>
                      <p className="text-sm text-[#666666]">Author</p>
                      <p className="text-[#333333] font-medium">You</p>
                    </div>
                  </div>
                  
                  {/* Project ID if available */}
                  {product.project_id && (
                    <div className="flex items-center">
                      <Bookmark className="w-4 h-4 text-[#738996] mr-3" />
                      <div>
                        <p className="text-sm text-[#666666]">Project ID</p>
                        <p className="text-[#333333] font-medium text-sm truncate max-w-[200px]">{product.project_id}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Generation info if available */}
                  {product.metadata?.generationInfo && (
                    <div className="mt-6 pt-4 border-t border-[#F0F0F0]">
                      <h3 className="text-[#333333] font-medium mb-3">AI Generation</h3>
                      <div className="space-y-3">
                        {product.metadata.generationInfo.model && (
                          <div className="flex items-center">
                            <Wand2 className="w-4 h-4 text-[#ccb595] mr-3" />
                            <div>
                              <p className="text-sm text-[#666666]">Model</p>
                              <p className="text-[#333333]">{product.metadata.generationInfo.model}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Token usage if available */}
                        {(product.metadata.generationInfo.promptTokens || product.metadata.generationInfo.completionTokens) && (
                          <div className="bg-[#F9F7F4] rounded-lg p-3 mt-2">
                            <p className="text-sm font-medium text-[#333333] mb-2">Token Usage</p>
                            {product.metadata.generationInfo.promptTokens && (
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-[#666666]">Prompt Tokens:</span>
                                <span className="text-[#333333] font-medium">{product.metadata.generationInfo.promptTokens.toLocaleString()}</span>
                              </div>
                            )}
                            {product.metadata.generationInfo.completionTokens && (
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-[#666666]">Completion Tokens:</span>
                                <span className="text-[#333333] font-medium">{product.metadata.generationInfo.completionTokens.toLocaleString()}</span>
                              </div>
                            )}
                            {product.metadata.generationInfo.promptTokens && product.metadata.generationInfo.completionTokens && (
                              <div className="flex justify-between text-xs pt-1 border-t border-[#E8E8E8] mt-1">
                                <span className="text-[#666666]">Total:</span>
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
                  
                  {/* Action buttons */}
                  <div className="mt-6 pt-4 border-t border-[#F0F0F0]">
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        onClick={handleEdit}
                        variant="outline" 
                        className="w-full justify-center text-sm font-medium border-[#E8E8E8] text-[#555555] hover:bg-[#F5F5F5]"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Product
                      </Button>
                      <Button 
                        onClick={handleContinue}
                        className="w-full justify-center bg-[#738996] text-white hover:bg-[#738996]/90 text-sm font-medium"
                        disabled={product.status === 'complete' || product.status === 'published'}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Continue Editing
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
