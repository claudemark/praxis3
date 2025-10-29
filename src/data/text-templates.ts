export type TemplateStatus = "entwurf" | "review" | "freigegeben";

export interface TemplateVariable {
  key: string;
  label: string;
  sample: string;
}

export interface TextTemplate {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  usageCount: number;
  updatedAt: string;
  owner: string;
  status: TemplateStatus;
  tags: string[];
  content: string;
  variables: TemplateVariable[];
}

export const templateCategories = [
  { id: "befund", label: "Befundberichte" },
  { id: "arztbrief", label: "Arztbriefe" },
  { id: "op", label: "OP Aufklärung" },
  { id: "igel", label: "IGeL Angebote" },
  { id: "mail", label: "Patientenkommunikation" },
];

export const textTemplates: TextTemplate[] = [
  {
    id: "TPL-201",
    title: "Postoperative Kontrolle Knie TEP",
    category: "befund",
    subCategory: "Orthopädie",
    usageCount: 46,
    updatedAt: "2025-09-20T12:05:00Z",
    owner: "Dr. Amelie Krause",
    status: "freigegeben",
    tags: ["Post-OP", "Knie", "Standard"],
    content:
      "Sehr geehrte/r {{patient.anrede}} {{patient.nachname}},\n\n" +
      "bei der heutigen Kontrolle sechs Wochen nach Knie-TEP zeigte sich ein reizloser Gelenkstatus. " +
      "Belastungsaufbau bis 80% sowie Fortführung der Physiotherapie nach Schema. " +
      "Kontrolle erneut in {{nextControl.weeks}} Wochen.\n\nMit freundlichen Grüßen\n{{arzt.name}}",
    variables: [
      { key: "patient.anrede", label: "Anrede", sample: "Herr" },
      { key: "patient.nachname", label: "Nachname", sample: "Lehmann" },
      { key: "nextControl.weeks", label: "Kontrollintervall (Wochen)", sample: "4" },
      { key: "arzt.name", label: "Arzt", sample: "Dr. Amelie Krause" },
    ],
  },
  {
    id: "TPL-167",
    title: "IGeL Angebot PRP Knie",
    category: "igel",
    subCategory: "Verkauf",
    usageCount: 18,
    updatedAt: "2025-09-18T08:32:00Z",
    owner: "Marcus Linde",
    status: "review",
    tags: ["PRP", "Knie", "IGeL"],
    content:
      "Für {{patient.vorname}} {{patient.nachname}} empfehlen wir ein PRP-Protokoll (3 Sitzungen).\n" +
      "Honorar gemäß GOÄ 3306, 302, Materialkosten {{material.summe}} EUR. Nachinformiert am {{angebot.datum}}.",
    variables: [
      { key: "patient.vorname", label: "Vorname", sample: "Katja" },
      { key: "patient.nachname", label: "Nachname", sample: "Meier" },
      { key: "material.summe", label: "Materialkosten", sample: "189" },
      { key: "angebot.datum", label: "Datum", sample: "24.09.2025" },
    ],
  },
  {
    id: "TPL-154",
    title: "OP Aufklärung Schulterarthroskopie",
    category: "op",
    subCategory: "Aufklärung",
    usageCount: 32,
    updatedAt: "2025-09-12T15:40:00Z",
    owner: "Dr. Sofie Nguyen",
    status: "freigegeben",
    tags: ["OP", "Schulter", "Aufklärung"],
    content:
      "Bei {{patient.vorname}} {{patient.nachname}} wurde die Indikation zur Schulterarthroskopie gestellt. " +
      "Risiken (Infekt, Nachblutung, Nervenverletzung) erläutert, Einverständnis liegt vor. " +
      "Nüchternheit ab {{op.nuechternAb}}, Vorstellung OP Vorbereitung am {{op.vorstellung}}.",
    variables: [
      { key: "patient.vorname", label: "Vorname", sample: "Lena" },
      { key: "patient.nachname", label: "Nachname", sample: "Böttcher" },
      { key: "op.nuechternAb", label: "Nüchtern ab", sample: "22:00 Uhr" },
      { key: "op.vorstellung", label: "Vorstellung", sample: "28.09.2025" },
    ],
  },
  {
    id: "TPL-143",
    title: "Physiotherapie Empfehlung Sprunggelenk",
    category: "befund",
    subCategory: "Physiotherapie",
    usageCount: 22,
    updatedAt: "2025-09-21T11:12:00Z",
    owner: "Lena Böttcher",
    status: "entwurf",
    tags: ["Physio", "Sprunggelenk"],
    content:
      "Empfohlen werden 2x/Woche propriozeptives Training, \n" +
      "Belastungsaufbau nach Schmerzskala (max 4/10). Kontrolle in {{nextControl.weeks}} Wochen.",
    variables: [
      { key: "nextControl.weeks", label: "Kontrollintervall (Wochen)", sample: "3" },
    ],
  },
];

export const favoriteTemplates = ["TPL-201", "TPL-167"];
