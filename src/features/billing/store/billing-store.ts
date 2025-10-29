import { create } from "zustand";
import { nanoid } from "nanoid";

import {
  goaCodes as initialCodes,
  recentInvoices as initialInvoices,
  codeBundles as initialBundles,
  type GoACode,
  type CodeBundle,
} from "@/data/billing";

export interface InvoiceEntry {
  id: string;
  patient: string;
  datum: string;
  status: string;
  betrag: number;
  faellig: string;
}

type CreateCodePayload = GoACode;

type UpdateCodePayload = Partial<GoACode>;

type CreateInvoicePayload = Omit<InvoiceEntry, "id"> & { id?: string };

type UpdateInvoicePayload = Partial<Omit<InvoiceEntry, "id">>;

type CreateBundlePayload = Omit<CodeBundle, "id"> & { id?: string };

type UpdateBundlePayload = Partial<Omit<CodeBundle, "id">>;

interface BillingState {
  codes: GoACode[];
  invoices: InvoiceEntry[];
  bundles: CodeBundle[];
  createCode: (payload: CreateCodePayload) => void;
  updateCode: (nummer: string, changes: UpdateCodePayload) => void;
  deleteCode: (nummer: string) => void;
  toggleCodeFavorite: (nummer: string) => void;
  createBundle: (payload: CreateBundlePayload) => void;
  updateBundle: (id: string, changes: UpdateBundlePayload) => void;
  deleteBundle: (id: string) => void;
  toggleBundleFavorite: (id: string) => void;
  createInvoice: (payload: CreateInvoicePayload) => InvoiceEntry;
  updateInvoice: (id: string, changes: UpdateInvoicePayload) => void;
  deleteInvoice: (id: string) => void;
}

const generateInvoiceId = () => "INV-" + new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 12);

export const useBillingStore = create<BillingState>((set) => ({
  codes: initialCodes,
  invoices: initialInvoices,
  bundles: initialBundles,
  createCode: (payload) =>
    set((state) => ({
      codes: [
        { ...payload, favorite: payload.favorite ?? false },
        ...state.codes.filter((code) => code.nummer !== payload.nummer),
      ],
    })),
  updateCode: (nummer, changes) =>
    set((state) => ({
      codes: state.codes.map((code) => (code.nummer === nummer ? { ...code, ...changes } : code)),
    })),
  deleteCode: (nummer) =>
    set((state) => ({
      codes: state.codes.filter((code) => code.nummer !== nummer),
    })),
  toggleCodeFavorite: (nummer) =>
    set((state) => ({
      codes: state.codes.map((code) =>
        code.nummer === nummer ? { ...code, favorite: !code.favorite } : code,
      ),
    })),
  createBundle: (payload) =>
    set((state) => {
      const sanitized: CodeBundle = {
        id: payload.id?.trim() || `combo-${nanoid(5)}`,
        title: payload.title.trim(),
        beschreibung: payload.beschreibung.trim(),
        channel: payload.channel,
        codes: payload.codes,
        favorite: payload.favorite ?? false,
      };
      return {
        bundles: [sanitized, ...state.bundles.filter((bundle) => bundle.id !== sanitized.id)],
      };
    }),
  updateBundle: (id, changes) =>
    set((state) => ({
      bundles: state.bundles.map((bundle) => (bundle.id === id ? { ...bundle, ...changes } : bundle)),
    })),
  deleteBundle: (id) =>
    set((state) => ({
      bundles: state.bundles.filter((bundle) => bundle.id !== id),
    })),
  toggleBundleFavorite: (id) =>
    set((state) => ({
      bundles: state.bundles.map((bundle) =>
        bundle.id === id ? { ...bundle, favorite: !bundle.favorite } : bundle,
      ),
    })),
  createInvoice: (payload) => {
    const invoice: InvoiceEntry = {
      id: payload.id ?? generateInvoiceId(),
      patient: payload.patient,
      datum: payload.datum,
      status: payload.status,
      betrag: payload.betrag,
      faellig: payload.faellig,
    };
    set((state) => ({ invoices: [invoice, ...state.invoices] }));
    return invoice;
  },
  updateInvoice: (id, changes) =>
    set((state) => ({
      invoices: state.invoices.map((invoice) => (invoice.id === id ? { ...invoice, ...changes } : invoice)),
    })),
  deleteInvoice: (id) =>
    set((state) => ({
      invoices: state.invoices.filter((invoice) => invoice.id !== id),
    })),
}));
