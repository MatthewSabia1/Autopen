import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { PenTool, Star, Check, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import AuthModal from "../auth/AuthModal";

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

export default function Home() {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'signup'>('signup');

  const handleOpenAuthModal = (view: 'login' | 'signup') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  // Sample testimonials
  const testimonials: Testimonial[] = [
    {
      name: "Sarah Johnson",
      role: "Author",
      comment: "Autopen transformed my disorganized notes into a beautiful e-book in just a few days. The AI-powered formatting saved me countless hours.",
      avatar: "SJ",
    },
    {
      name: "Michael Chen",
      role: "Content Creator",
      comment: "I've tried many e-book tools, but Autopen's AI capabilities and intuitive interface are unmatched. It's revolutionized my publishing workflow.",
      avatar: "MC",
    },
    {
      name: "Aisha Patel",
      role: "Self-Publisher",
      comment: "The brain dump feature is incredible. I just uploaded my content and Autopen organized everything into a coherent structure.",
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

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="navbar-logo">
              <PenTool className="h-6 w-6 text-accent-primary" />
              <span>Autopen</span>
            </Link>
            <div className="navbar-links">
              <Link to="/" className="navbar-link-active">Home</Link>
              <Link to="/features" className="navbar-link">Features</Link>
              <Link to="/pricing" className="navbar-link">Pricing</Link>
              <Link to="/about" className="navbar-link">About</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button className="textera-button-primary">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="textera-button-secondary"
                  onClick={() => handleOpenAuthModal('login')}
                >
                  Sign In
                </Button>
                <Button 
                  className="textera-button-primary"
                  onClick={() => handleOpenAuthModal('signup')}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-display font-medium leading-tight">
              Transform <span className="text-accent-primary">your</span><br />
              <span className="text-accent-primary">ideas</span> into<br />
              beautiful e-books
            </h1>
            <p className="text-lg md:text-xl">
              Autopen uses AI to help you format, create, style, and publish professional e-books from your unorganized content.
            </p>
            <div className="flex gap-4 pt-4">
              <Button 
                className="textera-button-primary"
                onClick={() => handleOpenAuthModal('signup')}
              >
                Get Started
              </Button>
              <Link to="/features">
                <Button variant="outline" className="textera-button-secondary">How It Works</Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://t4.ftcdn.net/jpg/05/54/92/73/360_F_554927304_Wyj2dPjl3eK1UBIRmHQTQFE9uQYDEitt.jpg" 
              alt="Open book with lights" 
              className="rounded-lg shadow-medium object-cover w-full"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-paper">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="textera-section-title text-3xl mb-4">How It Works</h2>
            <p className="text-ink-light max-w-2xl mx-auto">
              Our AI-powered platform makes it easy to create professional e-books in three simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brain Dump Feature */}
            <div className="textera-card p-6">
              <div className="w-12 h-12 bg-accent-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-display text-accent-primary">T</span>
              </div>
              <h3 className="text-xl font-display mb-2">Brain Dump</h3>
              <p className="text-ink-light">
                Upload documents, paste text, or link content. Our AI will analyze and organize it into structured e-book concepts.
              </p>
            </div>

            {/* Formatting Feature */}
            <div className="textera-card p-6">
              <div className="w-12 h-12 bg-accent-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-accent-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 18H17M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 7V14M9 11L12 14L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-display mb-2">Formatting</h3>
              <p className="text-ink-light">
                Automatically format and style your content with beautiful typography and professional layouts.
              </p>
            </div>

            {/* Publishing Feature */}
            <div className="textera-card p-6">
              <div className="w-12 h-12 bg-accent-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-accent-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12V19M12 19L9 16M12 19L15 16M5 5V8H19V5H5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 8C5 8 5 9.46252 5 12.7312C5 16 5 16 5 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 8C19 8 19 9.46252 19 12.7312C19 16 19 16 19 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-display mb-2">Publishing</h3>
              <p className="text-ink-light">
                Export your finished e-book in multiple formats ready for publishing platforms and digital distribution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="textera-section-title text-3xl mb-4">What Our Users Say</h2>
            <p className="text-ink-light max-w-2xl mx-auto">
              Join thousands of writers and publishers who use Autopen to create beautiful e-books.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="textera-card p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarFallback className="bg-accent-primary/10 text-accent-primary">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-display text-ink-dark">{testimonial.name}</h4>
                    <p className="text-sm text-ink-light">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-accent-secondary fill-accent-secondary" />
                  ))}
                </div>
                <p className="text-ink-light italic">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-paper">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="textera-section-title text-3xl mb-4">Simple Pricing</h2>
            <p className="text-ink-light max-w-2xl mx-auto">
              Choose the plan that's right for you. All plans include access to our core AI features.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricePlans.map((plan, index) => (
              <div 
                key={index} 
                className={`textera-card p-6 flex flex-col h-full ${plan.highlighted ? 'border-accent-primary ring-2 ring-accent-primary/20' : ''}`}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-display mb-1">{plan.name}</h3>
                  <div className="flex items-end mb-2">
                    <span className="text-3xl font-display font-medium">{plan.price}</span>
                    <span className="text-ink-light ml-1">/{plan.period}</span>
                  </div>
                  <p className="text-ink-light">{plan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-6 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-accent-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-ink-light">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto">
                  <Link to={index === 0 ? "/signup" : "/pricing"}>
                    <Button 
                      className={plan.highlighted ? "textera-button-primary w-full" : "textera-button-secondary w-full"}
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="textera-card p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="md:w-2/3 relative z-10">
              <h2 className="text-3xl font-display mb-4">Ready to transform your content?</h2>
              <p className="text-ink-light mb-6">
                Join thousands of writers and publishers who use Autopen to create beautiful e-books. Get started for free today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="textera-button-primary"
                  onClick={() => handleOpenAuthModal('signup')}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Link to="/features">
                  <Button variant="outline" className="textera-button-secondary">Learn More</Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/3 flex justify-center relative z-10">
              <PenTool className="h-32 w-32 text-accent-primary/20" />
            </div>
            <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-accent-primary/5 rounded-full blur-2xl"></div>
            <div className="absolute -left-10 -top-10 h-40 w-40 bg-accent-secondary/5 rounded-full blur-xl"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-paper border-t border-accent-tertiary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center mb-4">
                <PenTool className="h-5 w-5 text-accent-primary mr-2" />
                <span className="font-display text-lg">Autopen</span>
              </Link>
              <p className="text-ink-light mb-4 text-sm">
                Transform your ideas into beautiful professional e-books with our AI-powered platform.
              </p>
              <div className="flex space-x-4">
                <Badge variant="outline" className="bg-transparent border-accent-tertiary/20 text-ink-light">
                  © {new Date().getFullYear()} Autopen
                </Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-display text-base mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/features" className="text-ink-light hover:text-accent-primary">Features</Link></li>
                <li><Link to="/pricing" className="text-ink-light hover:text-accent-primary">Pricing</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary">Templates</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary">Examples</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-display text-base mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-ink-light hover:text-accent-primary">Documentation</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary">Tutorials</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary">Blog</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-display text-base mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="text-ink-light hover:text-accent-primary">About</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary">Contact</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary">Privacy</Link></li>
                <li><Link to="/" className="text-ink-light hover:text-accent-primary">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8 bg-accent-tertiary/10" />
          
          <div className="text-center text-sm text-ink-light">
            <p>Designed with care. Powered by AI.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView={authModalView}
      />

    </div>
  );
}
