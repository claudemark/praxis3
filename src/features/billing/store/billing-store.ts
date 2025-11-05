import { create } from "zustand";
import { nanoid } from "nanoid";

import {
  goaCodes as initialCodes,
  recentInvoices as initialInvoices,
  codeBundles as initialBundles,
  type GoACode,
  type CodeBundle,
} from "@/data/billing";
import {
  fetchGoACodesFromSupabase,
  createGoACodeInSupabase,
  updateGoACodeInSupabase,
  deleteGoACodeFromSupabase,
  fetchCodeBundlesFromSupabase,
  createCodeBundleInSupabase,
  updateCodeBundleInSupabase,
  deleteCodeBundleFromSupabase,
  fetchInvoicesFromSupabase,
} from "@/features/billing/api/billing-api";

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
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  fetchBilling: () => Promise<void>;
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

export const useBillingStore = create<BillingState>((set) => {
  // Persist functions for GOÄ codes
  const persistCreateCode = async (code: GoACode) => {
    try {
      await createGoACodeInSupabase(code);
      console.log("[Billing Store] Persisted GOÄ code create to Supabase:", code.nummer);
    } catch (error) {
      console.error("[Billing Store] Failed to persist GOÄ code create:", error);
    }
  };

  const persistUpdateCode = async (nummer: string, changes: Partial<GoACode>) => {
    try {
      await updateGoACodeInSupabase(nummer, changes);
      console.log("[Billing Store] Persisted GOÄ code update to Supabase:", nummer);
    } catch (error) {
      console.error("[Billing Store] Failed to persist GOÄ code update:", error);
    }
  };

  const persistDeleteCode = async (nummer: string) => {
    try {
      await deleteGoACodeFromSupabase(nummer);
      console.log("[Billing Store] Persisted GOÄ code delete to Supabase:", nummer);
    } catch (error) {
      console.error("[Billing Store] Failed to persist GOÄ code delete:", error);
    }
  };

  // Persist functions for code bundles
  const persistCreateBundle = async (bundle: CodeBundle) => {
    try {
      await createCodeBundleInSupabase(bundle);
      console.log("[Billing Store] Persisted bundle create to Supabase:", bundle.id);
    } catch (error) {
      console.error("[Billing Store] Failed to persist bundle create:", error);
    }
  };

  const persistUpdateBundle = async (id: string, changes: Partial<CodeBundle>) => {
    try {
      await updateCodeBundleInSupabase(id, changes);
      console.log("[Billing Store] Persisted bundle update to Supabase:", id);
    } catch (error) {
      console.error("[Billing Store] Failed to persist bundle update:", error);
    }
  };

  const persistDeleteBundle = async (id: string) => {
    try {
      await deleteCodeBundleFromSupabase(id);
      console.log("[Billing Store] Persisted bundle delete to Supabase:", id);
    } catch (error) {
      console.error("[Billing Store] Failed to persist bundle delete:", error);
    }
  };

  return {
    codes: initialCodes,
    invoices: initialInvoices,
    bundles: initialBundles,
    isLoading: false,
    error: null,
    initialized: false,
    fetchBilling: async () => {
      console.log("[Billing Store] Fetching billing data from Supabase...");
      set({ isLoading: true, error: null });
      try {
        const [codes, bundles] = await Promise.all([
          fetchGoACodesFromSupabase(),
          fetchCodeBundlesFromSupabase(),
          // Note: billing_invoices table is empty, but we fetch it for future use
          fetchInvoicesFromSupabase(),
        ]);
        console.log("[Billing Store] Loaded from Supabase:", {
          codes: codes.length,
          bundles: bundles.length,
          invoices: "using mock data (table empty)",
        });
        set({ codes, bundles, isLoading: false, initialized: true });
      } catch (error) {
        console.error("[Billing Store] Error fetching billing data:", error);
        set({ error: error instanceof Error ? error.message : "Failed to fetch billing data", isLoading: false });
      }
    },
    createCode: (payload) => {
      set((state) => ({
        codes: [
          { ...payload, favorite: payload.favorite ?? false },
          ...state.codes.filter((code) => code.nummer !== payload.nummer),
        ],
      }));
      void persistCreateCode(payload);
    },
    updateCode: (nummer, changes) => {
      set((state) => ({
        codes: state.codes.map((code) => (code.nummer === nummer ? { ...code, ...changes } : code)),
      }));
      void persistUpdateCode(nummer, changes);
    },
    deleteCode: (nummer) => {
      set((state) => ({
        codes: state.codes.filter((code) => code.nummer !== nummer),
      }));
      void persistDeleteCode(nummer);
    },
    toggleCodeFavorite: (nummer) => {
      set((state) => ({
        codes: state.codes.map((code) =>
          code.nummer === nummer ? { ...code, favorite: !code.favorite } : code,
        ),
      }));
      const currentState = useBillingStore.getState();
      const code = currentState.codes.find((c) => c.nummer === nummer);
      if (code) {
        void persistUpdateCode(nummer, { favorite: code.favorite });
      }
    },
    createBundle: (payload) => {
      const sanitized: CodeBundle = {
        id: payload.id?.trim() || `combo-${nanoid(5)}`,
        title: payload.title.trim(),
        beschreibung: payload.beschreibung.trim(),
        channel: payload.channel,
        codes: payload.codes,
        favorite: payload.favorite ?? false,
      };
      set((state) => ({
        bundles: [sanitized, ...state.bundles.filter((bundle) => bundle.id !== sanitized.id)],
      }));
      void persistCreateBundle(sanitized);
    },
    updateBundle: (id, changes) => {
      set((state) => ({
        bundles: state.bundles.map((bundle) => (bundle.id === id ? { ...bundle, ...changes } : bundle)),
      }));
      void persistUpdateBundle(id, changes);
    },
    deleteBundle: (id) => {
      set((state) => ({
        bundles: state.bundles.filter((bundle) => bundle.id !== id),
      }));
      void persistDeleteBundle(id);
    },
    toggleBundleFavorite: (id) => {
      set((state) => ({
        bundles: state.bundles.map((bundle) =>
          bundle.id === id ? { ...bundle, favorite: !bundle.favorite } : bundle,
        ),
      }));
      const currentState = useBillingStore.getState();
      const bundle = currentState.bundles.find((b) => b.id === id);
      if (bundle) {
        void persistUpdateBundle(id, { favorite: bundle.favorite });
      }
    },
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
  };
});
