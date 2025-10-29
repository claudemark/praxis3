import { create } from "zustand";

import {
  igelPriceList,
  initialIgelTransactions,
  type GoaBreakdownLine,
  type GoaBreakdownTemplateLine,
  type IgelPriceListEntry,
  type IgelTransaction,
  type PaymentMethod,
} from "@/data/igel";
import { useInventoryStore } from "@/features/inventory/store/inventory-store";
import { useCashDrawerStore } from "@/features/cash-drawer/store/cash-drawer-store";
import { useEmployeeDirectory } from "@/features/employees/store/employee-store";
import { computeGoaBreakdown } from "@/features/igel/lib/goa-breakdown";

interface RecordSalePayload {
  patient: string;
  patientNumber: string;
  serviceId: string;
  paymentMethod: PaymentMethod;
  collector: string;
  quantity: number;
  paidAmount: number;
  status?: "offen" | "bezahlt" | "teilweise";
  notes?: string;
  includeNotesOnReceipt: boolean;
  receiptLines?: string[];
  goaBreakdown?: GoaBreakdownLine[];
}

type AddPriceListEntryPayload = Omit<IgelPriceListEntry, "id"> & { id?: string };
type UpdatePriceListEntryPayload = Partial<Omit<IgelPriceListEntry, "id">>;
type UpdateTransactionPayload = Partial<Omit<IgelTransaction, "id" | "serviceId" | "amount">> & {
  serviceId?: string;
  amount?: number;
  receiptLines?: string[];
  goaBreakdown?: GoaBreakdownLine[];
};

interface IgelState {
  priceList: IgelPriceListEntry[];
  transactions: IgelTransaction[];
  addPriceListEntry: (payload: AddPriceListEntryPayload) => IgelPriceListEntry;
  updatePriceListEntry: (id: string, changes: UpdatePriceListEntryPayload) => void;
  deletePriceListEntry: (id: string) => void;
  recordSale: (payload: RecordSalePayload) => IgelTransaction | null;
  updateTransaction: (id: string, changes: UpdateTransactionPayload) => void;
  deleteTransaction: (id: string) => void;
}

const generatePriceListId = () => "price-" + Date.now();
const generateTransactionId = () => "IGEL-" + Date.now() + "-" + Math.round(Math.random() * 999);

const coercePaidAmount = (_amount: number, paid: number) => {
  if (!Number.isFinite(paid) || paid < 0) return 0;
  return paid;
};

const sanitizeReceiptLines = (lines?: string[]) => {
  if (!lines) return undefined;
  const normalized = lines.map((line) => {
    const stripped = line.replace(/\r/g, "");
    const trimmed = stripped.trim();
    return trimmed.length ? trimmed : "";
  });
  return normalized.some((line) => line !== "") ? normalized : undefined;
};

const coerceNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const sanitizeGoaBreakdown = (lines?: GoaBreakdownTemplateLine[]) => {
  if (!lines) return undefined;
  const sanitized = lines
    .map((line) => ({
      step: line.step?.trim() ?? "",
      code: line.code?.trim() ?? "",
      factor: line.factor?.trim() ?? undefined,
      amount: coerceNumber(line.amount),
      kind: line.kind,
      unit: line.unit?.trim() ?? undefined,
    }))
    .filter((line) => line.step.length || line.code.length);
  return sanitized.length ? sanitized : undefined;
};

const deriveTransactionStatus = (amount: number, paidAmount: number): "offen" | "bezahlt" | "teilweise" => {
  const epsilon = 0.01;
  if (paidAmount >= amount - epsilon) {
    return "bezahlt";
  }
  if (paidAmount <= epsilon) {
    return "offen";
  }
  return "teilweise";
};

const normalizeStatus = (
  status: unknown,
  amount: number,
  paidAmount: number,
): "offen" | "bezahlt" | "teilweise" => {
  if (status === "bezahlt" || status === "offen" || status === "teilweise") {
    return status;
  }
  return deriveTransactionStatus(amount, paidAmount);
};

