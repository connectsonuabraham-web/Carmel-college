/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        g9:    '#0b3322',
        g8:    '#124530',
        g6:    '#1f6b47',
        lime:  '#a6e22e',
        lime2: '#d8f58f',
        ink:   '#0f1a14',
        mut:   '#7b857f',
        line:  '#e8ebe8',
        soft:  '#f5f6f4',
        org:   '#f0883e',
        danger:'#d9534f',
      },
      borderRadius: {
        card: '20px',
        pill: '99px',
      },
    }
  },
  plugins: []
}
