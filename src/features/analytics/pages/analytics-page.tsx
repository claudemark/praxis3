import { useMemo, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ChevronRight,
  LineChart as LineChartIcon,
  PieChart,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/datetime";
import {
  useAnalyticsMeta,
  useAnalyticsSnapshot,
  useAnalyticsStore,
} from "@/features/analytics/store/analytics-store";
import type {
  ServiceMixEntry,
  TimeSeriesPoint,
} from "@/features/analytics/store/analytics-data";

const timeframeLabels: Record<"30d" | "90d" | "12m", string> = {
  "30d": "Letzte 30 Tage",
  "90d": "Letzte 90 Tage",
  "12m": "Letzte 12 Monate",
};

export function AnalyticsPage() {
  const { timeframe, location, comparePrevious, focus } = useAnalyticsMeta();
  const snapshot = useAnalyticsSnapshot();
  const setTimeframe = useAnalyticsStore((state) => state.setTimeframe);
  const setLocation = useAnalyticsStore((state) => state.setLocation);
  const toggleCompare = useAnalyticsStore((state) => state.toggleCompare);
  const setFocus = useAnalyticsStore((state) => state.setFocus);

  const comparisonLabel = useMemo(() => {
    if (!comparePrevious) return "Vorperiode ausblenden";
    if (timeframe === "30d") return "Vergleich zu Vormonat";
    if (timeframe === "90d") return "Vergleich zum Vorquartal";
    return "Vergleich zum Vorjahr";
  }, [comparePrevious, timeframe]);

  const change = useMemo(
    () => ({
      revenue: percentChange(snapshot.metrics.totalRevenue, snapshot.previousMetrics.totalRevenue),
      margin: percentChange(snapshot.metrics.marginRate, snapshot.previousMetrics.marginRate),
      patients: percentChange(snapshot.metrics.newPatients, snapshot.previousMetrics.newPatients),
      privateShare: percentChange(snapshot.metrics.privateShare, snapshot.previousMetrics.privateShare),
    }),
    [snapshot.metrics, snapshot.previousMetrics],
  );

  const bestService = snapshot.serviceMix[0];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">Finanz- & Leistungsanalyse</h1>
          <p className="text-sm text-muted-foreground">
            Echtzeitindikatoren fuer Umsatz, Deckungsbeitrag und Patientenerfolg. Wechseln Sie Zeitfenster und Standorte fuer Ihren Blick.
          </p>
          <p className="text-xs text-muted-foreground/80">
            Standort: {location} - Zeitraum: {timeframeLabels[timeframe]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/80">
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value as typeof location)}
            className="rounded-full border border-border/40 bg-white/90 px-3 py-2 text-xs font-semibold"
          >
            <option value="Gesamt">Praxisverbund gesamt</option>
            <option value="Frankfurt">Standort Frankfurt</option>
            <option value="Offenbach">Standort Offenbach</option>
            <option value="Bad Homburg">Standort Bad Homburg</option>
          </select>
          <select
            value={timeframe}
            onChange={(event) => setTimeframe(event.target.value as typeof timeframe)}
            className="rounded-full border border-border/40 bg-white/90 px-3 py-2 text-xs font-semibold"
          >
            <option value="30d">Letzte 30 Tage</option>
            <option value="90d">Letzte 90 Tage</option>
            <option value="12m">Letzte 12 Monate</option>
          </select>
          <div className="flex items-center gap-2 rounded-full border border-border/40 bg-white/90 px-3 py-1.5">
            <Switch checked={comparePrevious} onCheckedChange={() => toggleCompare()} />
            <span>{comparisonLabel}</span>
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-4">
        <MetricCard
          title="Gesamtumsatz"
          value={formatCurrency(snapshot.metrics.totalRevenue)}
          previousValue={formatCurrency(snapshot.previousMetrics.totalRevenue)}
          change={change.revenue}
          timeframe={timeframeLabels[timeframe]}
          icon={<LineChartIcon className="size-4" />}
          active={focus === "revenue"}
          onClick={() => setFocus("revenue")}
        />
        <MetricCard
          title="Deckungsbeitrag"
          value={formatPercent(snapshot.metrics.marginRate)}
          previousValue={formatPercent(snapshot.previousMetrics.marginRate)}
          change={change.margin}
          timeframe={timeframeLabels[timeframe]}
          icon={<TrendingUp className="size-4" />}
          active={focus === "margin"}
          onClick={() => setFocus("margin")}
        />
        <MetricCard
          title="Neue Patient:innen"
          value={snapshot.metrics.newPatients.toString()}
          previousValue={snapshot.previousMetrics.newPatients.toString()}
          change={change.patients}
          timeframe={timeframeLabels[timeframe]}
          icon={<Users className="size-4" />}
          active={focus === "patients"}
          onClick={() => setFocus("patients")}
        />
        <MetricCard
          title="Privat-Anteil"
          value={formatPercent(snapshot.metrics.privateShare)}
          previousValue={formatPercent(snapshot.previousMetrics.privateShare)}
          change={change.privateShare}
          timeframe={timeframeLabels[timeframe]}
          icon={<PieChart className="size-4" />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[2.3fr_1.2fr]">
        <Card className="border border-border/40 bg-white/95">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Umsatz- & Margenentwicklung</CardTitle>
              <CardDescription>
                {timeframeLabels[timeframe]} - {location}
              </CardDescription>
            </div>
            {bestService ? (
              <Badge variant="accent" className="gap-1 rounded-full px-3 py-1 text-xs">
                <TrendingUp className="size-4" /> Staerkster Treiber: {bestService.name}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="h-[320px]">
            <ComposedRevenueChart
              focus={focus}
              compare={comparePrevious}
              series={snapshot.timeSeries}
              previousSeries={snapshot.previousSeries}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-white/95">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Prognose</CardTitle>
              <CardDescription>Naechste Perioden bei aktueller Dynamik</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full text-xs">
              <Activity className="size-3" /> ML Preview
            </Badge>
          </CardHeader>
          <CardContent className="h-[320px]">
            {snapshot.forecast.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snapshot.forecast}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tickFormatter={(value) => formatDate(value, "MM.yyyy")} />
                  <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `${Math.round((value as number) / 1000)}k`} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${Math.round((value as number) * 100)} %`} />
                  <Tooltip
                    formatter={(value: number, name) => (name === "projectedRevenue" ? formatCurrency(value) : `${Math.round(value * 100)} %`)}
                    labelFormatter={(label) => formatDate(label as string, "MMMM yyyy")}
                  />
                  <Area type="monotone" yAxisId="left" dataKey="projectedRevenue" stroke="#2563EB" fill="url(#revenue)" strokeWidth={2} />
                  <Line type="monotone" yAxisId="right" dataKey="projectedMargin" stroke="#22C55E" strokeWidth={2} dot={false} />
                  <Legend formatter={(value) => (value === "projectedRevenue" ? "Prognostizierter Umsatz" : "Prognostizierte Marge")} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/40 bg-white/80 p-6 text-sm text-muted-foreground">
                Nicht genug Daten fuer eine Prognose.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.8fr_1.2fr]">
        <Card className="border border-border/40 bg-white/95">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Leistungsschwerpunkte</CardTitle>
              <CardDescription>Top-Leistungen nach Umsatz und Deckungsbeitrag</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Service-Katalog oeffnen <ChevronRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <table className="w-full table-auto text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 text-left">Leistung</th>
                  <th className="py-2 text-right">Umsatz</th>
                  <th className="py-2 text-right">Marge</th>
                  <th className="py-2 text-right">Trend</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.serviceMix.map((entry) => (
                  <ServiceMixRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-white/95">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Inkasso Monitoring</CardTitle>
              <CardDescription>Offene Posten und Zahlungsrisiken</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Mahnwesen <ChevronRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshot.collectionRisks.map((risk) => (
              <div
                key={risk.payer}
                className="flex items-center justify-between rounded-lg border border-border/40 bg-white/90 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground/90">{risk.payer}</p>
                  <p className="text-xs text-muted-foreground/80">{risk.overdueDays} Tage offen</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-foreground/90">{formatCurrency(risk.openAmount)}</p>
                  <Badge
                    variant="outline"
                    className={`rounded-full text-xs ${
                      risk.trend === "up"
                        ? "text-amber-600"
                        : risk.trend === "down"
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {risk.trend === "up" ? "steigend" : risk.trend === "down" ? "ruecklaeufig" : "stabil"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1.5fr]">
        <Card className="border border-border/40 bg-white/95">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Umsatz je Mitarbeitenden inkl. Conversion und Zufriedenheit</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Coaching planen <ChevronRight className="size-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <table className="w-full table-auto text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 text-left">Mitarbeitende</th>
                  <th className="py-2 text-right">Umsatz</th>
                  <th className="py-2 text-right">Conversion</th>
                  <th className="py-2 text-right">Zufriedenheit</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.staffPerformance.map((staff) => (
                  <tr key={staff.employeeId} className="border-b border-border/30 last:border-none">
                    <td className="py-2">
                      <div className="font-semibold text-foreground/90">{staff.name}</div>
                      <div className="text-xs text-muted-foreground/70">{staff.role}</div>
                    </td>
                    <td className="py-2 text-right font-semibold text-foreground/90">{formatCurrency(staff.revenue)}</td>
                    <td className="py-2 text-right text-muted-foreground/80">{Math.round(staff.conversionRate * 100)} %</td>
                    <td className="py-2 text-right text-muted-foreground/80">{staff.satisfaction.toFixed(1)} / 5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-white/95">
          <CardHeader>
            <CardTitle>Handlungsempfehlungen</CardTitle>
            <CardDescription>Automatisch generierte Insights aus Ihren Daten</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground/80">
            <InsightItem
              title="PRP-Knie Kampagne ausbauen"
              description="+12 % Umsatz in den letzten 30 Tagen. 18 Anfragen auf Warteliste - Kapazitaeten ueber Wochen voll."
            />
            <InsightItem
              title="Zahlungsziel Privatpatient:innen anpassen"
              description="Offene Posten +18 %. Empfohlen: Zahlungserinnerung nach 10 Tagen automatisieren."
            />
            <InsightItem
              title="Therapiepakete buendeln"
              description="Deckungsbeitrag Reha +5 %, aber Frequenz -3 %. Kombi mit Pre-OP Coaching testen."
            />
            <Button variant="outline" className="w-full gap-2 rounded-full text-xs">
              <ShieldCheck className="size-4" /> Massnahmenboard oeffnen
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  previousValue,
  change,
  timeframe,
  icon,
  active,
  onClick,
}: {
  title: string;
  value: string;
  previousValue?: string;
  change: number;
  timeframe: string;
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const tone = change > 0 ? "text-emerald-600" : change < 0 ? "text-rose-600" : "text-muted-foreground";
  const symbol = change > 0 ? "+" : change < 0 ? "-" : "~";
  const percentage = Number.isFinite(change) ? (Math.abs(change) * 100).toFixed(1) : "0.0";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-5 py-4 text-left shadow-soft transition-all ${
        active
          ? "border-primary/40 bg-primary/10 text-primary shadow-md"
          : "border-border/40 bg-white/95 hover:border-primary/30 hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{timeframe}</p>
          <p className="mt-1 text-lg font-semibold text-foreground/90">{title}</p>
        </div>
        <span className="rounded-full bg-primary/10 p-2 text-primary">{icon}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold text-foreground/90">{value}</p>
      {previousValue ? (
        <p className="text-xs text-muted-foreground/70">Vorperiode: {previousValue}</p>
      ) : null}
      <p className={`mt-2 text-xs font-semibold ${tone}`}>
        {symbol} {percentage} % vs. Vergleich
      </p>
    </button>
  );
}

function ComposedRevenueChart({
  focus,
  compare,
  series,
  previousSeries,
}: {
  focus: "revenue" | "margin" | "patients";
  compare: boolean;
  series: TimeSeriesPoint[];
  previousSeries: TimeSeriesPoint[];
}) {
  const chartData = useMemo(
    () =>
      series.map((point, index) => ({
        ...point,
        previousRevenue: previousSeries[index]?.revenue ?? null,
        previousMargin: previousSeries[index]?.margin ?? null,
        previousNewPatients: previousSeries[index]?.newPatients ?? null,
      })),
    [series, previousSeries],
  );

  const hasComparison = compare && previousSeries.length === series.length && series.length > 0;
  const showMarginLine = focus !== "patients";
  const showRevenueBar = focus !== "margin";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }} barCategoryGap="24%">
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="date" tickFormatter={(value) => formatDate(value, "MM.yyyy")} />
        <YAxis yAxisId="left" tickFormatter={(value) => `${Math.round((value as number) / 1000)}k`} />
        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${Math.round((value as number) * 100)} %`} />
        <Tooltip
          formatter={(value, name) => tooltipValueFormatter(value, String(name))}
          labelFormatter={(label) => formatDate(String(label), "MMMM yyyy")}
        />
        {showRevenueBar ? (
          <Bar yAxisId="left" dataKey="revenue" barSize={18} radius={4} fill="#2563EB88" name="Umsatz" />
        ) : null}
        {hasComparison && showRevenueBar ? (
          <Bar yAxisId="left" dataKey="previousRevenue" barSize={12} radius={4} fill="#94A3B866" name="Umsatz Vorperiode" />
        ) : null}
        {showMarginLine ? (
          <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#22C55E" strokeWidth={2} dot={false} name="Marge" />
        ) : null}
        {hasComparison && showMarginLine ? (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="previousMargin"
            stroke="#0F172A"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="6 4"
            name="Marge Vorperiode"
          />
        ) : null}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="newPatients"
          stroke="#F59E0B"
          strokeWidth={1.5}
          dot={false}
          name="Neue Patient:innen"
        />
        {hasComparison ? (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="previousNewPatients"
            stroke="#F97316"
            strokeWidth={1.25}
            dot={false}
            strokeDasharray="4 4"
            name="Neue Patient:innen Vorperiode"
          />
        ) : null}
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ServiceMixRow({ entry }: { entry: ServiceMixEntry }) {
  return (
    <tr className="border-b border-border/30 last:border-none">
      <td className="py-3">
        <div className="font-semibold text-foreground/90">{entry.name}</div>
        <div className="text-xs text-muted-foreground/70">{entry.category}</div>
      </td>
      <td className="py-3 text-right font-semibold text-foreground/90">{formatCurrency(entry.revenue)}</td>
      <td className="py-3 text-right text-muted-foreground/80">{Math.round(entry.margin * 100)} %</td>
      <td className="py-3 text-right">
        <Badge variant={entry.delta >= 0 ? "accent" : "outline"} className="rounded-full text-xs">
          {entry.delta >= 0 ? "+" : ""}{Math.round(entry.delta * 100)} %
        </Badge>
      </td>
    </tr>
  );
}

function InsightItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-white/90 p-3">
      <p className="text-sm font-semibold text-foreground/90">{title}</p>
      <p className="text-xs text-muted-foreground/80">{description}</p>
    </div>
  );
}

function percentChange(current: number, previous: number) {
  if (!previous) {
    return 0;
  }
  return (current - previous) / previous;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)} %`;
}

function tooltipValueFormatter(value: unknown, name: string): [string, string] {
  if (value == null) {
    return ["-", name];
  }

  const numericValue = Array.isArray(value)
    ? (value[0] != null ? Number(value[0]) : null)
    : typeof value === "number"
      ? value
      : Number(value);

  if (numericValue == null || Number.isNaN(numericValue)) {
    return [String(value), name];
  }

  switch (name) {
    case "revenue":
      return [formatCurrency(numericValue), "Umsatz"];
    case "previousRevenue":
      return [formatCurrency(numericValue), "Umsatz Vorperiode"];
    case "margin":
      return [`${Math.round(numericValue * 100)} %`, "Marge"];
    case "previousMargin":
      return [`${Math.round(numericValue * 100)} %`, "Marge Vorperiode"];
    case "newPatients":
      return [`${Math.round(numericValue)} Patient:innen`, "Neue Patient:innen"];
    case "previousNewPatients":
      return [`${Math.round(numericValue)} Patient:innen`, "Neue Patient:innen Vorperiode"];
    default:
      return [String(value), name];
  }
}
