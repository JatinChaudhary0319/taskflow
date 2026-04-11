import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.tsx";

import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./theme/theme-provider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <App />
      <Toaster position="top-center" toastOptions={{ className: "text-sm" }} />
    </ThemeProvider>
  </StrictMode>,
);
