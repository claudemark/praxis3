import { useMemo, useState } from "react";
import { CopyPlus, Edit2, Search, Trash2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";

import {
  useConsultationStore,
  computeConsultationMetrics,
  groupBySource,
  groupRevenueTrend,
} from "@/features/consultations/store/consultations-store";
import type { ConsultationRecord, ConsultationSource, ConsultationStatus } from "@/data/consultations";
import { insuranceBadge } from "@/lib/insurance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/datetime";

const statusOptions: ConsultationStatus[] = ["Abgeschlossen", "Offen", "Follow-up"];
const sourceOptions: ConsultationSource[] = ["Telefon", "Website", "Weiterempfehlung", "Social Media", "BG"];
const insuranceOptions = ["privat", "selbstzahler", "bg"] as const;

export function ConsultationTrackerPage() {
  const { consultations, addConsultation, updateConsultation, deleteConsultation } = useConsultationStore();
  const [filters, setFilters] = useState({ status: "all", source: "all", insurance: "all", search: "" });
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    patient: "",
    patientId: "",
    insurance: "privat" as (typeof insuranceOptions)[number],
    consultationType: "",
    source: "Telefon" as ConsultationSource,
    status: "Abgeschlossen" as ConsultationStatus,
    revenue: "",
    followUpNeeded: false,
    notes: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ConsultationRecord | null>(null);

  const filtered = useMemo(() => {
    return consultations.filter((entry) => {
      if (filters.status !== "all" && entry.status !== filters.status) return false;
      if (filters.source !== "all" && entry.source !== filters.source) return false;
      if (filters.insurance !== "all" && entry.insurance !== filters.insurance) return false;
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const haystack = (
          entry.patient +
          " " +
          (entry.patientId ?? "") +
          " " +
          entry.consultationType +
          " " +
          entry.source
        ).toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [consultations, filters]);

  const metrics = useMemo(() => computeConsultationMetrics(filtered), [filtered]);
  const trendData = useMemo(() => groupRevenueTrend(filtered), [filtered]);
  const sourceData = useMemo(() => groupBySource(filtered), [filtered]);
  const insuranceSummary = useMemo(() => {
    const counts: Record<(typeof insuranceOptions)[number], number> = {
      privat: 0,
      selbstzahler: 0,
      bg: 0,
    };
    for (const record of filtered) {
      if (record.insurance in counts) {
        counts[record.insurance as (typeof insuranceOptions)[number]] += 1;
      }
    }
    return counts;
  }, [filtered]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.patient.trim() || !form.patientId.trim() || !form.consultationType.trim()) return;
    addConsultation({
      date: form.date,
      patient: form.patient.trim(),
      patientId: form.patientId.trim(),
      insurance: form.insurance,
      consultationType: form.consultationType.trim(),
      source: form.source,
      status: form.status,
      revenue: Number(form.revenue || 0),
      followUpNeeded: form.followUpNeeded,
      notes: form.notes.trim() || undefined,
    });
    setForm({
      ...form,
      patient: "",
      patientId: "",
      consultationType: "",
      revenue: "",
      notes: "",
    });
  };

  const handleDelete = (record: ConsultationRecord) => {
    if (!window.confirm("Konsultation wirklich löschen?")) return;
    deleteConsultation(record.id);
  };

  const openEdit = (record: ConsultationRecord) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">Private Consultation Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Wachstum privater & Selbstzahler-Konsultationen überwachen – Quelle, Umsatz & Follow-ups im Blick.
          </p>
        </div>
        <Badge variant="muted" className="rounded-full">Akquise KPI aktiv</Badge>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border border-border/40 bg-white/90">
          <CardHeader>
            <CardTitle>Schnell-Erfassung</CardTitle>
            <CardDescription>Tägliche Konsultationen mit wenigen Klicks erfassen.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Datum</label>
                  <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Patient</label>
                  <Input value={form.patient} onChange={(event) => setForm({ ...form, patient: event.target.value })} required />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Patienten-ID</label>
                  <Input
                    value={form.patientId}
                    onChange={(event) => setForm({ ...form, patientId: event.target.value })}
                    placeholder="z.B. PAT-2025-001"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Versicherung</label>
                  <select
                    value={form.insurance}
                    onChange={(event) => setForm({ ...form, insurance: event.target.value as typeof insuranceOptions[number] })}
                    className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                  >
                    {insuranceOptions.map((option) => (
                      <option key={option} value={option}>
                        {insuranceBadge(option)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Quelle</label>
                  <select
                    value={form.source}
                    onChange={(event) => setForm({ ...form, source: event.target.value as ConsultationSource })}
                    className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                  >
                    {sourceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Status</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as ConsultationStatus })}
                    className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Konsultationstyp</label>
                <Input
                  value={form.consultationType}
                  onChange={(event) => setForm({ ...form, consultationType: event.target.value })}
                  placeholder="z.B. Zweitmeinung Knie"
                  required
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Revenue (EUR)</label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={form.revenue}
                    onChange={(event) => setForm({ ...form, revenue: event.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground/70">
                  <input
                    type="checkbox"
                    checked={form.followUpNeeded}
                    onChange={(event) => setForm({ ...form, followUpNeeded: event.target.checked })}
                    className="size-4"
                  />
                  Follow-up nötig?
                </label>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Notiz</label>
                <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 border-t border-border/40 px-6 py-4">
              <Button type="submit" className="gap-2 rounded-full">
                <CopyPlus className="size-4" /> Konsultation speichern
              </Button>
            </div>
          </form>
        </Card>

        <Card className="border border-border/40 bg-white/90">
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
            <CardDescription>Überblick zu Wachstum, Umsatz und Follow-up Bedarf.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <MetricTile label="Gesamt" value={String(metrics.countsByStatus.Abgeschlossen + metrics.countsByStatus.Offen + metrics.countsByStatus["Follow-up"]) + " Konsultationen"} description="Gefilterte Periode" />
              <MetricTile label="Revenue" value={formatCurrency(metrics.totalRevenue)} description="Summe Umsätze" tone="text-success" />
            </div>
            <div className="grid gap-3 md:grid-cols-3 text-xs">
              <MetricTile label="Abgeschlossen" value={String(metrics.countsByStatus.Abgeschlossen)} description="Aktuelle Filter" />
              <MetricTile label="Offen" value={String(metrics.countsByStatus.Offen)} description="Aktuelle Filter" />
              <MetricTile label="Follow-up" value={String(metrics.countsByStatus["Follow-up"])} description="Aktuelle Filter" />
            </div>
            <div className="grid gap-3 md:grid-cols-3 text-xs">
              <MetricTile label="Privat" value={String(insuranceSummary.privat)} description="Versicherung" />
              <MetricTile label="Selbstzahler" value={String(insuranceSummary.selbstzahler)} description="Versicherung" />
              <MetricTile label="BG" value={String(insuranceSummary.bg)} description="Versicherung" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/40 bg-white/90">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Konsultationsliste</CardTitle>
            <CardDescription>Filtern, editieren und löschen.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Search className="size-4" />
              <Input
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                placeholder="Patient oder Typ"
              />
            </div>
            <select
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
              className="rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
            >
              <option value="all">Alle Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={filters.source}
              onChange={(event) => setFilters({ ...filters, source: event.target.value })}
              className="rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
            >
              <option value="all">Alle Quellen</option>
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-surface-100 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Datum</th>
                <th className="px-4 py-2 text-left">Patient</th>
                <th className="px-4 py-2 text-left">Versicherung</th>
                <th className="px-4 py-2 text-left">Typ</th>
                <th className="px-4 py-2 text-left">Quelle</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Revenue</th>
                <th className="px-4 py-2 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-border/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground/70">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p>{entry.patient}</p>
                      {entry.patientId ? <p className="text-xs text-muted-foreground/70">{entry.patientId}</p> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{insuranceBadge(entry.insurance)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground/80">{entry.consultationType}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground/80">{entry.source}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" size="sm">
                      {entry.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-foreground/85">
                    {formatCurrency(entry.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => openEdit(entry)}>
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(entry)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Keine Konsultationen für die Filterkriterien.</div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border border-border/40 bg-white/90">
        <CardHeader>
          <CardTitle>Akquise Quellen</CardTitle>
          <CardDescription>Vergleich der wichtigsten Quellen.</CardDescription>
        </CardHeader>
        <CardContent className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="source" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#2563eb" name="Konsultationen" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border border-border/40 bg-white/90">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monatlicher Umsatzverlauf</CardDescription>
        </CardHeader>
        <CardContent className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" name="Umsatz" />
              <Line type="monotone" dataKey="count" stroke="#2563eb" name="Konsultationen" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {showEditModal && editingRecord ? (
        <ConsultationModal
          record={editingRecord}
          onClose={() => {
            setShowEditModal(false);
            setEditingRecord(null);
          }}
          onSubmit={(changes) => {
            updateConsultation(editingRecord.id, changes);
            setShowEditModal(false);
            setEditingRecord(null);
          }}
        />
      ) : null}
    </div>
  );
}

function MetricTile({ label, value, description, tone }: { label: string; value: string; description: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-white/90 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p className={`text-lg font-semibold ${tone ?? "text-foreground/90"}`}>{value}</p>
      <p className="text-xs text-muted-foreground/70">{description}</p>
    </div>
  );
}

function ConsultationModal({
  record,
  onClose,
  onSubmit,
}: {
  record: ConsultationRecord;
  onClose: () => void;
  onSubmit: (changes: Partial<Omit<ConsultationRecord, "id">>) => void;
}) {
  const [form, setForm] = useState({
    date: record.date,
    patient: record.patient,
    patientId: record.patientId,
    insurance: record.insurance,
    consultationType: record.consultationType,
    source: record.source,
    status: record.status,
    revenue: String(record.revenue || ""),
    followUpNeeded: record.followUpNeeded,
    notes: record.notes ?? "",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.patient.trim() || !form.patientId.trim() || !form.consultationType.trim()) return;
    onSubmit({
      date: form.date,
      patient: form.patient.trim(),
      patientId: form.patientId.trim(),
      insurance: form.insurance,
      consultationType: form.consultationType.trim(),
      source: form.source,
      status: form.status,
      revenue: Number(form.revenue || 0),
      followUpNeeded: form.followUpNeeded,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
      <Card className="w-full max-w-2xl border border-border/40 bg-white/95">
        <CardHeader>
          <CardTitle>Konsultation bearbeiten</CardTitle>
          <CardDescription>Angaben zum Termin aktualisieren.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 text-sm">
    <div className="grid gap-3 md:grid-cols-3">
      <div>
        <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Datum</label>
        <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Patient</label>
        <Input value={form.patient} onChange={(event) => setForm({ ...form, patient: event.target.value })} required />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Patienten-ID</label>
        <Input value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })} required />
      </div>
    </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Versicherung</label>
                <select
                  value={form.insurance}
                  onChange={(event) => setForm({ ...form, insurance: event.target.value as (typeof insuranceOptions)[number] })}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                >
                  {insuranceOptions.map((option) => (
                    <option key={option} value={option}>
                      {insuranceBadge(option)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Quelle</label>
                <select
                  value={form.source}
                  onChange={(event) => setForm({ ...form, source: event.target.value as ConsultationSource })}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                >
                  {sourceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Status</label>
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as ConsultationStatus })}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Konsultationstyp</label>
              <Input value={form.consultationType} onChange={(event) => setForm({ ...form, consultationType: event.target.value })} required />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Revenue (EUR)</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.revenue}
                  onChange={(event) => setForm({ ...form, revenue: event.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground/70">
                <input
                  type="checkbox"
                  checked={form.followUpNeeded}
                  onChange={(event) => setForm({ ...form, followUpNeeded: event.target.checked })}
                  className="size-4"
                />
                Follow-up nötig?
              </label>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Notiz</label>
              <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} />
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 border-t border-border/40 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="gap-2 rounded-full">
              Änderungen speichern
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
