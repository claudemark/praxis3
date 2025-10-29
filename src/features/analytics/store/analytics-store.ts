import { create } from "zustand";
import { parseISO } from "date-fns";

import {
  monthlyTimeSeries,
  serviceMix,
  staffPerformance,
  collectionRisks,
  type TimeSeriesPoint,
  type ServiceMixEntry,
  type CollectionRiskEntry,
  type StaffPerformanceEntry,
  type TimeframeKey,
} from "@/features/analytics/store/analytics-data";

type LocationKey = "Gesamt" | "Frankfurt" | "Offenbach" | "Bad Homburg";

export interface ForecastPoint {
  date: string;
  projectedRevenue: number;
  projectedMargin: number;
}

interface AnalyticsSnapshot {
  metrics: {
    totalRevenue: number;
    revenueDelta: number;
    marginRate: number;
    newPatients: number;
    avgBasket: number;
    privateShare: number;
  };
  previousMetrics: {
    totalRevenue: number;
    marginRate: number;
    newPatients: number;
    avgBasket: number;
    privateShare: number;
  };
  timeSeries: TimeSeriesPoint[];
  previousSeries: TimeSeriesPoint[];
  serviceMix: ServiceMixEntry[];
  staffPerformance: StaffPerformanceEntry[];
  collectionRisks: CollectionRiskEntry[];
  forecast: ForecastPoint[];
}

interface AnalyticsState {
  timeframe: TimeframeKey;
  location: LocationKey;
  comparePrevious: boolean;
  focus: "revenue" | "margin" | "patients";
  setTimeframe: (timeframe: TimeframeKey) => void;
  setLocation: (location: LocationKey) => void;
  toggleCompare: () => void;
  setFocus: (focus: AnalyticsState["focus"]) => void;
  snapshot: AnalyticsSnapshot;
}

const locationAdjustments: Record<
  LocationKey,
  {
    revenueFactor: number;
    marginDelta: number;
    privateDelta: number;
    patientsFactor: number;
    avgBasketFactor: number;
    collectionFactor: number;
  }
