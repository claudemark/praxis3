import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  BadgeCheck,
  Bell,
  Building2,
  CheckCircle2,
  CheckSquare,
  Edit2,
  ExternalLink,
  FileText,
  History,
  KeyRound,
  Lightbulb,
  ListChecks,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  WifiOff,
  Zap,
  X,
} from "lucide-react";

import {
  useSettingsStore,
  type ApiKey,
  type AuditEvent,
  type AutomationRule,
  type CompliancePolicy,
  type IntegrationSetting,
  type NotificationSetting,
  type PracticeSetting,
  type RoleSetting,
  type SelectionOption,
  type SelectionOptionCategory,
} from "@/features/settings/store/settings-store";
import { useEmployeeDirectory, type EmployeeProfile } from "@/features/employees/store/employee-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatDate, formatDateTime } from "@/lib/datetime";

const tabs = [
  { id: "general", label: "Stammdaten", icon: <Building2 className="size-4" /> },
  { id: "team", label: "Team & Auswahlfelder", icon: <UserPlus className="size-4" /> },
  { id: "roles", label: "Rollen & Rechte", icon: <Users className="size-4" /> },
  { id: "compliance", label: "Compliance", icon: <ShieldCheck className="size-4" /> },
  { id: "automation", label: "Automatisierung", icon: <Zap className="size-4" /> },
  { id: "notifications", label: "Benachrichtigungen", icon: <Lightbulb className="size-4" /> },
  { id: "integrations", label: "Integrationen", icon: <BadgeCheck className="size-4" /> },
  { id: "audit", label: "Audit Log", icon: <History className="size-4" /> },
  { id: "api", label: "API-Zugriffe", icon: <CheckCircle2 className="size-4" /> },
] as const;

const selectionGroups: { id: SelectionOptionCategory; label: string; description: string }[] = [
  { id: "supplier", label: "Lieferanten", description: "Bezugsquellen für Artikel und Materialien" },
  { id: "storageLocation", label: "Lagerorte", description: "Standard-Standorte für Wareneingang und Lagerung" },
  { id: "articleCategory", label: "Artikelkategorien", description: "Kategorien für Lager- und Einkaufsartikel" },
  { id: "procedure", label: "Eingriffe", description: "Standardisierte Eingriffe und Leistungen" },
  { id: "surgeon", label: "Chirurg:innen", description: "Operateur:innen für die Planung" },
  { id: "operator", label: "Operateur:innen / Assistenz", description: "Assistenz und durchführende Fachkräfte" },
];

const permissionCatalog = [
  { id: "appointments:manage", label: "Termine verwalten" },
  { id: "patients:read", label: "Patientendaten lesen" },
  { id: "billing:manage", label: "Abrechnung bearbeiten" },
  { id: "analytics:read", label: "Analytics einsehen" },
  { id: "staff:manage", label: "Personalplanung" },
] as const;

const permissionLabelMap = Object.fromEntries(
  permissionCatalog.map((permission) => [permission.id, permission.label]),
) as Record<string, string>;

const notificationChannelLabels: Record<"email" | "inApp" | "sms", string> = {
  email: "E-Mail",
  inApp: "In-App",
  sms: "SMS",
};

const apiScopeCatalog = [
  { id: "analytics:read", label: "Analytics lesen" },
  { id: "finance:read", label: "Finanzen lesen" },
  { id: "appointments:write", label: "Termine schreiben" },
  { id: "patients:read", label: "Patientendaten lesen" },
  { id: "inventory:write", label: "Lager schreiben" },
] as const;

const integrationStatusMeta: Record<
  IntegrationSetting["status"],
  { label: string; variant: "success" | "warning" | "destructive" | "outline" }
> = {
  connected: { label: "Verbunden", variant: "success" },
  pending: { label: "In Einrichtung", variant: "warning" },
  error: { label: "Fehler", variant: "destructive" },
};

const severityVariant: Record<AuditEvent["severity"], "muted" | "warning" | "destructive"> = {
  info: "muted",
  warning: "warning",
  critical: "destructive",
};

const notificationChannels = ["email", "inApp", "sms"] as const;

