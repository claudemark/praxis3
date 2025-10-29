import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  Disc,
  Loader2,
  Mic,
  PlayCircle,
  RefreshCw,
  Sparkle,
  StopCircle,
  UploadCloud,
} from "lucide-react";

import type { MedAssistSegment, MedAssistSession, MedAssistSuggestion } from "@/data/medassist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatDate, formatTime } from "@/lib/datetime";
import { cn, formatPercent } from "@/lib/utils";
import type { MedAssistAiSummaryResult } from "@/features/medassist/api/medassist-ai";
import {
  type RecorderStatus,
  type SummaryStatus,
  useMedAssistRecorder,
} from "@/features/medassist/hooks/use-medassist-recorder";
import { useMedAssistStore } from "@/features/medassist/store/medassist-store";

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
  const activeSession = useMedAssistStore((state) => state.activeSession);
  const history = useMedAssistStore((state) => state.history);
  const applyAiSummary = useMedAssistStore((state) => state.applyAiSummary);
  const updateSegment = useMedAssistStore((state) => state.updateSegment);
  const [autoFormatting, setAutoFormatting] = useState(true);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    activeSession.segments[0]?.id ?? null,
  );

  useEffect(() => {
    if (!activeSession.segments.length) {
      setSelectedSegmentId(null);
      return;
    }
    if (!selectedSegmentId || !activeSession.segments.some((segment) => segment.id === selectedSegmentId)) {
      setSelectedSegmentId(activeSession.segments[0]!.id);
    }
  }, [activeSession.segments, selectedSegmentId]);

  const selectedSegment = useMemo(() => {
    if (!activeSession.segments.length) {
      return null;
    }
    return (
      activeSession.segments.find((segment) => segment.id === selectedSegmentId) ??
      activeSession.segments[0] ??
      null
    );
  }, [activeSession.segments, selectedSegmentId]);

  const handleSummary = useCallback(
    (summary: MedAssistAiSummaryResult) => {
      applyAiSummary(summary);
    },
    [applyAiSummary],
  );

  const handleRecorderError = useCallback((message: string) => {
    console.error("[MedAssist Recorder]", message);
  }, []);

  const {
    isSupported: recorderSupported,
    status: recorderStatus,
    summaryStatus,
    isRecording,
    isProcessing,
    error: recorderError,
    elapsedSeconds: liveElapsedSeconds,
    hasRecording,
    start: startRecording,
    stop: stopRecording,
    summarize: summarizeRecording,
    resetError,
  } = useMedAssistRecorder({
    autoFormatting,
    locale: "de-DE",
    patientContext: {
      patient: activeSession.patient,
      arzt: activeSession.arzt,
      sessionId: activeSession.id,
    },
    summarizeOnStop: true,
    onSummary: handleSummary,
    onError: handleRecorderError,
  });

  const recordingElapsed = useMemo(() => {
    const base = activeSession.durationSeconds ?? 0;
    if (isRecording) {
      return base + liveElapsedSeconds;
    }
    return base;
  }, [activeSession.durationSeconds, isRecording, liveElapsedSeconds]);

  const handleToggleRecording = useCallback(async () => {
    resetError();
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, resetError, startRecording, stopRecording]);

  const handleSummarize = useCallback(async () => {
    resetError();
    await summarizeRecording();
  }, [resetError, summarizeRecording]);

  const handleSegmentSelect = useCallback((segment: MedAssistSegment) => {
    setSelectedSegmentId(segment.id);
  }, []);

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
            session={activeSession}
            isRecording={isRecording}
            isSupported={recorderSupported}
            status={recorderStatus}
            summaryStatus={summaryStatus}
            isProcessing={isProcessing}
            error={recorderError}
            elapsedSeconds={recordingElapsed}
            autoFormatting={autoFormatting}
            onAutoFormatting={setAutoFormatting}
            onToggleRecording={handleToggleRecording}
            onSummarize={handleSummarize}
            hasRecording={hasRecording}
          />
          <StructuredComposer
            selected={selectedSegment}
            segments={activeSession.segments}
            lastEdited={activeSession.lastEdited}
            onSelect={handleSegmentSelect}
            onUpdateSegment={updateSegment}
          />
        </div>

        <div className="flex flex-col gap-5">
          <SuggestionsPanel suggestions={activeSession.suggestions} summaryStatus={summaryStatus} />
          <SessionHistory history={history} />
        </div>
      </div>
    </div>
  );
}

