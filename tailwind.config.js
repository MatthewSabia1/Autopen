/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";
import scrollbarPlugin from "tailwind-scrollbar";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        md: "2rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Autopen colors based on style guide with HSL support
        cream: "hsl(var(--cream))",
        paper: "hsl(var(--paper))",
        dark: "hsl(var(--dark-bg))",
        gold: "hsl(var(--accent-yellow))",
        ink: {
          dark: "hsl(var(--ink-dark))",
          light: "hsl(var(--ink-light))",
          faded: "hsl(var(--ink-faded))",
        },
        accent: {
          primary: "hsl(var(--accent-primary))",
          secondary: "hsl(var(--accent-secondary))",
          tertiary: "hsl(var(--accent-tertiary))",
          yellow: "hsl(var(--accent-yellow))",
        },
        danger: "hsl(var(--danger))",
        success: "hsl(var(--success))",
        info: "hsl(var(--info))",
        warning: "hsl(var(--warning))",
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        gray: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        display: ["Georgia", "serif"],
        mono: ["Consolas", "Monaco", "monospace"],
      },
      fontSize: {
        // Custom font sizes based on style guide
        "page-title": ["32px", { lineHeight: "1.2", fontWeight: "500" }],
        "section-header": ["20px", { lineHeight: "1.3", fontWeight: "500" }],
        "card-title": ["18px", { lineHeight: "1.3", fontWeight: "500" }],
        "body": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "small": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "button": ["15px", { lineHeight: "1.4", fontWeight: "500" }],
        "label": ["14px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
        DEFAULT: "4px",
      },
      spacing: {
        // Consistent spacing based on style guide
        "base": "0.25rem", // 4px
        "component": "1.5rem", // 24px
        "grid-sm": "1.25rem", // 20px
        "grid-lg": "1.75rem", // 28px
        "section-sm": "2rem", // 32px
        "section-lg": "2.5rem", // 40px
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "fade-out": {
          from: { opacity: 1 },
          to: { opacity: 0 },
        },
        "slide-in": {
          from: { transform: "translateY(20px)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: 0.6 },
          "50%": { opacity: 0.8 },
        },
        "theme-fade": {
          "0%": { opacity: 0.7 },
          "100%": { opacity: 1 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-in-out",
        "fade-out": "fade-out 0.3s ease-in-out",
        "slide-in": "slide-in 0.4s ease-out",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "theme-fade": "theme-fade 0.2s ease-in-out",
      },
      boxShadow: {
        textera: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        "textera-md": "0 2px 5px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
        "textera-lg": "0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)",
        "soft": "0 1px 2px rgba(0, 0, 0, 0.03)",
        "medium": "0 2px 4px rgba(0, 0, 0, 0.05)",
        "hard": "0 4px 8px rgba(0, 0, 0, 0.08)",
        "blue": "0 4px 12px rgba(115, 137, 150, 0.15)",
        "blue-sm": "0 2px 5px rgba(115, 137, 150, 0.1)",
        "yellow": "0 4px 12px rgba(204, 181, 149, 0.15)",
        "yellow-sm": "0 2px 5px rgba(204, 181, 149, 0.1)",
        "dark": "0 4px 12px rgba(0, 0, 0, 0.3)",
        "dark-sm": "0 2px 5px rgba(0, 0, 0, 0.2)",
        "none": "none",
        "glow-sm": "0 0 8px rgba(204, 181, 149, 0.3)",
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    scrollbarPlugin({ nocompatible: true }),
  ],
};
