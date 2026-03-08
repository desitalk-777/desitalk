/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff6b35',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12'
        },
        desi: {
          bg: '#0f0f10',
          card: '#1a1a1b',
          border: '#2d2d2e',
          text: '#d7dadc',
          muted: '#818384',
          hover: '#272729'
        }
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['Baloo 2', 'cursive'],
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-saffron': 'pulseSaffron 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        pulseSaffron: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' }
        }
      }
    }
  },
  plugins: []
};
