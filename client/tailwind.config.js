// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }


const customTheme = require('./src/styles/theme.js'); // Import the custom theme

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'], // Specify the file paths Tailwind should scan
  theme: {
    extend: customTheme.theme.extend, // Extend Tailwind's default theme with your custom theme
  },
  plugins: customTheme.plugins || [], // Include any plugins (like text-shadow)
};
