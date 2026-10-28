import "server-only";
import {
  CHARACTER_KINDS,
  type CharacterKind,
  DEFAULT_SLIDERS,
  isCharacterKind,
  type SliderId,
  type StoryOptions,
} from "./characters";
import { DEFAULT_MODEL, isModelId } from "./models";

export const INSTRUCTIONS =
  "You write short stories for readers around 10 to 13 years old. Keep everything age-appropriate. Use Markdown paragraphs with no headings.";

// Describes each genre without naming the books that inspired it, so stories
// don't borrow those books' characters and places
const GENRES: Record<CharacterKind, string> = {
  dragons:
    "a dragon adventure in a world where dragons live in tribes with their own kingdoms, rivalries, and secrets",
  "warrior-cats":
    "a story about clans of wild cats who live by a warrior code, with patrols, loyalty, and rivalries between clans",
  teens:
    "a modern-day story where an ordinary teenager discovers that myths and legends are real and gets swept into a mythical adventure",
  "dnd-party":
    "a fantasy adventure about a party of adventurers, with a quest, magic, and teamwork",
};

function band(value: number, low: string, mid: string, high: string) {
  return value <= 3 ? low : value <= 6 ? mid : high;
}

function toneLines({ scary, serious, romance, chaos }: Record<SliderId, number>) {
  return [
    band(
      scary,
      "Keep the mood cozy and comforting.",
      "Include a little suspense.",
      "Make it spooky and suspenseful, but never truly frightening or gory.",
    ),
    band(
      serious,
      "Make it funny, with jokes and silly moments.",
      "Balance humor with heartfelt moments.",
      "Give it an earnest tone, with real stakes and emotion.",
    ),
    romance === 0
      ? "No romance."
      : romance <= 5
        ? "A hint of a crush is okay."
        : "Include a sweet romance subplot, kept age-appropriate: crushes and nervous conversations, at most holding hands.",
    chaos <= 2
      ? "Tell a classic, well-structured story without surprises."
      : chaos <= 5
        ? "Include one surprising twist."
        : chaos <= 8
          ? "Include unexpected, absurd twists."
          : "Embrace surreal, absurd, dreamlike logic: the stranger the better, while still being readable.",
  ];
}

function sliderValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(10, Math.max(0, Math.round(value)))
    : fallback;
}

// Validates options from a request body, filling in defaults and resolving
// "surprise me" to a concrete setting
export function parseStoryOptions(body: unknown): StoryOptions {
  const input = body && typeof body === "object" ? body : {};
  const kind = "kind" in input && isCharacterKind(input.kind) ? input.kind : "dragons";

  const settings: readonly string[] = CHARACTER_KINDS[kind].settings;
  const setting =
    "setting" in input && typeof input.setting === "string" && settings.includes(input.setting)
      ? input.setting
      : settings[Math.floor(Math.random() * settings.length)];

  const slider = (id: SliderId) => sliderValue(Reflect.get(input, id), DEFAULT_SLIDERS[id]);

  const model = "model" in input && isModelId(input.model) ? input.model : DEFAULT_MODEL;

  return {
    kind,
    setting,
    model,
    scary: slider("scary"),
    serious: slider("serious"),
    romance: slider("romance"),
    chaos: slider("chaos"),
  };
}

export function buildPrompt(subject: string, options: StoryOptions) {
  return [
    `Write a brief story about ${subject}.`,
    `Genre: ${GENRES[options.kind]}.`,
    `Setting: ${options.setting}.`,
    ...toneLines(options),
  ].join("\n");
}
