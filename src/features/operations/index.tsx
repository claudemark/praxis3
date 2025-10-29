import type { RouteObject } from "react-router-dom";

import { OperationsPage } from "@/features/operations/pages/operations-page";

export const operationsRoute: RouteObject = {
  path: "operationen",
  element: <OperationsPage />,
};
