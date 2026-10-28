import "server-only";
import fs from "fs/promises";
import path from "path";
import { type CharacterKind, withArticle } from "./characters";
import { type HeroWords, pick, pickMany, rollMembers } from "./hero-draft";

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

async function getData(kind: CharacterKind, name: string) {
  const dataPath = path.join(process.cwd(), `data/${kind}/${name}.txt`);
  const contents = await fs.readFile(dataPath, "utf8");
  return contents.split("\n").map((line) => line.trim()).filter(Boolean);
}

async function getPartyWords() {
  const [names, species, classes] = await Promise.all([
    getData("dnd-party", "first-names"),
    getData("dnd-party", "species"),
    getData("dnd-party", "classes"),
  ]);
  return { names, species, classes };
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
  const [clan, ...rivals] = pickMany(await getData("warrior-cats", "clans"), 3);
  const type = `${role} of ${clan}`;

  return {
    name,
    type,
    // Naming the neighboring clans keeps the model from borrowing clans from the books
    subject: `${name}, ${withArticle(type)} (neighboring clans: ${rivals.join(" and ")})`,
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
  const type = rollMembers(await getPartyWords());

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

// Every word list "Build my own hero" offers, capitalized the way names show them
export async function getHeroWords(): Promise<HeroWords> {
  const words = async (kind: CharacterKind, name: string) => (await getData(kind, name)).map(capitalize);
  const [dragonStarts, dragonEnds, dragonTypes, prefixes, suffixes, roles, clans, firstNames, lastNames, teenTypes, partyStarts, partyEnds, party] =
    await Promise.all([
      words("dragons", "start-words"),
      words("dragons", "end-words"),
      words("dragons", "dragon-types"),
      getData("warrior-cats", "prefixes"),
      getData("warrior-cats", "suffixes"),
      getData("warrior-cats", "roles"),
      getData("warrior-cats", "clans"),
      getData("teens", "first-names"),
      getData("teens", "last-names"),
      getData("teens", "types"),
      getData("dnd-party", "party-name-starts"),
      getData("dnd-party", "party-name-ends"),
      getPartyWords(),
    ]);
  return {
    dragons: { pieces: [dragonStarts, dragonEnds], choices: [dragonTypes] },
    "warrior-cats": { pieces: [prefixes, suffixes], choices: [roles, clans] },
    teens: { pieces: [firstNames, lastNames], choices: [teenTypes] },
    "dnd-party": { pieces: [partyStarts, partyEnds], choices: [] },
    party,
  };
}
