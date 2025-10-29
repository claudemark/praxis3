import { NavLink, Outlet } from "react-router-dom";

import { cn } from "@/lib/utils";

const navItems = [
  { to: "kassenbuch", label: "Kassenbuch", description: "Verkauf buchen und Transaktionen einsehen" },
  { to: "preisliste", label: "Preisliste", description: "Leistungskatalog verwalten" },
  { to: "report", label: "Report", description: "Kennzahlen und Trends" },
];

export function IgelLayout() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">IGeL Management</h1>
        <p className="text-sm text-muted-foreground">
          Private Zusatzleistungen organisieren, abrechnen und auswerten.
        </p>
      </header>

      <nav className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition hover:border-primary/50 hover:text-primary",
                  isActive
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border/60 bg-surface-100/70 text-muted-foreground/90",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden max-w-xl gap-4 text-xs text-muted-foreground/70 sm:flex">
          {navItems.map((item) => (
            <div key={item.to} className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground/90">{item.label}:</span>
              <span>{item.description}</span>
            </div>
          ))}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
