/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space:  'var(--color-space)',
        navy:   'var(--color-navy)',
        panel:  'var(--color-panel)',
        'panel-light': 'var(--color-panel-light)',
        border: 'var(--color-border)',
        'border-light': 'var(--color-border-light)',
        cyan:   'var(--color-cyan)',
        'cyan-dim': 'var(--color-cyan-dim)',
        amber:  'var(--color-amber)',
        'amber-dim': 'var(--color-amber-dim)',
        success: 'var(--color-success)',
        danger:  'var(--color-danger)',
        text:   'var(--color-text)',
        muted:  'var(--color-muted)',
        'muted-light': 'var(--color-muted-light)',
        surface: 'var(--surface)',
        'surface-border': 'var(--surface-border)',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'Courier Prime', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        crimson: ['"Crimson Text"', 'Georgia', 'serif'],
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'twinkle': 'twinkle 2s ease-in-out infinite',
        'orbit': 'orbit 20s linear infinite',
        'countdown-pulse': 'countdownPulse 1s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px var(--color-cyan), 0 0 10px var(--color-cyan)' },
          '50%': { boxShadow: '0 0 20px var(--color-cyan), 0 0 40px var(--color-cyan)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.2' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' },
        },
        countdownPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(0.97)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
