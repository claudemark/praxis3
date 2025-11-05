import { create } from "zustand";

import {
  activeSession as initialSession,
  sessionHistory as initialHistory,
  type MedAssistSegment,
  type MedAssistSuggestion,
  type MedAssistStatus,
  type MedAssistSession,
} from "@/data/medassist";
import type { MedAssistAiSummaryResult } from "@/features/medassist/api/medassist-ai";
import {
  fetchMedAssistSessionsFromSupabase,
  createMedAssistSessionInSupabase,
  updateMedAssistSessionInSupabase,
  deleteMedAssistSessionFromSupabase,
} from "@/features/medassist/api/medassist-api";

const generateSegmentId = () => "seg-" + Date.now();
const generateSuggestionId = () => "sug-" + Date.now();

interface MedAssistState {
  activeSession: MedAssistSession;
  history: MedAssistSession[];
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  fetchSessions: () => Promise<void>;
  createSegment: (payload: Omit<MedAssistSegment, "id"> & { id?: string }) => MedAssistSegment;
  updateSegment: (id: string, changes: Partial<Omit<MedAssistSegment, "id">>) => void;
  deleteSegment: (id: string) => void;
  updateSessionStatus: (status: MedAssistStatus) => void;
  updateTranscript: (transcript: string) => void;
  createSuggestion: (payload: Omit<MedAssistSuggestion, "id"> & { id?: string }) => MedAssistSuggestion;
  updateSuggestion: (id: string, changes: Partial<Omit<MedAssistSuggestion, "id">>) => void;
  deleteSuggestion: (id: string) => void;
  applyAiSummary: (summary: MedAssistAiSummaryResult) => void;
  addHistorySession: (session: MedAssistSession) => void;
  updateHistorySession: (id: string, changes: Partial<MedAssistSession>) => void;
  deleteHistorySession: (id: string) => void;
}

export const useMedAssistStore = create<MedAssistState>((set) => {
  const persistUpdateSession = async (session: MedAssistSession) => {
    try {
      await updateMedAssistSessionInSupabase(session.id, session);
      console.log("[MedAssist Store] Persisted active session update to Supabase:", session.id);
    } catch (error) {
      console.error("[MedAssist Store] Failed to persist session update:", error);
    }
  };

  const persistCreateHistory = async (session: MedAssistSession) => {
    try {
      await createMedAssistSessionInSupabase(session);
      console.log("[MedAssist Store] Persisted history session to Supabase:", session.id);
    } catch (error) {
      console.error("[MedAssist Store] Failed to persist history session:", error);
    }
  };

  const persistUpdateHistory = async (id: string, changes: Partial<MedAssistSession>) => {
    try {
      await updateMedAssistSessionInSupabase(id, changes);
      console.log("[MedAssist Store] Persisted history session update to Supabase:", id);
    } catch (error) {
      console.error("[MedAssist Store] Failed to persist history session update:", error);
    }
  };

  const persistDeleteHistory = async (id: string) => {
    try {
      await deleteMedAssistSessionFromSupabase(id);
      console.log("[MedAssist Store] Persisted history session delete to Supabase:", id);
    } catch (error) {
      console.error("[MedAssist Store] Failed to persist history session delete:", error);
    }
  };

  return {
    activeSession: initialSession,
    history: initialHistory,
    isLoading: false,
    error: null,
    initialized: false,
    fetchSessions: async () => {
      console.log("[MedAssist Store] Fetching sessions from Supabase...");
      set({ isLoading: true, error: null });
      try {
        const sessions = await fetchMedAssistSessionsFromSupabase();
        console.log("[MedAssist Store] Loaded", sessions.length, "sessions from Supabase");
        // Set the first session as active, rest as history
        const [active, ...history] = sessions;
        if (active) {
          set({ activeSession: active, history, isLoading: false, initialized: true });
        } else {
          set({ history: [], isLoading: false, initialized: true });
        }
      } catch (error) {
        console.error("[MedAssist Store] Error fetching sessions:", error);
        set({ error: error instanceof Error ? error.message : "Failed to fetch sessions", isLoading: false });
      }
    },
    createSegment: (payload) => {
    const segment: MedAssistSegment = {
      ...payload,
      id: payload.id ?? generateSegmentId(),
    };
    set((state) => ({
      activeSession: {
        ...state.activeSession,
        lastEdited: new Date().toISOString(),
        segments: [...state.activeSession.segments, segment],
      },
    }));
    return segment;
  },
  updateSegment: (id, changes) =>
    set((state) => ({
      activeSession: {
        ...state.activeSession,
        lastEdited: new Date().toISOString(),
        segments: state.activeSession.segments.map((segment) =>
          segment.id === id ? { ...segment, ...changes } : segment,
        ),
      },
    })),
  deleteSegment: (id) =>
    set((state) => ({
      activeSession: {
        ...state.activeSession,
        lastEdited: new Date().toISOString(),
        segments: state.activeSession.segments.filter((segment) => segment.id !== id),
      },
    })),
  updateSessionStatus: (status) => {
    set((state) => {
      const updatedSession = {
        ...state.activeSession,
        status,
        lastEdited: new Date().toISOString(),
      };
      void persistUpdateSession(updatedSession);
      return { activeSession: updatedSession };
    });
  },
  updateTranscript: (transcript) =>
    set((state) => ({
      activeSession: {
        ...state.activeSession,
        transcript,
        lastEdited: new Date().toISOString(),
      },
    })),
  createSuggestion: (payload) => {
    const suggestion: MedAssistSuggestion = {
      ...payload,
      id: payload.id ?? generateSuggestionId(),
    };
    set((state) => ({
      activeSession: {
        ...state.activeSession,
        lastEdited: new Date().toISOString(),
        suggestions: [suggestion, ...state.activeSession.suggestions],
      },
    }));
    return suggestion;
  },
  updateSuggestion: (id, changes) =>
    set((state) => ({
      activeSession: {
        ...state.activeSession,
        lastEdited: new Date().toISOString(),
        suggestions: state.activeSession.suggestions.map((suggestion) =>
          suggestion.id === id ? { ...suggestion, ...changes } : suggestion,
        ),
      },
    })),
  deleteSuggestion: (id) =>
    set((state) => ({
      activeSession: {
        ...state.activeSession,
        lastEdited: new Date().toISOString(),
        suggestions: state.activeSession.suggestions.filter((suggestion) => suggestion.id !== id),
      },
    })),
  applyAiSummary: (summary) =>
    set((state) => ({
      activeSession: mergeSummaryWithSession(state.activeSession, summary),
    })),
  addHistorySession: (session) => {
    set((state) => ({ history: [session, ...state.history] }));
    void persistCreateHistory(session);
  },
  updateHistorySession: (id, changes) => {
    set((state) => ({
      history: state.history.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)),
    }));
    void persistUpdateHistory(id, changes);
  },
  deleteHistorySession: (id) => {
    set((state) => ({ history: state.history.filter((entry) => entry.id !== id) }));
    void persistDeleteHistory(id);
  },
  };
});

