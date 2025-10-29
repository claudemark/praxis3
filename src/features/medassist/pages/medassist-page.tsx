import { useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  Disc,
  Mic,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Sparkle,
  UploadCloud,
} from "lucide-react";

import { activeSession, sessionHistory, type MedAssistSegment } from "@/data/medassist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatDate, formatTime } from "@/lib/datetime";
import { cn, formatPercent } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  entwurf: "Entwurf",
  freigabe: "Zur Freigabe",
  abgeschlossen: "Abgeschlossen",
};

const statusTone: Record<string, { badge: string; dot: string }> = {
  entwurf: { badge: "bg-warning/25 text-warning-foreground", dot: "bg-warning" },
  freigabe: { badge: "bg-secondary/15 text-secondary", dot: "bg-secondary" },
  abgeschlossen: { badge: "bg-success/15 text-success", dot: "bg-success" },
};

export function MedAssistPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [autoFormatting, setAutoFormatting] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<MedAssistSegment>(activeSession.segments[0]!);

  const recordingElapsed = useMemo(() => {
    const base = activeSession.durationSeconds;
    return isRecording ? base + 12 : base;
  }, [isRecording]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">AI MedAssist</h1>
          <p className="text-sm text-muted-foreground">
            Echtzeit-Spracherfassung mit strukturierten Befunden, ICD- und GOÄ-Vorschlägen.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-full" size="sm">
            <UploadCloud className="size-4" /> Audiodatei hochladen
          </Button>
          <Button variant="outline" className="gap-2 rounded-full" size="sm">
            <RefreshCw className="size-4" /> Sitzung neu analysieren
          </Button>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <div className="flex flex-col gap-5">
          <RecordingPanel
            isRecording={isRecording}
            onToggle={() => setIsRecording((prev) => !prev)}
            elapsedSeconds={recordingElapsed}
            autoFormatting={autoFormatting}
            onAutoFormatting={setAutoFormatting}
          />
          <StructuredComposer
            selected={selectedSegment}
            segments={activeSession.segments}
            onSelect={setSelectedSegment}
          />
        </div>

        <div className="flex flex-col gap-5">
          <SuggestionsPanel />
          <SessionHistory />
        </div>
      </div>
    </div>
  );
}

