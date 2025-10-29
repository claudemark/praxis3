import { endOfWeek, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { de } from "date-fns/locale";

import type { ClockEvent } from "@/data/time-tracking";
import type { ComputedRecord } from "@/features/time-tracking/store/time-tracking-store";

const weekOptions = { locale: de, weekStartsOn: 1 } as const;

export interface PeriodTotal {
  key: string;
  label: string;
  minutes: number;
}

export interface EmployeeAggregation {
  employeeId: string;
  employeeName: string;
  totalMinutes: number;
  daily: PeriodTotal[];
  weekly: PeriodTotal[];
  monthly: PeriodTotal[];
}

export interface ExcelRow {
  Mitarbeiter: string;
  Ebene: "Tag" | "Woche" | "Monat";
  Zeitraum: string;
  Stunden: string;
  Minuten: number;
}

export function aggregateWorkMinutes(
  records: ComputedRecord[],
  employeeNameLookup: Map<string, string>,
  now = new Date(),
): EmployeeAggregation[] {
  const byEmployee = new Map<string, EmployeeAggregation>();

  for (const record of records) {
    const employeeId = record.employeeId;
    const employeeName = employeeNameLookup.get(employeeId) ?? "Teammitglied";

    if (!byEmployee.has(employeeId)) {
      byEmployee.set(employeeId, {
        employeeId,
        employeeName,
        totalMinutes: 0,
        daily: [],
        weekly: [],
        monthly: [],
      });
    }

    const aggregation = byEmployee.get(employeeId)!;
    const date = parseISO(record.date);
    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const workedMinutes = record.workedMinutes + getOpenWorkMinutes(record.events, now);
    aggregation.totalMinutes += workedMinutes;

    const dayKey = format(date, "yyyy-MM-dd");
    const dayLabel = format(date, "EEEE, dd.MM.yyyy", { locale: de });
    upsertPeriodTotal(aggregation.daily, dayKey, dayLabel, workedMinutes);

    const weekStart = startOfWeek(date, weekOptions);
    const weekEnd = endOfWeek(date, weekOptions);
    const weekKey = format(weekStart, "yyyy-'KW'II");
    const weekLabel = `KW ${format(date, "II", { locale: de })} (${format(weekStart, "dd.MM.", { locale: de })} - ${format(weekEnd, "dd.MM.yyyy", { locale: de })})`;
    upsertPeriodTotal(aggregation.weekly, weekKey, weekLabel, workedMinutes);

    const monthStart = startOfMonth(date);
    const monthKey = format(monthStart, "yyyy-MM");
    const monthLabel = format(date, "LLLL yyyy", { locale: de });
    upsertPeriodTotal(aggregation.monthly, monthKey, capitalize(monthLabel), workedMinutes);
  }

  const results = Array.from(byEmployee.values());
  for (const entry of results) {
    entry.daily.sort((a, b) => a.key.localeCompare(b.key));
    entry.weekly.sort((a, b) => a.key.localeCompare(b.key));
    entry.monthly.sort((a, b) => a.key.localeCompare(b.key));
  }

  return results.sort((a, b) => a.employeeName.localeCompare(b.employeeName, "de"));
}

export function buildExcelRows(aggregations: EmployeeAggregation[], level: "daily" | "weekly" | "monthly"): ExcelRow[] {
  const levelLabel = level === "daily" ? "Tag" : level === "weekly" ? "Woche" : "Monat";
  return aggregations.flatMap((entry) =>
    entry[level].map((period) => ({
      Mitarbeiter: entry.employeeName,
      Ebene: levelLabel,
      Zeitraum: period.label,
      Stunden: formatMinutesAsHours(period.minutes),
      Minuten: period.minutes,
    })),
  );
}

export function formatMinutesAsHours(minutes: number) {
  return (minutes / 60).toFixed(2);
}

export function computeLiveAdjustedMinutes(record: ComputedRecord, now = new Date()) {
  return record.workedMinutes + getOpenWorkMinutes(record.events, now);
}

function upsertPeriodTotal(list: PeriodTotal[], key: string, label: string, minutes: number) {
  const existing = list.find((item) => item.key === key);
  if (existing) {
    existing.minutes += minutes;
    return;
  }
  list.push({ key, label, minutes });
}

function getOpenWorkMinutes(events: ClockEvent[], now: Date) {
  if (!events.length) {
    return 0;
  }
  const last = events[events.length - 1]!;
  if (last.type === "clock-in" || last.type === "break-end") {
    const start = new Date(last.timestamp);
    if (Number.isNaN(start.getTime())) {
      return 0;
    }
    return Math.max(0, Math.round((now.getTime() - start.getTime()) / 60000));
  }
  return 0;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}



