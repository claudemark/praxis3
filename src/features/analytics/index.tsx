import type { RouteObject } from "react-router-dom";

import { AnalyticsPage } from "@/features/analytics/pages/analytics-page";

export const analyticsRoute: RouteObject = {
  path: "analytics",
  element: <AnalyticsPage />,
};
