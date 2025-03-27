import { useState, useEffect, useMemo, useRef } from "react";
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
  const [forceUpdate, setForceUpdate] = useState(0);
  const productsRef = useRef(products);
  const navigate = useNavigate();
  const [actionInProgress, setActionInProgress] = useState<{id: string, action: string} | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (products && products.length > 0 && JSON.stringify(productsRef.current) !== JSON.stringify(products)) {
      console.log('Products actually changed!', products.length);
      productsRef.current = products;
      setForceUpdate(prev => prev + 1);
    }
  }, [products]);

  useEffect(() => {
    console.log('Products updated or component mounted, count:', products.length, 'forceUpdate:', forceUpdate);
  }, [products, forceUpdate]);

  useEffect(() => {
    console.log('ProductsPage mounted, refreshing products...');
    refreshProducts().then(freshProducts => {
      console.log('Products refreshed, count:', freshProducts?.length || 0);
      if (freshProducts && freshProducts.length > 0) {
        productsRef.current = freshProducts;
        setForceUpdate(prev => prev + 1);
      }
    });
  }, []);

  const filteredProducts = useMemo(() => {
    const currentProducts = productsRef.current || [];
    console.log('Recalculating filtered products from', currentProducts.length, 'products');
    
    if (!searchQuery.trim()) {
      return currentProducts;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    return currentProducts.filter(
      product => 
        product.title.toLowerCase().includes(lowercaseQuery) || 
        product.type.toLowerCase().includes(lowercaseQuery)
    );
  }, [searchQuery, forceUpdate]);

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
    console.log("Edit handler called for product ID:", id);
    
    const product = products.find(p => p.id === id);
    if (!product) {
      console.error("Product not found for editing:", id);
      return;
    }
    
    setActionInProgress({id, action: 'edit'});
    console.log("Edit action in progress for:", product.title);
    
    // Short timeout to show loading state before navigation
    setTimeout(() => {
      console.log("Navigating to edit page for:", product.title);
      navigate(`/creator?id=${id}&mode=edit`);
    }, 200);
  };

  const handleView = (id: string) => {
    console.log("View handler called for product ID:", id);
    
    const product = products.find(p => p.id === id);
    setActionInProgress({id, action: 'view'});
    
    if (!product) {
      console.warn("Product not found in state for viewing:", id);
      // Short timeout to show loading state before navigation
      setTimeout(() => {
        console.log("Navigating to product detail by ID only");
        navigate(`/products/${id}`);
      }, 200);
      return;
    }
    
    console.log("Navigating to product detail:", product.title);
    // Short timeout to show loading state before navigation
    setTimeout(() => {
      navigate(`/products/${id}`);
    }, 200);
  };

  const handleContinue = (id: string) => {
    console.log("Continue handler called for product ID:", id);
    
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
    console.log("Continue action in progress for:", product.title);
    
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
          
          // Short timeout to show loading state before navigation
          setTimeout(() => {
            navigate(`/workflow/${product.project_id}`);
          }, 200);
          return;
        }
      }
    }
    
    // Short timeout to show loading state before navigation
    setTimeout(() => {
      console.log("Navigating to creator for continue action:", product.title);
      navigate(`/creator?id=${id}`);
    }, 200);
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

        <Card className="bg-paper rounded-lg border border-[#E8E8E8] shadow-sm hover:shadow-blue-sm transition-all duration-300 overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-[#F0F0F0] bg-[#FAF9F5]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="relative w-full md:w-72">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#666666]/60" />
                <Input
                  placeholder="Search products..."
                  className="pl-10 font-serif border-[#E8E8E8] focus-visible:ring-[#738996] rounded-md bg-white shadow-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 font-serif font-medium border-[#E8E8E8] text-[#666666] hover:text-[#333333] hover:bg-[#F5F5F5] hover:border-[#738996]/30 rounded-md px-3 py-2 shadow-xs transition-all duration-300"
                  onClick={() => refreshProducts()}
                >
                  <RefreshCw className="h-4 w-4 mr-1 group-hover:rotate-180 transition-transform duration-700" />
                  <span>Refresh</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 font-serif font-medium border-[#E8E8E8] text-[#666666] hover:text-[#333333] hover:bg-[#F5F5F5] hover:border-[#738996]/30 rounded-md px-3 py-2 shadow-xs transition-all duration-300"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-1" />
                  <span>Filter</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {console.log('RENDER:', {
              products: products?.length || 0,
              productsRef: productsRef.current?.length || 0,
              filteredProducts: filteredProducts?.length || 0,
              forceUpdate
            })}
            {!productsRef.current || productsRef.current.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-[#CCCCCC]" />
                </div>
                <h3 className="text-xl font-display text-[#333333] mb-3">No products found</h3>
                <p className="text-[#666666] font-serif mb-8 max-w-md mx-auto">
                  Create your first product to start organizing your content library. You can use the AI Creator for 
                  automated content generation or start with a simple Brain Dump to capture your ideas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <Button 
                    onClick={() => navigate("/creator")}
                    className="bg-[#738996] text-white hover:bg-[#738996]/90 font-serif rounded-md shadow-sm hover:shadow-blue-sm px-5 py-3 flex items-center justify-center flex-1 transition-all duration-300"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    AI Creator
                  </Button>
                  <Button 
                    onClick={() => navigate("/brain-dump")}
                    variant="outline"
                    className="border-[#E8E8E8] hover:border-[#738996]/30 hover:bg-[#F5F5F5] font-serif rounded-md shadow-sm px-5 py-3 flex items-center justify-center flex-1 transition-all duration-300"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Brain Dump
                  </Button>
                </div>
                <p className="text-[#888888] font-serif text-xs mt-6">
                  Need help getting started? <a href="/help" className="text-[#738996] underline">Check our guide</a>
                </p>
              </div>
            ) : searchQuery && filteredProducts.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                  <SearchIcon className="w-7 h-7 text-[#CCCCCC]" />
                </div>
                <h3 className="text-xl font-display text-[#333333] mb-2">No matching products</h3>
                <p className="text-[#666666] font-serif mb-6 max-w-md mx-auto">
                  No products match your search query: "{searchQuery}"
                </p>
                <Button 
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                  className="border-[#E8E8E8] hover:border-[#738996]/30 hover:bg-[#F5F5F5] font-serif shadow-xs transition-all duration-300"
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#F0F0F0] bg-[#FAF9F5]">
                      <TableHead className="font-display text-sm text-[#333333] py-4 px-5 font-medium">Title</TableHead>
                      <TableHead className="font-display text-sm text-[#333333] py-4 font-medium">Type</TableHead>
                      <TableHead className="font-display text-sm text-[#333333] py-4 font-medium">Status</TableHead>
                      <TableHead className="font-display text-sm text-[#333333] py-4 font-medium">Created</TableHead>
                      <TableHead className="font-display text-sm text-[#333333] py-4 font-medium">Updated</TableHead>
                      <TableHead className="text-right font-display text-sm text-[#333333] py-4 pr-6 font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow 
                        key={product.id} 
                        className="border-[#F0F0F0] hover:bg-[#738996]/5 transition-all duration-300 cursor-pointer group" 
                        onClick={() => handleView(product.id)}
                      >
                        <TableCell className="font-serif text-[#333333] py-4 px-5 font-medium">
                          <div className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center mr-3 group-hover:bg-[#738996]/10 transition-colors duration-300">
                              {product.type.includes('ebook') && <BookText className="h-4 w-4 text-[#738996]" />}
                              {product.type === 'brain_dump' && <FileText className="h-4 w-4 text-[#ccb595]" />}
                              {!product.type.includes('ebook') && product.type !== 'brain_dump' && <PenTool className="h-4 w-4 text-[#5e7282]" />}
                            </div>
                            <span className="group-hover:text-[#738996] transition-colors duration-300 truncate max-w-[250px]">{product.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-serif text-[#666666] py-4">
                          <Badge className="font-serif text-xs px-2 py-0.5 bg-[#F9F5ED] text-[#ccb595] border-[#ccb595] border shadow-xs group-hover:bg-white/90 transition-colors duration-300">
                            {product.type === 'ebook' ? 'eBook' : 
                            product.type === 'brain_dump' ? 'Brain Dump' : 
                            product.type.charAt(0).toUpperCase() + product.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">{renderStatusBadge(product.status)}</TableCell>
                        <TableCell className="font-serif text-[#666666] py-4 text-sm">
                          {formatDate(product.created_at)}
                        </TableCell>
                        <TableCell className="font-serif text-[#666666] py-4 text-sm">
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
                                className="h-8 w-8 p-0 text-[#666666] hover:text-[#333333] hover:bg-[#F5F5F5] rounded-full transition-all duration-300"
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
                              className="bg-white border-[#E8E8E8] shadow-md rounded-lg p-1.5 min-w-40"
                              onCloseAutoFocus={(e) => e.preventDefault()}
                              onPointerDownOutside={(e) => {
                                if (actionInProgress && actionInProgress.id === product.id) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <DropdownMenuItem
                                className="font-serif cursor-pointer text-[#333333] hover:bg-[#F5F5F5] rounded-md p-2.5 transition-all duration-300 focus:bg-[#F5F5F5] focus:outline-none"
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
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#738996]" />
                                    <span>Opening...</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4 text-[#666666]" />
                                    <span>View</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem
                                className="font-serif cursor-pointer text-[#333333] hover:bg-[#F5F5F5] rounded-md p-2.5 transition-all duration-300 focus:bg-[#F5F5F5] focus:outline-none"
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
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#738996]" />
                                    <span>Opening editor...</span>
                                  </>
                                ) : (
                                  <>
                                    <Pencil className="mr-2 h-4 w-4 text-[#666666]" />
                                    <span>Edit</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              
                              {product.status !== 'complete' && product.status !== 'published' && (
                                <DropdownMenuItem
                                  className="font-serif cursor-pointer text-[#333333] hover:bg-[#F5F5F5] rounded-md p-2.5 transition-all duration-300 focus:bg-[#F5F5F5] focus:outline-none"
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
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#738996]" />
                                      <span>Continuing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="mr-2 h-4 w-4 text-[#738996]" />
                                      <span>Continue</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem
                                className="font-serif cursor-pointer text-[#DC2626] hover:bg-red-50 rounded-md p-2.5 mt-1.5 border-t border-[#F0F0F0] transition-all duration-300 focus:bg-red-50 focus:outline-none"
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
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#DC2626]" />
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
              <div className="px-5 py-4 text-center border-t border-[#F0F0F0] bg-[#FAF9F5] flex items-center justify-between">
                <p className="font-serif text-xs text-[#888888]">Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-[#738996] font-serif font-medium flex items-center p-0 group transition-all duration-300"
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
            <Card className="bg-white border border-[#E8E8E8] shadow-sm hover:shadow-blue-sm hover:border-[#738996]/20 transition-all duration-300 rounded-lg group">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#738996]/10 rounded-full flex items-center justify-center mr-4 group-hover:bg-[#738996]/15 transition-colors duration-300">
                    <PenTool className="w-5 h-5 text-[#738996] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#333333] font-display text-base font-medium">Create Content</p>
                    <p className="text-[#666666] text-sm font-serif mt-1">Start a new AI-powered project</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="ml-1 h-9 w-9 rounded-full text-[#738996] hover:bg-[#738996]/10 hover:text-[#738996] group-hover:translate-x-1 transition-all duration-300"
                    onClick={() => navigate("/creator")}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-[#E8E8E8] shadow-sm hover:shadow-yellow-sm hover:border-[#ccb595]/20 transition-all duration-300 rounded-lg group">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#ccb595]/10 rounded-full flex items-center justify-center mr-4 group-hover:bg-[#ccb595]/15 transition-colors duration-300">
                    <FileText className="w-5 h-5 text-[#ccb595] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#333333] font-display text-base font-medium">Brain Dump</p>
                    <p className="text-[#666666] text-sm font-serif mt-1">Quickly capture and organize ideas</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="ml-1 h-9 w-9 rounded-full text-[#ccb595] hover:bg-[#ccb595]/10 hover:text-[#ccb595] group-hover:translate-x-1 transition-all duration-300"
                    onClick={() => navigate("/brain-dump")}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-[#E8E8E8] shadow-sm hover:shadow-blue-sm hover:border-[#5e7282]/20 transition-all duration-300 rounded-lg group">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#5e7282]/10 rounded-full flex items-center justify-center mr-4 group-hover:bg-[#5e7282]/15 transition-colors duration-300">
                    <BookText className="w-5 h-5 text-[#5e7282] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#333333] font-display text-base font-medium">Templates</p>
                    <p className="text-[#666666] text-sm font-serif mt-1">Browse pre-built content templates</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="ml-1 h-9 w-9 rounded-full text-[#5e7282] hover:bg-[#5e7282]/10 hover:text-[#5e7282] group-hover:translate-x-1 transition-all duration-300"
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