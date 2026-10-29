import { audioResponse, getAudiobook } from "@/lib/audiobook";
import { getTale } from "@/lib/tales";

// "Make it an audiobook": the book version of a finished story, title first
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tale = await getTale((await params).id);
  if (!tale?.book) return new Response("Book not found", { status: 404 });
  return audioResponse(await getAudiobook(tale.title ? `${tale.title}.\n\n${tale.book}` : tale.book, "tale-audiobook"));
}
