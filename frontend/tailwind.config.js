/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#0B3D30',
          dark: '#072820',
          light: '#135443',
          surface: '#0F4739',
        },
        beige: {
          DEFAULT: '#F9F7F1',
          dark: '#EFECE2',
          border: '#DED9CB',
        },
        vibrant: {
          DEFAULT: '#00E676',
          hover: '#00C853',
          dark: '#009624',
        },
        charcoal: '#1A1D1C',
      },
      fontFamily: {
        sans: [
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"SF Pro"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"San Francisco"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'SFMono-Regular',
          '"SF Pro Display"',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      borderWidth: {
        DEFAULT: '1px',
        '2': '2px',
        '3': '3px',
      },
    },
  },
  plugins: [],
}
