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

const generateSegmentId = () => "seg-" + Date.now();
const generateSuggestionId = () => "sug-" + Date.now();

interface MedAssistState {
  activeSession: MedAssistSession;
  history: MedAssistSession[];
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

export const useMedAssistStore = create<MedAssistState>((set) => ({
  activeSession: initialSession,
  history: initialHistory,
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
  updateSessionStatus: (status) =>
    set((state) => ({
      activeSession: {
        ...state.activeSession,
        status,
        lastEdited: new Date().toISOString(),
      },
    })),
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
  addHistorySession: (session) =>
    set((state) => ({ history: [session, ...state.history] })),
  updateHistorySession: (id, changes) =>
    set((state) => ({
      history: state.history.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)),
    })),
  deleteHistorySession: (id) =>
    set((state) => ({ history: state.history.filter((entry) => entry.id !== id) })),
}));

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
