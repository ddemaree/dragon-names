import "server-only";
import { createHash } from "node:crypto";
import { generateSpeech } from "ai";
import { get, put } from "@vercel/blob";
import { flushTelemetry } from "./telemetry";

// Steady narration for long-form audio, through AI Gateway
const MODEL = "elevenlabs/eleven-multilingual-v2";
const VOICE = "c6SfcYrb2t09NHXiT80T";
// The model takes up to 10,000 characters per request
const MAX_CHUNK = 9000;

// Speech should say the words, not the Markdown around them
function plain(markdown: string) {
  return markdown
    .replace(/^#+\s*/gm, "")
    .replace(/[*_`>]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// Whole paragraphs, grouped into requests the model accepts
function chunks(text: string) {
  const groups: string[] = [];
  for (const paragraph of text.split(/\n{2,}/)) {
    const last = groups.at(-1);
    if (last !== undefined && last.length + paragraph.length + 2 <= MAX_CHUNK) {
      groups[groups.length - 1] = `${last}\n\n${paragraph}`;
    } else {
      groups.push(paragraph);
    }
  }
  return groups;
}

// An MP3 of the text, recorded once and kept in the Blob store.
// The path comes from the text, voice and model, so changing any of them records it again.
export async function getAudiobook(markdown: string, functionId: string) {
  const text = plain(markdown);
  const hash = createHash("sha256").update(`${MODEL}\n${VOICE}\n${text}`).digest("hex");
  const pathname = `audiobooks/${hash}.mp3`;

  const saved = await get(pathname, { access: "private" });
  if (saved?.statusCode === 200) return new Uint8Array(await new Response(saved.stream).arrayBuffer());

  try {
    const parts = await Promise.all(
      chunks(text).map((chunk) =>
        generateSpeech({
          model: MODEL,
          voice: VOICE,
          text: chunk,
          outputFormat: "mp3",
          telemetry: { functionId },
        }),
      ),
    );
    // MP3 files play back to back when joined
    const audio = new Uint8Array(parts.reduce((length, part) => length + part.audio.uint8Array.length, 0));
    let offset = 0;
    for (const { audio: part } of parts) {
      audio.set(part.uint8Array, offset);
      offset += part.uint8Array.length;
    }
    await put(pathname, new Blob([audio]), {
      access: "private",
      contentType: "audio/mpeg",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return audio;
  } finally {
    await flushTelemetry();
  }
}

export function audioResponse(audio: Uint8Array<ArrayBuffer>) {
  return new Response(audio, { headers: { "content-type": "audio/mpeg" } });
}
