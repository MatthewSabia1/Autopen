import { useState, useEffect, useMemo } from "react";
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
  Wand2,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { useProducts, Product } from "../../hooks/useProducts";

export default function ProductsPage() {
  const { products, isLoading, error, deleteProduct, refreshProducts } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [actionInProgress, setActionInProgress] = useState<{id: string, action: string} | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const currentProducts = products || [];
    
    if (!searchQuery.trim()) {
      return currentProducts;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    return currentProducts.filter(
      product => 
        product.title.toLowerCase().includes(lowercaseQuery) || 
        product.type.toLowerCase().includes(lowercaseQuery)
    );
  }, [products, searchQuery]);

  const handleDelete = async (id: string) => {
    console.log("Delete handler called for product ID:", id);
    
    const product = products.find(p => p.id === id);
    if (!product) {
      console.error("Product not found for deletion:", id);
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${product.title}"?`)) return;
    
    try {
      // Set loading state
      setActionInProgress({id, action: 'delete'});
      console.log("Delete action in progress for:", product.title);
      
      if (product.source === 'projects') {
        if (!confirm(`WARNING: This will delete the entire project and all associated data. This action cannot be undone. Continue?`)) {
          setActionInProgress(null);
          return;
        }
      }
      
      const success = await deleteProduct(id, product.source);
      if (!success) throw new Error("Failed to delete product");
      
      console.log("Product successfully deleted:", product.title);
      
      // Show success message (temporary visual feedback)
      const successToast = document.createElement('div');
      successToast.className = 'fixed bottom-4 right-4 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg shadow-md border border-emerald-100 z-50 animate-fade-in';
      successToast.innerHTML = `<div class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polyline points="20 6 9 17 4 12"></polyline></svg>Product "${product.title}" has been deleted</div>`;
      document.body.appendChild(successToast);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        successToast.classList.add('animate-fade-out');
        setTimeout(() => successToast.remove(), 300);
      }, 3000);
      
    } catch (e) {
      console.error("Error deleting product:", e);
      alert("Failed to delete product. Please try again.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleEdit = (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) {
      console.error("Product not found for editing:", id);
      return;
    }
    
    setActionInProgress({id, action: 'edit'});
    
    console.log("Navigating to edit page for:", product.title);
    navigate(`/creator?id=${id}&mode=edit`);
  };

  const handleView = (id: string) => {
    const product = products.find(p => p.id === id);
    setActionInProgress({id, action: 'view'});
    
    if (!product) {
      console.warn("Product not found in state for viewing:", id);
      console.log("Navigating to product detail by ID only");
      navigate(`/products/${id}`);
      return;
    }
    
    console.log("Navigating to product detail:", product.title);
    navigate(`/products/${id}`);
  };

  const handleContinue = (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) {
      console.error("Product not found for continue action:", id);
      return;
    }
    
    if (product.status === 'complete' || product.status === 'published') {
      console.log("Product already complete/published, ignoring continue action");
      return;
    }
    
    setActionInProgress({id, action: 'continue'});
    
    if (product.type === 'ebook') {
      const resumeStep = product.metadata?.workflow_step ||
        (product.status === 'in_progress' ? 'ebook-writing' : 
         product.status === 'draft' ? 'brain-dump' : null);
      
      if (resumeStep) {
        console.log('Continuing ebook workflow at step:', resumeStep);
        
        sessionStorage.removeItem('resumeWorkflow');
        
        sessionStorage.setItem('resumeWorkflow', JSON.stringify({
          productId: product.id,
          projectId: product.project_id,
          step: resumeStep,
          type: 'ebook',
          timestamp: Date.now()
        }));
        
        if (product.project_id) {
          console.log(`Navigating to workflow/${product.project_id} to resume at ${resumeStep}`);
          navigate(`/workflow/${product.project_id}`);
          return;
        }
      }
    }
    
    console.log("Navigating to creator for continue action:", product.title);
    navigate(`/creator?id=${id}`);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (error) {
      console.error("Invalid date format:", dateStr);
      return "Unknown date";
    }
  };

  const renderStatusBadge = (status: string) => {
    let normalizedStatus = status;
    if (status === "in_progress") normalizedStatus = "inProgress";
    if (status === "pending") normalizedStatus = "inProgress";
    if (status === "processing") normalizedStatus = "generating";
    
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
    
    const variant = variants[normalizedStatus as keyof typeof variants] || variants.draft;
    
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

  const getProductIcon = (type: string) => {
    if (type.includes('ebook')) return <BookText className="h-4 w-4 text-[#738996] dark:text-accent-primary" />;
    if (type === 'brain_dump') return <FileText className="h-4 w-4 text-[#ccb595] dark:text-accent-yellow" />;
    return <PenTool className="h-4 w-4 text-[#738996] dark:text-accent-primary" />;
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
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 dark:text-red-400">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="text-ink-dark dark:text-ink-dark font-serif text-center max-w-lg px-4 mb-4">
            <h3 className="text-xl font-display mb-2">Couldn't Load Products</h3>
            <p className="mb-4 dark:text-ink-light">{error}</p>
            {error.includes("Database table not found") && (
              <div className="mt-4 p-4 bg-accent-tertiary/5 dark:bg-accent-tertiary/10 rounded-md text-sm">
                <p className="mb-2"><strong>Administrator Note:</strong></p>
                <p>The database schema needs to be applied. Run the migration script to set up the required tables:</p>
                <pre className="bg-black/5 dark:bg-black/20 p-2 mt-2 rounded overflow-x-auto text-xs">
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h2 className="font-display text-2xl text-ink-dark dark:text-ink-dark/90 mb-1 font-medium">
              My Products
            </h2>
            <p className="font-serif text-ink-light dark:text-ink-light/80 text-sm">Create, organize, and manage your content products</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => navigate('/products')}
              variant="outline" 
              className="px-3 py-1.5 text-sm font-serif border-accent-tertiary/20 dark:border-accent-tertiary/30 hover:border-accent-tertiary/40 dark:hover:border-accent-tertiary/50 text-ink-dark dark:text-ink-dark flex items-center"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 opacity-80" />
              Refresh
            </Button>
            <Button 
              onClick={() => navigate("/creator")}
              className="px-4 py-1.5 text-sm font-serif bg-accent-primary dark:bg-accent-primary text-white rounded flex items-center hover:bg-accent-primary/90 dark:hover:bg-accent-primary/90 transition-colors shadow-sm dark:shadow-md"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5 opacity-90" />
              Create New
            </Button>
          </div>
        </div>

        <Card className="bg-paper dark:bg-card rounded-lg border border-[#E8E8E8] dark:border-accent-tertiary/40 shadow-sm dark:shadow-md hover:shadow-blue-sm dark:hover:shadow-lg transition-all duration-300 overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-[#F0F0F0] dark:border-accent-tertiary/30 bg-[#FAF9F5] dark:bg-card/80">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="relative w-full md:w-72">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#666666]/60 dark:text-ink-light/60" />
                <Input
                  placeholder="Search products..."
                  className="pl-10 font-serif border-[#E8E8E8] dark:border-accent-tertiary/40 focus-visible:ring-[#738996] dark:focus-visible:ring-accent-primary rounded-md bg-white dark:bg-card/90 shadow-xs dark:shadow-none text-ink-dark dark:text-ink-dark"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 font-serif font-medium border-[#E8E8E8] dark:border-accent-tertiary/40 text-[#666666] dark:text-ink-light hover:text-[#333333] dark:hover:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 hover:border-[#738996]/30 dark:hover:border-accent-primary/30 rounded-md px-3 py-2 shadow-xs dark:shadow-none transition-all duration-300"
                  onClick={() => refreshProducts()}
                >
                  <RefreshCw className="h-4 w-4 mr-1 group-hover:rotate-180 transition-transform duration-700" />
                  <span>Refresh</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 font-serif font-medium border-[#E8E8E8] dark:border-accent-tertiary/40 text-[#666666] dark:text-ink-light hover:text-[#333333] dark:hover:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 hover:border-[#738996]/30 dark:hover:border-accent-primary/30 rounded-md px-3 py-2 shadow-xs dark:shadow-none transition-all duration-300"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-1" />
                  <span>Filter</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {!products || products.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#F5F5F5] dark:bg-accent-tertiary/20 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-[#CCCCCC] dark:text-accent-tertiary/70" />
                </div>
                <h3 className="text-xl font-display text-[#333333] dark:text-ink-dark mb-3">No products found</h3>
                <p className="text-[#666666] dark:text-ink-light font-serif mb-8 max-w-md mx-auto">
                  Create your first product to start organizing your content library. You can use the AI Creator for 
                  automated content generation or start with a simple Brain Dump to capture your ideas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <Button 
                    onClick={() => navigate("/creator")}
                    className="bg-[#738996] dark:bg-accent-primary text-white hover:bg-[#738996]/90 dark:hover:bg-accent-primary/90 font-serif rounded-md shadow-sm dark:shadow-md hover:shadow-blue-sm dark:hover:shadow-lg px-5 py-3 flex items-center justify-center flex-1 transition-all duration-300"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    AI Creator
                  </Button>
                  <Button 
                    onClick={() => navigate("/brain-dump")}
                    variant="outline"
                    className="border-[#E8E8E8] dark:border-accent-tertiary/40 hover:border-[#738996]/30 dark:hover:border-accent-primary/40 hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 font-serif rounded-md shadow-sm dark:shadow-none px-5 py-3 flex items-center justify-center flex-1 transition-all duration-300 text-ink-dark dark:text-ink-dark"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Brain Dump
                  </Button>
                </div>
                <p className="text-[#888888] dark:text-ink-light/70 font-serif text-xs mt-6">
                  Need help getting started? <a href="/help" className="text-[#738996] dark:text-accent-primary underline">Check our guide</a>
                </p>
              </div>
            ) : searchQuery && filteredProducts.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5F5F5] dark:bg-accent-tertiary/20 flex items-center justify-center">
                  <SearchIcon className="w-7 h-7 text-[#CCCCCC] dark:text-accent-tertiary/70" />
                </div>
                <h3 className="text-xl font-display text-[#333333] dark:text-ink-dark mb-2">No matching products</h3>
                <p className="text-[#666666] dark:text-ink-light font-serif mb-6 max-w-md mx-auto">
                  No products match your search query: "{searchQuery}"
                </p>
                <Button 
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                  className="border-[#E8E8E8] dark:border-accent-tertiary/40 hover:border-[#738996]/30 dark:hover:border-accent-primary/40 hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 font-serif shadow-xs dark:shadow-none transition-all duration-300 text-ink-dark dark:text-ink-dark"
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#F0F0F0] dark:border-accent-tertiary/30 bg-[#FAF9F5] dark:bg-card/80">
                      <TableHead className="font-display text-sm text-[#333333] dark:text-ink-dark py-4 px-5 font-medium">Title</TableHead>
                      <TableHead className="font-display text-sm text-[#333333] dark:text-ink-dark py-4 font-medium">Type</TableHead>
                      <TableHead className="font-display text-sm text-[#333333] dark:text-ink-dark py-4 font-medium">Status</TableHead>
                      <TableHead className="font-display text-sm text-[#333333] dark:text-ink-dark py-4 font-medium">Created</TableHead>
                      <TableHead className="font-display text-sm text-[#333333] dark:text-ink-dark py-4 font-medium">Updated</TableHead>
                      <TableHead className="text-right font-display text-sm text-[#333333] dark:text-ink-dark py-4 pr-6 font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow 
                        key={product.id} 
                        className="border-[#F0F0F0] dark:border-accent-tertiary/30 hover:bg-[#738996]/5 dark:hover:bg-accent-primary/10 transition-all duration-300 cursor-pointer group" 
                        onClick={() => handleView(product.id)}
                      >
                        <TableCell className="font-serif text-[#333333] dark:text-ink-dark py-4 px-5 font-medium">
                          <div className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-[#F5F5F5] dark:bg-accent-tertiary/20 flex items-center justify-center mr-3 group-hover:bg-[#738996]/10 dark:group-hover:bg-accent-primary/20 transition-colors duration-300">
                              {product.type.includes('ebook') && <BookText className="h-4 w-4 text-[#738996] dark:text-accent-primary" />}
                              {product.type === 'brain_dump' && <FileText className="h-4 w-4 text-[#ccb595] dark:text-accent-yellow" />}
                              {!product.type.includes('ebook') && product.type !== 'brain_dump' && <PenTool className="h-4 w-4 text-[#5e7282] dark:text-accent-secondary" />}
                            </div>
                            <span className="group-hover:text-[#738996] dark:group-hover:text-accent-primary transition-colors duration-300 truncate max-w-[250px]">{product.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-serif text-[#666666] dark:text-ink-light py-4">
                          <Badge className="font-serif text-xs px-2 py-0.5 bg-[#F9F5ED] dark:bg-accent-yellow/15 text-[#ccb595] dark:text-accent-yellow border-[#ccb595] dark:border-accent-yellow/50 border shadow-xs dark:shadow-none group-hover:bg-white/90 dark:group-hover:bg-card/90 transition-colors duration-300">
                            {product.type === 'ebook' ? 'eBook' : 
                            product.type === 'brain_dump' ? 'Brain Dump' : 
                            product.type.charAt(0).toUpperCase() + product.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">{renderStatusBadge(product.status)}</TableCell>
                        <TableCell className="font-serif text-[#666666] dark:text-ink-light py-4 text-sm">
                          {formatDate(product.created_at)}
                        </TableCell>
                        <TableCell className="font-serif text-[#666666] dark:text-ink-light py-4 text-sm">
                          {formatDate(product.updated_at)}
                        </TableCell>
                        <TableCell className="text-right py-4 pr-6" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu open={openMenuId === product.id} onOpenChange={(open) => {
                            if (open) {
                              setOpenMenuId(product.id);
                            } else if (!actionInProgress || actionInProgress.id !== product.id) {
                              setOpenMenuId(null);
                            }
                          }}>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-[#666666] dark:text-ink-light hover:text-[#333333] dark:hover:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 rounded-full transition-all duration-300"
                                aria-label="Actions for this product"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === product.id ? null : product.id);
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end" 
                              className="bg-white dark:bg-card border-[#E8E8E8] dark:border-accent-tertiary/40 shadow-md dark:shadow-lg rounded-lg p-1.5 min-w-40"
                              onCloseAutoFocus={(e) => e.preventDefault()}
                              onPointerDownOutside={(e) => {
                                if (actionInProgress && actionInProgress.id === product.id) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <DropdownMenuItem
                                className="font-serif cursor-pointer text-[#333333] dark:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 rounded-md p-2.5 transition-all duration-300 focus:bg-[#F5F5F5] dark:focus:bg-accent-tertiary/20 focus:outline-none"
                                disabled={actionInProgress?.id === product.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleView(product.id);
                                }}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  if (actionInProgress?.id === product.id) {
                                    // Don't close the dropdown if an action is in progress
                                    e.preventDefault();
                                  }
                                }}
                              >
                                {actionInProgress?.id === product.id && actionInProgress?.action === 'view' ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#738996] dark:text-accent-primary" />
                                    <span>Opening...</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4 text-[#666666] dark:text-ink-light" />
                                    <span>View</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem
                                className="font-serif cursor-pointer text-[#333333] dark:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 rounded-md p-2.5 transition-all duration-300 focus:bg-[#F5F5F5] dark:focus:bg-accent-tertiary/20 focus:outline-none"
                                disabled={actionInProgress?.id === product.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEdit(product.id);
                                }}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  if (actionInProgress?.id === product.id) {
                                    // Don't close the dropdown if an action is in progress
                                    e.preventDefault();
                                  }
                                }}
                              >
                                {actionInProgress?.id === product.id && actionInProgress?.action === 'edit' ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#738996] dark:text-accent-primary" />
                                    <span>Opening editor...</span>
                                  </>
                                ) : (
                                  <>
                                    <Pencil className="mr-2 h-4 w-4 text-[#666666] dark:text-ink-light" />
                                    <span>Edit</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              
                              {product.status !== 'complete' && product.status !== 'published' && (
                                <DropdownMenuItem
                                  className="font-serif cursor-pointer text-[#333333] dark:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 rounded-md p-2.5 transition-all duration-300 focus:bg-[#F5F5F5] dark:focus:bg-accent-tertiary/20 focus:outline-none"
                                  disabled={actionInProgress?.id === product.id}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleContinue(product.id);
                                  }}
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    if (actionInProgress?.id === product.id) {
                                      // Don't close the dropdown if an action is in progress
                                      e.preventDefault();
                                    }
                                  }}
                                >
                                  {actionInProgress?.id === product.id && actionInProgress?.action === 'continue' ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#738996] dark:text-accent-primary" />
                                      <span>Continuing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="mr-2 h-4 w-4 text-[#738996] dark:text-accent-primary" />
                                      <span>Continue</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem
                                className="font-serif cursor-pointer text-[#DC2626] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md p-2.5 mt-1.5 border-t border-[#F0F0F0] dark:border-accent-tertiary/30 transition-all duration-300 focus:bg-red-50 dark:focus:bg-red-900/20 focus:outline-none"
                                disabled={actionInProgress?.id === product.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDelete(product.id);
                                }}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  if (actionInProgress?.id === product.id) {
                                    // Don't close the dropdown if an action is in progress
                                    e.preventDefault();
                                  }
                                }}
                              >
                                {actionInProgress?.id === product.id && actionInProgress?.action === 'delete' ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#DC2626] dark:text-red-400" />
                                    <span>Deleting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Trash className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                  </>
                                )}
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
              <div className="px-5 py-4 text-center border-t border-[#F0F0F0] dark:border-accent-tertiary/30 bg-[#FAF9F5] dark:bg-card/80 flex items-center justify-between">
                <p className="font-serif text-xs text-[#888888] dark:text-ink-light/70">Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-[#738996] dark:text-accent-primary font-serif font-medium flex items-center p-0 group transition-all duration-300"
                  onClick={() => navigate("/creator")}
                >
                  <span>Create New Product</span>
                  <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-300" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-white dark:bg-card border border-[#E8E8E8] dark:border-accent-tertiary/40 shadow-sm dark:shadow-md hover:shadow-blue-sm dark:hover:shadow-lg hover:border-[#738996]/20 dark:hover:border-accent-primary/40 transition-all duration-300 rounded-lg group">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#738996]/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center mr-4 group-hover:bg-[#738996]/15 dark:group-hover:bg-accent-primary/30 transition-colors duration-300">
                    <PenTool className="w-5 h-5 text-[#738996] dark:text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#333333] dark:text-ink-dark font-display text-base font-medium">Create Content</p>
                    <p className="text-[#666666] dark:text-ink-light text-sm font-serif mt-1">Start a new AI-powered project</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="ml-1 h-9 w-9 rounded-full text-[#738996] dark:text-accent-primary hover:bg-[#738996]/10 dark:hover:bg-accent-primary/20 hover:text-[#738996] dark:hover:text-accent-primary group-hover:translate-x-1 transition-all duration-300"
                    onClick={() => navigate("/creator")}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-card border border-[#E8E8E8] dark:border-accent-tertiary/40 shadow-sm dark:shadow-md hover:shadow-yellow-sm dark:hover:shadow-lg hover:border-[#ccb595]/20 dark:hover:border-accent-yellow/40 transition-all duration-300 rounded-lg group">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#ccb595]/10 dark:bg-accent-yellow/20 rounded-full flex items-center justify-center mr-4 group-hover:bg-[#ccb595]/15 dark:group-hover:bg-accent-yellow/30 transition-colors duration-300">
                    <FileText className="w-5 h-5 text-[#ccb595] dark:text-accent-yellow group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#333333] dark:text-ink-dark font-display text-base font-medium">Brain Dump</p>
                    <p className="text-[#666666] dark:text-ink-light text-sm font-serif mt-1">Quickly capture and organize ideas</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="ml-1 h-9 w-9 rounded-full text-[#ccb595] dark:text-accent-yellow hover:bg-[#ccb595]/10 dark:hover:bg-accent-yellow/20 hover:text-[#ccb595] dark:hover:text-accent-yellow group-hover:translate-x-1 transition-all duration-300"
                    onClick={() => navigate("/brain-dump")}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-card border border-[#E8E8E8] dark:border-accent-tertiary/40 shadow-sm dark:shadow-md hover:shadow-blue-sm dark:hover:shadow-lg hover:border-[#5e7282]/20 dark:hover:border-accent-secondary/40 transition-all duration-300 rounded-lg group">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#5e7282]/10 dark:bg-accent-secondary/20 rounded-full flex items-center justify-center mr-4 group-hover:bg-[#5e7282]/15 dark:group-hover:bg-accent-secondary/30 transition-colors duration-300">
                    <BookText className="w-5 h-5 text-[#5e7282] dark:text-accent-secondary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#333333] dark:text-ink-dark font-display text-base font-medium">Templates</p>
                    <p className="text-[#666666] dark:text-ink-light text-sm font-serif mt-1">Browse pre-built content templates</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="ml-1 h-9 w-9 rounded-full text-[#5e7282] dark:text-accent-secondary hover:bg-[#5e7282]/10 dark:hover:bg-accent-secondary/20 hover:text-[#5e7282] dark:hover:text-accent-secondary group-hover:translate-x-1 transition-all duration-300"
                    onClick={() => navigate("/templates")}
                  >
                    <ArrowRight className="h-5 w-5" />
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