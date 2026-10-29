import { dispatchesDragon, enforcementResponse, offTopicProbability } from "@/lib/enforcement";
import { MAX_DETAILS_LENGTH } from "@/lib/hero-draft";
import { DEFAULT_MODEL } from "@/lib/models";
import { GENRES } from "@/lib/prompt";
import { createServerClient } from "@/lib/supabase";
import { isHero } from "@/lib/tale";
import { cleanIdea, streamPart } from "@/lib/tales";
import { ensureWriterId } from "@/lib/writer";

// Starts a story about the chosen hero and streams its opening. This is a route rather than a
// server action because setting the writer cookie in an action refreshes the page mid-stream.
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const hero: unknown = body && typeof body === "object" ? Reflect.get(body, "hero") : null;
  if (!isHero(hero) || !cleanIdea(hero.name)) return new Response("Invalid hero", { status: 400 });

  // Heroes come from the browser, rolled or built, so they're capped like any other writer text
  const name = cleanIdea(hero.name, 60);
  const type = cleanIdea(hero.type, 300);
  const details = hero.details ? cleanIdea(hero.details, MAX_DETAILS_LENGTH) : "";
  // "Anything else about them?" is the only writer-typed text at the start. Check it before insert.
  if (details) {
    const probability = await offTopicProbability({ genre: GENRES[hero.kind], hero: name, writerText: details });
    if (dispatchesDragon(probability)) return enforcementResponse(probability);
  }

  const { data: tale, error } = await createServerClient()
    .from("tales")
    .insert({
      hero: {
        kind: hero.kind,
        name,
        type,
        ...(details ? { details } : {}),
      },
      model: DEFAULT_MODEL,
      d20: Reflect.get(body ?? {}, "d20") === true,
      writer: await ensureWriterId(),
    })
    .select("id, hero, model")
    .single();
  if (error || !isHero(tale.hero)) return new Response("Couldn't start the story", { status: 500 });

  return streamPart(
    { ...tale, hero: tale.hero, parts: [] },
    { connector: "once", idea: "", ideaSource: "none" },
    { "x-tale-id": tale.id },
  );
}
