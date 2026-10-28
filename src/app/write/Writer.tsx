"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
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
import { possessive, withArticle } from "@/lib/characters";
import { type Draft, heroFromDraft, type HeroWords } from "@/lib/hero-draft";
import { KIND_ICONS } from "@/lib/icons";
import {
  awaitingRoll,
  type Check,
  CONNECTORS,
  type Hero,
  type Idea,
  MAX_IDEA_LENGTH,
  nextConnector,
  type Part,
  rollConnector,
  TURN_CONNECTORS,
  type TurnConnector,
} from "@/lib/tale";
import { callCheck, keepGoing, rollHeroesAction, suggestIdeas } from "./actions";
import { CheckPanel, dmVoice, RollCard } from "./DiceCheck";
import FinishedBook from "./FinishedBook";
import HeroBuilder from "./HeroBuilder";

type Tale = {
  id: string;
  hero: Hero;
  parts: Part[];
  finished: boolean;
  title: string | null;
  book: string | null;
  // D20 Mode: risky ideas need a dice check, and the DM writes the outcome
  d20: boolean;
};

// D20 Mode: the writer's turn while the DM calls a check (null while the DM decides)
type Checking = { part: Omit<Part, "text">; check: (Check & { explanation: string }) | null };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A story opened by anyone other than its writer is read-only
type Props = {
  initialHeroes?: Hero[];
  // For "Build my own hero"
  heroWords?: HeroWords;
  initialDraft?: Draft;
  initialTale?: Tale;
  editable?: boolean;
};

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

// Rolled heroes and "Build my own" are separate tabs
const HERO_MODES: { mode: "roll" | "build"; label: string; icon: IconDefinition }[] = [
  { mode: "roll", label: "Roll a hero", icon: faDiceD20 },
  { mode: "build", label: "Build my own", icon: faPencil },
];

