import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase/supabase';
import { useAuth } from '../../supabase/auth';
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
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Authentication error:", userError.message);
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      if (!userData || !userData.user) {
        console.error("User not authenticated - no valid user object found");
        
        try {
           const { data: sessionData } = await supabase.auth.getSession();
           console.log("Session check on auth failure:", sessionData ? 
              `Session exists: ${!!sessionData.session}, user: ${sessionData.session?.user?.id}, expires: ${sessionData.session?.expires_at}` : 
              "No session data");
        } catch (sessionErr) {
           console.error("Error checking session during auth failure:", sessionErr);
        }
        
        throw new Error("User not authenticated");
      }
      
      await fetchProductsFromDatabase(userData.user.id);
    } catch (e: any) {
      console.error("Error fetching products:", e);
      setError(e.message || "Failed to load products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchProductsFromDatabase = async (userId: string) => {
    try {
      const contentFields = 'id, title, type, status, created_at, updated_at, user_id, project_id, metadata';
      let allProducts: Product[] = [];
      
      try {
        const { data: userProducts, error: contentError } = await supabase
          .from('creator_contents')
          .select(contentFields)
          .eq('user_id', userId);
        
        if (contentError) {
          if (contentError.code === '42P01') {
             console.warn("`creator_contents` table not found. Skipping.");
          } else {
             console.error("Error querying creator_contents:", contentError);
          }
        }
        
        if (userProducts && userProducts.length > 0) {
          const normalizedContentProducts = userProducts.map(product => {
              let normalizedType = product.type;
              if (normalizedType) {
                const lowerType = normalizedType.toLowerCase().trim();
                if (lowerType.includes('ebook') || lowerType.includes('e-book') || lowerType === 'book') {
                  normalizedType = 'ebook';
                } else if (lowerType.includes('blog') || lowerType.includes('post') || lowerType.includes('article')) {
                  normalizedType = 'blog';
                } else if (lowerType.includes('social') || lowerType.includes('media')) {
                  normalizedType = 'social';
                } else if (lowerType.includes('video') || lowerType.includes('script')) {
                  normalizedType = 'video';
                } else if (lowerType.includes('course') || lowerType.includes('lesson')) {
                  normalizedType = 'course';
                }
              }
              return {
                id: product.id,
                title: product.title || "Untitled",
                type: normalizedType || "Unknown",
                status: product.status || "draft",
                created_at: product.created_at,
                updated_at: product.updated_at,
                user_id: product.user_id,
                project_id: product.project_id,
                metadata: product.metadata,
                source: 'creator_contents'
              } as Product;
            });
            allProducts = [...normalizedContentProducts];
        } else if (!contentError) {
        }
      } catch (contentQueryError) {
         console.error("Exception querying creator_contents:", contentQueryError);
      }
      
      try {
        const projectFields = 'id, title, type, status, created_at, updated_at, user_id, metadata';
        const { data: userProjects, error: projectError } = await supabase
          .from('projects')
          .select(projectFields)
          .eq('user_id', userId);
        
        if (projectError) {
          if (projectError.code === '42P01') {
            console.warn("`projects` table not found. Skipping.");
          } else {
            console.error("Error querying projects table:", projectError);
          }
        }
        
        if (userProjects && userProjects.length > 0) {
          const normalizedProjectProducts = userProjects.map(project => {
                if (typeof project !== 'object' || project === null) {
                  console.error("Invalid project data skipped:", project);
                  return null;
                }
                let normalizedType = project.type;
                 if (normalizedType) {
                   const lowerType = normalizedType.toLowerCase().trim();
                   if (lowerType.includes('ebook') || lowerType.includes('e-book') || lowerType === 'book') {
                     normalizedType = 'ebook';
                   } else if (lowerType.includes('blog') || lowerType.includes('post') || lowerType.includes('article')) {
                     normalizedType = 'blog';
                   } else if (lowerType.includes('social') || lowerType.includes('media')) {
                     normalizedType = 'social';
                   } else if (lowerType.includes('video') || lowerType.includes('script')) {
                     normalizedType = 'video';
                   } else if (lowerType.includes('course') || lowerType.includes('lesson')) {
                     normalizedType = 'course';
                   }
                 }
                return {
                  id: project.id || "",
                  title: project.title || "Untitled Project",
                  type: normalizedType || "project",
                  status: project.status || "draft",
                  created_at: project.created_at || new Date().toISOString(),
                  updated_at: project.updated_at || new Date().toISOString(),
                  user_id: project.user_id,
                  project_id: project.id || "",
                  metadata: project.metadata || null,
                  source: 'projects'
                };
              }).filter(p => p !== null) as Product[];
              
              allProducts = [...allProducts, ...normalizedProjectProducts];
        } else if (!projectError) {
        }
      } catch (projectsError) {
        console.error("Exception querying projects:", projectsError);
      }
      
      allProducts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      const productsToReturn = [...allProducts];
      setProducts(productsToReturn);
      
      return productsToReturn;
    } catch (supaError: any) {
      console.error("Error fetching products from database:", supaError);
      setError(supaError.message || "There was an error loading your products."); 
      return [];
    }
  };

  const refreshProductsInBackground = async (userId: string) => {
    const lastRefreshKey = 'last_products_refresh';
    try {
      const lastRefreshStr = localStorage.getItem(lastRefreshKey);
      if (lastRefreshStr) {
        const lastRefresh = parseInt(lastRefreshStr, 10);
        if (Date.now() - lastRefresh < 120 * 1000) {
          return;
        }
      }
      const errorCacheKey = 'last_products_refresh_error';
      const lastErrorStr = localStorage.getItem(errorCacheKey);
      if (lastErrorStr) {
        try {
          const {timestamp, count} = JSON.parse(lastErrorStr);
          if (Date.now() - timestamp < 300 * 1000 && count > 2) {
            return;
          }
        } catch (e) { localStorage.removeItem(errorCacheKey); }
      }
      localStorage.setItem(lastRefreshKey, Date.now().toString());
      await fetchProductsFromDatabase(userId);
      localStorage.removeItem('last_products_refresh_error');
    } catch (error) {
      console.log("Background refresh error (non-critical):", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (productData: Partial<Product>) => {
    try {
      setError(null);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        throw new Error("User not authenticated");
      }
      const { data, error } = await supabase
        .from('creator_contents')
        .insert({
          ...productData,
          user_id: userData.user.id,
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
        setProducts(prev => [newProduct, ...prev]);
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
        setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
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
      const tableName = source === 'projects' ? 'projects' : 'creator_contents';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
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
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isValidUUID) {
        console.error("Invalid product ID format:", id);
        return null;
      }
      const { data: userData } = await supabase.auth.getUser();
      if (!userData || !userData.user) {
        console.error("User not authenticated when trying to get product");
        setError("Authentication required to view product details");
        return null;
      }
      const userId = userData.user.id;
      const cacheKey = `product_${id}_${userId}`;
      
      // 1. Check memory cache
      const existingProduct = products.find(p => p.id === id);
      if (existingProduct) {
        return existingProduct;
      }
      
      // 2. Check localStorage cache
      try {
        const cachedProductJSON = localStorage.getItem(cacheKey);
        if (cachedProductJSON) {
          const cachedProduct = JSON.parse(cachedProductJSON);
          const cacheTime = cachedProduct._cacheTime;
          if (cacheTime && (Date.now() - cacheTime < 5 * 60 * 1000)) {
            delete cachedProduct._cacheTime;
            return cachedProduct;
          }
        }
      } catch (cacheError) {
        console.log("Cache access error (non-critical):", cacheError);
      }
      
      // 3. Query database tables concurrently
      let product: Product | null = null;
      const contentFields = 'id, title, description, type, status, created_at, updated_at, user_id, project_id, metadata, workflow_step';
      const projectFields = 'id, title, description, type, status, created_at, updated_at, user_id, metadata';

      try {
        const [contentResult, projectResult] = await Promise.allSettled([
          supabase
            .from('creator_contents')
            .select(contentFields)
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('projects')
            .select(projectFields)
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle()
        ]);

        // Process creator_contents result
        if (contentResult.status === 'fulfilled' && contentResult.value.data) {
          const data = contentResult.value.data;
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
            workflow_step: data.workflow_step as WorkflowStep || (data.metadata?.workflow_step as WorkflowStep || null),
            source: 'creator_contents'
          };
        } else if (contentResult.status === 'rejected') {
          // Log error but don't necessarily fail the whole function if projects might succeed
          console.error("Error querying creator_contents by ID:", contentResult.reason);
        }

        // Process projects result (only if not found in content)
        if (!product && projectResult.status === 'fulfilled' && projectResult.value.data) {
          const data = projectResult.value.data;
          product = {
            id: data?.id || "",
            title: data?.title || "Untitled Project",
            description: data?.description || "",
            type: data?.type || "project",
            status: data?.status || "draft",
            created_at: data?.created_at || new Date().toISOString(),
            updated_at: data?.updated_at || new Date().toISOString(),
            user_id: data?.user_id || "",
            project_id: data?.id || "",
            metadata: data?.metadata || null, // Simplified assumption based on previous code
            source: 'projects'
          };
        } else if (!product && projectResult.status === 'rejected') {
          console.error("Error querying projects by ID:", projectResult.reason);
        }

      } catch (err) {
        // This catch might not be strictly necessary with Promise.allSettled
        // but provides a fallback.
        console.error("Unexpected error during concurrent product fetch:", err);
      }

      // 4. Cache and return
      if (product) {
        try {
          const productToCache = { ...product, _cacheTime: Date.now() };
          localStorage.setItem(cacheKey, JSON.stringify(productToCache));
        } catch (cacheError) {
          console.log("Cache storage error (non-critical):", cacheError);
        }
      } else {
        if (!isLoading) setError("Product not found or you don't have permission");
      }
      return product;
      
    } catch (e) {
      console.error("Error in getProductById:", e);
      setError("Failed to load product");
      return null;
    }
  };

  const refreshProducts = async (): Promise<Product[]> => {
    setError(null);
    try {
      localStorage.removeItem('cached_products');
    } catch (e) {
      console.error("Error clearing cache:", e);
    }
    await fetchProducts();
    return products;
  };

  return {
    products: products || [],
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