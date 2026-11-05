module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#1a1d2e', secondary: '#222538', border: 'rgba(255,255,255,0.06)' },
        base: '#0f1117',
        accent: '#22c55e',
      },
      borderRadius: { card: '12px' },
      boxShadow: { card: 'none' },
    }
  },
  plugins: []
}
