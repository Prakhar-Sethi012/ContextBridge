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
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
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
