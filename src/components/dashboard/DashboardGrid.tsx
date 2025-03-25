/**
 * ALTERNATE DASHBOARD IMPLEMENTATION
 * 
 * This component appears to be an alternative dashboard grid implementation
 * that is currently not being imported anywhere in the application.
 * 
 * The active dashboard is implemented in /src/components/pages/dashboard.tsx.
 * 
 * We've made styling improvements to this component in case it's used in the future,
 * but be aware that the main dashboard UI is in the pages/dashboard.tsx file.
 * 
 * Last checked: March 25, 2025
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Award, FileText, BookText, Settings, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

interface ProductTemplateProps {
  title: string;
  description: string;
  href: string;
}

interface Product {
  id: string;
  title: string;
  category: string;
  updated_at: string;
  progress: number;
}

interface ProductTemplate {
  id: string;
  title: string;
  description: string;
  href: string;
}

const StatCard = ({ icon, title, value }: StatCardProps) => {
  return (
    <Card className="bg-cream border-accent-tertiary/30 shadow-blue-sm transition-all duration-300 hover:shadow-blue-md hover:border-accent-primary/30 overflow-hidden">
      <CardContent className="p-8 flex items-start gap-5">
        <div className="mt-1 bg-accent-tertiary/10 p-3 rounded-full">{icon}</div>
        <div>
          <h3 className="text-accent-primary text-[16px] mb-2 font-serif font-medium">{title}</h3>
          <p className="text-4xl font-medium text-ink-dark font-serif m-0 tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const QuickAction = ({ icon, title, description, href }: QuickActionProps) => {
  return (
    <Link to={href} className="block">
      <div className="flex items-start gap-5 p-6 hover:bg-accent-primary/5 rounded-lg transition-all duration-300 border border-transparent hover:border-accent-primary/20">
        <div className="mt-1 text-accent-primary p-2 bg-accent-tertiary/10 rounded-lg">{icon}</div>
        <div>
          <h3 className="font-medium text-ink-dark mb-1.5 font-serif text-[17px]">{title}</h3>
          <p className="text-[16px] text-ink-light font-serif m-0 leading-relaxed">{description}</p>
        </div>
      </div>
    </Link>
  );
};

const ProductTemplate = ({
  title,
  description,
  href,
}: ProductTemplateProps) => {
  return (
    <Link to={href}>
      <Card className="bg-cream border-accent-yellow/30 shadow-yellow-sm hover:shadow-yellow-md transition-all duration-300 hover:border-accent-yellow/50 overflow-hidden">
        <CardContent className="p-7 relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-accent-yellow/40"></div>
          <h3 className="font-medium text-ink-dark mb-3 flex items-center gap-2 font-serif text-[18px] pl-3">
            <span className="text-accent-yellow">{title}</span>
            <Button variant="ghost" size="sm" className="ml-auto hover:text-accent-yellow p-1 rounded-full">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-ink-light"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </Button>
          </h3>
          <p className="text-[16px] text-ink-light font-serif m-0 leading-relaxed pl-3">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

// Format date as "X days/weeks/months ago"
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Updated 1 day ago";
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  if (diffDays < 14) return "Updated 1 week ago";
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "Updated 1 month ago";
  return `Updated ${Math.floor(diffDays / 30)} months ago`;
};

const DashboardGrid = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    completedProducts: 0,
    draftProducts: 0,
    wordsWritten: 0
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [productTemplates, setProductTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        if (!user) return;

        // Fetch completed products count
        const { data: completedProducts, error: completedError } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        // Fetch draft products count
        const { data: draftProducts, error: draftError } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'draft');

        // Fetch total words written
        const { data: wordsData, error: wordsError } = await supabase
          .from('user_stats')
          .select('words_written')
          .eq('user_id', user.id)
          .single();

        // Fetch recent products
        const { data: recentProductsData, error: recentError } = await supabase
          .from('products')
          .select('id, title, category, updated_at, progress')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(3);

        // Fetch product templates
        const { data: templatesData, error: templatesError } = await supabase
          .from('product_templates')
          .select('id, title, description')
          .limit(4);

        if (!completedError && !draftError && !wordsError && !recentError && !templatesError) {
          setStats({
            completedProducts: completedProducts?.length || 0,
            draftProducts: draftProducts?.length || 0,
            wordsWritten: wordsData?.words_written || 0
          });

          setRecentProducts(recentProductsData || []);
          
          // Transform template data to include href
          setProductTemplates((templatesData || []).map(template => ({
            ...template,
            href: `/templates/${template.id}`
          })));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Fallback to placeholder data if API calls fail
        setStats({
          completedProducts: 5,
          draftProducts: 7,
          wordsWritten: 24350
        });
        
        setRecentProducts([
          {
            id: "1",
            title: "Business Leadership Guide",
            category: "Business",
            updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            progress: 80
          },
          {
            id: "2",
            title: "Cooking Techniques",
            category: "Food",
            updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            progress: 45
          },
          {
            id: "3",
            title: "Travel Photography Tips",
            category: "Photography",
            updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            progress: 90
          }
        ]);
        
        setProductTemplates([
          {
            id: "1",
            title: "E-Book",
            description: "Create a structured digital book with chapters and sections",
            href: "/templates/ebook"
          },
          {
            id: "2",
            title: "Online Course",
            description: "Educational content organized into modules and lessons",
            href: "/templates/course"
          },
          {
            id: "3",
            title: "Blog Collection",
            description: "Compile blog posts into a cohesive publication",
            href: "/templates/blog"
          },
          {
            id: "4",
            title: "Memoir/Biography",
            description: "Tell a personal or historical story with timeline features",
            href: "/templates/memoir"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const quickActions = [
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Brain Dump",
      description: "Transform your ideas into organized content",
      href: "/brain-dump",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "AI Creator",
      description: "Generate complete content with AI",
      href: "/creator",
    },
    {
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 8v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8"></path>
          <path d="M3 4h18"></path>
          <path d="M9 8v1"></path>
          <path d="M15 8v1"></path>
          <path d="M9 12h6"></path>
          <path d="M9 16h6"></path>
        </svg>
      ),
      title: "All Products",
      description: "View and manage all your e-books",
      href: "/products",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Settings",
      description: "Customize your account preferences",
      href: "/settings",
    },
  ];

  const statCards = [
    {
      icon: <Award className="h-6 w-6 text-accent-yellow" />,
      title: "Completed Products",
      value: stats.completedProducts,
    },
    {
      icon: <FileText className="h-6 w-6 text-accent-primary" />,
      title: "Draft Products",
      value: stats.draftProducts,
    },
    {
      icon: <BookText className="h-6 w-6 text-accent-primary" />,
      title: "Words Written",
      value: stats.wordsWritten.toLocaleString(),
    },
  ];

  return (
    <div className="space-y-10 pb-12 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-5xl font-display font-medium text-ink-dark mb-4 tracking-tight">Welcome Back!</h1>
        <p className="text-xl text-ink-light font-serif mt-0 leading-relaxed">Continue working on your e-book products</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      {/* Quick Actions and Product Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12">
        <div>
          <h2 className="text-2xl font-medium text-ink-dark mb-6 flex items-center gap-3 font-display tracking-tight">
            <div className="bg-accent-primary/10 p-1.5 rounded-md">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent-primary"
              >
                <path d="m15 15-6-6"></path>
                <path d="m9 15 6-6"></path>
              </svg>
            </div>
            Quick Actions
          </h2>
          <div className="bg-cream rounded-xl border border-accent-tertiary/30 shadow-blue-sm overflow-hidden hover:shadow-blue-md transition-all duration-300">
            {quickActions.map((action, index) => (
              <React.Fragment key={index}>
                <QuickAction {...action} />
                {index < quickActions.length - 1 && (
                  <div className="border-b border-accent-tertiary/20 mx-6"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-medium text-ink-dark mb-6 flex items-center gap-3 font-display tracking-tight">
            <div className="bg-accent-yellow/10 p-1.5 rounded-md">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent-yellow"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
            </div>
            Product Templates
          </h2>
          <div className="grid grid-cols-1 gap-5">
            {productTemplates.map((template, index) => (
              <ProductTemplate key={index} {...template} />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Products */}
      <div className="mt-12">
        <h2 className="text-2xl font-medium text-ink-dark mb-6 flex items-center gap-3 font-display tracking-tight">
          <div className="bg-accent-primary/10 p-1.5 rounded-md">
            <Clock className="w-5 h-5 text-accent-primary" />
          </div>
          Recent Products
          <Link to="/products" className="ml-auto text-accent-primary hover:underline text-[16px] font-serif inline-flex items-center hover:text-accent-secondary transition-colors duration-300">
            View All
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="ml-1.5"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </Link>
        </h2>
        <div className="space-y-6">
          {recentProducts.map((product, index) => (
            <div key={index} className="bg-cream p-6 rounded-xl border border-accent-tertiary/30 shadow-blue-sm hover:shadow-blue-md transition-all duration-300 hover:border-accent-primary/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-ink-dark font-serif text-xl">{product.title}</h3>
                <Link to={`/products/${product.id}`}>
                  <Button variant="ghost" size="sm" className="ml-auto p-1.5 hover:bg-accent-primary/10 rounded-full">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-accent-primary"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </Button>
                </Link>
              </div>
              <div className="flex items-center mb-4 text-[16px]">
                <span className="text-ink-light font-serif bg-accent-tertiary/20 px-3 py-1 rounded-full">{product.category}</span>
                <span className="mx-3 text-ink-light">•</span>
                <span className="text-ink-light font-serif">{formatDate(product.updated_at)}</span>
              </div>
              <div className="w-full bg-accent-tertiary/20 rounded-full h-3 mb-2">
                <div 
                  className="bg-accent-primary h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${product.progress}%` }}
                ></div>
              </div>
              <div className="text-right text-[15px] text-ink-light font-serif font-medium">{product.progress}%</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 mt-16">
        <div className="flex justify-center gap-6">
          <Link to="/create-ai-content">
            <Button className="bg-accent-yellow text-white hover:bg-accent-yellow/90 shadow-yellow-sm hover:shadow-yellow-md border border-accent-yellow/30 px-8 text-[17px] py-6 transition-all duration-300 rounded-lg">
              <svg 
                width="22" 
                height="22" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-3"
              >
                <circle cx="18" cy="18" r="3"></circle>
                <path d="M18 14v1"></path>
                <path d="M18 21v1"></path>
                <path d="M22 18h-1"></path>
                <path d="M15 18h-1"></path>
                <path d="m21 15-1 1"></path>
                <path d="m16 20-1 1"></path>
                <path d="m21 21-1-1"></path>
                <path d="m16 16-1-1"></path>
                <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"></path>
              </svg>
              New AI Content
            </Button>
          </Link>
          <Link to="/create-product">
            <Button variant="outline" className="text-ink-dark border-accent-tertiary/40 hover:bg-accent-tertiary/10 px-8 text-[17px] py-6 hover:shadow-blue-sm transition-all duration-300 rounded-lg">
              <svg 
                width="22" 
                height="22" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-3"
              >
                <path d="M11 12H3"></path>
                <path d="M16 6H3"></path>
                <path d="M16 18H3"></path>
                <path d="M18 9v6"></path>
                <path d="M21 12h-6"></path>
              </svg>
              New Product
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardGrid;
