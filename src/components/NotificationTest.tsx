import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabase';
import { useAuth } from '../../supabase/auth';

// Simple component to test direct notification fetching
const NotificationTest: React.FC = () => {
  const { user } = useAuth();
  const [notificationCount, setNotificationCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);

  // Test basic Supabase connectivity
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Simple health check query
        const { error } = await supabase.from('notifications').select('id', { head: true, count: 'exact' });
        
        if (error) {
          console.error('Supabase basic test failed:', error);
          setConnectionOk(false);
          setError(`Connection error: ${error.message}`);
        } else {
          setConnectionOk(true);
        }
      } catch (err) {
        console.error('Unexpected error in basic test:', err);
        setConnectionOk(false);
        setError(`Connection exception: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    testConnection();
  }, []);

  // Test notification fetching (only if connection works and user exists)
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!connectionOk || !user) return;

      setLoading(true);
      setError(null);

      try {
        console.log('Attempting to fetch notifications for user:', user.id);
        
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching notifications count:', error);
          setError(`Fetch error: ${error.message}`);
        } else {
          console.log('Successfully fetched notification count:', count);
          setNotificationCount(count || 0);
        }
      } catch (err) {
        console.error('Unexpected error fetching notifications:', err);
        setError(`Fetch exception: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [connectionOk, user]);

  // For debugging: Show the auth status directly
  const authStatus = user ? `Authenticated (${user.id.slice(0, 6)}...)` : 'Not authenticated';

  return (
    <div className="p-4 border border-gray-300 rounded my-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-2">Notification System Diagnostic</h3>
      
      <div className="mb-2">
        <strong>Auth Status:</strong> {authStatus}
      </div>
      
      <div className="mb-2">
        <strong>Supabase Connection:</strong>{' '}
        {connectionOk === null 
          ? 'Testing...' 
          : connectionOk 
            ? '✅ Connected' 
            : '❌ Failed'}
      </div>
      
      {user && (
        <div className="mb-2">
          <strong>Notifications:</strong>{' '}
          {loading 
            ? 'Loading...' 
            : error 
              ? '❌ Error' 
              : `✅ Found ${notificationCount} notification(s)`}
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default NotificationTest; 