const mapInitialTransactions = (priceList: IgelPriceListEntry[], transactions: IgelTransaction[]) =>
  transactions.map((transaction) => {
    const service = priceList.find((entry) => entry.id === transaction.serviceId) ?? null;
    const normalizedQuantity =
      Number.isFinite(transaction.quantity) && transaction.quantity > 0 ? Math.round(transaction.quantity) : 1;
    const goaBreakdown = transaction.goaBreakdown ?? computeGoaBreakdown(service, normalizedQuantity);
    const receiptLines = sanitizeReceiptLines(transaction.receiptLines);
    const status = normalizeStatus(transaction.status, transaction.amount, transaction.paidAmount);
    return {
      ...transaction,
      quantity: normalizedQuantity,
      goaBreakdown,
      status,
      ...(receiptLines ? { receiptLines } : {}),
    };
  });

const initialPriceEntries = igelPriceList.map((entry) => ({
  ...entry,
  goaBreakdown: sanitizeGoaBreakdown(entry.goaBreakdown),
  receiptTemplate: sanitizeReceiptLines(entry.receiptTemplate),
}));

const initialTransactions = mapInitialTransactions(initialPriceEntries, initialIgelTransactions);

export const useIgelStore = create<IgelState>((set, get) => ({
  priceList: initialPriceEntries,
  transactions: initialTransactions,
  addPriceListEntry: (payload) => {
    const entry: IgelPriceListEntry = {
      id: payload.id ?? generatePriceListId(),
      treatment: payload.treatment,
      unit: payload.unit,
      price: payload.price,
      cycle: payload.cycle,
      notes: payload.notes,
      goaCodes: payload.goaCodes ?? [],
      materials: payload.materials ?? [],
      receiptTemplate: sanitizeReceiptLines(payload.receiptTemplate),
      goaBreakdown: sanitizeGoaBreakdown(payload.goaBreakdown),
    };
    set((state) => ({ priceList: [entry, ...state.priceList] }));
    return entry;
  },
  updatePriceListEntry: (id, changes) =>
    set((state) => ({
      priceList: state.priceList.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...changes,
              goaCodes: changes.goaCodes ?? entry.goaCodes ?? [],
              materials: changes.materials ?? entry.materials ?? [],
              receiptTemplate: Object.prototype.hasOwnProperty.call(changes, "receiptTemplate")
                ? sanitizeReceiptLines(changes.receiptTemplate)
                : entry.receiptTemplate,
              goaBreakdown: Object.prototype.hasOwnProperty.call(changes, "goaBreakdown")
                ? sanitizeGoaBreakdown(changes.goaBreakdown)
                : entry.goaBreakdown,
            }
          : entry,
      ),
    })),
  deletePriceListEntry: (id) =>
    set((state) => ({ priceList: state.priceList.filter((entry) => entry.id !== id) })),
  recordSale: ({
    patient,
    patientNumber,
    serviceId,
    paymentMethod,
    collector,
    quantity,
    paidAmount,
    notes,
    includeNotesOnReceipt,
    receiptLines,
    goaBreakdown,
  }) => {
    const service = get().priceList.find((entry) => entry.id === serviceId);
    if (!service) return null;
    const normalizedQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.round(quantity) : 1;
    const lineAmount = service.price * normalizedQuantity;
    const normalizedPaid = coercePaidAmount(lineAmount, paidAmount);
    const normalizedReceiptLines = sanitizeReceiptLines(receiptLines);
    const goaBreakdownLines =
      goaBreakdown && goaBreakdown.length
        ? goaBreakdown.map((line) => ({
            step: line.step.trim(),
            code: line.code.trim(),
            factor: line.factor?.trim() ?? "",
            amount: coerceNumber(line.amount),
            unit: line.unit?.trim() ?? "",
          }))
        : computeGoaBreakdown(service, normalizedQuantity);
    const normalizedStatus = normalizeStatus(status, lineAmount, normalizedPaid);
    const transaction: IgelTransaction = {
      id: generateTransactionId(),
      patient,
      patientNumber,
      serviceId,
      collector,
      paymentMethod,
      quantity: normalizedQuantity,
      amount: lineAmount,
      paidAmount: normalizedPaid,
      createdAt: new Date().toISOString(),
      status: normalizedStatus,
      notes,
      includeNotesOnReceipt,
      ...(normalizedReceiptLines ? { receiptLines: normalizedReceiptLines } : {}),
      goaBreakdown: goaBreakdownLines,
    };
    set((state) => ({ transactions: [transaction, ...state.transactions] }));

    const adjustStock = useInventoryStore.getState().adjustStock;
    (service.materials ?? []).forEach((material) => {
      const totalQuantity = material.quantity * normalizedQuantity;
      adjustStock({
        itemId: material.itemId,
        quantity: totalQuantity,
        actor: collector,
        note: "IGeL Verkauf " + service.treatment,
      });
    });

    if (paymentMethod === "Bar") {
      const employeeDirectory = useEmployeeDirectory.getState();
      const matchedEmployee = employeeDirectory.employees.find((entry) => entry.name === collector);
      useCashDrawerStore.getState().registerSale({
        amount: normalizedPaid,
        description: `IGeL Verkauf ${service.treatment}`,
        referenceId: transaction.id,
        employeeId: matchedEmployee?.id,
      });
    }

    return transaction;
  },
  updateTransaction: (id, changes) =>
    set((state) => {
      const priceList = get().priceList;
      return {
        transactions: state.transactions.map((transaction) => {
          if (transaction.id !== id) return transaction;
          const next = { ...transaction, ...changes };
          const normalizedQuantity =
            typeof changes.quantity === "number" && Number.isFinite(changes.quantity) && changes.quantity > 0
              ? Math.round(changes.quantity)
              : next.quantity;
          next.quantity = normalizedQuantity;
          const currentService = priceList.find((entry) => entry.id === next.serviceId);
          const fallbackUnitPrice = transaction.quantity > 0 ? transaction.amount / transaction.quantity : 0;
          const basePrice = currentService?.price ?? fallbackUnitPrice;
          next.amount = basePrice * normalizedQuantity;
          const paidCandidate = typeof changes.paidAmount === "number" ? changes.paidAmount : next.paidAmount;
          next.paidAmount = coercePaidAmount(next.amount, paidCandidate);
          if ("receiptLines" in changes) {
            const normalizedLines = sanitizeReceiptLines(changes.receiptLines);
            if (normalizedLines) {
              next.receiptLines = normalizedLines;
            } else {
              delete next.receiptLines;
            }
          }
          if ("includeNotesOnReceipt" in changes) {
            next.includeNotesOnReceipt =
              typeof changes.includeNotesOnReceipt === "boolean" ? changes.includeNotesOnReceipt : next.includeNotesOnReceipt;
          }
          if ("goaBreakdown" in changes && Array.isArray(changes.goaBreakdown)) {
            next.goaBreakdown = changes.goaBreakdown.map((line) => ({
            step: line.step.trim(),
            code: line.code.trim(),
            factor: line.factor?.trim() ?? "",
            amount: coerceNumber(line.amount),
            unit: line.unit?.trim() ?? "",
          }));
          } else if (currentService) {
            next.goaBreakdown = computeGoaBreakdown(currentService, normalizedQuantity);
          }
          return next;
        }),
      };
    }),
  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((transaction) => transaction.id !== id),
    })),
}));

export function selectTransactionsByPeriod(
  transactions: IgelTransaction[],
  period: "day" | "week" | "month",
) {
  const now = new Date();
  return transactions.filter((transaction) => {
    const date = new Date(transaction.createdAt);
    if (period === "day") {
      return date.toDateString() === now.toDateString();
    }
    if (period === "week") {
      const diff = now.getTime() - date.getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    }
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
}

export type {
  IgelPriceListEntry,
  IgelTransaction,
  PaymentMethod,
  RecordSalePayload,
  AddPriceListEntryPayload,
  UpdatePriceListEntryPayload,
  UpdateTransactionPayload,
};
