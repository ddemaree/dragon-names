import { awaitingRoll, rollConnector } from "@/lib/tale";
import { getTale, streamPart } from "@/lib/tales";
import { canEdit } from "@/lib/writer";

// D20 Mode: rolls for the check the last part called for, then streams the DM's part.
// The roll is made here rather than in the browser, and sent back as `x-roll`.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tale = await getTale((await params).id);
  if (!tale || tale.finished) return new Response("Story not found", { status: 404 });
  if (!(await canEdit(tale))) return new Response("Only the writer can add to this story", { status: 403 });

  const check = awaitingRoll(tale.parts);
  if (!check) return new Response("Nothing to roll for", { status: 409 });

  const value = Math.floor(Math.random() * 20) + 1;
  const connector = rollConnector(value, check.target);
  return streamPart(tale, { connector, idea: "", ideaSource: "none", roll: { value, check } }, { "x-roll": String(value) });
}
