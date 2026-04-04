"use client";

import { useEffect } from "react";
import { ensurePlayer } from "@/lib/player";

export function PlayerBootstrap() {
  useEffect(() => {
    // Bootstrap identity opportunistically; avoid crashing app startup if backend is down.
    void ensurePlayer().catch((error) => {
      console.warn("Player bootstrap skipped:", error);
    });
  }, []);

  return null;
}
