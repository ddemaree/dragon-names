import "server-only";
import { cache } from "react";
import type { Json } from "./database.types";
import { type CharacterKind, isCharacterKind, isSliderId, type SliderId } from "./characters";
import { createServerClient } from "./supabase";

export const getStory = cache(async (id: string) => {
  const { data } = await createServerClient()
    .from("stories")
    .select("name, type, story, options")
    .eq("id", id)
    .maybeSingle();
  return data;
});

// Stories saved before character kinds existed have no `kind`; they're dragons
export function readOptions(options: Json) {
  const kind: CharacterKind = "dragons";
  if (!options || typeof options !== "object" || Array.isArray(options)) return { kind };

  const sliders: Partial<Record<SliderId, number>> = {};
  for (const [id, value] of Object.entries(options)) {
    if (isSliderId(id) && typeof value === "number") sliders[id] = value;
  }
  return {
    kind: isCharacterKind(options.kind) ? options.kind : kind,
    setting: typeof options.setting === "string" ? options.setting : undefined,
    sliders,
  };
}

// The story's opening, as plain text short enough for a link preview
export function excerpt(markdown: string, maxLength = 200) {
  const text = markdown.replace(/[*_#>`]/g, "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, text.lastIndexOf(" ", maxLength))}…`;
}
