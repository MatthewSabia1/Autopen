/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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
          light: '#4F4E55',
          faded: '#6D6C74',
        },
        accent: {
          primary: '#6D8A96',
          secondary: '#D1B490',
          tertiary: '#E8C8A9',
        }
      },
    },
  },
  plugins: [],
};