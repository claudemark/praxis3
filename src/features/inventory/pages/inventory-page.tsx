import { FormEvent, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  ClipboardList,
  Download,
  History,
  Mail,
  PackagePlus,
  Phone,
  Pencil,
  Plus,
  ScanBarcode,
  Trash2,
  Truck,
} from "lucide-react";

import type { InventoryItem, InventoryMovement, InventoryStatus } from "@/data/inventory";
import { useInventoryStore, selectInventoryMetrics } from "@/features/inventory/store/inventory-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

const statusLabels: Record<InventoryStatus, string> = {
  ok: "Im Soll",
  low: "Niedrig",
  critical: "Kritisch",
  reserved: "Reserviert",
};

const statusStyles: Record<InventoryStatus, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  low: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
  reserved: "border-sky-200 bg-sky-50 text-sky-700",
};

const statusOptions: InventoryStatus[] = ["ok", "low", "critical", "reserved"];

type CreateItemPayload = Omit<InventoryItem, "id" | "lastMovement"> & {
  id?: string;
  lastMovement?: string;
};

type InventoryFormValues = {
  id: string;
  name: string;
  category: string;
  status: InventoryStatus;
  vendor: string;
  unitCost: string;
  stock: string;
  minStock: string;
  unit: string;
  location: string;
  lot: string;
  expiry: string;
  weeklyUsage: string;
  reserved: string;
  linkedPatients: string;
  supplierEmail: string;
  supplierPhone: string;
  supplierNotes: string;
};

function createEmptyForm(): InventoryFormValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: "",
    name: "",
    category: "",
    status: "ok",
    vendor: "",
    unitCost: "0",
    stock: "0",
    minStock: "0",
    unit: "Stück",
    location: "",
    lot: "",
    expiry: today,
    weeklyUsage: "0",
    reserved: "0",
    linkedPatients: "0",
    supplierEmail: "",
    supplierPhone: "",
    supplierNotes: "",
  };
}

function itemToFormValues(item: InventoryItem): InventoryFormValues {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    status: item.status,
    vendor: item.vendor,
    unitCost: String(item.unitCost),
    stock: String(item.stock),
    minStock: String(item.minStock),
    unit: item.unit,
    location: item.location,
    lot: item.lot,
    expiry: item.expiry.slice(0, 10),
    weeklyUsage: String(item.weeklyUsage),
    reserved: String(item.reserved),
    linkedPatients: String(item.linkedPatients),
    supplierEmail: item.supplierEmail ?? "",
    supplierPhone: item.supplierPhone ?? "",
    supplierNotes: item.supplierNotes ?? "",
  };
}

