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
        className="block w-full text-left group"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl bg-surface-elevated border border-board-grid hover:border-accent-primary/50 transition-all hover:shadow-lg hover:shadow-accent-primary/5">
          {/* Icon */}
          <div className="flex items-center gap-4 sm:contents">
            <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary group-hover:bg-accent-primary/20 transition-colors">
              <PrivateMatchIcon />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-lg sm:text-xl font-semibold group-hover:text-accent-primary transition-colors">
                  Private Match
                </h2>
                <span className="text-xs font-medium text-purple-400">Invite Code</span>
              </div>
              <p className="text-sm text-text-secondary">
                Generate a shareable code and play a one-off match with anyone
              </p>
            </div>

            {/* Arrow */}
            <div className="hidden sm:flex flex-shrink-0 text-text-muted group-hover:text-accent-primary group-hover:translate-x-1 transition-all">
              <ArrowIcon />
            </div>
          </div>
        </div>
      </button>

      <PrivateMatchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

function PrivateMatchIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
