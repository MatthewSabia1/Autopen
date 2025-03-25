/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";

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
        // Autopen colors based on mockups
        cream: "#FAF9F5",  // Light cream background
        paper: "#FFFFFF",  // White background for cards
        ink: {
          dark: "#333333", // Main text color
          light: "#666666", // Secondary text color
          faded: "#888888", // Lighter text for placeholders
        },
        accent: {
          primary: "#738996",    // Primary grayish blue accent
          secondary: "#5e7282",  // Slightly darker blue
          tertiary: "#F1F0EC",   // Light beige/gray for subtle backgrounds and borders
          yellow: "#ccb595",     // Dull yellowish color (secondary accent used sparingly)
        },
        danger: "#DC2626", // For error messages
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
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
        DEFAULT: "4px",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-in-out",
        "fade-out": "fade-out 0.3s ease-in-out",
        "slide-in": "slide-in 0.4s ease-out",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
      },
      boxShadow: {
        textera: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        "textera-md": "0 2px 5px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
        "textera-lg": "0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)",
        soft: "0 1px 2px rgba(0, 0, 0, 0.03)",
        medium: "0 2px 4px rgba(0, 0, 0, 0.05)",
        hard: "0 4px 8px rgba(0, 0, 0, 0.08)",
        blue: "0 4px 12px rgba(115, 137, 150, 0.15)",
        "blue-sm": "0 2px 5px rgba(115, 137, 150, 0.1)",
        yellow: "0 4px 12px rgba(204, 181, 149, 0.15)",
        "yellow-sm": "0 2px 5px rgba(204, 181, 149, 0.1)",
        none: "none"
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