function mergeSummaryWithSession(
  session: MedAssistSession,
  summary: MedAssistAiSummaryResult,
): MedAssistSession {
  const lastEdited = new Date().toISOString();
  const segments = mergeSegments(session.segments, summary.segments);
  const suggestions = summary.suggestions
    ? mergeSuggestions(session.suggestions, summary.suggestions)
    : session.suggestions;

  return {
    ...session,
    transcript: summary.transcript ?? session.transcript,
    durationSeconds: summary.durationSeconds ?? session.durationSeconds,
    segments,
    suggestions,
    lastEdited,
  };
}

function mergeSegments(existing: MedAssistSegment[], updates: MedAssistAiSummaryResult["segments"]) {
  if (!updates || updates.length === 0) {
    return existing;
  }
  const indexByLabel = new Map(existing.map((segment) => [normalizeKey(segment.label), segment]));
  const now = Date.now();
  const usedIds = new Set<string>();

  const merged = updates.map((update, index) => {
    const key = normalizeKey(update.label);
    const current = indexByLabel.get(key) ?? existing[index];
    const id = update.id ?? current?.id ?? `seg-${now + index}`;
    usedIds.add(id);
    const next: MedAssistSegment = {
      id,
      label: update.label ?? current?.label ?? `Segment ${index + 1}`,
      content: update.content ?? current?.content ?? "",
    };
    const nextRisk = update.risk ?? current?.risk;
    if (typeof nextRisk !== "undefined") {
      next.risk = nextRisk;
    }
    const nextSuggestions = update.suggestions ?? current?.suggestions;
    if (typeof nextSuggestions !== "undefined") {
      next.suggestions = nextSuggestions;
    }
    return next;
  });

  existing.forEach((segment) => {
    if (!usedIds.has(segment.id)) {
      merged.push(segment);
    }
  });

  return merged;
}

function mergeSuggestions(
  existing: MedAssistSuggestion[],
  updates: MedAssistAiSummaryResult["suggestions"],
) {
  if (!updates || updates.length === 0) {
    return existing;
  }
  const now = Date.now();
  return updates.map((suggestion, index) => {
    const current = existing[index];
    return {
      id: suggestion.id ?? current?.id ?? `sug-${now + index}`,
      type: suggestion.type,
      code: suggestion.code ?? current?.code,
      title: suggestion.title ?? current?.title ?? "",
      confidence:
        typeof suggestion.confidence === "number"
          ? Math.min(1, Math.max(0, suggestion.confidence))
          : current?.confidence ?? 0,
      description: suggestion.description ?? current?.description ?? "",
    };
  });
}

function normalizeKey(value: string) {
  return value.toLocaleLowerCase("de-DE").trim();
}
