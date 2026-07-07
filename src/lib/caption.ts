// Shared between the client (DreamResultScreen.tsx, for the live UI) and the
// server (print-image.ts, for the flattened print PNG generated at dream
// creation time) so both stay in sync without duplicating the logic.

export const CAPTION_MAX_WORDS = 7;
const CAPTION_WORDS_PER_LINE = 4;

function capitalizeFirst(text: string): string {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text;
}

export function getCaptionWords(text: string, maxWords: number = CAPTION_MAX_WORDS): string {
  const words = text
    .replace(/[.,!?\-–—]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords);

  const lines: string[] = [];
  for (let i = 0; i < words.length; i += CAPTION_WORDS_PER_LINE) {
    lines.push(words.slice(i, i + CAPTION_WORDS_PER_LINE).join(' '));
  }

  // Prevent orphaned single word on the last line.
  if (lines.length >= 2) {
    const lastWords = lines[lines.length - 1].split(' ');
    if (lastWords.length === 1) {
      // Steal one word from the previous line so last line has 2 words.
      const prevWords = lines[lines.length - 2].split(' ');
      const stolen = prevWords.pop()!;
      lines[lines.length - 2] = prevWords.join(' ');
      lines[lines.length - 1] = stolen + ' ' + lastWords[0];
    } else {
      // Tie the last two words so the final word can never wrap alone.
      lastWords[lastWords.length - 2] =
        lastWords[lastWords.length - 2] + ' ' + lastWords[lastWords.length - 1];
      lastWords.pop();
      lines[lines.length - 1] = lastWords.join(' ');
    }
  }

  return capitalizeFirst(lines.join('\n'));
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
