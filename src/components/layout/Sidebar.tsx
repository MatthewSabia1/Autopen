import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BrainCircuit,
  PenTool,
  BookOpen,
  Settings,
  BarChart3,
  FolderKanban,
  HelpCircle,
  LogOut
} from "lucide-react";
import { useAuth } from "../../../supabase/auth";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="py-4 h-full flex flex-col border-r border-gray-200">
      <div className="px-4 mb-6">
        <h2 className="flex items-center text-xl font-bold tracking-tight text-gray-900 pl-2">
          AutoPen
        </h2>
      </div>
      
      <div className="flex-1 px-4">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 px-2 mb-2">MAIN MENU</p>
            <Button 
              variant="ghost" 
              className={`w-full justify-start py-2.5 ${isActive('/dashboard') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'} font-medium`}
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard className="mr-3 h-4 w-4 text-gray-500" />
              Dashboard
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start py-2.5 ${isActive('/brain-dump') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'} font-medium`}
              onClick={() => navigate('/brain-dump')}
            >
              <BrainCircuit className="mr-3 h-4 w-4 text-gray-500" />
              Brain Dump
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start py-2.5 ${isActive('/creator') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'} font-medium`}
              onClick={() => navigate('/creator')}
            >
              <PenTool className="mr-3 h-4 w-4 text-gray-500" />
              Creator
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start py-2.5 ${isActive('/ebooks') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'} font-medium`}
              onClick={() => navigate('/ebooks')}
            >
              <BookOpen className="mr-3 h-4 w-4 text-gray-500" />
              eBooks
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start py-2.5 ${isActive('/projects') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'} font-medium`}
              onClick={() => navigate('/projects')}
            >
              <FolderKanban className="mr-3 h-4 w-4 text-gray-500" />
              Projects
            </Button>
          </div>
          
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 px-2 mb-2">WORKFLOWS</p>
            <Button 
              variant="ghost" 
              className={`w-full justify-start py-2.5 ${isActive('/workflow/ebook') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'} font-medium`}
              onClick={() => navigate('/workflow/ebook')}
            >
              <BookOpen className="mr-3 h-4 w-4 text-gray-500" />
              eBook Creation
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start py-2.5 ${isActive('/analytics') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'} font-medium`}
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 className="mr-3 h-4 w-4 text-gray-500" />
              Content Analysis
            </Button>
          </div>
          
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 px-2 mb-2">SETTINGS</p>
            <Button 
              variant="ghost" 
              className={`w-full justify-start py-2.5 ${isActive('/settings') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'} font-medium`}
              onClick={() => navigate('/settings')}
            >
              <Settings className="mr-3 h-4 w-4 text-gray-500" />
              Account Settings
            </Button>
            <Button 
              variant="ghost" 
              className={`w-full justify-start py-2.5 ${isActive('/help') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'} font-medium`}
              onClick={() => navigate('/help')}
            >
              <HelpCircle className="mr-3 h-4 w-4 text-gray-500" />
              Help & Support
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mt-auto px-4 pt-4 border-t border-gray-200">
        <Button 
          variant="ghost" 
          className="w-full justify-start py-2.5 text-gray-700 font-medium"
          onClick={() => {
            signOut();
            navigate('/');
          }}
        >
          <LogOut className="mr-3 h-4 w-4 text-gray-500" />
          Logout
        </Button>
      </div>
    </div>
  );
}