import type { RouteObject } from "react-router-dom";

import { IgelPosPage } from "@/features/igel/pages/igel-pos-page";

export const igelRoute: RouteObject = {
  path: "igel",
  element: <IgelPosPage />,
};
