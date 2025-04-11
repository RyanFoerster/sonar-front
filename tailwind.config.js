/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@spartan-ng/ui-core/hlm-tailwind-preset")],
  content: ["./src/**/*.{html,ts}", "./components/**/*.{html,ts}"],
  theme: {
    extend: {
      height: {
        "without-footer-and-header": "calc(100vh - 200px)",
      },
      textColor: {
        "green-sonar": "#C8C04D",
        "gray-sonar": "#EEEEEE",
      },
      backgroundColor: {
        "gray-sonar": "#EEEEEE",
        "green-sonar": "#C8C04D",
      },
      borderColor: {
        "green-sonar": "#C8C04D",
      },
    },
  },
  plugins: [],
};
