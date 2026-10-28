import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { micromark } from "micromark";
import DragonButton from "@/components/DragonButton";
import CharacterCard from "@/components/CharacterCard";
import Layout from "@/components/Layout";
import { getStory, readOptions } from "@/lib/stories";

type Props = { params: Promise<{ storyId: string }> };

// The story's opening, as plain text short enough for a link preview
function excerpt(markdown: string, maxLength = 200) {
  const text = markdown.replace(/[*_#>`]/g, "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, text.lastIndexOf(" ", maxLength))}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storyId } = await params;
  const story = await getStory(storyId);
  if (!story) return { title: "Dragon Generator" };

  const title = `The story of ${story.name}, from Dragon Generator`;
  const description = excerpt(story.story);
  return {
    title,
    description,
    // Open Graph settings replace the layout's rather than merging, so repeat the site name
    openGraph: {
      siteName: "Dragon Generator",
      title,
      description,
      type: "article",
      url: `/stories/${storyId}`,
    },
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
