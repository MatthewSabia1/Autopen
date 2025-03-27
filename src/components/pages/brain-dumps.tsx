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
  FileText,
  Plus,
  ArrowRight,
  RefreshCw,
  Brain,
  Wand2,
  Loader2,
  Archive
} from "lucide-react";
import { format } from "date-fns";
import { useBrainDumps, SavedBrainDump } from "../../hooks/useBrainDumps";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * DeleteConfirmationDialog Component
 * Displays a confirmation dialog before deleting a brain dump
 */
interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brainDump: SavedBrainDump | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

const DeleteConfirmationDialog = ({
  open,
  onOpenChange,
  brainDump,
  onConfirm,
  isDeleting
}: DeleteConfirmationDialogProps) => {
  if (!brainDump) return null;
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-paper dark:bg-card border border-accent-tertiary/20 dark:border-accent-tertiary/30 shadow-md dark:shadow-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl text-ink-dark dark:text-ink-dark">Delete Brain Dump</AlertDialogTitle>
          <AlertDialogDescription className="font-serif text-ink-light dark:text-ink-light">
            Are you sure you want to delete <span className="font-semibold text-ink-dark dark:text-ink-dark">"{brainDump.title}"</span>?
            <div className="mt-2 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400">
              This action cannot be undone. This will permanently delete the brain dump and all associated metadata.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="border-accent-tertiary/20 dark:border-accent-tertiary/40 hover:bg-accent-tertiary/5 dark:hover:bg-accent-tertiary/10 text-ink-dark dark:text-ink-dark font-serif"
            disabled={isDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-serif flex items-center gap-2"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash className="h-4 w-4" />
                Delete
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default function BrainDumpsPage() {
  const { brainDumps, isLoading, error, deleteBrainDump, refreshBrainDumps } = useBrainDumps();
  const [searchQuery, setSearchQuery] = useState("");
  const [forceUpdate, setForceUpdate] = useState(0);
  const brainDumpsRef = useRef(brainDumps);
  const navigate = useNavigate();
  const [actionInProgress, setActionInProgress] = useState<{id: string, action: string} | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brainDumpToDelete, setBrainDumpToDelete] = useState<SavedBrainDump | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add new state for refresh button
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Enhanced effect to check for changes and force update
  useEffect(() => {
    // Check if we actually have brain dumps data
    if (brainDumps) {
      // Check if the reference is different or if counts differ
      const currentCount = brainDumpsRef.current?.length || 0;
      const newCount = brainDumps.length;
      
      if (brainDumpsRef.current !== brainDumps || currentCount !== newCount) {
        console.log('Brain dumps changed:', {
          previousCount: currentCount,
          newCount: newCount,
          isDifferentReference: brainDumpsRef.current !== brainDumps
        });
        
        // Update the reference and force a re-render
        brainDumpsRef.current = brainDumps;
        setForceUpdate(prev => prev + 1);
      }
    }
  }, [brainDumps]);

  // Effect to refresh data on component mount and every 60 seconds
  useEffect(() => {
    console.log('BrainDumpsPage mounted, refreshing brain dumps...');
    
    // Initial refresh
    refreshBrainDumps().then(freshBrainDumps => {
      console.log('Brain dumps refreshed, count:', freshBrainDumps?.length || 0);
      if (freshBrainDumps) {
        brainDumpsRef.current = freshBrainDumps;
        setForceUpdate(prev => prev + 1);
      }
    });
    
    // Set up automatic refresh interval
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing brain dumps...');
      refreshBrainDumps().then(freshBrainDumps => {
        if (freshBrainDumps) {
          brainDumpsRef.current = freshBrainDumps;
          setForceUpdate(prev => prev + 1);
        }
      });
    }, 60000); // Refresh every minute
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const filteredBrainDumps = useMemo(() => {
    const currentBrainDumps = brainDumpsRef.current || [];
    console.log('Recalculating filtered brain dumps from', currentBrainDumps.length, 'brain dumps');
    
    if (!searchQuery.trim()) {
      return currentBrainDumps;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    return currentBrainDumps.filter(
      brainDump => 
        brainDump.title.toLowerCase().includes(lowercaseQuery) || 
        (brainDump.description && brainDump.description.toLowerCase().includes(lowercaseQuery))
    );
  }, [searchQuery, forceUpdate]);

  const handleDelete = async (id: string) => {
    console.log("Delete handler called for brain dump ID:", id);
    
    const brainDump = brainDumps.find(p => p.id === id);
    if (!brainDump) {
      console.error("Brain dump not found for deletion:", id);
      return;
    }
    
    // Open the delete confirmation dialog instead of using browser's confirm
    setBrainDumpToDelete(brainDump);
    setDeleteDialogOpen(true);
  };
  
  // New function to handle actual deletion after confirmation
  const confirmDelete = async () => {
    if (!brainDumpToDelete) return;
    
    try {
      // Set loading state
      setIsDeleting(true);
      setActionInProgress({id: brainDumpToDelete.id, action: 'delete'});
      console.log("Delete action in progress for:", brainDumpToDelete.title);
      
      const success = await deleteBrainDump(brainDumpToDelete.id);
      if (!success) throw new Error("Failed to delete brain dump");
      
      console.log("Brain dump successfully deleted:", brainDumpToDelete.title);
      
      // Close the dialog
      setDeleteDialogOpen(false);
      
      // Update local state by explicitly refreshing the list
      await refreshBrainDumps();
      setForceUpdate(prev => prev + 1);
      
      // Show success message (temporary visual feedback)
      const successToast = document.createElement('div');
      successToast.className = 'fixed bottom-4 right-4 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg shadow-md border border-emerald-100 z-50 animate-fade-in';
      successToast.innerHTML = `<div class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polyline points="20 6 9 17 4 12"></polyline></svg>Brain dump "${brainDumpToDelete.title}" has been deleted</div>`;
      document.body.appendChild(successToast);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        successToast.classList.add('animate-fade-out');
        setTimeout(() => successToast.remove(), 300);
      }, 3000);
      
    } catch (e) {
      console.error("Error deleting brain dump:", e);
      
      // Show error toast
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed bottom-4 right-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg shadow-md border border-red-100 z-50 animate-fade-in';
      errorToast.innerHTML = `<div class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>Failed to delete brain dump</div>`;
      document.body.appendChild(errorToast);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        errorToast.classList.add('animate-fade-out');
        setTimeout(() => errorToast.remove(), 300);
      }, 3000);
    } finally {
      setIsDeleting(false);
      setActionInProgress(null);
      setBrainDumpToDelete(null);
    }
  };

  const handleEdit = (id: string) => {
    console.log("Edit handler called for brain dump ID:", id);
    
    const brainDump = brainDumps.find(p => p.id === id);
    if (!brainDump) {
      console.error("Brain dump not found for editing:", id);
      return;
    }
    
    setActionInProgress({id, action: 'edit'});
    console.log("Edit action in progress for:", brainDump.title);
    
    // Short timeout to show loading state before navigation
    setTimeout(() => {
      console.log("Navigating to edit page for:", brainDump.title);
      navigate(`/brain-dump?id=${id}`);
    }, 200);
  };

  const handleView = (id: string) => {
    console.log("View handler called for brain dump ID:", id);
    
    const brainDump = brainDumps.find(p => p.id === id);
    setActionInProgress({id, action: 'view'});
    
    if (!brainDump) {
      console.warn("Brain dump not found in state for viewing:", id);
      // Short timeout to show loading state before navigation
      setTimeout(() => {
        console.log("Navigating to brain dump detail by ID only");
        navigate(`/brain-dump/${id}`);
      }, 200);
      return;
    }
    
    console.log("Navigating to brain dump detail:", brainDump.title);
    // Short timeout to show loading state before navigation
    setTimeout(() => {
      navigate(`/brain-dump/${id}`);
    }, 200);
  };

  const handleUseInCreator = (id: string) => {
    console.log("Use in creator handler called for brain dump ID:", id);
    
    const brainDump = brainDumps.find(p => p.id === id);
    if (!brainDump) {
      console.error("Brain dump not found for use in creator action:", id);
      return;
    }
    
    setActionInProgress({id, action: 'useInCreator'});
    console.log("Use in creator action in progress for:", brainDump.title);
    
    // Store the brain dump ID in session storage to use it in the creator
    sessionStorage.setItem('use_brain_dump', id);
    
    // Short timeout to show loading state before navigation
    setTimeout(() => {
      console.log("Navigating to creator with brain dump:", brainDump.title);
      navigate(`/creator?brainDumpId=${id}`);
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
    
    const variants = {
      draft: { 
        bg: "bg-[#F9F7F4] dark:bg-[#888888]/20", 
        text: "text-[#888888] dark:text-[#AAAAAA]",
        border: "border-[#E8E8E8] dark:border-[#888888]/40",
        dot: "bg-[#888888] dark:bg-[#AAAAAA]",
        label: "Draft"
      },
      analyzed: { 
        bg: "bg-[#738996]/10 dark:bg-accent-primary/25", 
        text: "text-[#738996] dark:text-accent-primary",
        border: "border-[#738996]/20 dark:border-accent-primary/50",
        dot: "bg-[#738996] dark:bg-accent-primary",
        label: "Analyzed"
      },
      complete: { 
        bg: "bg-[#F1F8F4] dark:bg-[#10B981]/20", 
        text: "text-[#10B981] dark:text-[#10B981]",
        border: "border-[#D1E9D8] dark:border-[#10B981]/40",
        dot: "bg-[#10B981] dark:bg-[#10B981]",
        label: "Complete"
      }
    };
    
    const variant = variants[normalizedStatus as keyof typeof variants] || variants.draft;
    
    return (
      <div className="flex items-center">
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-md ${variant.bg} ${variant.text} text-xs font-serif ${variant.border} border shadow-xs transition-all duration-300`}>
          <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${variant.dot} animate-pulse`}></div>
          <span>{variant.label}</span>
        </div>
      </div>
    );
  };

  const getWordCount = (brainDump: SavedBrainDump): string => {
    if (brainDump.metadata?.wordCount) {
      return `${brainDump.metadata.wordCount.toLocaleString()} words`;
    }
    
    // Calculate if not in metadata
    const wordCount = brainDump.content ? brainDump.content.trim().split(/\s+/).length : 0;
    return `${wordCount.toLocaleString()} words`;
  };

  // New function to handle manual refresh with loading state
  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      console.log('Manual refresh triggered');
      
      const freshData = await refreshBrainDumps();
      if (freshData) {
        brainDumpsRef.current = freshData;
        setForceUpdate(prev => prev + 1);
        
        // Show success toast
        const successToast = document.createElement('div');
        successToast.className = 'fixed bottom-4 right-4 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg shadow-md border border-emerald-100 z-50 animate-fade-in flex items-center gap-2';
        successToast.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Brain dumps refreshed successfully</span>
        `;
        document.body.appendChild(successToast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
          successToast.classList.add('animate-fade-out');
          setTimeout(() => successToast.remove(), 300);
        }, 3000);
      }
    } catch (err) {
      console.error('Error refreshing brain dumps:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout activeTab="Brain Dumps">
        <div className="flex h-[60vh] w-full items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 animate-spin h-16 w-16 rounded-full border-4 border-accent-primary/10 border-t-accent-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="h-7 w-7 text-accent-primary/70" />
              </div>
            </div>
            <p className="text-ink-light font-serif text-base mt-4">Loading your brain dumps...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activeTab="Brain Dumps">
        <div className="flex flex-col h-[60vh] w-full items-center justify-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 dark:text-red-400">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="text-ink-dark dark:text-ink-dark font-serif text-center max-w-lg px-4 mb-4">
            <h3 className="text-xl font-display mb-2">Couldn't Load Brain Dumps</h3>
            <p className="mb-4 dark:text-ink-light">{error}</p>
            {error.includes("database table not found") && (
              <div className="mt-4 p-4 bg-accent-tertiary/5 dark:bg-accent-tertiary/10 rounded-md text-sm">
                <p className="mb-2"><strong>Administrator Note:</strong></p>
                <p>The database schema needs to be applied. Run the migration script to create the saved_brain_dumps table:</p>
                <pre className="bg-black/5 dark:bg-black/20 p-2 mt-2 rounded overflow-x-auto text-xs">
                  npx supabase migration up
                </pre>
                <p className="mt-2">Or apply the SQL in the new migration file manually in the Supabase dashboard.</p>
              </div>
            )}
          </div>
          <Button 
            onClick={handleManualRefresh} 
            className="mt-4 bg-accent-primary text-white flex items-center gap-2"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Try Again
              </>
            )}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="Brain Dumps">
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        brainDump={brainDumpToDelete}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
      
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h2 className="font-display text-2xl text-ink-dark dark:text-ink-dark/90 mb-1 font-medium">
              Saved Brain Dumps
            </h2>
            <p className="font-serif text-ink-light dark:text-ink-light/80 text-sm">Manage your saved brain dumps and use them to create new products</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleManualRefresh}
              variant="outline" 
              className="px-3 py-1.5 text-sm font-serif border-accent-tertiary/20 dark:border-accent-tertiary/30 hover:border-accent-tertiary/40 dark:hover:border-accent-tertiary/50 text-ink-dark dark:text-ink-dark flex items-center"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 opacity-80 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                  Refresh
                </>
              )}
            </Button>
            <Button 
              onClick={() => navigate("/brain-dump")}
              className="px-4 py-1.5 text-sm font-serif bg-accent-primary dark:bg-accent-primary text-white rounded flex items-center hover:bg-accent-primary/90 dark:hover:bg-accent-primary/90 transition-colors shadow-sm dark:shadow-md"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5 opacity-90" />
              New Brain Dump
            </Button>
          </div>
        </div>

        <Card className="bg-paper dark:bg-card rounded-lg border border-[#E8E8E8] dark:border-accent-tertiary/40 shadow-sm dark:shadow-md hover:shadow-blue-sm dark:hover:shadow-lg transition-all duration-300 overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-[#F0F0F0] dark:border-accent-tertiary/30 bg-[#FAF9F5] dark:bg-card/80">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="relative w-full md:w-72">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#666666]/60 dark:text-ink-light/60" />
                <Input
                  placeholder="Search brain dumps..."
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
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1 group-hover:rotate-180 transition-transform duration-700" />
                      <span>Refresh</span>
                    </>
                  )}
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
            {console.log('RENDER:', {
              brainDumps: brainDumps?.length || 0,
              brainDumpsRef: brainDumpsRef.current?.length || 0,
              filteredBrainDumps: filteredBrainDumps?.length || 0,
              forceUpdate
            })}
            {!brainDumpsRef.current || brainDumpsRef.current.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#F5F5F5] dark:bg-accent-tertiary/20 flex items-center justify-center">
                  <Brain className="w-10 h-10 text-[#CCCCCC] dark:text-accent-tertiary/70" />
                </div>
                <h3 className="text-xl font-display text-[#333333] dark:text-ink-dark mb-3">No brain dumps found</h3>
                <p className="text-[#666666] dark:text-ink-light font-serif mb-8 max-w-md mx-auto">
                  Create your first brain dump to start organizing your ideas. You can use the Brain Dump tool to capture 
                  and analyze your content, then save it for later use in your projects.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <Button 
                    onClick={() => navigate("/brain-dump")}
                    className="bg-[#738996] dark:bg-accent-primary text-white hover:bg-[#738996]/90 dark:hover:bg-accent-primary/90 font-serif rounded-md shadow-sm dark:shadow-md hover:shadow-blue-sm dark:hover:shadow-lg px-5 py-3 flex items-center justify-center flex-1 transition-all duration-300"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    New Brain Dump
                  </Button>
                </div>
                <p className="text-[#888888] dark:text-ink-light/70 font-serif text-xs mt-6">
                  Need help getting started? <a href="/help" className="text-[#738996] dark:text-accent-primary underline">Check our guide</a>
                </p>
              </div>
            ) : searchQuery && filteredBrainDumps.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5F5F5] dark:bg-accent-tertiary/20 flex items-center justify-center">
                  <SearchIcon className="w-7 h-7 text-[#CCCCCC] dark:text-accent-tertiary/70" />
                </div>
                <h3 className="text-xl font-display text-[#333333] dark:text-ink-dark mb-2">No matching brain dumps</h3>
                <p className="text-[#666666] dark:text-ink-light font-serif mb-6 max-w-md mx-auto">
                  No brain dumps match your search query: "{searchQuery}"
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
                      <TableHead className="font-display text-sm text-[#333333] dark:text-ink-dark py-4 font-medium">Word Count</TableHead>
                      <TableHead className="font-display text-sm text-[#333333] dark:text-ink-dark py-4 font-medium">Status</TableHead>
                      <TableHead className="font-display text-sm text-[#333333] dark:text-ink-dark py-4 font-medium">Created</TableHead>
                      <TableHead className="font-display text-sm text-[#333333] dark:text-ink-dark py-4 font-medium">Updated</TableHead>
                      <TableHead className="text-right font-display text-sm text-[#333333] dark:text-ink-dark py-4 pr-6 font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrainDumps.map((brainDump) => (
                      <TableRow 
                        key={brainDump.id} 
                        className="border-[#F0F0F0] dark:border-accent-tertiary/30 hover:bg-[#738996]/5 dark:hover:bg-accent-primary/10 transition-all duration-300 cursor-pointer group" 
                        onClick={() => handleView(brainDump.id)}
                      >
                        <TableCell className="font-serif text-[#333333] dark:text-ink-dark py-4 px-5 font-medium">
                          <div className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-[#F5F5F5] dark:bg-accent-tertiary/20 flex items-center justify-center mr-3 group-hover:bg-[#738996]/10 dark:group-hover:bg-accent-primary/20 transition-colors duration-300">
                              <Brain className="h-4 w-4 text-[#738996] dark:text-accent-primary" />
                            </div>
                            <span className="group-hover:text-[#738996] dark:group-hover:text-accent-primary transition-colors duration-300 truncate max-w-[250px]">{brainDump.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-serif text-[#666666] dark:text-ink-light py-4">
                          {getWordCount(brainDump)}
                        </TableCell>
                        <TableCell className="py-4">{renderStatusBadge(brainDump.status)}</TableCell>
                        <TableCell className="font-serif text-[#666666] dark:text-ink-light py-4 text-sm">
                          {formatDate(brainDump.created_at)}
                        </TableCell>
                        <TableCell className="font-serif text-[#666666] dark:text-ink-light py-4 text-sm">
                          {formatDate(brainDump.updated_at)}
                        </TableCell>
                        <TableCell className="text-right py-4 pr-6" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu open={openMenuId === brainDump.id} onOpenChange={(open) => {
                            if (open) {
                              setOpenMenuId(brainDump.id);
                            } else if (!actionInProgress || actionInProgress.id !== brainDump.id) {
                              setOpenMenuId(null);
                            }
                          }}>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-[#666666] dark:text-ink-light hover:text-[#333333] dark:hover:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 rounded-full transition-all duration-300"
                                aria-label="Actions for this brain dump"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === brainDump.id ? null : brainDump.id);
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
                                if (actionInProgress && actionInProgress.id === brainDump.id) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <DropdownMenuItem
                                className="font-serif cursor-pointer text-[#333333] dark:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 rounded-md p-2.5 transition-all duration-300 focus:bg-[#F5F5F5] dark:focus:bg-accent-tertiary/20 focus:outline-none"
                                disabled={actionInProgress?.id === brainDump.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleView(brainDump.id);
                                }}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  if (actionInProgress?.id === brainDump.id) {
                                    // Don't close the dropdown if an action is in progress
                                    e.preventDefault();
                                  }
                                }}
                              >
                                {actionInProgress?.id === brainDump.id && actionInProgress?.action === 'view' ? (
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
                                disabled={actionInProgress?.id === brainDump.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEdit(brainDump.id);
                                }}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  if (actionInProgress?.id === brainDump.id) {
                                    // Don't close the dropdown if an action is in progress
                                    e.preventDefault();
                                  }
                                }}
                              >
                                {actionInProgress?.id === brainDump.id && actionInProgress?.action === 'edit' ? (
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
                              
                              <DropdownMenuItem
                                className="font-serif cursor-pointer text-[#333333] dark:text-ink-dark hover:bg-[#F5F5F5] dark:hover:bg-accent-tertiary/20 rounded-md p-2.5 transition-all duration-300 focus:bg-[#F5F5F5] dark:focus:bg-accent-tertiary/20 focus:outline-none"
                                disabled={actionInProgress?.id === brainDump.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleUseInCreator(brainDump.id);
                                }}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  if (actionInProgress?.id === brainDump.id) {
                                    // Don't close the dropdown if an action is in progress
                                    e.preventDefault();
                                  }
                                }}
                              >
                                {actionInProgress?.id === brainDump.id && actionInProgress?.action === 'useInCreator' ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#738996] dark:text-accent-primary" />
                                    <span>Loading in Creator...</span>
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="mr-2 h-4 w-4 text-[#738996] dark:text-accent-primary" />
                                    <span>Use in Creator</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem
                                className="font-serif cursor-pointer text-[#DC2626] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md p-2.5 mt-1.5 border-t border-[#F0F0F0] dark:border-accent-tertiary/30 transition-all duration-300 focus:bg-red-50 dark:focus:bg-red-900/20 focus:outline-none"
                                disabled={actionInProgress?.id === brainDump.id || isDeleting}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDelete(brainDump.id);
                                }}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  if (actionInProgress?.id === brainDump.id || isDeleting) {
                                    // Don't close the dropdown if an action is in progress
                                    e.preventDefault();
                                  }
                                }}
                              >
                                {(actionInProgress?.id === brainDump.id && actionInProgress?.action === 'delete') || 
                                 (brainDumpToDelete?.id === brainDump.id && isDeleting) ? (
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

            {filteredBrainDumps.length > 0 && (
              <div className="px-5 py-4 text-center border-t border-[#F0F0F0] dark:border-accent-tertiary/30 bg-[#FAF9F5] dark:bg-card/80 flex items-center justify-between">
                <p className="font-serif text-xs text-[#888888] dark:text-ink-light/70">Showing {filteredBrainDumps.length} {filteredBrainDumps.length === 1 ? 'brain dump' : 'brain dumps'}</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-[#738996] dark:text-accent-primary font-serif font-medium flex items-center p-0 group transition-all duration-300"
                  onClick={() => navigate("/brain-dump")}
                >
                  <span>Create New Brain Dump</span>
                  <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-300" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {filteredBrainDumps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-white dark:bg-card border border-[#E8E8E8] dark:border-accent-tertiary/40 shadow-sm dark:shadow-md hover:shadow-blue-sm dark:hover:shadow-lg hover:border-[#738996]/20 dark:hover:border-accent-primary/40 transition-all duration-300 rounded-lg group">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#738996]/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center mr-4 group-hover:bg-[#738996]/15 dark:group-hover:bg-accent-primary/30 transition-colors duration-300">
                    <Brain className="w-5 h-5 text-[#738996] dark:text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#333333] dark:text-ink-dark font-display text-base font-medium">New Brain Dump</p>
                    <p className="text-[#666666] dark:text-ink-light text-sm font-serif mt-1">Create a new brain dump</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="ml-1 h-9 w-9 rounded-full text-[#738996] dark:text-accent-primary hover:bg-[#738996]/10 dark:hover:bg-accent-primary/20 hover:text-[#738996] dark:hover:text-accent-primary group-hover:translate-x-1 transition-all duration-300"
                    onClick={() => navigate("/brain-dump")}
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
                    <Archive className="w-5 h-5 text-[#ccb595] dark:text-accent-yellow group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#333333] dark:text-ink-dark font-display text-base font-medium">Manage Brain Dumps</p>
                    <p className="text-[#666666] dark:text-ink-light text-sm font-serif mt-1">View and organize your brain dumps</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="ml-1 h-9 w-9 rounded-full text-[#ccb595] dark:text-accent-yellow hover:bg-[#ccb595]/10 dark:hover:bg-accent-yellow/20 hover:text-[#ccb595] dark:hover:text-accent-yellow group-hover:translate-x-1 transition-all duration-300"
                    onClick={() => navigate("/brain-dumps")}
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
                    <Wand2 className="w-5 h-5 text-[#5e7282] dark:text-accent-secondary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#333333] dark:text-ink-dark font-display text-base font-medium">Create Content</p>
                    <p className="text-[#666666] dark:text-ink-light text-sm font-serif mt-1">Turn brain dumps into products</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="ml-1 h-9 w-9 rounded-full text-[#5e7282] dark:text-accent-secondary hover:bg-[#5e7282]/10 dark:hover:bg-accent-secondary/20 hover:text-[#5e7282] dark:hover:text-accent-secondary group-hover:translate-x-1 transition-all duration-300"
                    onClick={() => navigate("/creator")}
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