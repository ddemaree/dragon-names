import { audioResponse, getAudiobook } from "@/lib/audiobook";
import { getStory } from "@/lib/stories";

// "Make it an audiobook": the finished story, read aloud
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const story = await getStory((await params).id);
  if (!story) return new Response("Story not found", { status: 404 });
  return audioResponse(await getAudiobook(story.story, "story-audiobook"));
}
