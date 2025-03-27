import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { PenTool, Star, Check, ArrowRight, Sparkles, BookOpen, FileText, Palette, Upload, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import AuthModal from "../auth/AuthModal";
import { motion, useScroll, useTransform, AnimatePresence, stagger, Variants } from "framer-motion";

// Author avatar data
const authors = [
  { 
    initials: "BT", 
    name: "Benjamin Torres",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
  { 
    initials: "JD", 
    name: "Jessica Dawson",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
  { 
    initials: "MP", 
    name: "Michael Park",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
  { 
    initials: "RK", 
    name: "Rachel Kim",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  }
];

// Define SVG logo components for reliability
const AmazonLogo = () => (
  <svg viewBox="0 0 160 48" className="h-6 w-auto" fill="currentColor">
    <path d="M61.58,17.99c-5.93,4.38-14.51,6.71-21.91,6.71c-10.36,0-19.72-3.83-26.79-10.21c-0.55-0.5-0.06-1.18,0.61-0.79c7.57,4.4,16.93,7.05,26.6,7.05c6.52,0,13.68-1.35,20.27-4.17C61.69,15.89,62.75,17.09,61.58,17.99z M63.8,15.49c-0.76-0.97-5-0.46-6.91-0.23c-0.58,0.07-0.67-0.44-0.15-0.8c3.38-2.38,8.93-1.69,9.57-0.9c0.65,0.81-0.17,6.28-3.3,8.9c-0.48,0.39-0.94,0.18-0.73-0.35C63.03,20.06,64.55,16.46,63.8,15.49z M56,34.6V7.16c0-0.56,0.43-0.94,0.94-0.94h3.41c0.53,0,0.96,0.43,0.97,0.94v4.08h0.07c0.89-2.36,2.56-3.47,4.81-3.47c2.29,0,3.72,1.11,4.74,3.47c0.89-2.36,2.9-3.47,5.06-3.47c1.54,0,3.21,0.64,4.23,2.06c1.16,1.59,0.92,3.89,0.92,5.9l-0.01,18.85c0,0.55-0.43,0.99-0.97,0.99h-3.4c-0.51,0-0.93-0.44-0.93-0.99V18.86c0-0.82,0.07-2.86-0.11-3.63c-0.28-1.32-1.13-1.69-2.22-1.69c-0.91,0-1.87,0.61-2.26,1.59c-0.39,0.98-0.35,2.61-0.35,3.74v15.74c0,0.55-0.43,0.99-0.97,0.99h-3.4c-0.51,0-0.93-0.44-0.93-0.99V18.86c0-2.17,0.35-5.36-2.33-5.36c-2.72,0-2.61,3.11-2.61,5.36v15.74c0,0.55-0.43,0.99-0.97,0.99h-3.4C56.43,35.59,56,35.15,56,34.6z M106.42,7.16c5.06,0,7.8,4.34,7.8,9.87c0,5.34-3.03,9.57-7.8,9.57c-4.97,0-7.67-4.34-7.67-9.74c0-5.44,2.74-9.7,7.67-9.7zM140.43,34.6c-0.5,0.45-1.23,0.48-1.8,0.18c-2.53-2.1-2.99-3.07-4.36-5.07c-4.16,4.25-7.12,5.52-12.53,5.52c-6.39,0-11.37-3.95-11.37-11.84c0-6.16,3.34-10.36,8.11-12.42c4.13-1.84,9.89-2.17,14.29-2.67v-0.99c0-1.8,0.14-3.93-0.92-5.49c-0.92-1.4-2.68-1.98-4.23-1.98c-2.87,0-5.43,1.47-6.05,4.53c-0.13,0.68-0.63,1.33-1.3,1.37l-3.53-0.38c-0.59-0.13-1.25-0.61-1.08-1.51C117.07,5.98,123.64,3,129.66,3c3.03,0,6.99,0.81,9.38,3.1c3.03,2.83,2.74,6.59,2.74,10.69v9.67c0,2.91,1.2,4.18,2.33,5.75c0.4,0.56,0.48,1.23-0.01,1.64C142.82,32.61,141.22,33.75,140.43,34.6zM106.42,11.84c-2.51,0-2.58,3.42-2.58,5.55c0,2.13-0.03,6.68,2.55,6.68c2.55,0,2.67-3.56,2.67-5.73c0-1.43-0.06-3.13-0.49-4.49C108.14,12.44,107.36,11.84,106.42,11.84zM132.27,21.25v-1.82c-5.43,0-11.19,1.17-11.19,7.63c0,3.27,1.69,5.49,4.58,5.49c2.12,0,4.01-1.3,5.21-3.42c1.48-2.6,1.4-5.04,1.4-7.88z M89.22,34.6V7.16c0-0.56,0.43-0.94,0.97-0.94h3.43c0.5,0,0.91,0.44,0.93,0.94v4.08h0.07C95.85,7.76,98,6.21,100.89,6.21c1.95,0,3.86,0.7,5.08,2.63c1.13,1.77,1.13,4.75,1.13,6.88v19.04c-0.06,0.5-0.47,0.89-0.97,0.89h-3.46c-0.46-0.02-0.85-0.37-0.92-0.89v-16.4c0-2.1,0.24-5.17-2.33-5.17c-0.91,0-1.74,0.61-2.16,1.52c-0.52,1.16-0.59,2.33-0.59,3.65v16.34c-0.01,0.55-0.45,0.99-0.99,0.99h-3.4C89.66,35.59,89.22,35.15,89.22,34.6z M148.49,7.16h-5.01v-6.19c0-0.41,0.25-0.68,0.58-0.74l5.31-0.01c0.34,0,0.61,0.27,0.61,0.62v5.16c0,0.42-0.36,1.16-1.49,1.16zM143.96,34.6V7.16c0-0.56,0.43-0.94,0.97-0.94h3.4c0.5,0,0.92,0.44,0.94,0.94v27.45c0,0.55-0.43,0.99-0.96,0.99h-3.39C144.4,35.59,143.96,35.15,143.96,34.6z M24.03,25.54c-1.9,0-3.76,0.44-5.36,1.31c-0.4,0.21-0.67,0.61-0.67,1.04v9.06c0,0.44,0.28,0.84,0.68,1.05c1.62,0.88,3.5,1.35,5.4,1.35c4.54,0,7.17-3.11,7.17-6.93c0-3.83-2.65-6.88-7.22-6.88z M28.34,19.71c0.81-1.13,1.05-2.52,1.05-3.94c0-3.22-1.54-5.17-3.57-6.15c-1.08-0.53-2.3-0.73-3.52-0.73c-2.4,0-3.72,0.9-5.76,3.22l-0.8,0.9l2.44,0.36l0.59-0.59c1.03-1.03,1.99-1.5,3.52-1.5c0.91,0,1.77,0.18,2.51,0.53c1.08,0.52,1.86,1.62,1.86,3.28c0,1.31-0.28,2.38-1.05,3.33c-0.99,1.22-2.65,1.85-4.47,1.85h-1.36v3.17h1.4c1.95,0,3.8,0.4,5.08,1.58c1.35,1.26,1.98,3.06,1.98,5.25c0,2.38-0.86,4.23-2.35,5.58c-1.4,1.26-3.5,1.95-5.5,1.95c-1.09,0-2.13-0.14-3.12-0.44c-1.9-0.56-3.25-1.83-3.87-3.37c-0.4-0.99-0.48-2.13-0.44-3.21l0.03-1.04l-2.85-0.11l-0.03,1.08c-0.07,3.03,0.66,5.1,2.36,6.97c1.77,1.94,4.54,2.94,7.82,2.94c3.12,0,5.79-0.9,7.78-2.61c2.26-1.94,3.43-4.75,3.43-8.19c0-3.11-1.09-5.58-3.17-7.4z" fill="currentColor" />
  </svg>
);

const BarnesNobleLogo = () => (
  <svg viewBox="0 0 160 48" className="h-6 w-auto" fill="currentColor">
    <path d="M24.53,14.71h2.21v18.24h-2.21V14.71z M36.55,32.95h-2.09V14.71h2.09V32.95z M33.69,14.71h0.77v18.24h-0.77V14.71z M28.82,14.71h1.19v18.24h-1.19V14.71z M21.17,14.71h1.6v18.24h-1.6V14.71z M17.05,20.42c0-3.49,2.57-6.08,6.13-6.08c3.56,0,6.13,2.59,6.13,6.08v7.41c0,3.49-2.57,6.08-6.13,6.08c-3.56,0-6.13-2.59-6.13-6.08V20.42z M41.02,20.42c0-3.49,2.57-6.08,6.13-6.08c3.56,0,6.13,2.59,6.13,6.08v7.41c0,3.49-2.57,6.08-6.13,6.08c-3.56,0-6.13-2.59-6.13-6.08V20.42z M61.5,32.95h-2.09V14.71h2.09V32.95z M58.64,14.71h0.77v18.24h-0.77V14.71z M53.98,14.71h1.19v18.24h-1.19V14.71z M46.33,14.71h1.6v18.24h-1.6V14.71z M75.57,14.71h2.09v14.76c0,2.17-0.46,3.95-2.75,3.95h-7.02v-2.14h6.2c0.83,0,1.49-0.2,1.49-1.85V14.71z M73.19,25.3h-5.36v-2.09h5.36V25.3z M73.19,16.86h-5.36v-2.15h5.36V16.86z M65.59,32.95h-2.09V14.71h2.09V32.95z M82.8,20.42c0-3.49,2.57-6.08,6.13-6.08c3.56,0,6.13,2.59,6.13,6.08v7.41c0,3.49-2.57,6.08-6.13,6.08c-3.56,0-6.13-2.59-6.13-6.08V20.42z M86.66,14.71h1.19v18.24h-1.19V14.71z M98.22,14.71h1.6v18.24h-1.6V14.71z M110.27,32.95h-2.09V14.71h2.09V32.95z M107.41,14.71h0.77v18.24h-0.77V14.71z M102.67,14.71h1.19v18.24h-1.19V14.71z M123.05,32.95h-9.07V14.71h2.09v16.1h6.99V32.95z M117.47,25.3h-5.38v-2.09h5.38V25.3z M117.47,16.86h-5.38v-2.15h5.38V16.86z M125.19,20.42c0-3.49,2.57-6.08,6.13-6.08c3.56,0,6.13,2.59,6.13,6.08v7.41c0,3.49-2.57,6.08-6.13,6.08c-3.56,0-6.13-2.59-6.13-6.08V20.42z M129.05,14.71h1.19v18.24h-1.19V14.71z M139.54,32.88c-1.57,0-2.89-0.36-3.86-1.07c-0.96-0.71-1.44-1.83-1.44-3.37v-9.97h2.07v9.92c0,0.77,0.27,1.46,0.82,1.85c0.54,0.39,1.24,0.58,2.09,0.58c0.86,0,1.57-0.23,2.09-0.7c0.54-0.46,0.8-1.24,0.8-2.34v-9.29h2.07v9.34c0,1.65-0.52,2.96-1.57,3.93c-1.04,0.96-2.4,1.44-4.06,1.44z" fill="currentColor" />
  </svg>
);

const AppleBooksLogo = () => (
  <svg viewBox="0 0 160 48" className="h-7 w-auto" fill="currentColor">
    <path d="M32.8,7.58c1.93,0,4.22,0.8,6.22,2.46c-0.16,0.17-4.56,2.65-4.51,7.98c0.06,6.35,5.56,8.46,5.61,8.48c-0.05,0.14-0.89,3.05-2.94,6.03c-1.76,2.59-3.6,5.17-6.49,5.21c-2.83,0.05-3.75-1.69-7-1.69c-3.25,0-4.27,1.63-6.97,1.74c-2.8,0.11-4.92-2.8-6.7-5.37C7.32,28.07,5.05,20.79,7.72,16c1.32-2.36,3.68-3.86,6.25-3.9c2.66-0.05,4.34,1.71,6.54,1.71c2.2,0,3.54-1.71,6.7-1.71C28.93,12.1,31.09,12.48,32.8,7.58L32.8,7.58L32.8,7.58z M45.54,7.58h6.22l4.51,13.53l4.56-13.53h6.03l-8.5,22.05h-4.37L45.54,7.58L45.54,7.58z M73.49,29.63L73.49,7.58h5.99v22.05H73.49L73.49,29.63z M81.7,29.63v-5.37h5.37v5.37H81.7L81.7,29.63z M108.99,29.63h-5.89v-17.2h-4.8V7.58h15.45v4.85h-4.75V29.63L108.99,29.63z M124.01,29.63v-8.78h-9.17V16.9h9.17V8.16h5.99v21.47H124.01L124.01,29.63z M92.01,29.63V7.58h10.75c5.65,0,9.65,3.86,9.65,9.27c0,5.41-4.03,9.27-9.7,9.27h-4.7v3.51L92.01,29.63L92.01,29.63z M98.01,20.75h3.75c2.36,0,4.61-1.16,4.61-3.9c0-2.74-2.25-3.9-4.61-3.9h-3.75V20.75L98.01,20.75z" fill="currentColor" />
  </svg>
);

const KoboLogo = () => (
  <svg viewBox="0 0 160 48" className="h-6 w-auto" fill="currentColor">
    <path d="M112.83,15.94c0.76,0,1.41,0.22,1.95,0.66c0.54,0.44,0.81,0.99,0.81,1.65c0,0.66-0.27,1.21-0.81,1.65c-0.54,0.44-1.19,0.66-1.95,0.66h-3.88v-4.62H112.83z M104.92,31.93h4.03v-7.48h2.73l4.18,7.48h4.77l-4.92-8.72c1.03-0.38,1.86-1.01,2.5-1.87c0.64-0.87,0.96-1.85,0.96-2.94c0-1.74-0.65-3.14-1.95-4.21c-1.3-1.07-2.84-1.61-4.62-1.61h-7.68V31.93z M96.46,31.93h4.03V12.58h-4.03V31.93z M88.01,31.93h4.03V12.58h-4.03V31.93z M79.12,17.16c1.32,0,2.43,0.46,3.32,1.39c0.9,0.93,1.35,2.08,1.35,3.47c0,1.39-0.45,2.54-1.35,3.47c-0.9,0.93-2.01,1.39-3.32,1.39h-2.66v-9.71H79.12z M71.42,31.93h4.03v-4.77h3.66c2.42,0,4.4-0.77,5.95-2.3c1.55-1.53,2.32-3.42,2.32-5.68c0-2.25-0.77-4.14-2.32-5.68c-1.55-1.53-3.53-2.3-5.95-2.3h-7.68V31.93z M60.63,31.93h11.11V27.8h-7.09v-3.47h6.94v-4.13h-6.94v-3.51h7.09v-4.13H60.63V31.93z M47.97,22.07l2.95-6.49l2.95,6.49H47.97z M40.92,31.93h4.33l1.4-3.18h8.49l1.4,3.18h4.33l-8.12-19.35h-3.7L40.92,31.93z" fill="currentColor" />
  </svg>
);

const GoogleBooksLogo = () => (
  <svg viewBox="0 0 160 48" className="h-7 w-auto" fill="currentColor">
    <path d="M43.6,20.05c0-5.42-3.92-9.39-8.82-9.39c-4.9,0-8.82,3.97-8.82,9.39c0,5.34,3.92,9.39,8.82,9.39C39.68,29.44,43.6,25.39,43.6,20.05zM39.68,20.05c0,3.38-2.09,5.67-4.9,5.67c-2.81,0-4.9-2.29-4.9-5.67c0-3.42,2.09-5.67,4.9-5.67C37.59,14.38,39.68,16.63,39.68,20.05z M60.08,20.05c0-5.42-3.92-9.39-8.82-9.39c-4.9,0-8.82,3.97-8.82,9.39c0,5.34,3.92,9.39,8.82,9.39C56.16,29.44,60.08,25.39,60.08,20.05zM56.16,20.05c0,3.38-2.09,5.67-4.9,5.67c-2.81,0-4.9-2.29-4.9-5.67c0-3.42,2.09-5.67,4.9-5.67C54.07,14.38,56.16,16.63,56.16,20.05z M74.56,11.5v1.67c0,0.75-0.04,1.76-0.04,1.76h0.04c0.73-1.88,2.9-3.97,5.75-3.97c2.45,0,4.58,1.29,5.46,3.67c0.86-1.75,3.06-3.67,5.96-3.67c2.04,0,3.85,0.75,4.94,2.17c1.27,1.63,1.47,3.8,1.47,6.05v9.68h-3.76v-9.76c0-3-0.98-4.8-3.11-4.8c-2.61,0-3.76,2.3-3.76,5.51v9.05h-3.76v-9.8c0-2.59-0.82-4.76-3.02-4.76c-2.69,0-3.85,2.13-3.85,5.59v9.01h-3.76V11.5H74.56z M111.3,11.5v3.25h-3.19v9.22c0,1.42,0.53,1.88,1.76,1.88c0.45,0,1.02-0.08,1.43-0.25v3.42c-0.53,0.21-1.67,0.37-2.9,0.37c-1.84,0-3.39-0.46-4.25-1.38c-0.9-0.88-1.31-2.3-1.31-4.35v-8.93h-2.65V11.5h0.73c1.55,0,2.33-0.79,2.33-2.34V6.25h2.86v5.25H111.3z M113.63,25.52c0-2.67,2.41-4.01,5.02-4.63c2.61-0.67,4.94-0.79,4.94-2.13c0-1.63-1.31-2.3-2.86-2.3c-1.96,0-3.35,1.17-3.64,2.88h-3.43c0.37-3.84,3.35-6.13,7.11-6.13c3.43,0,6.49,1.76,6.49,5.84v7.14c0,1.38,0.08,2.34,0.16,3.09h-3.55c-0.08-0.5-0.16-1.34-0.16-2.13h-0.08c-1.22,1.8-2.94,2.5-5.06,2.5C115.59,29.65,113.63,27.77,113.63,25.52z M123.59,22.93v-0.92h-0.08c-0.45,0.58-1.92,1.05-3.51,1.47c-1.59,0.42-2.69,1-2.69,2.34c0,1.21,0.98,1.83,2.16,1.83C121.75,27.65,123.59,25.77,123.59,22.93z M134.27,28.85V20.3c0-3.17,1.88-6.84,6.94-6.84c3.88,0,6.17,2.63,6.29,6.09h-3.72c-0.16-1.67-1.02-2.75-2.65-2.75c-2.16,0-3.11,1.84-3.11,4.43v7.56h-3.76V28.85z" fill="currentColor" />
  </svg>
);

// Testimonial interface
interface Testimonial {
  name: string;
  role: string;
  comment: string;
  avatar: string;
}

// Price plan interface
interface PricePlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  highlighted?: boolean;
}

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const textCharacterReveal: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const buttonHover = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const cardHover = {
  rest: { y: 0, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" },
  hover: { 
    y: -8, 
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

export default function Home() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('signup');
  const [scrollY, setScrollY] = useState(0);
  
  // Create scroll animations
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.3]);
  const y = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleOpenAuthModal = (view: 'login' | 'signup') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  // Sample testimonials
  const testimonials: Testimonial[] = [
    {
      name: "Sarah Johnson",
      role: "Author of 'Mindful Leadership'",
      comment: "Autopen turned my scattered ideas into a sellable e-book in under an hour. I uploaded random notes from three different sources and had a structured, ready-to-sell product that's now generating $2,400/month.",
      avatar: "SJ",
    },
    {
      name: "Michael Chen",
      role: "Content Creator",
      comment: "After failing to organize my content for months, Autopen turned my jumbled thoughts into a cohesive product in minutes. I went from overwhelmed to selling my expertise in a single afternoon.",
      avatar: "MC",
    },
    {
      name: "Aisha Patel",
      role: "Self-Publisher",
      comment: "I had brilliant ideas trapped in voice memos, Google Docs, and notebooks. Autopen organized everything into a structured e-book that readers love. I made my first sale 48 hours after using Autopen.",
      avatar: "AP",
    },
  ];

  // Sample pricing plans
  const pricePlans: PricePlan[] = [
    {
      name: "Basic",
      price: "$0",
      period: "Free forever",
      description: "Perfect for beginners and casual writers",
      features: [
        "1 e-book project",
        "Basic formatting options",
        "Standard templates",
        "Export to PDF",
        "Community support"
      ],
      buttonText: "Get Started Free"
    },
    {
      name: "Pro",
      price: "$12",
      period: "per month",
      description: "For serious authors and publishers",
      features: [
        "Unlimited e-book projects",
        "Advanced formatting options",
        "Premium templates",
        "Export to all formats",
        "Priority support",
        "Custom branding"
      ],
      buttonText: "Try Pro",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For publishing houses and organizations",
      features: [
        "Everything in Pro",
        "Dedicated support manager",
        "Custom integrations",
        "Team collaboration",
        "Analytics dashboard",
        "SLA guarantee"
      ],
      buttonText: "Contact Sales"
    }
  ];

  // Features for the feature section
  const features = [
    {
      icon: <FileText className="h-5 w-5 text-accent-primary" />,
      title: "Brain Dump Technology",
      description: "Turn chaos into cash. Simply upload your scattered ideas, random notes, and unstructured content from any source. Our AI instantly transforms them into an organized, ready-to-sell digital product."
    },
    {
      icon: <Upload className="h-5 w-5 text-accent-primary" />,
      title: "Multiple Import Formats",
      description: "Never rewrite another note. Import from anywhere—voice memos, Word docs, Google Docs, notebooks, emails—with our seamless system that preserves all your valuable thinking."
    },
    {
      icon: <Sparkles className="h-5 w-5 text-accent-primary" />,
      title: "AI-Powered Organization",
      description: "Stop struggling with structure. Our AI analyzes your content and creates perfect chapters, sections, and flow—turning your scattered brilliance into a product customers can easily consume."
    },
    {
      icon: <BookOpen className="h-5 w-5 text-accent-primary" />,
      title: "Instant Digital Products",
      description: "Go from idea to income in minutes. Transform your expertise into e-books, guides, and courses without the weeks of organization and formatting that delay your revenue."
    },
    {
      icon: <Palette className="h-5 w-5 text-accent-primary" />,
      title: "Ready-to-Sell Templates",
      description: "Skip the learning curve. Your ideas are automatically formatted into proven templates that make your digital products instantly saleable across all platforms."
    },
    {
      icon: <Download className="h-5 w-5 text-accent-primary" />,
      title: "Export Flexibility",
      description: "Sell everywhere immediately. One-click exports to every major format and platform means your ideas start earning money within hours, not months."
    }
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <motion.nav 
        className={`fixed w-full z-50 transition-all duration-300 ${scrollY > 20 ? 'bg-paper/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="container mx-auto flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="navbar-logo">
              <motion.div
                className="flex items-center"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <PenTool className="h-6 w-6 text-accent-primary" />
                <span className="ml-2">Autopen</span>
              </motion.div>
            </Link>
            <div className="hidden md:flex navbar-links">
              <Link to="/" className="navbar-link-active">Home</Link>
              <Link to="/features" className="navbar-link">Features</Link>
              <Link to="/pricing" className="navbar-link">Pricing</Link>
              <Link to="/about" className="navbar-link">About</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <motion.div whileHover="hover" initial="rest" animate="rest">
                  <motion.div variants={buttonHover}>
                    <Button className="textera-button-primary">Dashboard</Button>
                  </motion.div>
                </motion.div>
              </Link>
            ) : (
              <>
                <motion.div whileHover="hover" initial="rest" animate="rest">
                  <motion.div variants={buttonHover}>
                    <Button 
                      variant="outline" 
                      className="textera-button-secondary"
                      onClick={() => handleOpenAuthModal('login')}
                    >
                      Sign In
                    </Button>
                  </motion.div>
                </motion.div>
                <motion.div whileHover="hover" initial="rest" animate="rest">
                  <motion.div variants={buttonHover}>
                    <Button 
                      className="textera-button-primary"
                      onClick={() => handleOpenAuthModal('signup')}
                    >
                      Sign Up
                    </Button>
                  </motion.div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 bg-gradient-to-b from-cream to-paper relative overflow-hidden">
        <motion.div 
          className="absolute top-20 right-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <motion.div 
            className="absolute top-0 right-0 opacity-10 w-96 h-96 bg-accent-primary rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          ></motion.div>
          <motion.div 
            className="absolute bottom-0 left-0 opacity-10 w-96 h-96 bg-accent-secondary rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 1
            }}
          ></motion.div>
        </motion.div>
        
        <div className="container mx-auto max-w-6xl px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div 
              className="lg:col-span-7 space-y-8"
              style={{ y }}
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div 
                variants={fadeInUp}
                className="inline-flex items-center px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-sm font-medium"
              >
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                AI-powered e-book creation
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-6xl font-display font-medium leading-tight"
                variants={textCharacterReveal}
              >
                Turn Your <span className="text-accent-primary">Random Notes</span> Into Sellable Products in Minutes
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl text-ink-light max-w-xl"
                variants={fadeInUp}
              >
                Stop letting your brilliant ideas stay trapped in scattered notes and voice memos. Autopen's AI instantly transforms your unorganized content into structured digital products ready to sell.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                variants={fadeInUp}
              >
                <motion.div whileHover="hover" initial="rest" animate="rest">
                  <motion.div variants={buttonHover}>
                    <Button 
                      className="textera-button-primary text-base px-8 py-6 h-auto group"
                      onClick={() => handleOpenAuthModal('signup')}
                    >
                      Turn Ideas Into Income Now
                      <motion.div
                        className="inline-block ml-2"
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </motion.div>
                    </Button>
                  </motion.div>
                </motion.div>
                <Link to="/features">
                  <motion.div whileHover="hover" initial="rest" animate="rest">
                    <motion.div variants={buttonHover}>
                      <Button variant="outline" className="textera-button-secondary text-base px-8 py-6 h-auto">
                        See The Transformation
                      </Button>
                    </motion.div>
                  </motion.div>
                </Link>
              </motion.div>
              
              <motion.div 
                className="pt-6 flex items-center gap-6"
                variants={fadeInUp}
              >
                <motion.div className="flex -space-x-2">
                  {authors.map((author, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.1 + 0.5 }}
                    >
                      <Avatar className="border-2 border-paper h-8 w-8">
                        <AvatarImage src={author.image} alt={author.name} />
                        <AvatarFallback className="bg-accent-primary/10 text-accent-primary text-xs">
                          {author.initials}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  ))}
                </motion.div>
                <div className="text-sm text-ink-light">
                  <motion.span 
                    className="text-ink-dark font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  >
                    4,000+
                  </motion.span> creators turned ideas into income with Autopen
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="lg:col-span-5 relative"
              style={{ scale, opacity }}
              initial="hidden"
              animate="visible"
              variants={scaleIn}
            >
              <motion.div 
                className="relative rounded-xl overflow-hidden shadow-xl border border-accent-tertiary/20"
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1519682577862-22b62b24e493?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
                  alt="Book creation with Autopen" 
                  className="rounded-xl object-cover w-full aspect-[4/3]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                <motion.div 
                  className="absolute bottom-4 left-4 right-4 p-4 rounded-lg bg-paper/90 backdrop-blur-sm border border-accent-tertiary/20 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-accent-primary/10 p-2 rounded-full">
                      <Sparkles className="h-5 w-5 text-accent-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-ink-dark">AI-powered formatting</h4>
                      <p className="text-xs text-ink-light">Beautiful typography and professional layouts in seconds</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="absolute -top-6 -right-6 transform rotate-6 bg-paper rounded-lg p-3 shadow-lg border border-accent-tertiary/20"
                initial={{ opacity: 0, scale: 0, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: 6 }}
                transition={{ duration: 0.5, delay: 0.8, type: "spring" }}
                whileHover={{ 
                  rotate: 12,
                  scale: 1.1,
                  transition: { duration: 0.3 }
                }}
              >
                <BookOpen className="h-8 w-8 text-accent-primary/80" />
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-6 -left-6 transform -rotate-6 bg-paper rounded-lg p-3 shadow-lg border border-accent-tertiary/20"
                initial={{ opacity: 0, scale: 0, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: -6 }}
                transition={{ duration: 0.5, delay: 1, type: "spring" }}
                whileHover={{ 
                  rotate: -12,
                  scale: 1.1,
                  transition: { duration: 0.3 }
                }}
              >
                <Palette className="h-8 w-8 text-accent-yellow" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <motion.section 
        className="py-12 bg-paper"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto">
          <motion.div 
            className="flex flex-wrap justify-center items-center gap-8 md:gap-16 px-4 text-gray-700 dark:text-gray-400"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp}>
              <AmazonLogo />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <BarnesNobleLogo />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <AppleBooksLogo />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <KoboLogo />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <GoogleBooksLogo />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Grid Section */}
      <section className="py-24 bg-cream">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="outline" className="mb-4 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary border-transparent">
                Features
              </Badge>
            </motion.div>
            <motion.h2 
              className="text-4xl font-display font-medium mb-6"
              variants={fadeInUp}
            >
              Stop Losing Money on <span className="text-accent-primary">Unorganized Ideas</span>
            </motion.h2>
            <motion.p 
              className="text-lg text-ink-light"
              variants={fadeInUp}
            >
              Your scattered notes and brilliant ideas are worth nothing until they're structured into products people can buy. Autopen bridges that gap in minutes, not months.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="textera-card p-8 flex flex-col h-full border border-accent-tertiary/10 hover:border-accent-primary/20 transition-all duration-300"
                variants={fadeInUp}
                whileHover="hover"
                initial="rest"
              >
                <motion.div variants={cardHover} className="h-full">
                  <div className="bg-accent-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-6">
                    <motion.div
                      animate={{ rotate: [0, 5, 0, -5, 0] }}
                      transition={{ 
                        duration: 6, 
                        repeat: Infinity,
                        delay: index * 0.5
                      }}
                    >
                      {feature.icon}
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-display mb-3">{feature.title}</h3>
                  <p className="text-ink-light">{feature.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process Section with Images */}
      <section className="py-24 bg-paper relative overflow-hidden">
        <motion.div 
          className="absolute top-0 left-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <motion.div 
            className="absolute top-0 left-0 opacity-5 w-[800px] h-[800px] bg-accent-primary rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              x: [0, 30, 0],
              y: [0, 20, 0]
            }}
            transition={{ 
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          ></motion.div>
        </motion.div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="outline" className="mb-4 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary border-transparent">
                How It Works
              </Badge>
            </motion.div>
            <motion.h2 
              className="text-4xl font-display font-medium mb-6"
              variants={fadeInUp}
            >
              From Chaos to <span className="text-accent-primary">Cash Flow</span> in Three Steps
            </motion.h2>
            <motion.p 
              className="text-lg text-ink-light"
              variants={fadeInUp}
            >
              While others waste months trying to organize their thoughts, you'll transform your ideas into sellable digital products in minutes.
            </motion.p>
          </motion.div>
          
          <div className="space-y-24">
            {/* Step 1 */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div 
                className="order-2 lg:order-1"
                variants={slideInFromLeft}
              >
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-sm font-medium mb-6">
                  Step 1
                </div>
                <h3 className="text-3xl font-display mb-4">Brain Dump</h3>
                <p className="text-lg text-ink-light mb-6">
                  Just upload everything—your scattered notes, voice memos, documents, and random ideas from anywhere. Autopen's AI instantly analyzes this chaos and organizes it into a coherent structure. No more staring at a jumble of thoughts wondering how to turn them into something sellable.
                </p>
                <motion.ul 
                  className="space-y-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {["Multiple import formats", "Automatic content organization", "AI-powered structure suggestions"].map((item, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-start"
                      variants={fadeInUp}
                    >
                      <Check className="h-5 w-5 text-accent-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-ink-light">{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
              
              <motion.div 
                className="order-1 lg:order-2 relative"
                variants={slideInFromRight}
              >
                <motion.div 
                  className="rounded-xl overflow-hidden shadow-xl border border-accent-tertiary/20"
                  whileHover={{ 
                    y: -10,
                    transition: { duration: 0.3 }
                  }}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1673&q=80" 
                    alt="Brain Dump feature" 
                    className="rounded-xl object-cover w-full aspect-[4/3]"
                  />
                </motion.div>
                
                <motion.div 
                  className="absolute -bottom-6 -right-6 transform rotate-3 bg-paper rounded-lg p-4 shadow-lg border border-accent-tertiary/20"
                  initial={{ opacity: 0, y: 20, rotate: 0 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 3 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ 
                    rotate: 6,
                    scale: 1.05,
                    transition: { duration: 0.3 }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-accent-primary/10 p-2 rounded-full">
                      <Upload className="h-4 w-4 text-accent-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-ink-light">Drag & drop your content</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div 
                className="relative"
                variants={slideInFromLeft}
              >
                <motion.div 
                  className="rounded-xl overflow-hidden shadow-xl border border-accent-tertiary/20"
                  whileHover={{ 
                    y: -10,
                    transition: { duration: 0.3 }
                  }}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1456324504439-367cee3b3c32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
                    alt="Formatting feature" 
                    className="rounded-xl object-cover w-full aspect-[4/3]"
                  />
                </motion.div>
                
                <motion.div 
                  className="absolute -top-6 -left-6 transform -rotate-3 bg-paper rounded-lg p-4 shadow-lg border border-accent-tertiary/20"
                  initial={{ opacity: 0, y: -20, rotate: 0 }}
                  whileInView={{ opacity: 1, y: 0, rotate: -3 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ 
                    rotate: -6,
                    scale: 1.05,
                    transition: { duration: 0.3 }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-accent-primary/10 p-2 rounded-full">
                      <Palette className="h-4 w-4 text-accent-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-ink-light">Beautiful typography</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
              
              <motion.div 
                variants={slideInFromRight}
              >
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-sm font-medium mb-6">
                  Step 2
                </div>
                <h3 className="text-3xl font-display mb-4">Format & Structure</h3>
                <p className="text-lg text-ink-light mb-6">
                  Watch as your unorganized content transforms into a structured digital product. Autopen automatically creates chapters, sections, and a logical flow that makes your ideas digestible and valuable to customers. This is where your random thoughts become a sellable asset.
                </p>
                <motion.ul 
                  className="space-y-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {["Premium design templates", "Professional typography", "Custom styling options"].map((item, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-start"
                      variants={fadeInUp}
                    >
                      <Check className="h-5 w-5 text-accent-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-ink-light">{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div 
                className="order-2 lg:order-1"
                variants={slideInFromLeft}
              >
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-sm font-medium mb-6">
                  Step 3
                </div>
                <h3 className="text-3xl font-display mb-4">Publish & Monetize</h3>
                <p className="text-lg text-ink-light mb-6">
                  With a single click, export your newly structured product in any format for immediate sale. While others are still organizing their thoughts, you're already collecting payments. Turn your knowledge into a revenue stream without the months of frustrating preparation.
                </p>
                <motion.ul 
                  className="space-y-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {["Multiple export formats", "Publishing platform integration", "Direct sharing options"].map((item, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-start"
                      variants={fadeInUp}
                    >
                      <Check className="h-5 w-5 text-accent-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-ink-light">{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
              
              <motion.div 
                className="order-1 lg:order-2 relative"
                variants={slideInFromRight}
              >
                <motion.div 
                  className="rounded-xl overflow-hidden shadow-xl border border-accent-tertiary/20"
                  whileHover={{ 
                    y: -10,
                    transition: { duration: 0.3 }
                  }}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80" 
                    alt="Publishing feature" 
                    className="rounded-xl object-cover w-full aspect-[4/3]"
                  />
                </motion.div>
                
                <motion.div 
                  className="absolute -bottom-6 -right-6 transform rotate-3 bg-paper rounded-lg p-4 shadow-lg border border-accent-tertiary/20"
                  initial={{ opacity: 0, y: 20, rotate: 0 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 3 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ 
                    rotate: 6,
                    scale: 1.05,
                    transition: { duration: 0.3 }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-accent-primary/10 p-2 rounded-full">
                      <Download className="h-4 w-4 text-accent-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-ink-light">Export in multiple formats</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-cream">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="outline" className="mb-4 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary border-transparent">
                Real Results
              </Badge>
            </motion.div>
            <motion.h2 
              className="text-4xl font-display font-medium mb-6"
              variants={fadeInUp}
            >
              Creators Who Turned <span className="text-accent-primary">Ideas Into Income</span> in Hours
            </motion.h2>
            <motion.p 
              className="text-lg text-ink-light"
              variants={fadeInUp}
            >
              Don't let your brilliant ideas sit untapped. See how others transformed their scattered thoughts into profitable digital products in record time.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index} 
                className="textera-card p-8 flex flex-col h-full border border-accent-tertiary/10"
                variants={fadeInUp}
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div 
                  className="flex items-center mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${testimonial.name.replace(/\s+/g, '')}`} alt={testimonial.name} />
                    <AvatarFallback className="bg-accent-primary/10 text-accent-primary">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-display text-lg text-ink-dark">{testimonial.name}</h4>
                    <p className="text-sm text-ink-light">{testimonial.role}</p>
                  </div>
                </motion.div>
                <motion.div 
                  className="flex mb-4"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={staggerContainer}
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { 
                          opacity: 1, 
                          y: 0,
                          transition: { delay: i * 0.06 + index * 0.1 }
                        }
                      }}
                    >
                      <Star className="h-4 w-4 text-accent-yellow fill-accent-yellow" />
                    </motion.div>
                  ))}
                </motion.div>
                <motion.p 
                  className="text-ink-light italic mb-4"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  "{testimonial.comment}"
                </motion.p>
                <motion.div 
                  className="mt-auto pt-4"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                >
                  <Badge variant="outline" className="text-ink-light border-accent-tertiary/20">
                    Verified User
                  </Badge>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-paper relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-full h-full">
          <div className="absolute bottom-0 right-0 opacity-5 w-[800px] h-[800px] bg-accent-primary rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary border-transparent">
              Pricing
            </Badge>
            <h2 className="text-4xl font-display font-medium mb-6">Stop Leaving Money on the Table</h2>
            <p className="text-lg text-ink-light">
              Choose your plan and turn your ideas into income today. All plans include our core AI technology that's helped 4,000+ creators monetize their knowledge.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricePlans.map((plan, index) => (
              <motion.div 
                key={index} 
                className={`textera-card p-8 flex flex-col h-full relative ${
                  plan.highlighted 
                    ? 'border-accent-primary ring-2 ring-accent-primary/20 shadow-blue-sm z-10 scale-105 my-4 md:my-0' 
                    : 'border-accent-tertiary/10'
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-accent-primary text-white px-3 py-1">Most Popular</Badge>
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-2xl font-display mb-2">{plan.name}</h3>
                  <div className="flex items-end mb-2">
                    <span className="text-4xl font-display font-medium">{plan.price}</span>
                    <span className="text-ink-light ml-1 mb-1">/{plan.period}</span>
                  </div>
                  <p className="text-ink-light">{plan.description}</p>
                </div>
                
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-accent-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-ink-light">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto">
                  <Button 
                    className={`w-full py-6 h-auto ${plan.highlighted ? "textera-button-primary" : "textera-button-secondary"}`}
                    onClick={() => handleOpenAuthModal('signup')}
                  >
                    {index === 0 ? "Try Free (No Credit Card Required)" : 
                     index === 1 ? "Start Pro (14-Day Money-Back Guarantee)" :
                     "Get Enterprise Solution"}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center text-ink-light">
            <p className="text-sm">
              All plans come with a 14-day money-back guarantee. No questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-cream">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary border-transparent">
              FAQ
            </Badge>
            <h2 className="text-4xl font-display font-medium mb-6">Frequently asked questions</h2>
            <p className="text-lg text-ink-light">
              Everything you need to know about Autopen and how it transforms your publishing workflow.
            </p>
          </div>
          
          <div className="space-y-6">
            {[
              {
                question: "How does the AI content organization work?",
                answer: "Our AI analyzes your content for patterns, topics, and themes. It then suggests a logical structure for your e-book, organizing chapters and sections in a coherent way. You always have the final say on the structure and can easily make adjustments."
              },
              {
                question: "Can I export my e-books to sell on Amazon or other platforms?",
                answer: "Yes! Autopen supports exporting to all major e-book formats including EPUB, MOBI, and PDF, making your content ready for publishing on Amazon Kindle, Apple Books, Barnes & Noble, and other major platforms."
              },
              {
                question: "Do I need technical skills to use Autopen?",
                answer: "Not at all. Autopen is designed to be intuitive and user-friendly. Our AI handles the technical aspects of e-book formatting and design, so you can focus on your content."
              },
              {
                question: "Is there a limit to how much content I can import?",
                answer: "Free accounts can import up to 50,000 words per project. Pro and Enterprise accounts have higher or unlimited import limits depending on the plan."
              },
              {
                question: "Can I collaborate with others on my e-book?",
                answer: "Team collaboration is available on our Enterprise plan, allowing multiple users to work on the same project simultaneously with role-based permissions."
              }
            ].map((faq, index) => (
              <motion.div 
                key={index} 
                className="textera-card p-6 border border-accent-tertiary/10"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <h3 className="text-xl font-display mb-2">{faq.question}</h3>
                <p className="text-ink-light">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-paper">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div 
            className="relative textera-card p-12 border-0 bg-gradient-to-br from-accent-primary/10 to-accent-secondary/5 overflow-hidden rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-secondary/10 rounded-full blur-3xl"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-8">
                <Badge variant="outline" className="mb-6 px-3 py-1 rounded-full bg-accent-primary/20 text-accent-primary border-transparent">
                  Don't Miss Another Sale
                </Badge>
                <h2 className="text-4xl font-display font-medium mb-6">Every Day Without Professional Design Costs You Sales</h2>
                <p className="text-lg text-ink-light mb-8">
                  The longer your content remains hidden in amateur formatting, the more readers and revenue you lose. Don't let another day pass with your brilliant ideas trapped in poor design—transform them now.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="textera-button-primary text-base px-8 py-6 h-auto"
                    onClick={() => handleOpenAuthModal('signup')}
                  >
                    Turn Ideas Into Income Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Link to="/features">
                    <Button variant="outline" className="textera-button-secondary text-base px-8 py-6 h-auto">
                      See Examples
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="lg:col-span-4 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-accent-primary/20 rounded-full animate-pulse-slow"></div>
                  </div>
                  <BookOpen className="w-48 h-48 text-accent-primary relative z-10 opacity-20" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cream border-t border-accent-tertiary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <Link to="/" className="flex items-center mb-6">
                <PenTool className="h-6 w-6 text-accent-primary mr-2" />
                <span className="font-display text-xl">Autopen</span>
              </Link>
              <p className="text-ink-light mb-6">
                Transform your ideas into beautiful professional e-books with our AI-powered platform.
              </p>
              <div className="flex space-x-4">
                <Badge variant="outline" className="bg-transparent border-accent-tertiary/20 text-ink-light">
                  © {new Date().getFullYear()} Autopen
                </Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-display text-lg mb-6">Product</h3>
              <ul className="space-y-3">
                <li><Link to="/features" className="text-ink-light hover:text-accent-primary transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="text-ink-light hover:text-accent-primary transition-colors">Pricing</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary transition-colors">Templates</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary transition-colors">Examples</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-display text-lg mb-6">Resources</h3>
              <ul className="space-y-3">
                <li><Link to="/" className="text-ink-light hover:text-accent-primary transition-colors">Documentation</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary transition-colors">Tutorials</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary transition-colors">Blog</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-display text-lg mb-6">Company</h3>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-ink-light hover:text-accent-primary transition-colors">About</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary transition-colors">Contact</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary transition-colors">Privacy</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8 bg-accent-tertiary/10" />
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-ink-light">
              Designed with care. Powered by AI.
            </p>
            <div className="flex gap-6">
              {["Twitter", "Instagram", "Facebook", "YouTube"].map((social, i) => (
                <Link key={i} to="/" className="text-sm text-ink-light hover:text-accent-primary transition-colors">
                  {social}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal 
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            initialView={authModalView}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
