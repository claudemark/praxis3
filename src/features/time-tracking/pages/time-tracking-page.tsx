import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  ShiftAssignment,
} from "@/data/time-tracking";
import { formatDate, formatDateTime, formatTime } from "@/lib/datetime";

const STATUS_PLANNED: ShiftAssignment["status"] = "geplant";
const STATUS_CONFIRMED: ShiftAssignment["status"] = "best\u00e4tigt";
const STATUS_OPEN: ShiftAssignment["status"] = "offen";

const shiftStatusTone: Record<ShiftAssignment["status"], string> = {
  [STATUS_PLANNED]: "border-amber-200 bg-amber-50 text-amber-700",
  [STATUS_CONFIRMED]: "border-emerald-200 bg-emerald-50 text-emerald-700",
  [STATUS_OPEN]: "border-slate-200 bg-white text-slate-700",
};

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
  const updateShiftStatus = useTimeTrackingStore((state) => state.updateShiftStatus);
  const addCalendarDay = useTimeTrackingStore((state) => state.addCalendarDay);
  const updateCalendarDay = useTimeTrackingStore((state) => state.updateCalendarDay);
  const deleteCalendarDay = useTimeTrackingStore((state) => state.deleteCalendarDay);
  const clockIn = useTimeTrackingStore((state) => state.clockIn);
  const clockOut = useTimeTrackingStore((state) => state.clockOut);
  const startBreak = useTimeTrackingStore((state) => state.startBreak);
  const endBreak = useTimeTrackingStore((state) => state.endBreak);

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
  const todaysRecords = useMemo(
    () => computedRecords.slice(0, 5),
    [computedRecords],
  );
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

  const shiftBuckets = useMemo(
    () => ({
      geplant: shiftAssignments.filter((entry) => entry.status === STATUS_PLANNED),
      bestaetigt: shiftAssignments.filter((entry) => entry.status === STATUS_CONFIRMED),
      offen: shiftAssignments.filter((entry) => entry.status === STATUS_OPEN),
    }),
    [shiftAssignments],
  );

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schichtplanung</CardTitle>
            <CardDescription>Status nach aktuellem Plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {([
              ["Geplant", shiftBuckets.geplant],
              ["Bestaetigt", shiftBuckets.bestaetigt],
              ["Offen", shiftBuckets.offen],
            ] as const).map(([label, list]) => (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground/80">
                  <span className="font-medium text-foreground/80">{label}</span>
                  <span>{list.length} Eintraege</span>
                </div>
                <div className="space-y-2">
                  {list.length === 0 ? (
                    <p className="text-xs text-muted-foreground/70">Keine Eintraege</p>
                  ) : (
                    list.map((assignment) => {
                      const profile = employeeLookup.get(assignment.employeeId);
                      return (
                        <div
                          key={assignment.id}
                          className="rounded-xl border border-border/40 bg-white/95 p-3 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <div>
                              <div className="font-semibold text-foreground/90">{profile?.name ?? assignment.employeeId}</div>
                              <div className="text-xs text-muted-foreground/70">
                                {formatTime(assignment.start)} - {formatTime(assignment.end)} • {assignment.station}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={shiftStatusTone[assignment.status]}>{assignment.status}</Badge>
                              {assignment.status !== STATUS_CONFIRMED ? (
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  onClick={() => updateShiftStatus(assignment.id, STATUS_CONFIRMED)}
                                >
                                  Bestaetigen
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arbeitszeiten heute</CardTitle>
            <CardDescription>Letzte Buchungen und Pausen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground/80">Noch keine Zeiterfassung gespeichert.</p>
            ) : (
              todaysRecords.map((record) => {
                const profile = employeeLookup.get(record.employeeId);
                const firstEvent = record.events[0];
                const lastEvent = record.events[record.events.length - 1];
                return (
                  <div
                    key={record.id}
                    className="rounded-xl border border-border/40 bg-white/95 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div>
                        <div className="font-semibold text-foreground/90">{profile?.name ?? record.employeeId}</div>
                        <div className="text-xs text-muted-foreground/70">
                          {formatDate(record.date)} • {record.events.length} Buchungen
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground/70">
                        <div>Start: {firstEvent ? formatTime(firstEvent.timestamp) : "-"}</div>
                        <div>Letzte Buchung: {lastEvent ? formatTime(lastEvent.timestamp) : "-"}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold text-foreground/90">
                        {formatMinutesAsHours(record.workedMinutes)} Std gearbeitet
                      </span>
                      <span className="text-xs text-muted-foreground/70">
                        Pausen: {record.recordedBreakMinutes} Min
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Abwesenheiten</CardTitle>
            <CardDescription>Urlaub und Krankmeldungen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {openVacation.length === 0 && openSickLeaves.length === 0 ? (
              <p className="text-sm text-muted-foreground/80">Aktuell liegen keine offenen Abwesenheiten vor.</p>
            ) : null}
            {openVacation.map((request) => {
              const profile = employeeLookup.get(request.employeeId);
              return (
                <div key={request.id} className="rounded-lg border border-border/40 bg-white px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground/90">{profile?.name ?? request.employeeId}</span>
                    <Badge variant="outline">Urlaub: {request.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground/70">
                    {formatDate(request.from)} - {formatDate(request.to)}
                  </div>
                  {request.comment ? (
                    <div className="mt-1 text-xs text-muted-foreground/80">{request.comment}</div>
                  ) : null}
                </div>
              );
            })}
            {openSickLeaves.map((entry) => {
              const profile = employeeLookup.get(entry.employeeId);
              return (
                <div key={entry.id} className="rounded-lg border border-border/40 bg-white px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground/90">{profile?.name ?? entry.employeeId}</span>
                    <Badge variant="outline">Krank: {entry.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground/70">
                    {formatDate(entry.from)} - {formatDate(entry.to)}
                  </div>
                  {entry.documentUrl ? (
                    <div className="mt-1 text-xs text-muted-foreground/80">Attest liegt vor</div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <HolidayCalendarPanel
          employees={employees}
          entries={calendarDays}
          onCreate={(payload) => addCalendarDay(payload)}
          onUpdate={updateCalendarDay}
          onDelete={deleteCalendarDay}
        />
      </div>
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

  const lastAction = status.lastEventTime ? `${describeEvent(status.lastEventType)} · ${status.lastEventTime}` : "Keine Buchung";

  return (
    <div className="space-y-4 rounded-xl border border-border/50 bg-white/95 p-4 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground/60">Mitarbeiter</div>
          <div className="text-lg font-semibold text-foreground/90">{employee.name}</div>
          <div className="text-xs text-muted-foreground/70">
            {employee.role}
            {employee.department ? ` · ${employee.department}` : ""}
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
            <Button type="button" size="sm" variant="secondary" onClick={onClockOut} disabled={disableClockOut}>
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

interface HolidayCalendarPanelProps {
  employees: EmployeeProfile[];
  entries: CalendarDayEntry[];
  onCreate: (payload: CalendarDayPayload) => CalendarDayEntry;
  onUpdate: (id: string, changes: Partial<Omit<CalendarDayEntry, "id">>) => void;
  onDelete: (id: string) => void;
}

const calendarTypeMeta: Record<CalendarDayEntry["type"], { label: string; badge: string }> = {
  "public-holiday": {
    label: "Feiertag",
    badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  "company-holiday": {
    label: "Praxisurlaub",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
  },
  "bonus-holiday": {
    label: "Bonus",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  vacation: {
    label: "Urlaub",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
  },
};

export function HolidayCalendarPanel({ employees, entries, onCreate, onUpdate, onDelete }: HolidayCalendarPanelProps) {
  const creatorLookup = useMemo(
    () => new Map<string, string>(employees.map((entry) => [entry.id, entry.name])),
    [employees],
  );

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8),
    [entries],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Kalender</CardTitle>
          <CardDescription>Abwesenheiten und besondere Tage</CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onCreate({
              date: new Date().toISOString().slice(0, 10),
              label: "Team Event",
              type: "company-holiday",
              description: "Automatisch angelegter Termin",
            })
          }
        >
          Neuer Eintrag
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground/80">Noch keine Eintraege vorhanden.</p>
        ) : (
          sortedEntries.map((entry) => {
            const meta = calendarTypeMeta[entry.type];
            const creator = entry.createdBy ? creatorLookup.get(entry.createdBy) ?? entry.createdBy : null;
            return (
              <div
                key={entry.id}
                className="rounded-lg border border-border/40 bg-white/95 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-foreground/90">{entry.label}</div>
                    <div className="text-xs text-muted-foreground/70">
                      {formatDate(entry.date)}
                      {creator ? ` • von ${creator}` : ""}
                    </div>
                  </div>
                  <Badge className={meta.badge}>{meta.label}</Badge>
                </div>
                {entry.description ? (
                  <div className="mt-1 text-xs text-muted-foreground/80">{entry.description}</div>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground/70">
                  <span>Aktualisiert: {entry.updatedAt ? formatDateTime(entry.updatedAt, "dd.MM.yyyy HH:mm") : "-"}</span>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() =>
                      onUpdate(entry.id, {
                        updatedAt: new Date().toISOString(),
                      })
                    }
                  >
                    Markieren
                  </Button>
                  <Button type="button" size="xs" variant="ghost" onClick={() => onDelete(entry.id)}>
                    Entfernen
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default TimeTrackingPage;

