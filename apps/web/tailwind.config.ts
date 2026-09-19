import type { Config } from 'tailwindcss';

/**
 * Theme colors live in CSS variables, which Tailwind can't apply an alpha
 * modifier to (`bg-accent-primary/20` would emit nothing). Mix with
 * transparent so the modifier works for any theme.
 */
const themeColor = (variable: string): string => {
  const resolve = ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined || opacityValue === '1'
      ? `var(${variable})`
      : `color-mix(in srgb, var(${variable}) calc(${opacityValue} * 100%), transparent)`;
  // Tailwind accepts a function here at runtime; its Config typing only lists strings.
  return resolve as unknown as string;
};

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware colors via CSS variables
        board: {
          bg: 'var(--board-bg)',
          grid: 'var(--board-grid)',
          cell: 'var(--board-cell)',
          cellHover: 'var(--board-cell-hover)',
          cellDisabled: 'var(--board-cell-disabled)',
        },
        playerX: {
          primary: themeColor('--player-x-primary'),
          secondary: themeColor('--player-x-secondary'),
          glow: 'var(--player-x-glow)',
        },
        playerO: {
          primary: themeColor('--player-o-primary'),
          secondary: themeColor('--player-o-secondary'),
          glow: 'var(--player-o-glow)',
        },
        accent: {
          primary: themeColor('--accent-primary'),
          'primary-foreground': themeColor('--accent-primary-foreground'),
          secondary: themeColor('--accent-secondary'),
          success: themeColor('--accent-success'),
          warning: themeColor('--accent-warning'),
          error: themeColor('--accent-error'),
        },
        surface: {
          base: 'var(--surface-base)',
          elevated: 'var(--surface-elevated)',
          overlay: 'var(--surface-overlay)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          tertiary: 'var(--text-tertiary)',
        },
        critical: {
          DEFAULT: 'var(--critical)',
          foreground: 'var(--critical-foreground)',
        },
        border: {
          subtle: 'var(--border-subtle)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 1s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-in',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'glow': 'glow 1.5s ease-in-out infinite',
        'win-line': 'win-line 0.5s ease-out forwards',
        'cell-remove': 'cell-remove 0.8s ease-in-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-out': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(10px)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 5px var(--glow-color)' },
          '50%': { boxShadow: '0 0 20px var(--glow-color)' },
        },
        'win-line': {
          '0%': { strokeDashoffset: '100%', opacity: '0' },
          '100%': { strokeDashoffset: '0%', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'cell-remove': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.1)' },
          '100%': { opacity: '0', transform: 'scale(0.8)' },
        },
      },
      boxShadow: {
        'glow-x': '0 0 20px var(--player-x-glow)',
        'glow-o': '0 0 20px var(--player-o-glow)',
        'glow-accent': '0 0 20px var(--accent-primary)',
      },
    },
  },
  plugins: [],
};

export default config;
