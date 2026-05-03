/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#0072C6',
          green: '#29F49A',
        },
        dark: {
          900: '#050A14',
          800: '#0A1628',
          700: '#0D1F3C',
          600: '#112847',
          500: '#1A3A5C',
          400: '#234875',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0072C6, #29F49A)',
        'brand-gradient-hover': 'linear-gradient(135deg, #0060A8, #20D482)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0, 114, 198, 0.4)',
        'glow-green': '0 0 20px rgba(41, 244, 154, 0.4)',
        'glow-brand': '0 0 30px rgba(0, 114, 198, 0.3), 0 0 60px rgba(41, 244, 154, 0.1)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'gradient-shift': 'gradientShift 3s ease infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
