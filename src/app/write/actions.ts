"use server";

import { generateText, Output } from "ai";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { awaitingRoll, type Check, type Idea, isTurnConnector } from "@/lib/tale";
import { checkPrompt, cleanCheck, cleanIdea, getTale, ideasPrompt, rollHeroes, TALE_INSTRUCTIONS } from "@/lib/tales";
import { flushTelemetry } from "@/lib/telemetry";
import { canEdit } from "@/lib/writer";

export async function rollHeroesAction() {
  return rollHeroes();
}

// Exactly three ideas for the next part, so every turn looks the same
export async function suggestIdeas(taleId: string, connector: string, avoid: string[] = []): Promise<Idea[]> {
  const tale = await getTale(taleId);
  if (!tale || tale.finished || !isTurnConnector(connector) || !(await canEdit(tale))) {
    throw new Error("Can't suggest ideas here");
  }

  try {
    const { output } = await generateText({
      model: tale.model,
      instructions: TALE_INSTRUCTIONS,
      prompt: ideasPrompt(tale, connector, avoid.slice(0, 6).map((idea) => cleanIdea(idea))),
      output: Output.object({
        schema: z.object({
          ideas: z.array(z.object({ text: z.string(), check: z.string().nullable() })).length(3),
        }),
      }),
      reasoning: "none",
      runtimeContext: { sessionId: tale.id },
      telemetry: { functionId: "tale-ideas", includeRuntimeContext: { sessionId: true } },
    });
    return output.ideas.map((idea) => ({
      text: cleanIdea(idea.text),
      check: tale.d20 && idea.check ? cleanIdea(idea.check, 40) : null,
    }));
  } finally {
    await flushTelemetry();
  }
}

// D20 Mode: the DM decides whether an idea needs a roll; null means it just happens
export async function callCheck(taleId: string, idea: string, suggested: string | null): Promise<(Check & { explanation: string }) | null> {
  const tale = await getTale(taleId);
  if (!tale || tale.finished || !tale.d20 || awaitingRoll(tale.parts) || !(await canEdit(tale))) {
    throw new Error("Can't call a check here");
  }

  try {
    const { output } = await generateText({
      model: tale.model,
      instructions: TALE_INSTRUCTIONS,
      prompt: checkPrompt(tale, cleanIdea(idea), suggested ? cleanIdea(suggested, 40) : null),
      output: Output.object({
        schema: z.object({
          needsRoll: z.boolean(),
          name: z.string(),
          target: z.number().int(),
          reason: z.string(),
          explanation: z.string(),
        }),
      }),
      reasoning: "none",
      runtimeContext: { sessionId: tale.id },
      telemetry: { functionId: "tale-check", includeRuntimeContext: { sessionId: true } },
    });
    const check = output.needsRoll ? cleanCheck(output) : null;
    return check && { ...check, explanation: cleanIdea(output.explanation, 300) };
  } finally {
    await flushTelemetry();
  }
}

// Reopens a finished story: drops the ending and the book made from it, so the writer can add more
export async function keepGoing(taleId: string) {
  const tale = await getTale(taleId);
  if (!tale || !tale.finished || !(await canEdit(tale))) throw new Error("Can't reopen this story");

  const parts = tale.parts.at(-1)?.connector === "end" ? tale.parts.slice(0, -1) : tale.parts;
  const { error } = await createServerClient()
    .from("tales")
    .update({ parts, finished: false, title: null, book: null, updated_at: new Date().toISOString() })
    .eq("id", tale.id);
  if (error) throw error;
  return parts;
}
