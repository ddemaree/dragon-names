"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "read-aloud";

// The end of a sentence (with any closing quotes or emphasis) or of a paragraph.
// A sentence only ends before a capital or the like, so `"Hello!" she said.` is read as one.
const BOUNDARY = /[.!?…]["”’)*_]*(?=\s+[^\sa-z])|\n{2,}/g;

// Speech should say the words, not the Markdown around them
function plain(markdown: string) {
  return markdown
    .replace(/^#+\s*/gm, "")
    .replace(/[*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function supported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Reads streamed text aloud with the browser's voice, a sentence at a time, as the text arrives
export function useReadAloud() {
  const [on, setOn] = useState(false);
  const [available, setAvailable] = useState(false);
  const onRef = useRef(false);
  // How much of the current text has been queued to speak
  const spoken = useRef(0);

  useEffect(() => {
    setAvailable(supported());
    try {
      const saved = localStorage.getItem(STORAGE_KEY) === "on";
      setOn(saved);
      onRef.current = saved;
    } catch {}
  }, []);

  // iOS only speaks after speech starts in a tap, so start it (silently) on the next one
  useEffect(() => {
    if (!on || !supported()) return;
    const unlock = () => speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    document.addEventListener("pointerdown", unlock, { once: true });
    return () => document.removeEventListener("pointerdown", unlock);
  }, [on]);

  // Stop talking when the page goes away
  useEffect(() => () => {
    if (supported()) speechSynthesis.cancel();
  }, []);

  const say = useCallback((markdown: string) => {
    const text = plain(markdown);
    if (!onRef.current || !text || !supported()) return;
    // Queued separately, since some browsers cut long utterances off
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }, []);

  const stop = useCallback(() => {
    spoken.current = 0;
    if (supported()) speechSynthesis.cancel();
  }, []);

  const toggle = useCallback(() => {
    const next = !onRef.current;
    onRef.current = next;
    setOn(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {}
    if (!next) stop();
  }, [stop]);

  // Call before new text starts streaming. Speech from earlier text carries on.
  const begin = useCallback(() => {
    spoken.current = 0;
  }, []);

  // Call with all the text so far; speaks any sentences finished since the last call
  const feed = useCallback(
    (text: string) => {
      const rest = text.slice(spoken.current);
      const end = Array.from(rest.matchAll(BOUNDARY)).at(-1);
      if (!end) return;
      const length = end.index + end[0].length;
      say(rest.slice(0, length));
      spoken.current += length;
    },
    [say],
  );

  // Call once the text is complete, to speak whatever's left
  const finish = useCallback(
    (text: string) => {
      say(text.slice(spoken.current));
      spoken.current = 0;
    },
    [say],
  );

  return { available, on, toggle, begin, feed, finish, stop };
}
