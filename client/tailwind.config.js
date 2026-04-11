/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      spacing: {
        18: "4.7rem",
        84: "21rem",
      },
      boxShadow: {
        "custom-green": "0 10px 15px -3px rgba(40, 208, 138, 0.1)",
      },
      fontFamily: {
        "space-grotesk": ['Space Grotesk"', "sans-serif"],
        inter: ['Inter"', "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        "primary-text": ["Poppins", "sans-serif"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        ring: "hsl(var(--ring))",
        "primary-text": "#000",
        "secondary-text": "#797979",
        "tertiary-text": "#FFF",
        "quaternary-text": "#3F4254",
        "primary-border": "#C2C2C2",
        "primary-background": "#FFF",
        "secondary-background": "#F5F5F5",
        "custom-blue": "#133C45",
        "custom-primary": "#5D42D1",
        "custom-green": "#28D08A",
        "custome-darkGreen": "#134444",
        "custom-gray": "#F2F5F8",
        "line-color": "#C0CDE0",
        "custom-lightBlue": "#C0CDE0",
        "custom-darkGray": "#5A5A5A",
        "custom-black": "#222222",
        "slate-300": "rgb(203,213,225)",
        "grey-light": "#F5F8FF",
        "sky-950": "#031849",
        "blue-600": "#1677FF",
        "neutral-800": "#232323",
        "blue-700": "#2C5EC6",
        "neutral-700": "#3E3E3E",
        "blue-400": "#4FAFCB",
        "neutral-500": "#747474",
        "gray-400": "#9AA3AB",
        "gray-500": "#667280",
        "gray-300": "#D2D7DD",
        "zinc-300": "#D9D9D9",
        "sky-100": "#E1EFFF",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        card: "var(--radius)",
        input: "var(--radius)",
        button: "var(--radius)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionDuration: {
        2000: "2000ms",
      },
      backgroundImage: {
        "custom_gradient": "linear-gradient(-45deg, hsl(var(--secondary)) 0%, hsl(var(--primary)) 100%)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addUtilities }) {
      addUtilities({
        '.top-initial': {
          top: 'initial',
        },
        '.right-initial': {
          right: 'initial',
        },
      });
    },
  ],
};
