import { useCallback, useEffect, useRef, useState } from "react";

import {
  type MedAssistAiSummaryResult,
  summarizeRecording,
} from "@/features/medassist/api/medassist-ai";

export type RecorderStatus = "idle" | "requesting-permission" | "recording" | "stopping" | "error";
export type SummaryStatus = "idle" | "processing" | "error";

export interface UseMedAssistRecorderOptions {
  autoFormatting: boolean;
  locale?: string;
  patientContext?: Record<string, unknown>;
  summarizeOnStop?: boolean;
  onSummary: (summary: MedAssistAiSummaryResult) => void;
  onError?: (message: string) => void;
}

export interface UseMedAssistRecorderResult {
  isSupported: boolean;
  status: RecorderStatus;
  summaryStatus: SummaryStatus;
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  elapsedSeconds: number;
  hasRecording: boolean;
  start: () => Promise<void>;
  stop: (options?: { process?: boolean }) => Promise<void>;
  summarize: () => Promise<void>;
  resetError: () => void;
}

export function useMedAssistRecorder(options: UseMedAssistRecorderOptions): UseMedAssistRecorderResult {
  const autoFormattingRef = useRef(options.autoFormatting);
  const localeRef = useRef(options.locale);
  const patientContextRef = useRef(options.patientContext);
  const summarizeOnStopRef = useRef(options.summarizeOnStop ?? true);
  const processOnStopRef = useRef<boolean>(summarizeOnStopRef.current);
  const summaryHandlerRef = useRef(options.onSummary);
  const errorHandlerRef = useRef(options.onError);

  useEffect(() => {
    autoFormattingRef.current = options.autoFormatting;
  }, [options.autoFormatting]);
  useEffect(() => {
    localeRef.current = options.locale;
  }, [options.locale]);
  useEffect(() => {
    patientContextRef.current = options.patientContext;
  }, [options.patientContext]);
  useEffect(() => {
    summarizeOnStopRef.current = options.summarizeOnStop ?? true;
  }, [options.summarizeOnStop]);
  useEffect(() => {
    processOnStopRef.current = summarizeOnStopRef.current;
  }, [options.summarizeOnStop]);
  useEffect(() => {
    summaryHandlerRef.current = options.onSummary;
  }, [options.onSummary]);
  useEffect(() => {
    errorHandlerRef.current = options.onError;
  }, [options.onError]);

  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const lastRecordingRef = useRef<Blob | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimestampRef = useRef<number | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "mediaDevices" in navigator &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    "MediaRecorder" in window;

  const resetError = useCallback(() => setError(null), []);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimestampRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startTimestampRef.current = Date.now();
    setElapsedSeconds(0);
    timerRef.current = window.setInterval(() => {
      if (startTimestampRef.current) {
        const diff = Math.round((Date.now() - startTimestampRef.current) / 1000);
        setElapsedSeconds(diff);
      }
    }, 1000);
  }, [stopTimer]);

  const cleanupStream = useCallback((stream: MediaStream | undefined) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // ignore track stop errors
      }
    });
  }, []);

  const finalizeRecording = useCallback(
    (mimeType: string | undefined): Blob | null => {
      if (!chunksRef.current.length) {
        return null;
      }
      const blob = new Blob(chunksRef.current, { type: mimeType ?? "audio/webm" });
      lastRecordingRef.current = blob;
      setHasRecording(true);
      chunksRef.current = [];
      return blob;
    },
    [],
  );

  const processRecording = useCallback(
    async (audio: Blob) => {
      setSummaryStatus("processing");
      setError(null);
      try {
        const summary = await summarizeRecording({
          audio,
          autoFormatting: autoFormattingRef.current,
          locale: localeRef.current,
          patientContext: patientContextRef.current,
        });
        summaryHandlerRef.current?.(summary);
        setSummaryStatus("idle");
      } catch (cause) {
        const message = extractErrorMessage(cause);
        setSummaryStatus("error");
        setError(message);
        if (errorHandlerRef.current) {
          errorHandlerRef.current(message);
        }
        throw cause;
      }
    },
    [],
  );

  const start = useCallback(async () => {
    if (!isSupported) {
      setError("Audio recording is not supported in this browser.");
      setStatus("error");
      return;
    }
    if (status === "recording" || status === "requesting-permission") {
      return;
    }

    resetError();
    setStatus("requesting-permission");
    setHasRecording(false);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = resolveMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("error", (event) => {
        const message =
          event.error?.message ?? "Unerwarteter Fehler beim Aufzeichnen der Audioaufnahme.";
        cleanupStream(recorder.stream);
        mediaRecorderRef.current = null;
        stopTimer();
        setStatus("error");
        setError(message);
        if (errorHandlerRef.current) {
          errorHandlerRef.current(message);
        }
      });

      recorder.addEventListener(
        "stop",
        async () => {
          stopTimer();
          cleanupStream(recorder.stream);
          mediaRecorderRef.current = null;
          setStatus("idle");
          const blob = finalizeRecording(recorder.mimeType);
          if (blob && processOnStopRef.current) {
            try {
              await processRecording(blob);
            } catch {
              // error already handled in processRecording
            }
          }
        },
        { once: true },
      );

      mediaRecorderRef.current = recorder;
      processOnStopRef.current = summarizeOnStopRef.current;
      recorder.start();
      startTimer();
      setStatus("recording");
    } catch (cause) {
      stopTimer();
      setStatus("error");
      const message = extractErrorMessage(cause);
      setError(message);
      if (errorHandlerRef.current) {
        errorHandlerRef.current(message);
      }
    }
  }, [
    cleanupStream,
    errorHandlerRef,
    finalizeRecording,
    isSupported,
    processRecording,
    resetError,
    startTimer,
    status,
    stopTimer,
  ]);

  const stop = useCallback(
    async (options: { process?: boolean } = {}) => {
      const recorder = mediaRecorderRef.current;
      const shouldProcess =
        typeof options.process === "boolean" ? options.process : summarizeOnStopRef.current;
      processOnStopRef.current = shouldProcess;
      if (!recorder) {
        if (shouldProcess && lastRecordingRef.current) {
          await processRecording(lastRecordingRef.current);
        }
        return;
      }
      if (recorder.state === "inactive") {
        if (shouldProcess && lastRecordingRef.current) {
          await processRecording(lastRecordingRef.current);
        }
        return;
      }
      setStatus("stopping");
      return new Promise<void>((resolve) => {
        recorder.addEventListener("stop", () => resolve(), { once: true });
        recorder.stop();
      });
    },
    [processRecording],
  );

  const summarize = useCallback(async () => {
    if (!lastRecordingRef.current) {
      setError("Keine Aufnahme vorhanden. Bitte zuerst eine Aufnahme starten.");
      setSummaryStatus("error");
      return;
    }
    resetError();
    try {
      await processRecording(lastRecordingRef.current);
    } catch {
      // error handled
    }
  }, [processRecording, resetError]);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // ignore stop errors during cleanup
        }
      } else if (recorder?.stream) {
        cleanupStream(recorder.stream);
      }
      stopTimer();
    };
  }, [cleanupStream, stopTimer]);

  return {
    isSupported,
    status,
    summaryStatus,
    isRecording: status === "recording",
    isProcessing: summaryStatus === "processing",
    error,
    elapsedSeconds,
    hasRecording,
    start,
    stop,
    summarize,
    resetError,
  };
}

function resolveMimeType() {
  if (typeof window === "undefined" || !("MediaRecorder" in window)) {
    return undefined;
  }
  const supportedTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
    "audio/mpeg",
  ];
  for (const type of supportedTypes) {
    if (MediaRecorder.isTypeSupported?.(type)) {
      return type;
    }
  }
  return undefined;
}

function extractErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unbekannter Fehler.";
}
