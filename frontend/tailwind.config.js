/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        normal: '#9CA3AF',
        raro: '#3B82F6',
        epico: '#A855F7',
        lendario: '#F59E0B',
      },
    },
  },
  plugins: [],
}
