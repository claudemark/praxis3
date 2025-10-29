import { useMemo, useState } from "react";
import { Download, RefreshCw, PencilLine, Trash2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  Legend,
} from "recharts";

import {
  useOperationStore,
  filterOperations,
  computeOperationMetrics,
  groupOperationsByMonth,
  groupRevenueByProcedure,
} from "@/features/operations/store/operations-store";
import { insuranceBadge, type InsuranceType } from "@/lib/insurance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { formatDateTime } from "@/lib/datetime";
import type { OperationRecord, OperationRoom, OperationStatus } from "@/data/operations";

const rooms: (OperationRoom | "all")[] = ["all", "ITN", "IVR", "Klein OP"];
const statuses: (OperationStatus | "all")[] = ["all", "Geplant", "Durchgeführt", "Abgesagt"];
const insuranceOptions: InsuranceType[] = ["privat", "gesetzlich", "selbstzahler"];

export function OperationsPage() {
  const { operations, filters, setFilters, resetFilters, addOperation, updateOperation, deleteOperation } = useOperationStore();
  const [surgeonFilter, setSurgeonFilter] = useState(filters.surgeon ?? "");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOperation, setEditingOperation] = useState<OperationRecord | null>(null);
  const [operationToDelete, setOperationToDelete] = useState<OperationRecord | null>(null);

  const filtered = useMemo(() => {
    return filterOperations(operations, { ...filters, surgeon: surgeonFilter });
  }, [operations, filters, surgeonFilter]);

  const metrics = useMemo(() => computeOperationMetrics(filtered), [filtered]);
  const monthlyData = useMemo(() => groupOperationsByMonth(filtered), [filtered]);
  const revenuePerProcedure = useMemo(() => groupRevenueByProcedure(filtered), [filtered]);

  const handleExport = (type: "excel" | "pdf") => {
    console.info("Export", type, filtered.length);
    window.alert("Export als " + type.toUpperCase() + " wird vorbereitet (Demo).");
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">Operations-Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Analysen für ITN/IVR Tage und tägliche Klein-OPs – medizinische Qualität und Finanztransparenz.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => handleExport("excel")}>
            <Download className="size-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => handleExport("pdf")}>
            <Download className="size-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => setShowCreateModal(true)}>
            Neue Operation
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 rounded-full" onClick={resetFilters}>
            <RefreshCw className="size-4" /> Filter zurücksetzen
          </Button>
        </div>
      </header>

      <Card className="border border-border/40 bg-white/90">
        <CardHeader>
          <CardTitle>Filter & KPI</CardTitle>
          <CardDescription>Vergleichen Sie OPs nach Datum, Raum, Versicherung und Chirurg.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 md:grid-cols-5">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Von</label>
              <Input
                type="date"
                value={filters.dateFrom ?? ""}
                onChange={(event) => setFilters({ dateFrom: event.target.value })}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Bis</label>
              <Input
                type="date"
                value={filters.dateTo ?? ""}
                onChange={(event) => setFilters({ dateTo: event.target.value })}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">OP Raum</label>
              <select
                value={filters.room ?? "all"}
                onChange={(event) => setFilters({ room: event.target.value as OperationRoom | "all" })}
                className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
              >
                {rooms.map((room) => (
                  <option key={room} value={room}>
                    {room === "all" ? "Alle" : room}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Versicherung</label>
              <select
                value={filters.insurance ?? "all"}
                onChange={(event) => setFilters({ insurance: event.target.value as typeof insuranceOptions[number] | "all" })}
                className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
              >
                {(["all", ...insuranceOptions] as const).map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "Alle" : insuranceBadge(option)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Status</label>
              <select
                value={filters.status ?? "all"}
                onChange={(event) => setFilters({ status: event.target.value as OperationStatus | "all" })}
                className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "all" ? "Alle" : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Chirurg</label>
            <Input
              value={surgeonFilter}
              onChange={(event) => {
                setSurgeonFilter(event.target.value);
                setFilters({ surgeon: event.target.value });
              }}
              placeholder="Namen filtern"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <KpiTile label="OPs" value={String(metrics.count)} description="Gefilterte Eingriffe" />
            <KpiTile label="Revenue" value={formatCurrency(metrics.totalRevenue)} description="Summe Erlöse" tone="text-success" />
            <KpiTile label="Profit" value={formatCurrency(metrics.profit)} description="Revenue - Kosten" tone="text-primary" />
            <KpiTile label="Ø Dauer" value={metrics.avgDuration + " Min"} description="Durchschnittliche OP-Zeit" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/40 bg-white/90">
        <CardHeader>
          <CardTitle>Operationsliste</CardTitle>
          <CardDescription>Alle OPs mit Finanzkennzahlen und Versicherungsindikator.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          <table className="w-full min-w-[1040px] border-spacing-y-2 text-left">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2">Datum</th>
                <th className="pb-2">Patient</th>
                <th className="pb-2">Versicherung</th>
                <th className="pb-2">Eingriff</th>
                <th className="pb-2">Raum</th>
                <th className="pb-2">Chirurg</th>
                <th className="pb-2">Dauer</th>
                <th className="pb-2">Umsatz</th>
                <th className="pb-2">Kosten</th>
                <th className="pb-2">Marge</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((record) => {
                const margin = record.revenue - record.costs;
                const marginPct = record.revenue ? Math.round((margin / record.revenue) * 100) : 0;
                return (
                  <tr key={record.id} className="align-middle">
                    <td className="py-3 text-xs text-muted-foreground/80">{formatDateTime(record.date)}</td>
                    <td className="py-3">{record.patient}</td>
                    <td className="py-3 text-xs">{insuranceBadge(record.insurance)}</td>
                    <td className="py-3">{record.operationType}</td>
                    <td className="py-3">{record.room}</td>
                    <td className="py-3">{record.surgeon}</td>
                    <td className="py-3 text-xs text-muted-foreground/80">{record.durationMinutes} Min</td>
                    <td className="py-3 font-semibold text-foreground/90">{formatCurrency(record.revenue)}</td>
                    <td className="py-3 text-muted-foreground/80">{formatCurrency(record.costs)}</td>
                    <td className="py-3 text-xs text-muted-foreground/90">
                      {formatCurrency(margin)} ({marginPct}% )
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" size="sm">
                        {record.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="xs" className="gap-1 rounded-full" onClick={() => setEditingOperation(record)}>
                          <PencilLine className="size-3" /> Edit
                        </Button>
                        <Button variant="ghost" size="xs" className="gap-1 rounded-full text-destructive" onClick={() => setOperationToDelete(record)}>
                          <Trash2 className="size-3" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Keine Einträge für die aktuellen Filter.</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border border-border/40 bg-white/90">
          <CardHeader>
            <CardTitle>Monatsübersicht</CardTitle>
            <CardDescription>Volumen und Umsatz je Monat.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="4" stroke="hsla(206, 20%, 80%, 0.4)" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="hsla(206, 20%, 40%, 0.8)" allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" stroke="hsla(28, 90%, 45%, 0.8)" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="OPs" fill="#0d6a63" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#ff8c42" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border border-border/40 bg-white/90">
          <CardHeader>
            <CardTitle>Umsatz nach Eingriff</CardTitle>
            <CardDescription>Schneller Blick auf Erlöse pro Prozedur.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenuePerProcedure} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3" stroke="hsla(206, 20%, 85%, 0.5)" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="operationType" width={160} />
                <Tooltip />
                <Bar dataKey="revenue" name="Revenue" fill="#2e97f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/40 bg-white/90">
        <CardHeader>
          <CardTitle>ITN/IVR Kalenderübersicht</CardTitle>
          <CardDescription>Zweistündige Slots für die nächsten 7 Tage – schnelle Planung.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <OperationCalendar operations={operations} />
        </CardContent>
      </Card>

      {showCreateModal ? (
        <OperationModal
          title="Neue Operation"
          onClose={() => setShowCreateModal(false)}
          onSubmit={(operation) => {
            addOperation(operation);
            setShowCreateModal(false);
          }}
        />
      ) : null}

      {editingOperation ? (
        <OperationModal
          title="Operation bearbeiten"
          initial={editingOperation}
          onClose={() => setEditingOperation(null)}
          onSubmit={(operation) => {
            updateOperation(editingOperation.id, operation);
            setEditingOperation(null);
          }}
        />
      ) : null}

      {operationToDelete ? (
        <ConfirmDeleteModal
          label={operationToDelete.operationType + " • " + formatDateTime(operationToDelete.date)}
          onCancel={() => setOperationToDelete(null)}
          onConfirm={() => {
            deleteOperation(operationToDelete.id);
            setOperationToDelete(null);
          }}
        />
      ) : null}
    </div>
  );
}

function KpiTile({ label, value, description, tone }: { label: string; value: string; description: string; tone?: string }) {
  const toneClass = tone ?? "text-foreground/90";
  return (
    <div className="rounded-xl border border-border/40 bg-white/85 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p className={"text-xl font-semibold " + toneClass}>{value}</p>
      <p className="text-xs text-muted-foreground/70">{description}</p>
    </div>
  );
}

function OperationCalendar({ operations }: { operations: OperationRecord[] }) {
  const start = new Date();
  const days: Date[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push(date);
  }

  const slots = ["08:00", "10:00", "12:00", "14:00", "16:00"];

  return (
    <table className="w-full min-w-[720px] text-xs">
      <thead>
        <tr>
          <th className="w-32 px-2 py-2 text-left text-muted-foreground/70">Zeit</th>
          {days.map((day) => (
            <th key={day.toDateString()} className="px-2 py-2 text-left text-muted-foreground/70">
              {day.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {slots.map((slot) => (
          <tr key={slot} className="border-t border-border/30">
            <td className="px-2 py-2 text-muted-foreground/80">{slot}</td>
            {days.map((day) => {
              const slotHour = parseInt(slot.split(":")[0], 10);
              const match = operations.find((operation) => {
                const opDate = new Date(operation.date);
                return (
                  opDate.getFullYear() === day.getFullYear() &&
                  opDate.getMonth() === day.getMonth() &&
                  opDate.getDate() === day.getDate() &&
                  opDate.getHours() === slotHour
                );
              });
              return (
                <td key={day.toDateString() + slot} className="px-2 py-2 align-top">
                  {match ? (
                    <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-primary/5 p-2">
                      <span className="text-[11px] font-semibold text-primary">{match.room}</span>
                      <span className="text-[11px] text-foreground/80">{match.operationType}</span>
                      <span className="text-[10px] text-muted-foreground/80">{insuranceBadge(match.insurance)}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Frei</span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OperationModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial?: OperationRecord;
  onClose: () => void;
  onSubmit: (operation: Omit<OperationRecord, "id">) => void;
}) {
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        date: new Date(initial.date).toISOString().slice(0, 16),
        patient: initial.patient,
        insurance: initial.insurance,
        operationType: initial.operationType,
        room: initial.room,
        surgeon: initial.surgeon,
        durationMinutes: initial.durationMinutes.toString(),
        revenue: initial.revenue.toString(),
        costs: initial.costs.toString(),
        status: initial.status,
      };
    }
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return {
      date: now.toISOString().slice(0, 16),
      patient: "",
      insurance: "privat" as InsuranceType,
      operationType: "",
      room: "ITN" as OperationRoom,
      surgeon: "",
      durationMinutes: "60",
      revenue: "0",
      costs: "0",
      status: "Geplant" as OperationStatus,
    };
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.patient.trim() || !form.operationType.trim()) return;
    onSubmit({
      date: new Date(form.date).toISOString(),
      patient: form.patient.trim(),
      insurance: form.insurance,
      operationType: form.operationType.trim(),
      room: form.room,
      surgeon: form.surgeon.trim(),
      durationMinutes: Number(form.durationMinutes) || 0,
      revenue: Number(form.revenue) || 0,
      costs: Number(form.costs) || 0,
      status: form.status,
    });
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 backdrop-blur">
      <Card className="w-full max-w-3xl border border-border/50 bg-white/95 shadow-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Operation mit Finanzkennzahlen erfassen oder bearbeiten.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Datum & Uhrzeit</label>
                <Input
                  type="datetime-local"
                  value={form.date}
                  onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Patient</label>
                <Input value={form.patient} onChange={(event) => setForm((prev) => ({ ...prev, patient: event.target.value }))} required />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Versicherung</label>
                <select
                  value={form.insurance}
                  onChange={(event) => setForm((prev) => ({ ...prev, insurance: event.target.value as InsuranceType }))}
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
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">OP Raum</label>
                <select
                  value={form.room}
                  onChange={(event) => setForm((prev) => ({ ...prev, room: event.target.value as OperationRoom }))}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                >
                  {rooms.filter((room) => room !== "all").map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Status</label>
                <select
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as OperationStatus }))}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                >
                  {statuses.filter((status) => status !== "all").map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Eingriff</label>
                <Input
                  value={form.operationType}
                  onChange={(event) => setForm((prev) => ({ ...prev, operationType: event.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Chirurg</label>
                <Input value={form.surgeon} onChange={(event) => setForm((prev) => ({ ...prev, surgeon: event.target.value }))} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Dauer (Min)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.durationMinutes}
                  onChange={(event) => setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Revenue (€)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.revenue}
                  onChange={(event) => setForm((prev) => ({ ...prev, revenue: event.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Kosten (€)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.costs}
                  onChange={(event) => setForm((prev) => ({ ...prev, costs: event.target.value }))}
                />
              </div>
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 border-t border-border/40 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="gap-2">
              Speichern
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ConfirmDeleteModal({ label, onCancel, onConfirm }: { label: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 backdrop-blur">
      <Card className="w-full max-w-md border border-border/60 bg-white/95 shadow-2xl">
        <CardHeader>
          <CardTitle>Operation löschen?</CardTitle>
          <CardDescription>{label}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Löschen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
