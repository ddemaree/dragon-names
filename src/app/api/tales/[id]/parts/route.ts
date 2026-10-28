import { type Connector, isTurnConnector, type Part } from "@/lib/tale";
import { cleanIdea, getTale, streamPart } from "@/lib/tales";
import { canEdit } from "@/lib/writer";

// Writes the next part of a storytelling-mode story and appends it once it's done
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tale = await getTale((await params).id);
  if (!tale || tale.finished) return new Response("Story not found", { status: 404 });
  // Shared links are read-only; only the browser that started the story can continue it
  if (!(await canEdit(tale))) return new Response("Only the writer can add to this story", { status: 403 });

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

  return streamPart(tale, connector, idea, ideaSource);
}
