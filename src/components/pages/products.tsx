import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "../layout/DashboardLayout";
import { 
  Eye, 
  Pencil, 
  Trash, 
  Play, 
  MoreHorizontal, 
  SearchIcon,
  SlidersHorizontal,
  BookText,
  FileText,
  PenTool,
  Plus,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Wand2
} from "lucide-react";
import { format } from "date-fns";
import { useProducts, Product } from "../../hooks/useProducts";

export default function ProductsPage() {
  const { products, isLoading, error, deleteProduct, refreshProducts } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Initialize filtered products when products are loaded
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  // Filter products when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = products.filter(
        product => 
          product.title.toLowerCase().includes(lowercaseQuery) || 
          product.type.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const handleDelete = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    if (!confirm(`Are you sure you want to delete "${product.title}"?`)) return;
    
    try {
      // If from projects table, warn user about potential data loss
      if (product.source === 'projects') {
        if (!confirm(`WARNING: This will delete the entire project and all associated data. This action cannot be undone. Continue?`)) {
          return;
        }
      }
      
      const success = await deleteProduct(id, product.source);
      if (!success) throw new Error("Failed to delete product");
    } catch (e) {
      console.error("Error deleting product:", e);
      alert("Failed to delete product. Please try again.");
    }
  };

  const handleEdit = (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    // Direct all products to the creator tool
    // This simplifies the routing logic and ensures consistent editing experience
    navigate(`/creator?id=${id}&mode=edit`);
  };

  const handleView = (id: string) => {
    const product = products.find(p => p.id === id);
    console.log("View product clicked:", id);
    
    if (!product) {
      console.warn("Product not found in state:", id);
      // Still try to navigate even if not in state
      navigate(`/products/${id}`);
      return;
    }
    
    // Navigate to the dedicated product detail page
    console.log("Navigating to product detail:", product.title);
    navigate(`/products/${id}`);
  };

  const handleContinue = (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    // Skip if product is already complete or published
    if (product.status === 'complete' || product.status === 'published') return;
    
    // For ebooks in progress, check for workflow metadata
    if (product.type === 'ebook') {
      // Determine the correct step to resume from
      // First check metadata.workflow_step, fallback to status if needed
      const resumeStep = product.metadata?.workflow_step ||
        (product.status === 'in_progress' ? 'ebook-writing' : 
         product.status === 'draft' ? 'brain-dump' : null);
      
      if (resumeStep) {
        console.log('Continuing ebook workflow at step:', resumeStep);
        
        // Store resumption data in session storage for the workflow to pick up
        // Clean up any existing data first
        sessionStorage.removeItem('resumeWorkflow');
        
        // Store the new resumption data
        sessionStorage.setItem('resumeWorkflow', JSON.stringify({
          productId: product.id,
          projectId: product.project_id,
          step: resumeStep,
          type: 'ebook',
          timestamp: Date.now() // Add timestamp for potential expiry checking
        }));
        
        // Navigate directly to the workflow with project ID
        if (product.project_id) {
          console.log(`Navigating to workflow/${product.project_id} to resume at ${resumeStep}`);
          navigate(`/workflow/${product.project_id}`);
          return;
        }
      }
    }
    
    // Default fallback - go to creator
    navigate(`/creator?id=${id}`);
  };

  // Format date safely
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (error) {
      console.error("Invalid date format:", dateStr);
      return "Unknown date";
    }
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
      error: { 
        bg: "bg-red-50", 
        text: "text-red-700",
        border: "border-red-100",
        dot: "bg-red-400",
        label: "Error"
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

  if (isLoading) {
    return (
      <DashboardLayout activeTab="Products">
        <div className="flex h-[60vh] w-full items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 animate-spin h-16 w-16 rounded-full border-4 border-accent-primary/10 border-t-accent-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BookText className="h-7 w-7 text-accent-primary/70" />
              </div>
            </div>
            <p className="text-ink-light font-serif text-base mt-4">Loading your products...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activeTab="Products">
        <div className="flex flex-col h-[60vh] w-full items-center justify-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="text-ink-dark font-serif text-center max-w-lg px-4 mb-4">
            <h3 className="text-xl font-display mb-2">Couldn't Load Products</h3>
            <p className="mb-4">{error}</p>
            {error.includes("Database table not found") && (
              <div className="mt-4 p-4 bg-accent-tertiary/5 rounded-md text-sm">
                <p className="mb-2"><strong>Administrator Note:</strong></p>
                <p>The database schema needs to be applied. Run the migration script to set up the required tables:</p>
                <pre className="bg-black/5 p-2 mt-2 rounded overflow-x-auto text-xs">
                  npx supabase migration up
                </pre>
                <p className="mt-2">Or apply the SQL in the new migration file manually in the Supabase dashboard.</p>
              </div>
            )}
          </div>
          <Button 
            onClick={() => refreshProducts()} 
            className="mt-4 bg-accent-primary text-white flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="Products">
      <div className="space-y-6 animate-fade-in">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h2 className="font-display text-2xl text-ink-dark/90 mb-1 font-medium">
              My Products
            </h2>
            <p className="font-serif text-ink-light/80 text-sm">Create, organize, and manage your content products</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => navigate('/products')}
              variant="outline" 
              className="px-3 py-1.5 text-sm font-serif border-accent-tertiary/20 hover:border-accent-tertiary/40 flex items-center"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 opacity-80" />
              Refresh
            </Button>
            <Button 
              onClick={() => navigate("/creator")}
              className="px-4 py-1.5 text-sm font-serif bg-accent-primary text-white rounded flex items-center hover:bg-accent-primary/90 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5 opacity-90" />
              Create New
            </Button>
          </div>
        </div>

        <Card className="bg-paper rounded-lg border border-accent-tertiary/10 shadow-sm overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-accent-tertiary/10 bg-cream/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="relative w-full md:w-72">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-light/60" />
                <Input
                  placeholder="Search products..."
                  className="pl-10 font-serif border-accent-tertiary/20 focus-visible:ring-accent-primary rounded-md bg-white/80 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 font-serif border-accent-tertiary/20 text-ink-light hover:text-ink-dark hover:bg-accent-tertiary/5 rounded-md px-3 py-2 shadow-sm"
                  onClick={() => refreshProducts()}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  <span>Refresh</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 font-serif border-accent-tertiary/20 text-ink-light hover:text-ink-dark hover:bg-accent-tertiary/5 rounded-md px-3 py-2 shadow-sm"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-1" />
                  <span>Filter</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredProducts.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-tertiary/5 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-accent-tertiary/60" />
                </div>
                <h3 className="text-xl font-display text-ink-dark mb-3">No products found</h3>
                <p className="text-ink-light font-serif mb-8 max-w-md mx-auto">
                  Create your first product to start organizing your content library. You can use the AI Creator for 
                  automated content generation or start with a simple Brain Dump to capture your ideas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <Button 
                    onClick={() => navigate("/creator")}
                    className="bg-accent-primary text-white hover:bg-accent-primary/90 font-serif rounded-md shadow-sm px-5 py-3 flex items-center justify-center flex-1"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    AI Creator
                  </Button>
                  <Button 
                    onClick={() => navigate("/brain-dump")}
                    variant="outline"
                    className="border-accent-tertiary/20 hover:border-accent-tertiary/40 hover:bg-accent-tertiary/5 font-serif rounded-md shadow-sm px-5 py-3 flex items-center justify-center flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Brain Dump
                  </Button>
                </div>
                <p className="text-ink-light/60 font-serif text-xs mt-6">
                  Need help getting started? <a href="/help" className="text-accent-primary underline">Check our guide</a>
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-accent-tertiary/10 bg-cream/40">
                      <TableHead className="font-display text-sm text-ink-dark/80 py-3 px-4">Title</TableHead>
                      <TableHead className="font-display text-sm text-ink-dark/80 py-3">Type</TableHead>
                      <TableHead className="font-display text-sm text-ink-dark/80 py-3">Status</TableHead>
                      <TableHead className="font-display text-sm text-ink-dark/80 py-3">Created</TableHead>
                      <TableHead className="font-display text-sm text-ink-dark/80 py-3">Updated</TableHead>
                      <TableHead className="text-right font-display text-sm text-ink-dark/80 py-3 pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow 
                        key={product.id} 
                        className="border-accent-tertiary/10 hover:bg-accent-primary/5 transition-colors cursor-pointer group" 
                        onClick={() => handleView(product.id)}
                      >
                        <TableCell className="font-serif text-ink-dark py-3.5 px-4 font-medium">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-accent-tertiary/5 flex items-center justify-center mr-3 group-hover:bg-accent-primary/10 transition-colors">
                              {product.type.includes('ebook') && <BookText className="h-4 w-4 text-accent-primary" />}
                              {product.type === 'brain_dump' && <FileText className="h-4 w-4 text-accent-tertiary" />}
                              {!product.type.includes('ebook') && product.type !== 'brain_dump' && <PenTool className="h-4 w-4 text-accent-secondary" />}
                            </div>
                            <span className="group-hover:text-accent-primary transition-colors truncate max-w-[250px]">{product.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-serif text-ink-light py-3.5">
                          <Badge variant="outline" className="font-serif text-xs px-2 py-0.5 bg-accent-tertiary/5 text-ink-light border-accent-tertiary/10 group-hover:bg-white/80 transition-colors">
                            {product.type === 'ebook' ? 'eBook' : 
                            product.type === 'brain_dump' ? 'Brain Dump' : 
                            product.type.charAt(0).toUpperCase() + product.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3.5">{renderStatusBadge(product.status)}</TableCell>
                        <TableCell className="font-serif text-ink-light py-3.5 text-sm">
                          {formatDate(product.created_at)}
                        </TableCell>
                        <TableCell className="font-serif text-ink-light py-3.5 text-sm">
                          {formatDate(product.updated_at)}
                        </TableCell>
                        <TableCell className="text-right py-3.5 pr-6" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 text-ink-light hover:text-ink-dark hover:bg-accent-tertiary/10 rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-paper border-accent-tertiary/20 shadow-md rounded-md p-1 min-w-40">
                              <DropdownMenuItem onClick={() => handleView(product.id)} className="font-serif cursor-pointer text-ink-dark hover:bg-accent-tertiary/5 rounded-sm p-2">
                                <Eye className="mr-2 h-4 w-4 text-ink-light" />
                                <span>View</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(product.id)} className="font-serif cursor-pointer text-ink-dark hover:bg-accent-tertiary/5 rounded-sm p-2">
                                <Pencil className="mr-2 h-4 w-4 text-ink-light" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              {product.status !== 'complete' && product.status !== 'published' && (
                                <DropdownMenuItem onClick={() => handleContinue(product.id)} className="font-serif cursor-pointer text-ink-dark hover:bg-accent-tertiary/5 rounded-sm p-2">
                                  <Play className="mr-2 h-4 w-4 text-accent-primary" />
                                  <span>Continue</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDelete(product.id)}
                                className="font-serif cursor-pointer text-accent-tertiary hover:bg-red-50 hover:text-red-600 rounded-sm p-2 mt-1 border-t border-accent-tertiary/10"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {filteredProducts.length > 0 && (
              <div className="px-4 py-3 text-center border-t border-accent-tertiary/10 bg-cream/30 flex items-center justify-between">
                <p className="font-serif text-xs text-ink-light/60">Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-accent-primary font-serif flex items-center p-0"
                  onClick={() => navigate("/creator")}
                >
                  <span>Create New Product</span>
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        {filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-paper dark:bg-gray-800 p-4 border border-accent-tertiary/10 dark:border-gray-700/80 shadow-sm">
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-accent-primary/5 rounded-full flex items-center justify-center mr-3">
                    <PenTool className="w-4 h-4 text-accent-primary/80" />
                  </div>
                  <div>
                    <p className="text-ink-dark font-display text-sm font-medium">Create Content</p>
                    <p className="text-ink-light/80 text-xs font-serif mt-0.5">Start a new AI-powered project</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto text-accent-primary"
                    onClick={() => navigate("/creator")}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-paper dark:bg-gray-800 p-4 border border-accent-tertiary/10 dark:border-gray-700/80 shadow-sm">
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-accent-tertiary/5 rounded-full flex items-center justify-center mr-3">
                    <FileText className="w-4 h-4 text-accent-tertiary/80" />
                  </div>
                  <div>
                    <p className="text-ink-dark font-display text-sm font-medium">Brain Dump</p>
                    <p className="text-ink-light/80 text-xs font-serif mt-0.5">Quickly capture and organize ideas</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto text-accent-tertiary"
                    onClick={() => navigate("/brain-dump")}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-paper dark:bg-gray-800 p-4 border border-accent-tertiary/10 dark:border-gray-700/80 shadow-sm">
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-accent-secondary/5 rounded-full flex items-center justify-center mr-3">
                    <BookText className="w-4 h-4 text-accent-secondary/80" />
                  </div>
                  <div>
                    <p className="text-ink-dark font-display text-sm font-medium">Templates</p>
                    <p className="text-ink-light/80 text-xs font-serif mt-0.5">Browse pre-built content templates</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto text-accent-secondary"
                    onClick={() => navigate("/templates")}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}