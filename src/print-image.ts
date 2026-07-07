import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";
import { CAPTION_MAX_WORDS, getCaptionWords, pickCaptionLayout, isHebrewText } from "./lib/caption";
import { formatDreamDate, formatDreamTime, langFromText } from "./i18n/translations";

// 2x the on-screen card's 338:475 box for print sharpness.
const CANVAS_W = 676;
const CANVAS_H = 950;
const PADDING = 40;

// Deliberately NOT rounding corners or leaving any transparency in this
// output — Safari's print/PDF rasterizer has proven unreliable compositing
// layered/alpha content (see DreamResultScreen print history). This image
// is meant to be flat and fully opaque so printing it is just "show a
// plain <img>", nothing for the print engine to get wrong.

function fontDataUri(path: string, format: "opentype" | "truetype"): string {
  const base64 = readFileSync(join(process.cwd(), path)).toString("base64");
  const mime = format === "opentype" ? "font/otf" : "font/ttf";
  return `data:${mime};base64,${base64}`;
}

const FONT_CSS = `
@font-face { font-family: 'PloniRegular'; src: url(${fontDataUri("font/ploni-regular-aaa.otf", "opentype")}) format('opentype'); }
@font-face { font-family: 'PloniDemibold'; src: url(${fontDataUri("font/ploni-demibold-aaa.otf", "opentype")}) format('opentype'); }
@font-face { font-family: 'AlumniRegular'; src: url(${fontDataUri("font/alumni-sans-regular.ttf", "truetype")}) format('truetype'); }
@font-face { font-family: 'AlumniSemibold'; src: url(${fontDataUri("font/alumni-sans-semibold.ttf", "truetype")}) format('truetype'); }
`;

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Average luminance of the image's right half, matching the client's
 *  sampleBrightness() in DreamResultScreen.tsx — decides light vs dark
 *  caption text. */
async function sampleTextColor(image: ReturnType<typeof sharp>): Promise<"white" | "black"> {
  const { width = 1, height = 1 } = await image.metadata();
  const { data, info } = await image
    .clone()
    .extract({ left: Math.floor(width / 2), top: 0, width: Math.max(1, width - Math.floor(width / 2)), height })
    .resize(40, 40, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let total = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += info.channels) {
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
  const isHebrew = isHebrewText(dreamText || summaryText || "");
  const lang = langFromText(dreamText || summaryText, "en");
  const captionText = getCaptionWords(summaryText, CAPTION_MAX_WORDS);
  const captionLines = captionText ? captionText.split("\n") : [];
  const captionLayout = pickCaptionLayout(imageUrl);
  const dateLabel = formatDreamDate(createdAt, lang);
  const timeLabel = formatDreamTime(createdAt, lang);

  // Flatten the source image against the app's dark background first — the
  // "privacy blur" images carry their own semi-transparent layers (veil,
  // grain) baked in during generation (see image-postprocess.ts), which is
  // exactly the kind of alpha content the print bug chokes on.
  const flattenedSource = sharp(imageBuffer).flatten({ background: "#090a13" });
  const textColor = await sampleTextColor(flattenedSource);

  const base = await flattenedSource
    .resize(CANVAS_W, CANVAS_H, { fit: "cover", position: "centre" })
    .toBuffer();

  const fg = textColor === "white" ? "#fff" : "#000";
  const timeColor = textColor === "black" ? "rgba(0,0,0,0.55)" : isHebrew ? "#fff" : "rgba(255,255,255,0.65)";
  const captionFamily = isHebrew ? "PloniRegular" : "AlumniRegular";
  const dateFamily = isHebrew ? "PloniDemibold" : "AlumniSemibold";
  const timeFontSize = isHebrew ? 26 : 22;

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
  // scrim gradient darkening from the right ("to left"); Hebrew flips both.
  const captionX = isHebrew ? CANVAS_W - PADDING : PADDING;
  const captionAnchor = isHebrew ? "end" : "start";
  const metaX = isHebrew ? PADDING : CANVAS_W - PADDING;
  const metaAnchor = isHebrew ? "start" : "end";
  const gradientX1 = isHebrew ? "0%" : "100%";
  const gradientX2 = isHebrew ? "100%" : "0%";
  const scrimColor = textColor === "white" ? "0,0,0" : "255,255,255";
  const scrimOpacity = textColor === "white" ? 0.4 : 0.45;

  const captionTextSvg = laidOutCaption
    .map(
      (l) =>
        `<text x="${captionX}" y="${l.baselineY}" text-anchor="${captionAnchor}" font-family="${l.family}" font-size="${l.fontSize}" fill="${l.color}">${escapeXml(l.text)}</text>`
    )
    .join("\n");

  const metaTextSvg = laidOutMeta
    .map(
      (l) =>
        `<text x="${metaX}" y="${l.baselineY}" text-anchor="${metaAnchor}" font-family="${l.family}" font-size="${l.fontSize}" fill="${l.color}">${escapeXml(l.text)}</text>`
    )
    .join("\n");

  const overlaySvg = `<svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
<defs>
<style>${FONT_CSS}</style>
<linearGradient id="scrim" x1="${gradientX1}" y1="0%" x2="${gradientX2}" y2="0%">
<stop offset="0%" stop-color="rgba(${scrimColor},${scrimOpacity})"/>
<stop offset="65%" stop-color="rgba(${scrimColor},0)"/>
</linearGradient>
</defs>
<rect width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#scrim)"/>
${captionTextSvg}
${metaTextSvg}
</svg>`;

  const composited = await sharp(base)
    .composite([{ input: Buffer.from(overlaySvg) }])
    .flatten({ background: "#090a13" })
    .png()
    .toBuffer();

  return composited;
}
