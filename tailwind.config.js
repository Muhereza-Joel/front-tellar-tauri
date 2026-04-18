/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // This covers everything inside src
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // Use this if you don't have a src folder
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Use this if components is in the root
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
