"use client";

/**
 * PrivateMatchCard
 * Play-menu entry point that opens PrivateMatchModal to create a shareable match code
 */

import { useState } from "react";
import { PrivateMatchModal } from "./PrivateMatchModal";

export function PrivateMatchCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="block w-full h-full text-left group"
      >
        <div className="glass-panel glass-panel--interactive h-full p-4 sm:p-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-primary/15 text-accent-primary transition-colors group-hover:bg-accent-primary/25">
            <PrivateMatchIcon />
          </div>
          <div className="w-full">
            <h2 className="font-semibold text-text-primary">Private Match</h2>
            <p className="mt-1 mb-3 text-xs text-text-secondary">
              Generate a shareable code and play with anyone.
            </p>
            <span className="inline-flex h-8 w-full items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs font-medium text-text-primary transition-colors group-hover:border-accent-primary/50 group-hover:bg-accent-primary/10">
              Create Code
            </span>
          </div>
        </div>
      </button>

      <PrivateMatchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

function PrivateMatchIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}
