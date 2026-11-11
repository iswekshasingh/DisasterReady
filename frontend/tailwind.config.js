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
        brand: {
          navy: '#1E293B',
          'navy-dark': '#0F172A',
          blue: '#2563EB',
          'blue-light': '#3B82F6',
          'blue-subtle': '#EFF6FF',
        },
        safety: {
          green: '#16A34A',
          'green-subtle': '#F0FDF4',
          amber: '#D97706',
          'amber-subtle': '#FFFBEB',
          red: '#DC2626',
          'red-subtle': '#FEF2F2',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '10%, 90%': { transform: 'translate(-3px, -2px) rotate(-0.5deg)' },
          '20%, 80%': { transform: 'translate(4px, 3px) rotate(0.8deg)' },
          '30%, 50%, 70%': { transform: 'translate(-5px, 3px) rotate(-1deg)' },
          '40%, 60%': { transform: 'translate(5px, -3px) rotate(1deg)' },
        },
        debrisDrop: {
          '0%': { transform: 'translateY(-120px) rotate(-10deg)', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { transform: 'translateY(180px) rotate(15deg)', opacity: '1' },
        },
        alertPulse: {
          '0%, 100%': { boxShadow: 'inset 0 0 0 4px rgba(220, 38, 38, 0.2)' },
          '50%': { boxShadow: 'inset 0 0 0 8px rgba(220, 38, 38, 0.85)' },
        },
      },
      animation: {
        shake: 'shake 0.35s ease-in-out infinite',
        debris: 'debrisDrop 0.55s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards',
        alert: 'alertPulse 0.6s ease-in-out infinite',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}

