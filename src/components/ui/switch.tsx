import { useState } from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
}

export function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  className,
  label,
  ...props
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const isControlled = typeof checked === "boolean";
  const isOn = isControlled ? checked : internalChecked;

  const toggle = () => {
    const next = !isOn;
    if (!isControlled) {
      setInternalChecked(next);
    }
    onCheckedChange?.(next);
  };

  return (
    <button
      type="button"
      aria-pressed={isOn}
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-3 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-pill border border-transparent bg-muted transition-all",
          isOn && "bg-primary",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform",
            isOn && "translate-x-[1.35rem]",
          )}
        />
      </span>
      {label && <span className="text-foreground/85">{label}</span>}
    </button>
  );
}
