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
} as const;

export type Connector = keyof typeof CONNECTORS;
export type TurnConnector = "and" | "but" | "so";
export const TURN_CONNECTORS: TurnConnector[] = ["and", "but", "so"];

export function isTurnConnector(value: unknown): value is TurnConnector {
  return value === "and" || value === "but" || value === "so";
}

export type Part = {
  connector: Connector;
  // What the writer picked or typed; empty for the opening and the ending
  idea: string;
  ideaSource: "option" | "write-in" | "none";
  // Written by the AI
  text: string;
};

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
  return previous === "but" ? "so" : "but";
}

// A streamed book puts its title on the first line
export function splitBook(text: string) {
  const [first = "", ...rest] = text.trim().split("\n");
  return { title: first.replace(/^#+\s*/, "").replace(/^["“]|["”]$/g, "").trim(), book: rest.join("\n").trim() };
}
