import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase/supabase'; // Corrected path
import { useAuth } from '../../supabase/auth'; // Corrected path to auth.tsx
import { RealtimeChannel } from '@supabase/supabase-js';

// Define the Notification type based on your table schema
export interface Notification {
  /* Primary DB columns */
  id?: string;
  user_id?: string;
  message?: string;
  title?: string;
  created_at?: string;
  read_at?: string | null;
  notification_type?: string;
  target_url?: string;
  is_deleted?: boolean;

  /* ----- Derived / UI-only fields ----- */
  /** Convenience boolean used heavily in UI components */
  isRead?: boolean;
  /** Client-side toast style helpers (not persisted) */
  type?: 'success' | 'info' | 'warning' | 'error';
  // Additional custom fields can be added as needed
}

// helper to map row to Notification with isRead
const mapDbNotification = (row: Notification): Notification => ({
  ...row,
  isRead: row.read_at !== null,
});

const NOTIFICATIONS_PER_PAGE = 10;

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Log user state on mount and change
  useEffect(() => {
    console.log('[useNotifications] User state:', user ? `ID: ${user.id}` : 'null');
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    console.log('[useNotifications] Fetching unread count...'); // Log fetch start
    if (!user) {
        console.log('[useNotifications] No user, skipping fetchUnreadCount');
        return;
    }
    try {
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null)
        .eq('is_deleted', false); // <-- Filter out deleted

      if (countError) throw countError;
      console.log('[useNotifications] Unread count fetched:', count);
      setUnreadCount(count ?? 0);
    } catch (err: any) {
      console.error('[useNotifications] Error fetching unread count:', err);
      // Optionally set an error state here
    }
  }, [user]);

  const fetchNotifications = useCallback(async (page: number, initialLoad = false) => {
    console.log(`[useNotifications] Fetching notifications (page: ${page}, initial: ${initialLoad})...`); // Log fetch start
    if (!user) {
        console.log('[useNotifications] No user, skipping fetchNotifications');
        return;
    }
    setIsLoading(true);
    setError(null);

    const from = page * NOTIFICATIONS_PER_PAGE;
    const to = from + NOTIFICATIONS_PER_PAGE - 1;

    try {
      const { data, error: fetchError, count } = await supabase
        .from('notifications')
        .select('*', { count: 'estimated' }) // Use estimated for performance after initial load
        .eq('user_id', user.id)
        .eq('is_deleted', false) // <-- Filter out deleted
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;
      console.log(`[useNotifications] Notifications fetched (page: ${page}):`, data?.length ?? 0, 'items');
      const newNotifications = (data?.filter(n => !n.is_deleted) ?? []).map(mapDbNotification);
      setNotifications(prev => initialLoad ? newNotifications : [...prev, ...newNotifications]);
      // Determine if there are more notifications based on whether we fetched a full page
      setHasMore((newNotifications.length ?? 0) === NOTIFICATIONS_PER_PAGE);
      setCurrentPage(page);

    } catch (err: any) {
      console.error(`[useNotifications] Error fetching notifications (page: ${page}):`, err);
      setError('Failed to fetch notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchMoreNotifications = () => {
    if (!isLoading && hasMore) {
      fetchNotifications(currentPage + 1);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    const notificationToUpdate = notifications.find(n => n.id === notificationId);
    if (!notificationToUpdate || notificationToUpdate.is_deleted) return; // Don't mark deleted as read
    
    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString(), isRead: true } : n)
    );
    const wasUnread = notificationToUpdate.read_at === null;
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('id', notificationId)
        .is('read_at', null);

      if (updateError) {
          // Revert optimistic update on error
          console.error('Error marking notification as read:', updateError);
          setNotifications(prev =>
              prev.map(n => n.id === notificationId ? { ...n, read_at: null } : n)
          );
          if (wasUnread) {
            setUnreadCount(prev => prev + 1);
          }
          throw updateError;
      }
      // No need to refetch count on success, optimistic update handled it
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setError('Failed to update notification status.');
      // Consider reverting optimistic update here as well
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    const now = new Date().toISOString();
    const originalNotifications = [...notifications]; // Store for potential revert

    // Optimistic UI update - only update non-deleted items
    setNotifications(prev => 
        prev.map(n => 
            (n.read_at === null && !n.is_deleted) ? { ...n, read_at: now } : n
        )
    );
    setUnreadCount(0); // Optimistically set to 0

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('user_id', user.id)
        .is('read_at', null)
        .eq('is_deleted', false); // <-- Only mark non-deleted as read

      if (updateError) {
        // Revert optimistic update on error
         console.error('Error marking all notifications as read:', updateError);
         // This revert is complex as we don't store the original state easily
         // Simplest is to refetch count and maybe notifications
         fetchUnreadCount();
         // Potentially refetch notifications if accuracy is critical
         // fetchNotifications(0, true); // Reset and fetch first page
         throw updateError;
      }
      // Unread count already set to 0 optimistically
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to update all notifications.');
      // Revert optimistic update or refetch
       fetchUnreadCount();
    }
  };

  // --- NEW DELETE FUNCTION --- 
  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    if (!notificationToDelete) return; // Already removed or doesn't exist

    // Store previous state for potential revert
    const previousNotifications = [...notifications];
    const wasUnread = !notificationToDelete.read_at;

    // Optimistic UI Update: Remove the notification from the list
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setError(null); // Clear previous errors

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .update({ is_deleted: true })
        .eq('user_id', user.id)
        .eq('id', notificationId);

      if (deleteError) {
        throw deleteError;
      }
      console.log(`[useNotifications] Notification ${notificationId} marked as deleted.`);
    } catch (err: any) {
      console.error('Error marking notification as deleted:', err);
      setError('Failed to delete notification.');
      // Revert optimistic update on error
      setNotifications(previousNotifications);
      if (wasUnread) {
        setUnreadCount(prev => prev + 1); // Add count back if deletion failed
      }
    }
  };
  // --- END DELETE FUNCTION ---

  // Effect for initial fetch and setting up Realtime
  useEffect(() => {
    if (user) {
      console.log('[useNotifications] User detected, setting up fetches and Realtime...');
      // Initial data fetch
      fetchUnreadCount();
      fetchNotifications(0, true); // Fetch first page on initial load/user change

      // Set up Realtime subscription for both INSERT and UPDATE
      const handleRealtimeInsert = (payload: any) => {
        const newNotification = mapDbNotification(payload.new as Notification);
        if (!newNotification.is_deleted) {
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.read_at) {
            setUnreadCount(prev => prev + 1);
          }
        }
      };
      
      const handleRealtimeUpdate = (payload: any) => {
           const updatedNotification = mapDbNotification(payload.new as Notification);
           const oldNotification = payload.old as Partial<Notification> | undefined;

           // Check if it was marked deleted
           if (updatedNotification.is_deleted && !oldNotification?.is_deleted) {
               setNotifications(prev => prev.filter(n => n.id !== updatedNotification.id));
               if (oldNotification?.read_at === null) { // If it was unread before deletion
                    setUnreadCount(prev => Math.max(0, prev - 1));
               }
           } else if (!updatedNotification.is_deleted) {
               // Handle other updates (like mark as read/unread) only for non-deleted items
                setNotifications(prev =>
                  prev.map(n => (n.id === updatedNotification.id ? updatedNotification : n))
                );
                // ... (rest of mark read/unread count logic as before, checking oldNotification) ...
                 const markedAsRead = updatedNotification.read_at !== null && oldNotification?.read_at === null;
                 if (markedAsRead) {
                    const localVersion = notifications.find(n => n.id === updatedNotification.id);
                     if (localVersion && localVersion.read_at === null) {
                          setUnreadCount(prev => Math.max(0, prev - 1));
                     }
                 }
                 const markedUnread = updatedNotification.read_at === null && oldNotification?.read_at !== null;
                 if (markedUnread) {
                     setUnreadCount(prev => prev + 1);
                 }
           }
      };

      const newChannel = supabase
        .channel(`notifications:${user.id}`)
        .on<Notification>(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          handleRealtimeInsert
        )
        .on<Notification>(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          handleRealtimeUpdate
        )
        .subscribe((status, err) => {
          console.log('[useNotifications] Channel status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('[useNotifications] Subscribed to notifications channel');
          }
          if (status === 'CHANNEL_ERROR' || err) {
            console.error('Notifications channel error:', err);
            setError('Realtime connection error.');
          }
          if (status === 'TIMED_OUT') {
            console.warn('Notifications channel timed out.');
            setError('Realtime connection timed out.');
          }
        });

      setChannel(newChannel);

      // Cleanup on unmount or user change
      return () => {
        if (newChannel) {
          supabase.removeChannel(newChannel).catch(err => console.error('Error removing channel:', err));
        }
      };
    } else {
      // User logged out - cleanup state
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(true);
      setCurrentPage(0);
      if (channel) {
        supabase.removeChannel(channel).catch(err => console.error('Error removing channel on logout:', err));
        setChannel(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore,
    fetchMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    fetchUnreadCount
  };
};