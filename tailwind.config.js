export default {
  important: true,
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'base-100': 'rgb(var(--color-base-100) / <alpha-value>)',
        'base-200': 'rgb(var(--color-base-200) / <alpha-value>)',
        'base-300': 'rgb(var(--color-base-300) / <alpha-value>)',
        'base-content': 'rgb(var(--color-base-content) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-content': 'rgb(var(--color-primary-content) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        ring: 'rgb(var(--color-ring) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--color-muted-foreground) / <alpha-value>)',
      },
    },
  },
}
