import { useEffect, useMemo, useState } from "react";

import type { ClockEvent } from "@/data/time-tracking";

interface LiveTimerOptions {
  paused?: boolean;
  resolutionMs?: number;
}

export interface LiveTimerResult {
  totalSeconds: number;
  liveSeconds: number;
  isRunning: boolean;
  startedAt: Date | null;
  lastActiveEventType: ClockEvent["type"] | null;
}

export function useLiveWorkTimer(
  events: ClockEvent[],
  baseWorkedMinutes: number,
  options: LiveTimerOptions = {},
): LiveTimerResult {
  const resolution = options.resolutionMs ?? 1000;
  const [now, setNow] = useState(() => Date.now());

  const { startedAt, isActive, lastActiveEventType } = useMemo(() => {
    if (!events.length) {
      return { startedAt: null, isActive: false, lastActiveEventType: null };
    }

    const lastEvent = events[events.length - 1]!;
    const activeTypes: ClockEvent["type"][] = ["clock-in", "break-end"];
    if (!activeTypes.includes(lastEvent.type)) {
      return { startedAt: null, isActive: false, lastActiveEventType: lastEvent.type };
    }

    const start = new Date(lastEvent.timestamp);
    if (Number.isNaN(start.getTime())) {
      return { startedAt: null, isActive: false, lastActiveEventType: lastEvent.type };
    }

    return {
      startedAt: start,
      isActive: true,
      lastActiveEventType: lastEvent.type,
    };
  }, [events]);

  useEffect(() => {
    if (!isActive || options.paused) {
      return undefined;
    }
    const timerId = window.setInterval(() => setNow(Date.now()), resolution);
    return () => window.clearInterval(timerId);
  }, [isActive, resolution, options.paused]);

  useEffect(() => {
    if (!isActive || options.paused) {
      setNow(Date.now());
    }
  }, [isActive, options.paused]);

  const liveSeconds = useMemo(() => {
    if (!startedAt || !isActive || options.paused) {
      return 0;
    }
    return Math.max(0, Math.floor((now - startedAt.getTime()) / 1000));
  }, [now, startedAt, isActive, options.paused]);

  const baseSeconds = Math.max(0, Math.floor(baseWorkedMinutes * 60));

  return {
    totalSeconds: baseSeconds + liveSeconds,
    liveSeconds,
    isRunning: isActive && !options.paused,
    startedAt,
    lastActiveEventType,
  };
}
