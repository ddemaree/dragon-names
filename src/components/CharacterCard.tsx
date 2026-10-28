import { CHARACTER_KINDS, type CharacterKind, withArticle } from "@/lib/characters";

type Props = {
  kind: CharacterKind;
  name: string;
  type: string;
};

export default function CharacterCard({ kind, name, type }: Props) {
  const { nameLabel, typeLabel } = CHARACTER_KINDS[kind];
  // Party members are a list, so they don't get an article
  const typeText = kind === "dnd-party" ? type : withArticle(type);

  return (
    <div className="border-t border-b border-pink-500 mb-8 p-4">
      <p>{nameLabel}</p>
      <p className="mt-3 text-xl font-spectral-sc">{name}</p>
      <p className="my-3">{typeLabel}</p>
      <p className="mt-3 text-xl font-spectral-sc">{typeText}</p>
    </div>
  );
}
