// Shared between client and server: the shape of a storytelling-mode story

import { type CharacterKind, isCharacterKind } from "./characters";

// `details` is what the writer added about a hero they built themselves
export type Hero = { kind: CharacterKind; name: string; type: string; details?: string };

// "once" opens the story and "end" closes it; the writer picks among the rest each turn
export const CONNECTORS = {
  once: { word: "Once…", color: "var(--color-muted)" },
  and: {
    word: "And then…",
    color: "var(--color-pale-sky)",
    hint: "The next thing that happens",
    question: "Pick an idea. I’ll write the next part.",
  },
  but: {
    word: "But…",
    color: "var(--color-pink)",
    hint: "A problem gets in the way",
    question: "What goes wrong? Pick one, or add your own.",
  },
  so: {
    word: "So…",
    color: "var(--color-peach)",
    hint: "What changes because of it",
    question: "What happens because of that?",
  },
  end: { word: "The end.", color: "#fff" },
  // In D20 Mode, a roll of 1 or 20 gives the DM's part its own connector
  ohno: { word: "Oh no…", color: "#ff8fa3" },
  legendary: { word: "Legendary!", color: "var(--color-peach)" },
} as const;

export type Connector = keyof typeof CONNECTORS;
export type TurnConnector = "and" | "but" | "so";
export const TURN_CONNECTORS: TurnConnector[] = ["and", "but", "so"];

export function isTurnConnector(value: unknown): value is TurnConnector {
  return value === "and" || value === "but" || value === "so";
}

// D20 Mode: a risky idea needs a roll of `target` or more
export type Check = { name: string; target: number; reason: string };

export type Part = {
  connector: Connector;
  // What the writer picked or typed; empty for the opening and the ending
  idea: string;
  ideaSource: "option" | "write-in" | "none";
  // Written by the AI
  text: string;
  // D20 Mode: the writer's part that called for a check, and the DM's part written from the roll
  check?: Check;
  roll?: { value: number; check: Check };
};

// An idea for the next part; in D20 Mode, risky ones name the check they'll need
export type Idea = { text: string; check: string | null };

// A write-in is "a few words"; anything longer is cut off before it reaches the model
export const MAX_IDEA_LENGTH = 120;

export function isHero(value: unknown): value is Hero {
  if (!value || typeof value !== "object") return false;
  const kind: unknown = Reflect.get(value, "kind");
  const name: unknown = Reflect.get(value, "name");
  const type: unknown = Reflect.get(value, "type");
  const details: unknown = Reflect.get(value, "details");
  return (
    isCharacterKind(kind) &&
    typeof name === "string" &&
    typeof type === "string" &&
    (details === undefined || typeof details === "string")
  );
}

function isPart(value: unknown): value is Part {
  if (!value || typeof value !== "object") return false;
  const connector: unknown = Reflect.get(value, "connector");
  return (
    typeof connector === "string" &&
    Object.hasOwn(CONNECTORS, connector) &&
    typeof Reflect.get(value, "idea") === "string" &&
    typeof Reflect.get(value, "text") === "string"
  );
}

export function readParts(value: unknown): Part[] {
  return Array.isArray(value) ? value.filter(isPart) : [];
}

// After a "But", show what it changed; otherwise add a problem
export function nextConnector(previous: Connector | undefined): TurnConnector {
  return previous === "but" || previous === "ohno" ? "so" : "but";
}

export function isCheck(value: unknown): value is Check {
  if (!value || typeof value !== "object") return false;
  return (
    typeof Reflect.get(value, "name") === "string" &&
    Number.isInteger(Reflect.get(value, "target")) &&
    typeof Reflect.get(value, "reason") === "string"
  );
}

// The d20 picks the connector the DM writes with; a miss still moves the story
export function rollConnector(roll: number, target: number): Connector {
  if (roll === 1) return "ohno";
  if (roll === 20) return "legendary";
  return roll >= target ? "and" : "but";
}

// The DM's part is waiting on a roll when the last part called for a check
export function awaitingRoll(parts: Part[]) {
  return parts.at(-1)?.check;
}

// A streamed book puts its title on the first line
export function splitBook(text: string) {
  const [first = "", ...rest] = text.trim().split("\n");
  return { title: first.replace(/^#+\s*/, "").replace(/^["“]|["”]$/g, "").trim(), book: rest.join("\n").trim() };
}