export default function Writer({ initialHeroes = [], heroWords, initialDraft, initialTale, editable = true }: Props) {
  const [tale, setTale] = useState<Tale | null>(initialTale ?? null);
  const [heroes, setHeroes] = useState(initialHeroes);
  // Pick a rolled hero, or build one
  const [heroMode, setHeroMode] = useState<"roll" | "build">("roll");
  const [heroIndex, setHeroIndex] = useState(0);
  const [draft, setDraft] = useState(initialDraft);
  const [d20, setD20] = useState(false);
  // The part being written right now; a DM part without a roll value is still rolling
  const [pending, setPending] = useState<Part | null>(null);
  const [checking, setChecking] = useState<Checking | null>(null);
  const [connector, setConnector] = useState<TurnConnector>(nextConnector(initialTale?.parts.at(-1)?.connector));
  // Ideas for each connector this turn, fetched when the connector is first picked
  const [ideas, setIdeas] = useState<Partial<Record<TurnConnector, Idea[]>>>({});
  const [ideaIndex, setIdeaIndex] = useState(0);
  const [writeIn, setWriteIn] = useState("");
  const [busy, setBusy] = useState(false);

  const turnIdeas = ideas[connector];
  const writing = pending !== null;
  // A check whose part was written but never rolled for, e.g. after a reload
  const owedCheck = tale && !writing ? awaitingRoll(tale.parts) : undefined;
  const canTakeTurn =
    editable && tale && !tale.finished && !writing && !checking && !owedCheck && tale.parts.length > 0;

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

  async function writePart(target: Tale, part: Omit<Part, "text">) {
    setPending({ ...part, text: "" });
    const response = await fetch(`/api/tales/${target.id}/parts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(part),
    });
    return readPart(response, target, part);
  }

  // Shows a part as it streams in, then adds it to the story
  async function readPart(response: Response, target: Tale, part: Omit<Part, "text">) {
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
      setPending({ ...part, text });
    }

    const written: Tale = {
      ...target,
      parts: [...target.parts, { ...part, text: text.trim() }],
      finished: part.connector === "end",
    };
    setTale(written);
    setPending(null);
    setIdeas({});
    setIdeaIndex(0);
    setWriteIn("");
    if (part.connector !== "end") setConnector(nextConnector(part.connector));
    if (posthogConfigured) {
      posthog.capture("tale_part_written", {
        connector: part.connector,
        ideaSource: part.ideaSource,
        ...(part.roll ? { roll: part.roll.value } : {}),
      });
    }
    return written;
  }

  // D20 Mode: the server rolls, and the DM writes the outcome from the roll
  async function rollFor(target: Tale, check: Check) {
    // A part with a roll but no value shows a tumbling die
    setPending({ connector: "but", idea: "", ideaSource: "none", text: "", roll: { value: 0, check } });
    const [response] = await Promise.all([fetch(`/api/tales/${target.id}/roll`, { method: "POST" }), wait(1200)]);
    const value = Number(response.headers.get("x-roll"));
    if (!response.ok || !value) {
      setPending(null);
      throw new Error(response.statusText);
    }
    await readPart(response, target, {
      connector: rollConnector(value, check.target),
      idea: "",
      ideaSource: "none",
      roll: { value, check },
    });
  }

  const builtHeroReady = Boolean(draft?.pieces[draft.kind].every((piece) => piece.trim()));
  const chosenHero = heroMode === "build" ? (draft && builtHeroReady ? heroFromDraft(draft) : null) : heroes[heroIndex];

  async function startStory() {
    const hero = chosenHero;
    if (!hero) return;
    setBusy(true);
    try {
      // One request creates the story and streams its opening
      const response = await fetch("/api/tales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hero, d20 }),
      });
      const id = response.headers.get("x-tale-id");
      if (!id) throw new Error(response.statusText);

      const created: Tale = { id, hero, parts: [], finished: false, title: null, book: null, d20 };
      setTale(created);
      setPending({ connector: "once", idea: "", ideaSource: "none", text: "" });
      window.history.replaceState(null, "", `/write/${id}`);
      if (posthogConfigured) posthog.capture("tale_started", { kind: hero.kind, built: heroMode === "build", d20 });
      await readPart(response, created, { connector: "once", idea: "", ideaSource: "none" });
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

  async function addPart() {
    if (!tale) return;
    const typed = writeIn.trim();
    const chosen = typed ? null : turnIdeas?.[ideaIndex];
    if (!typed && !chosen) return;
    const part: Omit<Part, "text"> = {
      connector,
      idea: typed || chosen?.text || "",
      ideaSource: typed ? "write-in" : "option",
    };

    // In D20 Mode the DM looks at risky ideas, and anything the writer typed, before it's written
    if (!tale.d20 || !(typed || chosen?.check)) {
      await writePart(tale, part);
      return;
    }
    setChecking({ part, check: null });
    try {
      const check = await callCheck(tale.id, part.idea, chosen?.check ?? null);
      if (check) {
        setChecking({ part, check });
        return;
      }
      setChecking(null);
      await writePart(tale, part);
    } catch (error) {
      setChecking(null);
      throw error;
    }
  }

  // The writer's part stops at the moment of truth; then the roll decides how it goes
  async function rollTheDice() {
    if (!tale || !checking?.check) return;
    const { name, target, reason } = checking.check;
    const check = { name, target, reason };
    setChecking(null);
    const withAttempt = await writePart(tale, { ...checking.part, check });
    await rollFor(withAttempt, check);
  }

  async function skipTheRoll() {
    if (!tale || !checking) return;
    const { part } = checking;
    setChecking(null);
    if (posthogConfigured) posthog.capture("tale_check_skipped");
    await writePart(tale, part);
  }

  async function showDifferentIdeas() {
    if (!tale || !turnIdeas) return;
    const previous = turnIdeas.map((idea) => idea.text);
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
          <p className={clsx("text-lg text-pink", aiVoice)}>Roll for a hero, or build your own.</p>
        </header>

        {heroWords && draft && (
          <div
            role="tablist"
            aria-label="Hero"
            className="flex gap-1 self-center rounded-full bg-white/8 p-1 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]"
          >
            {HERO_MODES.map(({ mode, label, icon }) => {
              const on = mode === heroMode;
              return (
                <button
                  key={mode}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setHeroMode(mode)}
                  className={clsx("flex min-h-11 items-center gap-2 rounded-full px-5 text-[15px] font-semibold", on && "bg-ink text-night")}
                >
                  <Icon
                    icon={icon}
                    primary={on ? "var(--color-deep-violet)" : "var(--color-peach)"}
                    secondary="var(--color-sky)"
                    className="text-lg"
                  />
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {heroMode === "build" && heroWords && draft ? (
          <HeroBuilder words={heroWords} draft={draft} onChange={setDraft} />
        ) : (
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
        )}

        <button
          role="switch"
          aria-checked={d20}
          onClick={() => setD20(!d20)}
          className={clsx(
            "flex items-center gap-4 rounded-3xl border px-5 py-4 text-left",
            d20 ? "border-peach bg-peach/10 shadow-[0_0_36px_rgb(255_176_112/0.3)]" : "border-white/20 bg-white/5",
          )}
        >
          <Icon icon={faDiceD20} primary="var(--color-peach)" secondary="var(--color-violet)" className="text-[36px]" />
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-lg font-semibold">D20 Mode</span>
            <span className="text-[15px] leading-snug text-muted">
              Risky ideas need a dice roll, and a Dungeon Master writes what happens.
            </span>
          </span>
          <span className={clsx("flex h-8 w-14 flex-none items-center rounded-full p-1", d20 ? "bg-peach" : "bg-white/20")}>
            <span className={clsx("size-6 rounded-full bg-white transition-transform", d20 && "translate-x-6")} />
          </span>
        </button>

        <DragonButton onClick={startStory} disabled={busy || !chosenHero}>
          Start the story
        </DragonButton>
      </>
    );
  }

  if (tale.finished && !pending) {
    return (
      <FinishedBook
        id={tale.id}
        heroName={tale.hero.name}
        parts={tale.parts}
        title={tale.title}
        book={tale.book}
        editable={editable}
        onKeepGoing={async () => {
          const parts = await keepGoing(tale.id);
          setTale({ ...tale, parts, finished: false, title: null, book: null });
          setConnector(nextConnector(parts.at(-1)?.connector));
          setIdeas({});
        }}
      />
    );
  }

  const parts = pending ? [...tale.parts, pending] : tale.parts;
  // While the DM calls a check, the writer's part waits in the story, not written yet
  const waiting = checking?.part;

  return (
    <>
      <header className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-semibold tracking-widest text-pink [font-variant-caps:all-small-caps]">
          {tale.parts.length} {tale.parts.length === 1 ? "part" : "parts"} so far
        </p>
        <h1 className="font-display text-5xl leading-[0.95] font-light tracking-tight">{possessive(tale.hero.name)} story</h1>
        {tale.d20 && (
          <span className="mt-2 flex min-h-10 items-center gap-2 rounded-full bg-peach/14 pr-3.5 pl-2.5 text-sm font-semibold text-peach shadow-[inset_0_0_0_1px_var(--color-peach)]">
            <Icon icon={faDiceD20} primary="var(--color-peach)" secondary="var(--color-violet)" className="text-lg" />
            D20 Mode
          </span>
        )}
      </header>

      <ol aria-label="Story so far" className="flex flex-col">
        {parts.map((part, index) => {
          const { word, color } = CONNECTORS[part.connector];
          if (part.roll) {
            const rolled = part.roll.value || null;
            return (
              <li key={index} className="grid grid-cols-[28px_minmax(0,1fr)] gap-4">
                <span className="flex flex-col items-center">
                  <span className="mt-2.5 size-3.5 rounded-full" style={{ background: color, boxShadow: `0 0 14px ${color}` }} />
                  <span className="mt-1 w-0.5 flex-1 bg-white/14" />
                </span>
                <div className="pb-6">
                  <RollCard connector={part.connector} check={part.roll.check} value={rolled} text={part.text} />
                </div>
              </li>
            );
          }
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
        {waiting && (
          <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-4 opacity-60">
            <span className="flex flex-col items-center">
              <span
                className="mt-2.5 size-3.5 rounded-full"
                style={{ background: CONNECTORS[waiting.connector].color }}
              />
              <span className="mt-1 w-0.5 flex-1 bg-white/14" />
            </span>
            <div className="flex flex-col gap-1.5 pb-6">
              <span className={clsx(connectorWord, "text-[26px]")} style={{ color: CONNECTORS[waiting.connector].color }}>
                {CONNECTORS[waiting.connector].word}
              </span>
              <p className={clsx("text-[19px] leading-relaxed text-muted", dmVoice)}>
                Not written yet: the dice decide how it goes.
              </p>
              <span className="flex items-center gap-1.5 self-start rounded-full bg-white/6 px-2.5 py-1 text-sm text-muted">
                <Icon icon={faPencil} primary="var(--color-pink)" secondary="var(--color-sky)" />
                Your idea: <span className={clsx("text-white", writerVoice)}>{waiting.idea}</span>
              </span>
            </div>
          </li>
        )}
      </ol>

      {editable && checking && (
        <CheckPanel check={checking.check} busy={writing} onRoll={() => void rollTheDice()} onSkip={() => void skipTheRoll()} />
      )}

      {editable && !checking && owedCheck && (
        <CheckPanel check={owedCheck} busy={writing} onRoll={() => void rollFor(tale, owedCheck)} />
      )}

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
                        key={idea.text}
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          setIdeaIndex(index);
                          setWriteIn("");
                        }}
                        className={clsx(
                          "flex min-h-14 items-center justify-between gap-3 rounded-[18px] border px-4 py-2 text-left text-[17px]",
                          on ? "border-pink bg-pink/14" : "border-white/18 bg-white/3",
                        )}
                      >
                        {idea.text}
                        {tale.d20 && (
                          <span className="text-[13px] whitespace-nowrap text-peach">{idea.check ?? "No roll"}</span>
                        )}
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
              onClick={() => void writePart(tale, { connector: "end", idea: "", ideaSource: "none" })}
              className="flex min-h-12 items-center gap-2 rounded-full border border-white/30 px-4.5 text-[15px] font-semibold"
            >
              <Icon icon={faBookOpen} primary="#fff" secondary="var(--color-sky)" className="text-xl" />
              Write the ending
            </button>
            {tale.d20 && <span className="text-sm text-muted">Risky ideas get a dice check first.</span>}
            <button
              onClick={() => void addPart()}
              disabled={!turnIdeas && !writeIn.trim()}
              className="flex min-h-14 items-center gap-2.5 rounded-full bg-linear-to-r from-pink via-peach to-pale-sky px-7 text-lg font-bold text-night shadow-[0_0_40px_rgb(255_143_200/0.45)] disabled:opacity-60"
            >
              Write the next part
            </button>
          </footer>
        </section>
      )}

      {/* A story whose opening never got saved can start again from here */}
      {editable && tale.parts.length === 0 && !writing && (
        <DragonButton onClick={() => void writePart(tale, { connector: "once", idea: "", ideaSource: "none" })}>
          Start the story
        </DragonButton>
      )}

      {!editable && <DragonButton href="/write">Write your own story</DragonButton>}
    </>
  );
}
