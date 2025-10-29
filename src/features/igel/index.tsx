import { Navigate, type RouteObject } from "react-router-dom";

import { IgelLayout } from "@/features/igel/pages/igel-layout";
import { IgelKassenbuchPage } from "@/features/igel/pages/igel-kassenbuch-page";
import { IgelPreislistePage } from "@/features/igel/pages/igel-preisliste-page";
import { IgelReportPage } from "@/features/igel/pages/igel-report-page";

export const igelRoute: RouteObject = {
  path: "igel",
  element: <IgelLayout />,
  children: [
    { index: true, element: <Navigate to="kassenbuch" replace /> },
    { path: "kassenbuch", element: <IgelKassenbuchPage /> },
    { path: "preisliste", element: <IgelPreislistePage /> },
    { path: "report", element: <IgelReportPage /> },
  ],
};
