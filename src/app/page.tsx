"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import clsx from "clsx";
import { micromark } from "micromark";
import posthog from "posthog-js";
import { faDragon, faSparkles } from "@fortawesome/pro-duotone-svg-icons";
import Layout from "@/components/Layout";
import DragonButton from "@/components/DragonButton";
import CharacterCard from "@/components/CharacterCard";
import Audiobook from "@/components/Audiobook";
import Icon from "@/components/Icon";
import {
  CHARACTER_KINDS,
  type CharacterKind,
  DEFAULT_SLIDERS,
  isCharacterKind,
  isSliderId,
  SLIDERS,
} from "@/lib/characters";
import { KIND_ICONS, settingIcon, SLIDER_ICONS } from "@/lib/icons";
import { DEFAULT_MODEL, isModelId, MODELS, type ModelId } from "@/lib/models";

// Lottie touches `document` on import, so keep it out of the server render
const ImaginingAnimation = dynamic(() => import("@/components/ImaginingAnimation"), {
  ssr: false,
});

type Character = { id: string; kind: CharacterKind; name: string; type: string; setting: string };

const posthogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST,
);

const sectionHeading =
  "text-[15px] font-semibold tracking-widest text-pink [font-variant-caps:all-small-caps]";

export default function HomePage() {
  const [kind, setKind] = useState<CharacterKind>("dragons");
  // An empty setting means "surprise me"
  const [setting, setSetting] = useState("");
  const [sliders, setSliders] = useState(DEFAULT_SLIDERS);
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [working, setWorking] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);
  const [story, setStory] = useState("");

  async function makeStory() {
    if (posthogConfigured) posthog.capture("dragon_generation_requested", { kind, model });
    setWorking(true);
    setCharacter(null);
    setStory("");

    try {
      const response = await fetch("/api/story", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, setting: setting || null, model, ...sliders }),
      });
      if (!response.ok || !response.body) throw new Error(response.statusText);

      setCharacter({
        id: response.headers.get("x-story-id") ?? "",
        kind,
        name: decodeURIComponent(response.headers.get("x-character-name") ?? ""),
        type: decodeURIComponent(response.headers.get("x-character-type") ?? ""),
        setting: decodeURIComponent(response.headers.get("x-story-setting") ?? ""),
      });

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setStory((text) => text + value);
      }

      // The story is saved once the stream ends; make the URL its permalink
      window.history.replaceState(null, "", `/stories/${response.headers.get("x-story-id")}`);

      if (posthogConfigured) posthog.capture("dragon_generation_completed", { kind, model });
    } catch (error) {
      if (posthogConfigured) posthog.capture("dragon_generation_failed", { kind, model });
      throw error;
    } finally {
      setWorking(false);
    }
  }

  // Back to the form, keeping the reader's last choices
  function startOver() {
    setCharacter(null);
    setStory("");
    window.history.replaceState(null, "", "/");
  }

  const settingOptions = [
    { value: "", label: "Surprise me", icon: faSparkles },
    ...CHARACTER_KINDS[kind].settings.map((option) => ({
      value: option,
      label: option.charAt(0).toUpperCase() + option.slice(1),
      icon: settingIcon(option) ?? faDragon,
    })),
  ];

  return (
    <Layout>
      {character && <CharacterCard {...character} sliders={sliders} />}

      {story && (
        <article
          className="flex flex-col gap-5 rounded-[28px] bg-white/7 px-6 py-8 text-[19px] leading-relaxed text-ink-soft shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] sm:px-11 sm:py-10"
          dangerouslySetInnerHTML={{ __html: micromark(story) }}
        />
      )}

      {working && !story && (
        <div className="flex flex-col items-center">
          <DragonButton disabled={true}>Imagining dragons…</DragonButton>
          <ImaginingAnimation />
        </div>
      )}

      {!working && character && story && (
        // The key starts a new story without the last one's audiobook
        <Audiobook key={character.id} src={`/api/stories/${character.id}/audiobook`} kind="story" />
      )}

      {!working && character && <DragonButton onClick={startOver}>Make me another story</DragonButton>}

      {!working && !character && (
        <>
          <header className="-mt-4 flex flex-col items-center gap-3.5 text-center">
            <h1 className="font-display text-5xl leading-[0.95] font-light tracking-tight sm:text-7xl">
              Dragon Generator
            </h1>
            <p className="text-lg text-muted">Pick a hero, a place and a mood. We’ll write the story.</p>
            <Link href="/write" className="text-pink underline decoration-pink/40 underline-offset-4 hover:text-white">
              Or write your own story, one part at a time
            </Link>
          </header>

          <div className="flex flex-wrap justify-center gap-5" role="radiogroup" aria-label="Character">
            {Object.entries(CHARACTER_KINDS).map(([id, { label }]) => {
              if (!isCharacterKind(id)) return null;
              const on = kind === id;
              return (
                <button
                  key={id}
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setKind(id);
                    // Settings differ per character, so go back to "surprise me"
                    setSetting("");
                  }}
                  className="flex w-32 flex-col items-center gap-2.5 font-semibold"
                >
                  <span
                    className={clsx(
                      "flex size-24 items-center justify-center rounded-full",
                      on
                        ? "bg-linear-135 from-hot-pink to-violet shadow-[0_0_36px_rgb(255_143_200/0.6)]"
                        : "bg-white/8 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)]",
                    )}
                  >
                    <Icon
                      icon={KIND_ICONS[id]}
                      primary="#fff"
                      secondary={on ? "var(--color-peach)" : "var(--color-sky)"}
                      className="text-[46px]"
                    />
                  </span>
                  {label}
                </button>
              );
            })}
          </div>

          <section className="flex flex-col gap-7 rounded-[28px] bg-white/7 px-6 py-8 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] sm:px-9">
            <div className="flex flex-col gap-3">
              <h2 className={sectionHeading}>Where does it happen?</h2>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Setting">
                {settingOptions.map((option) => {
                  const on = setting === option.value;
                  return (
                    <button
                      key={option.value}
                      role="radio"
                      aria-checked={on}
                      onClick={() => setSetting(option.value)}
                      className={clsx(
                        "flex min-h-11 items-center gap-2 rounded-full border py-2 pr-4 pl-3 text-[15px] font-medium",
                        on ? "border-ink bg-ink text-night" : "border-white/28",
                      )}
                    >
                      <Icon
                        icon={option.icon}
                        primary={on ? "var(--color-deep-violet)" : "#fff"}
                        secondary={on ? "#ff6fb5" : "var(--color-sky)"}
                        className="text-xl"
                      />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className={clsx(sectionHeading, "mb-1.5")}>What’s the mood?</h2>
              {Object.entries(SLIDERS).map(([id, { min, max }]) => {
                if (!isSliderId(id)) return null;
                return (
                  <label
                    key={id}
                    className="grid min-h-12 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-3.5 text-[15px] text-lilac"
                  >
                    <span className="flex items-center gap-2">
                      <Icon
                        icon={SLIDER_ICONS[id].min}
                        primary="#fff"
                        secondary="var(--color-sky)"
                        // The hearts at the "No romance" end are faded
                        className={clsx("text-[22px]", id === "romance" && "opacity-30")}
                      />
                      {min}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={sliders[id]}
                      aria-label={`${min} to ${max}`}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setSliders((current) => ({ ...current, [id]: value }));
                      }}
                      className="h-7 w-full accent-hot-pink"
                    />
                    <span className="flex items-center justify-end gap-2 text-right">
                      {max}
                      <Icon
                        icon={SLIDER_ICONS[id].max}
                        primary="var(--color-pink)"
                        secondary="var(--color-orange)"
                        className="text-[22px]"
                      />
                    </span>
                  </label>
                );
              })}
            </div>

            <details className="text-sm text-muted">
              <summary className="cursor-pointer">Advanced options</summary>
              <label className="mt-3 flex flex-col gap-1">
                Model
                <select
                  value={model}
                  onChange={(event) => isModelId(event.target.value) && setModel(event.target.value)}
                  className="rounded-xl border border-white/28 bg-night p-2 text-ink"
                >
                  {Object.entries(MODELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </details>
          </section>

          <DragonButton onClick={makeStory}>{CHARACTER_KINDS[kind].button}</DragonButton>
        </>
      )}
    </Layout>
  );
}
