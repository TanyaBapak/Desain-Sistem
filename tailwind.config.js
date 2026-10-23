/** @type {import('tailwindcss').Config} */
export default {
  content: {
    relative: true,
    files: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
      "./backend/resources/views/**/*.blade.php",
      "./backend/resources/js/**/*.{js,ts,jsx,tsx}",
      "./backend/app/**/*.php",
    ],
  },
  theme: {
    extend: {
      colors: {
        p2mi: {
          navy: '#0F172A',
          darkblue: '#1E3A8A',
          blue: '#2563EB',
          lightblue: '#3B82F6',
          red: '#DC2626',
          lightred: '#EF4444',
          gold: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
