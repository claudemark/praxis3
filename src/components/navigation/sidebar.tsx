import { NavLink } from "react-router-dom";

import type { NavItem } from "@/app/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface AppSidebarProps {
  primary: NavItem[];
  secondary: NavItem[];
  tertiary: NavItem[];
}

export function AppSidebar({ primary, secondary, tertiary }: AppSidebarProps) {
  return (
    <aside className="group/sidebar relative hidden min-h-screen w-[260px] flex-col gap-4 border-r border-border/40 bg-white/85 px-4 py-6 shadow-lg shadow-primary/5 backdrop-blur-2xl lg:flex">
      <div className="flex items-start justify-between gap-2 px-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <svg viewBox="0 0 48 48" className="size-6" aria-hidden>
                <path
                  d="M23.8 6c-3.1 0-5.9 1.3-7.9 3.3l-9.6 9.5c-1 1-1 2.6 0 3.6l6 5.9c1 1 2.6 1 3.6 0l7.9-7.8c1.4-1.4 3.6-1.4 5 0l3.6 3.6c1.4 1.4 1.4 3.6 0 5l-7.6 7.5c-1 1-1 2.6 0 3.6l4.4 4.3c1 1 2.6 1 3.6 0l9.8-9.7C41.7 33 43 30.2 43 27s-1.3-5.9-3.3-7.9l-8.7-8.7C28.7 7.3 26 6 23.8 6z"
                  className="fill-current"
                />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground/90">PraxisPro</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80">
                Manager
              </p>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </div>
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin">
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
            Überblick
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {primary.map((item) => (
              <SidebarLink key={item.id} item={item} />
            ))}
          </ul>
        </div>
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
            Betrieb
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {secondary.map((item) => (
              <SidebarLink key={item.id} item={item} />
            ))}
          </ul>
        </div>
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
            Steuerung
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {tertiary.map((item) => (
              <SidebarLink key={item.id} item={item} />
            ))}
          </ul>
        </div>
      </nav>
      <div className="mt-auto rounded-xl border border-primary/15 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <Avatar name="Dr. Amelie Krause" size="sm" status="online" />
          <div>
            <p className="text-sm font-semibold text-foreground/90">Dr. Amelie Krause</p>
            <p className="text-xs text-muted-foreground/80">Leitende Orthopädin</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Heutige Patienten</span>
          <Badge variant="accent" size="sm">
            18 • +3
          </Badge>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <li>
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          cn(
            "group/link flex items-start gap-3 rounded-lg border border-transparent px-3 py-3 transition-all",
            "hover:border-primary/15 hover:bg-primary/5",
            isActive &&
              "border-primary/30 bg-primary/10 text-primary shadow-soft hover:border-primary/30",
          )
        }
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-surface-100 text-muted-foreground/90 transition-colors group-hover/link:bg-primary/10 group-hover/link:text-primary">
          <item.icon className="size-[18px]" aria-hidden />
        </span>
        <span className="flex flex-1 flex-col text-sm">
          <span className="font-semibold text-foreground/90 group-hover/link:text-primary">
            {item.label}
          </span>
          {item.description ? (
            <span className="text-xs text-muted-foreground/80">{item.description}</span>
          ) : null}
        </span>
        {item.soon ? <Badge size="sm">Bald</Badge> : null}
      </NavLink>
    </li>
  );
}
