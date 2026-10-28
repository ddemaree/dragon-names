"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { micromark } from "micromark";
import posthog from "posthog-js";
import Layout from "@/components/Layout";
import DragonButton from "@/components/DragonButton";
import CharacterCard from "@/components/CharacterCard";
import { CHARACTER_KINDS, type CharacterKind, isCharacterKind } from "@/lib/characters";

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
  const [working, setWorking] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);
  const [story, setStory] = useState("");

  async function makeStory() {
    if (posthogConfigured) posthog.capture("dragon_generation_requested", { kind });
    setWorking(true);
    setCharacter(null);
    setStory("");

    try {
      const response = await fetch("/api/story", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind }),
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

      if (posthogConfigured) posthog.capture("dragon_generation_completed", { kind });
    } catch (error) {
      if (posthogConfigured) posthog.capture("dragon_generation_failed", { kind });
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
                onClick={() => isCharacterKind(id) && setKind(id)}
                className={clsx(
                  "px-3 py-1 border border-pink-600",
                  kind === id ? "bg-pink-600 text-white" : "text-pink-600",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <DragonButton onClick={makeStory}>{CHARACTER_KINDS[kind].button}</DragonButton>
        </div>
      )}
    </Layout>
  );
}
