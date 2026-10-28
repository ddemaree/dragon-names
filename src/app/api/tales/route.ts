import { DEFAULT_MODEL } from "@/lib/models";
import { createServerClient } from "@/lib/supabase";
import { isHero } from "@/lib/tale";
import { cleanIdea, streamPart } from "@/lib/tales";
import { ensureWriterId } from "@/lib/writer";

// Starts a story about the chosen hero and streams its opening. This is a route rather than a
// server action because setting the writer cookie in an action refreshes the page mid-stream.
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const hero: unknown = body && typeof body === "object" ? Reflect.get(body, "hero") : null;
  if (!isHero(hero)) return new Response("Invalid hero", { status: 400 });

  const { data: tale, error } = await createServerClient()
    .from("tales")
    .insert({
      // Rolled heroes come from the browser, so they're capped like any other writer text
      hero: { kind: hero.kind, name: cleanIdea(hero.name, 60), type: cleanIdea(hero.type, 300) },
      model: DEFAULT_MODEL,
      writer: await ensureWriterId(),
    })
    .select("id, hero, model")
    .single();
  if (error || !isHero(tale.hero)) return new Response("Couldn't start the story", { status: 500 });

  return streamPart({ ...tale, hero: tale.hero, parts: [] }, "once", "", "none", { "x-tale-id": tale.id });
}
