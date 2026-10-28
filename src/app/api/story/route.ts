import { createTextStreamResponse, streamText, toTextStream } from "ai";
import { after } from "next/server";
import { makeCharacter } from "@/lib/names";
import { buildPrompt, INSTRUCTIONS, parseStoryOptions } from "@/lib/prompt";
import { createServerClient } from "@/lib/supabase";
import { flushTelemetry } from "@/lib/telemetry";

export async function POST(request: Request) {
  const options = parseStoryOptions(await request.json().catch(() => null));
  const { name, type, subject } = await makeCharacter(options.kind);
  const id = crypto.randomUUID();

  const result = streamText({
    model: "anthropic/claude-haiku-5.5",
    instructions: INSTRUCTIONS,
    prompt: buildPrompt(subject, options),
    // Short stories don't need it, and it slows down the first words
    reasoning: "none",
    runtimeContext: { sessionId: id },
    telemetry: {
      functionId: `story-${options.kind}`,
      includeRuntimeContext: { sessionId: true },
    },
  });

  // Save once the stream finishes, so the permalink works after the story is shown
  after(async () => {
    try {
      const story = await result.text;
      if (!story.trim()) {
        console.error("Story generation returned no text", await result.finishReason);
        return;
      }
      const { error } = await createServerClient()
        .from("stories")
        .insert({ id, name, type, story, options });
      if (error) console.error("Failed to save story", error);
    } finally {
      await flushTelemetry();
    }
  });

  return createTextStreamResponse({
    stream: toTextStream({ stream: result.stream }),
    headers: {
      "x-story-id": id,
      "x-character-name": encodeURIComponent(name),
      "x-character-type": encodeURIComponent(type),
    },
  });
}
