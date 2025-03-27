import React from "react";
import { Bell, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { useAuth } from "../../../../supabase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TopNavigation() {
  const { user, signOut } = useAuth();
  const { isDarkMode } = useTheme();

  if (!user) return null;

  return (
    <header className="border-b border-accent-tertiary/30 dark:border-accent-tertiary/50 bg-paper dark:bg-card sticky top-0 z-10 shadow-sm transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="md:flex md:flex-1 md:max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faded dark:text-ink-faded" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 border-accent-tertiary/30 dark:border-accent-tertiary/50 bg-white dark:bg-card focus:bg-white dark:focus:bg-card"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
          <ThemeToggle variant="ghost" size="sm" />
        
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-ink-light dark:text-ink-light hover:text-ink-dark dark:hover:text-ink-dark hover:bg-accent-tertiary/20 dark:hover:bg-accent-tertiary/20">
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Messages</span>
          </Button>
          
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-ink-light dark:text-ink-light hover:text-ink-dark dark:hover:text-ink-dark hover:bg-accent-tertiary/20 dark:hover:bg-accent-tertiary/20">
            <div className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white dark:border-card"></span>
            </div>
            <span className="sr-only">Notifications</span>
          </Button>
          
          <div className="h-8 w-px bg-accent-tertiary/40 dark:bg-accent-tertiary/30 mx-1"></div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full p-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary dark:from-accent-primary dark:to-accent-secondary text-white">
                  <span className="text-xs font-medium">{user.email ? user.email[0].toUpperCase() : "U"}</span>
                </div>
                <span className="sr-only">User</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-paper dark:bg-card border-accent-tertiary/30 dark:border-accent-tertiary/50">
              <DropdownMenuLabel className="text-ink-dark dark:text-ink-dark">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-accent-tertiary/30 dark:bg-accent-tertiary/50" />
              <DropdownMenuItem className="text-ink-light dark:text-ink-light hover:text-ink-dark dark:hover:text-ink-dark hover:bg-accent-tertiary/10 dark:hover:bg-accent-tertiary/20">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-ink-light dark:text-ink-light hover:text-ink-dark dark:hover:text-ink-dark hover:bg-accent-tertiary/10 dark:hover:bg-accent-tertiary/20">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-accent-tertiary/30 dark:bg-accent-tertiary/50" />
              <DropdownMenuItem 
                onClick={() => signOut()}
                className="text-danger dark:text-danger hover:bg-danger/5 dark:hover:bg-danger/10"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}