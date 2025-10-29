import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { primaryNavigation, secondaryNavigation, tertiaryNavigation } from "@/app/navigation";
import { AppSidebar } from "@/components/navigation/sidebar";
import { TopBar } from "@/components/navigation/top-bar";
import { useEmployeeDirectory } from "@/features/employees/store/employee-store";

export function RootLayout() {
  const fetchEmployees = useEmployeeDirectory((state) => state.fetchEmployees);
  const initialized = useEmployeeDirectory((state) => state.initialized);

  useEffect(() => {
    if (!initialized) {
      void fetchEmployees();
    }
  }, [fetchEmployees, initialized]);

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
