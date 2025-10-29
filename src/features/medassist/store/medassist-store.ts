import { create } from "zustand";

import {
  activeSession as initialSession,
  sessionHistory as initialHistory,
  type MedAssistSegment,
  type MedAssistSuggestion,
  type MedAssistStatus,
  type MedAssistSession,
} from "@/data/medassist";

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
  addHistorySession: (session) =>
    set((state) => ({ history: [session, ...state.history] })),
  updateHistorySession: (id, changes) =>
    set((state) => ({
      history: state.history.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)),
    })),
  deleteHistorySession: (id) =>
    set((state) => ({ history: state.history.filter((entry) => entry.id !== id) })),
}));
