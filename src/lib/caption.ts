// Shared between the client (DreamResultScreen.tsx, for the live UI) and the
// server (print-image.ts, for the flattened print PNG generated at dream
// creation time) so both stay in sync without duplicating the logic.

export const CAPTION_MAX_WORDS = 7;
// "Edit image details" caption textarea limit (see EditImageDetailsSheet).
export const CAPTION_MAX_CHARS = 80;
const CAPTION_WORDS_PER_LINE = 4;

function capitalizeFirst(text: string): string {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text;
}

// Groups words into wordsPerLine-sized lines, then rebalances the last
// line so a single word never wraps alone (steals one from the line
// before it, or ties the last two words together if it's the only line).
function groupIntoLines(words: string[], wordsPerLine: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(' '));
  }

  if (lines.length >= 2) {
    const lastWords = lines[lines.length - 1].split(' ');
    if (lastWords.length === 1) {
      const prevWords = lines[lines.length - 2].split(' ');
      const stolen = prevWords.pop()!;
      lines[lines.length - 2] = prevWords.join(' ');
      lines[lines.length - 1] = stolen + ' ' + lastWords[0];
    } else {
      lastWords[lastWords.length - 2] =
        lastWords[lastWords.length - 2] + ' ' + lastWords[lastWords.length - 1];
      lastWords.pop();
      lines[lines.length - 1] = lastWords.join(' ');
    }
  }

  return lines;
}

export function getCaptionWords(text: string, maxWords: number = CAPTION_MAX_WORDS): string {
  const words = text
    .replace(/[.,!?\-–—]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords);

  return capitalizeFirst(groupIntoLines(words, CAPTION_WORDS_PER_LINE).join('\n'));
}

// Word-wraps a user-authored caption override (see "Edit image details")
// to the same ~4-words-per-line convention as getCaptionWords, without
// stripping punctuation or capitalizing — this is the user's own text, not
// an auto-generated summary. Both the live overlay (DreamResultScreen.tsx)
// and the flattened print PNG (print-image.ts, drawn on an HTML canvas
// with no native text-wrapping of its own) rely on this to guarantee every
// line fits the caption column's width.
export function wrapCaptionLines(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  return groupIntoLines(words, CAPTION_WORDS_PER_LINE).join('\n');
}

export type CaptionLayout = "center" | "bottom";

export function pickCaptionLayout(seed: string): CaptionLayout {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % 4 === 0 ? "bottom" : "center";
}

export function isHebrewText(text: string): boolean {
  return /[֐-׿]/.test(text);
}
