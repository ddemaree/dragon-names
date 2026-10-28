"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import posthog from "posthog-js";
import {
  faArrowRotateRight,
  faBookOpen,
  faDiceD20,
  faLightbulb,
  faPencil,
} from "@fortawesome/pro-duotone-svg-icons";
import DragonButton from "@/components/DragonButton";
import Icon from "@/components/Icon";
import { withArticle } from "@/lib/characters";
import { KIND_ICONS } from "@/lib/icons";
import {
  CONNECTORS,
  type Connector,
  type Hero,
  MAX_IDEA_LENGTH,
  nextConnector,
  type Part,
  TURN_CONNECTORS,
  type TurnConnector,
} from "@/lib/tale";
import { createTale, rollHeroesAction, suggestIdeas } from "./actions";

type Tale = { id: string; hero: Hero; parts: Part[]; finished: boolean };

type Props = { initialHeroes?: Hero[]; initialTale?: Tale };

const posthogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST,
);

const panel =
  "flex flex-col gap-5 rounded-[28px] bg-white/7 px-6 py-7 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] sm:px-8";
const connectorWord = "font-display font-extrabold [font-stretch:75%] leading-none";
// The AI's questions and hints are set in italics
const aiVoice = "[font-variation-settings:'ital'_1]";
// The writer's own words use Polymath's legibility forms
const writerVoice = "[font-feature-settings:'ss01']";

// Dragon types read as adjectives ("a Heatwing dragon"); party members are a list
function heroLine(hero: Hero) {
  if (hero.kind === "dnd-party") return hero.type;
  return hero.kind === "dragons" ? `${withArticle(hero.type)} dragon` : withArticle(hero.type);
}

