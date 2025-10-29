import type { ComponentType, SVGProps } from "react";

import {
  ActivitySquare,
  Banknote,
  BrainCircuit,
  CheckSquare,
  ClipboardList,
  Clock3,
  Coins,
  GaugeCircle,
  LayoutDashboard,
  LineChart,
  Rows4,
  Settings2,
  Sparkles,
  Warehouse,
} from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  description?: string;
  path: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  status?: string;
  soon?: boolean;
};

export const primaryNavigation: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "KPI-Cockpit mit Live-Kennzahlen",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "tasks",
    label: "Aufgaben",
    description: "Mitarbeiter- & SOP-Workflows",
    path: "/aufgaben",
    icon: Rows4,
  },
  {
    id: "time",
    label: "Zeiterfassung",
    description: "Schicht- und Einsatzplanung",
    path: "/zeiterfassung",
    icon: Clock3,
  },
  {
    id: "billing",
    label: "Abrechnung",
    description: "Intelligente Ziffern & Rechnungen",
    path: "/abrechnung",
    icon: ClipboardList,
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Finanz- & Leistungsanalyse",
    path: "/analytics",
    icon: LineChart,
  },
  {
    id: "operations",
    label: "Operationen",
    description: "OP Tracking & Qualität",
    path: "/operationen",
    icon: GaugeCircle,
  },
];

export const secondaryNavigation: NavItem[] = [
  {
    id: "ai-medassist",
    label: "AI MedAssist",
    description: "Spracherkennung & Befunde",
    path: "/ai-medassist",
    icon: BrainCircuit,
  },
  {
    id: "textbausteine",
    label: "Textbausteine",
    description: "Zentrale Wissensbausteine",
    path: "/textbausteine",
    icon: Sparkles,
  },
  {
    id: "lager",
    label: "Lager",
    description: "Implantate & Verbrauchsmaterial",
    path: "/lager",
    icon: Warehouse,
  },
  {
    id: "igel",
    label: "IGeL Management",
    description: "Umsatz & Profitabilitaet",
    path: "/igel",
    icon: Coins,
  },
  {
    id: "cash-drawer",
    label: "Barkasse",
    description: "Barzahlungen & Ausgaben",
    path: "/barkasse",
    icon: Banknote,
  },
  {
    id: "ki-prompts",
    label: "KI Prompts",
    description: "Praxisweite Prompt-Bibliothek",
    path: "/ki-prompts",
    icon: BrainCircuit,
  },
  {
    id: "consultations",
    label: "Private Consults",
    description: "Privatpatienten & Akquise",
    path: "/consultations",
    icon: ClipboardList,
  },
  {
    id: "audit",
    label: "Qualitaetssicherung",
    description: "Audits & SOP-Compliance",
    path: "/qualitaet",
    icon: CheckSquare,
    soon: true,
  },
];

export const tertiaryNavigation: NavItem[] = [
  {
    id: "reports",
    label: "Berichte",
    description: "PDFs & Export",
    path: "/reports",
    icon: ActivitySquare,
    soon: true,
  },
  {
    id: "settings",
    label: "Einstellungen",
    description: "Stammdaten, Rollen & DSGVO",
    path: "/einstellungen",
    icon: Settings2,
  },
];

export const highlightMetrics = [
  {
    id: "patient-flow",
    label: "Patienten heute",
    value: 78,
    delta: +12,
    unit: "Patienten",
    path: "/dashboard",
  },
  {
    id: "surgery",
    label: "OP-Auslastung",
    value: 86,
    delta: +6,
    unit: "%",
    path: "/operationen",
  },
  {
    id: "revenue",
    label: "Selbstzahlerumsatz",
    value: 18750,
    delta: +18,
    unit: "€",
    path: "/igel",
  },
  {
    id: "satisfaction",
    label: "Team Zufriedenheit",
    value: 4.7,
    delta: +0.3,
    unit: "/5",
    path: "/aufgaben",
  },
];

export const pulseMetrics = [
  {
    id: "throughput",
    label: "Durchsatz",
    value: 124,
    unit: "Patienten/Woche",
    trend: +14,
  },
  {
    id: "waiting",
    label: "Durchschnittliche Wartezeit",
    value: 11,
    unit: "Minuten",
    trend: -4,
  },
  {
    id: "rework",
    label: "Nachfragen",
    value: 6,
    unit: "%",
    trend: -2,
  },
];
