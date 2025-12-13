import { StrictMode, Fragment } from "react";
import { createRoot } from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import App from "./App.tsx";
import ErrorBoundary from "./shared/components/ErrorBoundary.tsx";
import "./index.css";
import { Provider as UiProvider } from "./components/ui/provider.tsx";
import { Toaster } from "./components/ui/toaster.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

const convexClient = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL as string
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary
      fallback={
        <Fragment>
          <h1>Something went wrong.</h1>
          <p>Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </Fragment>
      }
    >
      <ConvexAuthProvider client={convexClient}>
        <UiProvider>
          <App />
          <Toaster />
        </UiProvider>
      </ConvexAuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
