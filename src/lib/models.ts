// Models available in Advanced options, keyed by AI Gateway ID

export const MODELS = {
  "anthropic/claude-haiku-5.5": "Claude Haiku 5.5",
  "anthropic/claude-sonnet-5.5": "Claude Sonnet 5.5",
  "openai/gpt-6.1-terra": "GPT-6.1 Terra",
  "openai/gpt-6-luna": "GPT-6 Luna",
} as const;

export type ModelId = keyof typeof MODELS;

export const DEFAULT_MODEL: ModelId = "anthropic/claude-haiku-5.5";

export function isModelId(value: unknown): value is ModelId {
  return typeof value === "string" && Object.hasOwn(MODELS, value);
}
