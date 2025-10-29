import type { RouteObject } from "react-router-dom";

import { CashDrawerPage } from "@/features/cash-drawer/pages/cash-drawer-page";

export const cashDrawerRoute: RouteObject = {
  path: "barkasse",
  element: <CashDrawerPage />,
};
