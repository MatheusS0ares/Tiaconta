"use client";

import { useEffect } from "react";

/** Registra o service worker em produção (em dev ele atrapalharia o hot reload). */
export function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
