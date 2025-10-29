import type { RouteObject } from "react-router-dom";

import { InventoryPage } from "@/features/inventory/pages/inventory-page";

export const inventoryRoute: RouteObject = {
  path: "lager",
  element: <InventoryPage />,
};
