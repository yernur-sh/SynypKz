/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'from-rose-400','to-pink-500',
    'from-amber-400','to-orange-500',
    'from-emerald-400','to-teal-500',
    'from-sky-400','to-blue-500',
    'from-violet-400','to-purple-500',
    'from-fuchsia-400','to-rose-500',
    'from-lime-400','to-emerald-500',
    'from-cyan-400','to-sky-500',
    'bg-gradient-to-br',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef7ff',
          100: '#d9ecff',
          200: '#bcdfff',
          300: '#8eccff',
          400: '#58afff',
          500: '#2f8fff',
          600: '#1870f5',
          700: '#1259e2',
          800: '#1547b7',
          900: '#163e90',
        },
        kazakh: {
          gold: '#FFC72C',
          sky: '#00AFCA',
          blue: '#0B60B0',
          dark: '#0e2b5c',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