function parseNumeric(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return 0;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function buildCreatePayload(values: InventoryFormValues): CreateItemPayload {
  const name = values.name.trim();
  const vendor = values.vendor.trim();
  const category = values.category.trim();
  const unit = values.unit.trim();
  const location = values.location.trim();
  const lot = values.lot.trim();
  const expiry = values.expiry.trim() || new Date().toISOString().slice(0, 10);

  return {
    id: optionalString(values.id),
    name: name || "Neuer Artikel",
    vendor: vendor || "Unbekannter Lieferant",
    category: category || "Allgemein",
    status: values.status,
    unitCost: Math.max(0, parseNumeric(values.unitCost)),
    stock: Math.max(0, Math.round(parseNumeric(values.stock))),
    minStock: Math.max(0, Math.round(parseNumeric(values.minStock))),
    unit: unit || "Stück",
    location: location || "Lager",
    lot: lot || "-",
    expiry,
    weeklyUsage: Math.max(0, Math.round(parseNumeric(values.weeklyUsage))),
    reserved: Math.max(0, Math.round(parseNumeric(values.reserved))),
    linkedPatients: Math.max(0, Math.round(parseNumeric(values.linkedPatients))),
    supplierEmail: optionalString(values.supplierEmail),
    supplierPhone: optionalString(values.supplierPhone),
    supplierNotes: optionalString(values.supplierNotes),
    lastMovement: new Date().toISOString(),
  };
}

function buildUpdatePayload(values: InventoryFormValues) {
  const payload = buildCreatePayload(values);
  const { id, lastMovement, ...rest } = payload;
  void id;
  void lastMovement;
  return rest;
}

export function InventoryPage() {
  const items = useInventoryStore((state) => state.items);
  const movements = useInventoryStore((state) => state.movements);
  const adjustStock = useInventoryStore((state) => state.adjustStock);
  const logMovement = useInventoryStore((state) => state.logMovement);
  const createItem = useInventoryStore((state) => state.createItem);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const deleteItem = useInventoryStore((state) => state.deleteItem);

  const metrics = useMemo(() => selectInventoryMetrics(items), [items]);
  const totalStockValue = useMemo(
    () => items.reduce((acc, item) => acc + item.unitCost * item.stock, 0),
    [items],
  );

  const categories = useMemo(() => {
    const unique = new Set(items.map((item) => item.category));
    return ["alle", ...Array.from(unique).sort((a, b) => a.localeCompare(b, "de"))];
  }, [items]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | "alle">("alle");
  const [categoryFilter, setCategoryFilter] = useState("alle");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustQuantity, setAdjustQuantity] = useState("0");
  const [adjustNote, setAdjustNote] = useState("Manuelle Bestandskorrektur");
  const [adjustMode, setAdjustMode] = useState<"increase" | "decrease">("decrease");
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [itemFormMode, setItemFormMode] = useState<"create" | "edit">("create");
  const [itemFormValues, setItemFormValues] = useState<InventoryFormValues>(createEmptyForm());
  const [itemFormError, setItemFormError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "alle" && item.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== "alle" && item.category !== categoryFilter) {
        return false;
      }
      if (term) {
        const haystack = [item.name, item.id, item.vendor, item.location]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [items, searchTerm, statusFilter, categoryFilter]);

  const selectedItem = useMemo(
    () => (selectedItemId ? items.find((item) => item.id === selectedItemId) ?? null : null),
    [items, selectedItemId],
  );

  const itemMovements = useMemo(
    () =>
      selectedItemId
        ? movements
            .filter((movement) => movement.itemId === selectedItemId)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        : [],
    [movements, selectedItemId],
  );

  const lowExpiryIds = useMemo(() => {
    const now = new Date();
    const threshold = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 60);
    return new Set(
      items
        .filter((item) => {
          const expiry = new Date(item.expiry);
          return !Number.isNaN(expiry.getTime()) && expiry <= threshold;
        })
        .map((item) => item.id),
    );
  }, [items]);

  function handleAdjustSubmit(item: InventoryItem) {
    const parsed = Number.parseInt(adjustQuantity, 10);
    if (!Number.isFinite(parsed) || parsed === 0) {
      return;
    }
    const delta = adjustMode === "increase" ? Math.abs(parsed) : -Math.abs(parsed);
    const result = adjustStock({
      itemId: item.id,
      quantity: delta,
      actor: "Lager",
      note: adjustNote.trim() || (delta > 0 ? "Auffüllung" : "Verbrauch"),
    });
    if (result) {
      setAdjustQuantity("0");
      setAdjustNote("Manuelle Bestandskorrektur");
      setShowAdjustForm(false);
    }
  }

  function handleReorder(item: InventoryItem) {
    logMovement({
      itemId: item.id,
      type: "ein",
      quantity: 0,
      actor: "Bestell-Workflow",
      note: "Nachbestellung ausgelöst",
      timestamp: new Date().toISOString(),
    });
  }

  function handleConsumptionShortcut(item: InventoryItem) {
    adjustStock({
      itemId: item.id,
      quantity: -1,
      actor: "Verbrauch",
      note: "Schneller Verbrauch",
    });
  }

  function handleOpenCreate() {
    setItemFormMode("create");
    setItemFormValues(createEmptyForm());
    setItemFormError(null);
    setEditingItemId(null);
    setShowAdjustForm(false);
    setIsItemFormOpen(true);
  }

  function handleOpenEdit(item: InventoryItem) {
    setItemFormMode("edit");
    setItemFormValues(itemToFormValues(item));
    setItemFormError(null);
    setEditingItemId(item.id);
    setShowAdjustForm(false);
    setSelectedItemId(item.id);
    setIsItemFormOpen(true);
  }

  function handleItemFormChange<K extends keyof InventoryFormValues>(field: K, value: InventoryFormValues[K]) {
    setItemFormValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleItemFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setItemFormError(null);

    if (!itemFormValues.name.trim()) {
      setItemFormError("Bitte gib einen Artikelnamen an.");
      return;
    }
    if (!itemFormValues.category.trim()) {
      setItemFormError("Bitte gib eine Kategorie an.");
      return;
    }
    if (!itemFormValues.unit.trim()) {
      setItemFormError("Bitte gib eine Einheit an.");
      return;
    }
    if (!itemFormValues.location.trim()) {
      setItemFormError("Bitte gib einen Standort an.");
      return;
    }
    if (!itemFormValues.vendor.trim()) {
      setItemFormError("Bitte gib einen Lieferanten an.");
      return;
    }

    if (itemFormMode === "create") {
      const created = createItem(buildCreatePayload(itemFormValues));
      setSelectedItemId(created.id);
    } else if (itemFormMode === "edit" && editingItemId) {
      updateItem(editingItemId, buildUpdatePayload(itemFormValues));
      setSelectedItemId(editingItemId);
    }

    setIsItemFormOpen(false);
    setItemFormValues(createEmptyForm());
    setEditingItemId(null);
    setItemFormError(null);
  }

  function handleDeleteItem(item: InventoryItem) {
    const confirmed = window.confirm(
      `Soll der Artikel "${item.name}" (ID ${item.id}) wirklich gelöscht werden?`,
    );
    if (!confirmed) {
      return;
    }
    deleteItem(item.id);
    setSelectedItemId(null);
    setIsItemFormOpen(false);
    setEditingItemId(null);
    setItemFormValues(createEmptyForm());
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground/90">Lagerverwaltung</h1>
          <p className="text-sm text-muted-foreground/80">
            Kennzahlen, kritische Bestände und Audit-Log – ohne den bestehenden Workflow anzutasten.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-2" type="button" onClick={handleOpenCreate}>
            <Plus className="size-4" /> Artikel anlegen
          </Button>
          <Button variant="outline" size="sm" className="gap-2" type="button">
            <ScanBarcode className="size-4" /> Barcode scannen
          </Button>
          <Button
            size="sm"
            className="gap-2"
            type="button"
            disabled={!selectedItem}
            onClick={() => selectedItem && setShowAdjustForm(true)}
          >
            <Boxes className="size-4" /> Bestandskorrektur
          </Button>
          <Button size="sm" className="gap-2" type="button" onClick={() => window.print()}>
            <Download className="size-4" /> Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kennzahlen</CardTitle>
          <CardDescription>Live aus den aktuellen Stammdaten ermittelt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Gesamtwert Bestand" value={formatCurrency(totalStockValue)} icon={<Boxes className="size-4 text-primary" />} />
            <MetricCard label="Artikel unter Mindestbestand" value={formatNumber(metrics.lowStock)} icon={<AlertTriangle className="size-4 text-amber-500" />} />
            <MetricCard label="Kritische Implantate" value={formatNumber(metrics.criticalImplants)} icon={<Activity className="size-4 text-red-500" />} />
            <MetricCard label="Pending Orders" value={formatNumber(metrics.pendingOrders)} icon={<Truck className="size-4 text-sky-500" />} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bestand</CardTitle>
          <CardDescription>Such- und Filterfunktionen bleiben unverändert, nur ergänzt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Suchen nach Artikel, ID, Lieferant oder Standort"
              className="w-64"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as InventoryStatus | "alle")}
              className="rounded-md border border-border/50 bg-white px-3 py-2 text-sm"
            >
              <option value="alle">Status: Alle</option>
              <option value="ok">Im Soll</option>
              <option value="low">Niedrig</option>
              <option value="critical">Kritisch</option>
              <option value="reserved">Reserviert</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-md border border-border/50 bg-white px-3 py-2 text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "alle" ? "Kategorien" : category}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-surface-100/70 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Artikel</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Bestand</th>
                  <th className="px-3 py-2 text-right">Verbrauch/Woche</th>
                  <th className="px-3 py-2 text-left">Lieferant</th>
                  <th className="px-3 py-2 text-left">Verfall</th>
                  <th className="px-3 py-2 text-right">Wert</th>
                  <th className="px-3 py-2 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLowExpiry = lowExpiryIds.has(item.id);
                  const utilization = Math.min(100, Math.round((item.stock / Math.max(item.minStock, 1)) * 100));
                  const totalValue = item.unitCost * item.stock;
                  return (
                    <tr key={item.id} className="border-b border-border/30 last:border-none">
                      <td className="px-3 py-3">
                        <div className="font-medium text-foreground/90">{item.name}</div>
                        <div className="text-xs text-muted-foreground/70">{item.id} · {item.category}</div>
                        <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-border/50">
                          <span className="block h-full rounded-full bg-primary/70" style={{ width: `${utilization}%` }} />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={statusStyles[item.status]}>{statusLabels[item.status]}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-foreground/90">
                        {formatNumber(item.stock)} {item.unit}
                        <div className="text-xs text-muted-foreground/70">Mindestbestand {item.minStock}</div>
                      </td>
                      <td className="px-3 py-3 text-right text-muted-foreground/80">{formatNumber(item.weeklyUsage)}</td>
                      <td className="px-3 py-3 text-muted-foreground/80">
                        <div>{item.vendor}</div>
                        {item.supplierEmail ? <div className="text-xs text-muted-foreground/70">{item.supplierEmail}</div> : null}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground/80">
                        <div className={cn("font-medium", isLowExpiry ? "text-amber-600" : "text-foreground/80")}>{formatDate(item.expiry)}</div>
                        <div className="text-xs text-muted-foreground/70">Los {item.lot}</div>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-foreground/90">{formatCurrency(totalValue)}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setSelectedItemId(item.id);
                              setShowAdjustForm(false);
                            }}
                          >
                            <ClipboardList className="size-3" /> Details
                          </Button>
                          <Button type="button" size="xs" variant="ghost" onClick={() => handleOpenEdit(item)}>
                            <Pencil className="size-3" />
                          </Button>
                          <Button type="button" size="xs" variant="ghost" onClick={() => handleConsumptionShortcut(item)}>
                            -1
                          </Button>
                          <Button type="button" size="xs" variant="ghost" onClick={() => handleReorder(item)}>
                            <Truck className="size-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredItems.length ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-xs text-muted-foreground/70">
                      Keine Artikel entsprechen den aktuellen Filtern.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Bewegungen</CardTitle>
          <CardDescription>Chronologischer Audit-Log aller Lagerbuchungen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground/80">Noch keine Bewegungen erfasst.</p>
          ) : (
            movements
              .slice()
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
              .slice(0, 8)
              .map((movement) => {
                const article = items.find((item) => item.id === movement.itemId);
                const tone = movement.type === "ein" ? "text-emerald-600" : movement.type === "aus" ? "text-red-600" : "text-slate-600";
                const symbol = movement.type === "ein" ? "+" : movement.type === "aus" ? "-" : "±";
                return (
                  <div key={movement.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border/40 bg-white px-4 py-3">
                    <div>
                      <div className="font-medium text-foreground/90">{article?.name ?? movement.itemId}</div>
                      <div className="text-xs text-muted-foreground/70">{movement.note || "Keine Notiz"}</div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground/80">
                      <div className={cn("font-semibold", tone)}>
                        {symbol}
                        {Math.abs(movement.quantity)}
                      </div>
                      <div className="text-xs">{formatDateTime(movement.timestamp)} · {movement.actor}</div>
                    </div>
                  </div>
                );
              })
          )}
        </CardContent>
      </Card>

      {selectedItem ? (
        <DetailDrawer
          item={selectedItem}
          movements={itemMovements}
          onClose={() => setSelectedItemId(null)}
          onAdjust={() => {
            setAdjustMode("decrease");
            setShowAdjustForm(true);
          }}
          onConsume={() => handleConsumptionShortcut(selectedItem)}
          onEdit={() => handleOpenEdit(selectedItem)}
          onDelete={() => handleDeleteItem(selectedItem)}
        />
      ) : null}

      {isItemFormOpen ? (
        <ItemFormModal
          mode={itemFormMode}
          values={itemFormValues}
          error={itemFormError}
          onChange={handleItemFormChange}
          onClose={() => {
            setIsItemFormOpen(false);
            setItemFormError(null);
          }}
          onSubmit={handleItemFormSubmit}
          categories={categories}
        />
      ) : null}

      {showAdjustForm && selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-lg border border-border/50 bg-white">
            <CardHeader>
              <CardTitle>Bestand anpassen</CardTitle>
              <CardDescription>{selectedItem.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Modus</label>
                  <select
                    value={adjustMode}
                    onChange={(event) => setAdjustMode(event.target.value as "increase" | "decrease")}
                    className="w-full rounded-md border border-border/50 bg-white px-3 py-2 text-sm"
                  >
                    <option value="increase">Bestand erhöhen</option>
                    <option value="decrease">Verbrauch buchen</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Menge</label>
                  <Input
                    value={adjustQuantity}
                    onChange={(event) => setAdjustQuantity(event.target.value)}
                    inputMode="numeric"
                    placeholder="z. B. 3"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Notiz</label>
                <Textarea
                  value={adjustNote}
                  onChange={(event) => setAdjustNote(event.target.value)}
                  rows={3}
                  placeholder="z. B. Entnahme für Patient 20451"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowAdjustForm(false)}>
                  Abbrechen
                </Button>
                <Button type="button" onClick={() => handleAdjustSubmit(selectedItem)}>
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-white/95 px-4 py-3">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground/70">{label}</div>
        <div className="text-xl font-semibold text-foreground/90">{value}</div>
      </div>
      <span>{icon}</span>
    </div>
  );
}

