import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Printer, Search, ShoppingCart, Trash2 } from "lucide-react";

import { employees } from "@/data/employees";
import type { GoaBreakdownTemplateLine } from "@/data/igel";
import {
  selectTransactionsByPeriod,
  useIgelStore,
  type IgelPriceListEntry,
  type IgelTransaction,
  type PaymentMethod,
} from "@/features/igel/store/igel-store";
import { computeGoaBreakdown } from "@/features/igel/lib/goa-breakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/datetime";

const DEFAULT_RECEIPT_TEMPLATE = [
  "Privatrechnung nach GOÄ – Individuelle Gesundheitsleistung (IGeL)",
  "",
  "Praxis für Orthopädie & Unfallchirurgie",
  "Ozobia Samuel Mgbor",
  "Poststraße 37a 46562 Voerde",
  "Tel.: 0281 / 41020 Fax: 0281 / 46227",
  "",
  "Patient/in: {{patient}}",
  "PAT-Nr: {{patientNumber}}",
  "",
  "Leistung: {{service}}",
  "Einheiten: {{quantity}}",
  "Einzelpreis: {{unitPrice}}",
  "Totalbetrag: {{total}}",
  "Gezahlt: {{paid}}",
  "Restbetrag: {{rest}}",
  "Zahlungsart: {{paymentMethod}}",
  "Bearbeiter: {{collector}}",
  "Datum: {{date}}",
];

const RECEIPT_SUPPRESSED_PREFIXES = [
  "Patient",
  "PAT-Nr",
  "Leistung",
  "Einheiten",
  "Einzelpreis",
  "Totalbetrag",
  "Gezahlt",
  "Restbetrag",
  "Zahlungsart",
  "Bearbeiter",
  "Datum",
];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const resolveTemplateLines = (template: string[], tokens: Record<string, string>) =>
  template.map((line) => {
    if (!line) return "";
    return Object.entries(tokens).reduce(
      (acc, [token, replacement]) => acc.replace(new RegExp(token, "g"), replacement),
      line,
    );
  });

const normalizeTextToLines = (text: string) => {
  if (!text.trim()) return undefined;
  const rawLines = text.split(/\r?\n/);
  const normalized = rawLines.map((line) => {
    const cleaned = line.replace(/\r/g, "").trim();
    return cleaned.length ? cleaned : "";
  });
  return normalized.some((line) => line !== "") ? normalized : undefined;
};

const paymentOptions: PaymentMethod[] = ["Bar", "Karte"];

type GoaTemplateRow = {
  step: string;
  code: string;
  factor: string;
  unit: string;
  amount: string;
  kind?: "material" | "service";
};

