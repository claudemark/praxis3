import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import tailwindcssAnimate from "tailwindcss-animate";
import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["'InterVariable'", ...defaultTheme.fontFamily.sans],
        display: ["'Lexend'", ...defaultTheme.fontFamily.sans],
        mono: ["'IBM Plex Mono'", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        background: "hsl(var(--color-background))",
        foreground: "hsl(var(--color-foreground))",
        surface: {
          50: "hsl(var(--color-surface-50))",
          100: "hsl(var(--color-surface-100))",
          200: "hsl(var(--color-surface-200))",
          300: "hsl(var(--color-surface-300))",
          400: "hsl(var(--color-surface-400))",
          500: "hsl(var(--color-surface-500))",
          600: "hsl(var(--color-surface-600))",
          700: "hsl(var(--color-surface-700))",
          800: "hsl(var(--color-surface-800))",
          900: "hsl(var(--color-surface-900))",
          950: "hsl(var(--color-surface-950))",
        },
        primary: {
          DEFAULT: "hsl(var(--color-primary))",
          foreground: "hsl(var(--color-primary-foreground))",
          50: "hsl(var(--color-primary-50))",
          100: "hsl(var(--color-primary-100))",
          200: "hsl(var(--color-primary-200))",
          300: "hsl(var(--color-primary-300))",
          400: "hsl(var(--color-primary-400))",
          500: "hsl(var(--color-primary-500))",
          600: "hsl(var(--color-primary-600))",
          700: "hsl(var(--color-primary-700))",
          800: "hsl(var(--color-primary-800))",
          900: "hsl(var(--color-primary-900))",
        },
        secondary: {
          DEFAULT: "hsl(var(--color-secondary))",
          foreground: "hsl(var(--color-secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--color-accent))",
          foreground: "hsl(var(--color-accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--color-success))",
          foreground: "hsl(var(--color-success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--color-warning))",
          foreground: "hsl(var(--color-warning-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--color-destructive))",
          foreground: "hsl(var(--color-destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--color-muted))",
          foreground: "hsl(var(--color-muted-foreground))",
        },
        border: "hsl(var(--color-border))",
        input: "hsl(var(--color-input))",
        ring: "hsl(var(--color-ring))",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(13, 105, 96, 0.25)",
        outline: "0 0 0 2px hsl(var(--color-primary-200))",
      },
      borderRadius: {
        lg: "calc(var(--radius-lg))",
        md: "calc(var(--radius-md))",
        sm: "calc(var(--radius-sm))",
        pill: "calc(var(--radius-pill))",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.2s infinite",
      },
    },
  },
  plugins: [
    forms({ strategy: "class" }),
    tailwindcssAnimate,
    plugin(({ addVariant }) => {
      addVariant("hocus", "&:hover, &:focus-visible");
      addVariant("child", "& > *");
      addVariant("child-hover", "& > *:hover");
    }),
  ],
};

export default config;
