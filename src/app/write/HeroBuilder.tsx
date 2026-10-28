"use client";

import clsx from "clsx";
import { faArrowRotateRight } from "@fortawesome/pro-duotone-svg-icons";
import Icon from "@/components/Icon";
import { CHARACTER_KINDS, isCharacterKind } from "@/lib/characters";
import {
  BUILDER_COPY,
  type Draft,
  draftName,
  type HeroWords,
  MAX_DETAILS_LENGTH,
  MAX_PIECE_LENGTH,
  rollMembers,
  shuffle,
} from "@/lib/hero-draft";
import { KIND_ICONS } from "@/lib/icons";

type Props = {
  words: HeroWords;
  draft: Draft;
  onChange: (draft: Draft) => void;
};

const KINDS = Object.keys(CHARACTER_KINDS).filter(isCharacterKind);
const piece = "rounded-[16px] border border-white/28 bg-night/60 text-white";
// The writer's own words use Polymath's legibility forms
const writerVoice = "[font-feature-settings:'ss01']";

export default function HeroBuilder({ words, draft, onChange }: Props) {
  const { kind } = draft;
  const copy = BUILDER_COPY[kind];

  function setPiece(index: number, value: string) {
    const pieces = draft.pieces[kind].with(index, value);
    onChange({ ...draft, pieces: { ...draft.pieces, [kind]: pieces } });
  }

  function setChoice(index: number, value: string) {
    const choices = draft.choices[kind].with(index, value);
    onChange({ ...draft, choices: { ...draft.choices, [kind]: choices } });
  }

  return (
    <section className="flex flex-col gap-5 rounded-[28px] bg-white/7 px-6 py-7 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] sm:px-8">

      <div role="radiogroup" aria-label="Kind" className="flex flex-wrap gap-2">
        {KINDS.map((id) => {
          const on = id === kind;
          return (
            <button
              key={id}
              role="radio"
              aria-checked={on}
              onClick={() => onChange({ ...draft, kind: id })}
              className={clsx(
                "flex min-h-11 items-center gap-2 rounded-full border py-1.5 pr-4 pl-2.5 text-[15px] font-semibold",
                on ? "border-ink bg-ink text-night" : "border-white/20",
              )}
            >
              <Icon
                icon={KIND_ICONS[id]}
                primary={on ? "var(--color-deep-violet)" : "#fff"}
                secondary="var(--color-sky)"
                className="text-xl"
              />
              {CHARACTER_KINDS[id].label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">Name: shuffle a piece, or type over it</span>
        <div className="flex flex-wrap items-center gap-2">
          {kind === "dnd-party" && <span className="font-display text-[30px] font-extrabold [font-stretch:75%]">The</span>}
          {draft.pieces[kind].map((value, index) => (
            <span key={index} className={clsx(piece, "flex min-h-14 items-center gap-1 pr-1.5 pl-4")}>
              <input
                type="text"
                value={value}
                maxLength={MAX_PIECE_LENGTH}
                size={Math.max(value.length, 3)}
                aria-label={`Name, ${copy.pieces[index]}`}
                onChange={(event) => setPiece(index, event.target.value)}
                className="min-w-12 bg-transparent font-display text-[30px] font-extrabold [field-sizing:content] [font-stretch:75%] focus:outline-none"
              />
              <button
                onClick={() => setPiece(index, shuffle(words[kind].pieces[index], value))}
                aria-label={`Shuffle the ${copy.pieces[index]}`}
                className="flex size-11 items-center justify-center rounded-full"
              >
                <Icon icon={faArrowRotateRight} primary="var(--color-peach)" secondary="var(--color-sky)" className="text-lg" />
              </button>
            </span>
          ))}
          <span className="text-muted">=</span>
          <span className="font-display text-4xl font-light text-peach">{draftName(draft)}</span>
        </div>
      </div>

      {copy.choices.map((question, index) => (
        <div key={question} className="flex flex-col gap-2">
          <span className="text-sm text-muted">{question}</span>
          <div role="radiogroup" aria-label={question} className="flex flex-wrap gap-2">
            {words[kind].choices[index].map((option) => {
              const on = draft.choices[kind][index] === option;
              return (
                <button
                  key={option}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setChoice(index, option)}
                  className={clsx(
                    "min-h-10 rounded-full border px-3.5 text-sm font-semibold",
                    on ? "border-pink bg-pink/16" : "border-white/20",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {kind === "dnd-party" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">Who’s in the party?</span>
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-[1_1_300px] text-[17px] leading-snug">{draft.members}</p>
            <button
              onClick={() => onChange({ ...draft, members: rollMembers(words.party) })}
              className="flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-4 text-sm font-semibold"
            >
              <Icon icon={faArrowRotateRight} primary="var(--color-peach)" secondary="var(--color-sky)" />
              Shuffle the party
            </button>
          </div>
        </div>
      )}

      <label className="flex flex-col gap-2 text-sm text-muted">
        Anything else about them? (optional)
        <input
          type="text"
          value={draft.details}
          maxLength={MAX_DETAILS_LENGTH}
          onChange={(event) => onChange({ ...draft, details: event.target.value })}
          placeholder="Scared of heights, loves riddles"
          className={clsx(piece, "h-13 px-4 text-[19px] placeholder:text-[#9c90c0]", writerVoice)}
        />
      </label>
    </section>
  );
}
