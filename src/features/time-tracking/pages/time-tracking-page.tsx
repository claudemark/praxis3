import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format as formatDateFns, isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { useEmployeeDirectory, type EmployeeProfile } from "@/features/employees/store/employee-store";
import {
  useTimeTrackingStore,
  computeDailyRecord,
  type CalendarDayPayload,
  type ComputedRecord,
} from "@/features/time-tracking/store/time-tracking-store";
import {
  aggregateWorkMinutes,
  formatMinutesAsHours,
  computeLiveAdjustedMinutes,
} from "@/features/time-tracking/lib/time-aggregations";
import type {
  EmployeeAggregation,
  PeriodTotal,
} from "@/features/time-tracking/lib/time-aggregations";
import type {
  DeviceType,
  CalendarDayEntry,
  VacationRequest,
  SickLeave,
} from "@/data/time-tracking";
import { formatDate, formatDateRange, formatTime } from "@/lib/datetime";

type EmployeeStatusState = "idle" | "working" | "break" | "off";

interface EmployeeStatusInfo {
  state: EmployeeStatusState;
  label: string;
  description: string;
  tone: string;
  lastEventType?: string;
  lastEventTime?: string;
}

const MINUTES_PER_STANDARD_DAY = 8 * 60;
const DEFAULT_DEVICE: DeviceType = "Tablet";
const DEFAULT_LOCATION = "Zeiterfassungsterminal";

