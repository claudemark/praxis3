import type { RouteObject } from "react-router-dom";

import { TextTemplatesPage } from "@/features/text-templates/pages/text-templates-page";

export const textTemplatesRoute: RouteObject = {
  path: "textbausteine",
  element: <TextTemplatesPage />,
};
