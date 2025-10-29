import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type NativeTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export interface TextareaProps extends NativeTextareaProps {
  label?: string;
  description?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, description, error, ...props }, ref) => {
    return (
      <label className="flex w-full flex-col gap-1.5 text-sm text-muted-foreground">
        {label && <span className="font-medium text-foreground/85">{label}</span>}
        <textarea
          ref={ref}
          className={cn(
            "min-h-[120px] rounded-lg border border-input bg-white/80 px-3 py-2 text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40",
            error && "border-destructive focus:ring-destructive/40",
            className,
          )}
          {...props}
        />
        {description && !error ? (
          <span className="text-xs text-muted-foreground/80">{description}</span>
        ) : null}
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
      </label>
    );
  },
);

Textarea.displayName = "Textarea";
