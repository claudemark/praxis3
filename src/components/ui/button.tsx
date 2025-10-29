import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        solid: "bg-primary text-primary-foreground shadow-soft hover:bg-primary-600",
        subtle: "bg-primary-50 text-primary-700 hover:bg-primary-100",
        outline:
          "border border-border text-foreground hover:border-primary-200 hover:bg-primary-50/50",
        ghost: "text-foreground hover:bg-surface-100/70",
        link: "text-primary hover:text-primary-600 underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
      },
      size: {
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-4 text-sm",
        md: "h-10 px-5 text-sm",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
      tone: {
        neutral: "",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/85 shadow-soft",
      },
    },
    compoundVariants: [
      {
        variant: "outline",
        tone: "accent",
        className: "border-accent/40 text-accent hover:bg-accent/10",
      },
      {
        variant: "outline",
        tone: "secondary",
        className: "border-secondary/40 text-secondary hover:bg-secondary/10",
      },
    ],
    defaultVariants: {
      variant: "solid",
      size: "md",
      tone: "neutral",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, tone, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonStyles({ variant, size, tone }),
          loading && "pointer-events-none",
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="inline-flex size-4 animate-spin rounded-full border-2 border-primary-foreground/50 border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
