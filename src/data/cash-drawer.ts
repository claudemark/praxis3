export type CashMovementType = "float-in" | "sale" | "expense" | "reconcile" | "adjustment";

export interface CashMovement {
  id: string;
  timestamp: string;
  type: CashMovementType;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  employeeId?: string;
  category?: string;
}

export interface CashDrawerSnapshot {
  id: string;
  recordedAt: string;
  countedAmount: number;
  difference: number;
  note?: string;
  employeeId?: string;
}

export const pettyCashCategories = [
  "Verpflegung",
  "Bueromaterial",
  "Patientenservice",
  "Transport",
  "Sonstiges",
] as const;

export const initialCashFloat = 200;

export const initialCashMovements: CashMovement[] = [
  {
    id: "cash-init",
    timestamp: "2025-09-24T07:30:00",
    type: "float-in",
    amount: initialCashFloat,
    balanceAfter: initialCashFloat,
    description: "Startbestand Barkasse",
    employeeId: "emp-linde",
  },
  {
    id: "cash-sale-001",
    timestamp: "2025-09-24T09:15:00",
    type: "sale",
    amount: 120,
    balanceAfter: initialCashFloat + 120,
    description: "Barverkauf PRP-Therapie",
    referenceId: "IGEL-20250924-01",
    employeeId: "emp-linde",
  },
  {
    id: "cash-expense-001",
    timestamp: "2025-09-24T10:05:00",
    type: "expense",
    amount: -14.5,
    balanceAfter: initialCashFloat + 105.5,
    description: "Cappuccino-Bohnen für Wartebereich",
    employeeId: "emp-boettcher",
    category: "Verpflegung",
  },
];

export const initialSnapshots: CashDrawerSnapshot[] = [
  {
    id: "snap-20250923",
    recordedAt: "2025-09-23T18:05:00",
    countedAmount: 185,
    difference: -5,
    note: "Kleingeldausgabe für Taxifahrt Patient",
    employeeId: "emp-mailer",
  },
];

