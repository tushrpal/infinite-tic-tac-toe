"use client";

/**
 * Button Component
 * Reusable button with multiple variants
 */

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/helpers";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles = cn(
      "inline-flex items-center justify-center gap-2",
      "font-medium rounded-lg",
      "transition-all duration-200 ease-out",
      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-base",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
      "active:scale-[0.98]",
    );

    const variantStyles = {
      primary: cn(
        "bg-accent-primary text-white",
        "hover:bg-opacity-90",
        "focus:ring-accent-primary",
        "shadow-lg shadow-accent-primary/20",
      ),
      secondary: cn(
        "bg-surface-elevated text-text-primary",
        "border border-board-grid",
        "hover:bg-board-grid",
        "focus:ring-text-muted",
      ),
      ghost: cn(
        "bg-transparent text-text-secondary",
        "hover:bg-surface-elevated hover:text-text-primary",
        "focus:ring-text-muted",
      ),
      danger: cn(
        "bg-accent-error text-white",
        "hover:bg-opacity-90",
        "focus:ring-accent-error",
        "shadow-lg shadow-accent-error/20",
      ),
      success: cn(
        "bg-accent-success text-white",
        "hover:bg-opacity-90",
        "focus:ring-accent-success",
        "shadow-lg shadow-accent-success/20",
      ),
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-base",
      lg: "h-12 px-6 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner size={size} />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

// Loading spinner component
function LoadingSpinner({ size }: { size: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <svg
      className={cn("animate-spin", sizeMap[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default Button;
