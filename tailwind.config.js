/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        display: ['Playfair Display', 'serif'],
      },
      colors: {
        cream: '#FAF7F0',
        paper: '#FFFCF7',
        ink: {
          dark: '#2D2A32',
          light: '#7f7d88',
          faded: '#6D6C74',
        },
        accent: {
          primary: '#6D8A96',
          secondary: '#D1B490',
          tertiary: '#E8C8A9',
        },
        dark: {
          bg: {
            primary: '#0F172A',    // darker than slate-900
            secondary: '#1E293B',  // darker than slate-800
            tertiary: '#334155',   // darker than slate-700
          },
          text: {
            primary: '#F8FAFC',    // lighter than gray-100
            secondary: '#E2E8F0',  // lighter than gray-200
            tertiary: '#CBD5E1',   // lighter than gray-300
            muted: '#94A3B8',      // gray-400
          },
          border: {
            primary: '#475569',    // slate-600
            secondary: '#334155',  // slate-700
          }
        }
      },
    },
  },
  plugins: [],
}