function RecordingPanel({
  isRecording,
  onToggle,
  elapsedSeconds,
  autoFormatting,
  onAutoFormatting,
}: {
  isRecording: boolean;
  onToggle: () => void;
  elapsedSeconds: number;
  autoFormatting: boolean;
  onAutoFormatting: (value: boolean) => void;
}) {
  const minutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(elapsedSeconds % 60)
    .toString()
    .padStart(2, "0");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 border-b border-border/50 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mic className="size-5" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-lg">Live-Diktat</CardTitle>
              <CardDescription>Steuerung des aktuellen Mitschnitts inkl. Privacy-Schutz.</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-2 rounded-full border-primary/30 text-primary">
            <span className={cn("inline-flex size-2 rounded-full", isRecording ? "bg-destructive" : "bg-success")}></span>
            {isRecording ? "Aufnahme aktiv" : "Bereit"}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-surface-100 px-4 py-2 font-mono text-foreground/80">{minutes}:{seconds}</span>
          <span className="text-muted-foreground/80">
            Arzt: <strong className="text-foreground/85">{activeSession.arzt}</strong>
          </span>
          <span className="text-muted-foreground/80">
            Patient: <strong className="text-foreground/85">{activeSession.patient.name}</strong>
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-5">
        <div className="rounded-2xl border border-border/40 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4 shadow-inner">
          <div className="flex items-center justify-between text-sm text-muted-foreground/80">
            <span>Rauschunterdrückung aktiv</span>
            <span>DSGVO Audit Trail erstellt {formatTime(activeSession.lastEdited)}</span>
          </div>
          <div className="mt-4 h-20 rounded-xl bg-black/5">
            <div className="h-full w-full animate-pulse rounded-xl bg-gradient-to-r from-primary/40 via-primary/10 to-primary/40 opacity-70" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={onToggle}
            variant={isRecording ? "destructive" : "solid"}
            size="lg"
            className="flex-1 gap-2 rounded-full"
          >
            {isRecording ? <PauseCircle className="size-5" /> : <PlayCircle className="size-5" />}
            {isRecording ? "Aufnahme pausieren" : "Aufnahme starten"}
          </Button>
          <Button variant="outline" size="lg" className="flex-1 gap-2 rounded-full">
            <Disc className="size-5" /> Marker setzen
          </Button>
          <Button variant="outline" size="lg" className="gap-2 rounded-full">
            <Sparkle className="size-5" /> KI Zusammenfassung
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border/40 bg-surface-100/70 px-4 py-3 text-sm">
          <div className="flex items-center gap-3">
            <Switch
              checked={autoFormatting}
              onCheckedChange={onAutoFormatting}
              aria-label="Auto-Formatierung"
            />
            <span className="text-muted-foreground">Automatische Strukturierung aktivieren</span>
          </div>
          <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
            <ClipboardCheck className="size-4" /> Datenschutz-Protokoll einsehen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StructuredComposer({
  selected,
  segments,
  onSelect,
}: {
  selected: MedAssistSegment;
  segments: MedAssistSegment[];
  onSelect: (segment: MedAssistSegment) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle>Strukturierte Befundausgabe</CardTitle>
        <CardDescription>Anamnese, Befund, Diagnosen und Therapie werden KI-gestützt aufbereitet.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col gap-2">
          {segments.map((segment) => (
            <button
              key={segment.id}
              onClick={() => onSelect(segment)}
              className={cn(
                "w-full rounded-xl border px-3 py-3 text-left transition",
                "hover:border-primary/30 hover:bg-primary/5",
                segment.id === selected.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/40 bg-surface-50",
              )}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{segment.label}</span>
                {segment.risk ? (
                  <Badge size="sm" variant="muted" className="bg-warning/20 text-warning-foreground">
                    {segment.risk === "unsicher" ? "Unsicherheit" : "Hinweis"}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">{segment.content}</p>
            </button>
          ))}
        </aside>
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-foreground/90">{selected.label}</h3>
              <p className="text-xs text-muted-foreground/80">Bearbeitet {formatDate(activeSession.lastEdited)} um {formatTime(activeSession.lastEdited)}</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full">
              Version vergleichen
            </Button>
          </div>
          <Textarea
            defaultValue={selected.content}
            className="min-h-[220px] border border-primary/25 bg-white/90"
          />
          {selected.suggestions && selected.suggestions.length ? (
            <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
              <p className="font-semibold text-accent-foreground">Empfehlungen</p>
              <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                {selected.suggestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" size="sm">
              DSGVO Audit Trail aktiv
            </Badge>
            <Badge variant="outline" size="sm">
              Automatische GOÄ Zuordnung vorbereitet
            </Badge>
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <Activity className="size-3.5" /> Verlauf
            </Button>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function SuggestionsPanel() {
  const icd = activeSession.suggestions.filter((item) => item.type === "icd");
  const goa = activeSession.suggestions.filter((item) => item.type === "goa");
  const warnings = activeSession.suggestions.filter((item) => item.type === "hinweis");

  return (
    <Card>
      <CardHeader>
        <CardTitle>KI-Vorschläge</CardTitle>
        <CardDescription>ICD-10, GOÄ und Hinweise mit Confidence-Werten.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <SuggestionGroup title="Diagnosen" items={icd} tone="primary" />
        <SuggestionGroup title="GOÄ Ziffern" items={goa} tone="secondary" />
        <SuggestionGroup title="Hinweise" items={warnings} tone="warning" />
      </CardContent>
    </Card>
  );
}

function SuggestionGroup({
  title,
  items,
  tone,
}: {
  title: string;
  items: typeof activeSession.suggestions;
  tone: "primary" | "secondary" | "warning";
}) {
  if (!items.length) return null;

  const toneStyles: Record<string, string> = {
    primary: "border-primary/30 bg-primary/5",
    secondary: "border-secondary/30 bg-secondary/5",
    warning: "border-warning/30 bg-warning/10",
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-xl border px-4 py-3 shadow-sm transition hover:shadow-md",
              toneStyles[tone],
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {item.code ? <span className="font-semibold text-foreground/90">{item.code}</span> : null}
                <span className="font-semibold text-foreground/90">{item.title}</span>
              </div>
              <Badge variant="muted" size="sm">
                Confidence {formatPercent(item.confidence)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground/85">{item.description}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground/70">
              <Button variant="outline" size="xs" className="rounded-full">
                Übernehmen
              </Button>
              <Button variant="ghost" size="xs" className="rounded-full">
                Ablehnen
              </Button>
              <Button variant="ghost" size="xs" className="rounded-full">
                Begründen
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
        <CardDescription>Verlauf der letzten AI-MedAssist Dokumente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {sessionHistory.map((session) => {
          const tone = statusTone[session.status];
          return (
            <div
              key={session.id}
              className="flex flex-col gap-2 rounded-xl border border-border/40 bg-surface-50 px-3 py-3 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground/90">{session.patient.name}</p>
                  <p className="text-xs text-muted-foreground/70">{session.patient.vorgang}</p>
                </div>
                <Badge size="sm" className={tone.badge}>
                  {statusLabel[session.status]}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/70">
                <span className="inline-flex items-center gap-1">
                  <span className={cn("size-2 rounded-full", tone.dot)} /> {formatDate(session.createdAt)}
                </span>
                <span>Dauer {Math.round(session.durationSeconds / 60)} Min</span>
                <span>Behandelnder Arzt: {session.arzt}</span>
              </div>
            </div>
          );
        })}
        <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
          <CheckCircle2 className="size-4" /> Archiv öffnen
        </Button>
      </CardContent>
    </Card>
  );
}
