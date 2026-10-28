import { createTextStreamResponse, streamText, toTextStream } from "ai";
import { createServerClient } from "@/lib/supabase";
import { type Connector, isTurnConnector, type Part } from "@/lib/tale";
import { cleanIdea, getTale, partPrompt, TALE_INSTRUCTIONS } from "@/lib/tales";
import { flushTelemetry } from "@/lib/telemetry";

// Writes the next part of a storytelling-mode story and appends it once it's done
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tale = await getTale((await params).id);
  if (!tale || tale.finished) return new Response("Story not found", { status: 404 });

  const body: unknown = await request.json().catch(() => null);
  const input = body && typeof body === "object" ? body : {};
  const requested: unknown = Reflect.get(input, "connector");

  // The first part is always the opening; after that the writer picks a connector or ends it
  let connector: Connector;
  if (tale.parts.length === 0) connector = "once";
  else if (requested === "end" || isTurnConnector(requested)) connector = requested;
  else return new Response("Unknown connector", { status: 400 });

  const idea = connector === "once" || connector === "end" ? "" : cleanIdea(Reflect.get(input, "idea"));
  const ideaSource: Part["ideaSource"] = !idea
    ? "none"
    : Reflect.get(input, "ideaSource") === "write-in"
      ? "write-in"
      : "option";

  const result = streamText({
    model: tale.model,
    instructions: TALE_INSTRUCTIONS,
    prompt: partPrompt(tale, connector, idea),
    reasoning: "none",
    runtimeContext: { sessionId: tale.id },
    telemetry: { functionId: `tale-part-${connector}`, includeRuntimeContext: { sessionId: true } },
  });

  // Save before the response ends, so the next turn's ideas already see this part
  const save = new TransformStream<string, string>({
    async flush() {
      try {
        const text = (await result.text).trim();
        if (!text) return;
        const { error } = await createServerClient()
          .from("tales")
          .update({
            parts: [...tale.parts, { connector, idea, ideaSource, text }],
            finished: connector === "end",
            updated_at: new Date().toISOString(),
          })
          .eq("id", tale.id);
        if (error) console.error("Failed to save story part", error);
      } finally {
        await flushTelemetry();
      }
    },
  });

  return createTextStreamResponse({
    stream: toTextStream({ stream: result.stream }).pipeThrough(save),
    headers: { "x-part-connector": connector },
  });
}
