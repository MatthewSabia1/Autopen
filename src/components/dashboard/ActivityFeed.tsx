import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface RecentProduct {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  progress: number;
  updatedDays: number;
  href: string;
}

interface RecentProductsProps {
  products?: RecentProduct[];
}

const defaultProducts: RecentProduct[] = [
  {
    id: "1",
    title: "Business Leadership Guide",
    category: "Business",
    categoryColor: "bg-amber-100 text-amber-800",
    progress: 80,
    updatedDays: 2,
    href: "/products/1",
  },
  {
    id: "2",
    title: "Cooking Techniques",
    category: "Food",
    categoryColor: "bg-red-100 text-red-800",
    progress: 45,
    updatedDays: 7,
    href: "/products/2",
  },
  {
    id: "3",
    title: "Travel Photography Tips",
    category: "Photography",
    categoryColor: "bg-blue-100 text-blue-800",
    progress: 90,
    updatedDays: 14,
    href: "/products/3",
  },
];

const RecentProducts = ({
  products = defaultProducts,
}: RecentProductsProps) => {
  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-slate-800 flex items-center gap-2">
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
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Recent Products
        </h2>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          <Link to="/products" className="flex items-center gap-1">
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
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </Link>
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="space-y-6 pr-4">
          {products.map((product) => (
            <div key={product.id} className="group">
              <Link to={product.href} className="block">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${product.categoryColor} border-0`}
                    >
                      {product.category}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      Updated {product.updatedDays}{" "}
                      {product.updatedDays === 1 ? "day" : "days"} ago
                    </span>
                  </div>
                  <h3 className="font-medium text-slate-800 hover:text-slate-600 transition-colors">
                    {product.title}
                  </h3>
                  <div className="space-y-1">
                    <Progress value={product.progress} className="h-1.5" />
                    <div className="text-right text-xs text-slate-500">
                      {product.progress}%
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RecentProducts;