export function SettingsPage() {
  const {
    practiceSettings,
    roles,
    policies,
    automationRules,
    notificationSettings,
    integrationSettings,
    auditLog,
    apiKeys,
    updatePracticeSetting,
    addPracticeSetting,
    deletePracticeSetting,
    addRole,
    updateRole,
    deleteRole,
    addPolicy,
    updatePolicy,
    deletePolicy,
    toggleAutomation,
    updateAutomationCadence,
    updateNotificationChannel,
    updateIntegrationStatus,
    appendAuditEvent,
    createApiKey,
    revokeApiKey,
    toggleApiKey,
    selectionOptions,
    addSelectionOption,
    updateSelectionOption,
    deleteSelectionOption,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("general");

  const [showSettingModal, setShowSettingModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState<PracticeSetting | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleSetting | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CompliancePolicy | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);

  const integrationById = useMemo(
    () => new Map(integrationSettings.map((integration) => [integration.id, integration])),
    [integrationSettings],
  );
  const apiKeyById = useMemo(() => new Map(apiKeys.map((key) => [key.id, key])), [apiKeys]);

  const employees = useEmployeeDirectory((state) => state.employees);
  const addEmployee = useEmployeeDirectory((state) => state.addEmployee);
  const updateEmployee = useEmployeeDirectory((state) => state.updateEmployee);
  const removeEmployee = useEmployeeDirectory((state) => state.removeEmployee);
  const toggleEmployeeActive = useEmployeeDirectory((state) => state.toggleEmployeeActive);

  const handleIntegrationSync = (id: string) => {
    updateIntegrationStatus(id, "connected", new Date().toISOString());
    const integration = integrationById.get(id);
    appendAuditEvent({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "System",
      module: "Integrationen",
      action: "Manuelle Synchronisierung",
      details: integration ? integration.name : id,
      severity: "info",
    });
  };

  const handleIntegrationRetry = (id: string) => {
    updateIntegrationStatus(id, "pending");
    const integration = integrationById.get(id);
    appendAuditEvent({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "System",
      module: "Integrationen",
      action: "Verbindung neu aufgebaut",
      details: integration ? integration.name : id,
      severity: "warning",
    });
  };

  const handleToggleApiKey = (id: string, active: boolean) => {
    toggleApiKey(id, active);
    const key = apiKeyById.get(id);
    appendAuditEvent({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "System",
      module: "API",
      action: active ? "API Key aktiviert" : "API Key pausiert",
      details: key ? key.label : id,
      severity: active ? "info" : "warning",
    });
  };

  const handleRevokeApiKey = (id: string) => {
    const key = apiKeyById.get(id);
    revokeApiKey(id);
    appendAuditEvent({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "System",
      module: "API",
      action: "API Key widerrufen",
      details: key ? key.label : id,
      severity: "critical",
    });
  };

  let content: ReactNode;
  switch (activeTab) {
    case "general":
      content = (
        <GeneralSettings
          practiceSettings={practiceSettings}
          onCreate={() => {
            setEditingSetting(null);
            setShowSettingModal(true);
          }}
          onEdit={(setting) => {
            setEditingSetting(setting);
            setShowSettingModal(true);
          }}
          onDelete={deletePracticeSetting}
        />
      );
      break;
    case "team":
      content = (
        <div className="space-y-6">
          <Card className="border border-border/40">
            <CardHeader className="flex items-start justify-between">
              <div>
                <CardTitle>Teamverwaltung</CardTitle>
                <CardDescription>Mitarbeitende anlegen, bearbeiten oder deaktivieren.</CardDescription>
              </div>
              <Button className="gap-2 rounded-full" onClick={() => { setEditingEmployee(null); setShowEmployeeModal(true); }}>
                <UserPlus className="size-4" /> Neues Teammitglied
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {employees.length ? (
                employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex flex-col gap-3 rounded-lg border border-border/40 bg-white/95 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground/90">{employee.name}</p>
                      <p className="text-xs text-muted-foreground/70">
                        {employee.role} • {employee.department ?? "Ohne Bereich"}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground/70">
                        {employee.email ? <span>{employee.email}</span> : null}
                        {employee.phone ? <span>{employee.phone}</span> : null}
                        <span>Seit {formatDate(employee.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                        <span>Aktiv</span>
                        <Switch checked={employee.active} onCheckedChange={(value) => toggleEmployeeActive(employee.id, value)} />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setEditingEmployee(employee);
                            setShowEmployeeModal(true);
                          }}
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeEmployee(employee.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground/75">Noch keine Teammitglieder hinterlegt.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/40">
            <CardHeader className="flex items-start justify-between">
              <div>
                <CardTitle>Auswahllisten</CardTitle>
                <CardDescription>Standardwerte für Dropdown-Felder pflegen.</CardDescription>
              </div>
              <ListChecks className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-6">
              {selectionGroups.map((group) => (
                <SelectionOptionList
                  key={group.id}
                  definition={group}
                  options={selectionOptions[group.id] ?? []}
                  onAdd={(option) => addSelectionOption(group.id, option)}
                  onUpdate={(optionId, changes) => updateSelectionOption(group.id, optionId, changes)}
                  onDelete={(optionId) => deleteSelectionOption(group.id, optionId)}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      );
      break;

      content = (
        <RoleSettings
          roles={roles}
          onCreate={() => {
            setEditingRole(null);
            setShowRoleModal(true);
          }}
          onEdit={(role) => {
            setEditingRole(role);
            setShowRoleModal(true);
          }}
          onDelete={deleteRole}
        />
      );
      break;
    case "compliance":
      content = (
        <ComplianceSettings
          policies={policies}
          onCreate={() => {
            setEditingPolicy(null);
            setShowPolicyModal(true);
          }}
          onEdit={(policy) => {
            setEditingPolicy(policy);
            setShowPolicyModal(true);
          }}
          onDelete={deletePolicy}
        />
      );
      break;
    case "automation":
      content = (
        <AutomationSettings
          rules={automationRules}
          onToggle={toggleAutomation}
          onCadenceChange={updateAutomationCadence}
        />
      );
      break;
    case "notifications":
      content = (
        <NotificationSettings settings={notificationSettings} onToggle={updateNotificationChannel} />
      );
      break;
    case "integrations":
      content = (
        <IntegrationSettings
          integrations={integrationSettings}
          onSync={handleIntegrationSync}
          onRetry={handleIntegrationRetry}
        />
      );
      break;
    case "audit":
      content = <AuditLog events={auditLog} />;
      break;
    case "api":
      content = (
        <ApiSettings
          apiKeys={apiKeys}
          onCreate={() => setShowApiModal(true)}
          onToggle={handleToggleApiKey}
          onRevoke={handleRevokeApiKey}
        />
      );
      break;
    default:
      content = null;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">Einstellungen</h1>
          <p className="text-sm text-muted-foreground">
            Kontrollieren Sie Stammdaten, Berechtigungen, Automatisierung, Integrationen und Audits zentral.
          </p>
        </div>
        <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
          <ShieldCheck className="size-4" /> Compliance Modus aktiv
        </Badge>
      </header>

      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/40 bg-white/90 text-muted-foreground hover:border-primary/30"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {content}

      {showSettingModal ? (
        <PracticeSettingModal
          initial={editingSetting ?? undefined}
          onClose={() => setShowSettingModal(false)}
          onSubmit={(payload, existingId) => {
            if (existingId) {
              updatePracticeSetting(existingId, payload);
            } else {
              addPracticeSetting({
                id: payload.id ?? `setting-${Date.now()}`,
                label: payload.label,
                value: payload.value,
                description: payload.description,
              });
            }
            setShowSettingModal(false);
          }}
        />
      ) : null}

      {showEmployeeModal ? (
        <EmployeeModal
          initial={editingEmployee}
          onClose={() => {
            setShowEmployeeModal(false);
            setEditingEmployee(null);
          }}
          onSubmit={(payload) => {
            if (payload.id) {
              updateEmployee(payload.id, {
                name: payload.name,
                role: payload.role,
                department: payload.department,
                email: payload.email,
                phone: payload.phone,
                active: payload.active,
              });
            } else {
              addEmployee({
                name: payload.name,
                role: payload.role,
                department: payload.department,
                email: payload.email,
                phone: payload.phone,
                active: payload.active,
              });
            }
            setShowEmployeeModal(false);
            setEditingEmployee(null);
          }}
          onDelete={editingEmployee
            ? () => {
                removeEmployee(editingEmployee.id);
                setShowEmployeeModal(false);
                setEditingEmployee(null);
              }
            : undefined}
        />
      ) : null}

      {showRoleModal ? (
        <RoleModal
          initial={editingRole ?? undefined}
          onClose={() => setShowRoleModal(false)}
          onSubmit={(payload, existingId) => {
            if (existingId) {
              updateRole(existingId, payload);
            } else {
              addRole({ id: payload.id ?? `role-${Date.now()}`, ...payload });
            }
            setShowRoleModal(false);
          }}
        />
      ) : null}

      {showPolicyModal ? (
        <PolicyModal
          initial={editingPolicy ?? undefined}
          onClose={() => setShowPolicyModal(false)}
          onSubmit={(payload, existingId) => {
            if (existingId) {
              updatePolicy(existingId, payload);
            } else {
              addPolicy({ id: payload.id ?? `policy-${Date.now()}`, ...payload });
            }
            setShowPolicyModal(false);
          }}
        />
      ) : null}

      {showApiModal ? (
        <ApiKeyModal
          onClose={() => setShowApiModal(false)}
          onSubmit={(label, scopes) => {
            const key = createApiKey(label, scopes);
            appendAuditEvent({
              id: `audit-${Date.now()}`,
              timestamp: new Date().toISOString(),
              actor: "System",
              module: "API",
              action: "API Key erstellt",
              details: `${label} (${key.tokenPreview})`,
              severity: "info",
            });
            setShowApiModal(false);
          }}
        />
      ) : null}
    </div>
  );
}

function GeneralSettings({
  practiceSettings,
  onCreate,
  onEdit,
  onDelete,
}: {
  practiceSettings: PracticeSetting[];
  onCreate: () => void;
  onEdit: (setting: PracticeSetting) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="border border-border/40 bg-white/95">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Stammdaten</CardTitle>
          <CardDescription>Praxisweite Kontaktdaten und organisatorische Angaben.</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={onCreate}>
          <Plus className="size-4" /> Stammdatenfeld
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {practiceSettings.map((setting) => (
          <div
            key={setting.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/40 bg-white p-4"
          >
            <div>
              <p className="text-sm font-semibold text-foreground/90">{setting.label}</p>
              <p className="text-xs text-muted-foreground/70">{setting.description}</p>
              <p className="mt-1 text-sm text-primary">{setting.value}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => onEdit(setting)}>
                <Edit2 className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={() => onDelete(setting.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {!practiceSettings.length ? <EmptyState message="Keine Stammdaten gepflegt." /> : null}
      </CardContent>
    </Card>
  );
}

function RoleSettings({
  roles,
  onCreate,
  onEdit,
  onDelete,
}: {
  roles: RoleSetting[];
  onCreate: () => void;
  onEdit: (role: RoleSetting) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="border border-border/40 bg-white/95">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Rollen & Rechte</CardTitle>
          <CardDescription>Definieren Sie Verantwortlichkeiten und Zugriffe fuer das Team.</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={onCreate}>
          <Plus className="size-4" /> Rolle anlegen
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/40 bg-white p-4"
          >
            <div className="max-w-2xl space-y-2">
              <div>
                <p className="text-sm font-semibold text-foreground/90">{role.name}</p>
                <p className="text-xs text-muted-foreground/70">{role.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((permission) => (
                  <Badge key={permission} variant="outline" className="rounded-full text-xs">
                    {permissionLabelMap[permission] ?? permission}
                  </Badge>
                ))}
                {!role.permissions.length ? (
                  <Badge variant="muted" className="rounded-full text-xs">
                    Keine Berechtigungen
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => onEdit(role)}>
                <Edit2 className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={() => onDelete(role.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {!roles.length ? <EmptyState message="Keine Rollen angelegt." /> : null}
      </CardContent>
    </Card>
  );
}

function ComplianceSettings({
  policies,
  onCreate,
  onEdit,
  onDelete,
}: {
  policies: CompliancePolicy[];
  onCreate: () => void;
  onEdit: (policy: CompliancePolicy) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="border border-border/40 bg-white/95">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Compliance Richtlinien</CardTitle>
          <CardDescription>Dokumente, Verantwortliche und bestaetigte Personen im Blick.</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={onCreate}>
          <Plus className="size-4" /> Richtlinie
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {policies.map((policy) => (
          <div
            key={policy.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/40 bg-white p-4"
          >
            <div className="max-w-2xl space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <p className="text-sm font-semibold text-foreground/90">{policy.title}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground/80">
                <Badge variant="outline">Aktualisiert {formatDate(policy.updatedAt)}</Badge>
                <span>{policy.acceptedBy.length} Bestaetigungen</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {policy.acceptedBy.map((person) => (
                  <Badge key={person} variant="muted" className="rounded-full text-xs">
                    {person}
                  </Badge>
                ))}
                {!policy.acceptedBy.length ? (
                  <Badge variant="muted" className="rounded-full text-xs">
                    Noch keine Bestaetigungen
                  </Badge>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-primary"
                onClick={() => window.open(policy.documentUrl, "_blank")}
              >
                <ExternalLink className="size-3" /> Dokument oeffnen
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => onEdit(policy)}>
                <Edit2 className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={() => onDelete(policy.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {!policies.length ? <EmptyState message="Keine Compliance Richtlinien hinterlegt." /> : null}
      </CardContent>
    </Card>
  );
}

function AutomationSettings({
  rules,
  onToggle,
  onCadenceChange,
}: {
  rules: AutomationRule[];
  onToggle: (id: string, enabled: boolean) => void;
  onCadenceChange: (id: string, cadence: string) => void;
}) {
  const cadenceOptions = useMemo(() => {
    const values = new Set<string>();
    rules.forEach((rule) => values.add(rule.cadence));
    return Array.from(values);
  }, [rules]);

  return (
    <Card className="border border-border/40 bg-white/95">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Automatisierungen</CardTitle>
          <CardDescription>Workflows fuer Mahnwesen, Lager und Kommunikation.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/40 bg-white p-4"
          >
            <div className="max-w-2xl space-y-1">
              <p className="text-sm font-semibold text-foreground/90">{rule.name}</p>
              <p className="text-xs text-muted-foreground/70">{rule.description}</p>
              <p className="text-xs text-muted-foreground/60">
                Verantwortlich: {rule.owner}
                {rule.lastRunAt ? ` - Letzter Lauf ${formatDateTime(rule.lastRunAt)}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={rule.cadence}
                onChange={(event) => onCadenceChange(rule.id, event.target.value)}
                className="rounded-full border border-border/40 bg-white/95 px-3 py-2 text-xs font-semibold"
              >
                {cadenceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Switch
                checked={rule.enabled}
                onCheckedChange={(checked) => onToggle(rule.id, checked)}
                label={rule.enabled ? "Aktiv" : "Pausiert"}
              />
            </div>
          </div>
        ))}
        {!rules.length ? <EmptyState message="Keine Automatisierungen definiert." /> : null}
      </CardContent>
    </Card>
  );
}

function NotificationSettings({
  settings,
  onToggle,
}: {
  settings: NotificationSetting[];
  onToggle: (id: string, channel: "email" | "inApp" | "sms", enabled: boolean) => void;
}) {
  const grouped = useMemo(() => {
    return settings.reduce<Record<string, NotificationSetting[]>>((acc, setting) => {
      acc[setting.group] = acc[setting.group] ?? [];
      acc[setting.group]!.push(setting);
      return acc;
    }, {});
  }, [settings]);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([group, items]) => (
        <Card key={group} className="border border-border/40 bg-white/95">
          <CardHeader className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <div>
              <CardTitle className="text-base font-semibold capitalize">{group}</CardTitle>
              <CardDescription>Steuern Sie Kanaele pro Ereignis.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 bg-white p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground/90">{entry.label}</p>
                  <p className="text-xs text-muted-foreground/70">Gruppe {entry.group}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {notificationChannels.map((channel) => (
                    <Switch
                      key={channel}
                      checked={entry[channel]}
                      onCheckedChange={(checked) => onToggle(entry.id, channel, checked)}
                      label={notificationChannelLabels[channel]}
                    />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {!settings.length ? <EmptyState message="Keine Benachrichtigungseinstellungen vorhanden." /> : null}
    </div>
  );
}

function IntegrationSettings({
  integrations,
  onSync,
  onRetry,
}: {
  integrations: IntegrationSetting[];
  onSync: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {integrations.map((integration) => {
        const status = integrationStatusMeta[integration.status];
        return (
          <Card key={integration.id} className="border border-border/40 bg-white/95">
            <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="max-w-2xl space-y-2">
                <p className="text-sm font-semibold text-foreground/90">{integration.name}</p>
                <p className="text-xs text-muted-foreground/70">{integration.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground/70">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {integration.lastSyncAt ? (
                    <Badge variant="outline">Letzte Sync {formatDateTime(integration.lastSyncAt)}</Badge>
                  ) : null}
                  <Badge variant="outline">Verantwortlich: {integration.managedBy}</Badge>
                </div>
                {integration.supportUrl ? (
                  <p className="text-xs text-primary">Support: {integration.supportUrl}</p>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => onSync(integration.id)}>
                  <RefreshCw className="size-4" /> Manuell synchronisieren
                </Button>
                {integration.status !== "connected" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground"
                    onClick={() => onRetry(integration.id)}
                  >
                    <WifiOff className="size-4" /> Verbindung pruefen
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
      {!integrations.length ? <EmptyState message="Keine Integrationen angebunden." /> : null}
    </div>
  );
}

function AuditLog({ events }: { events: AuditEvent[] }) {
  return (
    <Card className="border border-border/40 bg-white/95">
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <CardDescription>Letzte sicherheits- und compliance-relevante Aktionen.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/40 bg-white p-4"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground/90">{event.action}</p>
              <p className="text-xs text-muted-foreground/70">
                {formatDateTime(event.timestamp)} - {event.actor}
              </p>
              <p className="text-xs text-muted-foreground/80">{event.details}</p>
            </div>
            <Badge variant={severityVariant[event.severity]} className="rounded-full text-xs">
              {event.module}
            </Badge>
          </div>
        ))}
        {!events.length ? <EmptyState message="Noch keine Audit-Eintraege." /> : null}
      </CardContent>
    </Card>
  );
}

function ApiSettings({
  apiKeys,
  onCreate,
  onToggle,
  onRevoke,
}: {
  apiKeys: ApiKey[];
  onCreate: () => void;
  onToggle: (id: string, active: boolean) => void;
  onRevoke: (id: string) => void;
}) {
  return (
    <Card className="border border-border/40 bg-white/95">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-primary" />
          <div>
            <CardTitle>API Zugriffsschluessel</CardTitle>
            <CardDescription>Verwalten Sie externe Integrationen und Zugriffsrechte.</CardDescription>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={onCreate}>
          <Plus className="size-4" /> API Key erzeugen
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {apiKeys.map((key) => (
          <div
            key={key.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/40 bg-white p-4"
          >
            <div className="max-w-2xl space-y-2">
              <p className="text-sm font-semibold text-foreground/90">{key.label}</p>
              <p className="text-xs text-muted-foreground/70">
                Erstellt {formatDate(key.createdAt)}
                {key.lastUsedAt ? ` - Letzte Nutzung ${formatDateTime(key.lastUsedAt)}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {key.scopes.map((scope) => (
                  <Badge key={scope} variant="outline" className="rounded-full text-xs">
                    {scope}
                  </Badge>
                ))}
                {!key.scopes.length ? (
                  <Badge variant="muted" className="rounded-full text-xs">
                    Keine Scopes vergeben
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs font-mono text-muted-foreground/80">{key.tokenPreview}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Switch
                checked={key.active}
                onCheckedChange={(checked) => onToggle(key.id, checked)}
                label={key.active ? "Aktiv" : "Pausiert"}
              />
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={() => onRevoke(key.id)}
              >
                <Trash2 className="size-3.5" /> Widerrufen
              </Button>
            </div>
          </div>
        ))}
        {!apiKeys.length ? <EmptyState message="Keine API Keys erstellt." /> : null}
      </CardContent>
    </Card>
  );
}

function PracticeSettingModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: PracticeSetting;
  onClose: () => void;
  onSubmit: (
    payload: { id?: string; label: string; value: string; description: string },
    existingId?: string,
  ) => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id ?? "",
    label: initial?.label ?? "",
    value: initial?.value ?? "",
    description: initial?.description ?? "",
  });
  const isEdit = Boolean(initial);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(
      {
        id: form.id.trim() || undefined,
        label: form.label,
        value: form.value,
        description: form.description,
      },
      initial?.id,
    );
  };

  return (
    <ModalShell
      title={isEdit ? "Stammdatenfeld bearbeiten" : "Stammdatenfeld anlegen"}
      description="Definieren Sie Label, Wert und Beschreibung fuer das Feld."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Interne ID</label>
          <Input
            value={form.id}
            onChange={(event) => setForm((prev) => ({ ...prev, id: event.target.value }))}
            placeholder="z. B. contact-email"
            disabled={isEdit}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Bezeichnung</label>
          <Input
            value={form.label}
            onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Wert</label>
          <Input
            value={form.value}
            onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Beschreibung</label>
          <Textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={3}
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit">{isEdit ? "Speichern" : "Anlegen"}</Button>
        </div>
      </form>
    </ModalShell>
  );
}

function RoleModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: RoleSetting;
  onClose: () => void;
  onSubmit: (payload: Omit<RoleSetting, "id"> & { id?: string }, existingId?: string) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [permissions, setPermissions] = useState<string[]>(initial?.permissions ?? []);
  const isEdit = Boolean(initial);

  const togglePermission = (value: string) => {
    setPermissions((current) =>
      current.includes(value) ? current.filter((permission) => permission !== value) : [...current, value],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ id: initial?.id, name, description, permissions }, initial?.id);
  };

  return (
    <ModalShell
      title={isEdit ? "Rolle bearbeiten" : "Neue Rolle"}
      description="Rollen strukturieren Zugriffsrechte fuer das Praxis-Team."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Rollenname</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Beschreibung</label>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Berechtigungen</label>
          <div className="grid gap-2">
            {permissionCatalog.map((permission) => (
              <label
                key={permission.id}
                className="flex items-center gap-2 rounded-lg border border-border/40 bg-white/95 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="size-4 rounded border-border"
                  checked={permissions.includes(permission.id)}
                  onChange={() => togglePermission(permission.id)}
                />
                {permission.label}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit">{isEdit ? "Speichern" : "Anlegen"}</Button>
        </div>
      </form>
    </ModalShell>
  );
}

function PolicyModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: CompliancePolicy;
  onClose: () => void;
  onSubmit: (payload: Omit<CompliancePolicy, "id"> & { id?: string }, existingId?: string) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [documentUrl, setDocumentUrl] = useState(initial?.documentUrl ?? "");
  const [updatedAt, setUpdatedAt] = useState(initial?.updatedAt ?? new Date().toISOString().slice(0, 10));
  const [acceptedBy, setAcceptedBy] = useState(initial?.acceptedBy.join(", ") ?? "");
  const isEdit = Boolean(initial);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const acceptedList = acceptedBy
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    onSubmit(
      {
        id: initial?.id,
        title,
        documentUrl,
        updatedAt,
        acceptedBy: acceptedList,
      },
      initial?.id,
    );
  };

  return (
    <ModalShell
      title={isEdit ? "Richtlinie bearbeiten" : "Neue Richtlinie"}
      description="Hinterlegen Sie Dokument und Verantwortliche."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Titel</label>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Dokument URL</label>
          <Input value={documentUrl} onChange={(event) => setDocumentUrl(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Aktualisiert am</label>
          <Input value={updatedAt} type="date" onChange={(event) => setUpdatedAt(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Bestaetigt durch (Komma getrennt)</label>
          <Textarea
            value={acceptedBy}
            onChange={(event) => setAcceptedBy(event.target.value)}
            rows={3}
            placeholder="z. B. Dr. Krause, Marcus Linde"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit">{isEdit ? "Speichern" : "Anlegen"}</Button>
        </div>
      </form>
    </ModalShell>
  );
}

function ApiKeyModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (label: string, scopes: string[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [scopes, setScopes] = useState<string[]>(["analytics:read"]);

  const toggleScope = (value: string) => {
    setScopes((current) =>
      current.includes(value) ? current.filter((scope) => scope !== value) : [...current, value],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(label, scopes);
  };

  return (
    <ModalShell
      title="API Key erzeugen"
      description="Benennen Sie den Zugriff und definieren Sie benoetigte Rechte."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Bezeichnung</label>
          <Input value={label} onChange={(event) => setLabel(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Scopes</label>
          <div className="grid gap-2">
            {apiScopeCatalog.map((scope) => (
              <label
                key={scope.id}
                className="flex items-center gap-2 rounded-lg border border-border/40 bg-white/95 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="size-4 rounded border-border"
                  checked={scopes.includes(scope.id)}
                  onChange={() => toggleScope(scope.id)}
                />
                {scope.label}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit">Erstellen</Button>
        </div>
      </form>
    </ModalShell>
  );
}

function EmployeeModal({
  initial,
  onSubmit,
  onDelete,
  onClose,
}: {
  initial: EmployeeProfile | null;
  onSubmit: (payload: { name: string; role: string; department: string; email?: string; phone?: string; active: boolean; id?: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [active, setActive] = useState(initial?.active ?? true);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !role.trim()) {
      return;
    }
    onSubmit({
      id: initial?.id,
      name: name.trim(),
      role: role.trim(),
      department: department.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      active,
    });
  };

  return (
    <ModalShell
      title={initial ? 'Teammitglied bearbeiten' : 'Neues Teammitglied'}
      description="Basisdaten und Erreichbarkeit pflegen."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Name</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Vor- und Nachname" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Rolle</label>
            <Input value={role} onChange={(event) => setRole(event.target.value)} required placeholder="z. B. OP Pflege" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Bereich</label>
            <Input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="z. B. OP, Empfang" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">E-Mail</label>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="team@praxis.de" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Telefon</label>
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="z. B. +49" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-surface-100/60 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-foreground/80">Aktiv</p>
              <p className="text-xs text-muted-foreground/70">Steuert Sichtbarkeit in Auswahlfeldern</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-4">
          {onDelete ? (
            <Button type="button" variant="ghost" className="gap-2 text-destructive" onClick={onDelete}>
              <Trash2 className="size-4" /> Entfernen
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="gap-2 rounded-full">
              <CheckSquare className="size-4" /> Speichern
            </Button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

function SelectionOptionList({
  definition,
  options,
  onAdd,
  onUpdate,
  onDelete,
}: {
  definition: { id: SelectionOptionCategory; label: string; description: string };
  options: SelectionOption[];
  onAdd: (option: { value: string; label?: string; description?: string }) => void;
  onUpdate: (optionId: string, changes: Partial<SelectionOption>) => void;
  onDelete: (optionId: string) => void;
}) {
  const [labelValue, setLabelValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!labelValue.trim()) {
      return;
    }
    onAdd({ value: labelValue.trim(), label: labelValue.trim(), description: descriptionValue.trim() || undefined });
    setLabelValue('');
    setDescriptionValue('');
  };

  return (
    <div className="rounded-xl border border-border/40 bg-white/95 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground/90">{definition.label}</p>
          <p className="text-xs text-muted-foreground/70">{definition.description}</p>
        </div>
        <Badge variant="outline" className="self-center">{options.length}</Badge>
      </div>
      <form onSubmit={handleSubmit} className="mt-3 grid gap-2 md:grid-cols-[1.4fr_1fr_auto]">
        <Input value={labelValue} onChange={(event) => setLabelValue(event.target.value)} placeholder="Neuen Wert hinterlegen" />
        <Input value={descriptionValue} onChange={(event) => setDescriptionValue(event.target.value)} placeholder="Beschreibung (optional)" />
        <Button type="submit" variant="outline" className="gap-1">
          <Plus className="size-4" /> Hinzufügen
        </Button>
      </form>
      <div className="mt-4 space-y-2">
        {options.length ? (
          options.map((option) => (
            <SelectionOptionRow
              key={option.id}
              option={option}
              onSave={(changes) => onUpdate(option.id, changes)}
              onDelete={() => onDelete(option.id)}
            />
          ))
        ) : (
          <p className="text-xs text-muted-foreground/70">Noch keine Einträge hinterlegt.</p>
        )}
      </div>
    </div>
  );
}

function SelectionOptionRow({
  option,
  onSave,
  onDelete,
}: {
  option: SelectionOption;
  onSave: (changes: Partial<SelectionOption>) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(option.label);
  const [value, setValue] = useState(option.value);
  const [description, setDescription] = useState(option.description ?? '');
  const [active, setActive] = useState(option.active);

  useEffect(() => {
    setLabel(option.label);
    setValue(option.value);
    setDescription(option.description ?? '');
    setActive(option.active);
  }, [option]);

  const handleSave = () => {
    if (!label.trim()) {
      return;
    }
    onSave({
      label: label.trim(),
      value: value.trim() || label.trim(),
      description: description.trim() || undefined,
      active,
    });
  };

  return (
    <div className="grid gap-2 rounded-lg border border-border/40 bg-surface-100/60 p-3 md:grid-cols-[1.1fr_1fr_auto]">
      <div className="space-y-1">
        <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Anzeigename" />
        <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Systemwert" />
      </div>
      <div className="space-y-1">
        <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Beschreibung" />
        <div className="flex items-center justify-between rounded-md border border-border/40 bg-white px-3 py-2">
          <span className="text-xs text-muted-foreground/70">Aktiv</span>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleSave}>
          Speichern
        </Button>
        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
          Entfernen
        </Button>
      </div>
    </div>
  );
}

function ModalShell({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="w-full max-w-xl rounded-2xl border border-border/40 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-border/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground/90">{title}</h2>
            {description ? <p className="text-xs text-muted-foreground/80">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-transparent p-1 text-muted-foreground transition hover:border-border/60 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/40 bg-white/80 p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}


















