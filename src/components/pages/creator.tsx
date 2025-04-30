import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import CreateContentModal, { ContentData } from "../creator/CreateContentModal";
import { useBrainDumps } from "@/hooks/useBrainDumps";
import { useProducts, Product } from "@/hooks/useProducts";
import { format, formatDistanceToNow } from "date-fns";

const Creator = () => {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();
  const location = useLocation();
  const { resetWorkflow, setBrainDump, setBrainDumpFiles, setBrainDumpLinks } = useWorkflow();
  const { getBrainDumpById } = useBrainDumps();
  const [loading, setLoading] = useState(false);
  
  // Add the useProducts hook
  const { products, isLoading: isLoadingProducts, error: productsError, refreshProducts } = useProducts();
  
  // Force reload of products when component mounts
  useEffect(() => {
    console.log("Creator component mounted - refreshing products");
    // Small delay to ensure the hook is fully initialized
    const timer = setTimeout(() => {
      refreshProducts().then((result) => {
        console.log('Products refreshed, count:', result?.length || 0);
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Helper function to normalize product types - MOVED UP to avoid initialization error
  const normalizeProductType = (type: string | undefined): WorkflowType => {
    if (!type) return 'ebook'; // Default to ebook if no type
    
    // Convert to lowercase and remove spaces/special chars
    const normalized = type.toLowerCase().trim();
    
    // Handle common variations
    if (normalized.includes('ebook') || normalized.includes('e-book') || normalized === 'book') {
      return 'ebook';
    }
    if (normalized.includes('blog') || normalized.includes('post') || normalized.includes('article')) {
      return 'blog';
    }
    if (normalized.includes('social') || normalized.includes('media') || normalized.includes('post')) {
      return 'social';
    }
    if (normalized.includes('video') || normalized.includes('script')) {
      return 'video';
    }
    if (normalized.includes('course') || normalized.includes('lesson') || normalized.includes('class')) {
      return 'course';
    }
    
    // Log unrecognized types so we can add them in future
    console.log(`Unrecognized product type: "${type}" (normalized: "${normalized}")`);
    return 'ebook'; // Default to ebook for unknown types
  };
  
  // Get recent products - sort by updated_at and take the most recent 3
  const recentProducts = products.length > 0 
    ? products
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 3)
    : process.env.NODE_ENV === 'development' 
      ? [
          // Mock product for development if no real products exist
          {
            id: "mock-product-1",
            title: "Sample E-Book",
            type: "ebook",
            status: "draft",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: "current-user",
            metadata: { 
              summary: "This is a sample product to show how the UI works. Create real content to replace this." 
            }
          } as Product
        ]
      : [];
    
  // Add debugging to check what products we're getting
  console.log("Products from useProducts:", products.map(p => ({
    id: p.id, 
    title: p.title,
    type: p.type,
    normalizedType: normalizeProductType(p.type)
  })));
  
  // Sample templates for the gallery
  const templates = [
    {
      id: "1",
      title: "Blog Post",
      description: "Create engaging blog content with SEO optimization",
      category: "content",
      icon: <FileEdit className="h-10 w-10 text-accent-yellow" />,
      featured: true,
    },
    {
      id: "2",
      title: "E-Book (NEW!)",
      description:
        "Generate a complete digital book with our new AI-powered workflow",
      category: "ebook",
      icon: <BookOpen className="h-10 w-10 text-accent-yellow" />,
      featured: true,
    },
    {
      id: "3",
      title: "Video Script",
      description: "Create compelling scripts for video content",
      category: "video",
      icon: <Video className="h-10 w-10 text-accent-yellow" />,
      featured: false,
    },
    {
      id: "4",
      title: "Newsletter",
      description: "Design email newsletters with engaging content",
      category: "content",
      icon: <FileText className="h-10 w-10 text-accent-yellow" />,
      featured: false,
    },
    {
      id: "5",
      title: "Social Media Posts",
      description: "Generate posts for various social media platforms",
      category: "social",
      icon: <MessageSquare className="h-10 w-10 text-accent-yellow" />,
      featured: true,
    },
    {
      id: "6",
      title: "Online Course",
      description:
        "Create educational content organized into modules and lessons",
      category: "ebook",
      icon: <BookCopy className="h-10 w-10 text-accent-yellow" />,
      featured: false,
    },
    {
      id: "7",
      title: "Landing Page Content",
      description: "Craft compelling landing page copy that converts",
      category: "content",
      icon: <Layout className="h-10 w-10 text-accent-yellow" />,
      featured: false,
    },
    {
      id: "8",
      title: "Event Promotion",
      description: "Create promotional content for events and webinars",
      category: "social",
      icon: <Calendar className="h-10 w-10 text-accent-yellow" />,
      featured: false,
    },
  ];

  // Calculate progress for a product based on its status
  const getProductProgress = (product: Product): number => {
    switch (product.status) {
      case 'completed':
        return 100;
      case 'in_progress':
        return 75;
      case 'draft':
        return 25;
      default:
        // Get progress from metadata if available
        return product.metadata?.progress as number || 50;
    }
  };
  
  // Get appropriate icon for a product based on its type
  const getProductIcon = (product: Product) => {
    const normalizedType = normalizeProductType(product.type);
    
    switch (normalizedType) {
      case 'ebook':
        return <BookOpen className="h-4 w-4 text-accent-yellow" />;
      case 'blog':
        return <FileText className="h-4 w-4 text-accent-yellow" />;
      case 'social':
        return <Share2 className="h-4 w-4 text-accent-yellow" />;
      case 'video':
        return <Video className="h-4 w-4 text-accent-yellow" />;
      case 'course':
        return <BookCopy className="h-4 w-4 text-accent-yellow" />;
      default:
        return <FileText className="h-4 w-4 text-accent-yellow" />;
    }
  };
  
  // Format the date in a relative "time ago" format
  const formatTimeAgo = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "recently";
    }
  };
  
  // Handle clicking on a product in the recent creations list
  const handleContinueProduct = (product: Product) => {
    console.log('Continuing product:', product.id, product.type);
    
    // Check product status to determine if we should view or continue editing
    if (product.status === 'completed') {
      // For completed products, navigate to the product viewer page
      console.log(`Navigating to view completed product: ${product.id}`);
      navigate(`/products/${product.id}`);
    } else if (product.status === 'draft' || product.status === 'in_progress') {
      // For drafts or in-progress products, continue the workflow
      console.log(`Continuing workflow for in-progress product: ${product.id}`);
      
      const workflowType = normalizeProductType(product.type);
      console.log(`Normalized product type from "${product.type}" to "${workflowType}"`);
      
      // If the product has a specific workflow step saved, pass it to resetWorkflow
      if (product.workflow_step) {
        // Navigate to the correct workflow with the specific step
        console.log(`Resuming at workflow step: ${product.workflow_step}`);
        navigate(`/workflow/${workflowType}/${product.id}?step=${product.workflow_step}`);
      } else {
        // Start the workflow for this product from the beginning
        resetWorkflow(workflowType, product.id);
      }
    } else {
      // For any other status, default to viewing the product
      console.log(`Navigating to product with unknown status: ${product.id}`);
      navigate(`/products/${product.id}`);
    }
  };

  const featuredTemplates = templates.filter(template => template.featured);
  
  const filteredTemplates =
    activeFilter === "all"
      ? templates
      : templates.filter((template) => template.category === activeFilter);

  const handleCreateContent = (data: ContentData) => {
    console.log('Creator handleCreateContent called with data:', data);
    // Map from ContentData.contentType to WorkflowType
    const contentTypeToWorkflowType = (contentType: string): WorkflowType => {
      // Log the contentType we're trying to map
      console.log('Mapping content type:', contentType);
      
      // Convert the content type string to a valid WorkflowType
      let workflowType: WorkflowType;
      switch (contentType) {
        case 'e-book': 
          workflowType = 'ebook';
          break;
        case 'online-course': 
          workflowType = 'course';
          break;
        case 'blog-post': 
          workflowType = 'blog';
          break;
        case 'video-script': 
          workflowType = 'video';
          break;
        case 'social-media': 
          workflowType = 'social';
          break;
        default: 
          console.warn(`Unknown content type: ${contentType}, defaulting to 'ebook'`);
          workflowType = 'ebook';
          break;
      }
      
      console.log(`Mapped ${contentType} to workflow type: ${workflowType}`);
      return workflowType;
    };

    // Note: contentType is already stored in the CreateContentModal component
    
    // Make sure the content type is properly typed
    const contentType = data.contentType as 'e-book' | 'online-course' | 'blog-post' | 'video-script' | 'newsletter' | 'social-media';
    console.log('Content type from form:', contentType);
    
    // Map the content type to workflow type
    const workflowType = contentTypeToWorkflowType(contentType);
    
    // Use the mapped workflow type
    console.log(`Starting workflow with type: ${workflowType}`);
    
    // Force the type to be the correct string literal type
    const typedWorkflowType: WorkflowType = workflowType;
    
    try {
      console.log('About to reset workflow with type:', typedWorkflowType);
      
      // First close the modal to avoid any UI conflicts
      setOpen(false);
      
      // Short delay before navigation to ensure modal is closed 
      setTimeout(() => {
        resetWorkflow(typedWorkflowType);
        // Navigation is handled automatically by the resetWorkflow function
        console.log('Workflow reset complete, navigation should happen automatically');
      }, 100);
      
    } catch (error) {
      console.error('Error starting workflow:', error);
      alert('There was an error starting the workflow. Please try again.');
    }
  };

  // Check if there's a brain dump ID in the URL
  useEffect(() => {
    const loadBrainDump = async () => {
      const params = new URLSearchParams(location.search);
      const brainDumpId = params.get('brainDumpId');
      
      // Also check sessionStorage (in case we're coming from the brain-dumps page)
      const sessionBrainDumpId = sessionStorage.getItem('use_brain_dump');
      
      // Clear the session storage value after reading it
      if (sessionBrainDumpId) {
        sessionStorage.removeItem('use_brain_dump');
      }
      
      const id = brainDumpId || sessionBrainDumpId;
      
      if (!id) return;
      
      try {
        setLoading(true);
        const brainDump = await getBrainDumpById(id);
        
        if (!brainDump) {
          console.error('Brain dump not found:', id);
          return;
        }
        
        // Set brain dump content in workflow context
        setBrainDump(brainDump.content || '');
        
        // Set files and links if available in metadata
        if (brainDump.metadata) {
          if (brainDump.metadata.files && Array.isArray(brainDump.metadata.files)) {
            setBrainDumpFiles(brainDump.metadata.files);
          }
          
          if (brainDump.metadata.links && Array.isArray(brainDump.metadata.links)) {
            setBrainDumpLinks(brainDump.metadata.links);
          }
        }
        
        // Show success message
        const successToast = document.createElement('div');
        successToast.className = 'fixed bottom-4 right-4 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg shadow-md border border-emerald-100 z-50 animate-fade-in';
        successToast.innerHTML = `<div class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polyline points="20 6 9 17 4 12"></polyline></svg>Brain dump "${brainDump.title}" loaded successfully</div>`;
        document.body.appendChild(successToast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
          successToast.classList.add('animate-fade-out');
          setTimeout(() => successToast.remove(), 300);
        }, 3000);
        
      } catch (err) {
        console.error('Error loading brain dump:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadBrainDump();
  }, [location.search]);

  // Get a formatted display name for a product type
  const getProductTypeLabel = (product: Product): string => {
    const normalizedType = normalizeProductType(product.type);
    
    switch (normalizedType) {
      case 'ebook':
        return 'E-Book';
      case 'blog':
        return 'Blog Post';
      case 'social':
        return 'Social Media';
      case 'video':
        return 'Video Script';
      case 'course':
        return 'Online Course';
      default:
        // If we can't normalize it, return the original with proper capitalization
        return product.type ? 
          product.type.charAt(0).toUpperCase() + product.type.slice(1) : 
          'Content';
    }
  };

  return (
    <DashboardLayout activeTab="Creator">
      <div className="space-y-8 animate-fade-in">
        {/* Hero section */}
        <div className="bg-gradient-to-br from-accent-yellow/10 to-cream dark:from-accent-yellow/15 dark:to-background rounded-xl p-6 md:p-8 shadow-sm dark:shadow-md mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-lg">
              <h1 className="text-3xl font-display text-ink-dark dark:text-ink-dark mb-3">AI Creator Studio</h1>
              <p className="text-ink-light dark:text-ink-light font-serif text-[15px] mb-4">
                Transform your ideas into polished content with the power of AI assistance.
                Try our <span className="font-medium text-accent-yellow dark:text-accent-yellow">NEW eBook Workflow</span> for creating professional eBooks!
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="gap-2 bg-accent-primary dark:bg-accent-primary hover:bg-accent-secondary dark:hover:bg-accent-secondary text-white font-serif px-6 py-5 text-[15px] shadow-blue-sm dark:shadow-md"
                  onClick={() => setOpen(true)}
                >
                  <Wand2 className="h-5 w-5" />
                  Create New Content
                </Button>
                <Button
                  className="gap-2 bg-white dark:bg-card hover:bg-white/90 dark:hover:bg-card/90 text-accent-primary dark:text-accent-primary border border-accent-primary/30 dark:border-accent-primary/40 font-serif px-6 py-5 text-[15px] shadow-sm dark:shadow-md"
                  onClick={() => {
                    console.log('Starting ebook workflow from hero section');
                    const workflowType: WorkflowType = 'ebook';
                    console.log('Using workflow type:', workflowType);
                    resetWorkflow(workflowType);
                  }}
                >
                  <BookOpen className="h-5 w-5" />
                  Try eBook Workflow
                </Button>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative w-48 h-48 flex-shrink-0">
                <div className="absolute w-full h-full bg-accent-primary/20 dark:bg-accent-primary/30 rounded-full animate-pulse-slow"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-16 w-16 text-accent-primary dark:text-accent-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured templates section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display text-ink-dark dark:text-ink-dark">Featured Templates</h2>
            <Button 
              variant="ghost" 
              className="text-accent-primary dark:text-accent-primary hover:text-accent-secondary dark:hover:text-accent-secondary/90 font-serif text-[14px]"
              onClick={() => setActiveFilter("all")}
            >
              View All Templates
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredTemplates.map((template) => (
              <Card 
                key={template.id}
                className="bg-white dark:bg-card border border-accent-tertiary/30 dark:border-accent-tertiary/40 shadow-sm dark:shadow-md hover:shadow-md dark:hover:shadow-lg transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-cream dark:bg-accent-tertiary/30 p-3 rounded-lg">
                      {template.icon}
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-ink-dark dark:text-ink-dark mb-1">
                        {template.title}
                      </h3>
                      <p className="text-[14px] text-ink-light dark:text-ink-light font-serif mb-4">
                        {template.description}
                      </p>
                      <Button 
                        className="bg-accent-primary dark:bg-accent-primary hover:bg-accent-secondary dark:hover:bg-accent-secondary text-white font-serif w-full shadow-blue-sm dark:shadow-md text-[14px]"
                        onClick={() => {
                          if (template.category === 'ebook') {
                            console.log('Starting ebook workflow from featured template');
                            const workflowType: WorkflowType = 'ebook';
                            console.log('Template category:', template.category, '-> WorkflowType:', workflowType);
                            resetWorkflow(workflowType);
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display text-ink-dark dark:text-ink-dark">Recent Creations</h2>
            <Button 
              onClick={refreshProducts}
              variant="ghost" 
              className="text-accent-primary dark:text-accent-primary hover:text-accent-secondary dark:hover:text-accent-secondary/90 font-serif text-[14px] flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
          <div className="bg-white dark:bg-card rounded-lg border border-accent-tertiary/30 dark:border-accent-tertiary/40 shadow-sm dark:shadow-md overflow-hidden">
            {isLoadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 text-accent-primary animate-spin" />
                  <p className="text-ink-light dark:text-ink-light/80 font-serif text-sm">Loading recent content...</p>
                </div>
              </div>
            ) : productsError ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3 max-w-md text-center px-4">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  <p className="text-ink-dark dark:text-ink-dark font-serif text-sm">{productsError}</p>
                  <Button 
                    onClick={refreshProducts}
                    size="sm" 
                    variant="outline" 
                    className="mt-2 text-accent-primary dark:text-accent-primary border-accent-primary/30 dark:border-accent-primary/40 font-serif"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Try Again
                  </Button>
                </div>
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="py-8 text-center">
                <div className="flex flex-col items-center gap-3 max-w-md mx-auto px-4">
                  <div className="w-12 h-12 rounded-full bg-accent-tertiary/10 dark:bg-accent-tertiary/20 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-accent-tertiary/70 dark:text-accent-tertiary/80" />
                  </div>
                  <p className="text-ink-dark dark:text-ink-dark font-display text-lg">No content yet</p>
                  <p className="text-ink-light dark:text-ink-light/80 font-serif text-sm">
                    {productsError 
                      ? "There was a problem loading your content. Please try refreshing."
                      : "Create your first piece of content to see it here."}
                  </p>
                  {/* Add debug info for development - can be removed in production */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-left w-full">
                      <p className="text-amber-800 text-xs font-medium mb-1">Debug Info:</p>
                      <p className="text-amber-700 text-xs">Products found: {products.length}</p>
                      <p className="text-amber-700 text-xs">Loading state: {isLoadingProducts ? 'true' : 'false'}</p>
                      <p className="text-amber-700 text-xs">Error: {productsError || 'none'}</p>
                      <p className="text-amber-700 text-xs">Auth check: {localStorage.getItem('supabase.auth.token') ? 'Auth token exists' : 'No auth token'}</p>
                      <p className="text-amber-700 text-xs font-mono mt-1">
                        Types: {products.map(p => p.type || 'unknown').join(', ')}
                      </p>
                    </div>
                  )}
                  {productsError ? (
                    <div className="mt-3 mb-2 p-3 bg-red-50 border border-red-200 rounded-md text-left w-full">
                      <p className="text-red-700 text-xs font-semibold">{productsError}</p>
                      <p className="text-red-600 text-xs mt-1">Please try refreshing or signing out and back in.</p>
                    </div>
                  ) : null}
                  <Button 
                    onClick={() => setOpen(true)}
                    className="mt-2 bg-accent-primary dark:bg-accent-primary text-white font-serif"
                  >
                    <Wand2 className="h-4 w-4 mr-1.5" />
                    Create Content
                  </Button>
                  <Button 
                    onClick={refreshProducts}
                    variant="outline"
                    size="sm" 
                    className="mt-1 text-accent-primary dark:text-accent-primary border-accent-primary/30 dark:border-accent-primary/40 font-serif text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh Products
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-accent-tertiary/20 dark:divide-accent-tertiary/30">
                {recentProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="p-4 hover:bg-cream/30 dark:hover:bg-accent-tertiary/20 transition-colors duration-200 cursor-pointer"
                    onClick={() => handleContinueProduct(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-cream dark:bg-accent-tertiary/30 p-2 rounded-md">
                          {getProductIcon(product)}
                        </div>
                        <div>
                          <h3 className="font-serif font-medium text-ink-dark dark:text-ink-dark text-[15px]">{product.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-ink-light dark:text-ink-light mt-1">
                            <span>{getProductTypeLabel(product)}</span>
                            <span className="h-1 w-1 bg-ink-faded dark:bg-ink-faded rounded-full"></span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {formatTimeAgo(product.updated_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-cream dark:bg-accent-tertiary/30 rounded-full h-2">
                          <div 
                            className="bg-accent-primary dark:bg-accent-primary h-2 rounded-full" 
                            style={{ width: `${getProductProgress(product)}%` }}
                          ></div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-accent-primary dark:text-accent-primary hover:bg-accent-primary/10 dark:hover:bg-accent-primary/20 text-[14px]"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent div's onClick
                            handleContinueProduct(product);
                          }}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* All templates section */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-display text-ink-dark dark:text-ink-dark">All Templates</h2>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faded dark:text-ink-faded h-4 w-4" />
                <Input placeholder="Search templates..." className="pl-10 font-serif bg-cream/50 dark:bg-accent-tertiary/20 border-accent-tertiary/30 dark:border-accent-tertiary/40 shadow-sm dark:shadow-none text-[14px] text-ink-dark dark:text-ink-dark placeholder:text-ink-faded dark:placeholder:text-ink-faded" />
              </div>

              <Tabs
                defaultValue="all"
                className="w-full md:w-auto"
                onValueChange={setActiveFilter}
                value={activeFilter}
              >
                <TabsList className="grid grid-cols-5 w-full md:w-auto bg-cream/50 dark:bg-accent-tertiary/20 border border-accent-tertiary/30 dark:border-accent-tertiary/40">
                  <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-accent-primary dark:data-[state=active]:text-accent-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-primary dark:data-[state=active]:border-accent-primary font-serif text-[14px] text-ink-light dark:text-ink-light">All</TabsTrigger>
                  <TabsTrigger value="content" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-accent-primary dark:data-[state=active]:text-accent-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-primary dark:data-[state=active]:border-accent-primary font-serif text-[14px] text-ink-light dark:text-ink-light">Content</TabsTrigger>
                  <TabsTrigger value="ebook" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-accent-primary dark:data-[state=active]:text-accent-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-primary dark:data-[state=active]:border-accent-primary font-serif text-[14px] text-ink-light dark:text-ink-light">E-Books</TabsTrigger>
                  <TabsTrigger value="social" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-accent-primary dark:data-[state=active]:text-accent-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-primary dark:data-[state=active]:border-accent-primary font-serif text-[14px] text-ink-light dark:text-ink-light">Social</TabsTrigger>
                  <TabsTrigger value="video" className="data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-accent-primary dark:data-[state=active]:text-accent-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-primary dark:data-[state=active]:border-accent-primary font-serif text-[14px] text-ink-light dark:text-ink-light">Video</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white dark:bg-card p-6 rounded-lg border border-accent-tertiary/30 dark:border-accent-tertiary/40 shadow-sm dark:shadow-md hover:shadow-md dark:hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-cream dark:bg-accent-tertiary/30 p-3 rounded-lg">
                      {template.icon}
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-ink-dark dark:text-ink-dark">
                        {template.title}
                      </h3>
                      <p className="text-[14px] text-ink-light dark:text-ink-light mt-1 font-serif">
                        {template.description}
                      </p>
                      <Button 
                        className="mt-4 bg-accent-primary dark:bg-accent-primary hover:bg-accent-secondary dark:hover:bg-accent-secondary text-white font-serif shadow-blue-sm dark:shadow-md text-[14px]"
                        onClick={() => {
                          if (template.category === 'ebook') {
                            console.log('Starting ebook workflow from all templates');
                            const workflowType: WorkflowType = 'ebook';
                            console.log('Template category:', template.category, '-> WorkflowType:', workflowType);
                            resetWorkflow(workflowType);
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
            <div className="text-center py-12 bg-white dark:bg-card rounded-lg border border-accent-tertiary/30 dark:border-accent-tertiary/40 shadow-sm dark:shadow-md">
              <Sparkles className="h-12 w-12 mx-auto text-ink-faded dark:text-ink-faded/70 mb-4" />
              <h3 className="text-xl font-display text-ink-dark dark:text-ink-dark mb-2">
                No templates found
              </h3>
              <p className="text-ink-light dark:text-ink-light max-w-md mx-auto mb-6 font-serif">
                We couldn't find any templates matching your search criteria.
                Try adjusting your filters or search term.
              </p>
              <Button
                variant="outline"
                onClick={() => setActiveFilter("all")}
                className="mx-auto font-serif border-accent-primary/30 dark:border-accent-primary/40 text-accent-primary dark:text-accent-primary hover:bg-accent-primary/5 dark:hover:bg-accent-primary/20"
              >
                View All Templates
              </Button>
            </div>
          )}
        </section>

        <div className="bg-cream/50 dark:bg-accent-tertiary/10 p-6 rounded-lg border border-accent-primary/20 dark:border-accent-primary/30 shadow-sm dark:shadow-md">
          <div className="flex items-start gap-4">
            <div className="bg-accent-primary/20 dark:bg-accent-primary/30 p-3 rounded-full">
              <Star className="h-6 w-6 text-accent-primary dark:text-accent-primary" />
            </div>
            <div>
              <h3 className="text-lg font-display text-ink-dark dark:text-ink-dark mb-2">
                Pro Tips for Better Content
              </h3>
              <ul className="text-ink-light dark:text-ink-light font-serif space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary dark:text-accent-primary font-medium">•</span>
                  <span>Provide detailed instructions in your content description for more tailored results.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary dark:text-accent-primary font-medium">•</span>
                  <span>Use the Brain Dump feature to organize your thoughts before generating content.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary dark:text-accent-primary font-medium">•</span>
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
