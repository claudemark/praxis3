import type { RouteObject } from "react-router-dom";

import { SettingsPage } from "@/features/settings/pages/settings-page";

export const settingsRoute: RouteObject = {
  path: "einstellungen",
  element: <SettingsPage />,
};
