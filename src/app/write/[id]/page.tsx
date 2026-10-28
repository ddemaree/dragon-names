import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Layout from "@/components/Layout";
import { possessive } from "@/lib/characters";
import { excerpt } from "@/lib/stories";
import { getTale } from "@/lib/tales";
import { canEdit } from "@/lib/writer";
import Writer from "../Writer";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tale = await getTale(id);
  if (!tale) return { title: "Dragon Generator" };

  const title = `${tale.title ?? `${possessive(tale.hero.name)} story`} · Dragon Generator`;
  const description = excerpt(tale.book ?? tale.parts.map((part) => part.text).join(" "));
  return {
    title,
    description,
    // Open Graph settings replace the layout's rather than merging, so repeat the site name
    openGraph: { siteName: "Dragon Generator", title, description, type: "article", url: `/write/${id}` },
  };
}

export default async function TalePage({ params }: Props) {
  const tale = await getTale((await params).id);
  if (!tale) notFound();

  const { id, hero, parts, finished, title, book, d20 } = tale;
  return (
    <Layout>
      <Writer initialTale={{ id, hero, parts, finished, title, book, d20 }} editable={await canEdit(tale)} />
    </Layout>
  );
}
