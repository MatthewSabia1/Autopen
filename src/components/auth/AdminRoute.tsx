import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../supabase/auth';

const AdminRoute: React.FC = () => {
  const { user, profile, loading, profileLoading } = useAuth();

  // Combine loading states
  const isLoading = loading || profileLoading;

  if (isLoading) {
    // Display a loading indicator while checking auth and profile
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  // Check if user is logged in and is an admin
  if (!user || !profile?.is_admin) {
    // Redirect non-admins to the main dashboard or home page
    // Choose the appropriate redirect path (e.g., '/dashboard' or '/')
    console.warn('Access Denied: User is not an admin.');
    return <Navigate to="/dashboard" replace />;
  }

  // If user is authenticated and is an admin, render the child routes/component
  return <Outlet />;
};

export default AdminRoute; 