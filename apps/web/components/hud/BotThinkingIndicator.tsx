"use client";

/**
 * BotThinkingIndicator Component
 * Animated indicator shown when the bot is computing its move
 */

import { memo, useEffect, useState } from "react";
import { cn } from "@/lib/helpers";

export interface BotThinkingIndicatorProps {
  botDifficulty?: 'easy' | 'medium' | 'hard';
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
  className,
}: BotThinkingIndicatorProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = thinkingMessages[botDifficulty];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div
      className={cn(
        "p-3 rounded-lg",
        "bg-purple-500/10 border border-purple-500/30",
        "animate-pulse",
        className,
      )}
    >
      <div className="flex items-center justify-center gap-3">
        {/* Animated spinner */}
        <div className="relative w-5 h-5">
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/30" />
          <div className="absolute inset-0 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
        </div>

        {/* Bot emoji with subtle animation */}
        <span className="text-lg animate-bounce-subtle">🤖</span>

        {/* Cycling message */}
        <span className="text-sm text-purple-400 font-medium animate-fade-in">
          {messages[messageIndex]}
        </span>

        {/* Thinking dots animation */}
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
});

export default BotThinkingIndicator;
