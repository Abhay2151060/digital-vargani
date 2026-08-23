/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: '#F97316',
          dark: '#C2410C',
          light: '#FB923C',
        },
        maroon: {
          DEFAULT: '#7C2D12',
          dark: '#451A0B',
        },
        marigold: '#FACC15',
        surface: {
          base: '#FAF9F6',
          card: '#FFFFFF',
          inset: '#F3F1EC',
          border: '#E5E1D8',
        },
        ink: {
          primary: '#292118',
          secondary: '#6B6459',
          disabled: '#A8A297',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-noto-devanagari)', 'var(--font-noto-gujarati)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
