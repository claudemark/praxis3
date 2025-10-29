export type PaymentMethod = "Bar" | "Karte";

export interface IgelPriceListEntry {
  id: string;
  treatment: string;
  unit: string;
  price: number;
  cycle?: string;
  notes?: string;
  goaCodes?: string[];
  materials?: { itemId: string; quantity: number }[];
  receiptTemplate?: string[];
  goaBreakdown?: GoaBreakdownTemplateLine[];
}

export interface IgelTransaction {
  id: string;
  patient: string;
  patientNumber: string;
  serviceId: string;
  collector: string;
  paymentMethod: PaymentMethod;
  quantity: number;
  amount: number;
  paidAmount: number;
  createdAt: string;
  status?: "offen" | "bezahlt" | "teilweise";
  notes?: string;
  includeNotesOnReceipt?: boolean;
  receiptLines?: string[];
  goaBreakdown?: GoaBreakdownLine[];
}

export interface GoaBreakdownTemplateLine {
  step: string;
  code: string;
  factor?: string | null;
  amount: number;
  kind?: "material" | "service";
  unit?: string | null;
}

export interface GoaBreakdownLine {
  step: string;
  code: string;
  factor: string;
  amount: number;
  unit?: string | null;
}

export const igelPriceList: IgelPriceListEntry[] = [
  {
    id: "price-1-stima",
    treatment: "1. Stima",
    unit: "1",
    price: 10,
    cycle: "1",
    notes: "",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-2-attest-andere",
    treatment: "Attest Andere",
    unit: "1",
    price: 2.5,
    cycle: "",
    notes: "aber ab 2.5 Preise sind unterschiedlich",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-3-attest-1749",
    treatment: "Attest 17.49",
    unit: "1",
    price: 17.49,
    cycle: "",
    notes: "",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-4-attest-50",
    treatment: "Attest 50",
    unit: "1",
    price: 50,
    cycle: "",
    notes: "",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-5-cd-brennen",
    treatment: "CD Brennen",
    unit: "1",
    price: 5,
    cycle: "",
    notes: "",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-6-cortison-xylonest",
    treatment: "Cortison mit Xylonest/Carbotessin",
    unit: "1",
    price: 30,
    cycle: "2",
    notes: "",
    goaCodes: ["3306"],
    materials: [],
  },
  {
    id: "price-7-hyalone-huefte",
    treatment: "Hyalone Hüfte mit Rö",
    unit: "1",
    price: 150,
    cycle: "2",
    notes: "",
    goaCodes: ["3306"],
    materials: [{ itemId: "INV-2622", quantity: -1 }],
  },
  {
    id: "price-8-hyalone-knie",
    treatment: "Hyalone Knie",
    unit: "1",
    price: 130,
    cycle: "2",
    notes: "einmal in 6 Monate sonst 2 mal",
    goaCodes: ["3306"],
    materials: [{ itemId: "INV-2622", quantity: -1 }],
  },
  {
    id: "price-9-hyaltrend-infiltration",
    treatment: "Hyaltrend mit Infiltration Xylonest und Stoßwelle",
    unit: "1",
    price: 170,
    cycle: "2",
    notes: "",
    goaCodes: ["302"],
    materials: [],
  },
  {
    id: "price-10-hyalubrix-daumen",
    treatment: "Hyalubrix Daumen mit Betäubung",
    unit: "1",
    price: 90,
    cycle: "2",
    notes: "",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-11-hyalubrix-knie",
    treatment: "Hyalubrix Knie",
    unit: "1",
    price: 80,
    cycle: "3",
    notes: "",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-12-hyalubrix-osg",
    treatment: "Hyalubrix OSG",
    unit: "1",
    price: 90,
    cycle: "3",
    notes: "",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-13-hyalubrix-schulter",
    treatment: "Hyalubrix Schulter",
    unit: "1",
    price: 80,
    cycle: "3",
    notes: "",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-14-hyaltrend-betaeubung",
    treatment: "Hyaltrend immer mit Betäubung",
    unit: "1",
    price: 120,
    cycle: "2",
    notes: "",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-15-hymovis-huefte",
    treatment: "Hymovis Hüfte mit Rö",
    unit: "1",
    price: 300,
    cycle: "2",
    notes: "",
    goaCodes: ["3306"],
    materials: [],
  },
  {
    id: "price-16-hymovis-knie",
    treatment: "Hymovis Knie",
    unit: "1",
    price: 250,
    cycle: "2",
    notes: "",
    goaCodes: ["3306"],
    materials: [],
  },
  {
    id: "price-17-kinesio-taping",
    treatment: "Kinesio-Taping",
    unit: "1",
    price: 15,
    cycle: "",
    notes: "",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-18-massage-pistole",
    treatment: "Massage Pistole",
    unit: "1",
    price: 20,
    cycle: "3",
    notes: "",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-19-neuraltherapie",
    treatment: "Neuraltherapie",
    unit: "1",
    price: 50,
    cycle: "1",
    notes: "",
    goaCodes: ["302"],
    materials: [],
  },
  {
    id: "price-20-prp-knie-schulter",
    treatment: "PRP am Knie oder Schulter, Daumen, OSG",
    unit: "1",
    price: 250,
    cycle: "2",
    notes: "Kontrolle nach 2 Wochen dann nach insgesamt 4 Wochen 2te Spritze",
    goaCodes: ["3306", "302"],
    materials: [
      { itemId: "INV-2860", quantity: -1 },
      { itemId: "INV-3051", quantity: -1 },
    ],
    receiptTemplate: [
      "Privatrechnung nach GOÄ – Individuelle Gesundheitsleistung (IGeL)",
      "",
      "Praxis für Orthopädie & Unfallchirurgie",
      "Ozobia Samuel Mgbor",
      "Poststraße 37a 46562 Voerde",
      "Tel.: 0281 / 41020 Fax: 0281 / 46227",
      "",
      "Patient/in: {{patient}}",
      "PAT-Nr: {{patientNumber}}",
      "",
      "Leistung: {{service}}",
      "Einheiten: {{quantity}}",
      "Einzelpreis: {{unitPrice}}",
      "Gesamtbetrag: {{total}}",
      "Gezahlt: {{paid}}",
      "Restbetrag: {{rest}}",
      "Zahlungsart: {{paymentMethod}}",
      "Bearbeiter: {{collector}}",
      "Datum: {{date}}",
    ],
    goaBreakdown: [
      { step: "Blutentnahme", code: "250", factor: "2,3", amount: 4.66, unit: "1x" },
      { step: "Aufbereitung PRP (Zentrifugation, analog)", code: "792 a", factor: "2,3", amount: 59, unit: "1x" },
      { step: "Injektion intraartikulär", code: "255", factor: "2,3", amount: 16, unit: "1x" },
      { step: "Ärztliche Beratung (eingehend, >10 Min.)", code: "3", factor: "2,3", amount: 20.1, unit: "1x" },
      { step: "Materialkosten (PRP-Kit, Röhrchen etc.)", code: "§10 GOÄ", factor: "—", amount: 150.24, kind: "material", unit: "Pauschal" },
    ],
  },
  {
    id: "price-21-prp-huefte",
    treatment: "PRP Hüfte mit Rö",
    unit: "1",
    price: 300,
    cycle: "2",
    notes: "",
    goaCodes: ["3306", "302"],
    materials: [
      { itemId: "INV-2860", quantity: -1 },
      { itemId: "INV-3051", quantity: -1 },
    ],
  },
  {
    id: "price-22-sonstiges",
    treatment: "Sonstiges",
    unit: "1",
    price: 1,
    cycle: "",
    notes: "",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-23-stosswellentherapie",
    treatment: "Stoßwellentherapie (ESWT)",
    unit: "1",
    price: 70,
    cycle: "3-4",
    notes: "",
    goaCodes: ["302"],
    materials: [],
  },
  {
    id: "price-24-weitere-stimawell",
    treatment: "Weitere Stimawell",
    unit: "1",
    price: 20,
    cycle: "10",
    notes: "",
    goaCodes: [],
    materials: [],
  },
  {
    id: "price-25-wirbelsaeule-injektion",
    treatment: "Wirbelsäule Injektion mit Triam, Naropin unter Röntgen",
    unit: "1",
    price: 150,
    cycle: "2",
    notes: "ISG, Facettengelenk",
    goaCodes: ["3306"],
    materials: [],
  },
];

