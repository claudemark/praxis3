import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy" | "away";
}

const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "size-7 text-[10px]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
  xl: "size-16 text-lg",
};

const statusColor: Record<NonNullable<AvatarProps["status"]>, string> = {
  online: "bg-success",
  offline: "bg-muted",
  busy: "bg-destructive",
  away: "bg-warning",
};

export function Avatar({
  className,
  name,
  src,
  size = "md",
  status,
  ...props
}: AvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative inline-flex" {...props}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            "rounded-full border border-border/60 object-cover shadow-soft",
            sizeClasses[size],
            className,
          )}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full border border-border/60 bg-primary/15 text-primary shadow-soft",
            sizeClasses[size],
            className,
          )}
        >
          {initials}
        </div>
      )}
      {status ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 inline-block size-3 rounded-full border-2 border-surface-50",
            statusColor[status],
          )}
        />
      ) : null}
    </div>
  );
}
