"use client";

import { useState } from "react";
import clsx from "clsx";
import { micromark } from "micromark";
import posthog from "posthog-js";
import { faBookSparkles, faPlus, faWandMagicSparkles } from "@fortawesome/pro-duotone-svg-icons";
import Icon from "@/components/Icon";
import { possessive } from "@/lib/characters";
import { CONNECTORS, type Part, splitBook } from "@/lib/tale";

type Props = {
  id: string;
  heroName: string;
  parts: Part[];
  title: string | null;
  book: string | null;
  editable: boolean;
  onKeepGoing: () => Promise<void>;
};

const posthogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST,
);

const glass = "rounded-[28px] bg-white/7 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]";
const outlineButton = "flex min-h-15 items-center gap-2.5 rounded-full border border-white/30 px-6 text-[17px] font-semibold";

export default function FinishedBook({ id, heroName, parts, title: savedTitle, book: savedBook, editable, onKeepGoing }: Props) {
  const [book, setBook] = useState(savedBook ? { title: savedTitle ?? "", book: savedBook } : null);
  const [making, setMaking] = useState(false);
  const [tab, setTab] = useState<"parts" | "book">(savedBook ? "book" : "parts");
  const [busy, setBusy] = useState(false);

  async function makeBook() {
    setMaking(true);
    setTab("book");
    try {
      const response = await fetch(`/api/tales/${id}/book`, { method: "POST" });
      if (!response.ok || !response.body) throw new Error(response.statusText);
      let text = "";
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += value;
        setBook(splitBook(text));
      }
      if (posthogConfigured) posthog.capture("tale_book_made");
    } finally {
      setMaking(false);
    }
  }

  async function keepGoing() {
    setBusy(true);
    try {
      await onKeepGoing();
    } finally {
      setBusy(false);
    }
  }

  const showTabs = Boolean(book) || making;

  return (
    <>
      <header className="flex flex-col items-center gap-2.5 text-center">
        <h1 className="font-display text-6xl leading-[0.95] font-light tracking-tight text-white [text-shadow:0_0_40px_rgb(255_143_200/0.6)] sm:text-7xl">
          {book?.title || `${possessive(heroName)} story`}
        </h1>
        <p className="tracking-widest text-peach [font-variant-caps:all-small-caps]">
          {possessive(heroName)} story · {parts.length} parts
        </p>
      </header>

      {showTabs && (
        <div role="tablist" aria-label="Version" className="flex gap-1 self-center rounded-full bg-white/8 p-1 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]">
          {(
            [
              ["parts", "Story parts"],
              ["book", "Book version"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={clsx("min-h-11 rounded-full px-5 text-[15px] font-semibold", tab === value && "bg-ink text-night")}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <article className={clsx(glass, "px-6 py-8 sm:px-11 sm:py-10")}>
        {tab === "book" && book ? (
          <div
            className="flex flex-col gap-5 text-xl leading-relaxed text-ink-soft [&>p:first-child]:first-letter:float-left [&>p:first-child]:first-letter:mt-1.5 [&>p:first-child]:first-letter:mr-2.5 [&>p:first-child]:first-letter:font-display [&>p:first-child]:first-letter:text-[84px] [&>p:first-child]:first-letter:leading-[0.8] [&>p:first-child]:first-letter:font-light [&>p:first-child]:first-letter:text-pink"
            dangerouslySetInnerHTML={{ __html: micromark(book.book) }}
          />
        ) : (
          <ol className="flex flex-col gap-5">
            {parts.map((part, index) => {
              const { word, color } = CONNECTORS[part.connector];
              return (
                <li key={index} className="grid gap-x-4 gap-y-1 sm:grid-cols-[130px_minmax(0,1fr)] sm:items-baseline">
                  <span className="font-display text-[22px] font-extrabold [font-stretch:75%]" style={{ color }}>
                    {word}
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="text-[19px] leading-relaxed text-ink-soft">{part.text}</p>
                    {part.idea && (
                      <span className="text-sm text-muted">
                        Your idea: <span className="text-white [font-feature-settings:'ss01']">{part.idea}</span>
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </article>

      <footer className="flex flex-wrap justify-center gap-3">
        {editable ? (
          <>
            {!book && (
              <button
                onClick={makeBook}
                disabled={making}
                className="flex min-h-15 items-center gap-2.5 rounded-full bg-linear-to-r from-pink via-peach to-pale-sky px-7 text-lg font-bold text-night shadow-[0_0_40px_rgb(255_143_200/0.45)] disabled:opacity-70"
              >
                <Icon icon={faBookSparkles} primary="var(--color-night)" secondary="var(--color-violet)" className="text-[22px]" />
                {making ? "Making your book…" : "Make it a book"}
              </button>
            )}
            <button onClick={keepGoing} disabled={busy || making} className={outlineButton}>
              <Icon icon={faPlus} primary="#fff" secondary="var(--color-sky)" className="text-xl" />
              Keep going
            </button>
            <a href="/write" className={outlineButton}>
              <Icon icon={faWandMagicSparkles} primary="var(--color-pink)" secondary="var(--color-peach)" className="text-xl" />
              Start a new story
            </a>
          </>
        ) : (
          <a href="/write" className={outlineButton}>
            <Icon icon={faWandMagicSparkles} primary="var(--color-pink)" secondary="var(--color-peach)" className="text-xl" />
            Write your own story
          </a>
        )}
      </footer>
    </>
  );
}
