import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { primaryNavigation, secondaryNavigation, tertiaryNavigation } from "@/app/navigation";
import { AppSidebar } from "@/components/navigation/sidebar";
import { TopBar } from "@/components/navigation/top-bar";
import { useEmployeeDirectory } from "@/features/employees/store/employee-store";
import { useConsultationStore } from "@/features/consultations/store/consultations-store";
import { useOperationStore } from "@/features/operations/store/operations-store";
import { useInventoryStore } from "@/features/inventory/store/inventory-store";
import { useTaskStore } from "@/features/tasks/store/task-store";
import { useCashDrawerStore } from "@/features/cash-drawer/store/cash-drawer-store";
import { useIgelStore } from "@/features/igel/store/igel-store";
import { useTextTemplateStore } from "@/features/text-templates/store/text-templates-store";
import { useKiPromptStore } from "@/features/ki-prompts/store/ki-prompts-store";
import { useBillingStore } from "@/features/billing/store/billing-store";
import { useMedAssistStore } from "@/features/medassist/store/medassist-store";
import { useTimeTrackingStore } from "@/features/time-tracking/store/time-tracking-store";

export function RootLayout() {
  const fetchEmployees = useEmployeeDirectory((state) => state.fetchEmployees);
  const employeesInitialized = useEmployeeDirectory((state) => state.initialized);
  const fetchConsultations = useConsultationStore((state) => state.fetchConsultations);
  const consultationsInitialized = useConsultationStore((state) => state.initialized);
  const fetchOperations = useOperationStore((state) => state.fetchOperations);
  const operationsInitialized = useOperationStore((state) => state.initialized);
  const fetchInventory = useInventoryStore((state) => state.fetchInventory);
  const inventoryInitialized = useInventoryStore((state) => state.initialized);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const tasksInitialized = useTaskStore((state) => state.initialized);
  const fetchCashDrawer = useCashDrawerStore((state) => state.fetchCashDrawer);
  const cashDrawerInitialized = useCashDrawerStore((state) => state.initialized);
  const fetchIgel = useIgelStore((state) => state.fetchIgel);
  const igelInitialized = useIgelStore((state) => state.initialized);
  const fetchTemplates = useTextTemplateStore((state) => state.fetchTemplates);
  const templatesInitialized = useTextTemplateStore((state) => state.initialized);
  const fetchPrompts = useKiPromptStore((state) => state.fetchPrompts);
  const promptsInitialized = useKiPromptStore((state) => state.initialized);
  const fetchBilling = useBillingStore((state) => state.fetchBilling);
  const billingInitialized = useBillingStore((state) => state.initialized);
  const fetchSessions = useMedAssistStore((state) => state.fetchSessions);
  const medassistInitialized = useMedAssistStore((state) => state.initialized);
  const fetchTimeTracking = useTimeTrackingStore((state) => state.fetchTimeTracking);
  const timeTrackingInitialized = useTimeTrackingStore((state) => state.initialized);

  useEffect(() => {
    if (!employeesInitialized) {
      void fetchEmployees();
    }
  }, [fetchEmployees, employeesInitialized]);

  useEffect(() => {
    if (!consultationsInitialized) {
      void fetchConsultations();
    }
  }, [fetchConsultations, consultationsInitialized]);

  useEffect(() => {
    if (!operationsInitialized) {
      void fetchOperations();
    }
  }, [fetchOperations, operationsInitialized]);

  useEffect(() => {
    if (!inventoryInitialized) {
      void fetchInventory();
    }
  }, [fetchInventory, inventoryInitialized]);

  useEffect(() => {
    if (!tasksInitialized) {
      void fetchTasks();
    }
  }, [fetchTasks, tasksInitialized]);

  useEffect(() => {
    if (!cashDrawerInitialized) {
      void fetchCashDrawer();
    }
  }, [fetchCashDrawer, cashDrawerInitialized]);

  useEffect(() => {
    if (!igelInitialized) {
      void fetchIgel();
    }
  }, [fetchIgel, igelInitialized]);

  useEffect(() => {
    if (!templatesInitialized) {
      void fetchTemplates();
    }
  }, [fetchTemplates, templatesInitialized]);

  useEffect(() => {
    if (!promptsInitialized) {
      void fetchPrompts();
    }
  }, [fetchPrompts, promptsInitialized]);

  useEffect(() => {
    if (!billingInitialized) {
      void fetchBilling();
    }
  }, [fetchBilling, billingInitialized]);

  useEffect(() => {
    if (!medassistInitialized) {
      void fetchSessions();
    }
  }, [fetchSessions, medassistInitialized]);

  useEffect(() => {
    if (!timeTrackingInitialized) {
      void fetchTimeTracking();
    }
  }, [fetchTimeTracking, timeTrackingInitialized]);

  return (
    <div className="flex min-h-screen bg-surface-50 text-foreground">
      <AppSidebar
        primary={primaryNavigation}
        secondary={secondaryNavigation}
        tertiary={tertiaryNavigation}
      />
      <div className="relative flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 bg-gradient-to-br from-white via-surface-50 to-surface-100/60">
          <div className="mx-auto w-full max-w-[1440px] px-6 pb-12 pt-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
