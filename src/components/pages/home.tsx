import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import {
  PenTool,
  Star,
  Check,
  ArrowRight,
  Sparkles,
  BookOpen,
  FileText,
  Palette,
  Upload,
  Download,
  FileType,
  FileAudio,
  MessageSquare,
  File,
  StickyNote,
  ChevronRight,
  LayoutTemplate
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import AuthModal from "../auth/AuthModal";
import { motion, useScroll, useTransform, AnimatePresence, stagger, Variants } from "framer-motion";
import React from "react";

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
    <path d="M61.58,17.99c-5.93,4.38-14.51,6.71-21.91,6.71c-10.36,0-19.72-3.83-26.79-10.21c-0.55-0.5-0.06-1.18,0.61-0.79c7.57,4.4,16.93,7.05,26.6,7.05c6.52,0,13.68-1.35,20.27-4.17C61.69,15.89,62.75,17.09,61.58,17.99z M63.8,15.49c-0.76-0.97-5-0.46-6.91-0.23c-0.58,0.07-0.67-0.44-0.15-0.8c3.38-2.38,8.93-1.69,9.57-0.9c0.65,0.81-0.17,6.28-3.3,8.9c-0.48,0.39-0.94,0.18-0.73-0.35C63.03,20.06,64.55,16.46,63.8,15.49z M56,34.6V7.16c0-0.56,0.43-0.94,0.94-0.94h3.41c0.53,0,0.96,0.43,0.97,0.94v4.08h0.07c0.89-2.36,2.56-3.47,4.81-3.47c2.29,0,3.72,1.11,4.74,3.47c0.89-2.36,2.9-3.47,5.06-3.47c1.54,0,3.21,0.64,4.23,2.06c1.16,1.59,0.92,3.89,0.92,5.9l-0.01,18.85c0,0.55-0.43,0.99-0.97,0.99h-3.4c-0.51,0-0.93-0.44-0.93-0.99V18.86c0-0.82,0.07-2.86-0.11-3.63c-0.28-1.32-1.13-1.69-2.22-1.69c-0.91,0-1.87,0.61-2.26,1.59c-0.39,0.98-0.35,2.61-0.35,3.74v15.74c0,0.55-0.43,0.99-0.97,0.99h-3.4C56.43,35.59,56,35.15,56,34.6z M106.42,7.16c5.06,0,7.8,4.34,7.8,9.87c0,5.34-3.03,9.57-7.8,9.57c-4.97,0-7.67-4.34-7.67-9.74c0-5.44,2.74-9.7,7.67-9.7zM140.43,34.6c-0.5,0.45-1.23,0.48-1.8,0.18c-2.53-2.1-2.99-3.07-4.36-5.07c-4.16,4.25-7.12,5.52-12.53,5.52c-6.39,0-11.37-3.95-11.37-11.84c0-6.16,3.34-10.36,8.11-12.42c4.13-1.84,9.89-2.17,14.29-2.67v-0.99c0-1.8,0.14-3.93-0.92-5.49c-0.92-1.4-2.68-1.98-4.23-1.98c-2.87,0-5.43,1.47-6.05,4.53c-0.13,0.68-0.63,1.33-1.3,1.37l-3.53-0.38c-0.59-0.13-1.25-0.61-1.08-1.51C117.07,5.98,123.64,3,129.66,3c3.03,0,6.99,0.81,9.38,3.1c3.03,2.83,2.74,6.59,2.74,10.69v9.67c0,2.91,1.2,4.18,2.33,5.75c0.4,0.56,0.48,1.23-0.01,1.64C142.82,32.61,141.22,33.75,140.43,34.6zM106.42,11.84c-2.51,0-2.58,3.42-2.58,5.55c0,2.13-0.03,6.68,2.55,6.68c2.55,0,2.67-3.56,2.67-5.73c0-1.43-0.06-3.13-0.49-4.49C108.14,12.44,107.36,11.84,106.42,11.84zM132.27,21.25v-1.82c-5.43,0-11.19,1.17-11.19,7.63c0,3.27,1.69,5.49,4.58,5.49c2.12,0,4.01-1.3,5.21-3.42c1.48-2.6,1.4-5.04,1.4-7.88z M89.22,34.6V7.16c0-0.56,0.43-0.94,0.97-0.94h3.43c0.5,0,0.91,0.44,0.93,0.94v4.08h0.07C95.85,7.76,98,6.21,100.89,6.21c1.95,0,3.86,0.7,5.08,2.63c1.13,1.77,1.13,4.75,1.13,6.88v19.04c-0.06,0.5-0.47,0.89-0.97,0.89h-3.46c-0.46-0.02-0.85-0.37-0.92-0.89v-16.4c0-2.1,0.24-5.17-2.33-5.17c-0.91,0-1.74,0.61-2.16,1.52c-0.52,1.16-0.59,2.33-0.59,3.65v16.34c-0.01,0.55-0.45,0.99-0.99,0.99h-3.4C89.66,35.59,89.22,35.15,89.22,34.6z M148.49,7.16h-5.01v-6.19c0-0.41,0.25-0.68,0.58-0.74l5.31-0.01c0.34,0,0.61,0.27,0.61,0.62v5.16c0,0.42-0.36,1.16-1.49,1.16zM143.96,34.6V7.16c0-0.56,0.43-0.94,0.97-0.94h3.4c0.5,0,0.92,0.44,0.94,0.94v27.45c0,0.55-0.43,0.99-0.96,0.99h-3.39C144.4,35.59,143.96,35.15,143.96,34.6z M24.03,25.54c-1.9,0-3.76,0.44-5.36,1.31c-0.4,0.21-0.67,0.61-0.67,1.04v9.06c0,0.44,0.28,0.84,0.68,1.05c1.62,0.88,3.5,1.35,5.4,1.35c4.54,0,7.17-3.11,7.17-6.93c0-3.83-2.65-6.88-7.22-6.88z M28.34,19.71c0.81-1.13,1.05-2.52,1.05-3.94c0-3.22-1.54-5.17-3.57-6.15c-1.08-0.53-2.3-0.73-3.52-0.73c-2.4,0-3.72,0.9-5.76,3.22l-0.8,0.9l2.44,0.36l0.59-0.59c1.03-1.03,1.99-1.5,3.52-1.5c0.91,0,1.77,0.18,2.51,0.53c1.08,0.52,1.86,1.62,1.86,3.28c0,1.31-0.28,2.38-1.05,3.33c-0.99,1.22-2.65,1.85-4.47,1.85h-1.36v3.17h1.4c1.95,0,3.8,0.4,5.08,1.58c1.35,1.26,1.98,3.06,1.98,5.25c0,2.38-0.86,4.23-2.35,5.58c-1.4,1.26-3.5,1.95-5.5,1.95c-1.09,0-2.13-0.14-3.12-0.44c-1.9-0.56-3.25-1.83-3.87-3.37c-0.4-0.99-0.48-2.13-0.44-3.21l0.03-1.04l-2.85-0.11l-0.03,1.08c-0.07,3.03,0.66,5.1,2.36,6.97c1.77,1.94,4.54,2.94,7.82,2.94c3.12,0,5.79-0.9,7.78-2.61c2.26-1.94,3.43-4.75,3.43-8.19c0-3.11-1.09-5.58-3.17-7.4z" fill="currentColor" />
  </svg>
);

