// Widow prevention — a single word must never sit alone on the last line
// of a wrapped text block, in any language, at any viewport width.
//
// CSS alone can't guarantee this everywhere: `text-wrap: pretty` avoids
// orphans in supporting browsers, but isn't universal and is capped to
// short blocks, so it's only ever a progressive enhancement (see the
// `text-wrap: pretty` fallback rule in globals.css), never the guarantee.
// The actual guarantee has to be in the text itself, not the renderer.
//
// The standard, deterministic fix: join the *last two words* of each line
// with a non-breaking space (U+00A0). The browser can still wrap the text
// wherever it naturally would, but it can never break between those two
// words specifically — so however many lines a block wraps to, the last
// one always has at least two words. If the whole string fits on one
// line, the swap is invisible (nbsp renders identically to a normal space
// when it isn't at a wrap point), so this is always safe to apply, never
// just to blocks known in advance to wrap.
//
// This is a pure string transform — it works identically for English and
// Hebrew (RTL bidi reordering doesn't care whether a given space is a
// regular space or U+00A0), and needs no per-screen/per-component logic:
// call it once wherever user-facing text is finally rendered as a string.
export function preventWidows(text: string): string {
  if (!text) return text;
  // Existing "\n"s are deliberate manual line breaks (e.g. onboarding
  // headlines) — each resulting segment is itself a line that can still
  // wrap further on narrow screens, so each is widow-protected on its own
  // rather than joining the very last word of the whole string to a word
  // on a different manual line.
  return text
    .split("\n")
    .map((line) => {
      // Some translation strings are deliberately half-sentences meant to
      // be concatenated around another inline element — e.g.
      // langPickerHeadingBefore: "Choose your " (rendered right before a
      // separately-styled gradient <span>) carries that trailing space on
      // purpose. Trimming it here would silently glue the next element
      // straight onto this text with no space at all. So: pull out the
      // leading/trailing whitespace first and preserve it byte-for-byte,
      // touching only the whitespace *between* words in the trimmed core.
      const leading = line.match(/^\s*/)?.[0] ?? "";
      const trailing = line.match(/\s*$/)?.[0] ?? "";
      const core = line.slice(leading.length, line.length - trailing.length);
      const lastSpace = core.lastIndexOf(" ");
      if (lastSpace === -1) return line; // single word — nothing to protect
      const fixedCore = core.slice(0, lastSpace) + " " + core.slice(lastSpace + 1);
      return leading + fixedCore + trailing;
    })
    .join("\n");
}
