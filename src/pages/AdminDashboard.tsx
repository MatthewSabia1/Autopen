import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Corrected import: import the instance, not the function
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming shadcn/ui setup
import { Loader2, Users, DollarSign, AlertCircle, LayoutDashboard, RefreshCcw } from 'lucide-react'; // Import icons
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui setup
import UsersTable from '@/components/admin/UsersTable'; // Import the new UsersTable component
import { toast } from "react-hot-toast";
import DashboardLayout from '@/components/layout/DashboardLayout'; // Import the layout component

// Define a type for the user data returned by the RPC function
type AdminUserData = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  is_admin: boolean;
  subscription_status: string | null;
  created_at: string;
};

// Mock data for development (if Supabase is having issues)
const MOCK_USERS: AdminUserData[] = [
  {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'AliceJ',
    avatar_url: null,
    email: 'alice@example.com',
    is_admin: true,
    subscription_status: 'Active',
    created_at: new Date().toISOString(),
  },
  {
    user_id: '223e4567-e89b-12d3-a456-426614174001',
    username: 'BobS',
    avatar_url: null,
    email: 'bob@example.com',
    is_admin: false,
    subscription_status: 'Inactive',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  },
  {
    user_id: '323e4567-e89b-12d3-a456-426614174002',
    username: 'CharlieD',
    avatar_url: null,
    email: 'charlie@example.com',
    is_admin: false,
    subscription_status: 'Pending',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },
];

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [stripeStats, setStripeStats] = useState<any>(null); // Placeholder for Stripe data
  const [stripeLoading, setStripeLoading] = useState(false); // Separate loading for Stripe
  const [stripeError, setStripeError] = useState<string | null>(null); // Separate error for Stripe
  const [loading, setLoading] = useState(true); // Loading for user data
  const [error, setError] = useState<string | null>(null); // Error for user data
  const [useFallbackData, setUseFallbackData] = useState(false);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.rpc('get_admin_dashboard_users');

      if (rpcError) {
        throw rpcError;
      }

      setUsers(data || []);
      setUseFallbackData(false);
    } catch (err: any) {
      console.error("Error fetching admin user data:", err);
      setError(`Failed to load user data: ${err.message}. Ensure you are logged in as an admin.`);
      // Don't automatically switch to mock data; let the user decide
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Function to switch to mock data for development
  const useMockData = () => {
    setUsers(MOCK_USERS);
    setUseFallbackData(true);
    setError(null);
    setLoading(false);
  };

  // Handler for updating user data via the dialog
  const handleUserUpdate = async (updatedData: Partial<AdminUserData> & { user_id: string }) => {
    // Prepare payload for the RPC function
    const payload = {
      target_user_id: updatedData.user_id,
      new_username: updatedData.username,
      new_is_admin: updatedData.is_admin,
    };

    console.log("Attempting to update user:", payload);

    try {
        const { error: updateError } = await supabase.rpc('admin_update_user_profile', payload);

        if (updateError) {
            throw updateError;
        }

        toast.success('User profile updated successfully!');
        fetchUserData(); // Refresh the user list
    } catch (err: any) {
        console.error("Error updating user profile:", err);
        toast.error(`Failed to update profile: ${err.message || 'Unknown error'}`);
        // Optionally set the main error state, though toast is often preferred for action errors
        // setError(`Failed to update profile: ${err.message}`); 
    }
  };

  // Placeholder handler for managing subscription
  const handleSubscriptionManage = (userId: string) => {
    console.log(`Manage subscription requested for user ID: ${userId}`);
    // Replace with actual logic to redirect to Stripe customer portal or trigger backend function
    toast.info('Subscription management is not yet implemented.', { icon: 'ℹ️' });
    // Example redirect (needs stripe customer ID mapping):
    // const customerId = getStripeCustomerIdForUser(userId); // You'd need this mapping
    // if (customerId) { 
    //   window.open(`https://dashboard.stripe.com/customers/${customerId}`, '_blank');
    // } else {
    //   toast.error('Stripe customer ID not found for this user.');
    // }
  };

  return (
    <DashboardLayout activeTab="Admin">
      <div className="space-y-8">
        {/* Page Title */}
        <h1 className="text-2xl font-display font-medium text-ink-dark dark:text-ink-dark-dark tracking-tight flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-accent-primary" />
          Admin Dashboard
        </h1>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
            <span className="ml-3 text-ink-light dark:text-ink-light-dark font-serif">Loading dashboard data...</span>
          </div>
        )}

        {/* Error State with options to retry or use mock data */}
        {error && !loading && (
          <Card className="border-danger/50 bg-danger/5 text-danger dark:bg-danger/10 dark:border-danger/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium font-serif text-danger dark:text-danger-dark">
                <AlertCircle className="w-5 h-5" />
                Error Loading Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-serif text-danger dark:text-danger-dark">{error}</p>
              <div className="flex gap-3 mt-4">
                <Button variant="destructive" size="sm" onClick={fetchUserData} className="flex items-center gap-1">
                  <RefreshCcw className="w-4 h-4" />
                  Retry
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={useMockData}
                  className="text-ink-light border-ink-light/50 hover:bg-ink-light/5 dark:text-ink-light-dark dark:border-ink-light-dark/50 dark:hover:bg-ink-light-dark/10"
                >
                  Use Sample User Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Area (only show if not loading and no error OR using fallback) */}
        {!loading && (!error || useFallbackData) && (
          <>
            {useFallbackData && (
              <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50">
                <CardContent className="p-4 text-sm text-amber-800 dark:text-amber-300 font-serif">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Using sample data. Real-time Supabase connection unavailable.</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section 1: Stripe Stats (Placeholders) */}
            <section>
              <h2 className="text-xl font-display font-medium text-ink-dark dark:text-ink-dark-dark tracking-tight mb-5 flex items-center gap-3">
                <div className="bg-accent-primary/10 dark:bg-accent-primary/20 p-1.5 rounded-md">
                   <DollarSign className="w-5 h-5 text-accent-primary" />
                 </div>
                Stripe Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[ // Note: Using placeholder values, replace with actual Stripe data when integrated
                  { title: "Total Revenue", value: "$9,745", icon: DollarSign, label: "All Time", progress: 75 },
                  { title: "Monthly Recurring", value: "$2,100", icon: DollarSign, label: "MRR", progress: 60 },
                  { title: "Active Subs", value: "27", icon: Users, label: "Count", progress: 90 },
                  { title: "New Users (24h)", value: "3", icon: Users, label: "Count", progress: 30 },
                ].map((stat, index) => (
                  <Card key={index} className="border border-accent-tertiary/20 dark:border-accent-tertiary-dark/20 bg-gradient-to-br from-paper dark:from-paper-dark to-cream dark:to-paper-dark shadow-sm dark:shadow-md rounded-lg overflow-hidden group hover:border-accent-primary/50 dark:hover:border-accent-primary-dark/50 hover:shadow-md dark:hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="flex flex-col p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-ink-light dark:text-ink-light-dark text-sm font-medium font-sans">{stat.title}</p>
                          <div className="w-10 h-10 bg-accent-tertiary/50 dark:bg-accent-tertiary-dark/30 rounded-full flex items-center justify-center group-hover:bg-accent-primary/10 dark:group-hover:bg-accent-primary-dark/20 transition-colors duration-300">
                            <stat.icon className="w-5 h-5 text-accent-primary group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        </div>
                        <div className="flex items-baseline">
                          <p className="text-ink-dark dark:text-ink-dark-dark text-3xl font-serif font-medium">{stat.value}</p>
                          {stat.label && (
                            <div className="ml-2 text-xs text-accent-primary dark:text-accent-primary-dark font-medium font-sans px-1.5 py-0.5 bg-accent-primary/10 dark:bg-accent-primary-dark/20 rounded">
                              {stat.label}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Optional: Add progress bar like in guide example */}
                      <div className="h-1.5 w-full bg-accent-primary/10 dark:bg-accent-primary-dark/20">
                        <div
                          className="h-1.5 bg-accent-primary rounded-r-full transition-all duration-1000"
                          style={{ width: `${stat.progress}%` }} // Example progress
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Section 2: User Management */}
            <section>
              <h2 className="text-xl font-display font-medium text-ink-dark dark:text-ink-dark-dark tracking-tight mb-5 flex items-center gap-3">
                <div className="bg-accent-primary/10 dark:bg-accent-primary/20 p-1.5 rounded-md">
                  <Users className="w-5 h-5 text-accent-primary" />
                </div>
                User Management
              </h2>
              <Card className="border border-accent-tertiary/20 dark:border-accent-tertiary-dark/20 bg-paper dark:bg-paper-dark shadow-sm dark:shadow-md rounded-lg hover:shadow-md dark:hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  <UsersTable
                    users={users}
                    onUserUpdate={handleUserUpdate}
                    onSubscriptionManage={handleSubscriptionManage}
                  />
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard; 