import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";

import { ThemeProvider } from "@/app/providers/theme-provider";
import { appRouter } from "@/app/router";
import { SplashScreen } from "@/components/navigation/splash-screen";

export function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<SplashScreen />}>
        <RouterProvider router={appRouter} />
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