export function IgelKassenbuchPage() {
  const { priceList, transactions, recordSale, deleteTransaction, updatePriceListEntry } = useIgelStore();

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [patient, setPatient] = useState("");
  const [patientNumber, setPatientNumber] = useState("");
  const [collector, setCollector] = useState(employees[0]?.name ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Bar");
  const [quantityInput, setQuantityInput] = useState("1");
  const [paidAmountInput, setPaidAmountInput] = useState("");
  const [notes, setNotes] = useState("");
  const [includeNotesOnReceipt, setIncludeNotesOnReceipt] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [receiptDirty, setReceiptDirty] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState<string | null>(null);
  const [goaRows, setGoaRows] = useState<GoaTemplateRow[]>([]);
  const [goaDirty, setGoaDirty] = useState(false);
  const [goaMessage, setGoaMessage] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<"day" | "week" | "month">("day");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  useEffect(() => {
    if (!priceList.length) {
      setSelectedServiceId("");
      return;
    }
    setSelectedServiceId((previous) => {
      if (previous && priceList.some((entry) => entry.id === previous)) return previous;
      return priceList[0].id;
    });
  }, [priceList]);

  const selectedService = useMemo(
    () => priceList.find((entry) => entry.id === selectedServiceId) ?? null,
    [priceList, selectedServiceId],
  );

  const normalizedQuantity = useMemo(() => {
    const numeric = Number.parseFloat(quantityInput.replace(",", "."));
    if (!Number.isFinite(numeric) || numeric <= 0) return 1;
    return Math.max(1, Math.round(numeric));
  }, [quantityInput]);

  const paidAmount = useMemo(() => {
    const numeric = Number.parseFloat(paidAmountInput.replace(",", "."));
    if (!Number.isFinite(numeric) || numeric < 0) return 0;
    return Math.round(numeric * 100) / 100;
  }, [paidAmountInput]);

  const expectedTotal = useMemo(
    () => (selectedService ? Math.round(selectedService.price * normalizedQuantity * 100) / 100 : 0),
    [selectedService, normalizedQuantity],
  );

  const restAmount = Math.max(expectedTotal - paidAmount, 0);

  const templateTokens = useMemo(
    () => ({
      "{{patient}}": patient.trim() || "-",
      "{{patientNumber}}": patientNumber.trim() || "-",
      "{{service}}": selectedService?.treatment ?? "-",
      "{{quantity}}": normalizedQuantity.toString(),
      "{{unitPrice}}": selectedService ? formatCurrency(selectedService.price) : "-",
      "{{total}}": formatCurrency(expectedTotal),
      "{{paid}}": formatCurrency(paidAmount),
      "{{rest}}": formatCurrency(restAmount),
      "{{paymentMethod}}": paymentMethod,
      "{{collector}}": collector || "-",
      "{{date}}": formatDate(new Date()),
    }),
    [
      patient,
      patientNumber,
      selectedService,
      normalizedQuantity,
      expectedTotal,
      paidAmount,
      restAmount,
      paymentMethod,
      collector,
    ],
  );

  const defaultReceiptText = useMemo(() => {
    if (!selectedService) return DEFAULT_RECEIPT_TEMPLATE.join("\n");
    const template = selectedService.receiptTemplate?.length ? selectedService.receiptTemplate : DEFAULT_RECEIPT_TEMPLATE;
    return resolveTemplateLines(template, templateTokens).join("\n");
  }, [selectedService, templateTokens]);

  useEffect(() => {
    if (!selectedService) {
      setReceiptPreview(DEFAULT_RECEIPT_TEMPLATE.join("\n"));
      setReceiptDirty(false);
      setReceiptMessage(null);
      setGoaMessage(null);
      return;
    }
    setReceiptPreview(defaultReceiptText);
    setReceiptDirty(false);
    setReceiptMessage(null);
    setGoaMessage(null);
  }, [selectedService]);

  useEffect(() => {
    if (!receiptDirty) {
      setReceiptPreview(defaultReceiptText);
    }
  }, [defaultReceiptText, receiptDirty]);

  useEffect(() => {
    if (!selectedService) {
      setGoaRows([]);
      setGoaDirty(false);
      return;
    }
    const templateRows =
      selectedService.goaBreakdown?.length
        ? templateLinesToRows(selectedService.goaBreakdown)
        : computeDefaultGoaRows(selectedService);
    setGoaRows(templateRows);
    setGoaDirty(false);
  }, [selectedService]);

  const goaTemplateLines = useMemo(() => rowsToTemplate(goaRows), [goaRows]);

  useEffect(() => {
    if (!receiptMessage) return;
    const timeout = window.setTimeout(() => setReceiptMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [receiptMessage]);

  useEffect(() => {
    if (!goaMessage) return;
    const timeout = window.setTimeout(() => setGoaMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [goaMessage]);

  const goaPreview = useMemo(() => {
    if (!selectedService) {
      return [];
    }
    const serviceForPreview: IgelPriceListEntry = {
      ...selectedService,
      goaBreakdown: goaTemplateLines,
    };
    return computeGoaBreakdown(serviceForPreview, normalizedQuantity);
  }, [selectedService, goaTemplateLines, normalizedQuantity]);


  useEffect(() => {
    if (!receiptMessage) {
      return;
    }
    const timeout = window.setTimeout(() => setReceiptMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [receiptMessage]);

  useEffect(() => {
    if (!goaMessage) {
      return;
    }
    const timeout = window.setTimeout(() => setGoaMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [goaMessage]);

  const goaPreviewTotal = useMemo(
    () => goaPreview.reduce((sum, line) => sum + line.amount, 0),
    [goaPreview],
  );

  const filteredTransactions = useMemo(() => {
    const scoped = selectTransactionsByPeriod(transactions, periodFilter);
    if (!searchTerm.trim()) return scoped;
    const term = searchTerm.toLowerCase();
    return scoped.filter((transaction) => {
      const service = priceList.find((entry) => entry.id === transaction.serviceId);
      const haystack = `${transaction.patient} ${transaction.patientNumber} ${transaction.collector} ${
        service?.treatment ?? ""
      }`;
      return haystack.toLowerCase().includes(term);
    });
  }, [transactions, periodFilter, searchTerm, priceList]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedService || !patient.trim() || !patientNumber.trim()) return;
    const receiptLines = normalizeTextToLines(receiptPreview);
    const sale = recordSale({
      patient: patient.trim(),
      patientNumber: patientNumber.trim(),
      serviceId: selectedService.id,
      collector,
      paymentMethod,
      quantity: normalizedQuantity,
      paidAmount,
      notes: notes.trim() || undefined,
      includeNotesOnReceipt,
      receiptLines,
      goaBreakdown: goaPreview,
    });
    if (sale) {
      setPatient("");
      setPatientNumber("");
      setQuantityInput("1");
      setPaidAmountInput(selectedService.price.toString());
      setNotes("");
      setIncludeNotesOnReceipt(false);
      setLastReceipt(sale.id);
    }
  };
  const handleSaveReceiptTemplate = () => {
    if (!selectedService) {
      return;
    }
    const template = convertPreviewToTemplate(receiptPreview, templateTokens);
    updatePriceListEntry(selectedService.id, { receiptTemplate: template });
    setReceiptDirty(false);
    setReceiptMessage(`Vorlage für "${selectedService.treatment}" als Standard gespeichert.`);
  };

  const handleAddGoaRow = () => {
    setGoaRows((rows) => [
      ...rows,
      { step: "", code: "", factor: "", unit: "", amount: "0.00" },
    ]);
    setGoaDirty(true);
    setGoaMessage(null);
  };

  const handleGoaRowChange = (index: number, field: keyof GoaTemplateRow, value: string) => {
    setGoaRows((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
    setGoaDirty(true);
    setGoaMessage(null);
  };

  const handleRemoveGoaRow = (index: number) => {
    setGoaRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index));
    setGoaDirty(true);
    setGoaMessage(null);
  };

  const handleSaveGoaTemplate = () => {
    if (!selectedService) {
      return;
    }
    const template = rowsToTemplate(goaRows);
    updatePriceListEntry(selectedService.id, { goaBreakdown: template });
    setGoaDirty(false);
    setGoaMessage(`GOÄ-Aufteilung für "${selectedService.treatment}" aktualisiert.`);
  };

  const handlePrint = (transaction: IgelTransaction, service: IgelPriceListEntry | undefined) => {
    if (!service) return;
    const printWindow = window.open("", "_blank", "width=720,height=900");
    if (!printWindow) return;

    const unitPrice = transaction.quantity ? transaction.amount / transaction.quantity : service.price;
    const rest = Math.max(transaction.amount - transaction.paidAmount, 0);
    const goaBreakdown = transaction.goaBreakdown?.length
      ? transaction.goaBreakdown
      : computeGoaBreakdown(service, transaction.quantity);
    const breakdownTotal = goaBreakdown.reduce((sum, line) => sum + line.amount, 0);

    const fallbackReceiptLines = [
      `Patient/in: ${transaction.patient}`,
      `PAT-Nr: ${transaction.patientNumber}`,
      `Leistung: ${service.treatment}`,
      `Einheiten: ${transaction.quantity}`,
      `Einzelpreis: ${formatCurrency(unitPrice)}`,
      `Totalbetrag: ${formatCurrency(transaction.amount)}`,
      `Gezahlt: ${formatCurrency(transaction.paidAmount)}`,
      `Restbetrag: ${formatCurrency(rest)}`,
      `Zahlungsart: ${transaction.paymentMethod}`,
      `Bearbeiter: ${transaction.collector}`,
      `Datum: ${formatDateTime(transaction.createdAt)}`,
    ];

    const baseLines = transaction.receiptLines?.length ? transaction.receiptLines : fallbackReceiptLines;
    const normalizedLines = baseLines.map((line) => {
      const cleaned = line.replace(/\r/g, "");
      if (cleaned.trim() === "Datum: (wird beim Druck gesetzt)") {
        return `Datum: ${formatDateTime(transaction.createdAt)}`;
      }
      return cleaned;
    });

    const headerLines: string[] = [];
    for (const line of normalizedLines) {
      const trimmed = line.trim();
      if (!trimmed && headerLines.length === 0) continue;
      if (trimmed && RECEIPT_SUPPRESSED_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) break;
      if (trimmed) headerLines.push(trimmed);
    }

    const title = headerLines[0] ?? DEFAULT_RECEIPT_TEMPLATE[0];
    const clinicInfo = headerLines.length > 1 ? headerLines.slice(1) : DEFAULT_RECEIPT_TEMPLATE.slice(2, 6);
    const headerSet = new Set(headerLines);
    const additionalLines = normalizedLines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (headerSet.has(trimmed)) return false;
      return !RECEIPT_SUPPRESSED_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
    });

    const styles = `
      body { font-family: 'Inter', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; color: #111827; }
      .receipt { max-width: 720px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 18px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12); }
      header h1 { font-size: 20px; margin-bottom: 6px; color: #0f172a; }
      header .subtitle p { margin: 0; font-size: 13px; color: #4b5563; }
      .meta { margin: 24px 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
      .meta-item { background: #f8fafc; padding: 12px 14px; border-radius: 12px; }
      .meta-item .label { display: block; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
      .meta-item .value { font-weight: 600; color: #111827; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      thead { background: #0f172a; color: #e2e8f0; }
      th, td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 14px; }
      tbody tr:last-child td { border-bottom: none; }
      .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 28px 0 12px; }
      .summary-item { background: #f8fafc; border-radius: 12px; padding: 12px 14px; }
      .summary-item span.label { display: block; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
      .summary-item span.value { font-weight: 600; color: #111827; }
      .additional p { margin: 0 0 6px; font-size: 13px; color: #374151; }
      .notes { margin-top: 16px; padding: 12px 14px; border-radius: 12px; background: #fff7ed; border: 1px solid #fdba74; font-size: 13px; color: #9a3412; }
      footer { margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; }
    `;

    const additionalSection = additionalLines.length
      ? `<section class="additional">${additionalLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n")}</section>`
      : "";

    const notesSection =
      transaction.notes && transaction.includeNotesOnReceipt
        ? `<section class="notes"><strong>Notiz</strong><p>${escapeHtml(transaction.notes)}</p></section>`
        : "";

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Privatrechnung (IGeL)</title>
    <style>${styles}</style>
  </head>
  <body>
    <div class="receipt">
      <header>
        <h1>${escapeHtml(title)}</h1>
        <div class="subtitle">
          ${clinicInfo.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n")}
        </div>
      </header>
      <section class="meta">
        <div class="meta-item">
          <span class="label">Patient/in</span>
          <span class="value">${escapeHtml(transaction.patient)}</span>
        </div>
        <div class="meta-item">
          <span class="label">PAT-Nr</span>
          <span class="value">${escapeHtml(transaction.patientNumber)}</span>
        </div>
        <div class="meta-item">
          <span class="label">Datum</span>
          <span class="value">${escapeHtml(formatDateTime(transaction.createdAt))}</span>
        </div>
        <div class="meta-item">
          <span class="label">Beleg-Nr.</span>
          <span class="value">${escapeHtml(transaction.id)}</span>
        </div>
        <div class="meta-item">
          <span class="label">Leistung</span>
          <span class="value">${escapeHtml(service.treatment)}</span>
        </div>
      </section>
      <section>
        <table>
          <thead>
            <tr>
              <th>Leistungsschritt</th>
              <th>GOÄ-Nr.</th>
              <th>Faktor</th>
              <th>Einheit</th>
              <th>Betrag (€)</th>
            </tr>
          </thead>
          <tbody>
            ${goaBreakdown
              .map(
                (line) => `
            <tr>
              <td>${escapeHtml(line.step)}</td>
              <td>${escapeHtml(line.code)}</td>
              <td>${escapeHtml(line.factor)}</td>
              <td>${escapeHtml(line.unit ?? "-")}</td>
              <td>${escapeHtml(formatCurrency(line.amount))}</td>
            </tr>`,
              )
              .join("\n")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align:right;font-weight:600;">Totalbetrag</td>
              <td style="font-weight:600;">${escapeHtml(formatCurrency(breakdownTotal))}</td>
            </tr>
          </tfoot>
        </table>
      </section>
      <section class="summary">
        <div class="summary-item">
          <span class="label">Gezahlt</span>
          <span class="value">${escapeHtml(formatCurrency(transaction.paidAmount))}</span>
        </div>
        <div class="summary-item">
          <span class="label">Restbetrag</span>
          <span class="value">${escapeHtml(formatCurrency(rest))}</span>
        </div>
        <div class="summary-item">
          <span class="label">Zahlungsart</span>
          <span class="value">${escapeHtml(transaction.paymentMethod)}</span>
        </div>
        <div class="summary-item">
          <span class="label">Bearbeiter</span>
          <span class="value">${escapeHtml(transaction.collector)}</span>
        </div>
      </section>
      ${additionalSection}
      ${notesSection}
      <footer>Vielen Dank für Ihr Vertrauen. Bitte wenden Sie sich bei Rückfragen an die Praxis.</footer>
    </div>
  </body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const renderPriceList = () => (
    <Card className="border border-border/30 bg-gradient-to-br from-white via-white to-primary/5 shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle>Leistungskatalog</CardTitle>
        <CardDescription>Ein Klick stellt die Leistung im Checkout bereit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {priceList.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {priceList.map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  setSelectedServiceId(entry.id);
                  setPaidAmountInput(entry.price.toString());
                }}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                  selectedServiceId === entry.id
                    ? "border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-white text-primary shadow-sm"
                    : "border-border/40 bg-white/90 text-foreground/80 hover:border-primary/30",
                )}
              >
                {entry.treatment}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/40 bg-white/80 p-6 text-sm text-muted-foreground">
            Noch keine Leistungen erfasst.
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderCheckout = () => (
    <Card className="border border-border/30 bg-gradient-to-br from-white via-white to-primary/10 shadow-lg backdrop-blur-sm transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle>Checkout</CardTitle>
        <CardDescription>Patientendaten erfassen und den Verkauf dokumentieren.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Patient</label>
              <Input value={patient} onChange={(event) => setPatient(event.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground/60">PAT-Nr</label>
              <Input value={patientNumber} onChange={(event) => setPatientNumber(event.target.value)} required />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Mitarbeiter</label>
              <select
                value={collector}
                onChange={(event) => setCollector(event.target.value)}
                className="h-10 w-full rounded-md border border-border/60 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.name}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Zahlungsart</label>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                className="h-10 w-full rounded-md border border-border/60 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {paymentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Menge</label>
              <Input
                type="number"
                min="1"
                inputMode="numeric"
                value={quantityInput}
                onChange={(event) => setQuantityInput(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Einzelpreis</label>
              <Input value={selectedService ? formatCurrency(selectedService.price) : ""} disabled />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Gezahlt</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={paidAmountInput}
                onChange={(event) => setPaidAmountInput(event.target.value)}
                placeholder="z. B. 120"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-muted-foreground/60">Notizen</label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Besonderheiten, Diagnosen oder interne Hinweise"
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-white/80 px-3 py-2 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground/60">Notiz auf Beleg anzeigen</p>
              <p className="text-[11px] text-muted-foreground/70">Nur aktivieren, wenn die Notiz auf dem Beleg erscheinen soll.</p>
            </div>
            <Switch checked={includeNotesOnReceipt} onCheckedChange={setIncludeNotesOnReceipt} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wide text-muted-foreground/60" htmlFor="receipt-preview">
                Belegvorschau
              </label>
              <span className="text-xs text-muted-foreground/70">Totalbetrag: {formatCurrency(expectedTotal)}</span>
            </div>
            <Textarea
              id="receipt-preview"
              value={receiptPreview}
              onChange={(event) => {
                setReceiptPreview(event.target.value);
                setReceiptMessage(null);
                setReceiptDirty(true);
              }}
              rows={8}
              placeholder="Patient/in: ..."
            />
            <p className="text-[11px] text-muted-foreground/70">
              Jede Zeile entspricht einer Position auf dem gedruckten Beleg und kann vor dem Druck angepasst werden.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs">
                {receiptMessage ? (
                  <span className="text-emerald-600">{receiptMessage}</span>
                ) : receiptDirty ? (
                  <span className="text-muted-foreground/70">Nicht gespeicherte Änderungen.</span>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveReceiptTemplate}
                disabled={!selectedService}
              >
                Als Standard speichern
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground/60">GOÄ-Aufteilung</span>
              <span
                className={cn(
                  "text-xs",
                  Math.abs(goaPreviewTotal - expectedTotal) < 0.01 ? "text-muted-foreground/70" : "text-destructive font-semibold",
                )}
              >
                {formatCurrency(goaPreviewTotal)}
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-border/40 bg-white/90">
              {goaRows.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-sm">
                    <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground/80">
                      <tr>
                        <th className="px-3 py-2 text-left">Leistungsbeschreibung</th>
                        <th className="px-3 py-2 text-left">GOÄ</th>
                        <th className="px-3 py-2 text-left">Faktor</th>
                        <th className="px-3 py-2 text-left">Einheit</th>
                        <th className="px-3 py-2 text-right">Basisbetrag</th>
                        <th className="px-3 py-2 text-right">Aktuell</th>
                        <th className="px-3 py-2 text-right">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goaRows.map((row, index) => {
                        const previewLine = goaPreview[index];
                        return (
                          <tr key={`${row.code}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-muted/40"}>
                            <td className="px-3 py-2 align-top">
                              <Input value={row.step} onChange={(event) => handleGoaRowChange(index, "step", event.target.value)} />
                            </td>
                            <td className="px-3 py-2 align-top">
                              <Input value={row.code} onChange={(event) => handleGoaRowChange(index, "code", event.target.value)} />
                            </td>
                            <td className="px-3 py-2 align-top">
                              <Input value={row.factor} onChange={(event) => handleGoaRowChange(index, "factor", event.target.value)} />
                            </td>
                            <td className="px-3 py-2 align-top">
                              <Input value={row.unit} onChange={(event) => handleGoaRowChange(index, "unit", event.target.value)} />
                            </td>
                            <td className="px-3 py-2 align-top">
                              <Input
                                value={row.amount}
                                inputMode="decimal"
                                onChange={(event) => handleGoaRowChange(index, "amount", event.target.value)}
                              />
                            </td>
                            <td className="px-3 py-2 text-right align-top font-semibold">
                              {previewLine ? formatCurrency(previewLine.amount) : "-"}
                            </td>
                            <td className="px-3 py-2 text-right align-top">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveGoaRow(index)}
                                aria-label="Position entfernen"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/40 bg-white/70 px-4 py-3 text-sm text-muted-foreground/70">
                  Keine Aufteilung definiert.
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddGoaRow}
                  disabled={!selectedService}
                  className="gap-1"
                >
                  <Plus className="size-4" />
                  Position hinzufügen
                </Button>
                {goaMessage ? (
                  <span className="text-xs text-emerald-600">{goaMessage}</span>
                ) : goaDirty ? (
                  <span className="text-xs text-muted-foreground/70">Nicht gespeicherte Änderungen.</span>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveGoaTemplate}
                disabled={!selectedService}
              >
                Als Standard speichern
              </Button>
            </div>
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
  );

  const renderTransactions = () => (
    <Card className="border border-border/30 bg-gradient-to-br from-white via-white to-primary/10 shadow-md transition-shadow">
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>Kassenbuch</CardTitle>
          <CardDescription>Alle Verkäufe mit Such- und Datumsfilter.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-white/80 px-3 py-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40 hover:shadow-md">
            <Search className="size-4 text-muted-foreground/70" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-6 border-none bg-transparent text-sm outline-none"
              placeholder="Transaktionen durchsuchen"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <span>Zeitraum</span>
            <select
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value as typeof periodFilter)}
              className="rounded-md border border-border/60 bg-white/80 px-3 py-1 shadow-sm transition-all hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="day">Heute</option>
              <option value="week">7 Tage</option>
              <option value="month">Aktueller Monat</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {filteredTransactions.length ? (
          <table className="min-w-[1120px] table-fixed border-separate border-spacing-y-2 text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground/70">
              <tr>
                <th className="px-3 py-2">Datum</th>
                <th className="px-3 py-2">Patient</th>
                <th className="px-3 py-2">PAT-Nr</th>
                <th className="px-3 py-2">Leistung</th>
                <th className="px-3 py-2 text-center">Menge</th>
                <th className="px-3 py-2 text-right">Betrag</th>
                <th className="px-3 py-2 text-right">Totalbetrag</th>
                <th className="px-3 py-2 text-right">Gezahlt</th>
                <th className="px-3 py-2 text-right">Restbetrag</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2">Notiz</th>
                <th className="px-3 py-2">Mitarbeiter</th>
                <th className="px-3 py-2 text-center">Zahlung</th>
                <th className="px-3 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const service = priceList.find((entry) => entry.id === transaction.serviceId);
                const unitAmount =
                  transaction.quantity > 0
                    ? transaction.amount / transaction.quantity
                    : service?.price ?? transaction.amount;
                const totalAmount = Math.round(unitAmount * transaction.quantity * 100) / 100;
                const restRaw = Math.round((totalAmount - transaction.paidAmount) * 100) / 100;
                const remainingAmount = Math.max(restRaw, 0);
                const status =
                  restRaw <= 0
                    ? "Bezahlt"
                    : Math.abs(restRaw - totalAmount) < 0.01
                      ? "Offen"
                      : "Teilzahlung";
                const statusVariant: "success" | "warning" | "destructive" =
                  status === "Bezahlt" ? "success" : status === "Teilzahlung" ? "warning" : "destructive";
                return (
                  <tr
                    key={transaction.id}
                    className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <td className="px-3 py-3 text-sm text-muted-foreground/80">{formatDate(transaction.createdAt)}</td>
                    <td className="px-3 py-3 font-medium text-foreground/90">{transaction.patient}</td>
                    <td className="px-3 py-3 text-sm text-muted-foreground/80">{transaction.patientNumber}</td>
                    <td className="px-3 py-3 text-sm text-muted-foreground/80">{service?.treatment ?? "Gelöscht"}</td>
                    <td className="px-3 py-3 text-center text-sm text-muted-foreground/80">{transaction.quantity}</td>
                    <td className="px-3 py-3 text-right text-sm text-muted-foreground/80">
                      {formatCurrency(unitAmount)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-foreground/90">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-emerald-600">
                      {formatCurrency(transaction.paidAmount)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-muted-foreground/70">
                      {formatCurrency(remainingAmount)}
                    </td>
                    <td className="px-3 py-3 text-center text-xs">
                      <Badge variant={statusVariant}>
                        {status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground/80">{transaction.notes ?? "-"}</td>
                    <td className="px-3 py-3 text-sm text-muted-foreground/80">{transaction.collector}</td>
                    <td className="px-3 py-3 text-center text-xs">
                      <Badge variant={transaction.paymentMethod === "Bar" ? "solid" : "outline"}>
                        {transaction.paymentMethod}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() => handlePrint(transaction, service)}
                          aria-label="Beleg drucken"
                        >
                          <Printer className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-destructive hover:text-destructive"
                          onClick={() => deleteTransaction(transaction.id)}
                          aria-label="Transaktion löschen"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/40 bg-white/80 p-6 text-center text-sm text-muted-foreground">
            Keine Transaktionen im gewählten Zeitraum.
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Kassenbuch</h2>
          <p className="text-sm text-muted-foreground">
            Leistungen verbuchen, Einnahmen erfassen und Belege drucken.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
          <BookOpen className="size-4" />
          <span>{priceList.length} Leistungen im Katalog</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {renderPriceList()}
        {renderCheckout()}
      </div>

      {renderTransactions()}
    </div>
  );
}

function convertPreviewToTemplate(preview: string, tokens: Record<string, string>): string[] {
  const entries = Object.entries(tokens)
    .filter(([, value]) => value)
    .sort((a, b) => ((b[1] ?? "").length - (a[1] ?? "").length));
  return preview.split(/\r?\n/).map((line) => {
    let current = line;
    for (const [token, value] of entries) {
      if (!value) continue;
      current = current.split(value).join(token);
    }
    return current;
  });
}

function templateLinesToRows(template?: GoaBreakdownTemplateLine[]): GoaTemplateRow[] {
  if (!template || !template.length) {
    return [];
  }
  return template.map((line) => ({
    step: line.step ?? "",
    code: line.code ?? "",
    factor: line.factor ?? "",
    unit: line.unit ?? "",
    amount: formatAmountValue(line.amount),
    kind: line.kind,
  }));
}

function computeDefaultGoaRows(service: IgelPriceListEntry): GoaTemplateRow[] {
  return computeGoaBreakdown(service, 1).map((line) => ({
    step: line.step,
    code: line.code,
    factor: line.factor,
    unit: line.unit ?? "",
    amount: formatAmountValue(line.amount),
  }));
}

function rowsToTemplate(rows: GoaTemplateRow[]): GoaBreakdownTemplateLine[] {
  return rows
    .map((row) => {
      const amount = Number.parseFloat(row.amount.replace(",", "."));
      if (!row.step && !row.code && !Number.isFinite(amount)) {
        return null;
      }
      return {
        step: row.step.trim(),
        code: row.code.trim(),
        factor: row.factor.trim() || undefined,
        unit: row.unit.trim() || undefined,
        amount: Number.isFinite(amount) ? Math.max(0, amount) : 0,
        kind: row.kind,
      } as GoaBreakdownTemplateLine;
    })
    .filter((entry): entry is GoaBreakdownTemplateLine => entry !== null);
}

function formatAmountValue(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "0.00";
  }
  return (Math.round(amount * 100) / 100).toFixed(2);
}
