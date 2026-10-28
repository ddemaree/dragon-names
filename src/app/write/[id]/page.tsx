import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Layout from "@/components/Layout";
import { getTale } from "@/lib/tales";
import { canEdit } from "@/lib/writer";
import Writer from "../Writer";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tale = await getTale((await params).id);
  return { title: tale ? `${tale.hero.name}’s story · Dragon Generator` : "Dragon Generator" };
}

export default async function TalePage({ params }: Props) {
  const tale = await getTale((await params).id);
  if (!tale) notFound();

  const { id, hero, parts, finished } = tale;
  return (
    <Layout>
      <Writer initialTale={{ id, hero, parts, finished }} editable={await canEdit(tale)} />
    </Layout>
  );
}
