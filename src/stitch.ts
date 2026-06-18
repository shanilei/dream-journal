import { createCanvas, loadImage } from "@napi-rs/canvas";

export interface StitchOptions {
  density?: number; // רוחב הגריד בתאים - יותר = תפרים קטנים ועדינים יותר
  thickness?: number; // עובי קו התפר
  wobble?: number; // 0–1, כמה "רעידה" יד-עשויה יש לכל תפר
  paletteSize?: number; // מספר הצבעים בפלטה (k-means)
}

const DEFAULTS: Required<StitchOptions> = {
  density: 104,
  thickness: 2.8,
  wobble: 0.44,
  paletteSize: 15,
};

// תאימות 1:1 לאלגוריתם ב-tools/stitch-filter.html, מותאם להרצה ב-Node עם @napi-rs/canvas
export async function applyStitchEffect(input: Buffer, options: StitchOptions = {}): Promise<Buffer> {
  const { density, thickness, wobble, paletteSize } = { ...DEFAULTS, ...options };

  const sourceImg = await loadImage(input);
  const aspect = sourceImg.height / sourceImg.width;
  const gridW = density;
  const gridH = Math.round(density * aspect);

  // הקטנת התמונה לגריד, כדי להפיק פלטת צבעים וצבע-לתא
  const procCanvas = createCanvas(gridW, gridH);
  const pCtx = procCanvas.getContext("2d");
  pCtx.drawImage(sourceImg, 0, 0, gridW, gridH);
  const imgData = pCtx.getImageData(0, 0, gridW, gridH).data;

  const pixels: number[][] = [];
  for (let i = 0; i < imgData.length; i += 4) {
    pixels.push([imgData[i], imgData[i + 1], imgData[i + 2]]);
  }

  // k-means על הצבעים כדי לבנות פלטה מוגבלת
  let centroids: number[][] = [];
  for (let c = 0; c < paletteSize; c++) {
    centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
  }

  for (let iter = 0; iter < 5; iter++) {
    const clusters: number[][][] = [];
    for (let k = 0; k < paletteSize; k++) clusters.push([]);
    for (const px of pixels) {
      let minDist = Infinity;
      let bestIdx = 0;
      for (let ci = 0; ci < paletteSize; ci++) {
        const d = Math.hypot(px[0] - centroids[ci][0], px[1] - centroids[ci][1], px[2] - centroids[ci][2]);
        if (d < minDist) {
          minDist = d;
          bestIdx = ci;
        }
      }
      clusters[bestIdx].push(px);
    }
    centroids = clusters.map((cluster) => {
      if (cluster.length === 0) return pixels[Math.floor(Math.random() * pixels.length)];
      const sum = cluster.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
      return [sum[0] / cluster.length, sum[1] / cluster.length, sum[2] / cluster.length];
    });
  }

  const palette = centroids.map((c) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`);

  const indices = pixels.map((px) => {
    let minDist = Infinity;
    let bestIdx = 0;
    for (let ci = 0; ci < centroids.length; ci++) {
      const d = Math.hypot(px[0] - centroids[ci][0], px[1] - centroids[ci][1], px[2] - centroids[ci][2]);
      if (d < minDist) {
        minDist = d;
        bestIdx = ci;
      }
    }
    return bestIdx;
  });

  const wobbleSeeds: number[] = [];
  for (let i = 0; i < gridW * gridH * 2; i++) {
    wobbleSeeds.push(Math.random() - 0.5);
  }

  // רינדור סופי ברזולוציה גבוהה
  const exportScale = 1600 / Math.max(gridW, gridH);
  const w = Math.round(gridW * exportScale);
  const h = Math.round(gridH * exportScale);

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  const cellSize = w / gridW;

  // רקע בד אאידה (קווי רשת + "חורים")
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "#fdfaf0";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(0,0,0,0.1)";
  const holeSize = cellSize * 0.15;
  for (let xx = 0; xx <= w; xx += cellSize) {
    for (let yy = 0; yy <= h; yy += cellSize) {
      ctx.fillRect(xx - holeSize / 2, yy - holeSize / 2, holeSize, holeSize);
    }
  }
  ctx.restore();

  // תפרי מצליבה
  const wobbleAmount = wobble * cellSize * 0.3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const idx = indices[y * gridW + x];
      const color = palette[idx];
      const cx = x * cellSize + cellSize / 2;
      const cy = y * cellSize + cellSize / 2;

      const s = cellSize * 0.35;
      const seedIdx = (y * gridW + x) * 2;
      const j1 = wobbleSeeds[seedIdx] * wobbleAmount;
      const j2 = wobbleSeeds[seedIdx + 1] * wobbleAmount;

      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;

      ctx.beginPath();
      ctx.moveTo(cx - s + j1, cy - s + j2);
      ctx.lineTo(cx + s - j2, cy + s - j1);
      ctx.moveTo(cx + s + j2, cy - s + j1);
      ctx.lineTo(cx - s - j1, cy + s + j2);
      ctx.stroke();
    }
  }

  return canvas.toBuffer("image/png");
}
