import { createTextStreamResponse, streamText, toTextStream } from "ai";
import { createServerClient } from "@/lib/supabase";
import { splitBook } from "@/lib/tale";
import { bookPrompt, getTale, TALE_INSTRUCTIONS } from "@/lib/tales";
import { flushTelemetry } from "@/lib/telemetry";
import { canEdit } from "@/lib/writer";

// "Make it a book": joins a finished story's parts into one polished story with a title.
// The parts are kept, so the writer can always compare the book with their own draft.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tale = await getTale((await params).id);
  if (!tale || !tale.finished) return new Response("Story not found", { status: 404 });
  if (!(await canEdit(tale))) return new Response("Only the writer can make this a book", { status: 403 });

  const result = streamText({
    model: tale.model,
    instructions: TALE_INSTRUCTIONS,
    prompt: bookPrompt(tale),
    reasoning: "none",
    runtimeContext: { sessionId: tale.id },
    telemetry: { functionId: "tale-book", includeRuntimeContext: { sessionId: true } },
  });

  // Save before the response ends, so a reload shows the book
  const save = new TransformStream<string, string>({
    async flush() {
      try {
        const { title, book } = splitBook(await result.text);
        if (!title || !book) return;
        const { error } = await createServerClient()
          .from("tales")
          .update({ title, book, updated_at: new Date().toISOString() })
          .eq("id", tale.id);
        if (error) console.error("Failed to save book", error);
      } finally {
        await flushTelemetry();
      }
    },
  });

  return createTextStreamResponse({ stream: toTextStream({ stream: result.stream }).pipeThrough(save) });
}