function ItemFormModal({
  mode,
  values,
  error,
  onChange,
  onClose,
  onSubmit,
  categories,
}: {
  mode: "create" | "edit";
  values: InventoryFormValues;
  error: string | null;
  onChange: <K extends keyof InventoryFormValues>(field: K, value: InventoryFormValues[K]) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  categories: string[];
}) {
  const categorySuggestions = categories.filter((category) => category !== "alle");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Card className="w-full max-w-3xl border border-border/50 bg-white shadow-xl">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Artikel anlegen" : "Artikel bearbeiten"}</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Lege einen neuen Lagerartikel samt Startbestand an."
              : "Passe Stammdaten, Bestandswerte und Lieferanteninformationen an."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  Artikel-ID {mode === "create" ? "(optional)" : ""}
                </label>
                <Input
                  value={values.id}
                  onChange={(event) => onChange("id", event.target.value)}
                  placeholder="INV-9001"
                  disabled={mode === "edit"}
                />
                {mode === "edit" ? (
                  <p className="mt-1 text-[11px] text-muted-foreground/60">Die ID bleibt bestehen, damit Verknüpfungen erhalten bleiben.</p>
                ) : null}
              </div>
              <div className="md:col-span-2 lg:col-span-2">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Artikelname *</label>
                <Input
                  value={values.name}
                  onChange={(event) => onChange("name", event.target.value)}
                  placeholder="z. B. Schulter TEP Set"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Kategorie *</label>
                <Input
                  value={values.category}
                  onChange={(event) => onChange("category", event.target.value)}
                  placeholder="Implantate"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Status</label>
                <select
                  value={values.status}
                  onChange={(event) => onChange("status", event.target.value as InventoryStatus)}
                  className="w-full rounded-md border border-border/50 bg-white px-3 py-2 text-sm"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Einstandspreis (€)</label>
                <Input
                  value={values.unitCost}
                  onChange={(event) => onChange("unitCost", event.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Bestand *</label>
                <Input
                  value={values.stock}
                  onChange={(event) => onChange("stock", event.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Mindestbestand *</label>
                <Input
                  value={values.minStock}
                  onChange={(event) => onChange("minStock", event.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Einheit *</label>
                <Input
                  value={values.unit}
                  onChange={(event) => onChange("unit", event.target.value)}
                  placeholder="Stück"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Verbrauch/Woche</label>
                <Input
                  value={values.weeklyUsage}
                  onChange={(event) => onChange("weeklyUsage", event.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Reserviert</label>
                <Input
                  value={values.reserved}
                  onChange={(event) => onChange("reserved", event.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Verknüpfte Patienten</label>
                <Input
                  value={values.linkedPatients}
                  onChange={(event) => onChange("linkedPatients", event.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Standort *</label>
                <Input
                  value={values.location}
                  onChange={(event) => onChange("location", event.target.value)}
                  placeholder="z. B. Lager A / Regal 3"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Los / Charge</label>
                <Input
                  value={values.lot}
                  onChange={(event) => onChange("lot", event.target.value)}
                  placeholder="LOT-123"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Verfallsdatum</label>
                <Input
                  type="date"
                  value={values.expiry}
                  onChange={(event) => onChange("expiry", event.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Lieferant *</label>
                <Input
                  value={values.vendor}
                  onChange={(event) => onChange("vendor", event.target.value)}
                  placeholder="z. B. OrthoMed GmbH"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Lieferanten E-Mail</label>
                <Input
                  value={values.supplierEmail}
                  onChange={(event) => onChange("supplierEmail", event.target.value)}
                  placeholder="bestellung@example.de"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Lieferanten Telefon</label>
                <Input
                  value={values.supplierPhone}
                  onChange={(event) => onChange("supplierPhone", event.target.value)}
                  placeholder="+49 ..."
                />
              </div>
            </div>

            {categorySuggestions.length ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground/60">Beliebte Kategorien:</span>
                {categorySuggestions.map((category) => (
                  <Button
                    key={category}
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => onChange("category", category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            ) : null}

            <div>
              <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Interne Notizen</label>
              <Textarea
                value={values.supplierNotes}
                onChange={(event) => onChange("supplierNotes", event.target.value)}
                rows={3}
                placeholder="Rahmenvertrag, Lieferkonditionen, Ansprechpartner ..."
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : (
                <span className="text-xs text-muted-foreground/70">
                  * Pflichtfelder für einen vollständigen Datensatz
                </span>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Abbrechen
                </Button>
                <Button type="submit">{mode === "create" ? "Artikel anlegen" : "Änderungen speichern"}</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailDrawer({
  item,
  movements,
  onClose,
  onAdjust,
  onConsume,
  onEdit,
  onDelete,
}: {
  item: InventoryItem;
  movements: InventoryMovement[];
  onClose: () => void;
  onAdjust: () => void;
  onConsume: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
      <aside className="h-full w-full max-w-lg overflow-y-auto border-l border-border/40 bg-white shadow-xl">
        <div className="sticky top-0 flex flex-wrap items-start justify-between gap-3 border-b border-border/30 bg-white/95 p-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground/90">{item.name}</h2>
              <Badge className={statusStyles[item.status]}>{statusLabels[item.status]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground/70">ID {item.id} · {item.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="size-3" /> Bearbeiten
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Schließen
            </Button>
          </div>
        </div>

        <div className="space-y-6 p-4">
          <section className="grid gap-3 rounded-lg border border-border/40 bg-white/95 px-4 py-3">
            <InfoRow label="Bestand" value={`${formatNumber(item.stock)} ${item.unit}`} />
            <InfoRow label="Mindestbestand" value={formatNumber(item.minStock)} />
            <InfoRow label="Verbrauch/Woche" value={`${formatNumber(item.weeklyUsage)} ${item.unit}`} />
            <InfoRow label="Standort" value={item.location} />
            <InfoRow label="Los / Charge" value={item.lot} />
            <InfoRow label="Verfallsdatum" value={formatDate(item.expiry)} />
            <InfoRow label="Reserviert" value={`${item.reserved} ${item.unit}`} />
            <InfoRow label="Verkn. Patienten" value={formatNumber(item.linkedPatients)} />
            <InfoRow label="Lieferant" value={item.vendor} />
            {item.supplierNotes ? (
              <div className="rounded-md border border-dashed border-border/40 bg-surface-50 px-3 py-2 text-xs text-muted-foreground/80">
                {item.supplierNotes}
              </div>
            ) : null}
            {item.supplierEmail || item.supplierPhone ? (
              <div className="flex gap-2">
                {item.supplierEmail ? (
                  <Button type="button" variant="outline" size="xs" className="gap-1">
                    <Mail className="size-3" /> Mail
                  </Button>
                ) : null}
                {item.supplierPhone ? (
                  <Button type="button" variant="outline" size="xs" className="gap-1">
                    <Phone className="size-3" /> Anrufen
                  </Button>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80">Schnellaktionen</h3>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={onAdjust}>
                <Boxes className="size-3" /> Bestandskorrektur
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={onConsume}>
                <PackagePlus className="size-3" /> Verbrauch -1
              </Button>
              <Button type="button" size="sm" variant="ghost">
                <History className="size-3" /> Audit anzeigen
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={onDelete}>
                <Trash2 className="size-3" /> Löschen
              </Button>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground/80">Bewegungen</h3>
            <div className="space-y-2">
              {movements.length === 0 ? (
                <p className="text-xs text-muted-foreground/70">Keine Bewegungen für diesen Artikel gespeichert.</p>
              ) : (
                movements.slice(0, 10).map((movement) => (
                  <div key={movement.id} className="rounded-lg border border-border/40 bg-white px-3 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground/80">{movement.type.toUpperCase()}</span>
                      <span>{formatDateTime(movement.timestamp)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-muted-foreground/70">
                      <span>Menge: {movement.quantity}</span>
                      <span>{movement.actor}</span>
                    </div>
                    {movement.note ? <div className="mt-1 text-muted-foreground/70">{movement.note}</div> : null}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground/70">{label}</span>
      <span className="font-medium text-foreground/90">{value}</span>
    </div>
  );
}

export default InventoryPage;

