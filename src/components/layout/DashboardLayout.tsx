import React, { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  FileText,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  BookOpen,
  BookText,
  PenTool,
  BarChart,
  HelpCircle,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab?: string;
}

const DashboardLayout = ({
  children,
  activeTab = "Dashboard",
}: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    {
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      href: "/dashboard",
    },
    {
      label: "Brain Dump",
      icon: <FileText className="h-5 w-5" />,
      href: "/brain-dump",
    },
    {
      label: "Creator",
      icon: <PenTool className="h-5 w-5" />,
      href: "/creator",
    },
    {
      label: "Products",
      icon: <BookText className="h-5 w-5" />,
      href: "/products",
    },
    {
      label: "Analytics",
      icon: <BarChart className="h-5 w-5" />,
      href: "/analytics",
    },
    {
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/settings",
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="paper"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="shadow-soft"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5 text-ink-dark" />
          ) : (
            <Menu className="h-5 w-5 text-ink-dark" />
          )}
        </Button>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-paper border-r border-accent-tertiary/20 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-accent-tertiary/20">
            <div className="navbar-logo">
              <BookOpen className="h-6 w-6 text-accent-primary" />
              <span>Textera</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-auto py-6 px-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-base font-serif",
                    activeTab === item.label
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-ink-light hover:bg-accent-primary/5 hover:text-ink-dark",
                  )}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  {activeTab === item.label ? (
                    <div className="text-accent-primary">{item.icon}</div>
                  ) : (
                    <div className="text-ink-light">{item.icon}</div>
                  )}
                  {item.label}
                </Button>
              ))}
            </nav>

            <div className="mt-8">
              <h3 className="text-xs font-serif text-ink-faded uppercase tracking-wider px-3 mb-2">
                Support
              </h3>
              <nav className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-base font-serif text-ink-light hover:bg-accent-primary/5 hover:text-ink-dark"
                >
                  <HelpCircle className="h-5 w-5 text-ink-light" />
                  Help Center
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-base font-serif text-ink-light hover:bg-accent-primary/5 hover:text-ink-dark"
                  onClick={() => {
                    navigate("/settings");
                    setSidebarOpen(false);
                  }}
                >
                  <Settings className="h-5 w-5 text-ink-light" />
                  Settings
                </Button>
              </nav>
            </div>
          </div>

          {/* User profile */}
          <div className="border-t border-accent-tertiary/20 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-base font-serif text-ink-light hover:bg-accent-primary/5 hover:text-ink-dark"
                >
                  <Avatar className="h-8 w-8 bg-accent-primary/10">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt={user.email || ""}
                    />
                    <AvatarFallback className="font-serif text-accent-primary">
                      {user.email ? user.email[0].toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-serif text-ink-dark">
                      {user.user_metadata?.full_name || user.email}
                    </span>
                    <span className="text-xs font-serif text-ink-faded">{user.email}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-paper border-accent-tertiary/20 shadow-medium">
                <DropdownMenuLabel className="font-display text-ink-dark">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-accent-tertiary/10" />
                <DropdownMenuItem className="cursor-pointer py-2 text-ink-dark hover:bg-accent-primary/5 hover:text-accent-primary font-serif">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate("/settings")}
                  className="cursor-pointer py-2 text-ink-dark hover:bg-accent-primary/5 hover:text-accent-primary font-serif"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-accent-tertiary/10" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer py-2 text-ink-dark hover:bg-accent-primary/5 hover:text-accent-primary font-serif"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top navigation */}
        <header className="h-16 bg-paper border-b border-accent-tertiary/20 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex-1 lg:flex-none">
            <h1 className="font-display text-xl text-ink-dark">{activeTab}</h1>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-ink-light hover:text-ink-dark"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <div className="hidden lg:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 font-serif">
                    <Avatar className="h-8 w-8 bg-accent-primary/10">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                        alt={user.email || ""}
                      />
                      <AvatarFallback className="font-serif text-accent-primary">
                        {user.email ? user.email[0].toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-ink-dark">
                      {user.user_metadata?.full_name ||
                        user.email?.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-paper border-accent-tertiary/20 shadow-medium">
                  <DropdownMenuLabel className="font-display text-ink-dark">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-accent-tertiary/10" />
                  <DropdownMenuItem className="cursor-pointer py-2 text-ink-dark hover:bg-accent-primary/5 hover:text-accent-primary font-serif">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/settings")}
                    className="cursor-pointer py-2 text-ink-dark hover:bg-accent-primary/5 hover:text-accent-primary font-serif"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-accent-tertiary/10" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer py-2 text-ink-dark hover:bg-accent-primary/5 hover:text-accent-primary font-serif"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
