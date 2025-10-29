import { create } from "zustand";

import { kiPrompts as initialPrompts, type KiPrompt } from "@/data/ki-prompts";

const generatePromptId = () => "prompt-" + Date.now();

type CreatePromptPayload = Omit<KiPrompt, "id"> & { id?: string };

type UpdatePromptPayload = Partial<Omit<KiPrompt, "id">>;

interface KiPromptState {
  prompts: KiPrompt[];
  createPrompt: (payload: CreatePromptPayload) => KiPrompt;
  updatePrompt: (id: string, changes: UpdatePromptPayload) => void;
  deletePrompt: (id: string) => void;
}

export const useKiPromptStore = create<KiPromptState>((set) => ({
  prompts: initialPrompts,
  createPrompt: (payload) => {
    const prompt: KiPrompt = {
      ...payload,
      id: payload.id ?? generatePromptId(),
    };
    set((state) => ({ prompts: [prompt, ...state.prompts] }));
    return prompt;
  },
  updatePrompt: (id, changes) =>
    set((state) => ({
      prompts: state.prompts.map((prompt) =>
        prompt.id === id ? { ...prompt, ...changes } : prompt,
      ),
    })),
  deletePrompt: (id) =>
    set((state) => ({ prompts: state.prompts.filter((prompt) => prompt.id !== id) })),
}));
