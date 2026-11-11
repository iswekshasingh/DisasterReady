/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F1F5F9',
          muted: '#E2E8F0',
        },
        slate: {
          950: '#0F172A',
          900: '#172033', // Primary text
          600: '#475569',
          500: '#64748B', // Secondary text
          400: '#94A3B8',
          200: '#E2E8F0', // Borders
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        brand: {
          navy: '#243B53',
          'navy-hover': '#1B2D3F',
          DEFAULT: '#243B53',
        },
        accent: {
          blue: '#456B91',
          'blue-hover': '#385777',
          DEFAULT: '#456B91',
        },
        semantic: {
          success: '#467A63',
          'success-subtle': '#EAF3EF',
          warning: '#A67C3D',
          'warning-subtle': '#FAF5EC',
          danger: '#B45D5D',
          'danger-subtle': '#FAEEEE',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        dropdown: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}

