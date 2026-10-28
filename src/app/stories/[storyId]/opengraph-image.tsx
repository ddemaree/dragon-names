import { CHARACTER_KINDS, withArticle } from "@/lib/characters";
import { shareImage, shareImageSize } from "@/lib/share-image";
import { getStory, readOptions } from "@/lib/stories";

export const size = shareImageSize;
export const contentType = "image/png";
export const alt = "A story from Dragon Generator";

export default async function Image({ params }: { params: Promise<{ storyId: string }> }) {
  const story = await getStory((await params).storyId);
  if (!story) {
    return shareImage({ title: "Dragon Generator", subtitle: "A story written just for you" });
  }

  const { kind } = readOptions(story.options);
  const { nameLabel, typeLabel } = CHARACTER_KINDS[kind];
  // Party members are a list, so they don't get an article
  const type = kind === "dnd-party" ? story.type : withArticle(story.type);

  return shareImage({ eyebrow: nameLabel, title: story.name, subtitle: `${typeLabel} ${type}` });
}
