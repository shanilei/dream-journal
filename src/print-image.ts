import { createCanvas, GlobalFonts, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { join } from "path";
import {
  CAPTION_MAX_WORDS,
  getCaptionWords,
  wrapCaptionLines,
  wrapLinesToWidth,
  pickCaptionLayout,
  isHebrewText,
  CAPTION_FONT_SIZE_DEFAULT,
  META_FONT_SIZE_DEFAULT,
  PRINT_FONT_SCALE,
} from "./lib/caption";
import { formatDreamDate, formatDreamTime, langFromText } from "./i18n/translations";

// 2x the on-screen card's 338:475 box for print sharpness.
const CANVAS_W = 676;
const CANVAS_H = 950;
// Was 40 — widened per direct request ("slightly larger safety margins
// than risk any caption being clipped") after the print layout's own
// scale-down still wasn't enough on the Canon SELPHY CP910's real
// printable area. Applies to both the caption/meta text's own edge
// clearance (captionX/metaX below) and CAPTION_MAX_WIDTH's own margin.
const PADDING = 48;
const BG_COLOR = "#090a13";
// Bounded caption column — leaves room for the date/time meta block in
// the opposite corner (see captionX/metaX below) so a long/large caption
// can never grow across the full canvas width and run into it, and stays
// an equal PADDING away from the image's own edge on both sides. The
// reserved-for-meta margin (was 160) is also widened, so the caption
// column itself is narrower and wraps earlier/more conservatively.
const CAPTION_MAX_WIDTH = CANVAS_W - PADDING * 2 - 200;

// Deliberately NOT rounding corners or leaving any transparency in this
// output — Safari's print/PDF rasterizer has proven unreliable compositing
// layered/alpha content (see DreamResultScreen print history: a
// sharp+SVG+embedded-font implementation of this same function produced
// PNGs that uploaded corrupted in production — every non-UTF-8 byte
// replaced with U+FFFD — while working fine locally, pointing at a
// platform-specific librsvg/font issue in Vercel's bundled sharp build).
// @napi-rs/canvas is a self-contained Skia canvas with its own font engine,
// avoiding that dependency entirely.

function registerFont(relativePath: string, alias: string) {
  const fullPath = join(process.cwd(), relativePath);
  const key = GlobalFonts.registerFromPath(fullPath, alias);
  if (!key) {
    // Don't fail the whole print image over a missing font — fall back to
    // canvas's default font rather than silently dropping all text (which
    // is what happened before this was checked: fillText() with an
    // unresolved font family drew nothing instead of throwing).
    console.error(`print-image: failed to register font "${alias}" from ${fullPath}`);
  }
}

let fontsRegistered = false;
function ensureFontsRegistered() {
  if (fontsRegistered) return;
  registerFont("font/ploni-regular-aaa.otf", "PloniRegular");
  registerFont("font/ploni-demibold-aaa.otf", "PloniDemibold");
  registerFont("font/alumni-sans-regular.ttf", "AlumniRegular");
  registerFont("font/alumni-sans-semibold.ttf", "AlumniSemibold");
  fontsRegistered = true;
}

/** Average luminance of the image's right half, matching the client's
 *  sampleBrightness() in DreamResultScreen.tsx — decides light vs dark
 *  caption text. */
function sampleTextColor(ctx: SKRSContext2D): "white" | "black" {
  const { data } = ctx.getImageData(CANVAS_W / 2, 0, CANVAS_W / 2, CANVAS_H);
  let total = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    count++;
  }
  return count && total / count > 140 ? "black" : "white";
}

type TextLine = { text: string; fontSize: number; family: string; color: string };

/** Lays out a stack of text lines (each with its own font size) either
 *  centered on or bottom-anchored to `anchorY`, returning baseline
 *  y-positions. Mirrors flex align-items: center / flex-end. */
