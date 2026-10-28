import { createTextStreamResponse, streamText, toTextStream } from "ai";
import { after } from "next/server";
import { makeDragon } from "@/lib/names";
import { flushTelemetry } from "@/lib/telemetry";

export async function POST() {
  const { name, type } = await makeDragon();

  const result = streamText({
    model: "anthropic/claude-haiku-5.5",
    instructions:
      "You write short, cheerful stories for young children. Use simple Markdown paragraphs with no headings.",
    prompt: `Write a cute, brief story about a ${type} dragon named ${name}.`,
    maxOutputTokens: 600,
    runtimeContext: { sessionId: crypto.randomUUID() },
    telemetry: {
      functionId: "dragon-story",
      includeRuntimeContext: { sessionId: true },
    },
  });

  after(flushTelemetry);

  return createTextStreamResponse({
    stream: toTextStream({ stream: result.stream }),
    headers: {
      "x-dragon-name": encodeURIComponent(name),
      "x-dragon-type": encodeURIComponent(type),
    },
  });
}
