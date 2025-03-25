/**
 * STANDALONE SIDEBAR COMPONENT
 * 
 * This component appears to be a standalone sidebar implementation that is currently
 * not being directly imported anywhere in the application. The active sidebar
 * navigation is built directly into DashboardLayout.tsx.
 */

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  FileText,
  PenTool,
  BookText,
  Settings,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab?: string;
}

export function Sidebar({ activeTab = "Dashboard" }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="h-full flex flex-col p-4 bg-slate-50">
      <div className="flex-1 space-y-4">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-base",
            isActive('/dashboard') ? 
              "bg-slate-100 text-slate-900 font-medium" : 
              "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            "transition-all"
          )}
          onClick={() => navigate('/dashboard')}
        >
          <Home className={`mr-2 h-5 w-5 ${isActive('/dashboard') ? 'text-slate-900' : 'text-slate-400'}`} />
          Dashboard
        </Button>
        
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-base",
            isActive('/brain-dump') ? 
              "bg-slate-100 text-slate-900 font-medium" : 
              "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            "transition-all"
          )}
          onClick={() => navigate('/brain-dump')}
        >
          <FileText className={`mr-2 h-5 w-5 ${isActive('/brain-dump') ? 'text-slate-900' : 'text-slate-400'}`} />
          Brain Dump
        </Button>
        
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-base",
            isActive('/creator') ? 
              "bg-slate-100 text-slate-900 font-medium" : 
              "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            "transition-all"
          )}
          onClick={() => navigate('/creator')}
        >
          <PenTool className={`mr-2 h-5 w-5 ${isActive('/creator') ? 'text-slate-900' : 'text-slate-400'}`} />
          Creator
        </Button>
        
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-base",
            isActive('/products') ? 
              "bg-slate-100 text-slate-900 font-medium" : 
              "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            "transition-all"
          )}
          onClick={() => navigate('/products')}
        >
          <BookText className={`mr-2 h-5 w-5 ${isActive('/products') ? 'text-slate-900' : 'text-slate-400'}`} />
          Products
        </Button>
        
        <div className="pt-6">
          <p className="text-xs font-medium text-slate-400 px-2 mb-2 uppercase tracking-wider">
            SUPPORT
          </p>
          
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start text-base",
              isActive('/help-center') ? 
                "bg-slate-100 text-slate-900 font-medium" : 
                "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              "transition-all"
            )}
            onClick={() => navigate('/help-center')}
          >
            <HelpCircle className={`mr-2 h-5 w-5 ${isActive('/help-center') ? 'text-slate-900' : 'text-slate-400'}`} />
            Help Center
          </Button>
          
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start text-base",
              isActive('/settings') ? 
                "bg-slate-100 text-slate-900 font-medium" : 
                "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              "transition-all"
            )}
            onClick={() => navigate('/settings')}
          >
            <Settings className={`mr-2 h-5 w-5 ${isActive('/settings') ? 'text-slate-900' : 'text-slate-400'}`} />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}