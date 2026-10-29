import { dispatchesDragon, enforcementResponse, offTopicProbability } from "@/lib/enforcement";
import { GENRES } from "@/lib/prompt";
import { awaitingRoll, type Connector, isTurnConnector, type Part } from "@/lib/tale";
import { cleanCheck, cleanIdea, getTale, streamPart } from "@/lib/tales";
import { canEdit } from "@/lib/writer";

// Writes the next part of a storytelling-mode story and appends it once it's done
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tale = await getTale((await params).id);
  if (!tale || tale.finished) return new Response("Story not found", { status: 404 });
  // Shared links are read-only; only the browser that started the story can continue it
  if (!(await canEdit(tale))) return new Response("Only the writer can add to this story", { status: 403 });
  // In D20 Mode, a part that called for a check is followed by the DM's part, from the roll
  if (awaitingRoll(tale.parts)) return new Response("Waiting for a roll", { status: 409 });

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

  // D20 Mode: a risky idea's part stops before we find out whether it works
  const check = tale.d20 && idea && isTurnConnector(connector) ? cleanCheck(Reflect.get(input, "check")) : null;

  // Picked ideas skip this. A hit returns before anything is streamed or saved.
  if (ideaSource === "write-in") {
    const probability = await offTopicProbability({
      genre: GENRES[tale.hero.kind],
      hero: tale.hero.name,
      writerText: idea,
      sessionId: tale.id,
    });
    if (dispatchesDragon(probability)) return enforcementResponse(probability);
  }

  return streamPart(tale, { connector, idea, ideaSource, ...(check ? { check } : {}) });
}
