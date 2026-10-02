/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16A34A',
          dark: '#15803D',
          light: '#22C55E',
        },
        mint: {
          50: '#F0FDF4',
          100: '#DCFCE7',
        },
        background: '#FFFFFF',
        surface: '#F8FAF9',
        content: '#0F172A',
        muted: '#64748B',
        error: '#EF4444',
        warning: '#F59E0B',
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        button: '12px',
        input: '12px',
        card: '16px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(22, 163, 74, 0.08)',
        focusGreen: '0 0 0 4px #DCFCE7',
      },
    },
  },
  plugins: [],
};