function layoutLines(lines: TextLine[], anchorY: number, bottomAligned: boolean, lineHeightMult: number) {
  const rowHeights = lines.map((l) => l.fontSize * lineHeightMult);
  const totalHeight = rowHeights.reduce((a, b) => a + b, 0);
  const top = bottomAligned ? anchorY - totalHeight : anchorY - totalHeight / 2;

  let y = top;
  return lines.map((line, i) => {
    const rowHeight = rowHeights[i];
    const baselineY = y + rowHeight * 0.78; // approximate ascent within the row
    y += rowHeight;
    return { ...line, baselineY };
  });
}

export interface PrintImageParams {
  imageBuffer: Buffer;
  imageUrl: string;
  summaryText: string;
  dreamText?: string;
  createdAt: string;
  // Overlay-only edits (see "Edit image details" on the Dream Result
  // screen) — captionOverride replaces the auto-generated caption as-is
  // (already user-wrapped by their own line breaks, already capped to 80
  // chars client-side), displayAt replaces createdAt for the date/time
  // labels only (createdAt itself keeps controlling gallery order), and
  // showDate/showTime hide either label entirely.
  captionOverride?: string;
  showDate?: boolean;
  showTime?: boolean;
  displayAt?: string;
  // On-screen CSS px — multiplied by PRINT_FONT_SCALE below to match this
  // canvas's 2x resolution. Undefined falls back to the same defaults the
  // live preview uses (see lib/caption.ts), so an un-customized dream's
  // print image still matches its on-screen appearance exactly.
  captionFontSize?: number;
  metaFontSize?: number;
}

