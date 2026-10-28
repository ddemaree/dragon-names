"use server";

import { generateText, Output } from "ai";
import { z } from "zod";
import { DEFAULT_MODEL } from "@/lib/models";
import { createServerClient } from "@/lib/supabase";
import { type Hero, isHero, isTurnConnector } from "@/lib/tale";
import { cleanIdea, getTale, ideasPrompt, rollHeroes, TALE_INSTRUCTIONS } from "@/lib/tales";
import { flushTelemetry } from "@/lib/telemetry";

export async function rollHeroesAction() {
  return rollHeroes();
}

// Starts a story about the chosen hero; the opening part is written by the parts route
export async function createTale(hero: Hero) {
  if (!isHero(hero)) throw new Error("Invalid hero");

  const { data, error } = await createServerClient()
    .from("tales")
    .insert({
      // Rolled heroes come from the browser, so they're capped like any other writer text
      hero: { kind: hero.kind, name: cleanIdea(hero.name, 60), type: cleanIdea(hero.type, 300) },
      model: DEFAULT_MODEL,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// Exactly three ideas for the next part, so every turn looks the same
export async function suggestIdeas(taleId: string, connector: string, avoid: string[] = []) {
  const tale = await getTale(taleId);
  if (!tale || tale.finished || !isTurnConnector(connector)) throw new Error("Can't suggest ideas here");

  try {
    const { output } = await generateText({
      model: tale.model,
      instructions: TALE_INSTRUCTIONS,
      prompt: ideasPrompt(tale, connector, avoid.slice(0, 6).map((idea) => cleanIdea(idea))),
      output: Output.object({ schema: z.object({ ideas: z.array(z.string()).length(3) }) }),
      reasoning: "none",
      runtimeContext: { sessionId: tale.id },
      telemetry: { functionId: "tale-ideas", includeRuntimeContext: { sessionId: true } },
    });
    return output.ideas.map((idea) => cleanIdea(idea));
  } finally {
    await flushTelemetry();
  }
}
