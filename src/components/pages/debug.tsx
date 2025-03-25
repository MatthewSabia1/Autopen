import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/supabase";
import DashboardLayout from "../layout/DashboardLayout";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (data && data.user) {
        setUserId(data.user.id);
      }
    } catch (e: any) {
      console.error("Error getting user:", e);
      setError(e.message);
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch products for the current user
      const { data: userProducts, error: userError } = await supabase
        .from('creator_contents')
        .select('*')
        .eq('user_id', userId);

      if (userError) throw userError;
      
      setProducts(userProducts || []);
      console.log("Fetched products:", userProducts?.length);
    } catch (e: any) {
      console.error("Error fetching products:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    try {
      localStorage.removeItem('cached_products');
      localStorage.removeItem('last_products_refresh');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('product_')) {
          localStorage.removeItem(key);
        }
      }
      alert("Cache cleared successfully!");
    } catch (e: any) {
      console.error("Error clearing cache:", e);
      setError(e.message);
    }
  };

  return (
    <DashboardLayout activeTab="Debug">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Debug Page</h2>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Current User ID:</strong> {userId || "Not logged in"}</p>
            <p><strong>Expected User ID:</strong> 73e9cee8-06bb-47f8-b915-a28015c5f11b</p>
            <p><strong>Match:</strong> {userId === "73e9cee8-06bb-47f8-b915-a28015c5f11b" ? "✅ Yes" : "❌ No"}</p>
          </CardContent>
        </Card>

        <div className="flex space-x-4">
          <Button onClick={fetchAllProducts} disabled={loading}>
            {loading ? "Loading..." : "Fetch Products Directly"}
          </Button>
          <Button onClick={clearCache} variant="outline">
            Clear localStorage Cache
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Products ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p>No products found</p>
            ) : (
              <ul className="space-y-2">
                {products.map((product) => (
                  <li key={product.id} className="border-b pb-2">
                    <strong>{product.title}</strong> ({product.type}) - 
                    Status: {product.status}, 
                    User: <code className="bg-gray-100 px-1">{product.user_id}</code>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 