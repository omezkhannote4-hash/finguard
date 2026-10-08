"use client";

import { useEffect } from "react";

// Registers public/sw.js, which keeps the app's pages so they still open offline.
// Production only, so development never serves a saved copy of old code.
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
    } else {
      // One left over from running a production build on this address would serve stale files.
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((registration) => registration.unregister()));
    }
  }, []);

  return null;
}
