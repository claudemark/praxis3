import type { RouteObject } from "react-router-dom";

import { TimeTrackingPage } from "@/features/time-tracking/pages/time-tracking-page";

export const timeTrackingRoute: RouteObject = {
  path: "zeiterfassung",
  element: <TimeTrackingPage />,
};
