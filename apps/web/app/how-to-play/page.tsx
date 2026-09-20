"use client";

/**
 * How to Play / Tutorial Page
 * Desktop shows every section stacked (the pills scroll to a section);
 * on mobile the pills switch between sections one at a time.
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/helpers";
import { ROUTES } from "@/lib/constants";
import { ScreenBackdrop } from "@/components/ui/ScreenBackdrop";
import {
  Mark,
  MiniBoard,
  MiniGrid,
  cellsFromPattern,
  type MiniCell,
} from "@/components/how-to-play/MiniBoard";
import {
  tutorialSections,
  basicRules,
  gameModes,
  winPatterns,
  strategyTips,
  faq,
} from "@/lib/tutorialContent";

type SectionId = (typeof tutorialSections)[number]["id"];

const SECTION_META: Record<
  string,
  { icon: ReactNode; tag: [string, string] }
> = {
  basics: { icon: <BookIcon />, tag: ["Simple rules", "Endless possibilities"] },
  modes: { icon: <GamepadIcon />, tag: ["Different ways to play", "Same infinite fun"] },
  winning: { icon: <TrophyIcon />, tag: ["One move closer", "to victory"] },
  strategy: { icon: <BulbIcon />, tag: ["Play smarter", "Win more"] },
};

const DESKTOP_QUERY = "(min-width: 1024px)";

export default function HowToPlayPage() {
  const [active, setActive] = useState<SectionId>(tutorialSections[0].id);

  const sectionDomId = (id: string) => `section-${id}`;

  const selectSection = (id: SectionId) => {
    setActive(id);
    // Desktop shows everything, so the pill jumps to the section instead.
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      document.getElementById(sectionDomId(id))?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Keep the pills in sync with the section being read on desktop.
  useEffect(() => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id.replace("section-", ""));
          }
        }
      },
      { rootMargin: "-25% 0px -60% 0px" }
    );
    tutorialSections.forEach((s) => {
      const el = document.getElementById(sectionDomId(s.id));
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const activeIndex = tutorialSections.findIndex((s) => s.id === active);
  const prev = tutorialSections[activeIndex - 1];
  const next = tutorialSections[activeIndex + 1];

  return (
    <main className="space-scope relative isolate flex-1 px-4 pb-14 pt-8 sm:pt-10">
      <ScreenBackdrop image="queueMatchBg" dim={0.62} fixed />

      <div className="mx-auto w-full max-w-6xl">
        <Hero />

        {/* Section pills */}
        <nav
          aria-label="Guide sections"
          className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:justify-center lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {tutorialSections.map((section) => {
            const isActive = active === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => selectSection(section.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "border-accent-primary/70 bg-gradient-to-r from-accent-primary/40 to-[#6d28d9]/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                    : "border-white/10 bg-[#141124]/80 text-text-secondary hover:border-accent-primary/40 hover:text-text-primary"
                )}
              >
                <span className={cn("h-4 w-4", isActive ? "text-white" : "text-accent-primary")}>
                  {SECTION_META[section.id]?.icon}
                </span>
                {section.title}
              </button>
            );
          })}
        </nav>

        <div className="space-y-5">
          {/* 1 · Basic Rules */}
          <GuideSection id={sectionDomId("basics")} sectionId="basics" title="Basic Rules" isActive={active === "basics"}>
            <p className="mb-4 text-sm text-text-secondary">
              Tic-Tac-Toe is a simple game, but mastering it takes strategy and practice. Here are the fundamentals:
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {basicRules.map((rule, index) => (
                <div
                  key={rule.title}
                  className="relative flex gap-3 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] p-4"
                >
                  <NumberBadge n={index + 1} />
                  <div className="min-w-0 pr-8">
                    <h3 className="font-semibold text-text-primary">{rule.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">{rule.description}</p>
                  </div>
                  <span className="absolute bottom-3 right-3 h-7 w-7 text-accent-primary/40" aria-hidden="true">
                    {RULE_DECOR[index]}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 sm:p-5">
                <ExampleGame />
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 sm:p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-text-primary">
                  <span className="h-4 w-4 text-accent-primary">
                    <StarIcon />
                  </span>
                  Winning Patterns
                </h3>
                <ul className="space-y-2.5">
                  {winPatterns.slice(0, 3).map((pattern, i) => (
                    <li key={pattern.name} className="flex items-center gap-3">
                      <MiniBoard
                        cells={cellsFromPattern(pattern.pattern, i % 2 === 0 ? "X" : "O")}
                        className="w-16 shrink-0 gap-0.5 p-0.5"
                      />
                      <span className="text-sm text-text-secondary">{pattern.name.replace(/\s[\\/]$/, "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GuideSection>

          {/* 2 · Game Modes */}
          <GuideSection id={sectionDomId("modes")} sectionId="modes" title="Game Modes" isActive={active === "modes"}>
            <p className="mb-4 text-sm text-text-secondary">
              Choose how you want to play. Each mode offers a unique challenge!
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {gameModes.map((mode) => (
                <article
                  key={mode.id}
                  className={cn(
                    "flex flex-col rounded-xl border p-4 sm:p-5",
                    mode.highlight
                      ? "border-accent-primary/60 bg-accent-primary/[0.08] shadow-[0_0_28px_rgba(168,85,247,0.16)]"
                      : "border-white/[0.07] bg-white/[0.03]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="flex items-center gap-2.5 text-lg font-display font-semibold text-text-primary">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary/20 text-accent-primary">
                        {mode.id === "sliding" ? <BoltIcon /> : <TargetIcon />}
                      </span>
                      {mode.name}
                    </h3>
                    {mode.highlight && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent-warning/40 bg-accent-warning/10 px-2.5 py-1 text-xs font-medium text-accent-warning">
                        <span className="h-3 w-3">
                          <StarIcon />
                        </span>
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">{mode.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <ul className="space-y-1.5">
                      {mode.rules.map((rule) => (
                        <li key={rule} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="mt-0.5 h-4 w-4 shrink-0 text-accent-success">
                            <CheckIcon />
                          </span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                    <ModeVisual mode={mode.id} />
                  </div>
                </article>
              ))}
            </div>
          </GuideSection>

          {/* 3 · How to Win */}
          <GuideSection id={sectionDomId("winning")} sectionId="winning" title="How to Win" isActive={active === "winning"}>
            <p className="mb-4 text-sm text-text-secondary">
              Get three of your marks in a row to win. Here are all the winning patterns:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {winPatterns.map((pattern, index) => {
                const player = index % 2 === 0 ? "X" : "O";
                const highlight = pattern.pattern.map(([r, c]) => r * 3 + c);
                return (
                  <div
                    key={pattern.name}
                    className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 lg:flex-col lg:items-start"
                  >
                    <MiniBoard
                      cells={cellsFromPattern(pattern.pattern, player)}
                      highlight={highlight}
                      className="w-24 shrink-0 lg:w-full lg:max-w-[130px]"
                    />
                    <div>
                      <h3 className="font-semibold text-text-primary">{pattern.name}</h3>
                      <p className="mt-0.5 text-sm text-text-secondary">{pattern.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <ProTip title="Pro Tip">
              The center cell is part of all 4 winning patterns (horizontal, vertical, and both diagonals). Control the center!
            </ProTip>
          </GuideSection>

          {/* 4 · Strategy Tips */}
          <GuideSection id={sectionDomId("strategy")} sectionId="strategy" title="Strategy Tips" isActive={active === "strategy"}>
            <p className="mb-4 text-sm text-text-secondary">
              Elevate your game with these strategic insights from expert players.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {strategyTips.map((tip, index) => (
                <article
                  key={tip.title}
                  className="flex flex-col rounded-xl border border-white/[0.07] bg-white/[0.03] p-4"
                >
                  <div className="flex gap-3">
                    <NumberBadge n={index + 1} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-text-primary">{tip.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{tip.description}</p>
                    </div>
                    <MiniBoard
                      cells={tip.board as MiniCell[]}
                      className="h-fit w-20 shrink-0 gap-0.5 p-0.5 sm:w-24"
                    />
                  </div>
                  <p className="mt-3 flex items-center gap-2 rounded-lg border border-accent-primary/25 bg-accent-primary/10 px-3 py-2 text-xs text-text-primary">
                    <span className="h-3.5 w-3.5 shrink-0 text-accent-primary">
                      <CubeIcon />
                    </span>
                    {tip.takeaway}
                  </p>
                </article>
              ))}
            </div>
            <ProTip title="Pro Tip">
              Great players don&apos;t just react — they plan ahead, control space, and create multiple threats!
            </ProTip>
          </GuideSection>

          {/* Prev / next — mobile only, where one section shows at a time */}
          <div className="flex gap-3 lg:hidden">
            {prev && (
              <StepButton onClick={() => selectSection(prev.id)} variant="secondary">
                <span aria-hidden="true">←</span> {prev.title}
              </StepButton>
            )}
            {next ? (
              <StepButton onClick={() => selectSection(next.id)} variant="primary">
                Next: {next.title} <span aria-hidden="true">→</span>
              </StepButton>
            ) : (
              <a
                href="#faq"
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-primary to-[#7c3aed] px-4 font-medium text-white shadow-lg shadow-accent-primary/30"
              >
                Next: FAQ <span aria-hidden="true">↓</span>
              </a>
            )}
          </div>

          <FaqSection />

          {/* CTA */}
          <div className="flex flex-col items-center gap-4 pt-2 text-center md:flex-row md:justify-between md:text-left">
            <p className="max-w-[16rem] text-[11px] font-medium uppercase tracking-[0.25em] text-text-muted">
              Ready to put your knowledge to the test?
            </p>
            <Link
              href={ROUTES.PLAY}
              className="inline-flex h-12 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-primary to-[#7c3aed] px-8 font-medium text-white shadow-lg shadow-accent-primary/30 transition-all hover:brightness-110"
            >
              <span className="h-5 w-5">
                <GamepadIcon />
              </span>
              Play Now <span aria-hidden="true">→</span>
            </Link>
            <p className="hidden max-w-[16rem] -rotate-3 font-display text-sm font-semibold italic leading-snug text-accent-primary/80 md:block md:text-right">
              Good players learn. Great players adapt.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================
// Sections
// ============================================

function Hero() {
  return (
    <header className="relative mb-6 px-2 pb-2 text-center">
      {/* "Think · Adapt · Win" tag and tilted board are desktop decoration */}
      <p
        aria-hidden="true"
        className="absolute left-2 top-6 hidden -rotate-12 font-display text-xl font-bold italic uppercase leading-tight text-accent-primary/70 lg:block"
      >
        Think
        <br />
        Adapt
        <br />
        Win
      </p>
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 hidden w-36 rotate-[18deg] rounded-xl border border-accent-primary/40 bg-accent-primary/10 p-1.5 shadow-[0_0_40px_rgba(168,85,247,0.35)] lg:block"
      >
        <MiniBoard
          cells={["X", null, "O", null, "X", null, "O", null, "X"]}
          className="border-0 bg-transparent p-0"
        />
      </div>

      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.3em] text-accent-secondary">
        Learn · Strategize · Improve
      </p>
      <h1 className="bg-gradient-to-r from-[#f0abfc] via-[#a855f7] to-[#67e8f9] bg-clip-text font-display text-4xl font-bold text-transparent sm:text-5xl">
        How to Play
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-text-secondary">
        Master the art of Infinite Tic-Tac-Toe with our comprehensive guide. From basic rules to advanced strategies,
        everything you need to dominate.
      </p>
    </header>
  );
}

function GuideSection({
  id,
  sectionId,
  title,
  isActive,
  children,
}: {
  id: string;
  sectionId: string;
  title: string;
  isActive: boolean;
  children: ReactNode;
}) {
  const meta = SECTION_META[sectionId];
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("glass-panel scroll-mt-24 p-4 sm:p-6", isActive ? "block" : "hidden lg:block")}
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <h2
          id={`${id}-title`}
          className="flex items-center gap-3 font-display text-xl font-bold text-text-primary sm:text-2xl"
        >
          <span className="h-7 w-7 text-accent-primary">{meta.icon}</span>
          {title}
        </h2>
        <p className="hidden text-right text-[10px] font-medium uppercase leading-relaxed tracking-[0.2em] text-accent-primary/70 sm:block">
          {meta.tag[0]}
          <br />
          {meta.tag[1]}
        </p>
      </div>
      {children}
    </section>
  );
}

/** Playable version of the example board: tap an empty cell to place the next mark. */
function ExampleGame() {
  const initial: Array<"X" | "O" | null> = ["X", null, "O", null, "X", null, "O", null, null];
  const [cells, setCells] = useState(initial);

  const xCount = cells.filter((c) => c === "X").length;
  const oCount = cells.filter((c) => c === "O").length;
  const turn: "X" | "O" = xCount <= oCount ? "X" : "O";
  const isFull = cells.every(Boolean);

  const place = (index: number) => {
    if (cells[index] || isFull) return;
    setCells(cells.map((c, i) => (i === index ? turn : c)));
  };

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="sm:max-w-[16rem]">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
          <span className="h-5 w-5 text-accent-primary">
            <GridIcon />
          </span>
          Example Game Board
        </h3>
        <p className="mt-1 text-sm text-text-secondary">Click on empty cells to place your mark (X or O)</p>

        <ul className="mt-4 space-y-2 rounded-lg border border-white/[0.07] bg-black/20 p-3 text-sm text-text-secondary">
          <li className="flex items-center gap-2">
            <Mark player="X" className="h-5 w-5" /> Player X (goes first)
          </li>
          <li className="flex items-center gap-2">
            <Mark player="O" className="h-5 w-5" /> Player O (goes second)
          </li>
        </ul>

        <p className="mt-3 rounded-lg border border-accent-warning/30 bg-accent-warning/10 px-3 py-2 text-sm text-accent-warning">
          <span className="font-semibold">Tip:</span> Try to control the center cell. It&apos;s part of all 4 winning
          lines!
        </p>
      </div>

      <div className="mx-auto w-full max-w-[15rem] sm:mx-0 sm:max-w-[16rem]">
        <div className="board-grid grid grid-cols-3 gap-1.5 p-2">
          {cells.map((cell, i) => (
            <button
              key={i}
              type="button"
              onClick={() => place(i)}
              disabled={Boolean(cell) || isFull}
              aria-label={cell ? `Cell ${i + 1}: ${cell}` : `Place ${turn} in cell ${i + 1}`}
              className="cell flex aspect-square items-center justify-center rounded-lg bg-board-cell transition-colors enabled:hover:bg-board-cellHover disabled:cursor-default"
            >
              {cell && <Mark player={cell} className="h-3/5 w-3/5" />}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCells(initial)}
          className="mt-3 w-full text-center text-xs text-text-muted transition-colors hover:text-text-primary"
        >
          Reset board
        </button>
      </div>
    </div>
  );
}

function ModeVisual({ mode }: { mode: string }) {
  if (mode === "sliding") {
    return (
      <MiniBoard
        cells={["X~", "X", "O", null, "O", null, null, null, "X"]}
        className="w-24 shrink-0 gap-0.5 p-0.5"
      />
    );
  }
  return (
    <div className="flex shrink-0 items-end gap-1.5" aria-label="Board grows from 3×3 to 4×4 to 5×5" role="img">
      <MiniGrid size={3} className="w-9" />
      <span className="mb-3 text-xs text-accent-primary" aria-hidden="true">
        →
      </span>
      <MiniGrid size={4} className="w-12" />
      <span className="mb-4 text-xs text-accent-primary" aria-hidden="true">
        →
      </span>
      <MiniGrid size={5} className="w-16" />
    </div>
  );
}

function FaqSection() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className="glass-panel scroll-mt-24 p-4 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 id="faq-title" className="flex items-center gap-3 font-display text-xl font-bold text-text-primary sm:text-2xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary text-base font-bold text-white">
            ?
          </span>
          Frequently Asked Questions
        </h2>
        <p className="hidden text-right text-[10px] font-medium uppercase leading-relaxed tracking-[0.2em] text-accent-primary/70 sm:block">
          Still have questions?
          <br />
          We&apos;ve got answers
        </p>
      </div>

      <div className="grid items-start gap-3 md:grid-cols-2">
        {faq.map((item, index) => {
          const isOpen = expanded === index;
          const panelId = `faq-panel-${index}`;
          return (
            <div
              key={item.question}
              className={cn(
                "overflow-hidden rounded-xl border transition-colors",
                isOpen
                  ? "border-accent-primary/60 bg-accent-primary/[0.08]"
                  : "border-white/[0.07] bg-white/[0.03] hover:border-accent-primary/30"
              )}
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center gap-3 p-3.5 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary/15 text-accent-primary">
                  <span className="h-[18px] w-[18px]">{FAQ_ICONS[index % FAQ_ICONS.length]}</span>
                </span>
                <span className="flex-1 text-sm font-medium text-text-primary sm:text-[15px]">{item.question}</span>
                <span
                  aria-hidden="true"
                  className={cn("h-4 w-4 shrink-0 text-text-secondary transition-transform", isOpen && "rotate-180")}
                >
                  <ChevronIcon />
                </span>
              </button>
              {isOpen && (
                <div id={panelId} role="region" className="px-4 pb-4 pl-[3.75rem] text-sm leading-relaxed text-text-secondary">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================
// Small helpers
// ============================================

function NumberBadge({ n }: { n: number }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-accent-primary/70 bg-accent-primary/20 text-sm font-bold text-text-primary shadow-[0_0_12px_rgba(168,85,247,0.35)]">
      {n}
    </span>
  );
}

function ProTip({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-accent-warning/40 bg-accent-warning/10 p-3.5 sm:p-4">
      <span className="mt-0.5 h-6 w-6 shrink-0 text-accent-warning">
        <BulbIcon />
      </span>
      <p className="text-sm leading-relaxed text-text-primary">
        <span className="font-semibold text-accent-warning">{title}</span>
        <br />
        {children}
      </p>
    </div>
  );
}

function StepButton({
  onClick,
  variant,
  children,
}: {
  onClick: () => void;
  variant: "primary" | "secondary";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-all",
        variant === "primary"
          ? "bg-gradient-to-r from-accent-primary to-[#7c3aed] text-white shadow-lg shadow-accent-primary/30 hover:brightness-110"
          : "border border-white/10 bg-[#141124]/80 text-text-primary hover:border-accent-primary/40"
      )}
    >
      {children}
    </button>
  );
}

// ============================================
// Icons (24×24 outline, sized by the parent)
// ============================================

function Svg({ children, sw = 1.6 }: { children: ReactNode; sw?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-full w-full"
    >
      {children}
    </svg>
  );
}

function BookIcon() {
  return (
    <Svg>
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </Svg>
  );
}

function GamepadIcon() {
  return (
    <Svg>
      <path d="M6 8h12a4 4 0 014 4v2.5a3.5 3.5 0 01-6.2 2.2L14.5 15h-5l-1.3 1.7A3.5 3.5 0 012 14.5V12a4 4 0 014-4z" />
      <path d="M7 10.5v3M5.5 12h3M16 11.5h.01M18 13h.01" />
    </Svg>
  );
}

function TrophyIcon() {
  return (
    <Svg>
      <path d="M8 21h8m-4-4v4m-5-18h10v6a5 5 0 01-10 0V3zm10 2h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" />
    </Svg>
  );
}

function BulbIcon() {
  return (
    <Svg>
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </Svg>
  );
}

function BoltIcon() {
  return (
    <span className="h-5 w-5">
      <Svg>
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </Svg>
    </span>
  );
}

function TargetIcon() {
  return (
    <span className="h-5 w-5">
      <Svg>
        <circle cx={12} cy={12} r={9} />
        <circle cx={12} cy={12} r={5} />
        <circle cx={12} cy={12} r={1.2} />
      </Svg>
    </span>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-full w-full">
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8L12 2.5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <Svg sw={2.4}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

function CubeIcon() {
  return (
    <Svg>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 9l8-4.5M12 12L4 7.5M12 12v9" />
    </Svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-full w-full">
      {[3, 9.5, 16].flatMap((x) =>
        [3, 9.5, 16].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width={5} height={5} rx={1.2} />)
      )}
    </svg>
  );
}

function ChevronIcon() {
  return (
    <Svg sw={2}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

function CursorIcon() {
  return (
    <Svg>
      <path d="M5 3l14 7-6 2-2 6L5 3z" />
    </Svg>
  );
}

const RULE_DECOR: ReactNode[] = [
  <span key="marks" className="flex items-center gap-0.5">
    <Mark player="X" className="h-full w-full" faded />
  </span>,
  <CursorIcon key="cursor" />,
  <TrophyIcon key="trophy" />,
];

const FAQ_ICONS: ReactNode[] = [
  // disconnect / wifi
  <Svg key="wifi">
    <path d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 19h.01" />
  </Svg>,
  // ranking
  <Svg key="rank">
    <path d="M4 20V13m5 7V8m5 12V4m5 16v-9" />
  </Svg>,
  // bots
  <Svg key="bot">
    <path d="M8.25 3v1.5M12 3v1.5m3.75-1.5v1.5M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zM9 10h.01M15 10h.01M9.5 14h5" />
  </Svg>,
  // players
  <Svg key="users">
    <path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 100-8 4 4 0 000 8zm6 0a3 3 0 100-6M3 10a3 3 0 106 0" />
  </Svg>,
  // rematch
  <Svg key="rematch">
    <path d="M16.023 9.348h4.992M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </Svg>,
  // sliding / gamepad
  <GamepadIcon key="game" />,
];