export async function generatePrintImage({
  imageBuffer,
  imageUrl,
  summaryText,
  dreamText,
  createdAt,
  captionOverride,
  showDate = true,
  showTime = true,
  captionFontSize = CAPTION_FONT_SIZE_DEFAULT,
  metaFontSize = META_FONT_SIZE_DEFAULT,
  displayAt,
}: PrintImageParams): Promise<Buffer> {
  ensureFontsRegistered();

  // Detected from the same source that actually becomes captionText below
  // (captionOverride, else summaryText — dreamText is never itself drawn
  // as the caption) — previously this checked `captionOverride || dreamText
  // || summaryText`, so a dream whose raw dreamText happened to differ in
  // language from its AI-generated summaryText would pick the wrong
  // direction/alignment for a caption that was actually drawn from
  // summaryText. dreamText stays as a last-resort fallback only if
  // summaryText itself is empty.
  const captionSource = captionOverride || summaryText || dreamText || "";
  const isHebrew = isHebrewText(captionSource);
  const lang = langFromText(captionSource, "en");
  const captionText = captionOverride?.trim() ? wrapCaptionLines(captionOverride) : getCaptionWords(summaryText, CAPTION_MAX_WORDS);
  const captionLines = captionText ? captionText.split("\n").filter(Boolean) : [];
  const captionLayout = pickCaptionLayout(imageUrl);
  const dateSource = displayAt ?? createdAt;
  const dateLabel = showDate ? formatDreamDate(dateSource, lang) : "";
  const timeLabel = showTime ? formatDreamTime(dateSource, lang) : "";

  const canvas = createCanvas(CANVAS_W, CANVAS_H);
  const ctx = canvas.getContext("2d");

  // Opaque background first — the source "privacy blur" image carries its
  // own semi-transparent layers (see image-postprocess.ts's frosted-glass
  // effect), so drawing it on top of a solid fill flattens that naturally.
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const img = await loadImage(imageBuffer);
  // object-fit: cover — scale to fill, center-crop the overflow.
  const scale = Math.max(CANVAS_W / img.width, CANVAS_H / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  ctx.drawImage(img, (CANVAS_W - drawW) / 2, (CANVAS_H - drawH) / 2, drawW, drawH);

  const textColor = sampleTextColor(ctx);
  const fg = textColor === "white" ? "#fff" : "#000";
  const timeColor = textColor === "black" ? "rgba(0,0,0,0.55)" : isHebrew ? "#fff" : "rgba(255,255,255,0.65)";
  const captionFamily = isHebrew ? "PloniRegular" : "AlumniRegular";
  const dateFamily = isHebrew ? "PloniDemibold" : "AlumniSemibold";
  // Date and time share one size (metaFontSize) — matches the live
  // preview, where both spans now take the same font-size override.
  const printCaptionFontSize = captionFontSize * PRINT_FONT_SCALE;
  const printMetaFontSize = metaFontSize * PRINT_FONT_SCALE;

  // Scrim gradient, mirrors the CSS: non-Hebrew darkens from the right
  // ("to left"), Hebrew flips it.
  const scrimColor = textColor === "white" ? "0,0,0" : "255,255,255";
  const scrimOpacity = textColor === "white" ? 0.4 : 0.45;
  const gradient = isHebrew
    ? ctx.createLinearGradient(0, 0, CANVAS_W, 0)
    : ctx.createLinearGradient(CANVAS_W, 0, 0, 0);
  gradient.addColorStop(0, `rgba(${scrimColor},${scrimOpacity})`);
  gradient.addColorStop(0.65, `rgba(${scrimColor},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const bottomAligned = captionLayout === "bottom";
  const anchorY = bottomAligned ? CANVAS_H - PADDING : CANVAS_H / 2;

  // Safety re-wrap against the actual rendered width (see wrapLinesToWidth's
  // own comment) — needs ctx.font set to the real caption font/size first,
  // since canvas measureText() reads that state.
  ctx.font = `${printCaptionFontSize}px "${captionFamily}", sans-serif`;
  const boundedCaptionLines = wrapLinesToWidth(
    captionLines,
    (text) => ctx.measureText(text).width,
    CAPTION_MAX_WIDTH
  );

  const captionTextLines: TextLine[] = boundedCaptionLines.map((text) => ({
    text,
    fontSize: printCaptionFontSize,
    family: captionFamily,
    color: fg,
  }));
  const metaLines: TextLine[] = [
    ...(dateLabel ? [{ text: dateLabel, fontSize: printMetaFontSize, family: dateFamily, color: fg }] : []),
    ...(timeLabel ? [{ text: timeLabel, fontSize: printMetaFontSize, family: dateFamily, color: timeColor }] : []),
  ];

  const laidOutCaption = layoutLines(captionTextLines, anchorY, bottomAligned, 1.4);
  const laidOutMeta = layoutLines(metaLines, anchorY, bottomAligned, 1.3);

  // Mirrors the CSS: non-Hebrew caption text sits on the left with the
  // scrim gradient darkening from the right; Hebrew flips both.
  const captionX = isHebrew ? CANVAS_W - PADDING : PADDING;
  const captionAlign = isHebrew ? "right" : "left";
  const metaX = isHebrew ? PADDING : CANVAS_W - PADDING;
  const metaAlign = isHebrew ? "left" : "right";
  // Canvas defaults to LTR text direction regardless of script — without
  // this, embedded numbers/punctuation inside a Hebrew line (a date-like
  // fragment, digits) can shape/order incorrectly (mirrored) since the
  // bidi algorithm never gets told which way the paragraph itself runs.
  ctx.direction = isHebrew ? "rtl" : "ltr";

  for (const line of laidOutCaption) {
    ctx.font = `${line.fontSize}px "${line.family}", sans-serif`;
    ctx.fillStyle = line.color;
    ctx.textAlign = captionAlign;
    ctx.fillText(line.text, captionX, line.baselineY);
  }
  for (const line of laidOutMeta) {
    ctx.font = `${line.fontSize}px "${line.family}", sans-serif`;
    ctx.fillStyle = line.color;
    ctx.textAlign = metaAlign;
    ctx.fillText(line.text, metaX, line.baselineY);
  }

  return canvas.toBuffer("image/png");
}
