import React, { useState } from 'react';
import { useAuth } from '../../../supabase/auth';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Moon, Sun, Laptop } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const UserNavDropdown = () => {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const handleImageError = () => {
    setImageError(true);
  };

  // Generate a fallback for when image fails to load or doesn't exist
  const getInitials = () => {
    if (profile?.username) {
      return profile.username.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 font-serif text-white/90 hover:text-white">
          <Avatar className="h-8 w-8 bg-gold/20 border border-gold/30">
            {profile?.avatar_url && !imageError ? (
              <AvatarImage
                src={profile.avatar_url}
                alt={user?.email || ""}
                onError={handleImageError}
              />
            ) : (
              <AvatarFallback className="font-serif text-white">
                {getInitials()}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-[15px] text-white">
            {profile?.username || user?.user_metadata?.full_name || (user?.email ? user.email?.split("@")[0] : 'User')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-[#191f25] border border-white/10 shadow-blue-sm text-white" side="bottom" sideOffset={5}>
        <DropdownMenuLabel className="font-display text-white text-[15px]">My Account</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem asChild className="cursor-pointer py-2 text-white hover:bg-white/10 hover:text-accent-yellow font-serif text-[15px]">
          <Link to="/profile" className="flex w-full cursor-pointer items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer py-2 text-white hover:bg-white/10 hover:text-accent-yellow font-serif text-[15px]">
          <Link to="/settings" className="flex w-full cursor-pointer items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer py-2 text-white hover:bg-white/10 hover:text-accent-yellow font-serif text-[15px]"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer py-2 text-white hover:bg-white/10 hover:text-accent-yellow font-serif text-[15px]"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="cursor-pointer py-2 text-white hover:bg-white/10 hover:text-accent-yellow font-serif text-[15px]"
        >
          <Laptop className="mr-2 h-4 w-4" />
          <span>System Theme</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer py-2 text-white hover:bg-white/10 hover:text-accent-yellow font-serif text-[15px]"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNavDropdown; 