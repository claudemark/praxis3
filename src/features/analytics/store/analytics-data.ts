export type TimeframeKey = "30d" | "90d" | "12m";

export interface TimeSeriesPoint {
  date: string; // ISO date at month boundary
  revenue: number;
  margin: number;
  privateShare: number;
  newPatients: number;
  avgBasket: number;
}

export interface ServiceMixEntry {
  id: string;
  name: string;
  category: string;
  revenue: number;
  delta: number;
  margin: number;
}

export interface StaffPerformanceEntry {
  employeeId: string;
  name: string;
  role: string;
  revenue: number;
  conversionRate: number;
  satisfaction: number;
}

export interface CollectionRiskEntry {
  payer: string;
  openAmount: number;
  overdueDays: number;
  trend: "up" | "down" | "stable";
}

export const monthlyTimeSeries: TimeSeriesPoint[] = [
  { date: "2024-01-01", revenue: 152000, margin: 0.44, privateShare: 0.32, newPatients: 86, avgBasket: 185 },
  { date: "2024-02-01", revenue: 158500, margin: 0.45, privateShare: 0.34, newPatients: 92, avgBasket: 189 },
  { date: "2024-03-01", revenue: 166200, margin: 0.46, privateShare: 0.33, newPatients: 96, avgBasket: 191 },
  { date: "2024-04-01", revenue: 161400, margin: 0.44, privateShare: 0.31, newPatients: 88, avgBasket: 187 },
  { date: "2024-05-01", revenue: 170950, margin: 0.47, privateShare: 0.35, newPatients: 99, avgBasket: 193 },
  { date: "2024-06-01", revenue: 178300, margin: 0.48, privateShare: 0.36, newPatients: 104, avgBasket: 198 },
  { date: "2024-07-01", revenue: 184600, margin: 0.49, privateShare: 0.37, newPatients: 108, avgBasket: 201 },
  { date: "2024-08-01", revenue: 176800, margin: 0.46, privateShare: 0.35, newPatients: 101, avgBasket: 195 },
  { date: "2024-09-01", revenue: 188450, margin: 0.5, privateShare: 0.38, newPatients: 112, avgBasket: 204 },
  { date: "2024-10-01", revenue: 194200, margin: 0.51, privateShare: 0.39, newPatients: 118, avgBasket: 207 },
  { date: "2024-11-01", revenue: 202300, margin: 0.52, privateShare: 0.4, newPatients: 121, avgBasket: 212 },
  { date: "2024-12-01", revenue: 208900, margin: 0.53, privateShare: 0.41, newPatients: 129, avgBasket: 218 },
  { date: "2025-01-01", revenue: 214300, margin: 0.54, privateShare: 0.42, newPatients: 132, avgBasket: 220 },
  { date: "2025-02-01", revenue: 221700, margin: 0.55, privateShare: 0.43, newPatients: 135, avgBasket: 223 },
  { date: "2025-03-01", revenue: 229400, margin: 0.56, privateShare: 0.44, newPatients: 141, avgBasket: 227 },
  { date: "2025-04-01", revenue: 224900, margin: 0.55, privateShare: 0.43, newPatients: 138, avgBasket: 225 },
  { date: "2025-05-01", revenue: 236600, margin: 0.57, privateShare: 0.45, newPatients: 146, avgBasket: 231 },
  { date: "2025-06-01", revenue: 244800, margin: 0.58, privateShare: 0.46, newPatients: 151, avgBasket: 235 },
  { date: "2025-07-01", revenue: 252100, margin: 0.58, privateShare: 0.47, newPatients: 156, avgBasket: 239 },
];

export const serviceMix: Record<TimeframeKey, ServiceMixEntry[]> = {
  "30d": [
    { id: "igel-prp", name: "PRP Knie", category: "Selbstzahler", revenue: 48200, delta: 0.12, margin: 0.58 },
    { id: "igel-hyaluron", name: "Hyaluron Knie", category: "Selbstzahler", revenue: 34100, delta: 0.08, margin: 0.53 },
    { id: "swt", name: "Sto?wellentherapie", category: "Selbstzahler", revenue: 19800, delta: 0.04, margin: 0.61 },
    { id: "priv-checkup", name: "Privat Check-up", category: "Diagnostik", revenue: 16700, delta: -0.03, margin: 0.45 },
  ],
  "90d": [
    { id: "igel-prp", name: "PRP Knie", category: "Selbstzahler", revenue: 126500, delta: 0.09, margin: 0.57 },
    { id: "igel-hyaluron", name: "Hyaluron Knie", category: "Selbstzahler", revenue: 97800, delta: 0.07, margin: 0.52 },
    { id: "rehab", name: "Reha Pakete", category: "Therapie", revenue: 74500, delta: 0.05, margin: 0.43 },
    { id: "priv-preop", name: "Pre-OP Coaching", category: "Therapie", revenue: 52100, delta: 0.02, margin: 0.49 },
  ],
  "12m": [
    { id: "igel-prp", name: "PRP Knie", category: "Selbstzahler", revenue: 438200, delta: 0.14, margin: 0.56 },
    { id: "igel-hyaluron", name: "Hyaluron Knie", category: "Selbstzahler", revenue: 372400, delta: 0.11, margin: 0.51 },
    { id: "priv-checkup", name: "Privat Check-up", category: "Diagnostik", revenue: 204600, delta: 0.03, margin: 0.46 },
    { id: "rehab", name: "Reha Pakete", category: "Therapie", revenue: 187900, delta: 0.05, margin: 0.44 },
  ],
};

export const staffPerformance: StaffPerformanceEntry[] = [
  { employeeId: "emp-krause", name: "Dr. Amelie Krause", role: "Orthopädin", revenue: 112400, conversionRate: 0.71, satisfaction: 4.9 },
  { employeeId: "emp-vogt", name: "Dr. Marten Vogt", role: "Unfallchirurg", revenue: 98600, conversionRate: 0.66, satisfaction: 4.6 },
  { employeeId: "emp-boettcher", name: "Lena Böttcher", role: "Physiotherapie", revenue: 64400, conversionRate: 0.62, satisfaction: 4.8 },
  { employeeId: "emp-linde", name: "Marcus Linde", role: "Praxismanager", revenue: 42100, conversionRate: 0.58, satisfaction: 4.5 },
];

export const collectionRisks: CollectionRiskEntry[] = [
  { payer: "Privat Versicherer A", openAmount: 18200, overdueDays: 28, trend: "down" },
  { payer: "BG Klinik Frankfurt", openAmount: 12400, overdueDays: 16, trend: "stable" },
  { payer: "Privatpatient:innen", openAmount: 8600, overdueDays: 9, trend: "up" },
  { payer: "Krankenkasse Plus", openAmount: 5400, overdueDays: 35, trend: "down" },
];
