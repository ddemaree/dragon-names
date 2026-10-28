import "server-only";
import fs from "fs/promises";
import path from "path";
import { type CharacterKind, withArticle } from "./characters";

export type Character = {
  name: string;
  // Shown under the name and stored in `stories.type`
  type: string;
  // Who the story is about, e.g. "a Swiftwing dragon named Glitterclaw"
  subject: string;
};

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Picks `count` different items
function pickMany<T>(items: T[], count: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}

async function getData(kind: CharacterKind, name: string) {
  const dataPath = path.join(process.cwd(), `data/${kind}/${name}.txt`);
  const contents = await fs.readFile(dataPath, "utf8");
  return contents.split("\n").map((line) => line.trim()).filter(Boolean);
}

async function makeDragonName() {
  const startWords = await getData("dragons", "start-words");
  const endWords = await getData("dragons", "end-words");

  return capitalize(pick(startWords) + pick(endWords));
}

async function makeDragon(): Promise<Character> {
  let firstWord = await makeDragonName();
  const secondWord = await makeDragonName();

  if (Math.random() < 0.5) {
    firstWord = capitalize(pick(await getData("dragons", "first-names")));
  }

  const name = [firstWord, secondWord].join(" ");
  const type = capitalize(pick(await getData("dragons", "dragon-types")));

  return {
    name,
    type,
    subject: `a ${type} dragon named ${name}`,
  };
}

async function makeWarriorCat(): Promise<Character> {
  const name =
    pick(await getData("warrior-cats", "prefixes")) +
    pick(await getData("warrior-cats", "suffixes"));
  const role = pick(await getData("warrior-cats", "roles"));
  const clan = pick(await getData("warrior-cats", "clans"));
  const type = `${role} of ${clan}`;

  return {
    name,
    type,
    subject: `${name}, ${withArticle(type)}`,
  };
}

async function makeTeen(): Promise<Character> {
  const name = `${pick(await getData("teens", "first-names"))} ${pick(await getData("teens", "last-names"))}`;
  const type = pick(await getData("teens", "types"));

  return {
    name,
    type,
    subject: `${name}, a teenager who is ${withArticle(type)}`,
  };
}

async function makeParty(): Promise<Character> {
  const name = `The ${pick(await getData("dnd-party", "party-name-starts"))} ${pick(await getData("dnd-party", "party-name-ends"))}`;
  const species = await getData("dnd-party", "species");
  const classes = await getData("dnd-party", "classes");
  const names = pickMany(await getData("dnd-party", "first-names"), 3 + Math.round(Math.random()));

  const members = names.map((member) => `${member} the ${pick(species)} ${pick(classes)}`);
  const type = `${members.slice(0, -1).join(", ")}, and ${members.at(-1)}`;

  return {
    name,
    type,
    subject: `a party of adventurers called ${name}: ${type}`,
  };
}

export function makeCharacter(kind: CharacterKind) {
  switch (kind) {
    case "dragons":
      return makeDragon();
    case "warrior-cats":
      return makeWarriorCat();
    case "teens":
      return makeTeen();
    case "dnd-party":
      return makeParty();
  }
}
