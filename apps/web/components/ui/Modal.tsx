"use client";

/**
 * Modal Component
 * Accessible modal dialog with animations
 */

import { Fragment, useEffect, useCallback, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/helpers";
import { UI } from "@/lib/constants";
import { useFocusTrap, useFocusReturn } from "@/lib/accessibility";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  footer,
}: ModalProps) {
  // Accessibility: trap focus within modal and return focus on close
  const modalRef = useFocusTrap(isOpen);
  useFocusReturn(isOpen);

  // Portal target is only available after mount (avoids SSR document access)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeOnEscape, isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose],
  );

  if (!isOpen || !mounted) return null;

  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  // Full screen on mobile for better UX
  const isMobileFullScreen = size === "lg" || size === "xl";

  return createPortal(
    <Fragment>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[200]",
          "bg-surface-overlay backdrop-blur-sm",
          "animate-fade-in",
        )}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className={cn(
          "fixed inset-0 z-[201]",
          "flex items-center justify-center",
          "p-4 sm:p-6",
          // Mobile: reduce padding for more space
          "max-sm:p-2",
        )}
        onClick={handleOverlayClick}
      >
        {/* Modal Content */}
        <div
          ref={modalRef as React.RefObject<HTMLDivElement>}
          className={cn(
            "relative w-full",
            sizeStyles[size],
            "bg-surface-elevated",
            "rounded-xl shadow-2xl",
            "border border-board-grid",
            "animate-scale-in",
            // Mobile: fullscreen for large modals
            isMobileFullScreen && "max-sm:h-full max-sm:max-w-full max-sm:rounded-none",
            // Better scrolling on mobile
            "max-h-[90vh] sm:max-h-[85vh]",
            "flex flex-col",
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby="modal-description"
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-board-grid flex-shrink-0">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-text-primary"
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={cn(
                    "p-1.5 rounded-lg",
                    "text-text-secondary hover:text-text-primary",
                    "hover:bg-board-grid",
                    "transition-colors duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-accent-primary",
                    // Larger touch target on mobile
                    "min-w-[44px] min-h-[44px] flex items-center justify-center",
                  )}
                  aria-label="Close modal"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          )}

          {/* Body - Scrollable */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-4 border-t border-board-grid flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Fragment>,
    document.body,
  );
}

function CloseIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export default Modal;
