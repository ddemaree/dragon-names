import Link from "next/link";
import { DateTime } from "luxon";
import Layout from "../../../components/Layout";
import prisma from "../../../lib/prisma";

export async function getServerSideProps() {
  const stories = await prisma.story.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
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
    <div className="flex gap-8 justify-between w-full border-t border-pink-100 py-4">
      <Link href={`/stories/${storyId}`}>
        <a className="text-pink-600 hover:underline">{name}</a>
      </Link>
      <time className="font-sans text-sm text-neutral-500">
        {createdDate.toLocaleString(DateTime.DATETIME_SHORT)}
      </time>
    </div>
  );
}

export default function StoriesList({ stories }) {
  return (
    <Layout width="wide">
      <div className="flex flex-col">
        {stories.map((story) => (
          <StoryRow story={story} key={story.id} />
        ))}
      </div>
    </Layout>
  );
}
