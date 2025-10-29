PraxisPro Manager – Phase 2 Scope
=================================

Module 4 – AI MedAssist Dokumentation
-------------------------------------
- Live Diktat-Steuerung mit Aufnahme-Status, Timer, Mini-Wellenform.
- Strukturierter Befund-Composer (Anamnese, Befund, Diagnosen mit ICD-10 Vorschlägen, Therapie, GOÄ-Vorschläge).
- Unsicherheit-Highlights, Arztfreigabe-Checkliste, Export-Aktionen (PVS Copy, Arztbrief, GOÄ Übergabe).
- Sitzungs-Historie mit Status (Entwurf, Zur Freigabe, Abgeschlossen).

Module 5 – Intelligente Textbausteine
-------------------------------------
- Filterbare Bibliothek nach Kategorie, Fachgebiet, Nutzungshäufigkeit.
- Detail-Drawer mit Variablenvorschau und Platzhalter {{patient.name}}.
- Builder-Modus: WYSIWYG-nahe Textarea, Snippet-Vorschau, Freigabe-Workflow.
- Favoriten & Mehrfachauswahl für Sammel-Export.

Module 6 – Lagerverwaltung Lite
-------------------------------
- Bestandstisch mit kritischen Leveln, Barcode-Scan Platzhalter, Chargen/Verfallsdaten.
- Materialdetail-Modals mit Patientenzuordnungshistorie.
- Schnellaktionen: Nachbestellen, Verbrauch buchen, Audit-Log.
- Kennzahlenkarten (Low-Stock, Verbrauch/Woche, geblockte Implantate).

Shared Additions
----------------
- Mock-Datenquellen in src/data/medassist.ts, src/data/text-templates.ts, src/data/inventory.ts.
- Reusable Status-Badges, Pills, Timeline Strips.
- In-memory Stores (Zustand) zur Simulation grundlegender Mutationen.
- Zusätzliche Vitest-Abdeckung für Format- und Modul-Helper.

Deliverables
------------
1. Navigierbare Seiten mit responsiven Layouts, Tabellen, Charts und Interaktionen.
2. Placeholder-Service-Layer (src/services/mock-api.ts) für spätere API-Anbindung.
3. Aktualisierte Dokumentation und Entwicklerhinweise für Onboarding.
