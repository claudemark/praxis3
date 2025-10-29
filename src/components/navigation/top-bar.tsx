import { BellDot, ChevronDown, LifeBuoy, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { highlightMetrics, pulseMetrics } from "@/app/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-[88px] items-center border-b border-border/40 bg-white/70 px-6 backdrop-blur-xl">
      <div className="flex flex-1 items-center justify-between gap-6">
        <GlobalSearch />
        <div className="hidden items-center gap-3 xl:flex">
          {highlightMetrics.map((metric) => (
            <KpiPill key={metric.id} {...metric} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-2xl border border-border/40 bg-white/60"
            aria-label="Benachrichtigungen"
          >
            <BellDot className="size-4 text-muted-foreground/90" />
            <span className="absolute right-1 top-1">
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                4
              </span>
            </span>
          </Button>
          <Button variant="ghost" size="icon" className="rounded-2xl border border-border/40 bg-white/60">
            <LifeBuoy className="size-4 text-muted-foreground/90" />
          </Button>
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}

function GlobalSearch() {
  return (
    <div className="flex w-full max-w-xl items-center gap-4">
      <div className="flex flex-1 flex-col gap-2">
        <Input
          placeholder="Suche nach Patient, GOÄ-Ziffer, Material oder Aufgabe"
          leadingIcon={<Search className="size-4" aria-hidden />}
        />
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/80">
          {pulseMetrics.map((metric) => (
            <span key={metric.id} className="flex items-center gap-1">
              <span className="font-semibold text-foreground/80">{metric.value}</span>
              <span>{metric.unit}</span>
            </span>
          ))}
        </div>
      </div>
      <Button variant="outline" className="hidden gap-2 rounded-full border-dashed text-xs text-muted-foreground/80 md:inline-flex">
        <kbd className="rounded-md bg-muted px-2 py-1 text-[10px] font-semibold">Strg</kbd>
        <kbd className="rounded-md bg-muted px-2 py-1 text-[10px] font-semibold">K</kbd>
      </Button>
    </div>
  );
}

function KpiPill({ label, value, delta, unit, path }: (typeof highlightMetrics)[number]) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === path;
  const handleClick = () => {
    if (!path || location.pathname === path) return;
    navigate(path);
  };

  const trendPositive = typeof delta === "number" ? delta >= 0 : false;
  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        "flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" +
        (isActive
          ? " border-primary bg-primary/15 text-primary shadow-sm"
          : " border-primary/10 bg-primary/5 text-primary hover:border-primary/40 hover:bg-primary/10")
      }
      aria-pressed={isActive}
      aria-label={`${label} öffnen`}
    >
      <span className="font-semibold text-inherit">{label}</span>
      <span className="text-sm font-semibold text-foreground/90">{value}</span>
      <span className="text-xs text-muted-foreground">{unit}</span>
      {typeof delta === "number" ? (
        <Badge variant={trendPositive ? "success" : "destructive"} size="sm">
          {trendPositive ? "+" : ""}
          {delta}
        </Badge>
      ) : null}
    </button>
  );
}

function ProfileDropdown() {
  return (
    <button className="flex items-center gap-3 rounded-full border border-border/40 bg-white/80 px-3 py-1 text-left shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
      <Avatar name="Finja Lenz" size="sm" status="online" />
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-foreground/90">Finja Lenz</span>
        <span className="text-xs text-muted-foreground/80">Praxismanagerin</span>
      </span>
      <ChevronDown className="size-4 text-muted-foreground/80" aria-hidden />
    </button>
  );
}
