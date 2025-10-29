import type { RouteObject } from "react-router-dom";

import { MedAssistPage } from "@/features/medassist/pages/medassist-page";

export const medAssistRoute: RouteObject = {
  path: "ai-medassist",
  element: <MedAssistPage />,
};
