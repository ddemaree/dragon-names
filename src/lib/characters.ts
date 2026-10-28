// Shared between client and server: which kinds of characters a story can be about,
// and the options a reader can set

import type { ModelId } from "./models";

export const CHARACTER_KINDS = {
  dragons: {
    label: "Dragon",
    button: "Make me a dragon",
    nameLabel: "Your dragon's name is",
    typeLabel: "and they are",
    settings: [
      "a desert",
      "a rainforest",
      "a frozen tundra",
      "underground crystal caverns",
      "high mountains",
    ],
  },
  "warrior-cats": {
    label: "Warrior cat",
    button: "Make me a warrior cat",
    nameLabel: "Your warrior cat's name is",
    typeLabel: "and they are",
    settings: [
      "a forest",
      "a swamp",
      "the mountains",
      "a two-leg house",
      "a two-leg farm",
    ],
  },
  teens: {
    label: "Mythical teen",
    button: "Make me a mythical teen",
    nameLabel: "Your hero is",
    typeLabel: "and they are",
    settings: [
      "a high school",
      "a summer camp",
      "a theme park",
      "the mall",
      "the underworld",
      "Costco",
    ],
  },
  "dnd-party": {
    label: "D&D party",
    button: "Make me a D&D party",
    nameLabel: "Your party is",
    typeLabel: "made up of",
    settings: [
      "a druids' grove",
      "a major city on the Sword Coast",
      "the astral plane",
      "the Underdark",
      "an ancient ruin",
      "a peaceful village with a secret",
    ],
  },
} as const;

export type CharacterKind = keyof typeof CHARACTER_KINDS;

export function isCharacterKind(value: unknown): value is CharacterKind {
  return typeof value === "string" && Object.hasOwn(CHARACTER_KINDS, value);
}

// Each slider runs 0–10
export const SLIDERS = {
  scary: { min: "Cozy", max: "Scary", default: 5 },
  serious: { min: "Funny", max: "Serious", default: 5 },
  romance: { min: "No romance", max: "Some romance", default: 0 },
  chaos: { min: "Classic", max: "Chaos", default: 5 },
} as const;

export type SliderId = keyof typeof SLIDERS;

export function isSliderId(value: unknown): value is SliderId {
  return typeof value === "string" && Object.hasOwn(SLIDERS, value);
}

export type StoryOptions = {
  kind: CharacterKind;
  // null means "surprise me"
  setting: string | null;
  model: ModelId;
} & Record<SliderId, number>;

export const DEFAULT_SLIDERS: Record<SliderId, number> = {
  scary: SLIDERS.scary.default,
  serious: SLIDERS.serious.default,
  romance: SLIDERS.romance.default,
  chaos: SLIDERS.chaos.default,
};

export function withArticle(phrase: string) {
  return `${/^[aeiou]/i.test(phrase) ? "an" : "a"} ${phrase}`;
}

// "Sparkclaw’s", but "The Brave Acorns’"
export function possessive(name: string) {
  return name.endsWith("s") ? `${name}’` : `${name}’s`;
}
