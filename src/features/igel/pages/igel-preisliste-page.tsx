import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Pencil, Plus, X } from "lucide-react";

import {
  useIgelStore,
  type IgelPriceListEntry,
} from "@/features/igel/store/igel-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type SortKey = "treatment" | "price";
type SortDirection = "asc" | "desc";

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

const defaultSort: SortState = { key: "treatment", direction: "asc" };

interface PriceEntryFormState {
  treatment: string;
  unit: string;
  price: string;
  cycle: string;
  notes: string;
}

export function IgelPreislistePage() {
  const { priceList, addPriceListEntry, updatePriceListEntry } = useIgelStore();

  const [query, setQuery] = useState("");
  const [sortState, setSortState] = useState<SortState>(defaultSort);
  const [formState, setFormState] = useState<PriceEntryFormState>({
    treatment: "",
    unit: "1",
    price: "",
    cycle: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<PriceEntryFormState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const sortedEntries = useMemo(() => {
    const entries = [...priceList];
    entries.sort((a, b) => {
      if (sortState.key === "treatment") {
        const compare = a.treatment.localeCompare(b.treatment, "de-DE", { sensitivity: "base" });
        return sortState.direction === "asc" ? compare : -compare;
      }
      const diff = a.price - b.price;
      if (diff === 0) {
        const fallback = a.treatment.localeCompare(b.treatment, "de-DE", { sensitivity: "base" });
        return sortState.direction === "asc" ? fallback : -fallback;
      }
      return sortState.direction === "asc" ? diff : -diff;
    });
    return entries;
  }, [priceList, sortState]);

  const filteredEntries = useMemo(() => {
    if (!query.trim()) {
      return sortedEntries;
    }
    const normalized = query.trim().toLocaleLowerCase("de-DE");
    return sortedEntries.filter((entry) => includesText(entry, normalized));
  }, [query, sortedEntries]);

  const handleSortToggle = (key: SortKey) => {
    setSortState((previous) => {
      if (previous.key === key) {
        return {
          key,
          direction: previous.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const handleFormChange = (field: keyof PriceEntryFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const treatment = formState.treatment.trim();
    const unit = formState.unit.trim();
    const priceValue = Number.parseFloat(formState.price.replace(",", "."));
    if (!treatment) {
      setError("Bitte geben Sie eine Bezeichnung für die Leistung an.");
      return;
    }
    if (!unit) {
      setError("Bitte geben Sie eine Einheit an.");
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setError("Bitte geben Sie einen gültigen Preis größer 0 an.");
      return;
    }

    addPriceListEntry({
      treatment,
      unit,
      price: Math.round(priceValue * 100) / 100,
      cycle: formState.cycle.trim() || undefined,
      notes: formState.notes.trim() || undefined,
    });

    setFormState({
      treatment: "",
      unit: "1",
      price: "",
      cycle: "",
      notes: "",
    });
    setError(null);
    setQuery("");
    setSortState(defaultSort);
  };

  const startEditing = (entry: IgelPriceListEntry) => {
    setEditingId(entry.id);
    setEditState({
      treatment: entry.treatment,
      unit: entry.unit,
      price: entry.price.toString(),
      cycle: entry.cycle ?? "",
      notes: entry.notes ?? "",
    });
    setEditError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditState(null);
    setEditError(null);
  };

  const handleEditChange = (field: keyof PriceEntryFormState, value: string) => {
    if (!editState) return;
    setEditState({ ...editState, [field]: value });
    if (editError) {
      setEditError(null);
    }
  };

  const handleSaveEdit = (id: string) => {
    if (!editState) return;
    const treatment = editState.treatment.trim();
    const unit = editState.unit.trim();
    const priceValue = Number.parseFloat(editState.price.replace(",", "."));
    if (!treatment) {
      setEditError("Bitte geben Sie eine Bezeichnung für die Leistung an.");
      return;
    }
    if (!unit) {
      setEditError("Bitte geben Sie eine Einheit an.");
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setEditError("Bitte geben Sie einen gültigen Preis größer 0 an.");
      return;
    }
    updatePriceListEntry(id, {
      treatment,
      unit,
      price: Math.round(priceValue * 100) / 100,
      cycle: editState.cycle.trim() || undefined,
      notes: editState.notes.trim() || undefined,
    });
    cancelEditing();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Preisliste</h2>
        <p className="text-sm text-muted-foreground">
          Leistungen ergänzen und verwalten. Alle Einträge erscheinen automatisch im Kassenbuch.
        </p>
      </div>

      <Card className="border border-border/40 bg-white/95">
        <CardHeader className="gap-2">
          <CardTitle>Leistungskatalog</CardTitle>
          <CardDescription>
            Nutzen Sie die Suche oder sortieren Sie nach Name und Preis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Leistung suchen ..."
              aria-label="Leistung suchen"
            />
          </div>

          {filteredEntries.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed border-separate border-spacing-y-1 text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground/70">
                  <tr>
                    <SortableHeader
                      label="Behandlung"
                      active={sortState.key === "treatment"}
                      direction={sortState.direction}
                      onClick={() => handleSortToggle("treatment")}
                    />
                    <th className="px-3 py-2 text-left font-medium">Einheit</th>
                    <SortableHeader
                      label="Preis"
                      active={sortState.key === "price"}
                      direction={sortState.direction}
                      onClick={() => handleSortToggle("price")}
                    />
                    <th className="px-3 py-2 text-left font-medium">Zyklus</th>
                    <th className="px-3 py-2 text-left font-medium">Notiz</th>
                    <th className="px-3 py-2 text-right font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => {
                    const isEditing = editingId === entry.id && editState;
                    return (
                      <tr key={entry.id} className="rounded-lg border border-border/40 bg-white/90 text-foreground/90">
                        <td className="px-3 py-2 font-medium">
                          {isEditing ? (
                            <Input
                              value={editState?.treatment ?? ""}
                              onChange={(event) => handleEditChange("treatment", event.target.value)}
                            />
                          ) : (
                            entry.treatment
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <Input
                              value={editState?.unit ?? ""}
                              onChange={(event) => handleEditChange("unit", event.target.value)}
                            />
                          ) : (
                            entry.unit || "—"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <Input
                              value={editState?.price ?? ""}
                              inputMode="decimal"
                              onChange={(event) => handleEditChange("price", event.target.value)}
                            />
                          ) : (
                            formatCurrency(entry.price)
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <Input
                              value={editState?.cycle ?? ""}
                              onChange={(event) => handleEditChange("cycle", event.target.value)}
                            />
                          ) : (
                            entry.cycle || "—"
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground/80">
                          {isEditing ? (
                            <Textarea
                              value={editState?.notes ?? ""}
                              onChange={(event) => handleEditChange("notes", event.target.value)}
                              rows={2}
                            />
                          ) : (
                            entry.notes || "—"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="size-8"
                                  onClick={() => handleSaveEdit(entry.id)}
                                >
                                  <Check className="size-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="size-8"
                                  onClick={cancelEditing}
                                >
                                  <X className="size-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8"
                                onClick={() => startEditing(entry)}
                                aria-label={`Leistung ${entry.treatment} bearbeiten`}
                              >
                                <Pencil className="size-4" />
                              </Button>
                            )}
                          </div>
                          {isEditing && editError ? (
                            <p className="pt-1 text-xs text-destructive">{editError}</p>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/40 bg-white/80 p-6 text-center text-sm text-muted-foreground">
              Keine Leistungen gefunden.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border/40 bg-white/95">
        <CardHeader>
          <CardTitle>Neue Leistung anlegen</CardTitle>
          <CardDescription>
            Füllen Sie die Felder aus und speichern Sie, um den Leistungskatalog zu erweitern.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 text-sm">
            <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Behandlung</label>
                <Input
                  value={formState.treatment}
                  onChange={(event) => handleFormChange("treatment", event.target.value)}
                  placeholder="z. B. Hyaluron Knie"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Einheit</label>
                <Input
                  value={formState.unit}
                  onChange={(event) => handleFormChange("unit", event.target.value)}
                  placeholder="z. B. 1"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Preis</label>
                <Input
                  value={formState.price}
                  inputMode="decimal"
                  onChange={(event) => handleFormChange("price", event.target.value)}
                  placeholder="z. B. 150"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Zyklus</label>
                <Input
                  value={formState.cycle}
                  onChange={(event) => handleFormChange("cycle", event.target.value)}
                  placeholder="z. B. 2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Notiz</label>
                <Textarea
                  value={formState.notes}
                  onChange={(event) => handleFormChange("notes", event.target.value)}
                  rows={2}
                  placeholder="Besonderheiten für das Team"
                />
              </div>
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <div className="flex justify-end">
              <Button type="submit" className="gap-2">
                <Plus className="size-4" />
                Leistung speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function includesText(entry: IgelPriceListEntry, needle: string) {
  return entry.treatment.toLocaleLowerCase("de-DE").includes(needle);
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className="px-3 py-2 text-left font-medium">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground/80 transition hover:text-primary"
        aria-pressed={active}
      >
        {label}
        <Icon className="size-3.5" />
      </button>
    </th>
  );
}
