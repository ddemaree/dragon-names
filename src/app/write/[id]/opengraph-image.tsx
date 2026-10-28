import { possessive, withArticle } from "@/lib/characters";
import { shareImage, shareImageSize } from "@/lib/share-image";
import { getTale } from "@/lib/tales";

export const size = shareImageSize;
export const contentType = "image/png";
export const alt = "A story from Dragon Generator";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const tale = await getTale((await params).id);
  if (!tale) return shareImage({ title: "Dragon Generator", subtitle: "A story written just for you" });

  const { hero } = tale;
  const about =
    hero.kind === "dnd-party"
      ? `a party of adventurers`
      : hero.kind === "dragons"
        ? `${withArticle(hero.type)} dragon`
        : withArticle(hero.type);
  return shareImage({
    eyebrow: "A story written with Dragon Generator",
    title: tale.title ?? `${possessive(hero.name)} story`,
    subtitle: tale.title ? `About ${hero.name}, ${about}` : about.charAt(0).toUpperCase() + about.slice(1),
  });
}
