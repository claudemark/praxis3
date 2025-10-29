export type MedAssistStatus = "entwurf" | "freigabe" | "abgeschlossen";

export interface MedAssistSegment {
  id: string;
  label: string;
  content: string;
  risk?: "unsicher" | "hinweis";
  suggestions?: string[];
}

export interface MedAssistSuggestion {
  id: string;
  type: "icd" | "goa" | "hinweis";
  code?: string;
  title: string;
  confidence: number;
  description: string;
}

export interface MedAssistSession {
  id: string;
  patient: {
    name: string;
    geburtsdatum: string;
    versicherung: string;
    vorgang: string;
  };
  arzt: string;
  status: MedAssistStatus;
  createdAt: string;
  lastEdited: string;
  durationSeconds: number;
  transcript: string;
  segments: MedAssistSegment[];
  suggestions: MedAssistSuggestion[];
}

export const activeSession: MedAssistSession = {
  id: "SESSION-4283",
  patient: {
    name: "Marc Lehmann",
    geburtsdatum: "19.08.1981",
    versicherung: "Privat",
    vorgang: "Post-OP Kontrolle Knie rechts",
  },
  arzt: "Dr. Amelie Krause",
  status: "freigabe",
  createdAt: "2025-09-24T09:05:00Z",
  lastEdited: "2025-09-24T09:28:00Z",
  durationSeconds: 870,
  transcript:
    "Patient berichtet über belastungsabhängige Schmerzen im rechten Knie, v. a. Treppensteigen. Nach OP vor 6 Wochen. Keine Schwellung." +
    " Objektiv leichte Ergussbildung, Flexion bis 110°, Streckung frei. Druckdolenz medial, kein Krepitus. Nachbehandlung: Physiotherapie, Lymphdrainage." +
    " Empfehlung: Belastung anpassen, isometrische Übungen, Kontrolle in 2 Wochen, GOÄ 3306 bei PRP in Erwägung.",
  segments: [
    {
      id: "seg-anamnese",
      label: "Anamnese",
      content:
        "Belastungsabhängige Schmerzen und Instabilitätsgefühl sechs Wochen nach medialer Meniskusrefixation. Keine Rötung, Fieber oder Ruheschmerz.",
    },
    {
      id: "seg-befund",
      label: "Klinischer Befund",
      content:
        "Leichtes Gelenkergusszeichen, Umfangdifferenz +1,2 cm, Flexion 0-110°, Varus/Valgus stabil. Druckdolenz medialer Gelenkspalt.",
      risk: "hinweis",
      suggestions: ["Kontrolle Erguss in 7 Tagen", "Sonografie zur Verlaufskontrolle"],
    },
    {
      id: "seg-diagnosen",
      label: "Diagnosen",
      content: "S83.241 – Riss des medialen Meniskus, Nachsorgephase. M25.461 – Gelenkerguss Knie rechts.",
    },
    {
      id: "seg-therapie",
      label: "Therapieplan",
      content:
        "Weiterführung Physiotherapie, Lymphdrainage 2x/Woche, isometrisches Quadrizepstraining, Belastung auf 50% reduzieren, Re-Check in 14 Tagen.",
    },
  ],
  suggestions: [
    {
      id: "sug-icd-1",
      type: "icd",
      code: "S83.241",
      title: "Riss des medialen Meniskus",
      confidence: 0.92,
      description: "Nachsorge nach arthroskopischer Meniskusrefixation, Seite rechts.",
    },
    {
      id: "sug-icd-2",
      type: "icd",
      code: "M25.461",
      title: "Gelenkerguss Knie rechts",
      confidence: 0.81,
      description: "Ergussbildung passend zur Nachsorge, keine Infektzeichen angegeben.",
    },
    {
      id: "sug-goa-1",
      type: "goa",
      code: "302",
      title: "Erstuntersuchung / Kontrolle",
      confidence: 0.74,
      description: "Kontrolluntersuchung postoperativ mit Dokumentation.",
    },
    {
      id: "sug-goa-2",
      type: "goa",
      code: "3306",
      title: "Injektion in großes Gelenk",
      confidence: 0.58,
      description: "PRP ggf. erwägen bei persistierender Synovitis.",
    },
    {
      id: "sug-warning-1",
      type: "hinweis",
      title: "Dokumentationslücke",
      confidence: 0.42,
      description: "Anamnese enthält keine Schmerzskala – bitte ergänzen (VAS).",
    },
  ],
};

export const sessionHistory: MedAssistSession[] = [
  {
    id: "SESSION-4282",
    patient: {
      name: "Katja Meier",
      geburtsdatum: "12.02.1976",
      versicherung: "Privat",
      vorgang: "HWS Blockade",
    },
    arzt: "Dr. Marten Vogt",
    status: "abgeschlossen",
    createdAt: "2025-09-23T14:15:00Z",
    lastEdited: "2025-09-23T14:52:00Z",
    durationSeconds: 1320,
    transcript: "Chronische Nackenschmerzen, manualtherapeutische Mobilisation, keine Ausfälle.",
    segments: [],
    suggestions: [],
  },
  {
    id: "SESSION-4281",
    patient: {
      name: "Jonas Rehm",
      geburtsdatum: "03.05.1990",
      versicherung: "BG",
      vorgang: "Arbeitsunfall – Sprunggelenk",
    },
    arzt: "Dr. Sofie Nguyen",
    status: "entwurf",
    createdAt: "2025-09-23T09:40:00Z",
    lastEdited: "2025-09-23T10:12:00Z",
    durationSeconds: 1040,
    transcript: "Umknicktrauma rechts, MRT geplant, LSM Stabilisation.",
    segments: [],
    suggestions: [],
  },
];
