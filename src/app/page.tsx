"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { micromark } from "micromark";
import posthog from "posthog-js";
import Layout from "@/components/Layout";
import DragonButton from "@/components/DragonButton";
import DragonName from "@/components/DragonName";

// Lottie touches `document` on import, so keep it out of the server render
const ImaginingAnimation = dynamic(() => import("@/components/ImaginingAnimation"), {
  ssr: false,
});

type Dragon = { name: string; type: string };

const posthogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST,
);

export default function HomePage() {
  const [working, setWorking] = useState(false);
  const [dragon, setDragon] = useState<Dragon | null>(null);
  const [story, setStory] = useState("");

  async function makeDragon() {
    if (posthogConfigured) posthog.capture("dragon_generation_requested");
    setWorking(true);
    setDragon(null);
    setStory("");

    try {
      const response = await fetch("/api/story", { method: "POST" });
      if (!response.ok || !response.body) throw new Error(response.statusText);

      setDragon({
        name: decodeURIComponent(response.headers.get("x-dragon-name") ?? ""),
        type: decodeURIComponent(response.headers.get("x-dragon-type") ?? ""),
      });

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setStory((text) => text + value);
      }

      if (posthogConfigured) posthog.capture("dragon_generation_completed");
    } catch (error) {
      if (posthogConfigured) posthog.capture("dragon_generation_failed");
      throw error;
    } finally {
      setWorking(false);
    }
  }

  return (
    <Layout>
      {!dragon && (
        <h1 className="text-2xl font-semibold mb-4">June's Dragon Generator</h1>
      )}

      {dragon && <DragonName name={dragon.name} dragonType={dragon.type} />}

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
        <div className={dragon ? "mt-10 border-t border-pink-500 py-8" : undefined}>
          <DragonButton onClick={makeDragon}>
            {dragon ? "Make me another dragon" : "Make me a dragon"}
          </DragonButton>
        </div>
      )}
    </Layout>
  );
}