function RecordingPanel({
  session,
  isRecording,
  isSupported,
  status,
  summaryStatus,
  isProcessing,
  error,
  elapsedSeconds,
  autoFormatting,
  onAutoFormatting,
  onToggleRecording,
  onSummarize,
  hasRecording,
}: {
  session: MedAssistSession;
  isRecording: boolean;
  isSupported: boolean;
  status: RecorderStatus;
  summaryStatus: SummaryStatus;
  isProcessing: boolean;
  error: string | null;
  elapsedSeconds: number;
  autoFormatting: boolean;
  onAutoFormatting: (value: boolean) => void;
  onToggleRecording: () => Promise<void>;
  onSummarize: () => Promise<void>;
  hasRecording: boolean;
}) {
  const minutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(elapsedSeconds % 60)
    .toString()
    .padStart(2, "0");

  const badgeTone = !isSupported
    ? "bg-muted-foreground/30"
    : summaryStatus === "processing"
      ? "bg-warning"
      : isRecording
        ? "bg-destructive"
        : "bg-success";
  const badgeLabel = !isSupported
    ? "Mikrofon nicht verfuegbar"
    : summaryStatus === "processing"
      ? "Verarbeitung"
      : status === "requesting-permission"
        ? "Zugriff anfordern"
        : isRecording
          ? "Aufnahme aktiv"
          : hasRecording
            ? "Aufnahme bereit"
            : "Bereit";

  const primaryDisabled =
    !isSupported || isProcessing || status === "requesting-permission" || status === "stopping";
  const primaryLabel = !isSupported
    ? "Geraet nicht unterstuetzt"
    : status === "requesting-permission"
      ? "Mikrofon erlauben"
      : status === "stopping"
        ? "Beende Aufnahme..."
        : isProcessing
          ? "Verarbeitung laeuft"
          : isRecording
            ? "Aufnahme stoppen"
            : "Aufnahme starten";
  const primaryIcon =
    isProcessing || status === "requesting-permission" || status === "stopping" ? (
      <Loader2 className="size-5 animate-spin" />
    ) : isRecording ? (
      <StopCircle className="size-5" />
    ) : (
      <PlayCircle className="size-5" />
    );

  const canAddMarker = isRecording && !isProcessing;
  const canSummarize = hasRecording && !isProcessing;
  const summaryLabel = isProcessing ? "Zusammenfassung laeuft..." : "KI Zusammenfassung";
  const summaryIcon = isProcessing ? <Loader2 className="size-5 animate-spin" /> : <Sparkle className="size-5" />;

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
            <span className={cn("inline-flex size-2 rounded-full", badgeTone)}></span>
            {badgeLabel}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-surface-100 px-4 py-2 font-mono text-foreground/80">
            {minutes}:{seconds}
          </span>
          <span className="text-muted-foreground/80">
            Arzt: <strong className="text-foreground/85">{session.arzt}</strong>
          </span>
          <span className="text-muted-foreground/80">
            Patient: <strong className="text-foreground/85">{session.patient.name}</strong>
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-5">
        <div className="rounded-2xl border border-border/40 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4 shadow-inner">
          <div className="flex items-center justify-between text-sm text-muted-foreground/80">
            <span>Rauschunterdrueckung aktiv</span>
            <span>DSGVO Audit Trail erstellt {formatTime(session.lastEdited)}</span>
          </div>
          <div className="mt-4 h-20 rounded-xl bg-black/5">
            <div
              className={cn(
                "h-full w-full rounded-xl bg-gradient-to-r from-primary/40 via-primary/10 to-primary/40",
                isRecording ? "animate-pulse opacity-80" : "opacity-40",
              )}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={onToggleRecording}
            variant={isRecording ? "destructive" : "solid"}
            size="lg"
            className="flex-1 gap-2 rounded-full"
            disabled={primaryDisabled}
          >
            {primaryIcon}
            {primaryLabel}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2 rounded-full"
            disabled={!canAddMarker}
          >
            <Disc className="size-5" /> Marker setzen
          </Button>
          <Button
            onClick={onSummarize}
            variant="outline"
            size="lg"
            className="gap-2 rounded-full"
            disabled={!canSummarize}
          >
            {summaryIcon} {summaryLabel}
          </Button>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          {error ? (
            <span className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive">{error}</span>
          ) : summaryStatus === "processing" ? (
            <span className="rounded-lg bg-primary/10 px-3 py-2 text-primary">
              KI analysiert die Aufnahme und aktualisiert den Befund...
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border/40 bg-surface-100/70 px-4 py-3 text-sm">
          <div className="flex items-center gap-3">
            <Switch checked={autoFormatting} onCheckedChange={onAutoFormatting} aria-label="Auto-Formatierung" />
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
  lastEdited,
  onSelect,
  onUpdateSegment,
}: {
  selected: MedAssistSegment | null;
  segments: MedAssistSegment[];
  lastEdited: string;
  onSelect: (segment: MedAssistSegment) => void;
  onUpdateSegment: (id: string, changes: Partial<Omit<MedAssistSegment, "id">>) => void;
}) {
  if (!segments.length || !selected) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle>Strukturierte Befundausgabe</CardTitle>
          <CardDescription>Anamnese, Befund, Diagnosen und Therapie werden KI-gest�tzt aufbereitet.</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
          Noch keine Segmente verf�gbar. Nehmen Sie eine Sitzung auf, um Inhalte zu generieren.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle>Strukturierte Befundausgabe</CardTitle>
        <CardDescription>Anamnese, Befund, Diagnosen und Therapie werden KI-gest�tzt aufbereitet.</CardDescription>
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
              <p className="text-xs text-muted-foreground/80">
                Bearbeitet {formatDate(lastEdited)} um {formatTime(lastEdited)}
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full">
              Version vergleichen
            </Button>
          </div>
          <Textarea
            value={selected.content}
            onChange={(event) => onUpdateSegment(selected.id, { content: event.target.value })}
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
              Automatische GO� Zuordnung vorbereitet
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
function SuggestionsPanel({
  suggestions,
  summaryStatus,
}: {
  suggestions: MedAssistSuggestion[];
  summaryStatus: SummaryStatus;
}) {
  const icd = suggestions.filter((item) => item.type === "icd");
  const goa = suggestions.filter((item) => item.type === "goa");
  const warnings = suggestions.filter((item) => item.type === "hinweis");
  const hasSuggestions = suggestions.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>KI-Vorschläge</CardTitle>
        <CardDescription>ICD-10, GOÄ und Hinweise mit Confidence-Werten.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {summaryStatus === "processing" ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-primary">
            KI analysiert die aktuelle Aufnahme – Vorschläge werden gleich aktualisiert.
          </div>
        ) : null}
        {hasSuggestions ? (
          <>
            <SuggestionGroup title="Diagnosen" items={icd} tone="primary" />
            <SuggestionGroup title="GOÄ Ziffern" items={goa} tone="secondary" />
            <SuggestionGroup title="Hinweise" items={warnings} tone="warning" />
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 bg-surface-100/60 px-4 py-6 text-center text-sm text-muted-foreground">
            Noch keine KI-Vorschläge verfügbar. Starten Sie eine Aufnahme oder laden Sie Ergebnisse neu.
          </p>
        )}
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
  items: MedAssistSuggestion[];
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
                Confidence {formatPercent(item.confidence ?? 0)}
              </Badge>
            </div>
            {item.description ? (
              <p className="mt-1 text-sm text-muted-foreground/85">{item.description}</p>
            ) : null}
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

function SessionHistory({
  history,
}: {
  history: MedAssistSession[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
        <CardDescription>Verlauf der letzten AI-MedAssist Dokumente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {history.map((session) => {
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