const BarnesNobleLogo = () => (
  <svg viewBox="0 0 160 48" className="h-6 w-auto" fill="currentColor">
    <path d="M24.53,14.71h2.21v18.24h-2.21V14.71z M36.55,32.95h-2.09V14.71h2.09V32.95z M33.69,14.71h0.77v18.24h-0.77V14.71z M28.82,14.71h1.19v18.24h-1.19V14.71z M21.17,14.71h1.6v18.24h-1.6V14.71z M17.05,20.42c0-3.49,2.57-6.08,6.13-6.08c3.56,0,6.13,2.59,6.13,6.08v7.41c0,3.49-2.57,6.08-6.13,6.08c-3.56,0-6.13-2.59-6.13-6.08V20.42z M41.02,20.42c0-3.49,2.57-6.08,6.13-6.08c3.56,0,6.13,2.59,6.13,6.08v7.41c0,3.49-2.57,6.08-6.13,6.08c-3.56,0-6.13-2.59-6.13-6.08V20.42z M61.5,32.95h-2.09V14.71h2.09V32.95z M58.64,14.71h0.77v18.24h-0.77V14.71z M53.98,14.71h1.19v18.24h-1.19V14.71z M46.33,14.71h1.6v18.24h-1.6V14.71z M75.57,14.71h2.09v14.76c0,2.17-0.46,3.95-2.75,3.95h-7.02v-2.14h6.2c0.83,0,1.49-0.2,1.49-1.85V14.71z M73.19,25.3h-5.36v-2.09h5.36V25.3z M73.19,16.86h-5.36v-2.15h5.36V16.86z M65.59,32.95h-2.09V14.71h2.09V32.95z M82.8,20.42c0-3.49,2.57-6.08,6.13-6.08c3.56,0,6.13,2.59,6.13,6.08v7.41c0,3.49-2.57,6.08-6.13,6.08c-3.56,0-6.13-2.59-6.13-6.08V20.42z M86.66,14.71h1.19v18.24h-1.19V14.71z M98.22,14.71h1.6v18.24h-1.6V14.71z M110.27,32.95h-2.09V14.71h2.09V32.95z M107.41,14.71h0.77v18.24h-0.77V14.71z M102.67,14.71h1.19v18.24h-1.19V14.71z M123.05,32.95h-9.07V14.71h2.09v16.1h6.99V32.95z M117.47,25.3h-5.38v-2.09h5.38V25.3z M117.47,16.86h-5.38v-2.15h5.38V16.86z M125.19,20.42c0-3.49,2.57-6.08,6.13-6.08c3.56,0,6.13,2.59,6.13,6.08v7.41c0,3.49-2.57,6.08-6.13,6.08c-3.56,0-6.13-2.59-6.13-6.08V20.42z M129.05,14.71h1.19v18.24h-1.19V14.71z M139.54,32.88c-1.57,0-2.89-0.36-3.86-1.07c-0.96-0.71-1.44-1.83-1.44-3.37v-9.97h2.07v9.92c0,0.77,0.27,1.46,0.82,1.85c0.54,0.39,1.24,0.58,2.09,0.58c0.86,0,1.57-0.23,2.09-0.7c0.54-0.46,0.8-1.24,0.8-2.34v-9.29h2.07v9.34c0,1.65-0.52,2.96-1.57,3.93c-1.04,0.96-2.4,1.44-4.06,1.44z" fill="currentColor" />
  </svg>
);

const AppleBooksLogo = () => (
  <svg viewBox="0 0 160 48" className="h-7 w-auto" fill="currentColor">
    <path d="M32.8,7.58c1.93,0,4.22,0.8,6.22,2.46c-0.16,0.17-4.56,2.65-4.51,7.98c0.06,6.35,5.56,8.46,5.61,8.48c-0.05,0.14-0.89,3.05-2.94,6.03c-1.76,2.59-3.6,5.17-6.49,5.21c-2.83,0.05-3.75-1.69-7-1.69c-3.25,0-4.27,1.63-6.97,1.74c-2.8,0.11-4.92-2.8-6.7-5.37C7.32,28.07,5.05,20.79,7.72,16c1.32-2.36,3.68-3.86,6.25-3.9c2.66-0.05,4.34,1.71,6.54,1.71c2.2,0,3.54-1.71,6.7-1.71C28.93,12.1,31.09,12.48,32.8,7.58L32.8,7.58L32.8,7.58z M45.54,7.58h6.22l4.51,13.53l4.56-13.53h6.03l-8.5,22.05h-4.37L45.54,7.58L45.54,7.58z M73.49,29.63L73.49,7.58h5.99v22.05H73.49L73.49,29.63z M81.7,29.63v-5.37h5.37v5.37H81.7L81.7,29.63z M108.99,29.63h-5.89v-17.2h-4.8V7.58h15.45v4.85h-4.75V29.63L108.99,29.63L108.99,29.63z M124.01,29.63v-8.78h-9.17V16.9h9.17V8.16h5.99v21.47H124.01L124.01,29.63z M92.01,29.63V7.58h10.75c5.65,0,9.65,3.86,9.65,9.27c0,5.41-4.03,9.27-9.7,9.27h-4.7v3.51L92.01,29.63L92.01,29.63z M98.01,20.75h3.75c2.36,0,4.61-1.16,4.61-3.9c0-2.74-2.25-3.9-4.61-3.9h-3.75V20.75L98.01,20.75z" fill="currentColor" />
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
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.02 // Added stagger for character reveal effect
    }
  }
};

const textCharacterSpan: Variants = { // New variant for individual character span
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

const checkIconPopIn: Variants = { // New variant for check icons
  hidden: { opacity: 0, scale: 0.5 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
      duration: 0.5
    }
  }
};

