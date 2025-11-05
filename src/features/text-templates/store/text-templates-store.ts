import { create } from "zustand";

import {
  textTemplates as initialTemplates,
  favoriteTemplates as initialFavorites,
  type TextTemplate,
} from "@/data/text-templates";
import {
  fetchTextTemplatesFromSupabase,
  createTextTemplateInSupabase,
  updateTextTemplateInSupabase,
  deleteTextTemplateFromSupabase,
} from "../api/text-templates-api";
import { isSupabaseConfigured } from "@/services/supabase-client";

const generateTemplateId = () => "TPL-" + Date.now();

type CreateTemplatePayload = Omit<TextTemplate, "id" | "usageCount" | "updatedAt"> & {
  id?: string;
  usageCount?: number;
  updatedAt?: string;
};

type UpdateTemplatePayload = Partial<Omit<TextTemplate, "id">>;

interface TextTemplateState {
  templates: TextTemplate[];
  favorites: string[];
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  fetchTemplates: () => Promise<void>;
  createTemplate: (payload: CreateTemplatePayload) => TextTemplate;
  updateTemplate: (id: string, changes: UpdateTemplatePayload) => void;
  deleteTemplate: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setFavorite: (id: string, value: boolean) => void;
}

export const useTextTemplateStore = create<TextTemplateState>((set) => {
  const persistCreate = async (template: TextTemplate) => {
    console.log("[Text Templates Store] persistCreate called with:", template);
    try {
      const result = await createTextTemplateInSupabase(template);
      console.log("[Text Templates Store] Successfully persisted template:", result);
    } catch (error) {
      console.error("[Text Templates Store] Failed to persist template", error);
      throw error;
    }
  };

  const persistUpdate = async (id: string, changes: Partial<TextTemplate>) => {
    console.log("[Text Templates Store] persistUpdate called for:", id, changes);
    try {
      const result = await updateTextTemplateInSupabase(id, changes);
      console.log("[Text Templates Store] Successfully updated template:", result);
    } catch (error) {
      console.error("[Text Templates Store] Failed to update template", error);
      throw error;
    }
  };

  const persistDelete = async (id: string) => {
    console.log("[Text Templates Store] persistDelete called for:", id);
    try {
      await deleteTextTemplateFromSupabase(id);
      console.log("[Text Templates Store] Successfully deleted template:", id);
    } catch (error) {
      console.error("[Text Templates Store] Failed to delete template", error);
      throw error;
    }
  };

  return {
  templates: initialTemplates,
  favorites: initialFavorites,
  isLoading: false,
  error: null,
  initialized: false,
  fetchTemplates: async () => {
    console.log("[Text Templates Store] fetchTemplates called, configured:", isSupabaseConfigured);
    if (!isSupabaseConfigured) {
      set({ initialized: true });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const templates = await fetchTextTemplatesFromSupabase();
      console.log("[Text Templates Store] Loaded", templates.length, "templates from Supabase");
      set({ templates, isLoading: false, initialized: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[Text Templates Store] Failed to load templates from Supabase", error);
      set({ isLoading: false, initialized: true, error: message });
    }
  },
  createTemplate: (payload) => {
    console.log("[Text Templates Store] createTemplate called with payload:", payload);
    const template: TextTemplate = {
      ...payload,
      id: payload.id ?? generateTemplateId(),
      usageCount: payload.usageCount ?? 0,
      updatedAt: payload.updatedAt ?? new Date().toISOString(),
    };
    console.log("[Text Templates Store] Created template object:", template);
    set((state) => ({ templates: [template, ...state.templates] }));
    console.log("[Text Templates Store] State updated, calling persistCreate...");
    void persistCreate(template);
    return template;
  },
  updateTemplate: (id, changes) => {
    set((state) => ({
      templates: state.templates.map((template) =>
        template.id === id
          ? {
              ...template,
              ...changes,
              updatedAt: changes.updatedAt ?? new Date().toISOString(),
            }
          : template,
      ),
    }));
    void persistUpdate(id, changes);
  },
  deleteTemplate: (id) => {
    set((state) => ({
      templates: state.templates.filter((template) => template.id !== id),
      favorites: state.favorites.filter((favorite) => favorite !== id),
    }));
    void persistDelete(id);
  },
  toggleFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.includes(id)
        ? state.favorites.filter((favorite) => favorite !== id)
        : [...state.favorites, id],
    })),
  setFavorite: (id, value) =>
    set((state) => ({
      favorites: value
        ? state.favorites.includes(id)
          ? state.favorites
          : [...state.favorites, id]
        : state.favorites.filter((favorite) => favorite !== id),
    })),
  };
});
