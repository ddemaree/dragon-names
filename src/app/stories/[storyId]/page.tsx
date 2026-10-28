import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { micromark } from "micromark";
import DragonButton from "@/components/DragonButton";
import CharacterCard from "@/components/CharacterCard";
import Layout from "@/components/Layout";
import type { Json } from "@/lib/database.types";
import { isCharacterKind } from "@/lib/characters";
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
function kindFromOptions(options: Json) {
  if (options && typeof options === "object" && !Array.isArray(options)) {
    if (isCharacterKind(options.kind)) return options.kind;
  }
  return "dragons";
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
      <CharacterCard kind={kindFromOptions(story.options)} name={story.name} type={story.type} />
      <div
        className="text-left text-lg [&>*+*]:mt-6"
        dangerouslySetInnerHTML={{ __html: micromark(story.story) }}
      />
      <div className="mt-10 border-t border-pink-500 py-8">
        <DragonButton href="/">Make me another story</DragonButton>
      </div>
    </Layout>
  );
}
