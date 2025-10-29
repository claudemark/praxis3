import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeStyles = cva(
  "inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-semibold ring-1 ring-inset",
  {
    variants: {
      variant: {
        solid: "bg-primary text-primary-foreground ring-primary/40",
        outline: "bg-surface-50 text-foreground ring-border",
        muted: "bg-muted text-muted-foreground ring-transparent",
        accent: "bg-accent text-accent-foreground ring-accent/50",
        success: "bg-success text-success-foreground ring-success/40",
        warning: "bg-warning text-warning-foreground ring-warning/40",
        destructive: "bg-destructive text-destructive-foreground ring-destructive/40",
      },
      size: {
        sm: "text-[11px] px-2.5 py-0.5",
        md: "text-xs px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "muted",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeStyles> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeStyles({ variant, size }), className)} {...props} />;
}
