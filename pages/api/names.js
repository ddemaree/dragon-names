import fs from "fs/promises";
import { get } from "https";
import path from "path";

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

  return fullWord;
}

async function getDragonType() {
  let types = await getData("dragon-types");
  return types[randomIntFromInterval(0, types.length - 1)];
}

export default async function handler(req, res) {
  let firstWord = await makeDragonName();
  let secondWord = await makeDragonName();
  let name = [firstWord, secondWord].join(" ");

  let type = await getDragonType();

  res.status(200).json({ name, type });
}
