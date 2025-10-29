export const dailySnapshot = {
  datum: "Mittwoch, 24. September 2025",
  patientenHeute: 78,
  operationen: 12,
  auslastung: 0.86,
  dokumentationsquote: 0.52,
  abrechnungsgenauigkeit: 0.992,
};

export const revenueTrend = [
  { monat: "Apr", goa: 18400, igel: 6200 },
  { monat: "Mai", goa: 19250, igel: 7100 },
  { monat: "Jun", goa: 17840, igel: 6900 },
  { monat: "Jul", goa: 21020, igel: 7600 },
  { monat: "Aug", goa: 22410, igel: 8200 },
  { monat: "Sep", goa: 23840, igel: 9150 },
];

export const waitingTimeTrend = [
  { slot: "08:00", minuten: 24 },
  { slot: "09:00", minuten: 28 },
  { slot: "10:00", minuten: 19 },
  { slot: "11:00", minuten: 16 },
  { slot: "12:00", minuten: 15 },
  { slot: "13:00", minuten: 18 },
  { slot: "14:00", minuten: 21 },
  { slot: "15:00", minuten: 17 },
  { slot: "16:00", minuten: 14 },
];

export const serviceMix = [
  { name: "IGeL", wert: 38 },
  { name: "GOÄ Konsultation", wert: 24 },
  { name: "OP Erlöse", wert: 28 },
  { name: "Material", wert: 10 },
];

export const complianceScores = [
  { name: "Prä-OP", wert: 92 },
  { name: "Intra-OP", wert: 88 },
  { name: "Post-OP", wert: 95 },
  { name: "Trauma", wert: 86 },
];

export const alerts = [
  {
    id: "alert-1",
    title: "Materialbestand PRP Triterp",
    description: "Nur noch 9 Sets verfügbar. Automatische Nachbestellung empfohlen.",
    type: "warning" as const,
    timestamp: "vor 12 Minuten",
  },
  {
    id: "alert-2",
    title: "Dokumentationslücke",
    description: "4 Befunde warten auf ärztliche Freigabe in AI MedAssist.",
    type: "info" as const,
    timestamp: "vor 24 Minuten",
  },
  {
    id: "alert-3",
    title: "GOÄ Kombination prüfen",
    description: "Ziffer 3306 + 602 nur mit Begründung abrechenbar.",
    type: "danger" as const,
    timestamp: "vor 1 Stunde",
  },
];

export const physicianLeaderboard = [
  {
    name: "Dr. Amelie Krause",
    fallzahlen: 42,
    igelRate: 0.36,
    dokumentationszeit: 0.42,
  },
  {
    name: "Dr. Marten Vogt",
    fallzahlen: 37,
    igelRate: 0.28,
    dokumentationszeit: 0.51,
  },
  {
    name: "Dr. Sofie Nguyen",
    fallzahlen: 31,
    igelRate: 0.18,
    dokumentationszeit: 0.38,
  },
];

export const timelineEvents = [
  {
    id: "timeline-1",
    time: "07:45",
    title: "Morgen-Briefing",
    description: "Statuscheck Prä-OP, Tagesplanung bestätigt.",
  },
  {
    id: "timeline-2",
    time: "09:15",
    title: "AI MedAssist Review",
    description: "Dr. Krause prüft 4 Befunde.",
  },
  {
    id: "timeline-3",
    time: "11:30",
    title: "IGeL Review",
    description: "PRP Upsell Analyse September.",
  },
  {
    id: "timeline-4",
    time: "13:00",
    title: "OP Slot Wechsel",
    description: "Trauma-Fall in OP 1 verlegt.",
  },
];
