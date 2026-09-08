"use client";

/**
 * Onboarding Modal Component
 * Interactive first-time user experience
 */

import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/helpers";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";

export function OnboardingModal() {
  const {
    isOpen,
    currentStep,
    currentStepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep,
    complete,
    skip,
    close,
  } = useOnboarding();

  const router = useRouter();

  if (!isOpen) return null;

  const handleComplete = () => {
    complete();
    if (currentStep?.action?.href) {
      router.push(currentStep.action.href as Route);
    }
  };

  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[250] bg-surface-overlay backdrop-blur-sm animate-fade-in"
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[251] flex items-center justify-center p-4">
        <div
          className={cn(
            "relative w-full max-w-2xl",
            "bg-surface-elevated rounded-xl shadow-2xl",
            "border-2 border-accent-primary",
            "animate-scale-in",
            "flex flex-col max-h-[90vh]"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-board-grid rounded-t-xl overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-primary to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-0">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span>Step {currentStepIndex + 1} of {totalSteps}</span>
            </div>
            <button
              onClick={skip}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Skip tutorial
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Icon */}
            {currentStep?.icon && (
              <div className="text-6xl mb-6 text-center animate-bounce-subtle">
                {currentStep.icon}
              </div>
            )}

            {/* Title */}
            <h2
              id="onboarding-title"
              className="text-3xl font-bold text-center mb-4 text-text-primary"
            >
              {currentStep?.title}
            </h2>

            {/* Description */}
            <p className="text-lg text-center text-text-secondary max-w-xl mx-auto leading-relaxed">
              {currentStep?.description}
            </p>

            {/* Visual Indicators for specific steps */}
            {currentStepIndex === 1 && <GameModesPreview />}
            {currentStepIndex === 2 && <PlayOptionsPreview />}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-board-grid">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={isFirstStep}
              className="min-w-[100px]"
            >
              ← Back
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentStepIndex
                      ? "bg-accent-primary w-8"
                      : index < currentStepIndex
                        ? "bg-accent-primary/50"
                        : "bg-board-grid"
                  )}
                />
              ))}
            </div>

            {isLastStep ? (
              <Button
                onClick={handleComplete}
                className="min-w-[100px] bg-gradient-to-r from-accent-primary to-purple-600"
              >
                {currentStep?.action?.label || "Get Started"} →
              </Button>
            ) : (
              <Button onClick={nextStep} className="min-w-[100px]">
                Next →
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================
// Preview Components
// ============================================

function GameModesPreview() {
  return (
    <div className="mt-8 grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
      <div className="p-4 rounded-lg bg-surface-base border border-board-grid">
        <div className="text-2xl mb-2">🎯</div>
        <h3 className="font-semibold text-text-primary mb-1">Expanding Mode</h3>
        <p className="text-sm text-text-secondary">
          Board grows each round — long-term strategy
        </p>
      </div>
      <div className="p-4 rounded-lg bg-accent-primary/10 border-2 border-accent-primary">
        <div className="text-2xl mb-2">⚡</div>
        <h3 className="font-semibold text-text-primary mb-1">
          Sliding Mode <span className="text-accent-primary">⭐</span>
        </h3>
        <p className="text-sm text-text-secondary">
          Marks disappear — no draws, endless strategy
        </p>
      </div>
    </div>
  );
}

function PlayOptionsPreview() {
  return (
    <div className="mt-8 grid md:grid-cols-3 gap-3 max-w-2xl mx-auto">
      <div className="p-3 rounded-lg bg-surface-base border border-board-grid text-center">
        <div className="text-3xl mb-2">🌐</div>
        <h3 className="font-semibold text-text-primary text-sm mb-1">Online</h3>
        <p className="text-xs text-text-muted">Play with anyone</p>
      </div>
      <div className="p-3 rounded-lg bg-surface-base border border-board-grid text-center">
        <div className="text-3xl mb-2">🏆</div>
        <h3 className="font-semibold text-text-primary text-sm mb-1">Ranked</h3>
        <p className="text-xs text-text-muted">Climb the ladder</p>
      </div>
      <div className="p-3 rounded-lg bg-surface-base border border-board-grid text-center">
        <div className="text-3xl mb-2">🤖</div>
        <h3 className="font-semibold text-text-primary text-sm mb-1">AI Bot</h3>
        <p className="text-xs text-text-muted">Practice offline</p>
      </div>
    </div>
  );
}

/**
 * Onboarding Provider Component
 * Wraps the app and shows onboarding when needed
 */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OnboardingModal />
    </>
  );
}
