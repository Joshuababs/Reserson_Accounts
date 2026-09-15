import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { NotificationProvider } from "@/components/notifications";
import { SessionProvider } from "@/session";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
