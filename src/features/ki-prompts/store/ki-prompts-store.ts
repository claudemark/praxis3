import { create } from "zustand";

import { kiPrompts as initialPrompts, type KiPrompt } from "@/data/ki-prompts";
import {
  fetchKiPromptsFromSupabase,
  createKiPromptInSupabase,
  updateKiPromptInSupabase,
  deleteKiPromptFromSupabase,
} from "@/features/ki-prompts/api/ki-prompts-api";

const generatePromptId = () => "prompt-" + Date.now();

type CreatePromptPayload = Omit<KiPrompt, "id"> & { id?: string };

type UpdatePromptPayload = Partial<Omit<KiPrompt, "id">>;

interface KiPromptState {
  prompts: KiPrompt[];
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  fetchPrompts: () => Promise<void>;
  createPrompt: (payload: CreatePromptPayload) => KiPrompt;
  updatePrompt: (id: string, changes: UpdatePromptPayload) => void;
  deletePrompt: (id: string) => void;
}

export const useKiPromptStore = create<KiPromptState>((set) => {
  const persistCreate = async (prompt: KiPrompt) => {
    try {
      await createKiPromptInSupabase(prompt);
      console.log("[KI Prompts Store] Persisted create to Supabase:", prompt.id);
    } catch (error) {
      console.error("[KI Prompts Store] Failed to persist create:", error);
    }
  };

  const persistUpdate = async (id: string, changes: Partial<KiPrompt>) => {
    try {
      await updateKiPromptInSupabase(id, changes);
      console.log("[KI Prompts Store] Persisted update to Supabase:", id);
    } catch (error) {
      console.error("[KI Prompts Store] Failed to persist update:", error);
    }
  };

  const persistDelete = async (id: string) => {
    try {
      await deleteKiPromptFromSupabase(id);
      console.log("[KI Prompts Store] Persisted delete to Supabase:", id);
    } catch (error) {
      console.error("[KI Prompts Store] Failed to persist delete:", error);
    }
  };

  return {
    prompts: initialPrompts,
    isLoading: false,
    error: null,
    initialized: false,
    fetchPrompts: async () => {
      console.log("[KI Prompts Store] Fetching prompts from Supabase...");
      set({ isLoading: true, error: null });
      try {
        const prompts = await fetchKiPromptsFromSupabase();
        console.log("[KI Prompts Store] Loaded", prompts.length, "prompts from Supabase");
        set({ prompts, isLoading: false, initialized: true });
      } catch (error) {
        console.error("[KI Prompts Store] Error fetching prompts:", error);
        set({ error: error instanceof Error ? error.message : "Failed to fetch prompts", isLoading: false });
      }
    },
    createPrompt: (payload) => {
      const prompt: KiPrompt = {
        ...payload,
        id: payload.id ?? generatePromptId(),
      };
      set((state) => ({ prompts: [prompt, ...state.prompts] }));
      void persistCreate(prompt);
      return prompt;
    },
    updatePrompt: (id, changes) => {
      set((state) => ({
        prompts: state.prompts.map((prompt) =>
          prompt.id === id ? { ...prompt, ...changes } : prompt,
        ),
      }));
      void persistUpdate(id, changes);
    },
    deletePrompt: (id) => {
      set((state) => ({ prompts: state.prompts.filter((prompt) => prompt.id !== id) }));
      void persistDelete(id);
    },
  };
});
