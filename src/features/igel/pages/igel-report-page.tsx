import { useMemo } from "react";

import { useIgelStore, type IgelPriceListEntry, type IgelTransaction } from "@/features/igel/store/igel-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { formatDate } from "@/lib/datetime";

type PeriodDefinition = {
  label: string;
  range: () => { start: Date; end?: Date };
};

interface PeriodSummary {
  label: string;
  paid: number;
  outstanding: number;
  paidCash: number;
}

export function IgelReportPage() {
  const { transactions, priceList } = useIgelStore();

  const totals = useMemo(() => {
    const paid = transactions.reduce((sum, tx) => sum + tx.paidAmount, 0);
    const paidCash = transactions
      .filter((tx) => tx.paymentMethod === "Bar")
      .reduce((sum, tx) => sum + tx.paidAmount, 0);
    const outstanding = transactions.reduce((sum, tx) => sum + Math.max(tx.amount - tx.paidAmount, 0), 0);
    return {
      paid,
      paidCash,
      outstanding,
      count: transactions.length,
    };
  }, [transactions]);

  const topServices = useMemo(() => buildTopServices(transactions, priceList), [priceList, transactions]);

  const periodSummaries = useMemo(() => buildPeriodSummaries(transactions), [transactions]);
  const lastTransactionDate = useMemo(() => getLastTransactionDate(transactions), [transactions]);
  const lastTransactionDisplay = lastTransactionDate ? formatDate(lastTransactionDate) : "—";

  const cashShare = totals.paid ? totals.paidCash / totals.paid : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Report</h2>
        <p className="text-sm text-muted-foreground">
          Kennzahlen und Zeiträume für individuelle Gesundheitsleistungen.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gesamt bezahlt" value={formatCurrency(totals.paid)} detail={`${totals.count} Leistungen`} />
        <MetricCard label="Offene Beträge" value={formatCurrency(totals.outstanding)} />
        <MetricCard
          label="Barzahlung"
          value={formatCurrency(totals.paidCash)}
          detail={`${formatPercent(cashShare)} Anteil`}
        />
        <MetricCard label="Letzte Buchung" value={lastTransactionDisplay} />
      </div>

      <Card className="border border-border/40 bg-white/95">
        <CardHeader>
          <CardTitle>Periodenübersicht</CardTitle>
          <CardDescription>Gezahlt, Restbeträge und Barzahlungen je Zeitraum.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-1 text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground/70">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Zeitraum</th>
                <th className="px-3 py-2 text-right font-medium">Gezahlt</th>
                <th className="px-3 py-2 text-right font-medium">Restbetrag</th>
                <th className="px-3 py-2 text-right font-medium">Gezahlt Bar</th>
              </tr>
            </thead>
            <tbody>
              {periodSummaries.map((row) => (
                <tr key={row.label} className="rounded-lg border border-border/40 bg-white/90 text-foreground/90">
                  <td className="px-3 py-2 font-medium">{row.label}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(row.paid)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(row.outstanding)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(row.paidCash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border border-border/40 bg-white/95">
        <CardHeader>
          <CardTitle>Top-Leistungen</CardTitle>
          <CardDescription>Meist gebuchte Leistungen nach Erlös.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {topServices.length ? (
            <ul className="space-y-2">
              {topServices.map((service) => (
                <li
                  key={service.name}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-white/90 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-foreground/90">{service.name}</p>
                    <p className="text-xs text-muted-foreground/70">
                      {service.count} Buchungen · Letztmalig {service.lastDate ? formatDate(service.lastDate) : "—"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground/90">{formatCurrency(service.revenue)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-border/40 bg-white/80 p-6 text-center text-sm text-muted-foreground">
              Noch keine Auswertungen vorhanden.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function buildPeriodSummaries(transactions: IgelTransaction[]): PeriodSummary[] {
  const now = new Date();
  const startToday = startOfDay(now);
  const startTomorrow = addDays(startToday, 1);
  const startYesterday = addDays(startToday, -1);
  const startOfWeek = startOfISOWeek(now);
  const startLastWeek = addDays(startOfWeek, -7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfQuarter = getQuarterStart(now);
  const startNextQuarter = getQuarterStart(addMonths(now, 3));
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startNextYear = new Date(now.getFullYear() + 1, 0, 1);

  const periods: PeriodDefinition[] = [
    { label: "Last Week", range: () => ({ start: startLastWeek, end: startOfWeek }) },
    { label: "Last Month", range: () => ({ start: startLastMonth, end: startOfMonth }) },
    { label: "Yesterday", range: () => ({ start: startYesterday, end: startToday }) },
    { label: "Today", range: () => ({ start: startToday, end: startTomorrow }) },
    { label: "This Week", range: () => ({ start: startOfWeek, end: addDays(startOfWeek, 7) }) },
    { label: "This Month", range: () => ({ start: startOfMonth, end: startNextMonth }) },
    { label: "This Quarter", range: () => ({ start: startOfQuarter, end: startNextQuarter }) },
    { label: "This Year", range: () => ({ start: startOfYear, end: startNextYear }) },
    { label: "All Time Total", range: () => ({ start: new Date(0) }) },
  ];

  return periods.map(({ label, range }) => {
    const { start, end } = range();
    const periodTransactions = transactions.filter((transaction) => {
      const created = new Date(transaction.createdAt);
      const inLowerBound = created >= start;
      const inUpperBound = end ? created < end : true;
      return inLowerBound && inUpperBound;
    });
    return reduceTransactions(label, periodTransactions);
  });
}

function reduceTransactions(label: string, transactions: IgelTransaction[]): PeriodSummary {
  return transactions.reduce<PeriodSummary>(
    (acc, transaction) => {
      acc.paid += transaction.paidAmount;
      acc.outstanding += Math.max(transaction.amount - transaction.paidAmount, 0);
      if (transaction.paymentMethod === "Bar") {
        acc.paidCash += transaction.paidAmount;
      }
      return acc;
    },
    { label, paid: 0, outstanding: 0, paidCash: 0 },
  );
}

function getLastTransactionDate(transactions: IgelTransaction[]) {
  if (!transactions.length) return null;
  return transactions.reduce((latest, transaction) => {
    const created = new Date(transaction.createdAt);
    return !latest || created > latest ? created : latest;
  }, null as Date | null);
}

function buildTopServices(transactions: IgelTransaction[], priceList: IgelPriceListEntry[]) {
  const map = new Map<string, { name: string; count: number; revenue: number; lastDate: string | null }>();
  transactions.forEach((tx) => {
    const entry = priceList.find((item) => item.id === tx.serviceId);
    if (!entry) return;
    const current = map.get(tx.serviceId) ?? { name: entry.treatment, count: 0, revenue: 0, lastDate: null };
    current.count += 1;
    current.revenue += tx.paidAmount;
    current.lastDate = !current.lastDate || tx.createdAt > current.lastDate ? tx.createdAt : current.lastDate;
    map.set(tx.serviceId, current);
  });

  return [...map.values()]
    .sort((a, b) => b.revenue - a.revenue || b.count - a.count || (a.name < b.name ? -1 : 1))
    .slice(0, 8);
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfISOWeek(date: Date) {
  const result = startOfDay(date);
  const day = result.getDay() || 7; // Sunday -> 7
  if (day !== 1) {
    result.setDate(result.getDate() - (day - 1));
  }
  return result;
}

function getQuarterStart(date: Date) {
  const result = startOfDay(date);
  const currentQuarter = Math.floor(result.getMonth() / 3);
  return new Date(result.getFullYear(), currentQuarter * 3, 1);
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Card className="border border-border/40 bg-white/95">
      <CardContent className="space-y-1.5 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground/60">{label}</p>
        <p className="text-xl font-semibold text-foreground/90">{value}</p>
        {detail ? <p className="text-xs text-muted-foreground/70">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}
