import { create } from "zustand";

import {
  textTemplates as initialTemplates,
  favoriteTemplates as initialFavorites,
  type TextTemplate,
} from "@/data/text-templates";

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
  createTemplate: (payload: CreateTemplatePayload) => TextTemplate;
  updateTemplate: (id: string, changes: UpdateTemplatePayload) => void;
  deleteTemplate: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setFavorite: (id: string, value: boolean) => void;
}

export const useTextTemplateStore = create<TextTemplateState>((set) => ({
  templates: initialTemplates,
  favorites: initialFavorites,
  createTemplate: (payload) => {
    const template: TextTemplate = {
      ...payload,
      id: payload.id ?? generateTemplateId(),
      usageCount: payload.usageCount ?? 0,
      updatedAt: payload.updatedAt ?? new Date().toISOString(),
    };
    set((state) => ({ templates: [template, ...state.templates] }));
    return template;
  },
  updateTemplate: (id, changes) =>
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
    })),
  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((template) => template.id !== id),
      favorites: state.favorites.filter((favorite) => favorite !== id),
    })),
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
}));
