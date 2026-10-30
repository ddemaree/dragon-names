"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { faPause, faPlay, faXmark } from "@fortawesome/pro-duotone-svg-icons";
import Icon from "./Icon";
import { paragraphs } from "@/lib/audiobook-text";

type Props = {
  // The recording, as an object URL
  audio: string;
  // The text that was read, to show it word by word
  text: string;
  title: string;
  // The route with each word's start time in the recording
  wordsSrc: string;
  onClose: () => void;
};

// The last word to start by this time, or -1 before the first
function wordAt(times: number[], time: number) {
  let low = 0;
  let high = times.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (times[middle] <= time) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}

function clock(seconds: number) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

// The story on its own screen, with the word being read highlighted
export default function AudiobookPlayer({ audio, text, title, wordsSrc, onClose }: Props) {
  const player = useRef<HTMLAudioElement>(null);
  const wordElements = useRef<(HTMLSpanElement | null)[]>([]);
  const [times, setTimes] = useState<number[] | null>(null);
  const [current, setCurrent] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const words = useMemo(() => {
    let index = 0;
    return paragraphs(text).map((paragraph) => paragraph.map((word) => ({ word, index: index++ })));
  }, [text]);
  const wordCount = words.reduce((count, paragraph) => count + paragraph.length, 0);

  // Without the times, the player still plays; it just doesn't follow along
  useEffect(() => {
    let active = true;
    fetch(wordsSrc, { method: "POST" })
      .then((response) => (response.ok ? response.json() : null))
      .then((loaded: unknown) => {
        if (active && Array.isArray(loaded) && loaded.length === wordCount) setTimes(loaded);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [wordsSrc, wordCount]);

  // Browsers may block playing on their own after a long recording; the play button still works
  useEffect(() => {
    player.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  function follow() {
    const time = player.current?.currentTime ?? 0;
    // Rounded, so the screen redraws a few times a second rather than every frame
    setPosition(Math.floor(time * 4) / 4);
    if (times) setCurrent(wordAt(times, time));
  }

  // Word timing needs a closer watch than the audio's own time updates
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      follow();
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [playing, times]);

  // Keep the word being read in the middle of the screen
  useEffect(() => {
    const element = wordElements.current[current];
    if (!element) return;
    const { top, bottom } = element.getBoundingClientRect();
    if (top > window.innerHeight * 0.25 && bottom < window.innerHeight * 0.65) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
  }, [current]);

  function seek(time: number) {
    if (!player.current) return;
    player.current.currentTime = time;
    follow();
  }

  function toggle() {
    if (player.current?.paused) player.current.play().catch(() => {});
    else player.current?.pause();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title}, audiobook`}
      className="night-sky fixed inset-0 z-50 flex flex-col overflow-y-auto"
    >
      <audio
        ref={player}
        src={audio}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onSeeked={follow}
      />

      <header className="sticky top-0 z-10 flex items-center gap-4 bg-night/85 px-4 py-3 backdrop-blur sm:px-8">
        <h2 className="flex-1 truncate font-display text-2xl font-light">{title}</h2>
        <button
          onClick={onClose}
          aria-label="Close the audiobook"
          className="flex size-11 flex-none items-center justify-center rounded-full bg-white/8"
        >
          <Icon icon={faXmark} primary="#fff" secondary="var(--color-sky)" className="text-xl" />
        </button>
      </header>

      <article className="mx-auto flex w-full max-w-180 flex-1 flex-col gap-6 px-6 py-[30vh] text-[22px] leading-relaxed sm:px-11">
        {words.map((paragraph, number) => (
          <p key={number}>
            {paragraph.map(({ word, index }) => (
              <span key={index}>
                <span
                  ref={(element) => {
                    wordElements.current[index] = element;
                  }}
                  onClick={times ? () => seek(times[index]) : undefined}
                  className={clsx(
                    "rounded-md transition-colors",
                    times && "cursor-pointer",
                    index === current
                      ? "bg-pink/25 text-white shadow-[0_0_0_3px_rgb(255_184_221/0.25)]"
                      : times && index > current
                        ? "text-ink-soft/55"
                        : "text-ink-soft",
                  )}
                >
                  {word}
                </span>{" "}
              </span>
            ))}
          </p>
        ))}
      </article>

      <footer className="sticky bottom-0 flex items-center gap-4 bg-night/85 px-4 py-4 backdrop-blur sm:px-8">
        <button
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="flex size-14 flex-none items-center justify-center rounded-full bg-linear-to-r from-pink via-peach to-pale-sky shadow-[0_0_30px_rgb(255_143_200/0.45)]"
        >
          <Icon
            icon={playing ? faPause : faPlay}
            primary="var(--color-night)"
            secondary="var(--color-violet)"
            className="text-2xl"
          />
        </button>
        <span className="w-11 text-right text-sm text-muted tabular-nums">{clock(position)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={position}
          aria-label="Position"
          onChange={(event) => seek(Number(event.target.value))}
          className="h-7 min-w-0 flex-1 accent-hot-pink"
        />
        <span className="w-11 text-sm text-muted tabular-nums">{clock(duration)}</span>
      </footer>
    </div>
  );
}
