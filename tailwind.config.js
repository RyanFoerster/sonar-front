
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@spartan-ng/ui-core/hlm-tailwind-preset')],
  content: [
    './src/**/*.{html,ts}',
    './components/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      height: {
        "without-header": "calc(100vh - 300px)"
      },
      textColor: {
        "green-sonar": "#C8C04D"
      },
      backgroundColor: {
        "gray-sonar": "#EEEEEE"
      }
    },
  },
  plugins: [],
};
