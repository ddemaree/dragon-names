// The words an audiobook reads. The server records them and the player shows them,
// so both split the text the same way.

// Speech should say the words, not the Markdown around them
export function plain(markdown: string) {
  return markdown
    .replace(/^#+\s*/gm, "")
    .replace(/[*_`>]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// A tale's audiobook reads the book's title first
export function bookText(title: string | null, book: string) {
  return title ? `${title}.\n\n${book}` : book;
}

// Each paragraph's words, with their punctuation
export function paragraphs(markdown: string) {
  return plain(markdown)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.split(/\s+/).filter(Boolean));
}

// For matching a word in the text to the same word heard in the recording
export function normalize(word: string) {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}
