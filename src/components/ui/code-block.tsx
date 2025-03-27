import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';
import { Button } from './button';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
  filename?: string;
}

export function CodeBlock({
  code,
  language = 'bash',
  showLineNumbers = false,
  className,
  filename
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={cn(
      "rounded-lg overflow-hidden border bg-paper dark:bg-card border-accent-tertiary/20 dark:border-accent-tertiary/30 shadow-sm dark:shadow-md",
      className
    )}>
      {filename && (
        <div className="bg-accent-tertiary/10 dark:bg-accent-tertiary/20 border-b border-accent-tertiary/20 dark:border-accent-tertiary/30 py-2 px-4 text-sm font-mono text-ink-light dark:text-ink-light/80 flex items-center">
          <span className="flex-1">{filename}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-ink-light hover:text-ink-dark dark:text-ink-light/80 dark:hover:text-ink-dark"
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="ml-1.5 text-xs">{copied ? 'Copied!' : 'Copy'}</span>
          </Button>
        </div>
      )}
      <div className="relative group">
        {!filename && (
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 bg-accent-tertiary/10 dark:bg-accent-tertiary/20 hover:bg-accent-tertiary/20 dark:hover:bg-accent-tertiary/30 text-ink-light dark:text-ink-light/80"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="ml-1.5 text-xs">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
        )}
        <pre className={cn(
          "p-4 text-sm font-mono overflow-x-auto scrollbar-thin scrollbar-thumb-accent-tertiary/20 dark:scrollbar-thumb-accent-tertiary/30 scrollbar-track-transparent",
          showLineNumbers ? "pl-12 relative" : "",
          "text-ink-dark dark:text-ink-light"
        )}>
          {showLineNumbers && (
            <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-end pr-2 pt-4 pb-4 text-ink-light/50 dark:text-ink-light/30 select-none bg-accent-tertiary/5 dark:bg-accent-tertiary/10">
              {code.split('\n').map((_, i) => (
                <div key={i} className="leading-relaxed">
                  {i + 1}
                </div>
              ))}
            </div>
          )}
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    </div>
  );
} 