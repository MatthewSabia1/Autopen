import React from "react";
import { Bell, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  if (!user) return null;

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="md:flex md:flex-1 md:max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 border-gray-200 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Messages</span>
          </Button>
          
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <div className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white"></span>
            </div>
            <span className="sr-only">Notifications</span>
          </Button>
          
          <div className="h-8 w-px bg-gray-200 mx-1"></div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full p-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <span className="text-xs font-medium">{user.email ? user.email[0].toUpperCase() : "U"}</span>
                </div>
                <span className="sr-only">User</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}