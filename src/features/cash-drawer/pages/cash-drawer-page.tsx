import { useEffect, useMemo, useState } from "react";
import { Banknote, Coins, MinusCircle, PlusCircle, Receipt, Wallet, Wand2 } from "lucide-react";

import { useCashDrawerStore } from "@/features/cash-drawer/store/cash-drawer-store";
import { pettyCashCategories, type CashMovementType } from "@/data/cash-drawer";
import { useEmployeeDirectory, type EmployeeProfile } from "@/features/employees/store/employee-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { formatDateTime } from "@/lib/datetime";

type ExpenseFormState = {
  amount: string;
  category: (typeof pettyCashCategories)[number];
  description: string;
  employeeId: string;
};

type FloatFormState = {
  amount: string;
  description: string;
  employeeId: string;
};

type SnapshotFormState = {
  counted: string;
  note: string;
  employeeId: string;
};

export function CashDrawerPage() {
  const { movements, snapshots, currentBalance, registerExpense, registerFloat, recordSnapshot } = useCashDrawerStore();
  const employeeDirectory = useEmployeeDirectory((state) => state.employees) as EmployeeProfile[];
  const employees = useMemo(() => employeeDirectory.filter((employee) => employee.active), [employeeDirectory]);
  const employeeNameLookup = useMemo(
    () => new Map(employeeDirectory.map((employee) => [employee.id, employee.name])),
    [employeeDirectory],
  );

  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(() => ({
    amount: "",
    category: pettyCashCategories[0] ?? "Sonstiges",
    description: "",
    employeeId: employees[0]?.id ?? "",
  }));
  const [floatForm, setFloatForm] = useState<FloatFormState>(() => ({
    amount: "",
    description: "",
    employeeId: employees[0]?.id ?? "",
  }));
  const [snapshotForm, setSnapshotForm] = useState<SnapshotFormState>(() => ({
    counted: "",
    note: "",
    employeeId: employees[0]?.id ?? "",
  }));
  const [movementSearch, setMovementSearch] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState<"all" | CashMovementType>("all");
  const [movementDateRange, setMovementDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [movementPage, setMovementPage] = useState(1);
  const MOVEMENTS_PAGE_SIZE = 10;
  useEffect(() => {
    setMovementPage(1);
  }, [movementSearch, movementTypeFilter, movementDateRange.from, movementDateRange.to]);

  useEffect(() => {
    if (!employees.length) {
      setExpenseForm((prev) => ({ ...prev, employeeId: "" }));
      setFloatForm((prev) => ({ ...prev, employeeId: "" }));
      setSnapshotForm((prev) => ({ ...prev, employeeId: "" }));
      return;
    }
    setExpenseForm((prev) => (prev.employeeId ? prev : { ...prev, employeeId: employees[0]!.id }));
    setFloatForm((prev) => (prev.employeeId ? prev : { ...prev, employeeId: employees[0]!.id }));
    setSnapshotForm((prev) => (prev.employeeId ? prev : { ...prev, employeeId: employees[0]!.id }));
  }, [employees]);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const dailyStats = useMemo(() => {
    return movements.reduce(
      (acc, movement) => {
        if (!movement.timestamp.startsWith(todayKey)) {
          return acc;
        }
        if (movement.type === "sale") {
          acc.sales += movement.amount;
        }
        if (movement.type === "expense") {
          acc.expenses += Math.abs(movement.amount);
        }
        if (movement.type === "reconcile" || movement.type === "adjustment") {
          acc.adjustments += movement.amount;
        }
        return acc;
      },
      { sales: 0, expenses: 0, adjustments: 0 },
    );
  }, [movements, todayKey]);
  const filteredMovements = useMemo(() => {
    const term = movementSearch.trim().toLowerCase();
    const fromDate = movementDateRange.from ? new Date(`${movementDateRange.from}T00:00:00`) : null;
    const toDate = movementDateRange.to ? new Date(`${movementDateRange.to}T23:59:59`) : null;

    return movements.filter((movement) => {
      if (movementTypeFilter !== "all" && movement.type !== movementTypeFilter) {
        return false;
      }
      if (term) {
        const haystack = [
          movement.description,
          movement.category,
          movement.referenceId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) {
          return false;
        }
      }
      if (fromDate || toDate) {
        const timestamp = new Date(movement.timestamp);
        if (fromDate && timestamp < fromDate) {
          return false;
        }
        if (toDate && timestamp > toDate) {
          return false;
        }
      }
      return true;
    });
  }, [movements, movementSearch, movementTypeFilter, movementDateRange]);

  const totalMovementPages = Math.max(1, Math.ceil(filteredMovements.length / MOVEMENTS_PAGE_SIZE));

  useEffect(() => {
    if (movementPage > totalMovementPages) {
      setMovementPage(totalMovementPages);
    }
  }, [movementPage, totalMovementPages]);

  const paginatedMovements = useMemo(() => {
    const start = (movementPage - 1) * MOVEMENTS_PAGE_SIZE;
    return filteredMovements.slice(start, start + MOVEMENTS_PAGE_SIZE);
  }, [filteredMovements, movementPage]);

  const movementRangeStart = filteredMovements.length ? (movementPage - 1) * MOVEMENTS_PAGE_SIZE + 1 : 0;
  const movementRangeEnd = filteredMovements.length
    ? Math.min(movementRangeStart + MOVEMENTS_PAGE_SIZE - 1, filteredMovements.length)
    : 0;

  const lastSnapshot = snapshots[0] ?? null;
  const countedAmount = Number(snapshotForm.counted.replace(",", ".")) || 0;
  const snapshotDifference = countedAmount - currentBalance;
  const snapshotDifferenceTone = !snapshotForm.counted ? "text-muted-foreground/70" : snapshotDifference === 0 ? "text-muted-foreground/70" : snapshotDifference > 0 ? "text-success" : "text-destructive";

  const handleExpenseSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountNumber = Number(expenseForm.amount.replace(",", "."));
    if (!amountNumber || amountNumber <= 0 || !expenseForm.employeeId) {
      return;
    }
    registerExpense({
      amount: amountNumber,
      description: expenseForm.description || "Sonstige Barausgabe",
      employeeId: expenseForm.employeeId,
      category: expenseForm.category,
    });
    setExpenseForm((prev) => ({ ...prev, amount: "", description: "" }));
  };

  const handleFloatSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountNumber = Number(floatForm.amount.replace(",", "."));
    if (!amountNumber || amountNumber <= 0) {
      return;
    }
    registerFloat({
      amount: amountNumber,
      description: floatForm.description || "Barkasse aufgefuellt",
      employeeId: floatForm.employeeId || undefined,
    });
    setFloatForm((prev) => ({ ...prev, amount: "", description: "" }));
  };

  const handleSnapshotSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const countedNumber = Number(snapshotForm.counted.replace(",", "."));
    if (!countedNumber || countedNumber < 0) {
      return;
    }
    recordSnapshot({
      countedAmount: countedNumber,
      note: snapshotForm.note || undefined,
      employeeId: snapshotForm.employeeId || undefined,
    });
    setSnapshotForm((prev) => ({ ...prev, counted: "", note: "" }));
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">Barkasse und Barzahlungen</h1>
          <p className="text-sm text-muted-foreground">
            Ueberblick ueber Barumsatz, Ausgaben und Kassensturz. Jede Bewegung wird einer verantwortlichen Person zugeordnet.
          </p>
        </div>
        <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
          <Wallet className="size-4" /> Aktueller Bestand {formatCurrency(currentBalance)}
        </Badge>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Barbestand"
          value={formatCurrency(currentBalance)}
          description="Saldo nach letzter Buchung"
          icon={<Wallet className="size-5" />}
        />
        <SummaryCard
          title="Barumsatz heute"
          value={formatCurrency(dailyStats.sales)}
          description="Automatisch aus Barverkaeufen"
          icon={<Coins className="size-5 text-emerald-600" />}
        />
        <SummaryCard
          title="Ausgaben heute"
          value={formatCurrency(dailyStats.expenses)}
          description="Petty Cash fuer kleine Einkaeufe"
          icon={<MinusCircle className="size-5 text-amber-600" />}
        />
        <SummaryCard
          title="Letzter Kassensturz"
          value={lastSnapshot ? formatCurrency(lastSnapshot.countedAmount) : "-"}
          description={lastSnapshot ? formatDateTime(lastSnapshot.recordedAt) : "Noch kein Abgleich"}
          icon={<Receipt className="size-5 text-slate-600" />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="border border-border/40 bg-white/95">
          <CardHeader>
            <CardTitle>Bewegungen</CardTitle>
            <CardDescription>Letzte Ein- und Ausgaben</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Suche</label>
                <Input
                  value={movementSearch}
                  onChange={(event) => setMovementSearch(event.target.value)}
                  placeholder="Beschreibung oder Notiz"
                  className="w-48"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Typ</label>
                <select
                  value={movementTypeFilter}
                  onChange={(event) => setMovementTypeFilter(event.target.value as "all" | CashMovementType)}
                  className="rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm"
                >
                  <option value="all">Alle Bewegungen</option>
                  <option value="sale">Einnahme</option>
                  <option value="expense">Ausgabe</option>
                  <option value="float-in">Einlage</option>
                  <option value="reconcile">Abgleich</option>
                  <option value="adjustment">Korrektur</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Von</label>
                <Input
                  type="date"
                  value={movementDateRange.from}
                  onChange={(event) => setMovementDateRange((prev) => ({ ...prev, from: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Bis</label>
                <Input
                  type="date"
                  value={movementDateRange.to}
                  onChange={(event) => setMovementDateRange((prev) => ({ ...prev, to: event.target.value }))}
                />
              </div>
              {(movementSearch || movementTypeFilter !== "all" || movementDateRange.from || movementDateRange.to) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => {
                    setMovementSearch("");
                    setMovementTypeFilter("all");
                    setMovementDateRange({ from: "", to: "" });
                  }}
                >
                  Filter zurücksetzen
                </Button>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm">
                <thead className="bg-surface-100/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Zeitpunkt</th>
                    <th className="px-3 py-2 text-left">Typ</th>
                    <th className="px-3 py-2 text-left">Beschreibung</th>
                    <th className="px-3 py-2 text-right">Betrag</th>
                    <th className="px-3 py-2 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMovements.map((movement) => {
                    const meta = getMovementMeta(movement.type);
                    const employeeName = movement.employeeId
                      ? employeeNameLookup.get(movement.employeeId) ?? movement.employeeId
                      : "System";
                    return (
                      <tr key={movement.id} className="border-b border-border/30 last:border-none">
                        <td className="px-3 py-2 text-muted-foreground/80">{formatDateTime(movement.timestamp)}</td>
                        <td className="px-3 py-2">
                          <Badge variant={meta.variant} size="sm" className="gap-1">
                            {meta.icon}
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-foreground/90">{movement.description}</div>
                          <div className="text-xs text-muted-foreground/70">
                            {`Von ${employeeName}`}
                            {movement.category ? ` · ${movement.category}` : ""}
                            {movement.referenceId ? ` · Ref ${movement.referenceId}` : ""}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-foreground/90">{formatCurrency(movement.amount)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground/80">{formatCurrency(movement.balanceAfter)}</td>
                      </tr>
                    );
                  })}
                  {!paginatedMovements.length ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-xs text-muted-foreground/70">
                        Keine Bewegungen gefunden.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground/70">
              <span>
                {filteredMovements.length
                  ? `Zeige ${movementRangeStart}-${movementRangeEnd} von ${filteredMovements.length}`
                  : "Keine Bewegungen"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={movementPage === 1}
                  onClick={() => setMovementPage((prev) => Math.max(1, prev - 1))}
                >
                  Zurück
                </Button>
                <span>
                  Seite {movementPage} / {totalMovementPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={movementPage >= totalMovementPages}
                  onClick={() => setMovementPage((prev) => Math.min(totalMovementPages, prev + 1))}
                >
                  Weiter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="border border-border/40 bg-white/95">
            <CardHeader>
              <CardTitle>Neue Barausgabe</CardTitle>
              <CardDescription>Kleine Ausgaben dokumentieren</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3 text-sm" onSubmit={handleExpenseSubmit}>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Betrag</label>
                    <Input
                      inputMode="decimal"
                      value={expenseForm.amount}
                      onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))}
                      placeholder="z. B. 12,50"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Kategorie</label>
                    <select
                      value={expenseForm.category}
                      onChange={(event) => {
                        const selected = event.target.value as ExpenseFormState["category"];
                        setExpenseForm((prev) => ({ ...prev, category: selected }));
                      }}
                      className="w-full rounded-md border border-border/50 bg-white/80 px-3 py-2"
                    >
                      {pettyCashCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Beschreibung</label>
                  <Textarea
                    value={expenseForm.description}
                    onChange={(event) => setExpenseForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={2}
                    placeholder="z. B. Milch und Zucker fuer Patienten"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Verantwortlich</label>
                  <select
                    value={expenseForm.employeeId}
                    onChange={(event) => setExpenseForm((prev) => ({ ...prev, employeeId: event.target.value }))}
                    className="w-full rounded-md border border-border/50 bg-white/80 px-3 py-2"
                    required
                  >
                    <option value="">Auswaehlen</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full gap-2 rounded-full">
                  <MinusCircle className="size-4" /> Ausgabe buchen
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-border/40 bg-white/95">
            <CardHeader>
              <CardTitle>Barkasse auffuellen</CardTitle>
              <CardDescription>Einlagen oder Wechselgeld verbuchen</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3 text-sm" onSubmit={handleFloatSubmit}>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Betrag</label>
                    <Input
                      inputMode="decimal"
                      value={floatForm.amount}
                      onChange={(event) => setFloatForm((prev) => ({ ...prev, amount: event.target.value }))}
                      placeholder="z. B. 100"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Von</label>
                    <select
                      value={floatForm.employeeId}
                      onChange={(event) => setFloatForm((prev) => ({ ...prev, employeeId: event.target.value }))}
                      className="w-full rounded-md border border-border/50 bg-white/80 px-3 py-2"
                    >
                      <option value="">Unbekannt</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Vermerk</label>
                  <Textarea
                    value={floatForm.description}
                    onChange={(event) => setFloatForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={2}
                    placeholder="z. B. Wechselgeld aus Tresor"
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full gap-2 rounded-full">
                  <PlusCircle className="size-4" /> Einlage buchen
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-dashed border-border/50 bg-white/90">
            <CardHeader>
              <CardTitle>Kassensturz</CardTitle>
              <CardDescription>Bestand zaehlen und Abweichung dokumentieren</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3 text-sm" onSubmit={handleSnapshotSubmit}>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Gezaehlter Betrag</label>
                    <Input
                      inputMode="decimal"
                      value={snapshotForm.counted}
                      onChange={(event) => setSnapshotForm((prev) => ({ ...prev, counted: event.target.value }))}
                      placeholder={currentBalance.toString()}
                      required
                    />
                    <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg border border-border/40 bg-surface-100/60 px-3 py-2 text-xs">
                      <div>
                        <p className="font-medium text-muted-foreground/70">Soll</p>
                        <p className="font-semibold text-foreground/90">{formatCurrency(currentBalance)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground/70">Ist</p>
                        <p className="font-semibold text-foreground/90">{snapshotForm.counted ? formatCurrency(countedAmount) : "-"}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground/70">Differenz</p>
                        <p className={`font-semibold ${snapshotDifferenceTone}`}>
                          {snapshotForm.counted ? formatCurrency(snapshotDifference) : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Gezaehlt von</label>
                    <select
                      value={snapshotForm.employeeId}
                      onChange={(event) => setSnapshotForm((prev) => ({ ...prev, employeeId: event.target.value }))}
                      className="w-full rounded-md border border-border/50 bg-white/80 px-3 py-2"
                    >
                      <option value="">Team</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Notiz</label>
                  <Textarea
                    value={snapshotForm.note}
                    onChange={(event) => setSnapshotForm((prev) => ({ ...prev, note: event.target.value }))}
                    rows={2}
                    placeholder="z. B. Wechselgeld im Safe hinterlegt"
                  />
                </div>
                <Button type="submit" variant="subtle" className="w-full gap-2 rounded-full">
                  <Wand2 className="size-4" /> Kassensturz speichern
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ title, value, description, icon }: { title: string; value: string; description: string; icon: React.ReactNode }) {
  return (
    <Card className="border border-border/40 bg-white/95">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base font-semibold text-foreground/90">{title}</CardTitle>
        <span className="text-primary">{icon}</span>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-xl font-semibold text-foreground/90">{value}</p>
        <p className="text-xs text-muted-foreground/80">{description}</p>
      </CardContent>
    </Card>
  );
}

function getMovementMeta(type: CashMovementType) {
  switch (type) {
    case "sale":
      return { label: "Einnahme", variant: "accent" as const, icon: <Banknote className="size-3" /> };
    case "expense":
      return { label: "Ausgabe", variant: "outline" as const, icon: <MinusCircle className="size-3" /> };
    case "float-in":
      return { label: "Einlage", variant: "muted" as const, icon: <PlusCircle className="size-3" /> };
    case "reconcile":
      return { label: "Abgleich", variant: "muted" as const, icon: <Receipt className="size-3" /> };
    case "adjustment":
    default:
      return { label: "Korrektur", variant: "muted" as const, icon: <Wand2 className="size-3" /> };
  }
}



