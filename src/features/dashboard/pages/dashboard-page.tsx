import type { ReactNode } from "react";

import { ArrowUpRight, CalendarRange, ClipboardCheck, FileText, Headphones } from "lucide-react";

import {
  alerts,
  complianceScores,
  dailySnapshot,
  physicianLeaderboard,
  revenueTrend,
  serviceMix,
  timelineEvents,
} from "@/data/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RevenueAreaChart } from "@/components/charts/revenue-area-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { ComplianceRadarChart } from "@/components/charts/radar-chart";
import { Avatar } from "@/components/ui/avatar";
import { formatPercent, formatCurrency } from "@/lib/utils";
import { useOperationStore, computeOperationMetrics } from "@/features/operations/store/operations-store";
import { useConsultationStore, computeConsultationMetrics } from "@/features/consultations/store/consultations-store";

const donutPalette = ["#0d6a63", "#2e97f1", "#22c55e", "#ff8c42"];

export function DashboardPage() {
  const operationState = useOperationStore();
  const consultationState = useConsultationStore();
  const operationMetrics = computeOperationMetrics(operationState.operations);
  const consultationMetrics = computeConsultationMetrics(consultationState.consultations);

  return (
    <div className="flex flex-col gap-8">
      <HeroPanel />
      <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <Card glow className="xl:order-1">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Umsatzentwicklung</CardTitle>
              <CardDescription>IGeL + GOÄ Vergleich der letzten 6 Monate</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full border border-border/40">
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <RevenueAreaChart data={revenueTrend} />
          </CardContent>
        </Card>
        <AlertsPanel />
        <div className="grid gap-6 xl:order-3 xl:grid-cols-2">
          <Card glow>
            <CardHeader>
              <CardTitle>Leistungskatalog Mix</CardTitle>
              <CardDescription>Anteil der Erlöse nach Segment</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart data={serviceMix} colors={donutPalette} />
              <div className="mt-4 space-y-2 text-sm">
                {serviceMix.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: donutPalette[index] }} />
                      {item.name}
                    </span>
                    <span className="font-semibold">{item.wert}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Compliance Radar</CardTitle>
              <CardDescription>SOP Erfüllung je Phase</CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceRadarChart data={complianceScores} />
            </CardContent>
          </Card>
        </div>
        <TimelinePanel />
        <LeistungsteamPanel />
        <OperationsConsultationPanel
          operationCount={operationMetrics.count}
          operationRevenue={operationMetrics.totalRevenue}
          consultationCount={consultationState.consultations.length}
          consultationRevenue={consultationMetrics.totalRevenue}
        />
      </div>
    </div>
  );
}

