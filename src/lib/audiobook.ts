import "server-only";
import { createHash } from "node:crypto";
import { generateSpeech, transcribe } from "ai";
import { get, put } from "@vercel/blob";
import { alignWords, heardWords } from "./align-words";
import { paragraphs, plain } from "./audiobook-text";
import { flushTelemetry } from "./telemetry";

// Expressive narration, through AI Gateway
const MODEL = "elevenlabs/eleven-v4";
const VOICE = "c6SfcYrb2t09NHXiT80T";
// The model takes up to 10,000 characters per request
const MAX_CHUNK = 9000;
// Hears when each word is spoken, for the player to follow along
const TRANSCRIPTION_MODEL = "elevenlabs/scribe-v2";

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

// Where the text's recording is kept. The path comes from the text, voice and model,
// so changing any of them records it again.
function audiobookPath(text: string) {
  const hash = createHash("sha256").update(`${MODEL}\n${VOICE}\n${text}`).digest("hex");
  return `audiobooks/${hash}`;
}

async function readBlob(pathname: string) {
  const saved = await get(pathname, { access: "private" });
  return saved?.statusCode === 200 ? new Response(saved.stream) : null;
}

// An MP3 of the text, recorded once and kept in the Blob store
export async function getAudiobook(markdown: string, functionId: string) {
  const text = plain(markdown);
  const pathname = `${audiobookPath(text)}.mp3`;

  const saved = await readBlob(pathname);
  if (saved) return new Uint8Array(await saved.arrayBuffer());

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

// When each word of the text starts in its recording, in seconds, worked out once and kept with it.
// Null when the text hasn't been recorded.
export async function getWordTimes(markdown: string, functionId: string) {
  const path = audiobookPath(plain(markdown));

  const saved = await readBlob(`${path}.json`);
  if (saved) return (await saved.json()) as number[];

  const audio = await readBlob(`${path}.mp3`);
  if (!audio) return null;

  try {
    const { segments } = await transcribe({
      model: TRANSCRIPTION_MODEL,
      audio: new Uint8Array(await audio.arrayBuffer()),
      telemetry: { functionId },
    });
    const times = alignWords(paragraphs(markdown).flat(), heardWords(segments));
    await put(`${path}.json`, JSON.stringify(times), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return times;
  } finally {
    await flushTelemetry();
  }
}

export function audioResponse(audio: Uint8Array<ArrayBuffer>) {
  return new Response(audio, { headers: { "content-type": "audio/mpeg" } });
}
