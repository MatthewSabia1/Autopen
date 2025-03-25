import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabase';
import { WorkflowStep } from '@/types/database.types';

export type ProductMetadata = {
  coverImage?: string;
  summary?: string;
  wordCount?: number;
  generationInfo?: {
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
  };
  [key: string]: unknown;
};

export type Product = {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  project_id?: string;
  metadata?: ProductMetadata;
  source?: 'creator_contents' | 'projects' | string;
  workflow_step?: WorkflowStep;
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("=== PRODUCTS DEBUG ===");
      console.log("1. Fetching current user with supabase.auth.getUser()...");
      const { data: user, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Authentication error:", userError.message);
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      console.log("2. User data result:", user ? "Received user data" : "No user data");
      
      if (!user || !user.user) {
        console.error("3. User not authenticated - no valid user object found");
        
        // Try to get session info for debugging
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("4. Session check:", sessionData ? 
          `Session exists: ${!!sessionData.session}, expires: ${sessionData.session?.expires_at}` : 
          "No session data");
          
        throw new Error("User not authenticated");
      }
      
      // Debug output
      console.log("3. Authentication successful!");
      console.log("4. Current authenticated user ID:", user.user.id);
      console.log(`5. User email: ${user.user.email}`);
      console.log("6. Session valid until:", new Date(user.user.session?.expires_at || 0).toLocaleString());

      // Try to load from cache first if not too old
      try {
        const cachedProductsJSON = localStorage.getItem('cached_products');
        if (cachedProductsJSON) {
          const { data: cachedProducts, timestamp } = JSON.parse(cachedProductsJSON);
          
          // Use cache if less than 5 minutes old
          const isCacheValid = timestamp && (Date.now() - timestamp < 5 * 60 * 1000);
          
          if (isCacheValid && Array.isArray(cachedProducts) && cachedProducts.length > 0) {
            console.log("Using cached products list");
            setProducts(cachedProducts);
            setIsLoading(false);
            
            // Fetch in background to update cache if needed
            setTimeout(() => refreshProductsInBackground(user.user.id), 100);
            
            return cachedProducts;
          }
        }
      } catch (cacheError) {
        console.log("Cache read error (non-critical):", cacheError);
      }

      // If no valid cache, fetch from database with optimized queries
      return await fetchProductsFromDatabase(user.user.id);
    } catch (e: any) {
      console.error("Error fetching products:", e);
      setError(e.message || "Failed to load products");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to fetch products from database with optimized queries
  const fetchProductsFromDatabase = async (userId: string) => {
    try {
      // Only select the fields we need - customized for each table
      const contentFields = 'id, title, type, status, created_at, updated_at, user_id, project_id, metadata';
      
      // First check if we can query creator_contents
      let allProducts = [];
      
      // Try creator_contents first - this is the main table for products
      try {
        console.log("7. Querying creator_contents table for user_id:", userId);
        const { data: contentProducts, error: contentError } = await supabase
          .from('creator_contents')
          .select(contentFields)
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });
        
        console.log("8. Creator contents query results:", { 
          success: !contentError,
          count: contentProducts ? contentProducts.length : 0,
          error: contentError ? contentError.message : null
        });
        
        // Log if products were found
        if (contentProducts && contentProducts.length > 0) {
          console.log("9. Found products:", contentProducts.map(p => ({
            id: p.id,
            title: p.title,
            type: p.type,
            status: p.status
          })));
        }
        
        if (contentError) {
          if (contentError.code === '42P01') {
            console.log("The creator_contents table doesn't exist yet. You may need to run migrations.");
          } else {
            console.error("Error fetching creator_contents:", contentError);
          }
        } else if (contentProducts && contentProducts.length > 0) {
          const normalizedContentProducts = contentProducts.map(product => ({
            id: product.id,
            title: product.title || "Untitled",
            type: product.type || "Unknown",
            status: product.status || "draft",
            created_at: product.created_at,
            updated_at: product.updated_at,
            user_id: product.user_id,
            project_id: product.project_id,
            metadata: product.metadata,
            source: 'creator_contents'
          }));
          allProducts = [...normalizedContentProducts];
          
          if (contentProducts.length > 0) {
            console.log("First content product:", contentProducts[0]);
          }
          
          // Successfully got products, so let's not try projects to avoid errors
          // Just return what we have here, as projects might cause infinite loops
          console.log("Successfully retrieved products from creator_contents, skipping projects query");
          return allProducts;
        }
      } catch (contentQueryError) {
        console.error("Exception querying creator_contents:", contentQueryError);
      }
      
      // Only try projects if needed, with schema detection
      try {
        // Check if projects table exists by doing a minimal query first
        const { count, error: projectCountError } = await supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .limit(1);
        
        if (projectCountError) {
          console.error("Error checking if projects table exists:", projectCountError);
          return allProducts; // Return whatever we have from creator_contents
        }
        
        // If we get here, the table exists - now determine the safe fields to query
        // Just use the basic fields we know should be there in any table version
        const projectColumns = ['id', 'title', 'type', 'status', 'created_at', 'updated_at', 'user_id'];
        
        // Try a simple metadata check - we'll just check if we can get it, but won't fail if not
        try {
          const { data: metadataCheck, error: metadataError } = await supabase
            .from('projects')
            .select('metadata')
            .limit(1);
            
          if (!metadataError) {
            projectColumns.push('metadata');
            console.log("Metadata column exists in projects table");
          } else {
            console.log("Metadata column doesn't exist in projects table:", metadataError.message);
          }
        } catch (metadataCheckError) {
          console.log("Error checking metadata column:", metadataCheckError);
        }
        
        console.log("Using columns for projects table:", projectColumns);
        
        // Use the projectColumns we've determined as safe
        const projectFields = projectColumns.join(',');
        
        // Now query with the fields we know exist
        const { data: projectProducts, error: projectError } = await supabase
          .from('projects')
          .select(projectFields)
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });
        
        console.log("Projects query results:", { 
          projectProducts: projectProducts ? projectProducts.length : 0, 
          error: projectError 
        });
        
        if (projectError) {
          if (projectError.code === '42P01') {
            console.log("The projects table doesn't exist yet. You may need to run migrations.");
          } else {
            console.error("Error fetching projects:", projectError);
          }
          return allProducts; // Return what we have from creator_contents
        } 
        
        if (projectProducts && projectProducts.length > 0) {
          const normalizedProjectProducts = projectProducts.map(project => {
            // Ensure project object is valid
            if (typeof project !== 'object' || project === null) {
              console.error("Invalid project data:", project);
              return null;
            }
            
            return {
              id: project.id || "",
              title: project.title || "Untitled Project",
              type: project.type || "project",
              status: project.status || "draft",
              created_at: project.created_at || new Date().toISOString(),
              updated_at: project.updated_at || new Date().toISOString(),
              user_id: project.user_id || userId,
              // For projects, the project_id is the same as the id
              project_id: project.id || "",
              // Only include metadata if it exists in the column
              metadata: projectColumns.includes('metadata') && project.metadata ? project.metadata : null,
              source: 'projects'
            };
          }).filter(p => p !== null) as Product[];
          
          // Merge without duplicates
          normalizedProjectProducts.forEach(project => {
            if (!allProducts.some(p => p.id === project.id)) {
              allProducts.push(project);
            }
          });
        }
      } catch (projectsError) {
        // If this errors out, just log it and continue with creator_contents data
        console.error("Exception querying projects:", projectsError);
      }
      
      // Sort by updated_at (newest first)
      allProducts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      // Create a new array reference and immediately update state
      console.log('Products fetch complete - updating state with:', allProducts.length, 'products');
      const productsToReturn = [...allProducts]; // Create a new reference to return
      setProducts(productsToReturn);
      
      try {
        localStorage.setItem('cached_products', JSON.stringify({
          data: productsToReturn,
          timestamp: Date.now()
        }));
        console.log('Products cached in localStorage successfully');
      } catch (cacheError) {
        console.log("Cache write error (non-critical):", cacheError);
      }
      
      // Use a small delay to ensure state is updated before we continue
      await new Promise(resolve => setTimeout(resolve, 10));
      
      return productsToReturn;
    } catch (supaError: any) {
      // Special handling for relation-does-not-exist errors
      if (supaError.code === '42P01') {
        setError("Database table not found. The system needs to be initialized with the proper schema.");
        return [];
      }
      console.error("Error fetching products from database:", supaError);
      setError("There was an error loading your products. The application will continue with limited functionality.");
      return [];
    }
  };

  // Helper function to refresh products in background
  const refreshProductsInBackground = async (userId: string) => {
    // Add debounce mechanism to prevent multiple refreshes
    const lastRefreshKey = 'last_products_refresh';
    
    try {
      // Check when we last performed a background refresh 
      const lastRefreshStr = localStorage.getItem(lastRefreshKey);
      if (lastRefreshStr) {
        const lastRefresh = parseInt(lastRefreshStr, 10);
        // Use a longer interval (2 minutes) to prevent excessive requests
        if (Date.now() - lastRefresh < 120 * 1000) {
          console.log("Skipping background refresh - too soon since last refresh");
          return;
        }
      }
      
      // Check if we got a previous error - don't retry too frequently
      const errorCacheKey = 'last_products_refresh_error';
      const lastErrorStr = localStorage.getItem(errorCacheKey);
      if (lastErrorStr) {
        try {
          const {timestamp, count} = JSON.parse(lastErrorStr);
          // If we had errors recently and more than a few times, back off for longer
          if (Date.now() - timestamp < 300 * 1000 && count > 2) {
            console.log("Skipping background refresh - backing off after recent errors");
            return;
          }
        } catch (e) {
          // If we can't parse the error data, just continue
          localStorage.removeItem(errorCacheKey);
        }
      }
      
      // Set the refresh timestamp before fetching
      localStorage.setItem(lastRefreshKey, Date.now().toString());
      
      console.log("Refreshing products in background");
      await fetchProductsFromDatabase(userId);
      
      // Clear error state on success
      localStorage.removeItem('last_products_refresh_error');
    } catch (error) {
      console.log("Background refresh error (non-critical):", error);
      
      // Record error to implement exponential backoff
      try {
        const errorCacheKey = 'last_products_refresh_error';
        const lastErrorStr = localStorage.getItem(errorCacheKey);
        let errorData = { timestamp: Date.now(), count: 1 };
        
        if (lastErrorStr) {
          const prevData = JSON.parse(lastErrorStr);
          // Increment error count if within 5 minutes
          if (Date.now() - prevData.timestamp < 300 * 1000) {
            errorData.count = prevData.count + 1;
          }
        }
        
        localStorage.setItem(errorCacheKey, JSON.stringify(errorData));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const createProduct = async (productData: Partial<Product>) => {
    try {
      setError(null);
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user || !user.user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from('creator_contents')
        .insert({
          ...productData,
          user_id: user.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      
      if (data && data[0]) {
        const newProduct = {
          id: data[0].id,
          title: data[0].title || "Untitled",
          type: data[0].type || "Unknown",
          status: data[0].status || "draft",
          created_at: data[0].created_at,
          updated_at: data[0].updated_at,
          user_id: data[0].user_id,
          project_id: data[0].project_id,
          metadata: data[0].metadata
        };
        
        setProducts([newProduct, ...products]);
        return newProduct;
      }
      
      return null;
    } catch (e: any) {
      console.error("Error creating product:", e);
      setError(e.message || "Failed to create product");
      return null;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('creator_contents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      
      if (data && data[0]) {
        const updatedProduct = {
          id: data[0].id,
          title: data[0].title || "Untitled",
          type: data[0].type || "Unknown",
          status: data[0].status || "draft",
          created_at: data[0].created_at,
          updated_at: data[0].updated_at,
          user_id: data[0].user_id,
          project_id: data[0].project_id,
          metadata: data[0].metadata
        };
        
        setProducts(products.map(p => p.id === id ? updatedProduct : p));
        return updatedProduct;
      }
      
      return null;
    } catch (e: any) {
      console.error("Error updating product:", e);
      setError(e.message || "Failed to update product");
      return null;
    }
  };

  const deleteProduct = async (id: string, source: string = 'creator_contents') => {
    try {
      setError(null);
      
      if (source === 'projects') {
        // Delete from projects table
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } else {
        // Default to creator_contents table
        const { error } = await supabase
          .from('creator_contents')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
      
      setProducts(products.filter(p => p.id !== id));
      return true;
    } catch (e: any) {
      console.error("Error deleting product:", e);
      setError(e.message || "Failed to delete product");
      return false;
    }
  };

  const getProductById = async (id: string) => {
    try {
      setError(null);
      
      // Check if this is a valid UUID before proceeding
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isValidUUID) {
        console.error("Invalid product ID format:", id);
        return null;
      }
      
      // Get current authenticated user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        console.error("User not authenticated when trying to get product");
        setError("Authentication required to view product details");
        return null;
      }
      
      // Create a cache key for this product that includes user ID to prevent leaking data
      const cacheKey = `product_${id}_${userData.user.id}`;
      
      // Check local state cache first (memory)
      const existingProduct = products.find(p => p.id === id);
      if (existingProduct) {
        console.log("Product found in memory cache:", id);
        return existingProduct;
      }
      
      // Check localStorage cache next
      try {
        const cachedProductJSON = localStorage.getItem(cacheKey);
        if (cachedProductJSON) {
          const cachedProduct = JSON.parse(cachedProductJSON);
          const cacheTime = cachedProduct._cacheTime;
          
          // Use cache if it's less than 5 minutes old
          if (cacheTime && (Date.now() - cacheTime < 5 * 60 * 1000)) {
            console.log("Product found in localStorage cache:", id);
            // Remove cache metadata before returning
            delete cachedProduct._cacheTime;
            return cachedProduct;
          }
        }
      } catch (cacheError) {
        console.log("Cache access error (non-critical):", cacheError);
      }
      
      console.log("Fetching product by ID:", id, "for user:", userData.user.id);
      
      // Instead of concurrent requests that might cause issues,
      // try one table first and then the other if needed
      let product = null;
      
      // Try creator_contents first - this is the main and most reliable source
      try {
        // Be specific about which fields we want to avoid schema issues
        const contentFields = 'id, title, description, type, status, created_at, updated_at, user_id, project_id, metadata';

        const { data, error } = await supabase
          .from('creator_contents')
          .select(contentFields)
          .eq('id', id)
          .eq('user_id', userData.user.id) // Add this filter for security
          .maybeSingle();
          
        if (error) {
          console.log("Error querying creator_contents:", error);
        } else if (data) {
          product = {
            id: data.id,
            title: data.title || "Untitled",
            description: data.description || "",
            type: data.type || "Unknown",
            status: data.status || "draft",
            created_at: data.created_at,
            updated_at: data.updated_at,
            user_id: data.user_id,
            project_id: data.project_id,
            metadata: data.metadata,
            // Workflow step might be available directly or in metadata
            workflow_step: data.workflow_step as WorkflowStep || (data.metadata?.workflow_step as WorkflowStep || null),
            source: 'creator_contents'
          };
          console.log("Product found in creator_contents:", product.title);
          
          // Found in creator_contents - no need to check projects
          return product;
        } else {
          console.log("No product found in creator_contents with ID:", id);
        }
      } catch (err) {
        console.error("Exception querying creator_contents:", err);
      }
      
      // Only if not found in creator_contents, carefully try projects
      if (!product) {
        try {
          // Check if the table exists and what fields are valid to query
          // Use the same approach as in fetchProductsFromDatabase to avoid schema issues
          const projectColumns = ['id', 'title', 'type', 'status', 'created_at', 'updated_at', 'user_id'];
          
          // Check if description exists
          try {
            const { data: descriptionCheck, error: descriptionError } = await supabase
              .from('projects')
              .select('description')
              .limit(1);
              
            if (!descriptionError) {
              projectColumns.push('description');
            }
          } catch (e) {
            // Ignore error, just move on without description
          }
          
          // Check if metadata exists
          try {
            const { data: metadataCheck, error: metadataError } = await supabase
              .from('projects')
              .select('metadata')
              .limit(1);
              
            if (!metadataError) {
              projectColumns.push('metadata');
            }
          } catch (e) {
            // Ignore error, just move on without metadata
          }
          
          // Only proceed with the query if we know the table exists
          const projectFields = projectColumns.join(',');
          
          const { data, error } = await supabase
            .from('projects')
            .select(projectFields)
            .eq('id', id)
            .eq('user_id', userData.user.id) // Add this filter for security
            .maybeSingle();
            
          if (error) {
            console.log("Error querying projects:", error);
          } else if (data) {
            product = {
              id: data?.id || "",
              title: data?.title || "Untitled Project",
              description: data?.description || "",
              type: data?.type || "project",
              status: data?.status || "draft",
              created_at: data?.created_at || new Date().toISOString(),
              updated_at: data?.updated_at || new Date().toISOString(),
              user_id: data?.user_id || "",
              project_id: data?.id || "", // For projects, use the id as project_id
              metadata: projectColumns.includes('metadata') ? (data?.metadata || null) : null,
              source: 'projects'
            };
            console.log("Product found in projects:", product.title);
          } else {
            console.log("No product found in projects with ID:", id);
          }
        } catch (err) {
          console.error("Exception querying projects:", err);
        }
      }
      
      // Cache the result if we found something
      if (product) {
        try {
          // Add a cache timestamp
          const productToCache = {
            ...product,
            _cacheTime: Date.now()
          };
          
          localStorage.setItem(cacheKey, JSON.stringify(productToCache));
        } catch (cacheError) {
          // Non-critical error, just log it
          console.log("Cache storage error (non-critical):", cacheError);
        }
      } else {
        console.log("Product not found in any table for this user:", id);
        setError("Product not found or you don't have permission to view it");
      }
      
      return product;
    } catch (e) {
      console.error("Error in getProductById:", e);
      setError("Failed to load product");
      return null;
    }
  };

  const refreshProducts = async () => {
    setError(null);
    // Clear localStorage cache
    try {
      localStorage.removeItem('cached_products');
      console.log("Cleared products cache from localStorage");
    } catch (e) {
      console.error("Error clearing cache:", e);
    }
    return await fetchProducts();
  };

  return {
    products: products || [], // Ensure we never return undefined
    isLoading,
    error,
    fetchProducts,
    refreshProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById
  };
}