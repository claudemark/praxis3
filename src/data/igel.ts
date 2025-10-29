export type PaymentMethod = "Bar" | "Karte";

export interface IgelService {
  id: string;
  name: string;
  description: string;
  price: number;
  goaCodes: string[];
  materials: { itemId: string; quantity: number }[];
}

export interface IgelTransaction {
  id: string;
  patient: string;
  serviceId: string;
  collector: string;
  paymentMethod: PaymentMethod;
  amount: number;
  createdAt: string;
  notes?: string;
}

export const igelServices: IgelService[] = [
  {
    id: "igel-prp",
    name: "PRP-Knieprotokoll",
    description: "Autologes Conditioniertes Plasma für Kniegelenk",
    price: 289,
    goaCodes: ["3306", "302"],
    materials: [
      { itemId: "INV-2860", quantity: -1 },
      { itemId: "INV-3051", quantity: -1 },
    ],
  },
  {
    id: "igel-hyaluron",
    name: "Hyaluron-Injektion",
    description: "Intraartikuläre Hyaluronsäure-Injektion",
    price: 189,
    goaCodes: ["3306"],
    materials: [
      { itemId: "INV-2622", quantity: -1 },
    ],
  },
  {
    id: "igel-stosswelle",
    name: "Stoßwellentherapie",
    description: "Fokussierte Stoßwelle bei Tendinopathien",
    price: 119,
    goaCodes: ["302"],
    materials: [],
  },
];

export const initialIgelTransactions: IgelTransaction[] = [
  {
    id: "IGEL-2025-0924-01",
    patient: "Marc Lehmann",
    serviceId: "igel-prp",
    collector: "Nora Feld",
    paymentMethod: "Karte",
    amount: 289,
    createdAt: "2025-09-24T09:32:00",
    notes: "Serie 1/3",
  },
  {
    id: "IGEL-2025-0923-02",
    patient: "Katja Meier",
    serviceId: "igel-hyaluron",
    collector: "Marcus Linde",
    paymentMethod: "Bar",
    amount: 189,
    createdAt: "2025-09-23T16:05:00",
  },
];
