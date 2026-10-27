export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],

        display: [
          '"Plus Jakarta Sans"',
          "Inter",
          "sans-serif",
        ],
      },

      colors: {
        ink: {
          950: "#070D18",
          900: "#0B1424",
          800: "#122036",
          700: "#1B2E4A",
          600: "#2A4163",
          500: "#41597D",
        },

        brand: {
          50: "#ECFDF5",
          100: "#D2F8E8",
          200: "#A7EFD2",
          300: "#6FE0B6",
          400: "#35C997",
          500: "#12AE7E",
          600: "#068C67",
          700: "#067054",
          800: "#085944",
          900: "#084939",
        },

        signal: {
          amber: "#F59E0B",
          red: "#E11D48",
          blue: "#2563EB",
        },
      },

      boxShadow: {
        card:
          "0 1px 2px rgba(11,20,36,0.04), 0 8px 24px -12px rgba(11,20,36,0.16)",

        lift:
          "0 18px 40px -18px rgba(11,20,36,0.35)",
      },

      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
};