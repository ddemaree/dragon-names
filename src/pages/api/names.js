import fs from "fs/promises";
import _ from "lodash";
import path from "path";
import { getDragonStory } from "../../lib/getDragonStory";
import prisma from "../../lib/prisma";

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function getData(name) {
  let dataPath = path.join(process.cwd(), `data/${name}.txt`);
  return await (await fs.readFile(dataPath)).toString().split("\n");
}

async function makeDragonName() {
  let startWords = await getData("start-words");
  let endWords = await getData("end-words");

  let startWord = startWords[randomIntFromInterval(0, startWords.length - 1)];
  let endWord = endWords[randomIntFromInterval(0, endWords.length - 1)];

  let fullWord = startWord + endWord;

  return _.capitalize(fullWord);
}

async function getDragonType() {
  let types = await getData("dragon-types");
  return _.capitalize(types[randomIntFromInterval(0, types.length - 1)]);
}

async function getDragonFirstName() {
  let names = await getData("first-names");
  return _.capitalize(names[randomIntFromInterval(0, names.length - 1)]);
}

export default async function handler(req, res) {
  let firstWord = await makeDragonName();
  let secondWord = await makeDragonName();

  let shouldUseFirstName = randomIntFromInterval(0, 99) % 2 === 0;
  if (shouldUseFirstName) {
    firstWord = await getDragonFirstName();
  }

  let name = [firstWord, secondWord].join(" ");
  let type = await getDragonType();

  let story = await getDragonStory(name, type);

  const dbStory = await prisma.story.create({
    data: {
      name,
      type,
      story,
    },
  });

  res.status(200).json({ name, type, story, id: dbStory.id });
}
