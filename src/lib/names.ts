import fs from "fs/promises";
import path from "path";

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

async function getData(name: string) {
  const dataPath = path.join(process.cwd(), `data/${name}.txt`);
  return (await fs.readFile(dataPath, "utf8")).split("\n");
}

async function makeDragonName() {
  const startWords = await getData("start-words");
  const endWords = await getData("end-words");

  return capitalize(pick(startWords) + pick(endWords));
}

export async function makeDragon() {
  let firstWord = await makeDragonName();
  const secondWord = await makeDragonName();

  if (Math.random() < 0.5) {
    firstWord = capitalize(pick(await getData("first-names")));
  }

  return {
    name: [firstWord, secondWord].join(" "),
    type: capitalize(pick(await getData("dragon-types"))),
  };
}
