import { MoonStar, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/app/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren"}
      className="rounded-2xl border border-border/50 bg-white/60 backdrop-blur"
    >
      <Sun className="size-4 text-amber-500 transition-all dark:-rotate-90 dark:scale-0" aria-hidden />
      <MoonStar className="absolute size-4 text-primary transition-all dark:rotate-0 dark:scale-100" aria-hidden />
      <span className="sr-only">Theme Toggle</span>
    </Button>
  );
}
