export interface KiPrompt {
  id: string;
  title: string;
  scope: string;
  prompt: string;
  useCase: string;
}

export const kiPrompts: KiPrompt[] = [
  {
    id: "prompt-befund",
    title: "Befund zusammenfassen",
    scope: "AI MedAssist",
    prompt:
      "Formuliere einen prägnanten orthopädischen Befund basierend auf folgenden Stichpunkten. Nutze Fachsprache, strukturiere nach Anamnese, Befund, Diagnose, Therapie und schlage passende GOÄ-Ziffern vor: \n{{input}}",
    useCase: "Ärztliche Dokumentation",
  },
  {
    id: "prompt-igel",
    title: "IGeL Angebot",
    scope: "Praxismanagement",
    prompt:
      "Erstelle ein transparentes IGeL-Angebot für {{leistung}} inklusive Indikation, Nutzenargumentation, Risikoaufklärung und Kostenaufschlüsselung. Nutze wertschätzende Sprache und schließe mit einer Einverständniserklärung ab.",
    useCase: "Patientenkommunikation",
  },
  {
    id: "prompt-lager",
    title: "Lagerwarnung formulieren",
    scope: "Controlling",
    prompt:
      "Formuliere eine proaktive Lagerwarnung für {{artikel}}, wenn der Bestand unter {{schwelle}} fällt. Nenne Verbrauch pro Woche, empfohlene Bestellmenge und Lieferant mit bester Kondition.",
    useCase: "Materialmanagement",
  },
  {
    id: "prompt-team",
    title: "Teambriefing Workflow",
    scope: "Leitung",
    prompt:
      "Erstelle ein tägliches Morgenbriefing für das orthopädische Team. Nutze folgende Kennzahlen: {{kpis}}. Formatiere in Checkpoints (OP, Sprechstunde, Physio, Verwaltung) und markiere kritische Punkte in Großbuchstaben.",
    useCase: "Teamkoordination",
  },
];
