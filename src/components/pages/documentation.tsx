import React from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info, Lightbulb } from "lucide-react";

export default function Documentation() {
  // .env file format example
  const envExample = `# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenRouter Configuration
VITE_OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key
VITE_OPENROUTER_MODEL=deepseek/deepseek-r1:free
VITE_OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions

# OpenAI Configuration (Alternative to OpenRouter)
VITE_OPENAI_API_KEY=sk-your-openai-api-key
VITE_OPENAI_API_URL=https://api.openai.com/v1/engines/

# Application Configuration
VITE_APP_URL=http://localhost:5173`;

  // Local override example
  const localOverrideExample = `# Override OpenRouter model in local development
VITE_OPENROUTER_MODEL=google/gemini-2.0-flash-001

# Use your own API key for testing
VITE_OPENROUTER_API_KEY=sk-or-v1-your-personal-key`;

  return (
    <DashboardLayout activeTab="Documentation">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display text-ink-dark dark:text-ink-dark mb-4 tracking-tight">
            Documentation
          </h1>
          <p className="text-ink-light dark:text-ink-light/80 font-serif text-lg leading-relaxed max-w-3xl">
            Welcome to the Autopen documentation. This section provides information about application configuration and setup.
          </p>
        </div>

        <Card className="border border-accent-tertiary/20 dark:border-accent-tertiary/30">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl font-display text-ink-dark dark:text-ink-dark">
                Environment Configuration
              </CardTitle>
              <Badge variant="outline" className="text-accent-primary dark:text-accent-primary border-accent-primary/30 dark:border-accent-primary/50">
                Required
              </Badge>
            </div>
            <p className="text-sm text-ink-light dark:text-ink-light/80 font-serif mt-1">
              The application requires proper environment configuration to connect to necessary services.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Information about .env file */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-ink-dark dark:text-ink-dark font-display">
                .env File
              </h3>
              <p className="text-ink-light dark:text-ink-light/80 font-serif">
                Create a <code className="bg-accent-tertiary/10 dark:bg-accent-tertiary/20 px-1.5 py-0.5 rounded text-sm font-mono">.env</code> file in the root of the project with the following configuration:
              </p>
              
              <div className="mt-4">
                <CodeBlock 
                  code={envExample} 
                  language="bash" 
                  showLineNumbers={true}
                  filename=".env" 
                />
              </div>

              <div className="bg-accent-primary/5 dark:bg-accent-primary/10 border border-accent-primary/20 dark:border-accent-primary/30 rounded-md p-4 flex gap-3 mt-4">
                <Info className="h-5 w-5 text-accent-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-ink-dark dark:text-ink-dark mb-1">API Keys Required</h4>
                  <p className="text-sm text-ink-light dark:text-ink-light/80 font-serif">
                    You'll need to obtain API keys from the following services:
                  </p>
                  <ul className="list-disc list-inside text-sm text-ink-light dark:text-ink-light/80 font-serif mt-2 space-y-1">
                    <li>Supabase - <a href="https://supabase.com" className="text-accent-primary hover:underline" target="_blank" rel="noopener noreferrer">https://supabase.com</a></li>
                    <li>OpenRouter - <a href="https://openrouter.ai" className="text-accent-primary hover:underline" target="_blank" rel="noopener noreferrer">https://openrouter.ai</a></li>
                    <li>OpenAI (optional) - <a href="https://platform.openai.com" className="text-accent-primary hover:underline" target="_blank" rel="noopener noreferrer">https://platform.openai.com</a></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Local overrides */}
            <div className="space-y-3 pt-4 border-t border-accent-tertiary/20 dark:border-accent-tertiary/30">
              <h3 className="text-lg font-medium text-ink-dark dark:text-ink-dark font-display flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-accent-yellow" />
                Local Overrides
              </h3>
              <p className="text-ink-light dark:text-ink-light/80 font-serif">
                You can create a <code className="bg-accent-tertiary/10 dark:bg-accent-tertiary/20 px-1.5 py-0.5 rounded text-sm font-mono">.env.local</code> file to override specific environment variables without modifying the main <code className="bg-accent-tertiary/10 dark:bg-accent-tertiary/20 px-1.5 py-0.5 rounded text-sm font-mono">.env</code> file. This is useful for local development or testing.
              </p>

              <div className="mt-4">
                <CodeBlock 
                  code={localOverrideExample} 
                  language="bash" 
                  filename=".env.local" 
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-md p-4 flex gap-3 mt-4">
                <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-1">Important Note</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-serif">
                    The <code className="bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-sm font-mono">.env.local</code> file should be in your <code className="bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-sm font-mono">.gitignore</code> to avoid accidentally committing your personal API keys.
                  </p>
                </div>
              </div>
            </div>

            {/* Environment Variables Reference */}
            <div className="space-y-3 pt-4 border-t border-accent-tertiary/20 dark:border-accent-tertiary/30">
              <h3 className="text-lg font-medium text-ink-dark dark:text-ink-dark font-display">
                Environment Variables Reference
              </h3>
              
              <div className="overflow-hidden rounded-lg border border-accent-tertiary/20 dark:border-accent-tertiary/30 bg-paper dark:bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-accent-tertiary/10 dark:bg-accent-tertiary/20 border-b border-accent-tertiary/20 dark:border-accent-tertiary/30">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-ink-dark dark:text-ink-dark">Variable</th>
                      <th className="px-4 py-3 text-left font-medium text-ink-dark dark:text-ink-dark">Description</th>
                      <th className="px-4 py-3 text-left font-medium text-ink-dark dark:text-ink-dark">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent-tertiary/10 dark:divide-accent-tertiary/20">
                    <tr className="bg-white dark:bg-card hover:bg-accent-tertiary/5 dark:hover:bg-accent-tertiary/10">
                      <td className="px-4 py-3 font-mono text-xs text-ink-dark dark:text-ink-light">VITE_SUPABASE_URL</td>
                      <td className="px-4 py-3 text-ink-light dark:text-ink-light/80 font-serif">Your Supabase project URL</td>
                      <td className="px-4 py-3 text-ink-light dark:text-ink-light/80 font-serif">Yes</td>
                    </tr>
                    <tr className="bg-white dark:bg-card hover:bg-accent-tertiary/5 dark:hover:bg-accent-tertiary/10">
                      <td className="px-4 py-3 font-mono text-xs text-ink-dark dark:text-ink-light">VITE_SUPABASE_ANON_KEY</td>
                      <td className="px-4 py-3 text-ink-light dark:text-ink-light/80 font-serif">Your Supabase anonymous key</td>
                      <td className="px-4 py-3 text-ink-light dark:text-ink-light/80 font-serif">Yes</td>
                    </tr>
                    <tr className="bg-white dark:bg-card hover:bg-accent-tertiary/5 dark:hover:bg-accent-tertiary/10">
                      <td className="px-4 py-3 font-mono text-xs text-ink-dark dark:text-ink-light">VITE_OPENROUTER_API_KEY</td>
                      <td className="px-4 py-3 text-ink-light dark:text-ink-light/80 font-serif">Your OpenRouter API key</td>
                      <td className="px-4 py-3 text-ink-light dark:text-ink-light/80 font-serif">Yes</td>
                    </tr>
                    <tr className="bg-white dark:bg-card hover:bg-accent-tertiary/5 dark:hover:bg-accent-tertiary/10">
                      <td className="px-4 py-3 font-mono text-xs text-ink-dark dark:text-ink-light">VITE_OPENROUTER_MODEL</td>
                      <td className="px-4 py-3 text-ink-light dark:text-ink-light/80 font-serif">The AI model to use for generation</td>
                      <td className="px-4 py-3 text-ink-light dark:text-ink-light/80 font-serif">Yes</td>
                    </tr>
                    <tr className="bg-white dark:bg-card hover:bg-accent-tertiary/5 dark:hover:bg-accent-tertiary/10">
                      <td className="px-4 py-3 font-mono text-xs text-ink-dark dark:text-ink-light">VITE_OPENAI_API_KEY</td>
                      <td className="px-4 py-3 text-ink-light dark:text-ink-light/80 font-serif">OpenAI API key (alternative to OpenRouter)</td>
                      <td className="px-4 py-3 text-ink-light dark:text-ink-light/80 font-serif">No</td>
                    </tr>
                    <tr className="bg-white dark:bg-card hover:bg-accent-tertiary/5 dark:hover:bg-accent-tertiary/10">
                      <td className="px-4 py-3 font-mono text-xs text-ink-dark dark:text-ink-light">VITE_APP_URL</td>
                      <td className="px-4 py-3 text-ink-light dark:text-ink-light/80 font-serif">The application URL for redirects</td>
                      <td className="px-4 py-3 text-ink-light dark:text-ink-light/80 font-serif">No</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 