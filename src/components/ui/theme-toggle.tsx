import React from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  align?: 'horizontal' | 'vertical';
}

export function ThemeToggle({
  className,
  iconClassName,
  variant = 'default',
  showLabel = false,
  size = 'md',
  align = 'horizontal',
}: ThemeToggleProps) {
  const { theme, isDarkMode, setTheme } = useTheme();
  
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  const buttonSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };
  
  const labels = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  };
  
  // Cycle through themes: light -> dark -> system -> light
  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };
  
  // Get the current icon based on theme
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;
  
  const variantClasses = {
    default: 'theme-toggle',
    outline: 'theme-toggle border border-accent-tertiary dark:border-accent-tertiary/60',
    ghost: 'hover:bg-transparent hover:text-accent-primary dark:hover:text-accent-primary',
  };
  
  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        variantClasses[variant],
        buttonSizes[size],
        align === 'vertical' && showLabel ? 'flex flex-col items-center gap-1' : 'flex items-center gap-2',
        className
      )}
      aria-label={`Change theme: current theme is ${theme}`}
    >
      <Icon className={cn(iconSizes[size], 'transition-transform', iconClassName)} />
      {showLabel && (
        <span className="text-sm font-medium">
          {labels[theme]}
        </span>
      )}
    </button>
  );
}

/**
 * More complex theme toggle that offers all three options as a dropdown
 */
export function ThemeToggleDropdown({
  className,
}: {
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className={cn('relative group', className)}>
      <ThemeToggle variant="outline" />
      
      <div className="absolute right-0 mt-2 w-40 bg-paper dark:bg-card rounded shadow-lg z-10 border border-accent-tertiary/20 dark:border-accent-tertiary/40 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 scale-95 group-hover:scale-100 transform origin-top-right">
        <div className="py-1">
          <button
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light dark:text-ink-light hover:bg-accent-tertiary/20 dark:hover:bg-accent-tertiary/20 text-left',
              theme === 'light' && 'text-accent-primary dark:text-accent-primary bg-accent-tertiary/10 dark:bg-accent-tertiary/20'
            )}
          >
            <Sun className="w-4 h-4 mr-2" />
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light dark:text-ink-light hover:bg-accent-tertiary/20 dark:hover:bg-accent-tertiary/20 text-left',
              theme === 'dark' && 'text-accent-primary dark:text-accent-primary bg-accent-tertiary/10 dark:bg-accent-tertiary/20'
            )}
          >
            <Moon className="w-4 h-4 mr-2" />
            Dark
          </button>
          <button
            onClick={() => setTheme('system')}
            className={cn(
              'flex items-center w-full px-4 py-2 text-sm font-serif text-ink-light dark:text-ink-light hover:bg-accent-tertiary/20 dark:hover:bg-accent-tertiary/20 text-left',
              theme === 'system' && 'text-accent-primary dark:text-accent-primary bg-accent-tertiary/10 dark:bg-accent-tertiary/20'
            )}
          >
            <Laptop className="w-4 h-4 mr-2" />
            System
          </button>
        </div>
      </div>
    </div>
  );
}