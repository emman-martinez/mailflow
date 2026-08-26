import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProviders } from "./providers/AppProviders";
import "./index.css";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
          <p>Something went wrong. Please reload the application.</p>
        </main>
      }
    >
      <AppProviders>
        <App />
      </AppProviders>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
