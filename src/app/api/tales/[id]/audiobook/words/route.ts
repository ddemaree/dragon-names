import { getWordTimes } from "@/lib/audiobook";
import { bookText } from "@/lib/audiobook-text";
import { getTale } from "@/lib/tales";

// When each word of the book's audiobook is read, for the player to follow along
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tale = await getTale((await params).id);
  if (!tale?.book) return new Response("Book not found", { status: 404 });
  const times = await getWordTimes(bookText(tale.title, tale.book), "tale-audiobook-words");
  if (!times) return new Response("Audiobook not recorded", { status: 404 });
  return Response.json(times);
}
