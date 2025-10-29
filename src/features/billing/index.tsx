import type { RouteObject } from "react-router-dom";

import { BillingPage } from "@/features/billing/pages/billing-page";

export const billingRoute: RouteObject = {
  path: "abrechnung",
  element: <BillingPage />,
};
