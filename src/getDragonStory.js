const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function getDragonStory(name, type) {
  const response = await openai.createCompletion({
    model: "text-davinci-002",
    prompt: `Write a cute, brief story about a ${type} dragon named ${name}`,
    temperature: 0.7,
    max_tokens: 256,
  });

  const {
    data: { choices },
  } = response;
  const storyText = choices[0].text;
  return storyText;
}
