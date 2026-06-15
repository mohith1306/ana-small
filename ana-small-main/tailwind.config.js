/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      width: {
        '144': '36rem',
      },
      fontSize: {
        'xxs': '0.625rem',
      },
      fontFamily: {
        'system': [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif'
        ],
      },
      colors: {
        'neutral-70': '#6B7280',
        'ana': {
          'blue': {
            'bg': '#EFF6FF',    // bg-blue-100
            'text': '#1E40AF',  // text-blue-800
            'border': '#BFDBFE' // border-blue-200
          },
          'amber': {
            'bg': '#FEF3C7',    // bg-amber-100
            'text': '#B45309',  // text-amber-700
            'border': '#FDE68A' // border-amber-200
          },
          'gray': {
            'text': {
              'primary': '#374151',   // text-gray-700
              'secondary': '#6B7280',  // text-gray-500
              'tertiary': '#9CA3AF'    // text-gray-400
            },
            'border': {
              'light': '#D1D5DB',     // border-gray-300
              'hover': '#111827'      // border-black on hover
            }
          }
        }
      },
      fontWeight: {
        'extralight': 200,
        'light': 300,
        'normal': 400,
      },
    },
  },
  plugins: [
    function({ addComponents, addUtilities }) {
      addComponents({
        '.ana-heading-1': {
          '@apply font-system text-[3.25em] leading-[1.3] font-extralight': {}
        },
        '.ana-heading-2': {
          '@apply font-system text-[2.5em] leading-[1.3] font-extralight': {}
        },
        '.ana-heading-3': {
          '@apply font-system text-2xl leading-[1.3] font-extralight': {}
        },
        '.ana-heading-4': {
          '@apply font-system text-base leading-[1.3] font-light': {}
        },
        '.ana-heading-5': {
          '@apply font-system text-lg font-extralight text-neutral-70': {}
        },
        '.ana-body': {
          '@apply font-system text-base font-normal': {}
        },
        '.ana-body-small': {
          '@apply font-system text-sm font-normal': {}
        },
        '.ana-body-xs': {
          '@apply font-system text-xs font-normal': {}
        },
        '.ana-body-xxs': {
          '@apply font-system text-xxs font-normal': {}
        },
        '.ana-button-primary': {
          '@apply px-4 py-2 bg-black text-white border border-black hover:bg-gray-800 transition-colors': {}
        },
        '.ana-button-secondary': {
          '@apply px-4 py-2 border border-black hover:bg-gray-100 transition-colors': {}
        },
        '.ana-button-enterprise': {
          '@apply p-2 bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors border border-amber-200': {}
        },
        '.ana-input': {
          '@apply w-full p-2 border border-gray-300 focus:border-black transition-colors': {}
        },
        '.ana-card': {
          '@apply p-4 border border-gray-300 hover:border-black transition-colors': {}
        },
        '.ana-badge': {
          '@apply px-2 py-0.5 text-xs font-normal': {}
        },
        '.ana-badge-blue': {
          '@apply bg-blue-100 text-blue-800': {}
        },
        '.ana-badge-amber': {
          '@apply bg-amber-100 text-amber-800': {}
        },
        '.ana-divider': {
          '@apply w-144 mx-auto border-t-2 border-gray-300': {}
        }
      });
      
      addUtilities({
        '.scrollbar-hide': {
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      });
    }
  ],
};