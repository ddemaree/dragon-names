// Shared between client and server: which kinds of characters a story can be about

export const CHARACTER_KINDS = {
  dragons: {
    label: "Dragon",
    button: "Make me a dragon",
    nameLabel: "Your dragon's name is:",
    typeLabel: "and they are",
  },
  "warrior-cats": {
    label: "Warrior cat",
    button: "Make me a warrior cat",
    nameLabel: "Your warrior cat's name is:",
    typeLabel: "and they are",
  },
  teens: {
    label: "Teenager",
    button: "Make me a teenager",
    nameLabel: "Your hero is:",
    typeLabel: "and they are",
  },
  "dnd-party": {
    label: "D&D party",
    button: "Make me a D&D party",
    nameLabel: "Your party is:",
    typeLabel: "made up of",
  },
} as const;

export type CharacterKind = keyof typeof CHARACTER_KINDS;

export function isCharacterKind(value: unknown): value is CharacterKind {
  return typeof value === "string" && Object.hasOwn(CHARACTER_KINDS, value);
}

export function withArticle(phrase: string) {
  return `${/^[aeiou]/i.test(phrase) ? "an" : "a"} ${phrase}`;
}
