"use client";

import { useEffect } from "react";

/** Marca <html data-hidratado> quando o React assume a página (usado por testes E2E e CSS). */
export function Hidratado() {
  useEffect(() => {
    document.documentElement.dataset.hidratado = "1";
  }, []);
  return null;
}
