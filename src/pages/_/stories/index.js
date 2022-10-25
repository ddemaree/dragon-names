import { PrismaClient } from "@prisma/client";
// import Head from "next/head";
// import DragonButton from "../../components/DragonButton";
// import DragonName from "../../components/DragonName";
import Layout from "../../../components/Layout";
import Link from "next/link";
const prisma = new PrismaClient();
import { DateTime } from "luxon";

export async function getServerSideProps() {
  const stories = await prisma.story.findMany({
    take: 100,
    orderBy: [{ createdAt: "desc" }],
  });

  return {
    props: {
      stories: stories.map((story) => {
        if (story.createdAt) story.createdAt = story.createdAt.toISOString();
        return story;
      }),
    },
  };
}

function StoryRow({ story: { id: storyId, name, createdAt } }) {
  const createdDate = DateTime.fromISO(createdAt);

  return (
    <div className="flex gap-8 justify-between w-full">
      <Link href={`/stories/${storyId}`}>
        <a className="text-pink-600 hover:underline">{name}</a>
      </Link>
      <time>{createdDate.toLocaleString(DateTime.DATETIME_SHORT)}</time>
    </div>
  );
}

export default function StoriesList({ stories }) {
  return (
    <Layout>
      <div className="flex flex-col">
        {stories.map((story) => (
          <StoryRow story={story} key={story.id} />
        ))}
      </div>
    </Layout>
  );
}