const cardHover = {
  rest: { y: 0, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", borderColor: "rgba(var(--color-accent-tertiary-rgb) / 0.1)" }, // Added default border color
  hover: { 
    y: -8, 
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    borderColor: "rgba(var(--color-accent-primary-rgb) / 0.3)", // Use defined variable
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// ParallaxImage component using useScroll within itself
function ParallaxImage({ src, alt }: { src: string, alt: string }) {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({ 
    target: ref,
    offset: ["start end", "end start"] // Trigger animation when element is in viewport
  });
  // Adjust the output range for a subtle parallax effect (e.g., moves 50px vertically)
  const y = useTransform(scrollYProgress, [0, 1], [-50, 50]); 

  return (
    <div ref={ref} className="relative overflow-hidden rounded-xl shadow-xl border border-accent-tertiary/20">
      <motion.img 
        src={src} 
        alt={alt} 
        className="rounded-xl object-cover w-full aspect-[4/3] block" // Ensure image is block
        style={{ y }} // Apply parallax effect here
        whileHover={{ 
          scale: 1.03, // Add slight scale on hover
          transition: { duration: 0.3 }
        }}
      />
    </div>
  );
}

// Define a custom animated element for step 1 (Import Content)
function ContentImportAnimation() {
  // Create variants for staggered animation of floating items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring",
        damping: 12
      }
    }
  };

  const floatVariants = {
    initial: { y: 0 },
    float: (i) => ({
      y: [-5, 5, -5][i % 3],
      transition: {
        duration: 3 + (i * 0.5),
        repeat: Infinity,
        ease: "easeInOut"
      }
    })
  };

  const moveVariants = {
    initial: { x: 0 },
    move: (i) => ({
      x: [0, 15, 0][i % 3],
      transition: {
        duration: 5 + (i * 0.7),
        repeat: Infinity,
        ease: "easeInOut"
      }
    })
  };

  const contentItems = [
    { icon: FileType, color: "text-blue-500/90 dark:text-blue-400", bg: "bg-blue-100/90 dark:bg-blue-900/30", delay: 0, name: "Document" },
    { icon: FileAudio, color: "text-amber-500/90 dark:text-amber-400", bg: "bg-amber-100/90 dark:bg-amber-900/30", delay: 1.2, name: "Audio" },
    { icon: MessageSquare, color: "text-emerald-500/90 dark:text-emerald-400", bg: "bg-emerald-100/90 dark:bg-emerald-900/30", delay: 0.6, name: "Notes" },
    { icon: StickyNote, color: "text-violet-500/90 dark:text-violet-400", bg: "bg-violet-100/90 dark:bg-violet-900/30", delay: 0.3, name: "Notes" },
    { icon: File, color: "text-rose-500/90 dark:text-rose-400", bg: "bg-rose-100/90 dark:bg-rose-900/30", delay: 0.9, name: "File" }
  ];

  return (
    <div className="relative w-full h-full aspect-[4/3] bg-gradient-to-br from-accent-primary/5 to-accent-secondary/5 dark:from-accent-primary/10 dark:to-accent-secondary/10 rounded-xl border border-accent-primary/10 dark:border-accent-primary/20 overflow-hidden shadow-sm">
      {/* Target container in the center */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center shadow-inner"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <PenTool className="h-12 w-12 text-accent-primary dark:text-accent-primary/90" />
      </motion.div>
      
      {/* Multiple pulse ring animations */}
      {[...Array(2)].map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent-primary/30 dark:border-accent-primary/40"
          style={{ width: "28px", height: "28px" }}
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ 
            scale: [1, 2.2, 2.2], 
            opacity: [0.8, 0, 0],
            transition: { 
              duration: 2.4,
              repeat: Infinity,
              repeatDelay: i * 0.8,
              ease: "easeOut"
            }
          }}
          viewport={{ once: true }}
        />
      ))}

      {/* Floating content items with tooltips */}
      <motion.div
        className="absolute inset-0"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {contentItems.map((item, i) => (
          <motion.div
            key={i}
            className={`absolute ${item.bg} p-3 rounded-lg shadow-md dark:shadow-lg border border-transparent dark:border-white/5 backdrop-blur-sm`}
            style={{ 
              top: `${15 + (i * 12)}%`, 
              left: `${(i % 2 === 0 ? 18 : 72) - (i * 3)}%`,
              zIndex: 5 - i
            }}
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: item.delay }}
            custom={i}
            animate={["float", "move"]}
            whileHover={{ scale: 1.1, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
          >
            <motion.div
              variants={floatVariants}
              initial="initial"
              animate="float"
              custom={i}
            >
              <motion.div
                variants={moveVariants}
                initial="initial"
                animate="move"
                custom={i}
                className="relative group"
              >
                <item.icon className={`h-8 w-8 ${item.color}`} />
                <div className="absolute opacity-0 group-hover:opacity-100 -top-8 left-1/2 transform -translate-x-1/2 bg-paper dark:bg-paper-dark text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity">
                  {item.name}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
        
        {/* Arrow paths */}
        {contentItems.map((_, i) => (
          <motion.div
            key={`path-${i}`}
            className="absolute top-0 left-0 w-full h-full"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 + (i * 0.1) }}
          >
            <svg className="w-full h-full absolute top-0 left-0" style={{ zIndex: 1 }}>
              <motion.path
                d={`M ${(i % 2 === 0 ? 23 : 77) - (i * 3)}% ${20 + (i * 12)}% Q ${50 - (i * 2)}% ${50 + (i * 2)}%, 50% 50%`}
                stroke="rgba(var(--color-accent-primary-rgb), 0.3)"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray="5,5"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
              />
            </svg>
          </motion.div>
        ))}
      </motion.div>

      {/* Label at bottom */}
      <motion.div
        className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-paper/80 dark:bg-paper-dark/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs border border-accent-primary/10 dark:border-accent-primary/20 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.5 }}
      >
        <span className="flex items-center">
          <Upload className="h-3 w-3 mr-1 text-accent-primary" />
          Any format, instantly organized
        </span>
      </motion.div>
    </div>
  );
}