export default function Writer({ initialHeroes = [], initialTale }: Props) {
  const [tale, setTale] = useState<Tale | null>(initialTale ?? null);
  const [heroes, setHeroes] = useState(initialHeroes);
  const [heroIndex, setHeroIndex] = useState(0);
  // The part being written right now
  const [pending, setPending] = useState<{ connector: Connector; idea: string; text: string } | null>(null);
  const [connector, setConnector] = useState<TurnConnector>(nextConnector(initialTale?.parts.at(-1)?.connector));
  // Ideas for each connector this turn, fetched when the connector is first picked
  const [ideas, setIdeas] = useState<Partial<Record<TurnConnector, string[]>>>({});
  const [ideaIndex, setIdeaIndex] = useState(0);
  const [writeIn, setWriteIn] = useState("");
  const [busy, setBusy] = useState(false);

  const turnIdeas = ideas[connector];
  const writing = pending !== null;
  const canTakeTurn = tale && !tale.finished && !writing && tale.parts.length > 0;

  useEffect(() => {
    if (!canTakeTurn || turnIdeas) return;
    let current = true;
    suggestIdeas(tale.id, connector).then((options) => {
      if (current) setIdeas((all) => ({ ...all, [connector]: options }));
    });
    return () => {
      current = false;
    };
  }, [canTakeTurn, tale?.id, connector, turnIdeas]);

  async function writePart(target: Tale, next: Connector, idea = "", ideaSource: Part["ideaSource"] = "none") {
    setPending({ connector: next, idea, text: "" });
    const response = await fetch(`/api/tales/${target.id}/parts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ connector: next, idea, ideaSource }),
    });
    if (!response.ok || !response.body) {
      setPending(null);
      throw new Error(response.statusText);
    }

    let text = "";
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += value;
      setPending({ connector: next, idea, text });
    }

    const part: Part = { connector: next, idea, ideaSource, text: text.trim() };
    setTale({ ...target, parts: [...target.parts, part], finished: next === "end" });
    setPending(null);
    setIdeas({});
    setIdeaIndex(0);
    setWriteIn("");
    if (next !== "end") setConnector(nextConnector(next));
    if (posthogConfigured) posthog.capture("tale_part_written", { connector: next, ideaSource });
  }

  async function startStory() {
    const hero = heroes[heroIndex];
    if (!hero) return;
    setBusy(true);
    try {
      const id = await createTale(hero);
      const created: Tale = { id, hero, parts: [], finished: false };
      setTale(created);
      window.history.replaceState(null, "", `/write/${id}`);
      if (posthogConfigured) posthog.capture("tale_started", { kind: hero.kind });
      await writePart(created, "once");
    } finally {
      setBusy(false);
    }
  }

  async function reroll() {
    setBusy(true);
    try {
      setHeroes(await rollHeroesAction());
      setHeroIndex(0);
    } finally {
      setBusy(false);
    }
  }

  function addPart() {
    if (!tale || !turnIdeas) return;
    const typed = writeIn.trim();
    const idea = typed || turnIdeas[ideaIndex];
    void writePart(tale, connector, idea, typed ? "write-in" : "option");
  }

  async function showDifferentIdeas() {
    if (!tale || !turnIdeas) return;
    const previous = turnIdeas;
    setIdeas((all) => ({ ...all, [connector]: undefined }));
    setIdeaIndex(0);
    const options = await suggestIdeas(tale.id, connector, previous);
    setIdeas((all) => ({ ...all, [connector]: options }));
  }

  if (!tale) {
    return (
      <>
        <header className="flex flex-col items-center gap-3 text-center">
          <p className="text-[15px] font-semibold tracking-widest text-pink [font-variant-caps:all-small-caps]">
            New story · Your hero
          </p>
          <h1 className="font-display text-5xl leading-[0.95] font-light tracking-tight sm:text-6xl">
            Who is this story about?
          </h1>
          <p className={clsx("text-lg text-pink", aiVoice)}>Pick one, or roll for new ones.</p>
        </header>

        <section className="flex flex-col gap-3.5">
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Hero">
            {heroes.map((hero, index) => {
              const on = index === heroIndex;
              return (
                <button
                  key={`${hero.kind}-${hero.name}`}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setHeroIndex(index)}
                  className={clsx(
                    "flex flex-col items-start gap-3 rounded-3xl border p-5 text-left",
                    on
                      ? "border-pink bg-pink/14 shadow-[0_0_36px_rgb(255_143_200/0.35)]"
                      : "border-white/20 bg-white/5",
                  )}
                >
                  <Icon icon={KIND_ICONS[hero.kind]} primary="var(--color-pink)" secondary="var(--color-sky)" className="text-[44px]" />
                  <span className={clsx(connectorWord, "text-[28px]")}>{hero.name}</span>
                  <span className="text-[15px] leading-snug text-muted">{heroLine(hero)}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={reroll}
            disabled={busy}
            className="flex min-h-12 items-center gap-2.5 self-center rounded-full border border-white/30 bg-white/6 px-5 font-semibold"
          >
            <Icon icon={faDiceD20} primary="var(--color-peach)" secondary="var(--color-sky)" className="text-[22px]" />
            Roll 3 new heroes
          </button>
        </section>

        <DragonButton onClick={startStory} disabled={busy || heroes.length === 0}>
          Start the story
        </DragonButton>
      </>
    );
  }

  const parts = pending ? [...tale.parts, pending] : tale.parts;

  return (
    <>
      <header className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-semibold tracking-widest text-pink [font-variant-caps:all-small-caps]">
          {tale.parts.length} {tale.parts.length === 1 ? "part" : "parts"} so far
        </p>
        <h1 className="font-display text-5xl leading-[0.95] font-light tracking-tight">{tale.hero.name}’s story</h1>
      </header>

      <ol aria-label="Story so far" className="flex flex-col">
        {parts.map((part, index) => {
          const { word, color } = CONNECTORS[part.connector];
          return (
            <li key={index} className="grid grid-cols-[28px_minmax(0,1fr)] gap-4">
              <span className="flex flex-col items-center">
                <span className="mt-2.5 size-3.5 rounded-full" style={{ background: color, boxShadow: `0 0 14px ${color}` }} />
                <span className="mt-1 w-0.5 flex-1 bg-white/14" />
              </span>
              <div className="flex flex-col gap-1.5 pb-6">
                <span className={clsx(connectorWord, "text-[26px]")} style={{ color }}>
                  {word}
                </span>
                <p className="text-[19px] leading-relaxed text-ink-soft">
                  {part.text || <span className={clsx("text-muted", aiVoice)}>Writing…</span>}
                </p>
                {part.idea && (
                  <span className="flex items-center gap-1.5 self-start rounded-full bg-white/6 px-2.5 py-1 text-sm text-muted">
                    <Icon icon={faPencil} primary="var(--color-pink)" secondary="var(--color-sky)" />
                    Your idea: <span className={clsx("text-white", writerVoice)}>{part.idea}</span>
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {canTakeTurn && (
        <section className={panel}>
          <h2 className="font-display text-[34px] font-light">What happens next?</h2>

          <div className="grid gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Connector">
            {TURN_CONNECTORS.map((id) => {
              const { word, hint, color } = CONNECTORS[id];
              const on = id === connector;
              return (
                <button
                  key={id}
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setConnector(id);
                    setIdeaIndex(0);
                  }}
                  className={clsx(
                    "flex flex-col items-start gap-1 rounded-[20px] border px-4 py-3.5 text-left",
                    on ? "bg-white/10" : "border-white/20",
                  )}
                  style={on ? { borderColor: color } : undefined}
                >
                  <span className={clsx(connectorWord, "text-[32px]")} style={{ color }}>
                    {word}
                  </span>
                  <span className="text-sm text-muted">{hint}</span>
                </button>
              );
            })}
          </div>

          {connector === "and" && (
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[18px] bg-peach/10 px-4 py-3.5 shadow-[inset_0_0_0_1px_rgb(255_211_166/0.4)]">
              <Icon icon={faLightbulb} primary="#fff" secondary="var(--color-peach)" className="text-[22px]" />
              <p className={clsx("flex-[1_1_260px] leading-snug text-[#ffe7d1]", aiVoice)}>
                “And then” keeps things moving. A “But” adds a problem, and a “So” shows what it changed. Either makes a
                bigger story.
              </p>
              <button onClick={() => setConnector("but")} className="min-h-10 rounded-full border border-pink px-3.5 text-sm font-semibold text-pink">
                Try But…
              </button>
              <button onClick={() => setConnector("so")} className="min-h-10 rounded-full border border-peach px-3.5 text-sm font-semibold text-peach">
                Try So…
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <span className={clsx("text-[15px] text-pink", aiVoice)}>{CONNECTORS[connector].question}</span>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Idea">
              {turnIdeas
                ? turnIdeas.map((idea, index) => {
                    const on = !writeIn.trim() && index === ideaIndex;
                    return (
                      <button
                        key={idea}
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          setIdeaIndex(index);
                          setWriteIn("");
                        }}
                        className={clsx(
                          "min-h-14 rounded-[18px] border px-4 py-2 text-left text-[17px]",
                          on ? "border-pink bg-pink/14" : "border-white/18 bg-white/3",
                        )}
                      >
                        {idea}
                      </button>
                    );
                  })
                : [0, 1, 2].map((index) => (
                    <div key={index} className="min-h-14 animate-pulse rounded-[18px] border border-white/10 bg-white/5" />
                  ))}
            </div>
            <button
              onClick={showDifferentIdeas}
              disabled={!turnIdeas}
              className="flex min-h-10 items-center gap-2 self-start rounded-full px-3.5 text-sm font-semibold text-muted"
            >
              <Icon icon={faArrowRotateRight} primary="var(--color-muted)" secondary="var(--color-sky)" />
              Show 3 different ideas
            </button>
          </div>

          <label className="flex flex-col gap-2 text-sm text-muted">
            Or add your own idea (optional, a few words)
            <input
              type="text"
              value={writeIn}
              maxLength={MAX_IDEA_LENGTH}
              onChange={(event) => setWriteIn(event.target.value)}
              placeholder={`${CONNECTORS[connector].word.replace("…", "")} ${tale.hero.name}…`}
              className={clsx(
                "h-14 rounded-[18px] border bg-night/60 px-4.5 text-[19px] text-white placeholder:text-[#9c90c0]",
                writeIn.trim() ? "border-pink" : "border-white/28",
                writerVoice,
              )}
            />
          </label>

          <footer className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => void writePart(tale, "end")}
              className="flex min-h-12 items-center gap-2 rounded-full border border-white/30 px-4.5 text-[15px] font-semibold"
            >
              <Icon icon={faBookOpen} primary="#fff" secondary="var(--color-sky)" className="text-xl" />
              Write the ending
            </button>
            <button
              onClick={addPart}
              disabled={!turnIdeas && !writeIn.trim()}
              className="flex min-h-14 items-center gap-2.5 rounded-full bg-linear-to-r from-pink via-peach to-pale-sky px-7 text-lg font-bold text-night shadow-[0_0_40px_rgb(255_143_200/0.45)] disabled:opacity-60"
            >
              Write the next part
            </button>
          </footer>
        </section>
      )}

      {/* A story whose opening never got saved can start again from here */}
      {tale.parts.length === 0 && !writing && (
        <DragonButton onClick={() => void writePart(tale, "once")}>Start the story</DragonButton>
      )}

      {tale.finished && <DragonButton href="/write">Start a new story</DragonButton>}
    </>
  );
}
