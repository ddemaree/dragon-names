import { createTextStreamResponse, streamText, toTextStream } from "ai";
import { after } from "next/server";
import { isCharacterKind } from "@/lib/characters";
import { makeCharacter } from "@/lib/names";
import { createServerClient } from "@/lib/supabase";
import { flushTelemetry } from "@/lib/telemetry";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const kind = isCharacterKind(body?.kind) ? body.kind : "dragons";

  const { name, type, prompt } = await makeCharacter(kind);
  const id = crypto.randomUUID();

  const result = streamText({
    model: "anthropic/claude-haiku-5.5",
    instructions:
      "You write short, cheerful stories for readers around 10 to 13 years old. Use Markdown paragraphs with no headings.",
    prompt,
    maxOutputTokens: 600,
    runtimeContext: { sessionId: id },
    telemetry: {
      functionId: `story-${kind}`,
      includeRuntimeContext: { sessionId: true },
    },
  });

  // Save once the stream finishes, so the permalink works after the story is shown
  after(async () => {
    try {
      const story = await result.text;
      const { error } = await createServerClient()
        .from("stories")
        .insert({ id, name, type, story, options: { kind } });
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
