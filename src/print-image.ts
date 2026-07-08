import { createCanvas, GlobalFonts, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { join } from "path";
import { CAPTION_MAX_WORDS, getCaptionWords, pickCaptionLayout, isHebrewText } from "./lib/caption";
import { formatDreamDate, formatDreamTime, langFromText } from "./i18n/translations";

// 2x the on-screen card's 338:475 box for print sharpness.
const CANVAS_W = 676;
const CANVAS_H = 950;
const PADDING = 40;
const BG_COLOR = "#090a13";

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
}

export async function generatePrintImage({
  imageBuffer,
  imageUrl,
  summaryText,
  dreamText,
  createdAt,
}: PrintImageParams): Promise<Buffer> {
  ensureFontsRegistered();

  const isHebrew = isHebrewText(dreamText || summaryText || "");
  const lang = langFromText(dreamText || summaryText, "en");
  const captionText = getCaptionWords(summaryText, CAPTION_MAX_WORDS);
  const captionLines = captionText ? captionText.split("\n") : [];
  const captionLayout = pickCaptionLayout(imageUrl);
  const dateLabel = formatDreamDate(createdAt, lang);
  const timeLabel = formatDreamTime(createdAt, lang);

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
  const timeFontSize = isHebrew ? 26 : 22;

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

  const captionTextLines: TextLine[] = captionLines.map((text) => ({
    text,
    fontSize: 24,
    family: captionFamily,
    color: fg,
  }));
  const metaLines: TextLine[] = [
    { text: dateLabel, fontSize: 26, family: dateFamily, color: fg },
    ...(timeLabel ? [{ text: timeLabel, fontSize: timeFontSize, family: dateFamily, color: timeColor }] : []),
  ];

  const laidOutCaption = layoutLines(captionTextLines, anchorY, bottomAligned, 1.4);
  const laidOutMeta = layoutLines(metaLines, anchorY, bottomAligned, 1.3);

  // Mirrors the CSS: non-Hebrew caption text sits on the left with the
  // scrim gradient darkening from the right; Hebrew flips both.
  const captionX = isHebrew ? CANVAS_W - PADDING : PADDING;
  const captionAlign = isHebrew ? "right" : "left";
  const metaX = isHebrew ? PADDING : CANVAS_W - PADDING;
  const metaAlign = isHebrew ? "left" : "right";

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
