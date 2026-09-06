"use client";

type AccountLinkingBannerProps = {
  onLinkClick: () => void;
  onDismiss?: () => void;
};

export function AccountLinkingBanner({ onLinkClick, onDismiss }: AccountLinkingBannerProps) {
  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 flex items-start gap-3">
      <div className="text-2xl">⚠️</div>
      <div className="flex-1">
        <h4 className="font-semibold text-sm mb-1">Account Not Secured</h4>
        <p className="text-xs text-text-secondary mb-3">
          Your progress is only saved in this browser. Link your account to prevent data loss.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onLinkClick}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-primary text-white hover:bg-accent-primary/90"
          >
            Link Account
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-text-secondary hover:text-text-primary"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