export const initialIgelTransactions: IgelTransaction[] = [
  {
    id: "IGEL-2025-0924-01",
    patient: "Simone Dörr",
    patientNumber: "PAT-49410",
    serviceId: "price-20-prp-knie-schulter",
    collector: "Nora Feld",
    paymentMethod: "Karte",
    quantity: 1,
    amount: 250,
    paidAmount: 230,
    createdAt: "2025-10-09T09:32:00",
    notes: "Serie 1/3",
    includeNotesOnReceipt: false,
    receiptLines: [
      "Leistung: PRP am Knie oder Schulter, Daumen, OSG",
      "Einheiten: 1",
      "Gesamtbetrag: 250,00 €",
      "Gezahlt: 230,00 €",
    ],
  },
  {
    id: "IGEL-2025-0923-02",
    patient: "Martina Kellermann",
    patientNumber: "PAT-33382",
    serviceId: "price-6-cortison-xylonest",
    collector: "Marcus Linde",
    paymentMethod: "Bar",
    quantity: 1,
    amount: 30,
    paidAmount: 30,
    createdAt: "2025-10-09T10:15:00",
    includeNotesOnReceipt: false,
    receiptLines: [
      "Leistung: Cortison mit Xylonest/Carbotessin",
      "Einheiten: 1",
      "Gesamtbetrag: 30,00 €",
      "Gezahlt: 30,00 €",
    ],
  },
  {
    id: "IGEL-2025-0922-03",
    patient: "Michael Kersken",
    patientNumber: "PAT-31003",
    serviceId: "price-20-prp-knie-schulter",
    collector: "Nora Feld",
    paymentMethod: "Bar",
    quantity: 1,
    amount: 250,
    paidAmount: 200,
    createdAt: "2025-10-09T11:02:00",
    notes: "Patient zahlt Rest in zwei Wochen",
    includeNotesOnReceipt: true,
    receiptLines: [
      "Leistung: PRP am Knie oder Schulter, Daumen, OSG",
      "Einheiten: 1",
      "Gesamtbetrag: 250,00 €",
      "Gezahlt: 200,00 €",
    ],
  },
];
