"use client";

import { useCallback, useEffect, useState } from "react";
import posthog from "posthog-js";
import { faHeadphones } from "@fortawesome/pro-duotone-svg-icons";
import AudiobookPlayer from "./AudiobookPlayer";
import Icon from "./Icon";

type Props = {
  // The route that records the audiobook, or returns it if it's already recorded
  src: string;
  kind: "story" | "tale";
  // What the audiobook reads, shown in the player
  text: string;
  title: string;
};

const posthogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST,
);

export default function Audiobook({ src, kind, text, title }: Props) {
  const [state, setState] = useState<"idle" | "making" | "failed">("idle");
  const [audio, setAudio] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => () => {
    if (audio) URL.revokeObjectURL(audio);
  }, [audio]);

  async function makeAudiobook() {
    setState("making");
    try {
      const response = await fetch(src, { method: "POST" });
      if (!response.ok) throw new Error(response.statusText);
      setAudio(URL.createObjectURL(await response.blob()));
      setOpen(true);
      setState("idle");
      if (posthogConfigured) posthog.capture("audiobook_made", { kind });
    } catch (error) {
      setState("failed");
      throw error;
    }
  }

  return (
    <>
      {audio && open && (
        <AudiobookPlayer audio={audio} text={text} title={title} wordsSrc={`${src}/words`} onClose={close} />
      )}
      <button
        onClick={audio ? () => setOpen(true) : makeAudiobook}
        disabled={state === "making"}
        className="flex min-h-15 items-center gap-2.5 self-center rounded-full border border-white/30 px-6 text-[17px] font-semibold disabled:cursor-wait disabled:opacity-70"
      >
        <Icon icon={faHeadphones} primary="#fff" secondary="var(--color-sky)" className="text-xl" />
        {audio
          ? "Listen to the audiobook"
          : state === "making"
            ? "Recording your audiobook…"
            : state === "failed"
              ? "Couldn’t record it. Try again?"
              : "Make it an audiobook"}
      </button>
    </>
  );
}
