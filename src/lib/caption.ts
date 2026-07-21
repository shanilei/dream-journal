// Shared between the client (DreamResultScreen.tsx, for the live UI) and the
// server (print-image.ts, for the flattened print PNG generated at dream
// creation time) so both stay in sync without duplicating the logic.

export const CAPTION_MAX_WORDS = 7;
// "Edit image details" caption textarea limit (see EditImageDetailsSheet).
export const CAPTION_MAX_CHARS = 80;
const CAPTION_WORDS_PER_LINE = 4;

// Caption/date-time font size (see the "Edit image details" sheet's +/-
// steppers) — on-screen CSS px. print-image.ts's canvas is drawn at 2x the
// on-screen card's dimensions for print sharpness, so it multiplies these
// same values by PRINT_FONT_SCALE rather than keeping its own separate
// numbers, which is what keeps the printed image matching the live
// preview exactly. Date and time share one size (metaFontSize) — there's
// no separate control for each, per the feature's own "Date & Time"
// grouping.
export const CAPTION_FONT_SIZE_DEFAULT = 12; // matches the size this already shipped with
export const CAPTION_FONT_SIZE_MIN = 10;
export const CAPTION_FONT_SIZE_MAX = 32;
export const META_FONT_SIZE_DEFAULT = 13; // matches .captionMetaDate's existing size
export const META_FONT_SIZE_MIN = 10;
export const META_FONT_SIZE_MAX = 24;
export const PRINT_FONT_SCALE = 2;

export function clampFontSize(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function capitalizeFirst(text: string): string {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text;
}

// Connector/function words that read as an unfinished thought if a caption
// gets cut off right after them (e.g. hard-truncating to CAPTION_MAX_WORDS
// mid-sentence). Hebrew includes both standalone words and the common
// single-letter prefixes (ו/ש/ה/ל) for the rare case tokenization leaves
// one dangling on its own.
const TRAILING_CONNECTORS_EN = new Set([
  "and", "then", "than", "but", "or", "because", "with", "to", "of", "the",
  "a", "an", "in", "on", "at", "for", "as", "from", "into", "onto",
  "that", "which", "is", "are",
]);

const TRAILING_CONNECTORS_HE = new Set([
  "עם", "או", "אבל", "כי", "של", "אל", "עד", "כמו", "בין", "גם", "רק",
  "אז", "כש", "אם", "בלי", "ל", "ו", "ש", "ה",
]);

// Trims connector/function words off the end, one at a time, until the
// caption ends on a real word — not just hiding the last word visually,
// this changes the actual word list before it's ever joined/saved.
function stripTrailingConnectors(words: string[]): string[] {
  const trimmed = [...words];
  while (trimmed.length > 1) {
    const last = trimmed[trimmed.length - 1];
    if (TRAILING_CONNECTORS_EN.has(last.toLowerCase()) || TRAILING_CONNECTORS_HE.has(last)) {
      trimmed.pop();
    } else {
      break;
    }
  }
  return trimmed;
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
  const allWords = text
    .replace(/[.,!?\-–—]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords);
  const words = stripTrailingConnectors(allWords);

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