> = {
  Gesamt: {
    revenueFactor: 1,
    marginDelta: 0,
    privateDelta: 0,
    patientsFactor: 1,
    avgBasketFactor: 1,
    collectionFactor: 1,
  },
  Frankfurt: {
    revenueFactor: 0.52,
    marginDelta: 0.01,
    privateDelta: 0.02,
    patientsFactor: 0.48,
    avgBasketFactor: 1.05,
    collectionFactor: 0.55,
  },
  Offenbach: {
    revenueFactor: 0.28,
    marginDelta: -0.015,
    privateDelta: -0.01,
    patientsFactor: 0.32,
    avgBasketFactor: 0.96,
    collectionFactor: 0.27,
  },
  "Bad Homburg": {
    revenueFactor: 0.2,
    marginDelta: 0.005,
    privateDelta: 0.015,
    patientsFactor: 0.22,
    avgBasketFactor: 1.02,
    collectionFactor: 0.18,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toPercentChange(current: number, previous: number) {
  if (!previous) {
    return 0;
  }
  return (current - previous) / previous;
}

function adjustSeries(series: TimeSeriesPoint[], location: LocationKey): TimeSeriesPoint[] {
  const profile = locationAdjustments[location];
  return series.map((point) => ({
    ...point,
    revenue: Math.round(point.revenue * profile.revenueFactor),
    margin: clamp(point.margin + profile.marginDelta, 0.38, 0.68),
    privateShare: clamp(point.privateShare + profile.privateDelta, 0.24, 0.72),
    newPatients: Math.round(point.newPatients * profile.patientsFactor),
    avgBasket: Math.round(point.avgBasket * profile.avgBasketFactor),
  }));
}

function adjustServiceMix(entries: ServiceMixEntry[], location: LocationKey): ServiceMixEntry[] {
  const profile = locationAdjustments[location];
  return entries.map((entry) => ({
    ...entry,
    revenue: Math.round(entry.revenue * profile.revenueFactor),
    margin: clamp(entry.margin + profile.marginDelta, 0.3, 0.75),
    delta: clamp(entry.delta + profile.marginDelta / 2, -0.1, 0.2),
  }));
}

function adjustStaffPerformance(entries: StaffPerformanceEntry[], location: LocationKey): StaffPerformanceEntry[] {
  const profile = locationAdjustments[location];
  return entries.map((entry, index) => {
    const roleFactor = 1 - index * 0.05;
    return {
      ...entry,
      revenue: Math.round(entry.revenue * profile.revenueFactor * roleFactor),
      conversionRate: clamp(entry.conversionRate + profile.marginDelta / 2, 0.4, 0.85),
      satisfaction: clamp(entry.satisfaction + profile.privateDelta * 10, 3.8, 4.95),
    };
  });
}

function adjustCollectionRisks(entries: CollectionRiskEntry[], location: LocationKey): CollectionRiskEntry[] {
  const profile = locationAdjustments[location];
  return entries.map((entry) => ({
    ...entry,
    openAmount: Math.round(entry.openAmount * profile.collectionFactor),
  }));
}

function calculateSnapshot(timeframe: TimeframeKey, location: LocationKey): AnalyticsSnapshot {
  const months = timeframe === "30d" ? 1 : timeframe === "90d" ? 3 : 12;
  const sorted = [...monthlyTimeSeries].sort(
    (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
  );

  const adjusted = adjustSeries(sorted, location);

  const slice = adjusted.slice(-months);
  const previousSlice = adjusted.slice(-(months * 2), -months);

  const sumRevenue = slice.reduce((acc, point) => acc + point.revenue, 0);
  const previousRevenue = previousSlice.reduce((acc, point) => acc + point.revenue, 0);
  const revenueDelta = toPercentChange(sumRevenue, previousRevenue);

  const avgMargin = slice.reduce((acc, point) => acc + point.margin, 0) / slice.length || 0;
  const previousAvgMargin =
    previousSlice.reduce((acc, point) => acc + point.margin, 0) / previousSlice.length || 0;
  const avgPrivateShare = slice.reduce((acc, point) => acc + point.privateShare, 0) / slice.length || 0;
  const previousPrivateShare =
    previousSlice.reduce((acc, point) => acc + point.privateShare, 0) / previousSlice.length || 0;
  const totalPatients = slice.reduce((acc, point) => acc + point.newPatients, 0);
  const previousPatients = previousSlice.reduce((acc, point) => acc + point.newPatients, 0);
  const avgBasket = slice.reduce((acc, point) => acc + point.avgBasket, 0) / slice.length || 0;
  const previousAvgBasket =
    previousSlice.reduce((acc, point) => acc + point.avgBasket, 0) / previousSlice.length || 0;

  const mix = adjustServiceMix(serviceMix[timeframe], location);

  const forecast: ForecastPoint[] = buildForecast(adjusted, months);

  return {
    metrics: {
      totalRevenue: sumRevenue,
      revenueDelta,
      marginRate: avgMargin,
      newPatients: totalPatients,
      avgBasket,
      privateShare: avgPrivateShare,
    },
    previousMetrics: {
      totalRevenue: previousRevenue,
      marginRate: previousAvgMargin,
      newPatients: previousPatients,
      avgBasket: previousAvgBasket,
      privateShare: previousPrivateShare,
    },
    timeSeries: slice,
    previousSeries: previousSlice,
    serviceMix: mix,
    staffPerformance: adjustStaffPerformance(staffPerformance, location),
    collectionRisks: adjustCollectionRisks(collectionRisks, location),
    forecast,
  };
}

function buildForecast(series: TimeSeriesPoint[], months: number): ForecastPoint[] {
  if (series.length < 4) {
    return [];
  }
  const lastPoints = series.slice(-4);
  const revenueGrowth = (lastPoints[lastPoints.length - 1]!.revenue - lastPoints[0]!.revenue) / (lastPoints.length - 1);
  const marginAverage = lastPoints.reduce((acc, point) => acc + point.margin, 0) / lastPoints.length;
  const lastDate = parseISO(lastPoints[lastPoints.length - 1]!.date);

  return Array.from({ length: months }, (_, index) => {
    const projectedRevenue = lastPoints[lastPoints.length - 1]!.revenue + revenueGrowth * (index + 1);
    const projectedMargin = Math.min(0.65, Math.max(0.4, marginAverage + index * 0.005));
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + index + 1);
    return {
      date: nextDate.toISOString().slice(0, 10),
      projectedRevenue,
      projectedMargin,
    };
  });
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  timeframe: "90d",
  location: "Gesamt",
  comparePrevious: true,
  focus: "revenue",
  setTimeframe: (timeframe) =>
    set((state) => ({ timeframe, snapshot: calculateSnapshot(timeframe, state.location) })),
  setLocation: (location) =>
    set((state) => ({ location, snapshot: calculateSnapshot(state.timeframe, location) })),
  toggleCompare: () => set((state) => ({ comparePrevious: !state.comparePrevious })),
  setFocus: (focus) => set({ focus }),
  snapshot: calculateSnapshot("90d", "Gesamt"),
}));

export function useAnalyticsSnapshot(): AnalyticsSnapshot {
  return useAnalyticsStore((state) => state.snapshot);
}

export function useAnalyticsMeta() {
  const timeframe = useAnalyticsStore((state) => state.timeframe);
  const location = useAnalyticsStore((state) => state.location);
  const comparePrevious = useAnalyticsStore((state) => state.comparePrevious);
  const focus = useAnalyticsStore((state) => state.focus);
  return { timeframe, location, comparePrevious, focus };
}
