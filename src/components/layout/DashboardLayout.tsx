import React, { ReactNode, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
  Brain,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import UserNavDropdown from "./UserNavDropdown";

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab?: string;
}

const DashboardLayout = ({
  children,
  activeTab = "Dashboard",
}: DashboardLayoutProps) => {
  const { user, signOut, profile } = useAuth();
  const { isDarkMode } = useTheme();
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
      label: "Brain Dumps",
      icon: <Brain className="h-5 w-5" />,
      href: "/brain-dumps",
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
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/settings",
    },
    {
      label: "Support",
      icon: <HelpCircle className="h-5 w-5" />,
      href: "/support",
    },
  ];

  const handleNavigate = useCallback((href: string) => {
    navigate(href);
    setSidebarOpen(false);
  }, [navigate]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/");
  }, [signOut, navigate]);

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Top navigation - Dark mode compatible header */}
      <header className="h-[68px] bg-dark dark:bg-dark-bg border-b border-white/10 dark:border-accent-tertiary/50 flex items-center px-8 sticky top-0 z-50 w-full shadow-md dark:shadow-none transition-colors duration-200">
        <div className="flex items-center w-52">
          {/* Mobile sidebar toggle */}
          <div className="lg:hidden mr-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-white/15 transition-colors duration-200"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </Button>
          </div>
          
          {/* Logo with gold icon and white text */}
          <div className="flex items-center">
            <PenTool className="w-7 h-7 text-accent-yellow" />
            <span className="font-display text-2xl ml-2.5 text-white tracking-tight">Autopen</span>
          </div>
        </div>
        
        {/* Page title - positioned to the right of sidebar width */}
        <div className="hidden md:block">
          <h1 className="font-display text-2xl text-white tracking-tight">{activeTab}</h1>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-2">
          {/* Theme toggle button */}
          <ThemeToggle variant="ghost" iconClassName="text-white" />
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white/90 hover:text-white hover:bg-white/15 rounded-md p-2.5 transition-all duration-200"
          >
            <Bell className="h-5 w-5" />
          </Button>
          <div className="hidden lg:block">
            <UserNavDropdown />
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - dark mode compatible styling */}
        <aside
          className={cn(
            "fixed top-[68px] left-0 bottom-0 z-40 w-56 bg-paper dark:bg-card shadow-md dark:shadow-none overflow-y-auto transition-transform duration-200 border-r border-accent-tertiary/20 dark:border-accent-tertiary/50",
            "lg:sticky lg:top-[68px] lg:max-h-[calc(100vh-68px)] lg:block",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "lg:translate-x-0"
          )}
        >
          <div className="flex flex-col h-full py-4">
            {/* Navigation */}
            <div className="flex-1 px-2">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-1.5 text-sm font-serif",
                      activeTab === item.label
                        ? "bg-accent-primary/10 dark:bg-accent-primary/20 text-ink-dark dark:text-ink-dark font-medium"
                        : "text-ink-light dark:text-ink-light hover:bg-accent-primary/5 dark:hover:bg-accent-primary/10 hover:text-ink-dark dark:hover:text-ink-dark",
                    )}
                    onClick={() => handleNavigate(item.href)}
                  >
                    {activeTab === item.label ? (
                      <div className="text-accent-primary dark:text-accent-primary">{item.icon}</div>
                    ) : (
                      <div className="text-ink-light dark:text-ink-light">{item.icon}</div>
                    )}
                    {item.label}
                  </Button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 md:p-10 overflow-auto bg-background dark:bg-background transition-colors duration-200 custom-scrollbar">
          {/* We don't need to display the activeTab title in the main content area
              since it's already shown in the header */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;