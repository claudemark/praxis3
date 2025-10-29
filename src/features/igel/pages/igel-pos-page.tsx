import { useMemo, useState } from "react";
import { Edit2, Printer, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";

import { employees } from "@/data/employees";
import {
  useIgelStore,
  selectTransactionsByPeriod,
  type IgelService,
  type IgelTransaction,
} from "@/features/igel/store/igel-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/datetime";
import type { PaymentMethod } from "@/data/igel";

const paymentOptions: PaymentMethod[] = ["Bar", "Karte"];

type ServiceFormState = {
  id: string;
  name: string;
  description: string;
  price: number;
  goaCodes: string[];
  materials: IgelService["materials"];
};


export function IgelPosPage() {
  const {
    services,
    transactions,
    recordSale,
    createService,
    updateService,
    deleteService,
    updateTransaction,
    deleteTransaction,
  } = useIgelStore();

  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? "");
  const [patient, setPatient] = useState("");
  const [collector, setCollector] = useState(employees[0]?.name ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Bar");
  const [notes, setNotes] = useState("");
  const [periodFilter, setPeriodFilter] = useState<"day" | "week" | "month">("day");
  const [search, setSearch] = useState("");
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<IgelService | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<IgelTransaction | null>(null);

  const filteredTransactions = useMemo(() => {
    const scoped = selectTransactionsByPeriod(transactions, periodFilter);
    if (!search.trim()) return scoped;
    const term = search.toLowerCase();
    return scoped.filter((transaction) => {
      const service = services.find((entry) => entry.id === transaction.serviceId);
      const haystack = `${transaction.patient} ${transaction.collector} ${service?.name ?? ""}`;
      return haystack.toLowerCase().includes(term);
    });
  }, [transactions, periodFilter, search, services]);

  const selectedService = services.find((service) => service.id === selectedServiceId) ?? services[0] ?? null;

  const handleSubmitSale = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedService || !patient.trim()) {
      return;
    }
    const sale = recordSale({
      patient: patient.trim(),
      serviceId: selectedService.id,
      paymentMethod,
      collector,
      notes: notes.trim() || undefined,
    });
    if (sale) {
      setPatient("");
      setNotes("");
      setPaymentMethod("Bar");
      setLastReceipt(sale.id);
    }
  };

  const handlePrint = (transactionId: string) => {
    const transaction = transactions.find((entry) => entry.id === transactionId);
    if (!transaction) return;
    const service = services.find((entry) => entry.id === transaction.serviceId);
    const printWindow = window.open("", "_blank", "width=600,height=800");
    if (!printWindow || !service) return;

    const lines: string[] = [];
    lines.push("<!doctype html><html><head><title>IGeL Beleg</title>");
    lines.push('<meta charset="utf-8" /></head><body style="font-family:Arial,sans-serif;padding:24px;">');
    lines.push('<h2 style="margin-bottom:16px;">PraxisPro Manager – IGeL Beleg</h2>');
    lines.push('<p><strong>Patient:</strong> ' + transaction.patient + '</p>');
    lines.push('<p><strong>Leistung:</strong> ' + service.name + '</p>');
    lines.push('<p><strong>Betrag:</strong> ' + formatCurrency(transaction.amount) + '</p>');
    lines.push('<p><strong>Ziffern:</strong> ' + service.goaCodes.join(", ") + '</p>');
    lines.push('<p><strong>Zahlung:</strong> ' + transaction.paymentMethod + '</p>');
    lines.push('<p><strong>Empfangen von:</strong> ' + transaction.collector + '</p>');
    lines.push('<p><strong>Datum:</strong> ' + formatDateTime(transaction.createdAt) + '</p>');
    if (transaction.notes) {
      lines.push('<p><strong>Notiz:</strong> ' + transaction.notes + '</p>');
    }
    lines.push("</body></html>");

    printWindow.document.open();
    printWindow.document.write(lines.join(""));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDeleteService = (service: IgelService) => {
    if (!window.confirm("Leistung wirklich löschen?")) return;
    deleteService(service.id);
    if (selectedServiceId === service.id) {
      setSelectedServiceId(services.find((entry) => entry.id !== service.id)?.id ?? "");
    }
  };

  const handleDeleteTransaction = (transaction: IgelTransaction) => {
    if (!window.confirm("Transaktion wirklich löschen?")) return;
    deleteTransaction(transaction.id);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">IGeL Management & POS</h1>
          <p className="text-sm text-muted-foreground">
            Leistungen verkaufen, Zahlung dokumentieren und Inventar automatisch aktualisieren.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="muted" className="rounded-full">Inventar-Sync aktiv</Badge>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => { setEditingService(null); setShowServiceModal(true); }}>
            <Plus className="size-4" /> Neue Leistung
          </Button>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Leistungskatalog</CardTitle>
            <CardDescription>Häufig gebuchte Leistungen mit passenden GOÄ-Ziffern und Materialverbrauch.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedServiceId(service.id)}
                className={cn(
                  "flex flex-col gap-2 rounded-2xl border px-4 py-3 text-left shadow-sm transition",
                  selectedServiceId === service.id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/30 bg-white/90 hover:border-primary/30 hover:bg-primary/5",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground/90">{service.name}</p>
                    <p className="text-xs text-muted-foreground/80">{service.description}</p>
                  </div>
                  <Badge variant="outline" size="sm">
                    {formatCurrency(service.price)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground/80">
                  <span>GOÄ: {service.goaCodes.join(", ")}</span>
                  <span>Materialien: {service.materials.length ? service.materials.length : "–"}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingService(service);
                      setShowServiceModal(true);
                    }}
                  >
                    <Edit2 className="size-3.5" /> Bearbeiten
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteService(service);
                    }}
                  >
                    <Trash2 className="size-3.5" /> Löschen
                  </Button>
                </div>
              </button>
            ))}
            {!services.length ? (
              <div className="rounded-2xl border border-dashed border-border/40 bg-white/90 p-6 text-center text-sm text-muted-foreground">
                Noch keine Leistungen erfasst.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border border-border/40 bg-white/90">
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
            <CardDescription>Patient erfassen, Zahlung dokumentieren, Beleg generieren.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitSale}>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Gewählte Leistung</label>
                <div className="rounded-xl border border-border/40 bg-surface-100/70 p-3">
                  <p className="font-semibold text-foreground/90">{selectedService?.name ?? "–"}</p>
                  <p className="text-xs text-muted-foreground/70">{selectedService?.description ?? "Bitte Leistung wählen"}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground/80">
                    <Badge variant="outline" size="sm">
                      Betrag {selectedService ? formatCurrency(selectedService.price) : "–"}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      GOÄ {selectedService ? selectedService.goaCodes.join(", ") : "–"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Patient</label>
                <Input value={patient} onChange={(event) => setPatient(event.target.value)} required placeholder="Name des Patienten" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Zahlungsmethode</label>
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                    className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                  >
                    {paymentOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Geldeingang erfasst durch</label>
                  <select
                    value={collector}
                    onChange={(event) => setCollector(event.target.value)}
                    className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                  >
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.name}>
                        {employee.name} – {employee.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Notizen</label>
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Serien, Besonderheiten, Diagnosen ..." />
              </div>
              {lastReceipt ? (
                <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                  Letzter Verkauf gespeichert als {lastReceipt}
                </div>
              ) : null}
            </CardContent>
            <div className="flex justify-end gap-2 border-t border-border/40 px-6 py-4">
              <Button type="submit" className="gap-2 rounded-full" disabled={!selectedService}>
                <ShoppingCart className="size-4" /> Verkauf buchen
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Card className="border border-border/40 bg-white/90">
        <CardHeader>
          <CardTitle>Transaktions-Historie</CardTitle>
          <CardDescription>Filter nach Zeitraum, Suche nach Patient oder Leistung.</CardDescription>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-white/80 px-3 py-2">
              <Search className="size-4 text-muted-foreground/70" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-6 border-none bg-transparent text-sm outline-none"
                placeholder="Transaktionen durchsuchen"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
              <span>Zeitraum</span>
              <select
                value={periodFilter}
                onChange={(event) => setPeriodFilter(event.target.value as typeof periodFilter)}
                className="rounded-md border border-border/60 bg-white/80 px-3 py-1"
              >
                <option value="day">Heute</option>
                <option value="week">7 Tage</option>
                <option value="month">Aktueller Monat</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {filteredTransactions.length ? (
            filteredTransactions.map((transaction) => {
              const service = services.find((entry) => entry.id === transaction.serviceId);
              return (
                <div
                  key={transaction.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/40 bg-white p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground/90">{transaction.patient}</p>
                    <p className="text-xs text-muted-foreground/70">{service?.name ?? "Leistung entfernt"}</p>
                  </div>
                  <div className="text-xs text-muted-foreground/70">
                    <p>{transaction.paymentMethod}</p>
                    <p>{formatDateTime(transaction.createdAt)}</p>
                    {transaction.notes ? <p>{transaction.notes}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" size="sm">
                      {formatCurrency(transaction.amount)}
                    </Badge>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => handlePrint(transaction.id)}>
                      <Printer className="size-3.5" /> Beleg
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setEditingTransaction(transaction);
                        setShowTransactionModal(true);
                      }}
                    >
                      <Edit2 className="size-3.5" /> Bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteTransaction(transaction)}
                    >
                      <Trash2 className="size-3.5" /> Löschen
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border/40 bg-white/80 p-6 text-center text-sm text-muted-foreground">
              Keine Transaktionen im ausgewählten Zeitraum.
            </div>
          )}
        </CardContent>
      </Card>

      {showServiceModal ? (
        <ServiceModal
          initial={editingService ?? undefined}
          onClose={() => setShowServiceModal(false)}
          onSubmit={(formState, existingId) => {
            if (existingId) {
              const { id: _discardedId, ...changes } = formState;
              void _discardedId;
              updateService(existingId, {
                name: changes.name,
                description: changes.description,
                price: changes.price,
                goaCodes: changes.goaCodes,
                materials: changes.materials,
              });
              setSelectedServiceId(existingId);
            } else {
              const created = createService({
                id: formState.id || undefined,
                name: formState.name,
                description: formState.description,
                price: formState.price,
                goaCodes: formState.goaCodes,
                materials: formState.materials,
              });
              setSelectedServiceId(created.id);
            }
            setShowServiceModal(false);
          }}
        />
      ) : null}

      {showTransactionModal && editingTransaction ? (
        <TransactionModal
          transaction={editingTransaction}
          services={services}
          onClose={() => {
            setShowTransactionModal(false);
            setEditingTransaction(null);
          }}
          onSubmit={(changes) => {
            updateTransaction(editingTransaction.id, changes);
            setShowTransactionModal(false);
            setEditingTransaction(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ServiceModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: IgelService;
  onClose: () => void;
  onSubmit: (payload: ServiceFormState, existingId?: string) => void;
}) {
  const initialForm: ServiceFormState = initial
    ? {
        id: initial.id ?? "",
        name: initial.name,
        description: initial.description,
        price: initial.price,
        goaCodes: [...initial.goaCodes],
        materials: initial.materials.map((material) => ({ ...material })),
      }
    : {
        id: "",
        name: "",
        description: "",
        price: 0,
        goaCodes: [],
        materials: [],
      };

  const [form, setForm] = useState<ServiceFormState>(initialForm);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const sanitized: ServiceFormState = {
      id: form.id.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number.isFinite(form.price) ? Number(form.price) : 0,
      goaCodes: form.goaCodes,
      materials: form.materials,
    };
    onSubmit(sanitized, initial?.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
      <Card className="w-full max-w-3xl border border-border/40 bg-white/95">
        <CardHeader>
          <CardTitle>{initial ? "Leistung bearbeiten" : "Neue IGeL Leistung"}</CardTitle>
          <CardDescription>Beschreibung, Honorar und Materialbedarf definieren.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Leistungs-ID (optional)</label>
                <Input
                  value={form.id}
                  onChange={(event) => setForm((prev) => ({ ...prev, id: event.target.value }))}
                  disabled={Boolean(initial)}
                  placeholder="z. B. igel-prp"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Preis</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Name</label>
              <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Beschreibung</label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">GOA-Ziffern (kommagetrennt)</label>
                <Input
                  value={form.goaCodes.join(", " )}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      goaCodes: event.target.value
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Material (itemId:menge je Zeile)</label>
                <Textarea
                  value={form.materials.map((material) => `${material.itemId}:${material.quantity}`).join("\n")}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      materials: event.target.value
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => {
                          const [itemId, amount] = line.split(":");
                          return {
                            itemId: itemId?.trim() ?? "",
                            quantity: Number(amount) || 0,
                          };
                        })
                        .filter((entry) => entry.itemId),
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 border-t border-border/40 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="gap-2 rounded-full">
              {initial ? "Aenderungen speichern" : "Leistung anlegen"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
function TransactionModal({
  transaction,
  services,
  onClose,
  onSubmit,
}: {
  transaction: IgelTransaction;
  services: IgelService[];
  onClose: () => void;
  onSubmit: (changes: Partial<IgelTransaction>) => void;
}) {
  const [form, setForm] = useState({
    patient: transaction.patient,
    collector: transaction.collector,
    paymentMethod: transaction.paymentMethod,
    serviceId: transaction.serviceId,
    notes: transaction.notes ?? "",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.patient.trim()) return;
    onSubmit({
      patient: form.patient.trim(),
      collector: form.collector.trim(),
      paymentMethod: form.paymentMethod,
      serviceId: form.serviceId,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
      <Card className="w-full max-w-xl border border-border/40 bg-white/95">
        <CardHeader>
          <CardTitle>Transaktion bearbeiten</CardTitle>
          <CardDescription>Patientenname, Zahlungsart und Notiz anpassen.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Patient</label>
              <Input value={form.patient} onChange={(event) => setForm((prev) => ({ ...prev, patient: event.target.value }))} required />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Leistung</label>
                <select
                  value={form.serviceId}
                  onChange={(event) => setForm((prev) => ({ ...prev, serviceId: event.target.value }))}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Zahlungsmethode</label>
                <select
                  value={form.paymentMethod}
                  onChange={(event) => setForm((prev) => ({ ...prev, paymentMethod: event.target.value as PaymentMethod }))}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                >
                  {paymentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Erfasst durch</label>
              <Input value={form.collector} onChange={(event) => setForm((prev) => ({ ...prev, collector: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Notiz</label>
              <Textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} rows={3} />
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



