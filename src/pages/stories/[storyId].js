import { PrismaClient } from "@prisma/client";
import { micromark } from "micromark";
import DragonButton from "../../components/DragonButton";
import DragonName from "../../components/DragonName";
import Layout from "../../components/Layout";
const prisma = new PrismaClient();

export async function getServerSideProps({ params }) {
  const story = await prisma.story.findUnique({
    where: { id: params.storyId },
  });

  return {
    props: {
      story,
    },
  };
}

export default function StoryPage({ story }) {
  return (
    <Layout>
      <DragonName name={story.name} dragonType={story.type} />
      <div
        className="text-left text-lg [&>*+*]:mt-6"
        dangerouslySetInnerHTML={{ __html: micromark(story.story) }}
      />
      <div className="mt-10 border-t border-pink-500 py-8">
        <DragonButton href="/">Make me another dragon</DragonButton>
      </div>
    </Layout>
  );
}
