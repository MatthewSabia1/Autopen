import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Award, FileText, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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

const StatCard = ({ icon, title, value }: StatCardProps) => {
  return (
    <Card className="bg-paper border-accent-tertiary/20 shadow-blue-sm transition-all duration-200 hover:shadow-blue-md">
      <CardContent className="p-6 flex items-start gap-4">
        <div className="mt-1">{icon}</div>
        <div>
          <h3 className="text-accent-primary text-sm mb-1 font-serif">{title}</h3>
          <p className="text-2xl font-medium text-ink-dark font-serif">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const QuickAction = ({ icon, title, description, href }: QuickActionProps) => {
  return (
    <Link to={href} className="block">
      <div className="flex items-start gap-4 p-4 hover:bg-accent-primary/5 rounded-lg transition-all duration-200 border border-transparent hover:border-accent-primary/20">
        <div className="mt-1 text-accent-primary">{icon}</div>
        <div>
          <h3 className="font-medium text-ink-dark mb-1 font-serif">{title}</h3>
          <p className="text-sm text-ink-light font-serif">{description}</p>
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
      <Card className="bg-paper border-accent-yellow/20 shadow-yellow-sm hover:shadow-yellow-md transition-all duration-200">
        <CardContent className="p-6">
          <h3 className="font-medium text-ink-dark mb-2 flex items-center gap-2 font-serif">
            <span className="text-accent-yellow">{title}</span>
            <Button variant="ghost" size="sm" className="ml-auto hover:text-accent-yellow">
              <svg
                width="16"
                height="16"
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
          <p className="text-sm text-ink-light font-serif">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

const DashboardGrid = () => {
  const statCards = [
    {
      icon: <Award className="h-5 w-5 text-accent-yellow" />,
      title: "Completed Products",
      value: 5,
    },
    {
      icon: <FileText className="h-5 w-5 text-accent-primary" />,
      title: "Draft Products",
      value: 7,
    },
    {
      icon: <BookText className="h-5 w-5 text-accent-primary" />,
      title: "Words Written",
      value: "24,350",
    },
  ];

  const quickActions = [
    {
      icon: <FileText className="h-5 w-5 text-slate-600" />,
      title: "Brain Dump",
      description: "Transform your ideas into organized content",
      href: "/brain-dump",
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
          className="text-slate-600"
        >
          <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"></path>
          <circle cx="18" cy="18" r="3"></circle>
          <path d="M18 14v1"></path>
          <path d="M18 21v1"></path>
          <path d="M22 18h-1"></path>
          <path d="M15 18h-1"></path>
          <path d="m21 15-1 1"></path>
          <path d="m16 20-1 1"></path>
          <path d="m21 21-1-1"></path>
          <path d="m16 16-1-1"></path>
        </svg>
      ),
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
          className="text-slate-600"
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
          className="text-slate-600"
        >
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
      title: "Settings",
      description: "Customize your account preferences",
      href: "/settings",
    },
  ];

  const productTemplates = [
    {
      title: "E-Book",
      description:
        "Create a structured digital book with chapters and sections",
      href: "/templates/ebook",
    },
    {
      title: "Online Course",
      description: "Educational content organized into modules and lessons",
      href: "/templates/course",
    },
    {
      title: "Blog Collection",
      description: "Compile blog posts into a cohesive publication",
      href: "/templates/blog",
    },
    {
      title: "Memoir/Biography",
      description: "Tell a personal or historical story with timeline features",
      href: "/templates/memoir",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      {/* Quick Actions and Product Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-medium text-ink-dark mb-4 flex items-center gap-2 font-serif">
            <svg
              width="20"
              height="20"
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
            Quick Actions
          </h2>
          <div className="bg-paper rounded-lg border border-accent-tertiary/20 shadow-blue-sm overflow-hidden">
            {quickActions.map((action, index) => (
              <React.Fragment key={index}>
                <QuickAction {...action} />
                {index < quickActions.length - 1 && (
                  <div className="border-b border-accent-tertiary/10 mx-4"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium text-ink-dark mb-4 flex items-center gap-2 font-serif">
            <svg
              width="20"
              height="20"
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
            Product Templates
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {productTemplates.map((template, index) => (
              <ProductTemplate key={index} {...template} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardGrid;
