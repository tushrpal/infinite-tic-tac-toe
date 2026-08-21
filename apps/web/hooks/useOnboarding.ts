/**
 * Onboarding System
 * Manages first-time user experience
 */

import { useState, useEffect } from 'react';

// ============================================
// Storage Keys
// ============================================

const ONBOARDING_STORAGE_KEY = 'infinite-ttt-onboarding';

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  skipped: boolean;
  completedAt?: number;
}

// ============================================
// Onboarding Steps
// ============================================

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon?: string;
  action?: {
    label: string;
    href?: string;
  };
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Infinite Tic-Tac-Toe! 🎮',
    description: 'Get ready to experience a modern twist on the classic game. We\'ll show you around in just a few steps.',
    icon: '👋',
  },
  {
    id: 'game-modes',
    title: 'Choose Your Game Mode',
    description: 'Play Classic mode for traditional rules, or try Sliding mode where pieces disappear after 6 moves, creating an endless strategic challenge!',
    icon: '♾️',
  },
  {
    id: 'play-options',
    title: 'Multiple Ways to Play',
    description: 'Challenge real players online, compete in ranked matches to climb the leaderboard, or practice against AI opponents of varying difficulty.',
    icon: '🎯',
  },
  {
    id: 'features',
    title: 'Powerful Features',
    description: 'Track your progress with detailed stats, watch replays of your matches, spectate live games, and connect with friends.',
    icon: '⚡',
  },
  {
    id: 'ready',
    title: 'You\'re All Set! 🚀',
    description: 'Ready to start your first match? You can always access the full tutorial from the "How to Play" section in the menu.',
    icon: '🎉',
    action: {
      label: 'Start Playing',
      href: '/play',
    },
  },
];

// ============================================
// Storage Functions
// ============================================

export function getOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') {
    return {
      completed: false,
      currentStep: 0,
      skipped: false,
    };
  }

  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) {
      return {
        completed: false,
        currentStep: 0,
        skipped: false,
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('[Onboarding] Failed to load state:', error);
    return {
      completed: false,
      currentStep: 0,
      skipped: false,
    };
  }
}

export function saveOnboardingState(state: OnboardingState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[Onboarding] Failed to save state:', error);
  }
}

export function completeOnboarding(): void {
  saveOnboardingState({
    completed: true,
    currentStep: onboardingSteps.length,
    skipped: false,
    completedAt: Date.now(),
  });
}

export function skipOnboarding(): void {
  saveOnboardingState({
    completed: true,
    currentStep: 0,
    skipped: true,
    completedAt: Date.now(),
  });
}

export function resetOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}

export function shouldShowOnboarding(): boolean {
  const state = getOnboardingState();
  return !state.completed;
}

// ============================================
// React Hook
// ============================================

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(() => getOnboardingState());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only check once on mount, not on every render
    if (!state.completed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []); // Empty deps - only run once

  const nextStep = () => {
    const newStep = Math.min(state.currentStep + 1, onboardingSteps.length - 1);
    const newState = { ...state, currentStep: newStep };
    setState(newState);
    saveOnboardingState(newState);
  };

  const prevStep = () => {
    const newStep = Math.max(state.currentStep - 1, 0);
    const newState = { ...state, currentStep: newStep };
    setState(newState);
    saveOnboardingState(newState);
  };

  const complete = () => {
    completeOnboarding();
    setState({ ...state, completed: true });
    setIsOpen(false);
  };

  const skip = () => {
    skipOnboarding();
    setState({ ...state, completed: true, skipped: true });
    setIsOpen(false);
  };

  const restart = () => {
    const newState: OnboardingState = {
      completed: false,
      currentStep: 0,
      skipped: false,
    };
    setState(newState);
    saveOnboardingState(newState);
    setIsOpen(true);
  };

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    state,
    isOpen,
    currentStep: onboardingSteps[state.currentStep],
    currentStepIndex: state.currentStep,
    totalSteps: onboardingSteps.length,
    isFirstStep: state.currentStep === 0,
    isLastStep: state.currentStep === onboardingSteps.length - 1,
    nextStep,
    prevStep,
    complete,
    skip,
    restart,
    open,
    close,
  };
}
