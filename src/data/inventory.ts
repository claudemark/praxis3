export type InventoryStatus = "ok" | "low" | "critical" | "reserved";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  vendor: string;
  unitCost: number;
  stock: number;
  minStock: number;
  unit: string;
  location: string;
  lot: string;
  expiry: string;
  status: InventoryStatus;
  weeklyUsage: number;
  reserved: number;
  linkedPatients: number;
  lastMovement: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierNotes?: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: "ein" | "aus" | "anpassung";
  quantity: number;
  actor: string;
  note: string;
  timestamp: string;
}

export const inventoryMetrics = {
  lowStock: 7,
  criticalImplants: 3,
  avgWeeklyConsumption: 128,
  pendingOrders: 5,
};

export const inventoryItems: InventoryItem[] = [
  {
    id: "INV-3051",
    name: "Knie TEP Implantat Größe M",
    category: "Implantate",
    vendor: "OrthoMed GmbH",
    unitCost: 1340.5,
    stock: 9,
    minStock: 12,
    unit: "Stück",
    location: "Lager A / Regal 3",
    lot: "LOT-21B-998",
    expiry: "2026-04-30",
    status: "low",
    weeklyUsage: 5,
    reserved: 4,
    linkedPatients: 2,
    lastMovement: "2025-09-23T15:20:00Z",
    supplierEmail: "bestellung@orthomed.de",
    supplierPhone: "+49 211 99811-0",
    supplierNotes: "Rahmenvertrag #OP-558 läuft bis 12/2026",
  },
  {
    id: "INV-2860",
    name: "PRP Einmalsystem",
    category: "Verbrauchsmaterial",
    vendor: "BioPlasma",
    unitCost: 68.9,
    stock: 18,
    minStock: 20,
    unit: "Sets",
    location: "Lager B / Regal 1",
    lot: "LOT-PRP-452",
    expiry: "2025-12-15",
    status: "ok",
    weeklyUsage: 7,
    reserved: 3,
    linkedPatients: 5,
    lastMovement: "2025-09-24T08:12:00Z",
    supplierEmail: "sales@bioplasma.de",
    supplierPhone: "+49 30 4512 7710",
  },
  {
    id: "INV-2799",
    name: "Titan-Schrauben 4.5mm",
    category: "Implantate",
    vendor: "OrthoFix",
    unitCost: 24.75,
    stock: 32,
    minStock: 25,
    unit: "Stück",
    location: "Lager A / Regal 5",
    lot: "LOT-TI-771",
    expiry: "2027-01-01",
    status: "ok",
    weeklyUsage: 12,
    reserved: 6,
    linkedPatients: 4,
    lastMovement: "2025-09-22T10:05:00Z",
    supplierEmail: "auftrag@orthofix.eu",
  },
  {
    id: "INV-2710",
    name: "Sterile Verbände XL",
    category: "Pflege",
    vendor: "Sanicare",
    unitCost: 12.1,
    stock: 48,
    minStock: 30,
    unit: "Pack",
    location: "Lager C / Regal 2",
    lot: "LOT-VB-331",
    expiry: "2026-09-01",
    status: "ok",
    weeklyUsage: 14,
    reserved: 8,
    linkedPatients: 12,
    lastMovement: "2025-09-21T09:32:00Z",
    supplierEmail: "dispo@sanicare.de",
  },
  {
    id: "INV-2622",
    name: "Arthroskopie Flüssigkeit 3L",
    category: "OP Bedarf",
    vendor: "MediFlow",
    unitCost: 32.8,
    stock: 6,
    minStock: 10,
    unit: "Kanister",
    location: "Lager OP / Regal 1",
    lot: "LOT-AF-629",
    expiry: "2025-11-10",
    status: "critical",
    weeklyUsage: 9,
    reserved: 3,
    linkedPatients: 1,
    lastMovement: "2025-09-24T07:48:00Z",
    supplierEmail: "order@mediflow.de",
    supplierPhone: "+49 69 8812 443",
    supplierNotes: "Expresslieferung innerhalb 48h verfügbar",
  },
];

export const inventoryMovements: InventoryMovement[] = [
  {
    id: "MOV-1189",
    itemId: "INV-3051",
    type: "aus",
    quantity: 2,
    actor: "Nora Feld",
    note: "OP Knie TEP – Patient 20451",
    timestamp: "2025-09-23T15:20:00Z",
  },
  {
    id: "MOV-1185",
    itemId: "INV-2860",
    type: "aus",
    quantity: 3,
    actor: "Marcus Linde",
    note: "PRP Paket Wochenplan",
    timestamp: "2025-09-24T08:12:00Z",
  },
  {
    id: "MOV-1181",
    itemId: "INV-2799",
    type: "ein",
    quantity: 20,
    actor: "Jonas Rehm",
    note: "Wareneingang Bestellung OR-5521",
    timestamp: "2025-09-22T09:55:00Z",
  },
  {
    id: "MOV-1176",
    itemId: "INV-2622",
    type: "anpassung",
    quantity: -1,
    actor: "Jonas Rehm",
    note: "Beschädigter Kanister abgeschrieben",
    timestamp: "2025-09-21T11:24:00Z",
  },
];
