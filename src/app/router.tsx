import { createBrowserRouter, Navigate, isRouteErrorResponse, useRouteError } from "react-router-dom";

import { RootLayout } from "@/app/layouts/root-layout";
import { dashboardRoute } from "@/features/dashboard";
import { tasksRoute } from "@/features/tasks";
import { timeTrackingRoute } from "@/features/time-tracking";
import { billingRoute } from "@/features/billing";
import { analyticsRoute } from "@/features/analytics";
import { medAssistRoute } from "@/features/medassist";
import { cashDrawerRoute } from "@/features/cash-drawer";
import { textTemplatesRoute } from "@/features/text-templates";
import { inventoryRoute } from "@/features/inventory";
import { igelRoute } from "@/features/igel";
import { kiPromptRoute } from "@/features/ki-prompts";
import { operationsRoute } from "@/features/operations";
import { consultationsRoute } from "@/features/consultations";
import { ComingSoonView } from "@/components/navigation/coming-soon";
import { Button } from "@/components/ui/button";
import { settingsRoute } from "@/features/settings";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      dashboardRoute,
      tasksRoute,
      timeTrackingRoute,
      billingRoute,
      analyticsRoute,
      medAssistRoute,
      textTemplatesRoute,
      inventoryRoute,
      igelRoute,
      cashDrawerRoute,
      kiPromptRoute,
      operationsRoute,
      consultationsRoute,
      { path: "qualitaet", element: <ComingSoonView title="Qualitaetssicherung" /> },
      { path: "reports", element: <ComingSoonView title="Berichte" /> },
      settingsRoute,
      { path: "*", element: <NotFoundView /> },
    ],
  },
]);

function RouteErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  if (isRouteErrorResponse(error)) {
    const message =
      typeof error.data === "string"
        ? error.data
        : "Wir konnten diese Ansicht nicht laden. Bitte versuchen Sie es erneut.";

    return <ErrorScreen title={`${error.status} - ${error.statusText}`} description={message} />;
  }

  const message =
    error instanceof Error
      ? error.message
      : "Wir konnten diese Ansicht nicht laden. Bitte versuchen Sie es erneut.";

  return <ErrorScreen title="Etwas ist schiefgelaufen" description={message} />;
}

function NotFoundView() {
  return (
    <ErrorScreen
      title="Seite nicht gefunden"
      description="Die angeforderte Ansicht existiert nicht oder wurde verschoben. Nutzen Sie die Navigation, um fortzufahren."
      hideReload
    />
  );
}

function ErrorScreen({
  title,
  description,
  hideReload,
}: {
  title: string;
  description: string;
  hideReload?: boolean;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground/90">{title}</h1>
        <p className="max-w-md text-sm text-muted-foreground/80">{description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Zurueck
        </Button>
        {!hideReload ? (
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Neu laden
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          Zum Dashboard
        </Button>
      </div>
    </div>
  );
}

