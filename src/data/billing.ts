export type BillingChannel = "privat" | "bg" | "kv";

export interface GoACode {
  nummer: string;
  bezeichnung: string;
  punktzahl: number;
  euro: number;
  region: string;
  kategorie: string;
  beschreibung: string;
  kompatibelMit: string[];
  haeufigkeit: string;
  abrechnung: BillingChannel;
  favorite?: boolean;
}

export interface CodeBundle {
  id: string;
  title: string;
  beschreibung: string;
  codes: string[];
  channel: BillingChannel;
  favorite?: boolean;
}

export interface InvoiceItem {
  id: string;
  code: string;
  bezeichnung: string;
  quantity: number;
  amount: number;
}

export interface Invoice {
  id: string;
  patientName: string;
  patientNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: "Entwurf" | "Versendet" | "Bezahlt" | "Überfällig" | "Storniert";
  paymentMethod?: string;
  notes?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt?: string;
}

export const goaCodes: GoACode[] = [
  {
    nummer: "3306",
    bezeichnung: "Injektion in ein großes Gelenk",
    punktzahl: 270,
    euro: 22.86,
    region: "Knie",
    kategorie: "Injektion",
    beschreibung: "Intraartikuläre Injektion in ein großes Gelenk, inkl. sterile Vorbereitung",
    kompatibelMit: ["602", "842"],
    haeufigkeit: "28x / Monat",
    abrechnung: "privat",
    favorite: true,
  },
  {
    nummer: "302",
    bezeichnung: "Erstuntersuchung",
    punktzahl: 160,
    euro: 12.56,
    region: "Allgemein",
    kategorie: "Konsultation",
    beschreibung: "Ausführliche Erstuntersuchung inkl. Anamnese",
    kompatibelMit: ["3306", "510"],
    haeufigkeit: "94x / Monat",
    abrechnung: "kv",
    favorite: true,
  },
  {
    nummer: "842",
    bezeichnung: "Sonografie eines Gelenks",
    punktzahl: 250,
    euro: 19.2,
    region: "Knie",
    kategorie: "Bildgebung",
    beschreibung: "Ultraschall eines Gelenks einschließlich Dokumentation",
    kompatibelMit: ["3306"],
    haeufigkeit: "41x / Monat",
    abrechnung: "privat",
  },
  {
    nummer: "602",
    bezeichnung: "Regionale Leitungsanästhesie",
    punktzahl: 180,
    euro: 15.4,
    region: "Unterer Extremität",
    kategorie: "Anästhesie",
    beschreibung: "Leitungsanästhesie eines peripheren Nervs",
    kompatibelMit: ["3306"],
    haeufigkeit: "16x / Monat",
    abrechnung: "bg",
  },
  {
    nummer: "510",
    bezeichnung: "Kontrolluntersuchung",
    punktzahl: 80,
    euro: 6.28,
    region: "Allgemein",
    kategorie: "Konsultation",
    beschreibung: "Kurze Kontrolluntersuchung inkl. Dokumentation",
    kompatibelMit: ["302"],
    haeufigkeit: "120x / Monat",
    abrechnung: "kv",
  },
  {
    nummer: "371",
    bezeichnung: "Verbandswechsel nach BG-Unfall",
    punktzahl: 95,
    euro: 8.5,
    region: "Hand",
    kategorie: "Wundversorgung",
    beschreibung: "Steriler Verbandswechsel inkl. Fotodokumentation gemäß BG-Vorgaben",
    kompatibelMit: ["602"],
    haeufigkeit: "35x / Monat",
    abrechnung: "bg",
  },
  {
    nummer: "255",
    bezeichnung: "Arthrozentese ambulant",
    punktzahl: 220,
    euro: 18.4,
    region: "Schulter",
    kategorie: "Intervention",
    beschreibung: "Sterile Gelenkpunktion mit Dokumentation des Punktats",
    kompatibelMit: ["842", "3306"],
    haeufigkeit: "22x / Monat",
    abrechnung: "privat",
    favorite: true,
  },
  {
    nummer: "450",
    bezeichnung: "Telekonsil + Befundübermittlung",
    punktzahl: 110,
    euro: 9.8,
    region: "Allgemein",
    kategorie: "Telemedizin",
    beschreibung: "Digitale Verlaufskontrolle inkl. Übermittlung von Bildmaterial",
    kompatibelMit: ["510"],
    haeufigkeit: "58x / Monat",
    abrechnung: "kv",
  },
];

export const codeBundles: CodeBundle[] = [
  {
    id: "bundle-prp",
    title: "PRP Intervention komplett",
    beschreibung: "Erstkontakt, Sonografie, Punktion sowie abschließende Kontrolle für PRP-Behandlungen.",
    codes: ["302", "842", "3306", "255"],
    channel: "privat",
    favorite: true,
  },
  {
    id: "bundle-arthro",
    title: "Arthrozentese Schulter",
    beschreibung: "Schneller Ablauf mit Leitungsanästhesie, Punktion und Dokumentation.",
    codes: ["602", "255", "510"],
    channel: "privat",
  },
  {
    id: "bundle-bg",
    title: "BG Unfall Erstversorgung",
    beschreibung: "Leitungsanästhesie, Verbandswechsel und Fotodokumentation für D-Arzt Berichte.",
    codes: ["302", "602", "371"],
    channel: "bg",
  },
  {
    id: "bundle-kv",
    title: "KV Verlauf digital",
    beschreibung: "Kontrolltermin kombiniert mit Telekonsil und Patientendokumentation.",
    codes: ["510", "450"],
    channel: "kv",
  },
];

export const recentInvoices = [
  {
    id: "INV-2025-0918",
    patient: "Marcus Lager",
    datum: "2025-09-23",
    status: "Versendet",
    betrag: 486.25,
    faellig: "2025-10-07",
  },
  {
    id: "INV-2025-0919",
    patient: "Katharina Meier",
    datum: "2025-09-23",
    status: "Entwurf",
    betrag: 187.6,
    faellig: "2025-10-05",
  },
  {
    id: "INV-2025-0920",
    patient: "Fabian Schröder",
    datum: "2025-09-24",
    status: "Versendet",
    betrag: 620.18,
    faellig: "2025-10-08",
  },
];

export const invoicePreview = {
  patient: {
    name: "Marcus Lager",
    geburtsdatum: "02.04.1973",
    versicherung: "Privat",
    adresse: "Mediusstraße 18, 70173 Stuttgart",
  },
  leistungsfall: "Knieschmerzen rechts",
  datum: "24.09.2025",
  positionen: [
    {
      nummer: "302",
      bezeichnung: "Erstuntersuchung",
      faktor: 2.3,
      punktzahl: 160,
      betrag: 28.89,
    },
    {
      nummer: "842",
      bezeichnung: "Sonografie eines Gelenks",
      faktor: 1.8,
      punktzahl: 250,
      betrag: 34.56,
    },
    {
      nummer: "3306",
      bezeichnung: "Injektion in ein großes Gelenk",
      faktor: 2,
      punktzahl: 270,
      betrag: 45.72,
    },
  ],
  material: [
    {
      name: "PRP-Set",
      menge: 1,
      kosten: 78.5,
    },
    {
      name: "Sterilisation",
      menge: 1,
      kosten: 12.8,
    },
  ],
  summen: {
    gesamt: 200.47,
    steuer: 0,
    offen: 200.47,
  },
};
