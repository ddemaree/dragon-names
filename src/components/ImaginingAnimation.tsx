"use client";

import { Player, Controls } from "@lottiefiles/react-lottie-player";

export default function ImaginingAnimation() {
  return (
    <Player
      autoplay
      loop
      src="https://assets6.lottiefiles.com/packages/lf20_2oW79h.json"
      style={{ height: "200px", width: "300px" }}
    >
      <Controls visible={false} buttons={["play", "repeat", "frame", "debug"]} />
    </Player>
  );
}