// Define a custom animated element for step 2 (AI Transformation)
function AiStructureAnimation() {
  // Define variants for the animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const docVariants = {
    messy: { 
      rotate: [-1, 2, -1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    organized: {
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const lineVariants = {
    hidden: { width: "40%", opacity: 0.3 },
    visible: (i) => ({ 
      width: ["60%", "100%", "80%"][i % 3],
      opacity: 1,
      transition: { 
        duration: 1, 
        delay: i * 0.2,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="relative w-full h-full aspect-[4/3] bg-gradient-to-br from-accent-primary/5 to-accent-secondary/5 dark:from-accent-primary/10 dark:to-accent-secondary/10 rounded-xl border border-accent-primary/10 dark:border-accent-primary/20 overflow-hidden flex items-center justify-center shadow-sm">
      <div className="relative w-4/5 mx-auto flex space-x-6 md:space-x-12 items-center justify-center">
        {/* Messy document */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            className="w-32 md:w-40 h-44 md:h-52 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col space-y-2 transform z-20"
            animate="messy"
            variants={docVariants}
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-4 rounded"></div>
            <div className="w-4/5 bg-gray-200 dark:bg-gray-700 h-4 rounded"></div>
            <div className="flex space-x-1">
              <div className="w-2/3 bg-gray-200 dark:bg-gray-700 h-4 rounded"></div>
              <div className="w-1/4 bg-gray-100 dark:bg-gray-600 h-4 rounded"></div>
            </div>
            <div className="w-5/6 bg-gray-200 dark:bg-gray-700 h-4 rounded"></div>
            <div className="w-2/3 bg-gray-100 dark:bg-gray-600 h-4 rounded"></div>
            <div className="w-3/4 bg-gray-200 dark:bg-gray-700 h-4 rounded"></div>
            <div className="w-1/2 bg-gray-100 dark:bg-gray-600 h-4 rounded"></div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-4 rounded"></div>
          </motion.div>
          
          <motion.div
            className="absolute -bottom-2 -right-2 w-32 md:w-40 h-44 md:h-52 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg border border-gray-200 dark:border-gray-700 transform rotate-[-8deg] -z-10"
            animate={{ rotate: [-10, -5, -10] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <motion.div
            className="absolute -top-2 -left-2 w-32 md:w-40 h-44 md:h-52 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg border border-gray-200 dark:border-gray-700 transform rotate-[5deg] -z-10"
            animate={{ rotate: [7, 0, 7] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        
        {/* AI Process Arrow */}
        <motion.div
          className="flex flex-col items-center justify-center relative z-30"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.div 
            className="p-3 bg-accent-primary/15 dark:bg-accent-primary/25 rounded-full shadow-md"
            whileHover={{ scale: 1.1 }}
            animate={{ boxShadow: ["0px 0px 0px rgba(var(--color-accent-primary-rgb), 0.3)", "0px 0px 15px rgba(var(--color-accent-primary-rgb), 0.5)", "0px 0px 0px rgba(var(--color-accent-primary-rgb), 0.3)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronRight className="h-6 w-6 text-accent-primary" />
          </motion.div>
          <div className="text-xs text-accent-primary mt-1 font-medium">AI Magic</div>
          
          {/* Particle effects around arrow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-accent-primary/60"
                style={{ 
                  top: `${50 + (Math.cos(i * 60 * Math.PI / 180) * 20)}%`,
                  left: `${50 + (Math.sin(i * 60 * Math.PI / 180) * 20)}%`,
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [(Math.sin(i * 60 * Math.PI / 180) * 10), 0],
                  y: [(Math.cos(i * 60 * Math.PI / 180) * 10), 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  repeatDelay: 1
                }}
              />
            ))}
          </motion.div>
        </motion.div>
        
        {/* Organized document */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <motion.div
            className="w-32 md:w-40 h-44 md:h-52 bg-gradient-to-br from-white dark:from-gray-800 to-accent-primary/5 dark:to-accent-primary/20 rounded-lg shadow-xl dark:shadow-accent-primary/10 border border-accent-primary/20 dark:border-accent-primary/30 p-4 flex flex-col space-y-2 transform z-20"
            animate="organized"
            variants={docVariants}
            whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
          >
            <motion.div
              className="w-full h-6 bg-accent-primary/10 dark:bg-accent-primary/20 rounded flex items-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1 }}
            >
              <div className="w-1/4 h-3 bg-accent-primary/30 dark:bg-accent-primary/40 rounded-sm ml-2"></div>
            </motion.div>
            
            <motion.div 
              className="space-y-2"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[...Array(5)].map((_, i) => (
                <motion.div 
                  key={i}
                  className="bg-accent-primary/5 dark:bg-accent-primary/15 h-4 rounded" 
                  custom={i}
                  variants={lineVariants}
                ></motion.div>
              ))}
            </motion.div>
            
            <motion.div
              className="mt-auto pt-2 flex items-center justify-between"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.5 }}
            >
              <div className="w-6 h-6 rounded-full bg-accent-primary/20 dark:bg-accent-primary/30 flex items-center justify-center">
                <LayoutTemplate className="w-3 h-3 text-accent-primary" />
              </div>
              <div className="w-16 h-3 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-sm"></div>
            </motion.div>
          </motion.div>
          
          <motion.div
            className="absolute -top-3 -right-3 w-12 h-12 bg-accent-primary/10 dark:bg-accent-primary/30 rounded-full flex items-center justify-center shadow-lg"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 15, 
              delay: 1.2 
            }}
            whileHover={{ scale: 1.1, rotate: 15 }}
          >
            <Sparkles className="h-6 w-6 text-accent-primary dark:text-white" />
          </motion.div>
        </motion.div>
      </div>
      
      {/* Label at bottom */}
      <motion.div
        className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-paper/80 dark:bg-paper-dark/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs border border-accent-primary/10 dark:border-accent-primary/20 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.5 }}
      >
        <span className="flex items-center">
          <Palette className="h-3 w-3 mr-1 text-accent-primary" />
          Instant professional design
        </span>
      </motion.div>
    </div>
  );
}

// Define a custom animated element for step 3 (Export & Publish)
function ExportPublishAnimation() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.4
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring",
        damping: 12
      }
    }
  };

  // Define inline SVGs for platforms
  const amazonSvg = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.5 15.5c-1.4 1.3-3.4 2-5.5 2s-4.1-.7-5.5-2c-.1-.1-.3-.1-.4 0s-.1.3 0 .4c1.5 1.4 3.6 2.2 5.9 2.2s4.4-.8 5.9-2.2c.1-.1.1-.3 0-.4-.1-.1-.3-.1-.4 0z" fill="#FF9900"/>
      <path d="M20.5 18.5c-.2-.2-.6-.1-.8.1-.8.8-1.8 1.5-2.9 2-2.4 1-5.1 1.1-7.6.4-1.9-.6-3.6-1.6-4.9-3.1-.2-.2-.6-.2-.8 0s-.2.6 0 .8c1.5 1.6 3.4 2.8 5.4 3.5 1.1.3 2.2.5 3.4.5 1.6 0 3.2-.3 4.7-.9 1.3-.5 2.4-1.3 3.3-2.2.2-.3.3-.7.2-1.1z" fill="#FF9900"/>
      <path d="M21.7 16.8c-.1-.2-.3-.3-.5-.3-3 .5-5.8-.3-7.3-2.3-.1-.2-.4-.2-.5 0-1.5 2.1-4.3 2.8-7.3 2.3-.2 0-.4.1-.5.3-.1.2 0 .4.1.5 1.5 1.2 3.2 1.8 5 1.8 1.5 0 3-.4 4.2-1.2 1.2.8 2.7 1.2 4.2 1.2 1.8 0 3.5-.6 5-1.8.1-.1.2-.3.1-.5z" fill="#FF9900"/>
      <path d="M12 13.5c2.3 0 4.1-2.2 4.1-5s-1.8-5-4.1-5-4.1 2.2-4.1 5 1.8 5 4.1 5zm0-8.8c1.6 0 2.9 1.7 2.9 3.8s-1.3 3.8-2.9 3.8-2.9-1.7-2.9-3.8 1.3-3.8 2.9-3.8z" fill="#FF9900"/>
    </svg>
  );

  const appleSvg = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4 16.11 3.05 12.18 4.77 9.67c.85-1.24 2.37-2.03 4.02-2.05 1.26-.01 2.44.84 3.2.84.76 0 2.2-1.04 3.71-.89.63.03 2.38.26 3.52 1.93-.09.06-2.11 1.23-2.09 3.67.03 2.91 2.56 3.88 2.58 3.88-.02.07-.42 1.44-1.38 2.83-.82 1.21-1.68 2.4-3.01 2.41-1.32.03-1.74-.8-3.29-.8-1.53 0-2 .78-3.27.83-1.31.05-2.3-1.32-3.14-2.53-2.4-3.42-2.8-10.07 1.7-14.46 1.11-1.08 3.09-1.86 4.73-1.94C14.67 2.01 16.88 3.9 17.5 5.42c-1.21.68-2.29 1.94-2.03 3.76.29 2.05 1.98 3.26 4.25 2.83.31-1.5 1.1-2.87 1.97-3.8-.22-.5-.48-1-.8-1.5-.92-1.39-2.58-3.06-4.94-3.07-1.81 0-3.37.97-4.26 1.93-.21.22-.4.46-.56.7 1.84-2.85 5.1-4.68 8.8-4.68 2.24 0 4.31.71 6.01 1.91.35-.76.55-1.59.55-2.47 0-3.31-2.69-6-6-6H5C2.24 5 0 7.24 0 10v14c0 0 2.7 1.5 6 1.5h12c3.3 0 6-1.5 6-1.5v-8.14c-.52.72-1.14 1.47-1.96 2.71-1.29 1.96-2.87 2.39-3.33 2.43z" fill="#A2AAAD"/>
    </svg>
  );

  const gumroadSvg = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3v1h-6V8c0-1.66 1.34-3 3-3zm-4 9.5c0-1.38 1.12-2.5 2.5-2.5.53 0 1.01.16 1.42.44l-.44.44c-.29-.16-.62-.27-.98-.27-.89 0-1.61.72-1.61 1.61 0 .89.72 1.61 1.61 1.61.62 0 1.15-.34 1.43-.85H11v-1.38h2.81c.05.21.08.43.08.66 0 1.38-1.12 2.5-2.5 2.5s-2.5-1.12-2.5-2.5V14h-1v.5zm8.5 2.5h-3v-1h3v1zm0-2h-3v-1h3v1zm0-2h-3v-1h3v1z" fill="#36a9ae"/>
    </svg>
  );

  const formats = [
    { name: "PDF", color: "bg-red-500 dark:bg-red-600", icon: <FileText className="h-5 w-5 text-white" /> },
    { name: "EPUB", color: "bg-blue-500 dark:bg-blue-600", icon: <BookOpen className="h-5 w-5 text-white" /> },
    { name: "MOBI", color: "bg-amber-500 dark:bg-amber-600", icon: <FileText className="h-5 w-5 text-white" /> }
  ];

  const platforms = [
    { name: "Amazon", icon: amazonSvg, color: "bg-orange-100 dark:bg-orange-900/30" },
    { name: "Apple Books", icon: appleSvg, color: "bg-red-100 dark:bg-red-900/30" },
    { name: "Gumroad", icon: gumroadSvg, color: "bg-sky-100 dark:bg-sky-900/30" }
  ];

  return (
    <div className="relative w-full h-full aspect-[4/3] bg-gradient-to-br from-accent-primary/5 to-accent-secondary/5 dark:from-accent-primary/10 dark:to-accent-secondary/10 rounded-xl border border-accent-primary/10 dark:border-accent-primary/20 overflow-hidden flex items-center justify-center shadow-sm">
      <div className="relative w-full h-full mx-auto">
        {/* Book Cover */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-44 h-60 rounded-lg bg-gradient-to-br from-accent-primary/90 to-accent-secondary/90 dark:from-accent-primary dark:to-accent-secondary shadow-xl dark:shadow-accent-primary/20 overflow-hidden border-2 border-white/80 dark:border-white/20 z-20"
          initial={{ opacity: 0, y: 50, rotateY: -30 }}
          whileInView={{ 
            opacity: 1, 
            y: 0, 
            rotateY: 0,
            transition: { 
              type: "spring", 
              stiffness: 100, 
              damping: 15,
              delay: 0.2
            }
          }}
          viewport={{ once: true }}
          whileHover={{ 
            scale: 1.03, 
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", 
            borderColor: "rgba(255, 255, 255, 0.9)" 
          }}
        >
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" className="text-white">
              <defs>
                <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#diagonalHatch)" />
            </svg>
          </div>
          
          <div className="p-4 flex flex-col h-full">
            <div className="w-3/4 h-2 bg-white/70 rounded mb-2"></div>
            <div className="w-5/6 h-2 bg-white/70 rounded mb-1"></div>
            <div className="w-2/3 h-2 bg-white/70 rounded mb-6"></div>
            
            <div className="w-full h-20 bg-white/20 rounded mb-4"></div>
            
            <div className="mt-auto">
              <div className="w-1/2 h-2 bg-white/70 rounded mb-1"></div>
              <div className="w-5/6 h-2 bg-white/70 rounded"></div>
            </div>
          </div>
          
          <motion.div
            className="absolute -top-3 -right-3 w-16 h-16"
            initial={{ scale: 0, rotate: -30 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, type: "spring" }}
            whileHover={{ rotate: 15 }}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-yellow-400 dark:bg-yellow-500 rounded-full shadow-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-yellow-800 dark:text-yellow-900">NEW</div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Format Options */}
        <motion.div
          className="absolute top-4 left-4 flex flex-col space-y-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {formats.map((format, i) => (
            <motion.div
              key={i}
              className="flex items-center space-x-2"
              variants={itemVariants}
              whileHover={{ scale: 1.05, x: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className={`w-10 h-10 ${format.color} rounded-lg flex items-center justify-center shadow-md dark:shadow-lg`}>
                {format.icon}
              </div>
              <div className="text-xs font-medium">{format.name}</div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Platform Options */}
        <motion.div
          className="absolute top-4 right-4 flex flex-col space-y-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {platforms.map((platform, i) => (
            <motion.div
              key={i}
              className="flex items-center space-x-2"
              variants={itemVariants}
              custom={i + formats.length}
              whileHover={{ scale: 1.05, x: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="text-xs font-medium text-right">{platform.name}</div>
              <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center shadow-md dark:shadow-lg border border-transparent dark:border-white/5`}>
                {platform.icon}
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Rays animation */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <motion.div
            className="absolute w-full h-full"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 bg-accent-primary/10 dark:bg-accent-primary/20 h-1 origin-left"
                style={{ 
                  width: '50%', 
                  rotate: `${i * 30}deg`,
                  translateX: "-50%",
                  translateY: "-50%"
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                whileInView={{ 
                  scaleX: 1, 
                  opacity: [0, 0.6, 0],
                  transition: { 
                    duration: 2,
                    delay: 0.5 + (i * 0.05),
                    repeat: Infinity,
                    repeatDelay: 3
                  }
                }}
                viewport={{ once: true }}
              />
            ))}
          </motion.div>
        </div>
        
        {/* Export Button */}
        <motion.div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-accent-primary text-white dark:bg-accent-primary/90 dark:text-white px-6 py-2 rounded-full shadow-lg flex items-center space-x-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1, type: "spring" }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Download className="h-4 w-4" />
          <span className="text-sm font-medium">Export Now</span>
        </motion.div>
        
        {/* One-click export label */}
        <motion.div
          className="absolute bottom-16 right-4 bg-paper/90 dark:bg-paper-dark/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs border border-accent-primary/10 dark:border-accent-primary/20 shadow-sm"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2 }}
        >
          <span className="flex items-center">
            <Download className="h-3 w-3 mr-1 text-accent-primary" />
            One-click export to all formats
          </span>
        </motion.div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('signup');
  const [scrollYValue, setScrollYValue] = useState(0); // Renamed state variable
  
  // Keep hero transforms
  const { scrollYProgress: pageScrollYProgress } = useScroll(); 
  const scaleHero = useTransform(pageScrollYProgress, [0, 1], [1, 0.8]);
  const opacityHero = useTransform(pageScrollYProgress, [0, 0.3], [1, 0.3]);
  const yHero = useTransform(pageScrollYProgress, [0, 0.3], [0, -60]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollYValue(window.scrollY); // Use renamed state variable
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
      comment: "I had brilliant ideas trapped in voice memos, Google Docs, and notebooks. Autopen organized everything into a structured ebook that readers love. I made my first sale 48 hours after using Autopen.",
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
        className={`fixed w-full z-50 transition-all duration-300 ${scrollYValue > 20 ? 'bg-paper/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'}`}
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
                      className="textera-button-secondary hover:brightness-110 transition-all" // Added hover brightness
                      onClick={() => handleOpenAuthModal('login')}
                    >
                      Sign In
                    </Button>
                  </motion.div>
                </motion.div>
                <motion.div whileHover="hover" initial="rest" animate="rest">
                  <motion.div variants={buttonHover}>
                    <Button 
                      className="textera-button-primary hover:brightness-110 transition-all" // Added hover brightness
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
              style={{ y: yHero }} // Corrected variable name
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
                variants={staggerContainer} // Use stagger container for characters
              >
                {/* Split headline into words/chars for reveal animation */}
                {"Stop Losing Money on ".split("").map((char, i) => (
                  <motion.span key={i} variants={textCharacterSpan}>{char}</motion.span>
                ))}
                <span className="text-accent-primary">
                  {"Scattered Ideas. ".split("").map((char, i) => (
                    <motion.span key={i} variants={textCharacterSpan}>{char}</motion.span>
                  ))}
                </span>
                {"Turn Them Into Income Streams in Minutes.".split("").map((char, i) => (
                  <motion.span key={i} variants={textCharacterSpan}>{char}</motion.span>
                ))}
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl text-ink-light max-w-xl"
                variants={fadeInUp}
              >
                Your brilliant ideas are worthless until they're structured. Autopen's AI does the hard work, transforming chaos into cash-generating ebooks, guides, and courses <span className="italic">today</span>.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                variants={fadeInUp}
              >
                <motion.div whileHover="hover" initial="rest" animate="rest">
                  <motion.div variants={buttonHover}>
                    <Button 
                      className="textera-button-primary text-base px-8 py-6 h-auto group hover:brightness-110 transition-all" // Added hover brightness
                      onClick={() => handleOpenAuthModal('signup')}
                    >
                      Start Selling Your Ideas Today (Risk-Free)
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
                        See How It Works
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
              style={{ scale: scaleHero, opacity: opacityHero }} // Corrected variable names
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
                Stop Bleeding Money
              </Badge>
            </motion.div>
            <motion.h2 
              className="text-4xl md:text-5xl font-display font-medium mb-6"
              variants={fadeInUp}
            >
              Your Messy Notes Are Costing You Sales. <span className="text-accent-primary">Fix It In Minutes.</span>
            </motion.h2>
            <motion.p 
              className="text-lg md:text-xl text-ink-light max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Every scattered thought, voice memo, and random document is a potential income stream. Autopen's AI unlocks it <span className="italic">today</span>, transforming your raw genius into market-ready assets.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Feature descriptions updated for stronger benefits */}
            {[
              {
                icon: <FileText className="h-5 w-5 text-accent-primary" />,
                title: "Brain Dump Technology",
                description: "BEFORE: Ideas trapped in chaos. AFTER: A structured, sellable asset. Upload *anything* – notes, voice memos, docs. Our AI instantly finds the gold and builds your product."
              },
              {
                icon: <Upload className="h-5 w-5 text-accent-primary" />,
                title: "Multiple Import Formats",
                description: "Stop the Re-typing Nightmare. Drag & drop content from *anywhere*. Voice memos, photos of notes, Google Docs, emails – Autopen digests it all effortlessly."
              },
              {
                icon: <Sparkles className="h-5 w-5 text-accent-primary" />,
                title: "AI-Powered Organization",
                description: "From Mind-Clutter to Masterpiece. Forget outlining. Our AI *instantly* structures your raw input into logical chapters readers love. You look like a genius, effortlessly."
              },
              {
                icon: <BookOpen className="h-5 w-5 text-accent-primary" />,
                title: "Instant Digital Products",
                description: "Idea to Income: Faster Than Coffee. Stop procrastinating. Autopen builds your ebook, guide, or course in minutes, not months. Launch *this afternoon*."
              },
              {
                icon: <Palette className="h-5 w-5 text-accent-primary" />,
                title: "Ready-to-Sell Templates",
                description: "Look Pro, Instantly. No design skills? No problem. Your content flows into stunning, proven templates. Ready for Amazon, Gumroad, your website – anywhere."
              },
              {
                icon: <Download className="h-5 w-5 text-accent-primary" />,
                title: "Export Flexibility",
                description: "Sell Everywhere, Immediately. One-click exports your finished product to PDF, EPUB, MOBI. Reach readers on Kindle, Apple Books & more. Start earning *now*."
              }
            ].map((feature, index) => (
              <motion.div 
                key={index} 
                className="textera-card p-8 md:p-10 flex flex-col h-full border border-accent-tertiary/10 hover:border-accent-primary/20 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                variants={fadeInUp}
                whileHover="hover"
                initial="rest"
              >
                {/* Subtle background gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full -mr-16 -mt-16 blur-xl"></div>
                
                <motion.div variants={cardHover} className="h-full flex flex-col relative z-10">
                  <div className="bg-gradient-to-br from-accent-primary/15 to-accent-primary/5 w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <motion.div
                      className="text-accent-primary"
                      animate={{ rotate: [0, 5, 0, -5, 0] }}
                      transition={{ 
                        duration: 6, 
                        repeat: Infinity,
                        delay: index * 0.5
                      }}
                    >
                      {React.cloneElement(feature.icon, { className: "h-7 w-7" })}
                    </motion.div>
                  </div>
                  <h3 className="text-2xl font-display font-medium text-ink-dark mb-4">{feature.title}</h3>
                  <p className="text-ink-light leading-relaxed text-base flex-grow">{feature.description}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }} // Slight delay after cards
          >
            <Button 
              className="textera-button-primary text-base px-8 py-4 h-auto hover:brightness-110 transition-all" // Added hover brightness
              onClick={() => handleOpenAuthModal('signup')}
            >
              Monetize Your Knowledge Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
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
          {/* Background animations */}
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
                The Autopen Method
              </Badge>
            </motion.div>
            <motion.h2 
              className="text-4xl font-display font-medium mb-6"
              variants={fadeInUp}
            >
              Launch Your Digital Product <span className="text-accent-primary">By Tomorrow</span>
            </motion.h2>
            <motion.p 
              className="text-lg text-ink-light"
              variants={fadeInUp}
            >
              Stop the analysis paralysis. This is the fastest path from scattered genius to paid expert. No more waiting, no more frustration.
            </motion.p>
          </motion.div>
          
          {/* Increased spacing between steps */}
          <div className="space-y-32"> 
            {/* Step 1 */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center" // Increased gap
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }} // Trigger when 30% is visible
              variants={staggerContainer} 
            >
              <motion.div 
                className="order-2 lg:order-1"
                variants={slideInFromLeft}
              >
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-sm font-medium mb-6">
                  Step 1: Upload Chaos
                </div>
                <h3 className="text-3xl font-display mb-4">Dump Your Brain, Not Your Dreams</h3>
                <p className="text-lg text-ink-light mb-6">
                  Feed Autopen the mess: your voice notes, half-finished docs, napkin sketches, random ideas. Our AI instantly sifts through the chaos, finding the profitable structure you couldn't see. Stop staring at the clutter.
                </p>
                <motion.ul 
                  className="space-y-3"
                  variants={staggerContainer} 
                  initial="hidden"
                  whileInView="visible" 
                  viewport={{ once: true, amount: 0.5 }} // Ensure list is mostly visible before animating
                >
                  {["Import text, audio, images", "AI finds patterns & themes", "Instant structure outline"].map((item, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-start"
                      variants={fadeInUp} // Keep simple fade-up for list items
                    >
                      <motion.div 
                        variants={checkIconPopIn} 
                        transition={{ delay: i * 0.1 + 0.3 }} // Stagger check icons slightly later
                        className="mr-3 flex-shrink-0 mt-0.5"
                      >
                        <Check className="h-5 w-5 text-accent-primary" />
                      </motion.div>
                      <span className="text-ink-light">{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
              
              <motion.div 
                className="order-1 lg:order-2 relative"
                variants={slideInFromRight}
              >
                {/* Replace ParallaxImage with custom animation */}
                <ContentImportAnimation />
                
                {/* Keep the small decorative element */}
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
                      <p className="text-xs text-ink-light">Any format, instantly organized</p> 
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center" // Increased gap
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer}
            >
              <motion.div 
                className="relative order-1 lg:order-1" // Image first on step 2
                variants={slideInFromLeft}
              >
                {/* Replace ParallaxImage with custom animation */}
                <AiStructureAnimation />
                
                {/* Keep the small decorative element */}
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
                      <p className="text-xs text-ink-light">Instant professional design</p> 
                    </div>
                  </div>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="order-2 lg:order-2" // Text second on step 2
                variants={slideInFromRight}
              >
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-sm font-medium mb-6">
                  Step 2: AI Structures & Formats
                </div>
                <h3 className="text-3xl font-display mb-4">AI Does the Heavy Lifting</h3>
                <p className="text-lg text-ink-light mb-6">
                  Watch your jumbled thoughts morph into a polished digital product. Autopen automatically crafts chapters, refines flow, and applies stunning formatting. Your expertise, instantly professionalized and ready to command premium prices.
                </p>
                <motion.ul 
                  className="space-y-3"
                  variants={staggerContainer} 
                  initial="hidden"
                  whileInView="visible" 
                  viewport={{ once: true, amount: 0.5 }} 
                >
                  {["Creates chapters & sections", "Refines content flow", "Applies premium templates"].map((item, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-start"
                      variants={fadeInUp}
                    >
                      <motion.div 
                        variants={checkIconPopIn} 
                        transition={{ delay: i * 0.1 + 0.3 }} 
                        className="mr-3 flex-shrink-0 mt-0.5"
                      >
                        <Check className="h-5 w-5 text-accent-primary" />
                      </motion.div>
                      <span className="text-ink-light">{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center" // Increased gap
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer}
            >
              <motion.div 
                className="order-2 lg:order-1"
                variants={slideInFromLeft}
              >
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-sm font-medium mb-6">
                  Step 3: Export & Earn
                </div>
                <h3 className="text-3xl font-display mb-4">Click. Export. Get Paid.</h3>
                <p className="text-lg text-ink-light mb-6">
                  Generate your ready-to-sell product in any format with one click. While others are still organizing, you're uploading to Amazon, Gumroad, or your website and watching the sales roll in. Stop waiting for 'perfect', start earning <span className="italic">now</span>.
                </p>
                <motion.ul 
                  className="space-y-3"
                  variants={staggerContainer} 
                  initial="hidden"
                  whileInView="visible" 
                  viewport={{ once: true, amount: 0.5 }} 
                >
                  {["PDF, EPUB, MOBI exports", "Ready for Kindle, Apple Books, etc.", "Start selling immediately"].map((item, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-start"
                      variants={fadeInUp}
                    >
                      <motion.div 
                        variants={checkIconPopIn} 
                        transition={{ delay: i * 0.1 + 0.3 }} 
                        className="mr-3 flex-shrink-0 mt-0.5"
                      >
                        <Check className="h-5 w-5 text-accent-primary" />
                      </motion.div>
                      <span className="text-ink-light">{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
              
              <motion.div 
                className="order-1 lg:order-2 relative"
                variants={slideInFromRight}
              >
                {/* Replace ParallaxImage with custom animation */}
                <ExportPublishAnimation />
                
                {/* Keep the small decorative element */}
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
                      <p className="text-xs text-ink-light">One-click export to all formats</p> 
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
                Proof It Works
              </Badge>
            </motion.div>
            <motion.h2 
              className="text-4xl font-display font-medium mb-6"
              variants={fadeInUp}
            >
              Proof: From Scattered Notes to <span className="text-accent-primary">$2,400/Month</span> (And Faster Launches)
            </motion.h2>
            <motion.p 
              className="text-lg text-ink-light"
              variants={fadeInUp}
            >
              Stop doubting. Start selling. See how Autopen unlocked instant income streams for creators just like you, turning their messy ideas into polished, profitable products.
            </motion.p>
          </motion.div>
          
          {/* Testimonials grid remains the same, copy is already strong */}
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
                {/* ... existing testimonial card structure ... */}
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
        {/* Background elements */}
        <div className="absolute bottom-0 right-0 w-full h-full">
          <div className="absolute bottom-0 right-0 opacity-5 w-[800px] h-[800px] bg-accent-primary rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary border-transparent">
              Pricing
            </Badge>
            <h2 className="text-4xl font-display font-medium mb-6">Stop Hoarding Ideas, Start Building Your <span className="text-accent-primary">Income Empire.</span></h2>
            <p className="text-lg text-ink-light">
              How much potential income are you losing <span className="italic">each day</span> your expertise stays disorganized? Stop waiting. Start free or go Pro risk-free.
            </p>
          </div>
          
          {/* Pricing grid structure remains the same */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricePlans.map((plan, index) => (
              <motion.div 
                key={index} 
                className={`textera-card p-8 flex flex-col h-full relative ${
                  plan.highlighted 
                    ? 'border-accent-primary ring-2 ring-accent-primary/20 shadow-blue-sm z-10 scale-105 my-4 md:my-0' 
                    : 'border-accent-tertiary/10'
                }`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp} // Use existing fadeInUp
                transition={{ delay: index * 0.1 }} // Use delay directly
              >
                {/* ... existing pricing card structure ... */}
                {plan.highlighted && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-accent-primary text-white px-3 py-1">Most Popular</Badge>
                  </div>
                )}
                
                {plan.highlighted && (
                  <motion.div 
                    className="absolute inset-0 rounded-xl border-2 border-accent-primary pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Infinity, 
                      repeatType: "loop",
                      ease: "easeInOut" 
                    }}
                  />
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
                      <motion.div 
                        variants={checkIconPopIn} 
                        initial="hidden" 
                        whileInView="visible" 
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 + index * 0.1 }} // Add staggered delay
                        className="mr-3 flex-shrink-0 mt-0.5"
                      >
                        <Check className="h-5 w-5 text-accent-primary" />
                      </motion.div>
                      <span className="text-ink-light">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto">
                  <Button 
                    className={`w-full py-6 h-auto hover:brightness-110 transition-all ${plan.highlighted ? "textera-button-primary" : "textera-button-secondary"}`} // Added hover brightness
                    onClick={() => handleOpenAuthModal('signup')}
                  >
                    {/* Button text already uses strong CTAs */}
                    {index === 0 ? "Start Free (No Credit Card Needed)" : 
                     index === 1 ? "Start Pro Trial (14-Day Guarantee)" :
                     "Request Enterprise Demo"}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center text-ink-light">
            <p className="text-sm">
              All plans come with a 14-day money-back guarantee. Love it or pay nothing.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-cream">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary border-transparent">
              Your Questions Answered
            </Badge>
            <h2 className="text-4xl font-display font-medium mb-6">Stop Wondering, Start Publishing</h2>
            <p className="text-lg text-ink-light">
              Get clarity on how Autopen eliminates the bottlenecks stopping you from profiting off your expertise.
            </p>
          </div>
          
          {/* FAQ structure remains the same */}
          <div className="space-y-6">
            {[
              {
                question: "How exactly does the AI organize my random notes?", // Slightly rephrased
                answer: "Our AI analyzes your imported text, audio, or even images of notes for key concepts, topics, and logical connections. It then proposes a coherent chapter and section structure, which you can easily refine. Think of it as an expert editor instantly organizing your thoughts." // More descriptive answer
              },
              {
                question: "Can I really sell these e-books on Amazon KDP?", // More specific question
                answer: "Absolutely. Autopen exports directly to EPUB (for most platforms) and MOBI (specifically for older Kindle devices), plus PDF. These formats are optimized for Amazon KDP, Apple Books, Kobo, and more, ensuring your book looks professional everywhere."
              },
              {
                question: "Is this *really* easy? I'm not tech-savvy.", // Addressing skepticism
                answer: "Yes! If you can drag-and-drop a file, you can use Autopen. We designed it specifically for creators, not coders. The AI handles the complex formatting and structuring behind the scenes."
              },
              {
                question: "What's the limit? Can I write a huge book?", // Clarifying limits
                answer: "Our Pro plan offers unlimited projects and generous import limits suitable for full-length books. The Free plan is great for shorter guides or testing the waters (up to 50k words/project). Enterprise offers unlimited everything."
              },
              {
                question: "Can my assistant or co-author help me?", // Collaboration question
                answer: "Team collaboration features, including simultaneous editing and user permissions, are built into our Enterprise plan, perfect for agencies or author teams."
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
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-secondary/10 rounded-full blur-3xl"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-8">
                <Badge variant="outline" className="mb-6 px-3 py-1 rounded-full bg-accent-primary/20 text-accent-primary border-transparent">
                  The Cost of Waiting
                </Badge>
                <h2 className="text-4xl font-display font-medium mb-6">Stop Losing Money: Your Unstructured Ideas Are Leaking <span className="text-accent-primary">Revenue</span>.</h2>
                <p className="text-lg text-ink-light mb-8">
                  Every hour your expertise stays locked in messy notes, potential customers are buying from someone else. Autopen transforms your knowledge into a professional, sellable product <span className="italic">now</span>. Don't delay your income another minute.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="textera-button-primary text-base px-8 py-6 h-auto hover:brightness-110 transition-all" // Added hover brightness
                    onClick={() => handleOpenAuthModal('signup')}
                  >
                    Start Selling Your Ideas Today (Risk-Free)
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Link to="/features">
                    <Button variant="outline" className="textera-button-secondary text-base px-8 py-6 h-auto">
                      See Proof It Works
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Graphic element replaced with animated Upload icon */}
              <div className="lg:col-span-4 flex justify-center items-center"> 
                <div className="relative w-48 h-48"> {/* Give container dimensions */} 
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2, duration: 1.5 }}
                  >
                    {/* Make pulse slightly more visible and use secondary color */}
                    <div className="w-full h-full bg-accent-secondary/20 rounded-full animate-pulse-slow"></div> 
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center" // Center icon
                    initial={{ scale: 0, opacity: 0, rotate: -30 }}
                    whileInView={{ scale: 1, opacity: 0.5, rotate: 0 }} // Reduced opacity slightly
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.4 }} // Adjusted damping and delay
                  >
                    {/* Using Upload icon for 'getting started'/'publishing' vibe */}
                    <Upload className="w-2/3 h-2/3 text-accent-primary relative z-10" /> 
                  </motion.div>
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
