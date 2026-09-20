"use client";

/**
 * BotThinkingIndicator Component
 * Animated indicator shown when the bot is computing its move
 */

import { memo, useEffect, useState } from "react";
import { cn } from "@/lib/helpers";

export interface BotThinkingIndicatorProps {
  botDifficulty?: 'easy' | 'medium' | 'hard';
  /**
   * When false the indicator stays mounted (so its slot keeps its size and the
   * surrounding layout doesn't jump) but fades out and stops animating.
   */
  active?: boolean;
  className?: string;
}

const thinkingMessages = {
  easy: [
    "Bot is thinking...",
    "Choosing a move...",
    "Picking a spot...",
  ],
  medium: [
    "Bot is analyzing...",
    "Calculating options...",
    "Evaluating positions...",
  ],
  hard: [
    "Bot is computing...",
    "Running deep analysis...",
    "Searching game tree...",
    "Optimizing strategy...",
  ],
};

export const BotThinkingIndicator = memo(function BotThinkingIndicator({
  botDifficulty = 'medium',
  active = true,
  className,
}: BotThinkingIndicatorProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = thinkingMessages[botDifficulty];

  useEffect(() => {
    if (!active) return;
    setMessageIndex(0);
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [active, messages.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!active}
      className={cn(
        // Fixed height + centered content: the box never resizes when the
        // message changes or when the indicator toggles on/off.
        "flex h-11 items-center justify-center px-3 rounded-xl",
        "bg-purple-500/10 border border-purple-500/30",
        "transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0 pointer-events-none",
        className,
      )}
    >
      <div className="flex items-center justify-center gap-2.5">
        {/* Animated spinner */}
        <div className="relative w-4 h-4 shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/30" />
          <div
            className={cn(
              "absolute inset-0 rounded-full border-2 border-purple-400 border-t-transparent",
              active && "animate-spin",
            )}
          />
        </div>

        {/* Bot emoji with subtle animation */}
        <span className={cn("text-base leading-none shrink-0", active && "animate-bounce-subtle")}>
          🤖
        </span>

        {/* Cycling message — fixed width so changing text doesn't shift the dots */}
        <span
          key={messageIndex}
          className="w-40 text-left text-sm text-purple-400 font-medium truncate animate-fade-in"
        >
          {messages[messageIndex]}
        </span>

        {/* Thinking dots animation */}
        <div className="flex gap-1 shrink-0">
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              className={cn("w-1.5 h-1.5 rounded-full bg-purple-400", active && "animate-pulse")}
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default BotThinkingIndicator;
