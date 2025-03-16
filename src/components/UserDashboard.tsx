import React, { useState } from 'react';
import { BookOpen, Plus, Clock, PenTool, BookText, Settings, BarChart2, Zap, Award, ArrowRight, ChevronRight, CloudLightning as Lightning, FileText, BookTemplate, Layers, Crown, Wand2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useNavigation } from '../contexts/NavigationContext';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { navigateTo } = useNavigation();
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  
  // Mock data for recent products
  const recentProducts = [
    { id: 1, title: "Business Leadership Guide", date: "2 days ago", progress: 80, category: "Business" },
    { id: 2, title: "Cooking Techniques", date: "1 week ago", progress: 45, category: "Food" },
    { id: 3, title: "Travel Photography Tips", date: "2 weeks ago", progress: 90, category: "Photography" }
  ];

  // Mock data for dashboard stats
  const dashboardStats = {
    completedProducts: 5,
    draftProducts: 7,
    wordsWritten: 24350
  };

  // Mock writing tips
  const writingTips = [
    "Break your content into logical chapters to improve readability.",
    "Use consistent formatting throughout your e-book for a professional look.",
    "Include engaging visuals to complement your written content.",
    "Start with a compelling introduction that hooks your readers."
  ];

  // Template options with descriptions
  const templates = [
    {
      id: "ebook",
      name: "E-Book",
      description: "Create a structured digital book with chapters and sections",
      features: ["Chapter organization", "Table of contents", "Multiple page layouts", "Footnotes & citations"]
    },
    {
      id: "course",
      name: "Online Course",
      description: "Educational content organized into modules and lessons",
      features: ["Module structure", "Progress tracking", "Quizzes & exercises", "Instructor notes"]
    },
    {
      id: "blog",
      name: "Blog Collection",
      description: "Compile blog posts into a cohesive publication",
      features: ["Post categorization", "Author profiles", "Comment highlights", "Unified styling"]
    },
    {
      id: "memoir",
      name: "Memoir/Biography",
      description: "Tell a personal or historical story with timeline features",
      features: ["Chronological organization", "Personal anecdotes", "Photo galleries", "Timeline view"]
    }
  ];

  if (!user) return null;
  
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="font-display text-3xl text-ink-dark mb-2">
            Welcome{profile?.username ? `, ${profile.username}` : ' Back'}!
          </h2>
          <p className="font-serif text-ink-light">Continue working on your e-book products</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <button 
            onClick={() => navigateTo('settings')}
            className="px-5 py-2 font-serif text-accent-primary border border-accent-primary/30 rounded flex items-center hover:bg-accent-primary/5 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
          <button 
            onClick={() => navigateTo('brainDump')}
            className="px-5 py-2 font-serif bg-accent-primary text-white rounded flex items-center hover:bg-accent-primary/90 transition-colors"
          >
            <PenTool className="w-4 h-4 mr-2" />
            New Brain Dump
          </button>
        </div>
      </div>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-paper p-4 rounded-lg border border-accent-tertiary/20 shadow-sm flex items-center">
          <div className="w-10 h-10 bg-accent-secondary/10 rounded-full flex items-center justify-center mr-3">
            <Award className="w-5 h-5 text-accent-secondary" />
          </div>
          <div>
            <p className="text-ink-light text-sm font-serif">Completed Products</p>
            <p className="text-ink-dark text-xl font-display">{dashboardStats.completedProducts}</p>
          </div>
        </div>
        
        <div className="bg-paper p-4 rounded-lg border border-accent-tertiary/20 shadow-sm flex items-center">
          <div className="w-10 h-10 bg-accent-primary/10 rounded-full flex items-center justify-center mr-3">
            <BookText className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <p className="text-ink-light text-sm font-serif">Draft Products</p>
            <p className="text-ink-dark text-xl font-display">{dashboardStats.draftProducts}</p>
          </div>
        </div>
        
        <div className="bg-paper p-4 rounded-lg border border-accent-tertiary/20 shadow-sm flex items-center">
          <div className="w-10 h-10 bg-accent-tertiary/20 rounded-full flex items-center justify-center mr-3">
            <FileText className="w-5 h-5 text-accent-tertiary" />
          </div>
          <div>
            <p className="text-ink-light text-sm font-serif">Words Written</p>
            <p className="text-ink-dark text-xl font-display">{dashboardStats.wordsWritten.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Left column - Now starting with Quick Actions followed by Recent Products */}
        <div className="lg:col-span-2">
          {/* Quick Actions - Now first */}
          <div className="bg-paper rounded-lg border border-accent-tertiary/20 shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Zap className="w-5 h-5 text-accent-secondary mr-2" />
              <h3 className="font-display text-xl text-ink-dark">Quick Actions</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => navigateTo('brainDump')}
                className="p-4 border border-accent-tertiary/20 rounded-md hover:shadow-sm transition-shadow flex items-start group"
              >
                <div className="w-8 h-8 bg-accent-primary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-primary/20 transition-colors">
                  <PenTool className="w-4 h-4 text-accent-primary" />
                </div>
                <div className="text-left">
                  <h4 className="font-serif font-semibold text-ink-dark group-hover:text-accent-primary transition-colors">Brain Dump</h4>
                  <p className="font-serif text-xs text-ink-light mt-1">
                    Transform your ideas into organized content
                  </p>
                </div>
              </button>
              
              <button 
                onClick={() => navigateTo('creator')}
                className="p-4 border border-accent-tertiary/20 rounded-md hover:shadow-sm transition-shadow flex items-start group"
              >
                <div className="w-8 h-8 bg-accent-secondary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-secondary/20 transition-colors">
                  <Wand2 className="w-4 h-4 text-accent-secondary" />
                </div>
                <div className="text-left">
                  <h4 className="font-serif font-semibold text-ink-dark group-hover:text-accent-secondary transition-colors">AI Creator</h4>
                  <p className="font-serif text-xs text-ink-light mt-1">
                    Generate complete content with AI
                  </p>
                </div>
              </button>
              
              <button 
                onClick={() => navigateTo('projects')}
                className="p-4 border border-accent-tertiary/20 rounded-md hover:shadow-sm transition-shadow flex items-start group"
              >
                <div className="w-8 h-8 bg-accent-tertiary/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-tertiary/30 transition-colors">
                  <BookText className="w-4 h-4 text-accent-tertiary" />
                </div>
                <div className="text-left">
                  <h4 className="font-serif font-semibold text-ink-dark group-hover:text-accent-tertiary transition-colors">All Products</h4>
                  <p className="font-serif text-xs text-ink-light mt-1">
                    View and manage all your e-books
                  </p>
                </div>
              </button>
              
              <button 
                onClick={() => navigateTo('settings')}
                className="p-4 border border-accent-tertiary/20 rounded-md hover:shadow-sm transition-shadow flex items-start group"
              >
                <div className="w-8 h-8 bg-accent-primary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-primary/20 transition-colors">
                  <Settings className="w-4 h-4 text-accent-primary" />
                </div>
                <div className="text-left">
                  <h4 className="font-serif font-semibold text-ink-dark group-hover:text-accent-primary transition-colors">Settings</h4>
                  <p className="font-serif text-xs text-ink-light mt-1">
                    Customize your account preferences
                  </p>
                </div>
              </button>
            </div>
          </div>
          
          {/* Recent Products - Now second */}
          <div className="bg-paper rounded-lg border border-accent-tertiary/20 shadow-sm p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-accent-primary mr-2" />
                <h3 className="font-display text-xl text-ink-dark">Recent Products</h3>
              </div>
              <button 
                onClick={() => navigateTo('projects')}
                className="text-accent-primary text-sm font-serif flex items-center hover:underline"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            {recentProducts.length > 0 ? (
              <div className="space-y-4">
                {recentProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="p-4 border border-accent-tertiary/20 rounded-md hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigateTo('projectDetail')}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-serif font-semibold text-ink-dark">{product.title}</h4>
                        <div className="flex items-center mt-1">
                          <span className="text-xs font-serif bg-accent-secondary/10 text-accent-secondary px-2 py-0.5 rounded mr-2">
                            {product.category}
                          </span>
                          <span className="text-xs font-serif text-ink-faded">
                            Updated {product.date}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-accent-tertiary" />
                    </div>
                    <div className="w-full bg-cream rounded-full h-2 mt-3 mb-2">
                      <div 
                        className="bg-accent-primary h-2 rounded-full" 
                        style={{ width: `${product.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs font-serif">
                      <span className="text-ink-light">Progress</span>
                      <span className="text-accent-primary">{product.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-accent-tertiary/40 mx-auto mb-3" />
                <p className="font-serif text-ink-light mb-4">You haven't created any products yet</p>
                <button 
                  onClick={() => navigateTo('projects')}
                  className="px-4 py-2 font-serif text-sm bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
                >
                  Create Your First Product
                </button>
              </div>
            )}
            
            {recentProducts.length > 0 && (
              <div className="mt-5 pt-5 border-t border-accent-tertiary/20">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => navigateTo('creator')}
                    className="px-4 py-2 flex-1 font-serif bg-accent-secondary text-white rounded hover:bg-accent-secondary/90 transition-colors flex items-center justify-center"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    New AI Content
                  </button>
                  <button 
                    onClick={() => navigateTo('projects')}
                    className="px-4 py-2 flex-1 font-serif bg-accent-primary/10 text-accent-primary rounded hover:bg-accent-primary/20 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Product
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right sidebar column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Product Templates */}
          <div className="bg-paper rounded-lg border border-accent-tertiary/20 shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Layers className="w-5 h-5 text-accent-secondary mr-2" />
              <h3 className="font-display text-xl text-ink-dark">Product Templates</h3>
            </div>
            
            <div className="space-y-3">
              {templates.map(template => (
                <div 
                  key={template.id}
                  className={`p-4 border ${activeTemplate === template.id ? 'border-accent-primary bg-accent-primary/5' : 'border-accent-tertiary/20'} rounded-md cursor-pointer transition-all`}
                  onClick={() => setActiveTemplate(activeTemplate === template.id ? null : template.id)}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-serif font-semibold text-ink-dark">{template.name}</h4>
                    <ChevronRight className={`w-4 h-4 text-accent-primary transition-transform ${activeTemplate === template.id ? 'rotate-90' : ''}`} />
                  </div>
                  
                  <p className="font-serif text-xs text-ink-light mt-1 mb-2">
                    {template.description}
                  </p>
                  
                  {activeTemplate === template.id && (
                    <div className="mt-3 pt-3 border-t border-accent-tertiary/20">
                      <ul className="space-y-1 mb-3">
                        {template.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start text-xs font-serif text-ink-light">
                            <div className="w-3 h-3 bg-accent-secondary/20 rounded-full flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">
                              <div className="w-1.5 h-1.5 bg-accent-secondary rounded-full"></div>
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigateTo('creator')}
                          className="flex-1 px-3 py-1.5 text-xs font-serif bg-accent-secondary text-white rounded hover:bg-accent-secondary/90 transition-colors flex items-center justify-center"
                        >
                          <Wand2 className="w-3 h-3 mr-1.5" />
                          AI Create
                        </button>
                        <button
                          onClick={() => navigateTo('projects')}
                          className="flex-1 px-3 py-1.5 text-xs font-serif bg-accent-primary/10 text-accent-primary rounded hover:bg-accent-primary/20 transition-colors flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3 mr-1.5" />
                          Manual
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Writing Tips */}
          <div className="bg-paper rounded-lg border border-accent-tertiary/20 shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Lightning className="w-5 h-5 text-accent-primary mr-2" />
              <h3 className="font-display text-xl text-ink-dark">Writing Tips</h3>
            </div>
            
            <div className="space-y-3">
              {writingTips.map((tip, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-6 h-6 bg-accent-primary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-accent-primary font-serif text-xs font-semibold">
                    {index + 1}
                  </div>
                  <p className="font-serif text-sm text-ink-light">{tip}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-accent-tertiary/20">
              <button className="w-full text-accent-primary text-sm font-serif flex items-center justify-center hover:underline">
                View All Tips
                <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
          
          {/* Pro Features Teaser */}
          <div className="bg-gradient-to-r from-accent-primary to-accent-secondary rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center mb-3">
              <Crown className="w-5 h-5 mr-2" />
              <h3 className="font-display text-xl">Autopen Pro</h3>
            </div>
            
            <p className="font-serif text-sm mb-4 opacity-90">
              Unlock advanced features to take your e-book creation to the next level.
            </p>
            
            <ul className="space-y-2 mb-4">
              <li className="flex items-center text-sm font-serif">
                <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center mr-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                Premium templates and layouts
              </li>
              <li className="flex items-center text-sm font-serif">
                <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center mr-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                Advanced AI writing assistance
              </li>
              <li className="flex items-center text-sm font-serif">
                <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center mr-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                Export to multiple formats
              </li>
            </ul>
            
            <button 
              className="w-full py-2 bg-white text-accent-primary font-serif rounded hover:bg-opacity-90 transition-colors text-sm"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;