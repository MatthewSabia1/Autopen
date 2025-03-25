import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabase';

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
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  project_id?: string;
  metadata?: ProductMetadata;
  source?: 'creator_contents' | 'projects' | string;
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: user } = await supabase.auth.getUser();
      
      if (!user || !user.user) {
        throw new Error("User not authenticated");
      }
      
      // Debug output
      console.log("Current authenticated user ID:", user.user.id);
      console.log("Checking if this matches product user_ids like: 73e9cee8-06bb-47f8-b915-a28015c5f11b");

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
      // Only select the fields we need
      const fields = 'id, title, type, status, created_at, updated_at, user_id, project_id, metadata';
      
      // Run queries in parallel
      const [contentResults, projectResults] = await Promise.allSettled([
        supabase
          .from('creator_contents')
          .select(fields)
          .eq('user_id', userId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('projects')
          .select(fields)
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
      ]);
      
      // Debug output for contentResults
      if (contentResults.status === 'fulfilled') {
        const { data: contentProducts, error: contentError } = contentResults.value;
        console.log("Creator contents query results:", { 
          contentProducts: contentProducts ? contentProducts.length : 0, 
          error: contentError 
        });
        
        if (contentProducts && contentProducts.length > 0) {
          console.log("First content product:", contentProducts[0]);
        }
      }
      
      // Debug output for projectResults
      if (projectResults.status === 'fulfilled') {
        const { data: projectProducts, error: projectError } = projectResults.value;
        console.log("Projects query results:", { 
          projectProducts: projectProducts ? projectProducts.length : 0, 
          error: projectError 
        });
      }
      
      let allProducts = [];
      
      // Process creator_contents results
      if (contentResults.status === 'fulfilled') {
        const { data: contentProducts, error: contentError } = contentResults.value;
        
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
        }
      }
      
      // Process projects results
      if (projectResults.status === 'fulfilled') {
        const { data: projectProducts, error: projectError } = projectResults.value;
        
        if (projectError && projectError.code !== '42P01') {
          console.error("Error fetching projects:", projectError);
        } else if (projectProducts && projectProducts.length > 0) {
          const normalizedProjectProducts = projectProducts.map(project => ({
            id: project.id,
            title: project.title || "Untitled Project",
            type: project.type || "project",
            status: project.status || "draft",
            created_at: project.created_at,
            updated_at: project.updated_at,
            user_id: project.user_id,
            project_id: project.id,
            metadata: null,
            source: 'projects'
          }));
          
          // Merge without duplicates
          normalizedProjectProducts.forEach(project => {
            if (!allProducts.some(p => p.id === project.id)) {
              allProducts.push(project);
            }
          });
        }
      }
      
      // Sort by updated_at (newest first)
      allProducts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      // Update state and cache the results
      setProducts(allProducts);
      
      try {
        localStorage.setItem('cached_products', JSON.stringify({
          data: allProducts,
          timestamp: Date.now()
        }));
      } catch (cacheError) {
        console.log("Cache write error (non-critical):", cacheError);
      }
      
      return allProducts;
    } catch (supaError: any) {
      // Special handling for relation-does-not-exist errors
      if (supaError.code === '42P01') {
        setError("Database table not found. The system needs to be initialized with the proper schema.");
        return [];
      }
      throw supaError;
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
        // Don't refresh if we've done so in the last 30 seconds
        if (Date.now() - lastRefresh < 30 * 1000) {
          console.log("Skipping background refresh - too soon since last refresh");
          return;
        }
      }
      
      // Set the refresh timestamp before fetching
      localStorage.setItem(lastRefreshKey, Date.now().toString());
      
      console.log("Refreshing products in background");
      await fetchProductsFromDatabase(userId);
    } catch (error) {
      console.log("Background refresh error (non-critical):", error);
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
      
      // Create a cache key for this product
      const cacheKey = `product_${id}`;
      
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
      
      console.log("Fetching product by ID:", id);
      
      // Optimize the database query - select only needed fields
      const fields = 'id, title, type, status, created_at, updated_at, user_id, project_id, metadata';
      
      // Instead of concurrent requests that might cause issues,
      // try one table first and then the other if needed
      let product = null;
      
      // Try creator_contents first
      try {
        const { data, error } = await supabase
          .from('creator_contents')
          .select(fields)
          .eq('id', id)
          .maybeSingle();
          
        if (error) {
          console.log("Error querying creator_contents:", error);
        } else if (data) {
          product = {
            id: data.id,
            title: data.title || "Untitled",
            type: data.type || "Unknown",
            status: data.status || "draft",
            created_at: data.created_at,
            updated_at: data.updated_at,
            user_id: data.user_id,
            project_id: data.project_id,
            metadata: data.metadata,
            source: 'creator_contents'
          };
        }
      } catch (err) {
        console.error("Exception querying creator_contents:", err);
      }
      
      // If not found in creator_contents, try projects
      if (!product) {
        try {
          const { data, error } = await supabase
            .from('projects')
            .select(fields)
            .eq('id', id)
            .maybeSingle();
            
          if (error) {
            console.log("Error querying projects:", error);
          } else if (data) {
            product = {
              id: data.id,
              title: data.title || "Untitled Project",
              type: data.type || "project",
              status: data.status || "draft",
              created_at: data.created_at,
              updated_at: data.updated_at,
              user_id: data.user_id,
              project_id: data.id,
              metadata: data.metadata || null,
              source: 'projects'
            };
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
        console.log("Product not found in any table:", id);
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
    products,
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