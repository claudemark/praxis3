import { nanoid } from "nanoid";
import { create } from "zustand";

export interface PracticeSetting {
  id: string;
  label: string;
  value: string;
  description: string;
}

export interface RoleSetting {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface CompliancePolicy {
  id: string;
  title: string;
  documentUrl: string;
  updatedAt: string;
  acceptedBy: string[];
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  cadence: string;
  owner: string;
  enabled: boolean;
  lastRunAt?: string;
}

export interface NotificationSetting {
  id: string;
  label: string;
  group: "Finanzen" | "Personal" | "Compliance" | "System";
  email: boolean;
  inApp: boolean;
  sms: boolean;
}

export interface IntegrationSetting {
  id: string;
  name: string;
  description: string;
  status: "connected" | "error" | "pending";
  lastSyncAt?: string;
  managedBy: string;
  supportUrl?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  module: string;
  action: string;
  details: string;
  severity: "info" | "warning" | "critical";
}

export interface ApiKey {
  id: string;
  label: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  active: boolean;
  tokenPreview: string;
}

export type SelectionOptionCategory =
  | "supplier"
  | "storageLocation"
  | "articleCategory"
  | "procedure"
  | "surgeon"
  | "operator";

export interface SelectionOption {
  id: string;
  value: string;
  label: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface SettingsState {
  practiceSettings: PracticeSetting[];
  roles: RoleSetting[];
  policies: CompliancePolicy[];
  automationRules: AutomationRule[];
  notificationSettings: NotificationSetting[];
  integrationSettings: IntegrationSetting[];
  auditLog: AuditEvent[];
  apiKeys: ApiKey[];
  selectionOptions: Record<SelectionOptionCategory, SelectionOption[]>;
  addSelectionOption: (group: SelectionOptionCategory, option: { value: string; label?: string; description?: string }) => SelectionOption;
  updateSelectionOption: (group: SelectionOptionCategory, optionId: string, changes: Partial<Omit<SelectionOption, "id" | "createdAt">>) => void;
  deleteSelectionOption: (group: SelectionOptionCategory, optionId: string) => void;
  // Practice
  updatePracticeSetting: (id: string, changes: Partial<PracticeSetting>) => void;
  addPracticeSetting: (setting: PracticeSetting) => void;
  deletePracticeSetting: (id: string) => void;
  // Roles
  addRole: (role: RoleSetting) => void;
  updateRole: (id: string, changes: Partial<RoleSetting>) => void;
  deleteRole: (id: string) => void;
  // Compliance
  addPolicy: (policy: CompliancePolicy) => void;
  updatePolicy: (id: string, changes: Partial<CompliancePolicy>) => void;
  deletePolicy: (id: string) => void;
  // Automations
  toggleAutomation: (id: string, enabled: boolean) => void;
  updateAutomationCadence: (id: string, cadence: string) => void;
  // Notifications
  updateNotificationChannel: (id: string, channel: "email" | "inApp" | "sms", enabled: boolean) => void;
  // Integrations
  updateIntegrationStatus: (id: string, status: IntegrationSetting["status"], syncTime?: string) => void;
  // Audit
  appendAuditEvent: (event: AuditEvent) => void;
  // API keys
  createApiKey: (label: string, scopes: string[]) => ApiKey;
  revokeApiKey: (id: string) => void;
  toggleApiKey: (id: string, active: boolean) => void;
}

const initialPracticeSettings: PracticeSetting[] = [
  {
    id: "practice-name",
    label: "Praxisname",
    value: "Orthopaedie am Park",
    description: "Wird auf Rechnungen, Belegen und E-Mails angezeigt.",
  },
  {
    id: "contact-email",
    label: "Kontakt-E-Mail",
    value: "service@ortho-park.de",
    description: "Standardkontakt fuer Patientenanfragen.",
  },
  {
    id: "data-protection",
    label: "Datenschutzbeauftragte:r",
    value: "Dr. Amelie Krause",
    description: "Verantwortlich fuer DSGVO-Anfragen.",
  },
  {
    id: "office-hours",
    label: "Sprechzeiten",
    value: "Mo-Do 8-18 Uhr, Fr 8-14 Uhr",
    description: "Anzeige fuer Patientenkommunikation und Terminerinnerungen.",
  },
];

const initialRoles: RoleSetting[] = [
  {
    id: "role-admin",
    name: "Administrator",
    description: "Voller Zugriff auf alle Module, Freigaben und Einstellungen.",
    permissions: ["dashboard", "billing", "inventory", "operations", "settings"],
  },
  {
    id: "role-mfa",
    name: "MFA",
    description: "Taegliche Praxisablaeufe, Termin- und Patientenmanagement.",
    permissions: ["dashboard", "tasks", "time-tracking", "billing"],
  },
  {
    id: "role-controlling",
    name: "Controlling",
    description: "Finanzkennzahlen, Barkasse und Analytics.",
    permissions: ["analytics", "cash-drawer", "billing"],
  },
];

const initialPolicies: CompliancePolicy[] = [
  {
    id: "policy-dsgvo",
    title: "DSGVO Auftragsverarbeitung",
    documentUrl: "https://praxispro.example.com/dsgvo-av.pdf",
    updatedAt: "2025-08-12",
    acceptedBy: ["Dr. Krause", "Nora Feld"],
  },
  {
    id: "policy-notfall",
    title: "IT-Notfallkonzept",
    documentUrl: "https://praxispro.example.com/it-notfall.pdf",
    updatedAt: "2025-07-01",
    acceptedBy: ["Marcus Linde"],
  },
];

const initialAutomationRules: AutomationRule[] = [
  {
    id: "auto-reminder",
    name: "Zahlungserinnerung Privatpatient:innen",
    description: "Automatische E-Mail nach 10 Tagen ohne Zahlung.",
    cadence: "taeglich 08:00",
    owner: "Marcus Linde",
    enabled: true,
    lastRunAt: "2025-09-23T08:05:00",
  },
  {
    id: "auto-inventory",
    name: "Implantat-Bestand Pruefung",
    description: "Material unter Mindestbestand automatisch nachbestellen.",
    cadence: "montags 06:00",
    owner: "Nora Feld",
    enabled: true,
    lastRunAt: "2025-09-22T06:02:00",
  },
  {
    id: "auto-reporting",
    name: "Monatliches KPI-Reporting",
    description: "PDF-Report per E-Mail an Praxisleitung & Controlling.",
    cadence: "monatl. 1. Werktag",
    owner: "Finja Lenz",
    enabled: false,
  },
];

const initialNotifications: NotificationSetting[] = [
  { id: "notif-cash", label: "Barkasse unter 150 Euro", group: "Finanzen", email: true, inApp: true, sms: false },
  { id: "notif-inkasso", label: "Neue Mahnstufe faellig", group: "Finanzen", email: true, inApp: true, sms: true },
  { id: "notif-compliance", label: "DSGVO Dokument ausstehend", group: "Compliance", email: true, inApp: true, sms: false },
  { id: "notif-shift", label: "Schichttausch angefragt", group: "Personal", email: false, inApp: true, sms: false },
  { id: "notif-system", label: "System-Update geplant", group: "System", email: true, inApp: true, sms: false },
];

const initialIntegrations: IntegrationSetting[] = [
  {
    id: "int-datev",
    name: "DATEV Unternehmen online",
    description: "Automatischer Export der Debitoren und Barkasse.",
    status: "connected",
    lastSyncAt: "2025-09-24T22:10:00",
    managedBy: "Finja Lenz",
    supportUrl: "https://praxispro.example.com/datev",
  },
  {
    id: "int-sap",
    name: "SAP Ariba",
    description: "Beschaffungsplattform fuer Implantate.",
    status: "pending",
    managedBy: "Nora Feld",
    supportUrl: "https://praxispro.example.com/sap",
  },
  {
    id: "int-telemedizin",
    name: "Telemedizin Portal",
    description: "Video-Sprechstunden und digitale Aufklaerung.",
    status: "error",
    lastSyncAt: "2025-09-22T18:42:00",
    managedBy: "Dr. Marten Vogt",
    supportUrl: "https://praxispro.example.com/telemedizin",
  },
];

const initialAuditLog: AuditEvent[] = [
  {
    id: "audit-1",
    timestamp: "2025-09-25T07:45:00",
    actor: "Marcus Linde",
    module: "Barkasse",
    action: "Neue Barausgabe erfasst",
    details: "Milch & Kaffee 14,50 EUR",
    severity: "info",
  },
  {
    id: "audit-2",
    timestamp: "2025-09-24T20:14:00",
    actor: "System",
    module: "Integrationen",
    action: "DATEV Sync erfolgreich",
    details: "57 Belege exportiert",
    severity: "info",
  },
  {
    id: "audit-3",
    timestamp: "2025-09-23T18:08:00",
    actor: "Dr. Amelie Krause",
    module: "Compliance",
    action: "DSGVO AV akzeptiert",
    details: "Signatur via DocuSign",
    severity: "info",
  },
  {
    id: "audit-4",
    timestamp: "2025-09-21T10:22:00",
    actor: "System",
    module: "Telemedizin",
    action: "Webhook Fehler",
    details: "HTTP 401 - Token abgelaufen",
    severity: "warning",
  },
];

const initialApiKeys: ApiKey[] = [
  {
    id: "api-01",
    label: "PowerBI Dashboard",
    scopes: ["analytics:read", "finance:read"],
    createdAt: "2025-05-12T09:15:00",
    lastUsedAt: "2025-09-24T21:12:00",
    active: true,
    tokenPreview: "pk_4fa9...23be",
  },
  {
    id: "api-02",
    label: "Telemedizin Connector",
    scopes: ["appointments:write", "patients:read"],
    createdAt: "2025-07-04T11:03:00",
    lastUsedAt: "2025-09-22T17:48:00",
    active: false,
    tokenPreview: "pk_c1b7...98da",
  },
];

const initialSelectionOptions: Record<SelectionOptionCategory, SelectionOption[]> = {
  supplier: [
    { id: 'sel-supplier-1', value: 'OrthoMed GmbH', label: 'OrthoMed GmbH', active: true, createdAt: '2024-12-01T09:00:00' },
    { id: 'sel-supplier-2', value: 'BioPlasma', label: 'BioPlasma', active: true, createdAt: '2024-12-01T09:00:00' },
    { id: 'sel-supplier-3', value: 'MediFlow', label: 'MediFlow', active: true, createdAt: '2024-12-01T09:00:00' },
  ],
  storageLocation: [
    { id: 'sel-location-1', value: 'Lager A / Regal 3', label: 'Lager A / Regal 3', active: true, createdAt: '2024-12-01T09:00:00' },
    { id: 'sel-location-2', value: 'Lager B / Regal 1', label: 'Lager B / Regal 1', active: true, createdAt: '2024-12-01T09:00:00' },
    { id: 'sel-location-3', value: 'OP Lager', label: 'OP Lager', description: 'Instrumentenlager Nebenraum', active: true, createdAt: '2025-02-10T08:12:00' },
  ],
  articleCategory: [
    { id: 'sel-category-1', value: 'Implantate', label: 'Implantate', active: true, createdAt: '2024-12-01T09:00:00' },
    { id: 'sel-category-2', value: 'Verbrauchsmaterial', label: 'Verbrauchsmaterial', active: true, createdAt: '2024-12-01T09:00:00' },
    { id: 'sel-category-3', value: 'OP Bedarf', label: 'OP Bedarf', active: true, createdAt: '2024-12-01T09:00:00' },
  ],
  procedure: [
    { id: 'sel-procedure-1', value: 'Knie TEP', label: 'Knie TEP', active: true, createdAt: '2025-01-15T10:22:00' },
    { id: 'sel-procedure-2', value: 'Arthroskopie', label: 'Arthroskopie', active: true, createdAt: '2025-01-15T10:22:00' },
    { id: 'sel-procedure-3', value: 'Stoßwellentherapie', label: 'Stoßwellentherapie', active: true, createdAt: '2025-01-15T10:22:00' },
  ],
  surgeon: [
    { id: 'sel-surgeon-1', value: 'Dr. Amelie Krause', label: 'Dr. Amelie Krause', active: true, createdAt: '2024-12-01T09:00:00' },
    { id: 'sel-surgeon-2', value: 'Dr. Sofie Nguyen', label: 'Dr. Sofie Nguyen', active: true, createdAt: '2024-12-01T09:00:00' },
  ],
  operator: [
    { id: 'sel-operator-1', value: 'Marcus Linde', label: 'Marcus Linde', active: true, createdAt: '2024-12-01T09:00:00' },
    { id: 'sel-operator-2', value: 'Nora Feld', label: 'Nora Feld', active: true, createdAt: '2024-12-01T09:00:00' },
    { id: 'sel-operator-3', value: 'Lena Böttcher', label: 'Lena Böttcher', active: true, createdAt: '2024-12-01T09:00:00' },
  ],
};

function generateTokenPreview() {
  return `pk_${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  practiceSettings: initialPracticeSettings,
  roles: initialRoles,
  policies: initialPolicies,
  automationRules: initialAutomationRules,
  notificationSettings: initialNotifications,
  integrationSettings: initialIntegrations,
  auditLog: initialAuditLog,
  apiKeys: initialApiKeys,
  selectionOptions: initialSelectionOptions,
  updatePracticeSetting: (id, changes) =>
    set((state) => ({
      practiceSettings: state.practiceSettings.map((setting) =>
        setting.id === id ? { ...setting, ...changes } : setting,
      ),
    })),
  addPracticeSetting: (setting) =>
    set((state) => ({ practiceSettings: [setting, ...state.practiceSettings] })),
  deletePracticeSetting: (id) =>
    set((state) => ({ practiceSettings: state.practiceSettings.filter((setting) => setting.id !== id) })),
  addRole: (role) =>
    set((state) => ({ roles: [role, ...state.roles] })),
  updateRole: (id, changes) =>
    set((state) => ({
      roles: state.roles.map((role) => (role.id === id ? { ...role, ...changes } : role)),
    })),
  deleteRole: (id) =>
    set((state) => ({ roles: state.roles.filter((role) => role.id !== id) })),
  addPolicy: (policy) =>
    set((state) => ({ policies: [policy, ...state.policies] })),
  updatePolicy: (id, changes) =>
    set((state) => ({
      policies: state.policies.map((policy) => (policy.id === id ? { ...policy, ...changes } : policy)),
    })),
  deletePolicy: (id) =>
    set((state) => ({ policies: state.policies.filter((policy) => policy.id !== id) })),
  toggleAutomation: (id, enabled) =>
    set((state) => ({
      automationRules: state.automationRules.map((rule) =>
        rule.id === id ? { ...rule, enabled } : rule,
      ),
    })),
  updateAutomationCadence: (id, cadence) =>
    set((state) => ({
      automationRules: state.automationRules.map((rule) =>
        rule.id === id ? { ...rule, cadence } : rule,
      ),
    })),
  updateNotificationChannel: (id, channel, enabled) =>
    set((state) => ({
      notificationSettings: state.notificationSettings.map((setting) =>
        setting.id === id ? { ...setting, [channel]: enabled } : setting,
      ),
    })),
  updateIntegrationStatus: (id, status, syncTime) =>
    set((state) => ({
      integrationSettings: state.integrationSettings.map((integration) =>
        integration.id === id
          ? { ...integration, status, lastSyncAt: syncTime ?? integration.lastSyncAt }
          : integration,
      ),
    })),
  appendAuditEvent: (event) =>
    set((state) => ({ auditLog: [event, ...state.auditLog].slice(0, 30) })),
  addSelectionOption: (group, option) => {
    const entry: SelectionOption = {
      id: `sel-${group}-${nanoid(5)}`,
      value: option.value.trim(),
      label: (option.label ?? option.value).trim(),
      description: option.description?.trim() || undefined,
      active: true,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      selectionOptions: {
        ...state.selectionOptions,
        [group]: [entry, ...(state.selectionOptions[group] ?? [])],
      },
    }));
    return entry;
  },
  updateSelectionOption: (group, optionId, changes) =>
    set((state) => ({
      selectionOptions: {
        ...state.selectionOptions,
        [group]: (state.selectionOptions[group] ?? []).map((entry) =>
          entry.id === optionId
            ? {
                ...entry,
                ...changes,
                value: changes.value?.trim() ?? entry.value,
                label: changes.label?.trim() ?? entry.label,
                description: changes.description?.trim() || entry.description,
                active: changes.active ?? entry.active,
                updatedAt: new Date().toISOString(),
              }
            : entry,
        ),
      },
    })),
  deleteSelectionOption: (group, optionId) =>
    set((state) => ({
      selectionOptions: {
        ...state.selectionOptions,
        [group]: (state.selectionOptions[group] ?? []).filter((entry) => entry.id !== optionId),
      },
    })),
  createApiKey: (label, scopes) => {
    const key: ApiKey = {
      id: `api-${nanoid(6)}`,
      label,
      scopes,
      createdAt: new Date().toISOString(),
      active: true,
      tokenPreview: generateTokenPreview(),
    };
    set((state) => ({ apiKeys: [key, ...state.apiKeys] }));
    return key;
  },
  revokeApiKey: (id) =>
    set((state) => ({ apiKeys: state.apiKeys.filter((key) => key.id !== id) })),
  toggleApiKey: (id, active) =>
    set((state) => ({
      apiKeys: state.apiKeys.map((key) => (key.id === id ? { ...key, active } : key)),
    })),
}));
