import type { RouteObject } from "react-router-dom";

import { KiPromptLibraryPage } from "@/features/ki-prompts/pages/ki-prompts-page";

export const kiPromptRoute: RouteObject = {
  path: "ki-prompts",
  element: <KiPromptLibraryPage />,
};
