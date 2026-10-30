import { normalize } from "./audiobook-text";

export type HeardWord = { text: string; start: number };

const MATCH = 2;
const MISMATCH = -1;
const GAP = -1;
const DIAGONAL = 0;
const SKIP_TEXT = 1;
const SKIP_HEARD = 2;

// When each word of the text starts in the recording, from the words a transcription heard.
// The transcript can differ from the text ("3" heard as "three", a dash not spoken),
// so the two are lined up like a diff. Words with no partner take the time of the word before.
export function alignWords(words: string[], heard: HeardWord[]) {
  const n = words.length;
  const m = heard.length;
  const a = words.map(normalize);
  const b = heard.map((word) => normalize(word.text));

  // Scores are kept a row at a time; the moves are kept whole to trace the path back
  const moves = new Uint8Array((n + 1) * (m + 1));
  let previous = Array.from({ length: m + 1 }, (_, j) => j * GAP);
  for (let j = 1; j <= m; j++) moves[j] = SKIP_HEARD;
  for (let i = 1; i <= n; i++) {
    const row = [i * GAP];
    moves[i * (m + 1)] = SKIP_TEXT;
    for (let j = 1; j <= m; j++) {
      const diagonal = previous[j - 1] + (a[i - 1] && a[i - 1] === b[j - 1] ? MATCH : MISMATCH);
      const skipText = previous[j] + GAP;
      const skipHeard = row[j - 1] + GAP;
      const best = Math.max(diagonal, skipText, skipHeard);
      row.push(best);
      moves[i * (m + 1) + j] = best === diagonal ? DIAGONAL : best === skipText ? SKIP_TEXT : SKIP_HEARD;
    }
    previous = row;
  }

  const starts: (number | null)[] = Array(n).fill(null);
  for (let i = n, j = m; i > 0 || j > 0; ) {
    const move = moves[i * (m + 1) + j];
    if (move === DIAGONAL) {
      starts[i - 1] = heard[j - 1].start;
      i--;
      j--;
    } else if (move === SKIP_TEXT) {
      i--;
    } else {
      j--;
    }
  }

  // Fill the gaps, and never let a word start before the one ahead of it
  let last = 0;
  return starts.map((start) => {
    last = Math.max(last, start ?? last);
    return last;
  });
}

// A transcript may give times for phrases rather than words; spread each phrase's time over its words
export function heardWords(segments: { text: string; startSecond: number; endSecond: number }[]) {
  return segments.flatMap(({ text, startSecond, endSecond }) => {
    const words = text.split(/\s+/).filter(Boolean);
    const length = words.reduce((sum, word) => sum + word.length, 0) || 1;
    let offset = 0;
    return words.map((word) => {
      const start = startSecond + ((endSecond - startSecond) * offset) / length;
      offset += word.length;
      return { text: word, start };
    });
  });
}
