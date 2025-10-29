import type { RouteObject } from "react-router-dom";

import { ConsultationTrackerPage } from "@/features/consultations/pages/consultations-page";

export const consultationsRoute: RouteObject = {
  path: "consultations",
  element: <ConsultationTrackerPage />,
};
