/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        eaze: {
          // Brand Primary — Orange
          'primary-50':  '#FFF5EC',
          'primary-100': '#FFECDB',
          'primary-200': '#FFC999',
          'primary-500': '#FF9E44',
          'primary-800': '#552A02',

          // Brand Secondary — Purple / Navy
          'secondary-50':  '#FAF8FF',
          'secondary-100': '#EAEOFF',
          'secondary-200': '#C2A5FD',
          'secondary-500': '#6F3DD9',
          'secondary-800': '#130D21',

          // Success
          'success-50':  '#F1FFF2',
          'success-100': '#D2FFD4',
          'success-500': '#33BF30',
          'success-800': '#08620D',

          // Failure / Error
          'error-50':  '#FFEAEB',
          'error-100': '#FFD6D9',
          'error-500': '#D41A23',
          'error-800': '#680005',
        },
      },
    },
  },
  plugins: [],
}
