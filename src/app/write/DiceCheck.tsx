"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { faDiceD20, faHatWizard } from "@fortawesome/pro-duotone-svg-icons";
import Icon from "@/components/Icon";
import { type Check, CONNECTORS, type Connector } from "@/lib/tale";

// The DM's words are set in Polymath's manuscript forms: uncial a, squiggly g, dot r, cursive s
export const dmVoice = "[font-feature-settings:'ss08','ss10','ss13','ss14']";
const connectorWord = "font-display font-extrabold [font-stretch:75%] leading-none";
const chip = "flex min-h-10 items-center rounded-xl bg-white/8 px-3.5 text-[15px]";

// What each roll does to the story, for the check's target
function bands(target: number): { range: string; connector: Connector }[] {
  const range = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`);
  const result: { range: string; connector: Connector }[] = [{ range: "1", connector: "ohno" }];
  if (target > 2) result.push({ range: range(2, target - 1), connector: "but" });
  result.push({ range: range(target, 19), connector: "and" }, { range: "20", connector: "legendary" });
  return result;
}

export function DmLabel({ children }: { children: string }) {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold tracking-widest text-peach [font-variant-caps:all-small-caps]">
      <Icon icon={faHatWizard} primary="var(--color-peach)" secondary="var(--color-violet)" className="text-lg" />
      {children}
    </span>
  );
}

type PanelProps = {
  // null while the DM is deciding
  check: (Check & { explanation?: string }) | null;
  busy: boolean;
  onRoll: () => void;
  // Not offered once the writer's part has been written
  onSkip?: () => void;
};

// The DM calls for a check: what it is, what it needs, and what each roll does
export function CheckPanel({ check, busy, onRoll, onSkip }: PanelProps) {
  return (
    <section className="flex flex-col gap-5 rounded-[28px] bg-white/7 px-6 py-7 shadow-[inset_0_0_0_1px_rgb(255_211_166/0.45),0_0_60px_-20px_rgb(255_176_112/0.5)] sm:px-8">
      <DmLabel>The Dungeon Master</DmLabel>
      {check ? (
        <>
          <p className={clsx("text-[22px] leading-normal text-[#fff3e6]", dmVoice)}>
            {check.explanation || "Roll to see how it goes."}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <span className={clsx(chip, "font-semibold")}>{check.name}</span>
            <span className={clsx(chip, "font-semibold")}>Needs {check.target} or more</span>
            {check.reason && <span className={clsx(chip, "text-muted")}>{check.reason}</span>}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {bands(check.target).map(({ range, connector }) => (
              <div key={connector} className="flex flex-col gap-0.5 rounded-[14px] bg-white/4 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]">
                <span className="text-[13px] text-muted [font-feature-settings:'tnum']">{range}</span>
                <span className={clsx(connectorWord, "text-[22px]")} style={{ color: CONNECTORS[connector].color }}>
                  {CONNECTORS[connector].word}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {onSkip ? (
              <button
                onClick={onSkip}
                disabled={busy}
                className="min-h-12 rounded-full border border-white/30 px-4.5 text-[15px] font-semibold"
              >
                Skip the roll, it just happens
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={onRoll}
              disabled={busy}
              className="flex min-h-16 items-center gap-3 rounded-full bg-linear-to-r from-pink via-peach to-pale-sky px-8 text-xl font-bold text-night shadow-[0_0_44px_rgb(255_176_112/0.5)] disabled:opacity-60"
            >
              <Icon icon={faDiceD20} primary="var(--color-night)" secondary="var(--color-violet)" className="text-[30px]" />
              Roll the d20
            </button>
          </div>
        </>
      ) : (
        <p className={clsx("text-[22px] leading-normal text-muted", dmVoice)}>The Dungeon Master is thinking…</p>
      )}
    </section>
  );
}

// A d20 showing the roll, or tumbling through numbers until it lands
function Die({ value }: { value: number | null }) {
  const [tumble, setTumble] = useState(1);
  useEffect(() => {
    if (value !== null) return;
    const timer = setInterval(() => setTumble(Math.floor(Math.random() * 20) + 1), 80);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="relative flex size-16 flex-none items-center justify-center">
      <Icon
        icon={faDiceD20}
        primary="var(--color-violet)"
        secondary="var(--color-peach)"
        className={clsx("absolute inset-0 text-[64px] drop-shadow-[0_0_12px_rgb(255_176_112/0.6)]", value === null && "animate-spin")}
      />
      <span className="relative mt-1 rounded-md bg-night px-1.5 text-xl font-extrabold [font-feature-settings:'tnum']">
        {value ?? tumble}
      </span>
    </span>
  );
}

type RollProps = {
  connector: Connector;
  check: Check;
  // null while the die is still rolling
  value: number | null;
  text: string;
};

// The DM's part: the roll, what it did, and the DM's writing
export function RollCard({ connector, check, value, text }: RollProps) {
  const { word, color } = CONNECTORS[connector];
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-white/7 px-6 py-6 shadow-[inset_0_0_0_1px_rgb(255_211_166/0.45)]">
      <div className="flex flex-wrap items-center gap-3.5">
        <Die value={value} />
        <span className="flex flex-col gap-0.5">
          <span className={clsx(connectorWord, "text-[34px]")} style={value === null ? undefined : { color }}>
            {value === null ? "Rolling…" : word}
          </span>
          <span className="text-sm text-muted">
            {value === null
              ? `Needs ${check.target} or more for the ${check.name}`
              : `Rolled ${value}, needed ${check.target} for the ${check.name}`}
          </span>
        </span>
      </div>
      {text && <p className={clsx("text-[21px] leading-normal text-[#fff3e6]", dmVoice)}>{text}</p>}
      <DmLabel>Written by the DM</DmLabel>
    </div>
  );
}
