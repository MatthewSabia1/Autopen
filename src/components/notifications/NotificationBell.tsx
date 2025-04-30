import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsExpanded(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Renamed for clarity
  const handleOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
    if (!open) {
      setIsExpanded(false);
    }
  };

  // Handle clicking on a notification item
  const handleItemClick = (notification: Notification, event: React.MouseEvent) => {
    // Prevent click if delete button was the target
    if ((event.target as HTMLElement).closest('.notification-delete-button')) {
      return;
    }

    if (!notification.read_at) {
      markAsRead(notification.id);
    }
    // Navigate if target_url is present
    if (notification.target_url) {
      navigate(notification.target_url);
      handleOpenChange(false); // Close dropdown after navigation
    } else {
       // If no target_url, just mark as read (already handled)
       // Keep dropdown open unless explicitly closed
    }
  };

  // Handle clicking the delete button
  const handleDeleteClick = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent item click and dropdown close
    deleteNotification(notificationId);
  };

  // Format date simply for display
  const formatDate = (dateString: string | Date) => {
    let date: Date;
    try {
      if (typeof dateString === 'string') {
          date = new Date(dateString);
      } else {
          date = dateString;
      }
      if (isNaN(date.getTime())) {
          throw new Error("Invalid date format");
      }
    } catch (err) { // Changed variable name for clarity
        console.error("Error parsing date for notification:", dateString, err);
        return "Invalid date";
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInHours < 1) return `${diffInMinutes}m ago`;
    if (diffInDays < 1) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString(); // Consider locale options if needed
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange} open={isDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white/90 dark:text-white/90 hover:text-white dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 rounded-md p-2.5 transition-all duration-200 focus-visible:ring-offset-0 focus-visible:ring-accent-primary/50 dark:focus-visible:ring-accent-yellow/50"
          aria-label="Open notifications"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-yellow opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-yellow"></span>
            </span>
          )}
          {error && (
            // Simple error indicator - could be enhanced
             <span className="absolute bottom-1.5 right-1.5 block h-2 w-2 rounded-full bg-danger ring-1 ring-white dark:ring-card" title={error} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={dropdownRef}
        align="end"
        className={cn(
          "w-80 md:w-96 bg-paper dark:bg-card border border-accent-tertiary/25 dark:border-accent-tertiary/40 shadow-lg dark:shadow-dark rounded-lg text-ink-dark dark:text-white overflow-y-auto custom-scrollbar dark:custom-scrollbar-dark animate-in fade-in-50 zoom-in-95 duration-100",
          "transition-[max-height] duration-300 ease-in-out",
          isExpanded ? "max-h-[90vh]" : "max-h-[80vh]"
        )}
        sideOffset={12}
      >
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-accent-tertiary/10 dark:from-accent-tertiary/15 to-transparent rounded-t-lg pointer-events-none z-0"></div>
        
        <DropdownMenuLabel className="flex justify-between items-center font-display text-ink-dark dark:text-white text-base px-5 py-4 border-b border-accent-tertiary/25 dark:border-accent-tertiary/40 sticky top-0 bg-paper dark:bg-card z-10">
          <div className="flex items-center gap-2">
            <span className="font-display text-[18px] font-medium tracking-tight">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="default" className="bg-accent-primary dark:bg-accent-yellow/90 text-white text-xs px-1.5 h-5 shadow-blue-sm dark:shadow-yellow-sm">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="link"
              className="p-0 h-auto text-sm text-accent-primary dark:text-accent-yellow hover:text-accent-secondary dark:hover:text-accent-yellow/80 font-serif font-medium transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation(); // Prevent dropdown close
                markAllAsRead();
              }}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>

        {notifications.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-accent-tertiary/15 dark:bg-accent-tertiary/20 rounded-full flex items-center justify-center mb-5 transition-all duration-200">
              <Bell className="h-8 w-8 text-ink-faded dark:text-ink-faded" />
            </div>
            <p className="text-center font-medium text-sm text-ink-dark dark:text-white/90">No new notifications</p>
            <p className="text-center text-xs text-ink-light dark:text-white/60 mt-1.5 font-serif">We'll notify you when something happens</p>
          </div>
        ) : (
          <div className="py-1">
             {isLoading && notifications.length === 0 && (
                <div className="p-10 text-center text-ink-faded font-serif">Loading...</div>
             )}
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                asChild 
              >
                 <div 
                    className={cn(
                       "relative flex flex-col items-start cursor-pointer py-4 pl-5 pr-3 text-ink-dark dark:text-white font-serif text-[14px] transition-all duration-200 m-0 border-b border-accent-tertiary/25 dark:border-accent-tertiary/45 last:border-b-0 outline-none group",
                       "hover:bg-accent-tertiary/20 dark:hover:bg-accent-tertiary/25 hover:shadow-soft dark:hover:shadow-sm",
                       "focus-within:bg-accent-tertiary/25 dark:focus-within:bg-accent-tertiary/30",
                        !notification.isRead 
                         ? "bg-accent-tertiary/15 dark:bg-accent-tertiary/20"
                         : "bg-transparent"
                    )}
                    onClick={(e) => handleItemClick(notification, e)} 
                 >
                    <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-accent-primary/80 dark:group-hover:bg-accent-yellow/80 transition-all duration-300 rounded-r opacity-0 group-hover:opacity-100"></div>
                    
                    {!notification.isRead && (
                      <div className="absolute left-2.5 top-[18px] h-2 w-2 rounded-full bg-accent-primary dark:bg-accent-yellow"></div>
                    )}
                    <div className="flex justify-between w-full items-start pl-3 relative z-10">
                      <span className={cn(
                           "font-serif text-[16px] text-ink-dark dark:text-white pr-3 leading-tight transition-colors duration-200 tracking-tight",
                           !notification.isRead ? "font-semibold" : "font-medium"
                      )}>
                        {notification.title} 
                      </span>
                      <span className="text-xs font-serif text-ink-faded dark:text-ink-faded whitespace-nowrap flex-shrink-0 mt-0.5 transition-colors duration-200 group-hover:text-ink-light dark:group-hover:text-ink-light">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-serif text-ink-light dark:text-white/80 leading-relaxed line-clamp-2 pl-3 mt-1.5 w-[calc(100%-2rem)] transition-colors duration-200 group-hover:text-ink-dark dark:group-hover:text-white/90 relative z-10">
                      {notification.message}
                    </p>
                     
                    {/* Delete Button */}                  
                    <Button 
                      variant="ghost"
                      size="icon"
                      className="notification-delete-button absolute top-1/2 right-2 transform -translate-y-1/2 w-7 h-7 p-1 rounded-full text-ink-faded dark:text-ink-faded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 hover:bg-accent-tertiary/25 dark:hover:bg-accent-tertiary/30 hover:text-danger dark:hover:text-danger focus:text-danger dark:focus:text-danger z-20"
                      onClick={(e) => handleDeleteClick(notification.id, e)}
                      aria-label="Delete notification"
                    >
                      <X className="w-4 h-4" />
                    </Button>

                    {/* Right Gradient on Hover (Subtle) */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-0">
                      <div className="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-l from-accent-tertiary/10 dark:from-accent-tertiary/15 to-transparent"></div>
                    </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        {!isExpanded && (
          <div className="bg-gradient-to-t from-paper dark:from-card to-transparent h-6 sticky bottom-[52px] pointer-events-none z-0"></div>
        )}
        <DropdownMenuSeparator className={cn(
          "bg-accent-tertiary/20 dark:border-accent-tertiary/40 my-0",
          isExpanded ? "mt-auto" : ""
        )} />
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={cn(
            "cursor-pointer py-3.5 px-5 text-center text-ink-dark dark:text-white hover:bg-accent-tertiary/10 dark:hover:bg-accent-yellow/10 focus:bg-accent-tertiary/10 dark:focus:bg-accent-yellow/10 font-serif text-[14px] justify-center rounded-b-lg font-medium transition-all duration-200 relative group z-10 outline-none",
            isExpanded && "sticky bottom-0 bg-paper dark:bg-card border-t border-accent-tertiary/25 dark:border-accent-tertiary/40 rounded-b-lg" 
          )}
        >
          <div className="flex w-full justify-center items-center gap-1.5 font-serif font-medium text-[15px]">
             {isExpanded ? (
              <>
                <span className="transition-all duration-200 group-hover:text-accent-primary dark:group-hover:text-accent-yellow">Collapse View</span>
                <ChevronUp className="w-4 h-4 transition-all duration-200 group-hover:text-accent-primary dark:group-hover:text-accent-yellow" />
              </>
            ) : (
              <>
                <span className="transition-all duration-200 group-hover:text-accent-primary dark:group-hover:text-accent-yellow">View All Notifications</span>
                <ChevronDown 
                  className="w-4 h-4 transition-all duration-300 transform opacity-0 translate-y-[-2px] group-hover:opacity-100 group-hover:translate-y-0 text-accent-primary/0 dark:text-accent-yellow/0 group-hover:text-accent-primary dark:group-hover:text-accent-yellow"
                />
              </>
            )}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell; 