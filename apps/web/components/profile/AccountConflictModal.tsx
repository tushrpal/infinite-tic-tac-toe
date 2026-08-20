"use client";

type AccountConflictModalProps = {
  isOpen: boolean;
  providerName: string;
  existingAccount: {
    username: string;
    displayName: string | null;
  };
  onSwitchToExisting: () => void;
  onStayWithCurrent: () => void;
  isProcessing: boolean;
};

export function AccountConflictModal({
  isOpen,
  providerName,
  existingAccount,
  onSwitchToExisting,
  onStayWithCurrent,
  isProcessing,
}: AccountConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-board-grid bg-surface-elevated p-6 shadow-2xl">
        <div className="mb-4">
          <div className="text-2xl mb-2">⚠️</div>
          <h2 className="text-xl font-bold">Account Already Linked</h2>
        </div>

        <div className="mb-6 space-y-3 text-sm text-text-secondary">
          <p>
            This {providerName} account is already connected to another player account:
          </p>
          <div className="rounded-lg bg-board-grid/30 p-3 border border-board-grid">
            <div className="font-semibold text-text-primary">
              {existingAccount.displayName || existingAccount.username}
            </div>
            <div className="text-xs text-text-muted">@{existingAccount.username}</div>
          </div>
          <p>What would you like to do?</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onSwitchToExisting}
            disabled={isProcessing}
            className="w-full rounded-lg bg-accent-primary px-4 py-3 font-semibold text-white hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Switching..." : "Switch to Existing Account"}
          </button>

          <button
            onClick={onStayWithCurrent}
            disabled={isProcessing}
            className="w-full rounded-lg bg-board-grid px-4 py-3 font-semibold text-text-primary hover:bg-board-grid/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stay with Current Account
          </button>
        </div>

        <div className="mt-4 text-xs text-text-muted text-center">
          💡 Switching will log you into the existing account and you'll lose access to your current anonymous account.
        </div>
      </div>
    </div>
  );
}
