import { createTextStreamResponse, streamText, toTextStream } from "ai";
import { after } from "next/server";
import { makeDragon } from "@/lib/names";
import { createServerClient } from "@/lib/supabase";
import { flushTelemetry } from "@/lib/telemetry";

export async function POST() {
  const { name, type } = await makeDragon();
  const id = crypto.randomUUID();

  const result = streamText({
    model: "anthropic/claude-haiku-5.5",
    instructions:
      "You write short, cheerful stories for young children. Use simple Markdown paragraphs with no headings.",
    prompt: `Write a cute, brief story about a ${type} dragon named ${name}.`,
    maxOutputTokens: 600,
    runtimeContext: { sessionId: id },
    telemetry: {
      functionId: "dragon-story",
      includeRuntimeContext: { sessionId: true },
    },
  });

  // Save once the stream finishes, so the permalink works after the story is shown
  after(async () => {
    try {
      const story = await result.text;
      const { error } = await createServerClient()
        .from("stories")
        .insert({ id, name, type, story });
      if (error) console.error("Failed to save story", error);
    } finally {
      await flushTelemetry();
    }
  });

  return createTextStreamResponse({
    stream: toTextStream({ stream: result.stream }),
    headers: {
      "x-story-id": id,
      "x-dragon-name": encodeURIComponent(name),
      "x-dragon-type": encodeURIComponent(type),
    },
  });
}