export function TimeTrackingPage() {
  const employees = useEmployeeDirectory((state) => state.employees);
  const clockRecords = useTimeTrackingStore((state) => state.clockRecords);
  const shiftAssignments = useTimeTrackingStore((state) => state.shiftAssignments);
  const vacationRequests = useTimeTrackingStore((state) => state.vacationRequests);
  const sickLeaves = useTimeTrackingStore((state) => state.sickLeaves);
  const calendarDays = useTimeTrackingStore((state) => state.calendarDays);
  const addCalendarDay = useTimeTrackingStore((state) => state.addCalendarDay);
  const updateCalendarDay = useTimeTrackingStore((state) => state.updateCalendarDay);
  const deleteCalendarDay = useTimeTrackingStore((state) => state.deleteCalendarDay);
  const clockIn = useTimeTrackingStore((state) => state.clockIn);
  const clockOut = useTimeTrackingStore((state) => state.clockOut);
  const startBreak = useTimeTrackingStore((state) => state.startBreak);
  const endBreak = useTimeTrackingStore((state) => state.endBreak);
  const submitVacationRequest = useTimeTrackingStore((state) => state.submitVacationRequest);
  const updateVacationRequest = useTimeTrackingStore((state) => state.updateVacationRequest);
  const deleteVacationRequest = useTimeTrackingStore((state) => state.deleteVacationRequest);
  const submitSickLeave = useTimeTrackingStore((state) => state.submitSickLeave);
  const updateSickLeave = useTimeTrackingStore((state) => state.updateSickLeave);
  const deleteSickLeave = useTimeTrackingStore((state) => state.deleteSickLeave);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(() => employees[0]?.id ?? null);

  useEffect(() => {
    if (!employees.length) {
      setSelectedEmployeeId(null);
      return;
    }
    if (!selectedEmployeeId || !employees.some((entry) => entry.id === selectedEmployeeId)) {
      setSelectedEmployeeId(employees[0]?.id ?? null);
    }
  }, [employees, selectedEmployeeId]);

  const employeeLookup = useMemo(
    () => new Map<string, EmployeeProfile>(employees.map((entry) => [entry.id, entry])),
    [employees],
  );
  const employeeNameLookup = useMemo(
    () => new Map<string, string>(employees.map((entry) => [entry.id, entry.name])),
    [employees],
  );

  const computedRecords = useMemo(() => clockRecords.map((record) => computeDailyRecord(record)), [clockRecords]);
  const recordsByEmployee = useMemo(() => {
    const map = new Map<string, ComputedRecord[]>();
    for (const record of computedRecords) {
      const collection = map.get(record.employeeId);
      if (collection) {
        collection.push(record);
      } else {
        map.set(record.employeeId, [record]);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.date.localeCompare(a.date));
    }
    return map;
  }, [computedRecords]);
  const employeeStatusMap = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const map = new Map<string, EmployeeStatusInfo>();
    for (const employee of employees) {
      const todaysRecord = recordsByEmployee.get(employee.id)?.find((entry) => entry.date === today) ?? null;
      map.set(employee.id, computeEmployeeStatus(todaysRecord));
    }
    return map;
  }, [employees, recordsByEmployee]);
  const defaultStatus = useMemo(() => computeEmployeeStatus(null), []);
  const aggregations = useMemo(
    () => aggregateWorkMinutes(computedRecords, employeeNameLookup),
    [computedRecords, employeeNameLookup],
  );
  const aggregationLookup = useMemo(
    () => new Map<string, EmployeeAggregation>(aggregations.map((entry) => [entry.employeeId, entry])),
    [aggregations],
  );
  const todayKey = new Date().toISOString().slice(0, 10);
  const selectedEmployee = selectedEmployeeId ? employeeLookup.get(selectedEmployeeId) ?? null : null;
  const selectedRecords = selectedEmployeeId ? recordsByEmployee.get(selectedEmployeeId) ?? [] : [];
  const todaysRecordForSelected =
    selectedRecords.find((record) => record.date === todayKey) ?? null;
  const selectedAggregation = selectedEmployeeId ? aggregationLookup.get(selectedEmployeeId) ?? null : null;
  const statusInfo =
    selectedEmployeeId && employeeStatusMap.has(selectedEmployeeId)
      ? employeeStatusMap.get(selectedEmployeeId)!
      : defaultStatus;
  const employeeSummary = useMemo(
    () =>
      buildEmployeeSummary(
        selectedAggregation,
        selectedRecords,
        todaysRecordForSelected,
        todayKey,
      ),
    [selectedAggregation, selectedRecords, todaysRecordForSelected, todayKey],
  );

  const handleClockIn = () => {
    if (!selectedEmployeeId) {
      return;
    }
    clockIn({ employeeId: selectedEmployeeId, device: DEFAULT_DEVICE, location: DEFAULT_LOCATION });
  };
  const handleClockOut = () => {
    if (!selectedEmployeeId) {
      return;
    }
    clockOut({ employeeId: selectedEmployeeId, device: DEFAULT_DEVICE, location: DEFAULT_LOCATION });
  };
  const handleStartBreak = () => {
    if (!selectedEmployeeId) {
      return;
    }
    startBreak({ employeeId: selectedEmployeeId, device: DEFAULT_DEVICE, location: DEFAULT_LOCATION });
  };
  const handleEndBreak = () => {
    if (!selectedEmployeeId) {
      return;
    }
    endBreak({ employeeId: selectedEmployeeId, device: DEFAULT_DEVICE, location: DEFAULT_LOCATION });
  };

  const openVacation = vacationRequests.filter((entry) => entry.status !== "Genehmigt");
  const openSickLeaves = sickLeaves.filter((entry) => entry.status !== "Best\u00e4tigt");

  const totalWorkedMinutes = computedRecords.reduce(
    (acc, record) => acc + computeLiveAdjustedMinutes(record),
    0,
  );

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground/90">Zeiterfassung &amp; Dienstplan</h1>
        <p className="text-sm text-muted-foreground/80">
          Kompakte Uebersicht ueber aktuelle Arbeitszeiten, Dienste und Abwesenheiten der Praxis.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uebersicht</CardTitle>
          <CardDescription>Live Daten aus der Zeiterfassung und Planung</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Erfasste Stunden (heute)" value={`${formatMinutesAsHours(totalWorkedMinutes)} Std`} />
            <Metric label="Schichten geplant" value={shiftAssignments.length.toString()} />
            <Metric label="Offene Urlaubsantraege" value={openVacation.length.toString()} />
            <Metric label="Offene Krankmeldungen" value={openSickLeaves.length.toString()} />
          </div>
      </CardContent>
    </Card>

      <Card>
        <CardHeader>
          <CardTitle>Arbeitszeitkonten</CardTitle>
          <CardDescription>Teamstatus und direkte Buchungen</CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground/80">Noch keine Teammitglieder hinterlegt.</p>
          ) : (
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="space-y-2 lg:w-72">
                {employees.map((employee) => {
                  const status = employeeStatusMap.get(employee.id) ?? defaultStatus;
                  const isSelected = employee.id === selectedEmployeeId;
                  return (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => setSelectedEmployeeId(employee.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${isSelected ? "border-primary bg-primary/10" : "border-border/50 bg-white/95 hover:border-primary/40"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-foreground/90">{employee.name}</div>
                          <div className="text-xs text-muted-foreground/70">{employee.role}</div>
                        </div>
                        <Badge className={status.tone}>{status.label}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground/70">{status.description}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex-1">
                {selectedEmployee ? (
                  <EmployeeTimeAccountDetails
                    employee={selectedEmployee}
                    status={statusInfo}
                    summary={employeeSummary}
                    todaysRecord={todaysRecordForSelected}
                    onClockIn={handleClockIn}
                    onClockOut={handleClockOut}
                    onStartBreak={handleStartBreak}
                    onEndBreak={handleEndBreak}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 bg-white/80 p-6 text-sm text-muted-foreground/80">
                    Bitte waehlen Sie eine Mitarbeiterin oder einen Mitarbeiter aus der Liste.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      <CalendarBoard
        employees={employees}
        entries={calendarDays}
        onCreate={addCalendarDay}
        onUpdate={updateCalendarDay}
        onDelete={deleteCalendarDay}
      />

      <AbsenceManager
        employees={employees}
        vacationRequests={vacationRequests}
        sickLeaves={sickLeaves}
        onCreateVacation={submitVacationRequest}
        onUpdateVacation={updateVacationRequest}
        onDeleteVacation={deleteVacationRequest}
        onCreateSickLeave={submitSickLeave}
        onUpdateSickLeave={updateSickLeave}
        onDeleteSickLeave={deleteSickLeave}
      />

      <TimesheetSummaryTable
        employees={employees}
        records={computedRecords}
      />

    </div>
  );
}

interface EmployeeSummary {
  todayMinutes: number;
  todayRegularMinutes: number;
  todayOvertimeMinutes: number;
  breakMinutes: number;
  monthMinutes: number;
  monthRegularMinutes: number;
  monthOvertimeMinutes: number;
  yearMinutes: number;
  yearRegularMinutes: number;
  yearOvertimeMinutes: number;
  recentDaily: PeriodTotal[];
}

interface EmployeeTimeAccountDetailsProps {
  employee: EmployeeProfile;
  status: EmployeeStatusInfo;
  summary: EmployeeSummary;
  todaysRecord: ComputedRecord | null;
  onClockIn: () => void;
  onClockOut: () => void;
  onStartBreak: () => void;
  onEndBreak: () => void;
}

function EmployeeTimeAccountDetails({
  employee,
  status,
  summary,
  todaysRecord,
  onClockIn,
  onClockOut,
  onStartBreak,
  onEndBreak,
}: EmployeeTimeAccountDetailsProps) {
  const disableClockIn = status.state === "working" || status.state === "break";
  const disableClockOut = status.state === "idle" || status.state === "off";
  const disableStartBreak = status.state !== "working";
  const disableEndBreak = status.state !== "break";

  const activeSegmentStart = useMemo(() => getActiveSegmentStart(todaysRecord), [todaysRecord]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (!activeSegmentStart) {
      return 0;
    }
    return Math.max(0, Math.floor((Date.now() - activeSegmentStart.getTime()) / 1000));
  });

  useEffect(() => {
    if (!activeSegmentStart || status.state !== "working") {
      setElapsedSeconds(0);
      return;
    }
    const update = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeSegmentStart.getTime()) / 1000)));
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [activeSegmentStart, status.state]);

  const lastAction = status.lastEventTime ? `${describeEvent(status.lastEventType)} - ${status.lastEventTime}` : "Keine Buchung";

  return (
    <div className="space-y-4 rounded-xl border border-border/50 bg-white/95 p-4 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground/60">Mitarbeiter</div>
          <div className="text-lg font-semibold text-foreground/90">{employee.name}</div>
          <div className="text-xs text-muted-foreground/70">
            {employee.role}
            {employee.department ? ` - ${employee.department}` : ""}
          </div>
        </div>
        <Badge className={status.tone}>{status.label}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border/40 bg-white/90 p-4">
          <h3 className="text-sm font-semibold text-foreground/80">Aktueller Status</h3>
          <p className="mt-1 text-xs text-muted-foreground/70">{status.description}</p>
          <dl className="mt-3 space-y-2 text-xs text-muted-foreground/70">
            <div className="flex items-center justify-between">
              <dt>Letzte Aktion</dt>
              <dd>{lastAction}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Pausen heute</dt>
              <dd>{summary.breakMinutes > 0 ? `${formatMinutesAsHours(summary.breakMinutes)} Std` : "0 Min"}</dd>
            </div>
            {todaysRecord ? (
              <div className="flex items-center justify-between">
                <dt>Offene Pause</dt>
                <dd>{todaysRecord.pendingBreakMinutes > 0 ? `${todaysRecord.pendingBreakMinutes} Min` : "Keine"}</dd>
              </div>
            ) : null}
          </dl>
          {status.state === "working" && activeSegmentStart ? (
            <div className="mt-4 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-center shadow-sm">
              <div className="text-[11px] font-medium uppercase tracking-wide text-primary/80">Laufzeit seit Beginn</div>
              <div className="font-mono text-2xl font-semibold text-primary">{formatSecondsAsClock(elapsedSeconds)}</div>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-border/40 bg-white/90 p-4">
          <h3 className="text-sm font-semibold text-foreground/80">Aktionen</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={onClockIn} disabled={disableClockIn}>
              Arbeitsbeginn
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onStartBreak} disabled={disableStartBreak}>
              Pause starten
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onEndBreak} disabled={disableEndBreak}>
              Pause beenden
            </Button>
            <Button type="button" size="sm" tone="secondary" onClick={onClockOut} disabled={disableClockOut}>
              Arbeitsende
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground/70">
            Buchungen werden dem heutigen Tag zugeordnet und koennen spaeter korrigiert werden.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border/40 bg-white/90 p-4">
        <h3 className="text-sm font-semibold text-foreground/80">Heutige Zusammenfassung</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStat label="Gesamtstunden" value={`${formatMinutesAsHours(summary.todayMinutes)} Std`} secondary={`${summary.todayMinutes} Min`} />
          <SummaryStat label="Regelstunden" value={`${formatMinutesAsHours(summary.todayRegularMinutes)} Std`} secondary={`${summary.todayRegularMinutes} Min`} />
          <SummaryStat label="Ueberstunden" value={`${formatMinutesAsHours(summary.todayOvertimeMinutes)} Std`} secondary={`${summary.todayOvertimeMinutes} Min`} />
          <SummaryStat label="Pausen" value={`${summary.breakMinutes} Min`} secondary={`${formatMinutesAsHours(summary.breakMinutes)} Std`} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border/40 bg-white/90 p-4">
          <h3 className="text-sm font-semibold text-foreground/80">Monatswerte</h3>
          <div className="mt-3 space-y-2 text-sm">
            <SummaryLine label="Summe" value={`${formatMinutesAsHours(summary.monthMinutes)} Std`} />
            <SummaryLine label="Regelstunden" value={`${formatMinutesAsHours(summary.monthRegularMinutes)} Std`} />
            <SummaryLine label="Ueberstunden" value={`${formatMinutesAsHours(summary.monthOvertimeMinutes)} Std`} />
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-white/90 p-4">
          <h3 className="text-sm font-semibold text-foreground/80">Jahreswerte</h3>
          <div className="mt-3 space-y-2 text-sm">
            <SummaryLine label="Summe" value={`${formatMinutesAsHours(summary.yearMinutes)} Std`} />
            <SummaryLine label="Regelstunden" value={`${formatMinutesAsHours(summary.yearRegularMinutes)} Std`} />
            <SummaryLine label="Ueberstunden" value={`${formatMinutesAsHours(summary.yearOvertimeMinutes)} Std`} />
          </div>
        </div>
        <div className="rounded-lg border border-border/40 bg-white/90 p-4 lg:col-span-1">
          <h3 className="text-sm font-semibold text-foreground/80">Trend (7 Tage)</h3>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground/70">
            {summary.recentDaily.length === 0 ? (
              <li>Keine Eintraege vorhanden.</li>
            ) : (
              summary.recentDaily.map((entry) => (
                <li key={entry.key} className="flex items-center justify-between">
                  <span className="truncate">{entry.label}</span>
                  <span className="font-medium text-foreground/80">{formatMinutesAsHours(entry.minutes)} Std</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, secondary }: { label: string; value: string; secondary?: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-white/90 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground/60">{label}</div>
      <div className="text-lg font-semibold text-foreground/90">{value}</div>
      {secondary ? <div className="text-xs text-muted-foreground/70">{secondary}</div> : null}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground/70">{label}</span>
      <span className="font-medium text-foreground/80">{value}</span>
    </div>
  );
}

function describeEvent(type?: string) {
  switch (type) {
    case "clock-in":
      return "Einstempeln";
    case "clock-out":
      return "Ausstempeln";
    case "break-start":
      return "Pause gestartet";
    case "break-end":
      return "Pause beendet";
    default:
      return "Aktion";
  }
}

function buildEmployeeSummary(
  aggregation: EmployeeAggregation | null | undefined,
  records: ComputedRecord[],
  todaysRecord: ComputedRecord | null,
  todayKey: string,
): EmployeeSummary {
  const todayMinutes = todaysRecord ? computeLiveAdjustedMinutes(todaysRecord) : 0;
  const breakMinutes = todaysRecord?.recordedBreakMinutes ?? 0;
  const todaySplit = splitRegularAndOvertime(todayMinutes, todaysRecord ? 1 : 0);

  const monthKey = todayKey.slice(0, 7);
  const monthMinutes = aggregation?.monthly.find((entry) => entry.key === monthKey)?.minutes ?? 0;
  const monthDays = records.filter((record) => record.date.startsWith(monthKey)).length;
  const monthSplit = splitRegularAndOvertime(monthMinutes, monthDays);

  const yearPrefix = todayKey.slice(0, 4);
  const yearMinutes = aggregation
    ? aggregation.monthly.reduce((sum, entry) => (entry.key.startsWith(yearPrefix) ? sum + entry.minutes : sum), 0)
    : 0;
  const yearDays = records.filter((record) => record.date.startsWith(yearPrefix)).length;
  const yearSplit = splitRegularAndOvertime(yearMinutes, yearDays);

  const recentDaily = aggregation ? aggregation.daily.slice(-7).reverse() : [];

  return {
    todayMinutes,
    todayRegularMinutes: todaySplit.regularMinutes,
    todayOvertimeMinutes: todaySplit.overtimeMinutes,
    breakMinutes,
    monthMinutes,
    monthRegularMinutes: monthSplit.regularMinutes,
    monthOvertimeMinutes: monthSplit.overtimeMinutes,
    yearMinutes,
    yearRegularMinutes: yearSplit.regularMinutes,
    yearOvertimeMinutes: yearSplit.overtimeMinutes,
    recentDaily,
  };
}

function splitRegularAndOvertime(totalMinutes: number, recordedDays: number) {
  if (recordedDays <= 0) {
    return { regularMinutes: totalMinutes, overtimeMinutes: 0 };
  }
  const baseline = recordedDays * MINUTES_PER_STANDARD_DAY;
  const overtimeMinutes = Math.max(0, totalMinutes - baseline);
  const regularMinutes = totalMinutes - overtimeMinutes;
  return { regularMinutes, overtimeMinutes };
}

function getActiveSegmentStart(record: ComputedRecord | null): Date | null {
  if (!record || record.events.length === 0) {
    return null;
  }
  for (let index = record.events.length - 1; index >= 0; index -= 1) {
    const event = record.events[index];
    if (event.type === "clock-in" || event.type === "break-end") {
      const parsed = new Date(event.timestamp);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (event.type === "clock-out" || event.type === "break-start") {
      break;
    }
  }
  return null;
}

function computeEmployeeStatus(record: ComputedRecord | null): EmployeeStatusInfo {
  if (!record || record.events.length === 0) {
    return {
      state: "idle",
      label: "Keine Buchung",
      description: "Noch keine Zeiterfassung heute.",
      tone: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  const lastEvent = record.events[record.events.length - 1]!;
  const time = formatTime(lastEvent.timestamp, "HH:mm");

  if (lastEvent.type === "clock-in" || lastEvent.type === "break-end") {
    return {
      state: "working",
      label: "Im Dienst",
      description: `Seit ${time} aktiv.`,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      lastEventType: lastEvent.type,
      lastEventTime: time,
    };
  }
  if (lastEvent.type === "break-start") {
    return {
      state: "break",
      label: "Pause",
      description: `Pause seit ${time}.`,
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      lastEventType: lastEvent.type,
      lastEventTime: time,
    };
  }
  return {
    state: "off",
    label: "Ausgestempelt",
    description: `Beendet um ${time}.`,
    tone: "border-slate-200 bg-white text-slate-700",
    lastEventType: lastEvent.type,
    lastEventTime: time,
  };
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-white/95 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground/70">{label}</div>
      <div className="text-xl font-semibold text-foreground/90">{value}</div>
    </div>
  );
}

interface CalendarEditorDraft {
  id?: string;
  label: string;
  type: CalendarDayEntry["type"];
  date: string;
  endDate: string;
  description: string;
  createdBy: string;
}

interface CalendarBoardProps {
  employees: EmployeeProfile[];
  entries: CalendarDayEntry[];
  onCreate: (payload: CalendarDayPayload) => CalendarDayEntry;
  onUpdate: (id: string, changes: Partial<Omit<CalendarDayEntry, "id">>) => void;
  onDelete: (id: string) => void;
}

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const calendarTypeMeta: Record<CalendarDayEntry["type"], { label: string; chip: string; dot: string; dayTone: string }> = {
  "public-holiday": {
    label: "Feiertag",
    chip: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
    dayTone: "border-indigo-200 bg-indigo-50",
  },
  "company-holiday": {
    label: "Praxisurlaub",
    chip: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
    dayTone: "border-sky-200 bg-sky-50",
  },
  "bonus-holiday": {
    label: "Bonus",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    dayTone: "border-emerald-200 bg-emerald-50",
  },
  vacation: {
    label: "Urlaub",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    dayTone: "border-amber-200 bg-amber-50",
  },
};

function CalendarBoard({ employees, entries, onCreate, onUpdate, onDelete }: CalendarBoardProps) {
  const [focusMonth, setFocusMonth] = useState(() => startOfMonth(new Date()));

  const defaultDateForDraft = useMemo(() => formatDateFns(focusMonth, "yyyy-MM-dd"), [focusMonth]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.date === b.date) {
        return a.label.localeCompare(b.label, "de");
      }
      return a.date.localeCompare(b.date);
    });
  }, [entries]);

  const eventById = useMemo(() => new Map(sortedEntries.map((entry) => [entry.id, entry])), [sortedEntries]);

  const [selectedKey, setSelectedKey] = useState<string>(() => {
    const first = sortedEntries[0];
    return first ? first.id : `new:${defaultDateForDraft}`;
  });

  const [draft, setDraft] = useState<CalendarEditorDraft>(() => buildDraft(sortedEntries[0] ?? null, defaultDateForDraft));

  useEffect(() => {
    const first = sortedEntries[0];
    if (selectedKey.startsWith("new:")) {
      const explicitDate = selectedKey.slice(4) || defaultDateForDraft;
      setDraft(buildDraft(null, explicitDate));
      return;
    }
    const selected = eventById.get(selectedKey);
    if (selected) {
      setDraft((prev) => (prev.id === selected.id ? prev : buildDraft(selected, defaultDateForDraft)));
      return;
    }
    if (first) {
      setSelectedKey(first.id);
      setDraft(buildDraft(first, defaultDateForDraft));
    } else {
      setSelectedKey(`new:${defaultDateForDraft}`);
      setDraft(buildDraft(null, defaultDateForDraft));
    }
  }, [selectedKey, sortedEntries, eventById, defaultDateForDraft]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarDayEntry[]>();
    for (const entry of entries) {
      const start = safeParseDate(entry.date);
      const end = safeParseDate(entry.endDate ?? entry.date);
      if (!start || !end) {
        continue;
      }
      for (const day of eachDayOfInterval({ start, end })) {
        const key = formatDateFns(day, "yyyy-MM-dd");
        const bucket = map.get(key);
        if (bucket) {
          bucket.push(entry);
        } else {
          map.set(key, [entry]);
        }
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.label.localeCompare(b.label, "de"));
    }
    return map;
  }, [entries]);

  const monthSequence = useMemo(() => [focusMonth, addMonths(focusMonth, 1), addMonths(focusMonth, 2)], [focusMonth]);

  const monthGrids = useMemo(() => monthSequence.map((month) => ({ month, weeks: chunkIntoWeeks(buildMonthDays(month)) })), [monthSequence]);

  const selectedRangeStart = safeParseDate(draft.date);
  const selectedRangeEnd = safeParseDate(draft.endDate || draft.date);

  const handleShiftMonth = (direction: "prev" | "next") => {
    setFocusMonth((current) => (direction === "prev" ? subMonths(current, 1) : addMonths(current, 1)));
  };

  const handleSelectEvent = (id: string) => {
    setSelectedKey(id);
  };

  const handleCreateAtDate = (isoDate: string) => {
    setSelectedKey(`new:${isoDate}`);
    setDraft(buildDraft(null, isoDate));
  };

  const handleDraftChange = (field: keyof CalendarEditorDraft, value: string) => {
    setDraft((prev) => {
      if (field === "date") {
        const normalized = value;
        const nextEnd = prev.endDate < normalized ? normalized : prev.endDate;
        return { ...prev, date: normalized, endDate: nextEnd };
      }
      if (field === "endDate") {
        return { ...prev, endDate: value || prev.date };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedLabel = draft.label.trim();
    if (!trimmedLabel) {
      return;
    }
    const payload = {
      label: trimmedLabel,
      type: draft.type,
      date: draft.date,
      endDate: draft.endDate || draft.date,
      description: draft.description.trim() ? draft.description.trim() : undefined,
      createdBy: draft.createdBy.trim() ? draft.createdBy.trim() : undefined,
    };
    if (draft.id) {
      onUpdate(draft.id, payload);
    } else {
      const created = onCreate({
        ...payload,
        createdAt: new Date().toISOString(),
      });
      setSelectedKey(created.id);
    }
  };

  const handleDelete = () => {
    if (!draft.id) {
      return;
    }
    onDelete(draft.id);
    setSelectedKey(`new:${draft.date}`);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Kalender</CardTitle>
          <CardDescription>Abwesenheiten und Ereignisse im Dreimonatsueberblick</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => handleShiftMonth("prev")}>
            Zurueck
          </Button>
          <div className="rounded-md border border-border/60 bg-white px-3 py-1 text-sm font-medium text-foreground/80">
            {formatDate(monthSequence[0], "LLLL yyyy")}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => handleShiftMonth("next")}>
            Weiter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {monthGrids.map((view) => (
                <div key={view.month.toISOString()} className="rounded-xl border border-border/50 bg-white/95 shadow-sm">
                  <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-foreground/80">
                    <span>{formatDate(view.month, "LLLL yyyy")}</span>
                    <span className="text-xs text-muted-foreground/70">{formatDate(view.month, "MMM yy")}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
                    {WEEKDAY_LABELS.map((label) => (
                      <span key={label} className="text-center">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 px-2 pb-3">
                    {view.weeks.flat().map((day) => {
                      const iso = formatDateFns(day, "yyyy-MM-dd");
                      const dayEvents = eventsByDay.get(iso) ?? [];
                      const meta = dayEvents.length ? calendarTypeMeta[dayEvents[0].type] : null;
                      const isCurrentMonth = isSameMonth(day, view.month);
                      const isSelectedRange =
                        selectedRangeStart &&
                        selectedRangeEnd &&
                        selectedRangeStart.getTime() <= day.getTime() &&
                        selectedRangeEnd.getTime() >= day.getTime();
                      const baseTone = isSelectedRange
                        ? "border-primary bg-primary/10"
                        : meta
                        ? meta.dayTone
                        : isCurrentMonth
                        ? "border-border/50 bg-white"
                        : "border-transparent bg-muted/30 text-muted-foreground/50";
                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => handleCreateAtDate(iso)}
                          className={`flex h-24 flex-col justify-between rounded-lg border px-2 py-1 text-left text-xs shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${baseTone}`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span>{day.getDate()}</span>
                            {meta ? <span className={`h-2 w-2 rounded-full ${meta.dot}`} /> : null}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map((entry) => (
                              <div
                                key={entry.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleSelectEvent(entry.id);
                                }}
                                className={`w-full cursor-pointer select-none truncate rounded px-1 py-0.5 text-[11px] font-medium ${calendarTypeMeta[entry.type].chip}`}
                              >
                                {entry.label}
                              </div>
                            ))}
                            {dayEvents.length > 2 ? (
                              <div className="text-[10px] text-muted-foreground/70">+{dayEvents.length - 2} weitere</div>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-white/95 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground/80">Kalendereintrag</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedKey(`new:${defaultDateForDraft}`)}>
                  Neuer Eintrag
                </Button>
              </div>
              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground/70" htmlFor="calendar-label">
                    Bezeichnung
                  </label>
                  <Input id="calendar-label" value={draft.label} onChange={(event) => handleDraftChange("label", event.target.value)} required />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground/70" htmlFor="calendar-start">
                      Beginn
                    </label>
                    <Input id="calendar-start" type="date" value={draft.date} onChange={(event) => handleDraftChange("date", event.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground/70" htmlFor="calendar-end">
                      Ende
                    </label>
                    <Input id="calendar-end" type="date" value={draft.endDate} min={draft.date} onChange={(event) => handleDraftChange("endDate", event.target.value)} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground/70" htmlFor="calendar-type">
                      Typ
                    </label>
                    <select
                      id="calendar-type"
                      value={draft.type}
                      onChange={(event) => handleDraftChange("type", event.target.value)}
                      className="w-full rounded-md border border-border/60 bg-white px-2 py-2 text-sm text-foreground/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {Object.entries(calendarTypeMeta).map(([type, meta]) => (
                        <option key={type} value={type}>
                          {meta.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground/70" htmlFor="calendar-owner">
                      Angelegt von
                    </label>
                    <Input
                      id="calendar-owner"
                      value={draft.createdBy}
                      onChange={(event) => handleDraftChange("createdBy", event.target.value)}
                      list="calendar-owner-options"
                      placeholder="Name optional"
                    />
                    <datalist id="calendar-owner-options">
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground/70" htmlFor="calendar-notes">
                    Beschreibung
                  </label>
                  <Textarea id="calendar-notes" value={draft.description} onChange={(event) => handleDraftChange("description", event.target.value)} rows={3} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button type="submit" size="sm">
                    {draft.id ? "Speichern" : "Anlegen"}
                  </Button>
                  {draft.id ? (
                    <Button type="button" size="sm" tone="secondary" variant="outline" onClick={handleDelete}>
                      Entfernen
                    </Button>
                  ) : null}
                </div>
              </form>
            </div>
            <div className="rounded-xl border border-border/50 bg-white/95 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground/80">Eintraege</h3>
              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                {sortedEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground/70">Noch keine Kalendereintraege vorhanden.</p>
                ) : (
                  sortedEntries.map((entry) => {
                    const meta = calendarTypeMeta[entry.type];
                    const dateLabel = entry.endDate && entry.endDate !== entry.date ? formatDateRange(entry.date, entry.endDate) : formatDate(entry.date);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => handleSelectEvent(entry.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${selectedKey === entry.id ? "border-primary bg-primary/10" : "border-border/50 bg-white hover:border-primary/40"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground/90">{entry.label}</span>
                          <Badge className={meta.chip}>{meta.label}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground/70">{dateLabel}</div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/70">
          <span className="font-semibold text-foreground/80">Legende</span>
          {Object.entries(calendarTypeMeta).map(([type, meta]) => (
            <span key={type} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              <span>{meta.label}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function buildDraft(entry: CalendarDayEntry | null, fallbackDate: string): CalendarEditorDraft {
  if (entry) {
    return {
      id: entry.id,
      label: entry.label,
      type: entry.type,
      date: entry.date,
      endDate: entry.endDate ?? entry.date,
      description: entry.description ?? "",
      createdBy: entry.createdBy ?? "",
    };
  }
  const base = fallbackDate || new Date().toISOString().slice(0, 10);
  return {
    label: "",
    type: "company-holiday",
    date: base,
    endDate: base,
    description: "",
    createdBy: "",
  };
}

function safeParseDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildMonthDays(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = addDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}

function chunkIntoWeeks(days: Date[]) {
  const weeks: Date[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

interface AbsenceManagerProps {
  employees: EmployeeProfile[];
  vacationRequests: VacationRequest[];
  sickLeaves: SickLeave[];
  onCreateVacation: (payload: {
    employeeId: string;
    from: string;
    to: string;
    status?: VacationRequest["status"];
    comment?: string;
  }) => VacationRequest;
  onUpdateVacation: (id: string, changes: Partial<Omit<VacationRequest, "id">>) => void;
  onDeleteVacation: (id: string) => void;
  onCreateSickLeave: (payload: {
    employeeId: string;
    from: string;
    to: string;
    status?: SickLeave["status"];
    documentUrl?: string;
  }) => SickLeave;
  onUpdateSickLeave: (id: string, changes: Partial<Omit<SickLeave, "id">>) => void;
  onDeleteSickLeave: (id: string) => void;
}

interface VacationDraft {
  id?: string;
  employeeId: string;
  from: string;
  to: string;
  status: VacationRequest["status"];
  comment: string;
}

interface SickLeaveDraft {
  id?: string;
  employeeId: string;
  from: string;
  to: string;
  status: SickLeave["status"];
  documentUrl: string;
}

const vacationStatusOptions: VacationRequest["status"][] = ["Neu", "In Pr\u00fcfung", "Genehmigt", "Abgelehnt"];
const sickStatusOptions: SickLeave["status"][] = ["Gemeldet", "Dokument offen", "Best\u00e4tigt"];

const vacationStatusTone: Record<VacationRequest["status"], string> = {
  Neu: "border-slate-200 bg-slate-50 text-slate-700",
  "In Pr\u00fcfung": "border-amber-200 bg-amber-50 text-amber-700",
  Genehmigt: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Abgelehnt: "border-rose-200 bg-rose-50 text-rose-700",
};

const sickStatusTone: Record<SickLeave["status"], string> = {
  Gemeldet: "border-slate-200 bg-slate-50 text-slate-700",
  "Dokument offen": "border-amber-200 bg-amber-50 text-amber-700",
  "Best\u00e4tigt": "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function AbsenceManager({
  employees,
  vacationRequests,
  sickLeaves,
  onCreateVacation,
  onUpdateVacation,
  onDeleteVacation,
  onCreateSickLeave,
  onUpdateSickLeave,
  onDeleteSickLeave,
}: AbsenceManagerProps) {
  const employeeOptions = useMemo(
    () => employees.map((employee) => ({ id: employee.id, name: employee.name })),
    [employees],
  );
  const fallbackEmployeeId = employeeOptions[0]?.id ?? "";
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const sortedVacations = useMemo(
    () => [...vacationRequests].sort((a, b) => b.from.localeCompare(a.from) || a.employeeId.localeCompare(b.employeeId)),
    [vacationRequests],
  );
  const sortedSickLeaves = useMemo(
    () => [...sickLeaves].sort((a, b) => b.from.localeCompare(a.from) || a.employeeId.localeCompare(b.employeeId)),
    [sickLeaves],
  );

  const [vacationSelection, setVacationSelection] = useState<string>(() => sortedVacations[0]?.id ?? "new");
  const [vacationDraft, setVacationDraft] = useState<VacationDraft>(() =>
    buildVacationDraft(sortedVacations[0] ?? null, fallbackEmployeeId, today),
  );

  useEffect(() => {
    const first = sortedVacations[0];
    if (vacationSelection === "new") {
      setVacationDraft((previous) => buildVacationDraft(null, fallbackEmployeeId, today, previous));
      return;
    }
    const selected = sortedVacations.find((entry) => entry.id === vacationSelection);
    if (selected) {
      setVacationDraft((previous) =>
        previous.id === selected.id ? previous : buildVacationDraft(selected, fallbackEmployeeId, today, previous),
      );
      return;
    }
    if (first) {
      setVacationSelection(first.id);
      setVacationDraft(buildVacationDraft(first, fallbackEmployeeId, today));
    } else {
      setVacationSelection("new");
      setVacationDraft(buildVacationDraft(null, fallbackEmployeeId, today));
    }
  }, [vacationSelection, sortedVacations, fallbackEmployeeId, today]);

  const [sickSelection, setSickSelection] = useState<string>(() => sortedSickLeaves[0]?.id ?? "new");
  const [sickDraft, setSickDraft] = useState<SickLeaveDraft>(() =>
    buildSickDraft(sortedSickLeaves[0] ?? null, fallbackEmployeeId, today),
  );

  useEffect(() => {
    const first = sortedSickLeaves[0];
    if (sickSelection === "new") {
      setSickDraft((previous) => buildSickDraft(null, fallbackEmployeeId, today, previous));
      return;
    }
    const selected = sortedSickLeaves.find((entry) => entry.id === sickSelection);
    if (selected) {
      setSickDraft((previous) =>
        previous.id === selected.id ? previous : buildSickDraft(selected, fallbackEmployeeId, today, previous),
      );
      return;
    }
    if (first) {
      setSickSelection(first.id);
      setSickDraft(buildSickDraft(first, fallbackEmployeeId, today));
    } else {
      setSickSelection("new");
      setSickDraft(buildSickDraft(null, fallbackEmployeeId, today));
    }
  }, [sickSelection, sortedSickLeaves, fallbackEmployeeId, today]);

  const handleVacationChange = (field: keyof VacationDraft, value: string) => {
    setVacationDraft((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "from" && previous.to < value ? { to: value } : null),
    }));
  };

  const handleVacationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vacationDraft.employeeId) {
      return;
    }
    const payload = {
      employeeId: vacationDraft.employeeId,
      from: vacationDraft.from,
      to: vacationDraft.to,
      status: vacationDraft.status,
      comment: vacationDraft.comment.trim() ? vacationDraft.comment.trim() : undefined,
    };
    if (vacationDraft.id) {
      onUpdateVacation(vacationDraft.id, payload);
    } else {
      const created = onCreateVacation(payload);
      setVacationSelection(created.id);
    }
  };

  const handleVacationDelete = () => {
    if (!vacationDraft.id) {
      return;
    }
    onDeleteVacation(vacationDraft.id);
    setVacationSelection("new");
  };

  const handleSickChange = (field: keyof SickLeaveDraft, value: string) => {
    setSickDraft((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "from" && previous.to < value ? { to: value } : null),
    }));
  };

  const handleSickSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sickDraft.employeeId) {
      return;
    }
    const payload = {
      employeeId: sickDraft.employeeId,
      from: sickDraft.from,
      to: sickDraft.to,
      status: sickDraft.status,
      documentUrl: sickDraft.documentUrl.trim() ? sickDraft.documentUrl.trim() : undefined,
    };
    if (sickDraft.id) {
      onUpdateSickLeave(sickDraft.id, payload);
    } else {
      const created = onCreateSickLeave(payload);
      setSickSelection(created.id);
    }
  };

  const handleSickDelete = () => {
    if (!sickDraft.id) {
      return;
    }
    onDeleteSickLeave(sickDraft.id);
    setSickSelection("new");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abwesenheiten</CardTitle>
        <CardDescription>Urlaube und Krankmeldungen verwalten, anlegen und aktualisieren</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3 rounded-xl border border-border/50 bg-white/95 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground/80">Urlaubsantraege</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => setVacationSelection("new")}>
              Neuer Antrag
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.3fr,1fr]">
            <div className="space-y-2">
              {sortedVacations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground/70">
                  Aktuell liegen keine Urlaubsantraege vor.
                </div>
              ) : (
                sortedVacations.map((entry) => {
                  const isActive = vacationSelection === entry.id;
                  const employeeName =
                    employeeOptions.find((option) => option.id === entry.employeeId)?.name ?? entry.employeeId;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setVacationSelection(entry.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                        isActive ? "border-primary bg-primary/10 shadow-sm" : "border-border/50 bg-white hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground/90">{employeeName}</span>
                        <Badge className={vacationStatusTone[entry.status]}>{entry.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground/70">{formatDateRange(entry.from, entry.to)}</div>
                      {entry.comment ? (
                        <div className="mt-1 text-xs text-muted-foreground/70">{entry.comment}</div>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
            <form className="space-y-3 rounded-lg border border-border/40 bg-white/90 p-4" onSubmit={handleVacationSubmit}>
              <h4 className="text-sm font-semibold text-foreground/80">
                {vacationDraft.id ? "Antrag bearbeiten" : "Antrag anlegen"}
              </h4>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70" htmlFor="vacation-employee">
                  Mitarbeiter
                </label>
                <select
                  id="vacation-employee"
                  value={vacationDraft.employeeId}
                  onChange={(event) => handleVacationChange("employeeId", event.target.value)}
                  className="w-full rounded-md border border-border/60 bg-white px-2 py-2 text-sm text-foreground/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={employeeOptions.length === 0}
                  required
                >
                  <option value="">Bitte waehlen</option>
                  {employeeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground/70" htmlFor="vacation-from">
                    Von
                  </label>
                  <Input
                    id="vacation-from"
                    type="date"
                    value={vacationDraft.from}
                    onChange={(event) => handleVacationChange("from", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground/70" htmlFor="vacation-to">
                    Bis
                  </label>
                  <Input
                    id="vacation-to"
                    type="date"
                    value={vacationDraft.to}
                    min={vacationDraft.from}
                    onChange={(event) => handleVacationChange("to", event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70" htmlFor="vacation-status">
                  Status
                </label>
                <select
                  id="vacation-status"
                  value={vacationDraft.status}
                  onChange={(event) => handleVacationChange("status", event.target.value)}
                  className="w-full rounded-md border border-border/60 bg-white px-2 py-2 text-sm text-foreground/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {vacationStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70" htmlFor="vacation-comment">
                  Kommentar
                </label>
                <Textarea
                  id="vacation-comment"
                  value={vacationDraft.comment}
                  onChange={(event) => handleVacationChange("comment", event.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button type="submit" size="sm">
                  {vacationDraft.id ? "Speichern" : "Anlegen"}
                </Button>
                {vacationDraft.id ? (
                  <Button type="button" size="sm" tone="secondary" variant="outline" onClick={handleVacationDelete}>
                    Entfernen
                  </Button>
                ) : null}
              </div>
            </form>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border/50 bg-white/95 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground/80">Krankmeldungen</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => setSickSelection("new")}>
              Neue Meldung
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.3fr,1fr]">
            <div className="space-y-2">
              {sortedSickLeaves.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground/70">
                  Keine aktuellen Krankmeldungen vorhanden.
                </div>
              ) : (
                sortedSickLeaves.map((entry) => {
                  const isActive = sickSelection === entry.id;
                  const employeeName =
                    employeeOptions.find((option) => option.id === entry.employeeId)?.name ?? entry.employeeId;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSickSelection(entry.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                        isActive ? "border-primary bg-primary/10 shadow-sm" : "border-border/50 bg-white hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground/90">{employeeName}</span>
                        <Badge className={sickStatusTone[entry.status]}>{entry.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground/70">{formatDateRange(entry.from, entry.to)}</div>
                      {entry.documentUrl ? (
                        <div className="mt-1 text-xs text-muted-foreground/70">Dokument: {entry.documentUrl}</div>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
            <form className="space-y-3 rounded-lg border border-border/40 bg-white/90 p-4" onSubmit={handleSickSubmit}>
              <h4 className="text-sm font-semibold text-foreground/80">
                {sickDraft.id ? "Meldung bearbeiten" : "Meldung anlegen"}
              </h4>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70" htmlFor="sick-employee">
                  Mitarbeiter
                </label>
                <select
                  id="sick-employee"
                  value={sickDraft.employeeId}
                  onChange={(event) => handleSickChange("employeeId", event.target.value)}
                  className="w-full rounded-md border border-border/60 bg-white px-2 py-2 text-sm text-foreground/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={employeeOptions.length === 0}
                  required
                >
                  <option value="">Bitte waehlen</option>
                  {employeeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground/70" htmlFor="sick-from">
                    Von
                  </label>
                  <Input
                    id="sick-from"
                    type="date"
                    value={sickDraft.from}
                    onChange={(event) => handleSickChange("from", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground/70" htmlFor="sick-to">
                    Bis
                  </label>
                  <Input
                    id="sick-to"
                    type="date"
                    value={sickDraft.to}
                    min={sickDraft.from}
                    onChange={(event) => handleSickChange("to", event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70" htmlFor="sick-status">
                  Status
                </label>
                <select
                  id="sick-status"
                  value={sickDraft.status}
                  onChange={(event) => handleSickChange("status", event.target.value)}
                  className="w-full rounded-md border border-border/60 bg-white px-2 py-2 text-sm text-foreground/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {sickStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70" htmlFor="sick-document">
                  Dokument
                </label>
                <Input
                  id="sick-document"
                  value={sickDraft.documentUrl}
                  onChange={(event) => handleSickChange("documentUrl", event.target.value)}
                  placeholder="Link oder Notiz"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button type="submit" size="sm">
                  {sickDraft.id ? "Speichern" : "Anlegen"}
                </Button>
                {sickDraft.id ? (
                  <Button type="button" size="sm" tone="secondary" variant="outline" onClick={handleSickDelete}>
                    Entfernen
                  </Button>
                ) : null}
              </div>
            </form>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function buildVacationDraft(
  entry: VacationRequest | null,
  fallbackEmployeeId: string,
  fallbackDate: string,
  previous?: VacationDraft,
): VacationDraft {
  if (entry) {
    return {
      id: entry.id,
      employeeId: entry.employeeId,
      from: entry.from,
      to: entry.to,
      status: entry.status,
      comment: entry.comment ?? "",
    };
  }
  return {
    employeeId: previous?.employeeId ?? fallbackEmployeeId,
    from: previous?.from ?? fallbackDate,
    to: previous?.to ?? fallbackDate,
    status: previous?.status ?? "Neu",
    comment: previous?.comment ?? "",
  };
}

function buildSickDraft(
  entry: SickLeave | null,
  fallbackEmployeeId: string,
  fallbackDate: string,
  previous?: SickLeaveDraft,
): SickLeaveDraft {
  if (entry) {
    return {
      id: entry.id,
      employeeId: entry.employeeId,
      from: entry.from,
      to: entry.to,
      status: entry.status,
      documentUrl: entry.documentUrl ?? "",
    };
  }
  return {
    employeeId: previous?.employeeId ?? fallbackEmployeeId,
    from: previous?.from ?? fallbackDate,
    to: previous?.to ?? fallbackDate,
    status: previous?.status ?? "Gemeldet",
    documentUrl: previous?.documentUrl ?? "",
  };
}

interface TimesheetSummaryTableProps {
  employees: EmployeeProfile[];
  records: ComputedRecord[];
}

interface TimesheetRow {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  clockIn: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  clockOut: string | null;
  totalMinutes: number;
  pauseMinutes: number;
  eventCount: number;
}

function TimesheetSummaryTable({ employees, records }: TimesheetSummaryTableProps) {
  const employeeLookup = useMemo(
    () => new Map<string, string>(employees.map((employee) => [employee.id, employee.name])),
    [employees],
  );
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => {
        if (employeeFilter !== "all" && record.employeeId !== employeeFilter) {
          return false;
        }
        if (fromDate && record.date < fromDate) {
          return false;
        }
        if (toDate && record.date > toDate) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || a.employeeId.localeCompare(b.employeeId));
  }, [records, employeeFilter, fromDate, toDate]);

  const rows = useMemo<TimesheetRow[]>(() => {
    return filteredRecords.map((record) => {
      const events = record.events;
      const firstClockIn = events.find((event) => event.type === "clock-in")?.timestamp ?? null;
      const firstBreakStart = events.find((event) => event.type === "break-start")?.timestamp ?? null;
      const firstBreakEnd = events.find((event) => event.type === "break-end")?.timestamp ?? null;
      const lastClockOut =
        [...events]
          .reverse()
          .find((event) => event.type === "clock-out")
          ?.timestamp ?? null;

      return {
        id: record.id,
        date: record.date,
        employeeId: record.employeeId,
        employeeName: employeeLookup.get(record.employeeId) ?? record.employeeId,
        clockIn: firstClockIn,
        breakStart: firstBreakStart,
        breakEnd: firstBreakEnd,
        clockOut: lastClockOut,
        totalMinutes: computeLiveAdjustedMinutes(record),
        pauseMinutes: record.recordedBreakMinutes,
        eventCount: events.length,
      };
    });
  }, [filteredRecords, employeeLookup]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.totalMinutes += row.totalMinutes;
          acc.pauseMinutes += row.pauseMinutes;
          return acc;
        },
        { totalMinutes: 0, pauseMinutes: 0 },
      ),
    [rows],
  );

  const formatEventTime = (value: string | null) => (value ? formatTime(value) : "-");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zeiterfassung</CardTitle>
        <CardDescription>Tagesbezogene Zeiterfassungsdaten mit Filter nach Mitarbeitenden und Zeitraum</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground/70" htmlFor="timesheet-employee">
              Mitarbeiter
            </label>
            <select
              id="timesheet-employee"
              value={employeeFilter}
              onChange={(event) => setEmployeeFilter(event.target.value)}
              className="h-9 rounded-md border border-border/60 bg-white px-2 text-sm text-foreground/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">Alle Mitarbeitenden</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground/70" htmlFor="timesheet-from">
              Von
            </label>
            <Input id="timesheet-from" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground/70" htmlFor="timesheet-to">
              Bis
            </label>
            <Input id="timesheet-to" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              setEmployeeFilter("all");
              setFromDate("");
              setToDate("");
            }}
          >
            Filter zuruecksetzen
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground/70">
                <th className="px-3 py-2 text-left">Datum</th>
                <th className="px-3 py-2 text-left">Mitarbeiter</th>
                <th className="px-3 py-2 text-left">Arbeitsbeginn</th>
                <th className="px-3 py-2 text-left">Pause starten</th>
                <th className="px-3 py-2 text-left">Pause beenden</th>
                <th className="px-3 py-2 text-left">Arbeitsende</th>
                <th className="px-3 py-2 text-left">Gesamt</th>
                <th className="px-3 py-2 text-left">Pause</th>
                <th className="px-3 py-2 text-left">Buchungen</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-sm text-muted-foreground/70">
                    Keine Eintraege fuer die gewaehlten Filter vorhanden.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 text-sm">
                    <td className="px-3 py-2 align-top">
                      <div className="font-semibold text-foreground/85">{formatDate(row.date)}</div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-foreground/85">{row.employeeName}</div>
                      <div className="text-xs text-muted-foreground/70">{row.employeeId}</div>
                    </td>
                    <td className="px-3 py-2 align-top">{formatEventTime(row.clockIn)}</td>
                    <td className="px-3 py-2 align-top">{formatEventTime(row.breakStart)}</td>
                    <td className="px-3 py-2 align-top">{formatEventTime(row.breakEnd)}</td>
                    <td className="px-3 py-2 align-top">{formatEventTime(row.clockOut)}</td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-foreground/85">{formatMinutesAsClock(row.totalMinutes)}</div>
                      <div className="text-xs text-muted-foreground/70">{formatMinutesAsHours(row.totalMinutes)} Std</div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-foreground/85">{formatMinutesAsClock(row.pauseMinutes)}</div>
                      <div className="text-xs text-muted-foreground/70">{row.pauseMinutes} Min</div>
                    </td>
                    <td className="px-3 py-2 align-top text-center">{row.eventCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground/80">
          <div>
            {rows.length} {rows.length === 1 ? "Eintrag" : "Eintraege"} angezeigt
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Summe Arbeitszeit:{" "}
              <span className="font-semibold text-foreground/85">
                {formatMinutesAsClock(totals.totalMinutes)} ({formatMinutesAsHours(totals.totalMinutes)} Std)
              </span>
            </span>
            <span>
              Summe Pausen:{" "}
              <span className="font-semibold text-foreground/85">{formatMinutesAsClock(totals.pauseMinutes)}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatMinutesAsClock(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  const hrs = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const mins = Math.abs(safe % 60)
    .toString()
    .padStart(2, "0");
  return `${hrs}:${mins}`;
}

function formatSecondsAsClock(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const hrs = Math.floor(safe / 3600)
    .toString()
    .padStart(2, "0");
  const mins = Math.floor((safe % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.abs(safe % 60)
    .toString()
    .padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

export default TimeTrackingPage;









