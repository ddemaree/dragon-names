import { shareImage, shareImageSize } from "@/lib/share-image";

export const size = shareImageSize;
export const contentType = "image/png";
export const alt = "Dragon Generator";

export default function Image() {
  return shareImage({
    title: "Dragon Generator",
    subtitle: "Pick a hero, a place and a mood. We’ll write the story.",
  });
}
