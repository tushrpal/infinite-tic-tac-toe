"use client";

/**
 * How to Play / Tutorial Page
 * Interactive guide for new players
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/helpers";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";
import {
  tutorialSections,
  basicRules,
  gameModes,
  winPatterns,
  strategyTips,
  faq,
  type WinPattern,
} from "@/lib/tutorialContent";

export default function HowToPlayPage() {
  const [activeSection, setActiveSection] = useState("basics");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <main className="flex-1 bg-surface-base">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            How to Play
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Master the art of Infinite Tic-Tac-Toe with our comprehensive guide
          </p>
        </div>

        {/* Section Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {tutorialSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                "flex items-center gap-2",
                "min-w-[140px] justify-center",
                activeSection === section.id
                  ? "bg-accent-primary text-white shadow-lg scale-105"
                  : "bg-surface-elevated text-text-secondary hover:bg-board-grid hover:text-text-primary"
              )}
            >
              <span className="text-xl">{section.icon}</span>
              <span>{section.title}</span>
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="bg-surface-elevated rounded-xl border border-board-grid p-6 md:p-8">
          {activeSection === "basics" && <BasicsSection />}
          {activeSection === "modes" && <ModesSection />}
          {activeSection === "winning" && <WinningSection />}
          {activeSection === "strategy" && <StrategySection />}
        </div>

        {/* FAQ Section (Always visible) */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6 text-text-primary text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faq.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
                isExpanded={expandedFaq === index}
                onToggle={() =>
                  setExpandedFaq(expandedFaq === index ? null : index)
                }
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold mb-4 text-text-primary">
            Ready to Play?
          </h3>
          <p className="text-text-secondary mb-6">
            Put your knowledge to the test and start your first match!
          </p>
          <Link href={ROUTES.PLAY}>
            <Button size="lg" className="text-lg px-8">
              Start Playing Now
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

// ============================================
// Section Components
// ============================================

function BasicsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-text-primary">
          📚 Basic Rules
        </h2>
        <p className="text-text-secondary mb-6">
          Tic-Tac-Toe is a simple game, but mastering it takes strategy and
          practice. Here are the fundamentals:
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {basicRules.map((rule, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-surface-base border border-board-grid"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-accent-primary/20 text-accent-primary font-bold flex items-center justify-center">
                {index + 1}
              </div>
              <h3 className="font-semibold text-text-primary">{rule.title}</h3>
            </div>
            <p className="text-sm text-text-secondary">{rule.description}</p>
          </div>
        ))}
      </div>

      {/* Visual Example */}
      <div className="mt-8 p-6 bg-board-bg rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-text-primary text-center">
          Example Game Board
        </h3>
        <div className="max-w-xs mx-auto">
          <ExampleBoard />
        </div>
        <p className="text-sm text-text-secondary text-center mt-4">
          Click on empty cells to place your mark (X or O)
        </p>
      </div>
    </div>
  );
}

function ModesSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-text-primary">
          🎮 Game Modes
        </h2>
        <p className="text-text-secondary mb-6">
          Choose how you want to play. Each mode offers a unique challenge!
        </p>
      </div>

      <div className="space-y-6">
        {gameModes.map((mode) => (
          <div
            key={mode.id}
            className={cn(
              "p-6 rounded-lg border-2",
              mode.highlight
                ? "bg-accent-primary/10 border-accent-primary"
                : "bg-surface-base border-board-grid"
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{mode.icon}</span>
              <div>
                <h3 className="text-xl font-bold text-text-primary">
                  {mode.name}
                </h3>
                {mode.highlight && (
                  <span className="text-sm text-accent-primary font-medium">
                    ⭐ Featured Mode
                  </span>
                )}
              </div>
            </div>
            <p className="text-text-secondary mb-4">{mode.description}</p>
            <div className="grid md:grid-cols-2 gap-2">
              {mode.rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-text-secondary"
                >
                  <span className="text-accent-success mt-0.5">✓</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WinningSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-text-primary">
          🏆 How to Win
        </h2>
        <p className="text-text-secondary mb-6">
          Get three of your marks in a row to win. Here are all the winning
          patterns:
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {winPatterns.map((pattern) => (
          <WinPatternDisplay key={pattern.name} pattern={pattern} />
        ))}
      </div>

      <div className="mt-8 p-6 bg-accent-success/10 border border-accent-success rounded-lg">
        <h3 className="font-semibold text-accent-success mb-2">
          💡 Pro Tip
        </h3>
        <p className="text-sm text-text-secondary">
          The center cell is part of 4 different winning patterns (horizontal,
          vertical, and both diagonals). Control the center, control the game!
        </p>
      </div>
    </div>
  );
}

function StrategySection() {
  const highPriority = strategyTips.filter((tip) => tip.priority === "high");
  const mediumPriority = strategyTips.filter((tip) => tip.priority === "medium");
  const lowPriority = strategyTips.filter((tip) => tip.priority === "low");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-text-primary">
          💡 Strategy Tips
        </h2>
        <p className="text-text-secondary mb-6">
          Elevate your game with these strategic insights from expert players.
        </p>
      </div>

      {/* High Priority Tips */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-primary flex items-center gap-2">
          <span className="text-accent-error">🔥</span>
          Essential Strategies
        </h3>
        <div className="space-y-3">
          {highPriority.map((tip, index) => (
            <StrategyTip key={index} tip={tip} />
          ))}
        </div>
      </div>

      {/* Medium Priority Tips */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-text-primary flex items-center gap-2">
          <span className="text-accent-warning">⚡</span>
          Advanced Tactics
        </h3>
        <div className="space-y-3">
          {mediumPriority.map((tip, index) => (
            <StrategyTip key={index} tip={tip} />
          ))}
        </div>
      </div>

      {/* Low Priority Tips */}
      {lowPriority.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-text-primary flex items-center gap-2">
            <span className="text-accent-primary">💫</span>
            Expert Insights
          </h3>
          <div className="space-y-3">
            {lowPriority.map((tip, index) => (
              <StrategyTip key={index} tip={tip} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

function ExampleBoard() {
  const [cells, setCells] = useState<Array<"X" | "O" | null>>([
    "X",
    null,
    "O",
    null,
    "X",
    null,
    "O",
    null,
    null,
  ]);

  return (
    <div className="grid grid-cols-3 gap-2 p-4 bg-board-grid rounded-lg">
      {cells.map((cell, index) => (
        <div
          key={index}
          className="aspect-square bg-board-cell rounded flex items-center justify-center text-2xl font-bold cursor-pointer hover:bg-board-cellHover transition-colors"
        >
          {cell === "X" && (
            <span className="text-playerX-primary">X</span>
          )}
          {cell === "O" && (
            <span className="text-playerO-primary">O</span>
          )}
        </div>
      ))}
    </div>
  );
}

function WinPatternDisplay({ pattern }: { pattern: WinPattern }) {
  const cells = Array(9).fill(null);
  pattern.pattern.forEach(([row, col]) => {
    cells[row * 3 + col] = "X";
  });

  return (
    <div className="p-4 bg-surface-base rounded-lg border border-board-grid">
      <h3 className="font-semibold text-text-primary mb-2">{pattern.name}</h3>
      <p className="text-sm text-text-secondary mb-4">{pattern.description}</p>
      <div className="grid grid-cols-3 gap-1.5 max-w-[150px] mx-auto">
        {cells.map((cell, index) => (
          <div
            key={index}
            className={cn(
              "aspect-square rounded flex items-center justify-center text-sm font-bold",
              cell === "X"
                ? "bg-playerX-primary/20 text-playerX-primary ring-1 ring-playerX-primary"
                : "bg-board-cell"
            )}
          >
            {cell}
          </div>
        ))}
      </div>
    </div>
  );
}

function StrategyTip({ tip }: { tip: (typeof strategyTips)[0] }) {
  return (
    <div className="p-4 bg-surface-base rounded-lg border border-board-grid">
      <h4 className="font-semibold text-text-primary mb-1">{tip.title}</h4>
      <p className="text-sm text-text-secondary">{tip.description}</p>
    </div>
  );
}

function FAQItem({
  question,
  answer,
  isExpanded,
  onToggle,
}: {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-surface-elevated rounded-lg border border-board-grid overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-board-grid transition-colors"
      >
        <span className="font-medium text-text-primary pr-4">{question}</span>
        <svg
          className={cn(
            "w-5 h-5 text-text-secondary transition-transform flex-shrink-0",
            isExpanded && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4">
          <p className="text-text-secondary">{answer}</p>
        </div>
      )}
    </div>
  );
}
