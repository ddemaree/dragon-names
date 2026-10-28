import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { micromark } from "micromark";
import DragonButton from "@/components/DragonButton";
import CharacterCard from "@/components/CharacterCard";
import Layout from "@/components/Layout";
import type { Json } from "@/lib/database.types";
import { type CharacterKind, isCharacterKind, isSliderId, type SliderId } from "@/lib/characters";
import { createServerClient } from "@/lib/supabase";

type Props = { params: Promise<{ storyId: string }> };

const getStory = cache(async (id: string) => {
  const { data } = await createServerClient()
    .from("stories")
    .select("name, type, story, options")
    .eq("id", id)
    .maybeSingle();
  return data;
});

// Stories saved before character kinds existed have no `kind`; they're dragons
function readOptions(options: Json) {
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const story = await getStory((await params).storyId);
  return {
    title: story
      ? `The story of ${story.name}, from June's Dragon Generator`
      : "June's Dragon Generator",
  };
}

export default async function StoryPage({ params }: Props) {
  const story = await getStory((await params).storyId);
  if (!story) notFound();

  return (
    <Layout>
      <CharacterCard {...readOptions(story.options)} name={story.name} type={story.type} />
      <article
        className="flex flex-col gap-5 rounded-[28px] bg-white/7 px-6 py-8 text-[19px] leading-relaxed text-ink-soft shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] sm:px-11 sm:py-10"
        dangerouslySetInnerHTML={{ __html: micromark(story.story) }}
      />
      <DragonButton href="/">Make me another story</DragonButton>
    </Layout>
  );
}
