import type { RouteObject } from "react-router-dom";

import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";

export const dashboardRoute: RouteObject = {
  path: "dashboard",
  element: <DashboardPage />,
};
