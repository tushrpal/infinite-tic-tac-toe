/** The ∞ glyph used in the logo. */
export function InfinityMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M16 8c-2.5-3.2-4.6-5-7.2-5C5.6 3 3 5.2 3 8s2.6 5 5.8 5c2.6 0 4.7-1.8 7.2-5s4.6-5 7.2-5C26.4 3 29 5.2 29 8s-2.6 5-5.8 5c-2.6 0-4.7-1.8-7.2-5z" />
    </svg>
  );
}
