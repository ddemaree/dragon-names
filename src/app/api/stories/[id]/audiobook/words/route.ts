import { getWordTimes } from "@/lib/audiobook";
import { getStory } from "@/lib/stories";

// When each word of the story's audiobook is read, for the player to follow along
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const story = await getStory((await params).id);
  if (!story) return new Response("Story not found", { status: 404 });
  const times = await getWordTimes(story.story, "story-audiobook-words");
  if (!times) return new Response("Audiobook not recorded", { status: 404 });
  return Response.json(times);
}
