import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type NativeInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export interface InputProps extends NativeInputProps {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leadingIcon, trailingIcon, error, disabled, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <div
          className={cn(
            "group/input flex items-center gap-2 rounded-md border border-input bg-white/80 px-3 py-2 text-sm shadow-sm transition-all",
            "focus-within:border-primary-300 focus-within:shadow-soft",
            disabled && "bg-muted text-muted-foreground",
            error && "border-destructive focus-within:border-destructive",
          )}
        >
          {leadingIcon && <span className="text-muted-foreground/80">{leadingIcon}</span>}
          <input
            ref={ref}
            className={cn(
              "flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70",
              className,
            )}
            disabled={disabled}
            {...props}
          />
          {trailingIcon && (
            <span className="text-muted-foreground/80">{trailingIcon}</span>
          )}
        </div>
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
      </div>
    );
  },
);

Input.displayName = "Input";
