// Shared between client and server: "Build my own hero", from the same word lists as the generator

import type { CharacterKind } from "./characters";
import type { Hero } from "./tale";

// Name pieces and choices for each kind, in the order they're shown
export type HeroWords = Record<CharacterKind, { pieces: string[][]; choices: string[][] }> & {
  party: { names: string[]; species: string[]; classes: string[] };
};

export type Draft = {
  kind: CharacterKind;
  // Kept for every kind, so switching back and forth doesn't lose anything
  pieces: Record<CharacterKind, string[]>;
  choices: Record<CharacterKind, string[]>;
  members: string;
  details: string;
};

// Anything else about the hero is "a few words", like an idea
export const MAX_DETAILS_LENGTH = 120;
export const MAX_PIECE_LENGTH = 20;

export const BUILDER_COPY: Record<CharacterKind, { pieces: string[]; choices: string[] }> = {
  dragons: { pieces: ["first part", "second part"], choices: ["What kind of dragon?"] },
  "warrior-cats": { pieces: ["first part", "second part"], choices: ["What do they do for the clan?", "Which clan?"] },
  teens: { pieces: ["first name", "last name"], choices: ["What kind of teen?"] },
  "dnd-party": { pieces: ["first word", "second word"], choices: [] },
};

export function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Picks `count` different items
export function pickMany<T>(items: T[], count: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}

// A different option from the one showing, when there is one
export function shuffle(options: string[], current: string) {
  const others = options.filter((option) => option !== current);
  return others.length ? pick(others) : current;
}

// "Aelar the elf bard, Bryn the dwarf cleric, and Dorn the human druid"
export function rollMembers({ names, species, classes }: HeroWords["party"]) {
  const members = pickMany(names, 3 + Math.round(Math.random())).map(
    (member) => `${member} the ${pick(species)} ${pick(classes)}`,
  );
  return `${members.slice(0, -1).join(", ")}, and ${members.at(-1)}`;
}

export function rollDraft(words: HeroWords, kind: CharacterKind = "dragons"): Draft {
  const roll = (lists: string[][]) => lists.map((options) => pick(options));
  return {
    kind,
    pieces: {
      dragons: roll(words.dragons.pieces),
      "warrior-cats": roll(words["warrior-cats"].pieces),
      teens: roll(words.teens.pieces),
      "dnd-party": roll(words["dnd-party"].pieces),
    },
    choices: {
      dragons: roll(words.dragons.choices),
      "warrior-cats": roll(words["warrior-cats"].choices),
      teens: roll(words.teens.choices),
      "dnd-party": roll(words["dnd-party"].choices),
    },
    members: rollMembers(words.party),
    details: "",
  };
}

// Dragon and cat names are one word ("Sparkclaw"); teens have a first and last name; parties are "The …"
export function draftName({ kind, pieces }: Draft) {
  const [first = "", second = ""] = pieces[kind].map((piece) => piece.trim());
  switch (kind) {
    case "dragons":
    case "warrior-cats":
      return first + second.toLowerCase();
    case "teens":
      return [first, second].filter(Boolean).join(" ");
    case "dnd-party":
      return `The ${[first, second].filter(Boolean).join(" ")}`;
  }
}

function draftType({ kind, choices, members }: Draft) {
  const [first = "", second = ""] = choices[kind];
  switch (kind) {
    case "warrior-cats":
      return `${first} of ${second}`;
    case "dnd-party":
      return members;
    default:
      return first;
  }
}

export function heroFromDraft(draft: Draft): Hero {
  const details = draft.details.trim();
  return {
    kind: draft.kind,
    name: draftName(draft),
    type: draftType(draft),
    ...(details ? { details } : {}),
  };
}