function HeroPanel() {
  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/95 via-primary/90 to-primary/70 text-primary-foreground shadow-2xl">
      <div className="absolute -left-14 top-10 size-72 rounded-full bg-white/5 blur-3xl" aria-hidden />
      <div className="absolute -right-10 bottom-0 size-64 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />
      <div className="absolute right-10 top-8 h-28 w-[2px] bg-gradient-to-b from-white/60 via-white/10 to-transparent" />
      <CardContent className="relative flex flex-col gap-8 px-10 py-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <Badge variant="solid" className="bg-white/15 text-white">
              Praxisprotokoll {dailySnapshot.datum}
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Willkommen zurück, Dr. Krause. Ihre Praxis läuft zu {formatPercent(dailySnapshot.auslastung)}.
            </h1>
            <p className="mt-3 text-base text-white/80">
              4 Befunde warten auf Freigabe, 3 GOÄ-Kombinationen benötigen Begründungen. Alle KPIs liegen im grünen Bereich.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="muted" className="border border-white/20 bg-white/10 text-white">
                Dokumentationsquote {formatPercent(dailySnapshot.dokumentationsquote)}
              </Badge>
              <Badge variant="muted" className="border border-white/20 bg-white/10 text-white">
                Abrechnungsgenauigkeit {formatPercent(dailySnapshot.abrechnungsgenauigkeit)}
              </Badge>
              <Badge variant="muted" className="border border-white/20 bg-white/10 text-white">
                Patienten heute {dailySnapshot.patientenHeute}
              </Badge>
            </div>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">OP Auslastung</span>
              <span className="text-lg font-semibold">{formatPercent(dailySnapshot.auslastung)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-emerald-300"
                style={{ width: String(dailySnapshot.auslastung * 100) + "%" }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-white/85">
              <Stat label="Operationen" value={dailySnapshot.operationen} />
              <Stat label="Dokumentationen offen" value={4} />
              <Stat label="Notfallprotokolle" value="bereit" />
            </div>
            <div className="flex gap-3">
              <Button variant="solid" size="sm" tone="secondary" className="flex-1">
                Tagesbriefing öffnen
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 border border-white/20 text-white">
                AI MedAssist starten
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Ribbon icon={<CalendarRange className="size-4" />} label="Heute" value="12 Operationen geplant" />
          <Ribbon icon={<ClipboardCheck className="size-4" />} label="SOP" value="94% erfüllt" />
          <Ribbon icon={<Headphones className="size-4" />} label="Support" value="Reaktion < 4 Min" />
          <Ribbon icon={<FileText className="size-4" />} label="Audit" value="Letzter Audit 18.09." />
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsPanel() {
  return (
    <Card className="xl:order-2" glow>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Realtime Alerts</CardTitle>
          <Badge variant="outline">Live</Badge>
        </div>
        <CardDescription>Material, Abrechnung & Compliance im Blick</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="group flex items-start gap-3 rounded-xl border border-border/50 bg-surface-100/60 px-4 py-3 shadow-sm transition hover:border-primary/30 hover:bg-primary/5"
          >
            <span
              className={
                "mt-1 size-2.5 rounded-full" +
                (alert.type === "warning"
                  ? " bg-warning"
                  : alert.type === "danger"
                  ? " bg-destructive"
                  : " bg-primary")
              }
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground/90">{alert.title}</p>
              <p className="text-sm text-muted-foreground/90">{alert.description}</p>
            </div>
            <span className="text-xs text-muted-foreground/70">{alert.timestamp}</span>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="self-start text-xs text-muted-foreground">
          Alle Alerts ansehen
        </Button>
      </CardContent>
    </Card>
  );
}

function TimelinePanel() {
  return (
    <Card className="xl:order-5" glow>
      <CardHeader>
        <CardTitle>Tagesablauf</CardTitle>
        <CardDescription>Kuratiert nach Priorität & Rolle</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {timelineEvents.map((event, index) => (
          <div key={event.id} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-muted-foreground/70">{event.time}</span>
              {index !== timelineEvents.length - 1 ? (
                <span className="mt-1 h-full w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
              ) : null}
            </div>
            <div className="flex-1 rounded-xl border border-primary/10 bg-primary/5 px-4 py-3">
              <p className="text-sm font-semibold text-foreground/90">{event.title}</p>
              <p className="text-sm text-muted-foreground/80">{event.description}</p>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          Tagesplan exportieren
          <ArrowUpRight className="size-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

function LeistungsteamPanel() {
  return (
    <Card className="xl:order-6">
      <CardHeader>
        <CardTitle>Leistungsteam Performance</CardTitle>
        <CardDescription>Fallzahlen, IGeL Conversion & Dokumentationszeiten</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {physicianLeaderboard.map((entry) => (
          <div
            key={entry.name}
            className="group flex items-center gap-4 rounded-xl border border-border/40 px-4 py-3 transition hover:border-primary/30 hover:bg-primary/5"
          >
            <Avatar name={entry.name} size="sm" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground/90">{entry.name}</p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <span>
                  Fallzahlen
                  <strong className="ml-1 text-foreground/90">{entry.fallzahlen}</strong>
                </span>
                <span>
                  IGeL Quote
                  <strong className="ml-1 text-foreground/90">{formatPercent(entry.igelRate)}</strong>
                </span>
                <span>
                  Dokumentation
                  <strong className="ml-1 text-foreground/90">{formatPercent(entry.dokumentationszeit)}</strong>
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full border border-transparent">
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function OperationsConsultationPanel({
  operationCount,
  operationRevenue,
  consultationCount,
  consultationRevenue,
}: {
  operationCount: number;
  operationRevenue: number;
  consultationCount: number;
  consultationRevenue: number;
}) {
  return (
    <Card className="xl:order-7 border border-primary/25 bg-primary/5">
      <CardHeader>
        <CardTitle>OP & Private Consult Snapshot</CardTitle>
        <CardDescription>Verlinkt neue Module für Operations-Tracking und Privatsprechstunde.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
        <div className="rounded-xl border border-primary/30 bg-white/95 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Operationen (aktuell)</p>
          <p className="text-2xl font-semibold text-primary">{operationCount}</p>
          <p className="text-xs text-muted-foreground">Revenue: {formatCurrency(operationRevenue)}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 gap-2 text-xs"
            onClick={() => {
              window.location.href = "/operationen";
            }}
          >
            Operations-Tracking öffnen
          </Button>
        </div>
        <div className="rounded-xl border border-secondary/30 bg-white/95 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">Private Consultations</p>
          <p className="text-2xl font-semibold text-secondary">{consultationCount}</p>
          <p className="text-xs text-muted-foreground">Revenue: {formatCurrency(consultationRevenue)}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 gap-2 text-xs"
            onClick={() => {
              window.location.href = "/consultations";
            }}
          >
            Consultation Tracker öffnen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Ribbon({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-wide text-white/85 backdrop-blur">
      <span className="text-white">{icon}</span>
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white/10 p-3 text-sm">
      <p className="text-white/60">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
