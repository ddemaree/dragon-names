"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { micromark } from "micromark";
import posthog from "posthog-js";
import Layout from "@/components/Layout";
import DragonButton from "@/components/DragonButton";
import CharacterCard from "@/components/CharacterCard";
import {
  CHARACTER_KINDS,
  type CharacterKind,
  DEFAULT_SLIDERS,
  isCharacterKind,
  isSliderId,
  SLIDERS,
} from "@/lib/characters";
import { DEFAULT_MODEL, isModelId, MODELS, type ModelId } from "@/lib/models";

// Lottie touches `document` on import, so keep it out of the server render
const ImaginingAnimation = dynamic(() => import("@/components/ImaginingAnimation"), {
  ssr: false,
});

type Character = { kind: CharacterKind; name: string; type: string };

const posthogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST,
);

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
        kind,
        name: decodeURIComponent(response.headers.get("x-character-name") ?? ""),
        type: decodeURIComponent(response.headers.get("x-character-type") ?? ""),
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

  return (
    <Layout>
      {!character && (
        <h1 className="text-2xl font-semibold mb-4">June's Dragon Generator</h1>
      )}

      {character && <CharacterCard {...character} />}

      {story && (
        <div
          className="text-left text-lg [&>*+*]:mt-6"
          dangerouslySetInnerHTML={{ __html: micromark(story) }}
        />
      )}

      {working && !story && (
        <div>
          <DragonButton disabled={true}>Imagining dragons…</DragonButton>

          <ImaginingAnimation />
        </div>
      )}

      {!working && (
        <div className={character ? "mt-10 border-t border-pink-500 py-8" : undefined}>
          <div className="mb-6 flex flex-wrap justify-center gap-2" role="radiogroup">
            {Object.entries(CHARACTER_KINDS).map(([id, { label }]) => (
              <button
                key={id}
                role="radio"
                aria-checked={kind === id}
                onClick={() => {
                  if (!isCharacterKind(id)) return;
                  setKind(id);
                  // Settings differ per character, so go back to "surprise me"
                  setSetting("");
                }}
                className={clsx(
                  "px-3 py-1 border border-pink-600",
                  kind === id ? "bg-pink-600 text-white" : "text-pink-600",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-8 flex flex-col gap-4 text-left font-sans text-sm">
            <label className="flex flex-col gap-1">
              Setting
              <select
                value={setting}
                onChange={(event) => setSetting(event.target.value)}
                className="border border-pink-600 p-2"
              >
                <option value="">Surprise me</option>
                {CHARACTER_KINDS[kind].settings.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            {Object.entries(SLIDERS).map(([id, { min, max }]) => (
              <label key={id} className="flex flex-col gap-1">
                <span className="flex justify-between">
                  <span>{min}</span>
                  <span>{max}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={isSliderId(id) ? sliders[id] : 0}
                  onChange={(event) => {
                    if (!isSliderId(id)) return;
                    const value = Number(event.target.value);
                    setSliders((current) => ({ ...current, [id]: value }));
                  }}
                  className="accent-pink-600"
                />
              </label>
            ))}

            <details>
              <summary className="cursor-pointer text-neutral-500">Advanced options</summary>
              <label className="mt-2 flex flex-col gap-1">
                Model
                <select
                  value={model}
                  onChange={(event) => isModelId(event.target.value) && setModel(event.target.value)}
                  className="border border-pink-600 p-2"
                >
                  {Object.entries(MODELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </details>
          </div>

          <DragonButton onClick={makeStory}>{CHARACTER_KINDS[kind].button}</DragonButton>
        </div>
      )}
    </Layout>
  );
}
