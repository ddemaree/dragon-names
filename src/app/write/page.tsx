import type { Metadata } from "next";
import Layout from "@/components/Layout";
import { rollHeroes } from "@/lib/tales";
import Writer from "./Writer";

export const metadata: Metadata = { title: "Write a story · Dragon Generator" };

// Heroes are rolled per visit
export const dynamic = "force-dynamic";

export default async function WritePage() {
  return (
    <Layout>
      <Writer initialHeroes={await rollHeroes()} />
    </Layout>
  );
}
