import React from "react";
import { Book, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "../../../../supabase/auth";
import { Link } from "react-router-dom";

interface TopNavigationProps {
  onSearch?: (query: string) => void;
  activeTab?: string;
}

const TopNavigation = ({
  onSearch = () => {},
  activeTab = "Dashboard",
}: TopNavigationProps) => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Brain Dump", href: "/brain-dump" },
    { label: "Creator", href: "/creator" },
    { label: "Products", href: "/products" },
  ];

  return (
    <header className="w-full h-16 border-b border-accent-tertiary/20 bg-paper flex items-center justify-between px-6 fixed top-0 z-50 transition-colors duration-200">
      <div className="flex items-center gap-8">
        <Link to="/" className="navbar-logo">
          <Book className="h-5 w-5 text-accent-primary" />
          <span>Textera</span>
        </Link>

        <nav className="navbar-links">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`${
                activeTab === item.label
                  ? "navbar-link-active"
                  : "navbar-link"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 text-ink-dark rounded-full p-1 hover:bg-accent-tertiary/10"
            >
              <Avatar className="h-8 w-8 bg-accent-primary/10">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt={user.email || ""}
                />
                <AvatarFallback className="font-serif text-accent-primary">M</AvatarFallback>
              </Avatar>
              <span className="text-sm font-serif">matt</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-paper border-accent-tertiary/20 shadow-medium">
            <DropdownMenuLabel className="font-display text-ink-dark">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-accent-tertiary/10" />
            <DropdownMenuItem className="py-2 text-ink-dark hover:bg-accent-primary/5 hover:text-accent-primary font-serif">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2 text-ink-dark hover:bg-accent-primary/5 hover:text-accent-primary font-serif">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-accent-tertiary/10" />
            <DropdownMenuItem onSelect={() => signOut()} className="py-2 text-ink-dark hover:bg-accent-primary/5 hover:text-accent-primary font-serif">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopNavigation;
