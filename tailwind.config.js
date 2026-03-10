/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Emerald-based Islamic green
        primary: {
          50:'#ecfdf5', 100:'#d1fae5', 200:'#a7f3d0', 300:'#6ee7b7',
          400:'#34d399', 500:'#10b981', 600:'#059669', 700:'#047857',
          800:'#065f46', 900:'#064e3b', 950:'#022c22',
        },
        // Warm amber/gold
        gold: {
          50:'#fffbeb', 100:'#fef3c7', 200:'#fde68a', 300:'#fcd34d',
          400:'#fbbf24', 500:'#f59e0b', 600:'#d97706', 700:'#b45309',
          800:'#92400e', 900:'#78350f', 950:'#451a03',
        },
        // Neutral stone for text
        stone: {
          50:'#fafaf9', 100:'#f5f5f4', 200:'#e7e5e4', 300:'#d6d3d1',
          400:'#a8a29e', 500:'#78716c', 600:'#57534e', 700:'#44403c',
          800:'#292524', 900:'#1c1917', 950:'#0c0a09',
        },
        surface: {
          DEFAULT: '#FAFAF8',
          dark: '#0f1f17',
          card: '#FFFFFF',
          'card-dark': '#132b1e',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        arabic: ['"Noto Naskh Arabic"', 'serif'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.07), 0 2px 12px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(5,150,105,0.12)',
        emerald: '0 4px 16px rgba(5,150,105,0.25)',
        gold: '0 4px 16px rgba(217,119,6,0.25)',
      },
      borderRadius: {
        xl: '12px', '2xl': '16px', '3xl': '20px',
      },
    },
  },
  plugins: [],
}
