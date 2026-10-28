import type { Metadata } from "next";
import Layout from "@/components/Layout";
import { rollDraft } from "@/lib/hero-draft";
import { getHeroWords } from "@/lib/names";
import { rollHeroes } from "@/lib/tales";
import Writer from "./Writer";

export const metadata: Metadata = { title: "Write a story · Dragon Generator" };

// Heroes are rolled per visit
export const dynamic = "force-dynamic";

export default async function WritePage() {
  const words = await getHeroWords();
  return (
    <Layout>
      <Writer initialHeroes={await rollHeroes()} heroWords={words} initialDraft={rollDraft(words)} />
    </Layout>
  );
}
