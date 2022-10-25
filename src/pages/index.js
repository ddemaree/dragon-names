import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import DragonButton from "../components/DragonButton";

import { Player, Controls } from "@lottiefiles/react-lottie-player";

export default function HomePage() {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  function getDragonName(event) {
    setWorking(true);
    fetch("/api/names")
      .then((response) => response.json())
      .then((responseData) => {
        router.push(`/stories/${responseData.id}`);
      });
  }

  return (
    <Layout>
      <Head>
        <title>June's Dragon Generator</title>
      </Head>
      <h1 className="text-2xl font-semibold mb-4">June's Dragon Generator</h1>

      {!working && (
        <div>
          <DragonButton onClick={getDragonName}>Make me a dragon</DragonButton>
        </div>
      )}
      {working && (
        <div>
          <DragonButton disabled={true}>Imagining dragons…</DragonButton>

          <Player
            autoplay
            loop
            src="https://assets6.lottiefiles.com/packages/lf20_2oW79h.json"
            style={{ height: "200px", width: "300px" }}
          >
            <Controls
              visible={false}
              buttons={["play", "repeat", "frame", "debug"]}
            />
          </Player>
        </div>
      )}
    </Layout>
  );
}
