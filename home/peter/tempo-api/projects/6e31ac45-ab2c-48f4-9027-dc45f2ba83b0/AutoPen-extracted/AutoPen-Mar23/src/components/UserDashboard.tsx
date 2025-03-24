import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Clock, PenTool, BookText, Settings, Zap, Award, ArrowRight, ChevronRight, CloudLightning as Lightning, FileText, Layers, Crown, Wand2, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useBrainDump } from '../hooks/useBrainDump';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { brainDumps, loading: brainDumpsLoading, fetchBrainDumps } = useBrainDump();
  const navigate = useNavigate();
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  
  // Fetch brain dumps on component mount
  useEffect(() => {
    fetchBrainDumps();
  }, [fetchBrainDumps]);
  
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

  // Helper function to navigate
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  if (!user) return null;
  
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 dark:bg-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="font-display text-3xl text-ink-dark dark:text-gray-100 mb-2">
            Welcome{profile?.username ? `, ${profile.username}` : ' Back'}!
          </h2>
          <p className="font-serif text-ink-light dark:text-gray-400">Continue working on your e-book products</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <button 
            onClick={() => handleNavigate('/settings')}
            className="px-5 py-2 font-serif text-accent-primary border border-accent-primary/30 dark:border-accent-primary/50 rounded flex items-center hover:bg-accent-primary/5 dark:hover:bg-accent-primary/10 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
          <button 
            onClick={() => handleNavigate('/brain-dump')}
            className="px-5 py-2 font-serif bg-accent-primary text-white rounded flex items-center hover:bg-accent-primary/90 transition-colors"
          >
            <PenTool className="w-4 h-4 mr-2" />
            New Brain Dump
          </button>
        </div>
      </div>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-paper dark:bg-gray-800 p-4 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-sm flex items-center">
          <div className="w-10 h-10 bg-accent-secondary/10 dark:bg-accent-secondary/20 rounded-full flex items-center justify-center mr-3">
            <Award className="w-5 h-5 text-accent-secondary" />
          </div>
          <div>
            <p className="text-ink-light dark:text-gray-400 text-sm font-serif">Completed Products</p>
            <p className="text-ink-dark dark:text-gray-100 text-xl font-display">{dashboardStats.completedProducts}</p>
          </div>
        </div>
        
        <div className="bg-paper dark:bg-gray-800 p-4 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-sm flex items-center">
          <div className="w-10 h-10 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center mr-3">
            <BookText className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <p className="text-ink-light dark:text-gray-400 text-sm font-serif">Draft Products</p>
            <p className="text-ink-dark dark:text-gray-100 text-xl font-display">{dashboardStats.draftProducts}</p>
          </div>
        </div>
        
        <div className="bg-paper dark:bg-gray-800 p-4 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-sm flex items-center">
          <div className="w-10 h-10 bg-accent-tertiary/20 dark:bg-accent-tertiary/30 rounded-full flex items-center justify-center mr-3">
            <FileText className="w-5 h-5 text-accent-tertiary" />
          </div>
          <div>
            <p className="text-ink-light dark:text-gray-400 text-sm font-serif">Words Written</p>
            <p className="text-ink-dark dark:text-gray-100 text-xl font-display">{dashboardStats.wordsWritten.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Left column - Now starting with Quick Actions followed by Recent Products */}
        <div className="lg:col-span-2">
          {/* Quick Actions - Now first */}
          <div className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Zap className="w-5 h-5 text-accent-secondary mr-2" />
              <h3 className="font-display text-xl text-ink-dark dark:text-gray-100">Quick Actions</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => handleNavigate('/brain-dump')}
                className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 hover:shadow-sm transition-shadow flex items-start group"
              >
                <div className="w-8 h-8 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-primary/20 dark:group-hover:bg-accent-primary/30 transition-colors">
                  <PenTool className="w-4 h-4 text-accent-primary" />
                </div>
                <div className="text-left">
                  <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100 group-hover:text-accent-primary transition-colors">Brain Dump</h4>
                  <p className="font-serif text-xs text-ink-light dark:text-gray-400 mt-1">
                    Transform your ideas into organized content
                  </p>
                </div>
              </button>
              
              <button 
                onClick={() => handleNavigate('/creator')}
                className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 hover:shadow-sm transition-shadow flex items-start group"
              >
                <div className="w-8 h-8 bg-accent-secondary/10 dark:bg-accent-secondary/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-secondary/20 dark:group-hover:bg-accent-secondary/30 transition-colors">
                  <Wand2 className="w-4 h-4 text-accent-secondary" />
                </div>
                <div className="text-left">
                  <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100 group-hover:text-accent-secondary transition-colors">AI Creator</h4>
                  <p className="font-serif text-xs text-ink-light dark:text-gray-400 mt-1">
                    Generate complete content with AI
                  </p>
                </div>
              </button>
              
              <button 
                onClick={() => handleNavigate('/products')}
                className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 hover:shadow-sm transition-shadow flex items-start group"
              >
                <div className="w-8 h-8 bg-accent-tertiary/20 dark:bg-accent-tertiary/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-tertiary/30 dark:group-hover:bg-accent-tertiary/40 transition-colors">
                  <BookText className="w-4 h-4 text-accent-tertiary" />
                </div>
                <div className="text-left">
                  <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100 group-hover:text-accent-tertiary transition-colors">All Products</h4>
                  <p className="font-serif text-xs text-ink-light dark:text-gray-400 mt-1">
                    View and manage all your e-books
                  </p>
                </div>
              </button>
              
              <button 
                onClick={() => handleNavigate('/settings')}
                className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 hover:shadow-sm transition-shadow flex items-start group"
              >
                <div className="w-8 h-8 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-accent-primary/20 dark:group-hover:bg-accent-primary/30 transition-colors">
                  <Settings className="w-4 h-4 text-accent-primary" />
                </div>
                <div className="text-left">
                  <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100 group-hover:text-accent-primary transition-colors">Settings</h4>
                  <p className="font-serif text-xs text-ink-light dark:text-gray-400 mt-1">
                    Customize your account preferences
                  </p>
                </div>
              </button>
            </div>
          </div>
          
          {/* Recent Products - Now second */}
          <div className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-sm p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-accent-primary mr-2" />
                <h3 className="font-display text-xl text-ink-dark dark:text-gray-100">Recent Products</h3>
              </div>
              <button 
                onClick={() => handleNavigate('/products')}
                className="text-accent-primary dark:text-gray-100 text-sm font-serif flex items-center hover:underline"
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
                    className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleNavigate(`/products/${product.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100">{product.title}</h4>
                        <div className="flex items-center mt-1">
                          <span className="text-xs font-serif bg-accent-secondary/10 dark:bg-accent-secondary/20 text-accent-secondary dark:text-gray-400 px-2 py-0.5 rounded mr-2">
                            {product.category}
                          </span>
                          <span className="text-xs font-serif text-ink-faded dark:text-gray-500">
                            Updated {product.date}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-accent-tertiary dark:text-gray-400" />
                    </div>
                    <div className="w-full bg-cream dark:bg-gray-700 rounded-full h-2 mt-3 mb-2">
                      <div 
                        className="bg-accent-primary dark:bg-gray-200 h-2 rounded-full" 
                        style={{ width: `${product.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs font-serif">
                      <span className="text-ink-light dark:text-gray-400">Progress</span>
                      <span className="text-accent-primary dark:text-gray-200">{product.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-accent-tertiary/40 dark:text-gray-400 mx-auto mb-3" />
                <p className="font-serif text-ink-light dark:text-gray-400 mb-4">You haven't created any products yet</p>
                <button 
                  onClick={() => handleNavigate('/products')}
                  className="px-4 py-2 font-serif text-sm bg-accent-primary dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-accent-primary/90 dark:hover:bg-gray-300 transition-colors"
                >
                  Create Your First Product
                </button>
              </div>
            )}
            
            {recentProducts.length > 0 && (
              <div className="mt-5 pt-5 border-t border-accent-tertiary/20 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => handleNavigate('/creator')}
                    className="flex-1 px-3 py-1.5 text-xs font-serif bg-accent-secondary dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-accent-secondary/90 dark:hover:bg-gray-300 transition-colors flex items-center justify-center"
                  >
                    <Wand2 className="w-3 h-3 mr-1.5" />
                    New AI Content
                  </button>
                  <button 
                    onClick={() => handleNavigate('/products')}
                    className="flex-1 px-3 py-1.5 text-xs font-serif bg-accent-primary/10 dark:bg-gray-700 text-accent-primary dark:text-gray-200 rounded hover:bg-accent-primary/20 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3 mr-1.5" />
                    New Product
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Recent Brain Dumps */}
          <div className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-sm p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Brain className="w-5 h-5 text-accent-secondary mr-2" />
                <h3 className="font-display text-xl text-ink-dark dark:text-gray-100">Recent Brain Dumps</h3>
              </div>
              <button 
                onClick={() => handleNavigate('/brain-dumps')}
                className="text-accent-primary dark:text-gray-100 text-sm font-serif flex items-center hover:underline"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            {brainDumpsLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full"></div>
              </div>
            ) : brainDumps.length > 0 ? (
              <div className="space-y-4">
                {brainDumps.slice(0, 3).map(dump => {
                  // Try to parse the content to get the summary
                  let summary = '';
                  try {
                    if (dump.content) {
                      const parsedContent = JSON.parse(dump.content);
                      summary = parsedContent.summary || '';
                    }
                  } catch (e) {
                    console.error('Error parsing brain dump content:', e);
                  }
                  
                  // Format date
                  const formattedDate = new Date(dump.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  
                  return (
                    <div 
                      key={dump.id} 
                      className="p-4 border border-accent-tertiary/20 dark:border-gray-700 rounded-md hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleNavigate(`/brain-dump/${dump.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100">{dump.title}</h4>
                          <div className="flex items-center mt-1">
                            <span className="text-xs font-serif text-ink-faded dark:text-gray-500">
                              Created {formattedDate}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-accent-tertiary dark:text-gray-400" />
                      </div>
                      {summary && (
                        <p className="mt-3 font-serif text-sm text-ink-light dark:text-gray-400 line-clamp-2">
                          {summary}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-accent-tertiary/40 dark:text-gray-400 mx-auto mb-3" />
                <p className="font-serif text-ink-light dark:text-gray-400 mb-4">You haven't created any brain dumps yet</p>
                <button 
                  onClick={() => handleNavigate('/brain-dump')}
                  className="px-4 py-2 font-serif text-sm bg-accent-primary dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-accent-primary/90 dark:hover:bg-gray-300 transition-colors"
                >
                  Create Your First Brain Dump
                </button>
              </div>
            )}
            
            {brainDumps.length > 0 && (
              <div className="mt-5 pt-5 border-t border-accent-tertiary/20 dark:border-gray-700">
                <button 
                  onClick={() => handleNavigate('/brain-dump')}
                  className="w-full px-3 py-2 text-sm font-serif bg-accent-secondary/10 dark:bg-accent-secondary/20 text-accent-secondary dark:text-accent-secondary/90 border border-accent-secondary/20 dark:border-accent-secondary/30 rounded hover:bg-accent-secondary/20 dark:hover:bg-accent-secondary/30 transition-colors flex items-center justify-center"
                >
                  <Brain className="w-4 h-4 mr-1.5" />
                  New Brain Dump
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Right sidebar column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Product Templates */}
          <div className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Layers className="w-5 h-5 text-accent-secondary mr-2" />
              <h3 className="font-display text-xl text-ink-dark dark:text-gray-100">Product Templates</h3>
            </div>
            
            <div className="space-y-3">
              {templates.map(template => (
                <div 
                  key={template.id}
                  className={`p-4 border ${activeTemplate === template.id ? 'border-accent-primary bg-accent-primary/5' : 'border-accent-tertiary/20 dark:border-gray-700'} rounded-md cursor-pointer transition-all`}
                  onClick={() => setActiveTemplate(activeTemplate === template.id ? null : template.id)}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-serif font-semibold text-ink-dark dark:text-gray-100">{template.name}</h4>
                    <ChevronRight className={`w-4 h-4 text-accent-primary dark:text-gray-200 transition-transform ${activeTemplate === template.id ? 'rotate-90' : ''}`} />
                  </div>
                  
                  <p className="font-serif text-xs text-ink-light dark:text-gray-400 mt-1 mb-2">
                    {template.description}
                  </p>
                  
                  {activeTemplate === template.id && (
                    <div className="mt-3 pt-3 border-t border-accent-tertiary/20 dark:border-gray-700">
                      <ul className="space-y-1 mb-3">
                        {template.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start text-xs font-serif text-ink-light dark:text-gray-400">
                            <div className="w-3 h-3 rounded-full border border-white dark:border-gray-700 flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">
                              <div className="w-1.5 h-1.5 bg-white dark:bg-gray-700 rounded-full"></div>
                            </div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleNavigate('/creator')}
                          className="flex-1 px-3 py-1.5 text-xs font-serif bg-accent-secondary dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-accent-secondary/90 dark:hover:bg-gray-300 transition-colors flex items-center justify-center"
                        >
                          <Wand2 className="w-3 h-3 mr-1.5" />
                          AI Create
                        </button>
                        <button
                          onClick={() => handleNavigate('/products')}
                          className="flex-1 px-3 py-1.5 text-xs font-serif bg-accent-primary/10 dark:bg-gray-700 text-accent-primary dark:text-gray-200 rounded hover:bg-accent-primary/20 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
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
          <div className="bg-paper dark:bg-gray-800 rounded-lg border border-accent-tertiary/20 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Lightning className="w-5 h-5 text-accent-primary mr-2" />
              <h3 className="font-display text-xl text-ink-dark dark:text-gray-100">Writing Tips</h3>
            </div>
            
            <div className="space-y-3">
              {writingTips.map((tip, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-6 h-6 bg-accent-primary/10 dark:bg-accent-primary/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-accent-primary dark:text-gray-200 font-serif text-xs font-semibold">
                    {index + 1}
                  </div>
                  <p className="font-serif text-sm text-ink-light dark:text-gray-400">{tip}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-accent-tertiary/20 dark:border-gray-700">
              <button className="w-full text-accent-primary dark:text-gray-200 text-sm font-serif flex items-center justify-center hover:underline">
                View All Tips
                <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
          
          {/* Pro Features Teaser */}
          <div className="bg-gradient-to-r from-accent-primary to-accent-secondary dark:bg-gray-800 rounded-lg shadow-md p-6 text-white dark:text-gray-200">
            <div className="flex items-center mb-3">
              <Crown className="w-5 h-5 mr-2" />
              <h3 className="font-display text-xl">Autopen Pro</h3>
            </div>
            
            <p className="font-serif text-sm mb-4 opacity-90 dark:opacity-80">
              Unlock advanced features to take your e-book creation to the next level.
            </p>
            
            <ul className="space-y-2 mb-4">
              <li className="flex items-center text-sm font-serif">
                <div className="w-4 h-4 rounded-full border border-white dark:border-gray-700 flex items-center justify-center mr-2">
                  <div className="w-2 h-2 bg-white dark:bg-gray-700 rounded-full"></div>
                </div>
                Premium templates and layouts
              </li>
              <li className="flex items-center text-sm font-serif">
                <div className="w-4 h-4 rounded-full border border-white dark:border-gray-700 flex items-center justify-center mr-2">
                  <div className="w-2 h-2 bg-white dark:bg-gray-700 rounded-full"></div>
                </div>
                Advanced AI writing assistance
              </li>
              <li className="flex items-center text-sm font-serif">
                <div className="w-4 h-4 rounded-full border border-white dark:border-gray-700 flex items-center justify-center mr-2">
                  <div className="w-2 h-2 bg-white dark:bg-gray-700 rounded-full"></div>
                </div>
                Export to multiple formats
              </li>
            </ul>
            
            <button 
              className="w-full py-2 bg-white dark:bg-gray-200 text-accent-primary dark:text-gray-900 font-serif rounded hover:bg-opacity-90 dark:hover:bg-opacity-80 transition-colors text-sm"
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