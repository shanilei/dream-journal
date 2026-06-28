import sharp from "sharp";

// How long the motion-blur smear is, in pixels — matches Photoshop's
// directional Motion Blur dialog at Distance: 200px, Angle: 0°.
const BLUR_LENGTH_PX = 200;
// How much of the blurred version to mix in (0 = untouched, 1 = fully blurred)
// — this is the "mask opacity" controlling how strongly the blur shows through.
const BLUR_STRENGTH = 0.7;
// Opacity of the horizontal grain-streak overlay. A flat-colored region
// convolved with any kernel that sums to 1 comes back exactly as flat as it
// started — blur mathematically cannot change a uniform area, no matter how
// long the kernel is. So on its own, convolution blur only ever reads as
// "blur on the subject," never on a flat backdrop. A faint streak of grain,
// stretched horizontally by the same kernel, has no such limitation — it's
// visible the same everywhere — which is what makes the motion read across
// the whole frame instead of just the high-contrast elements.
const STREAK_OPACITY = 0.14;

// How strongly the frosted-glass haze blends over the sharp photo
// (0 = untouched, 1 = fully replaced by the hazy/veiled version). Applied as
// a flat per-pixel alpha rather than a contrast-driven filter, for the same
// reason as the streak layer above: a flat alpha blend shows up identically
// on a busy subject and an empty backdrop.
const FROSTED_GLASS_STRENGTH = 0.4;

function buildHorizontalKernel(lengthPx: number, strength: number) {
  const size = lengthPx % 2 === 0 ? lengthPx + 1 : lengthPx; // odd size so there's a center pixel
  const mid = Math.floor(size / 2);

  // Gaussian taper along the line instead of a flat/uniform weight — a flat
  // box profile has a hard cutoff at both ends, which reads as a duplicated
  // "ghost" edge rather than a smooth photographic smear. Tapering the
  // weight smoothly to near-zero at the ends fixes that.
  const sigma = size / 4;
  const lineWeights: number[] = [];
  let lineSum = 0;
  for (let i = 0; i < size; i++) {
    const dist = i - mid;
    const w = Math.exp(-(dist * dist) / (2 * sigma * sigma));
    lineWeights.push(w);
    lineSum += w;
  }

  const middleRow = lineWeights.map((w) => (w / lineSum) * strength);
  middleRow[mid] += 1 - strength; // keep (1 - strength) of the original sharp pixel

  // height: 3 — sharp's convolve() rejects anything shorter (min height is
  // 3), so this is the shortest possible kernel that's still effectively
  // horizontal-only: all the weight lives in the middle row, with zeros
  // above and below. Spending size*size multiplies on a fully-populated 2D
  // matrix (the previous approach) wastes the vast majority of the work and
  // gets painfully slow once size reaches 140+.
  const zeroRow = new Array(size).fill(0);
  return { width: size, height: 3, kernel: [...zeroRow, ...middleRow, ...zeroRow] };
}

async function buildHorizontalStreakTexture(width: number, height: number, lengthPx: number): Promise<Buffer> {
  const kernel = buildHorizontalKernel(lengthPx, 1);

  const streaked = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 128, g: 128, b: 128 },
      noise: { type: "gaussian", mean: 128, sigma: 40 },
    },
  })
    .convolve(kernel)
    .png()
    .toBuffer();

  return sharp(streaked).ensureAlpha(STREAK_OPACITY).png().toBuffer();
}

/**
 * Applies a real, deterministic directional motion-blur layer to a generated
 * image, blended at partial strength so the photo stays recognizable. This
 * runs as a post-processing step after generation, independent of whatever
 * blur/motion language is in the style prompt — image models are unreliable
 * at literally blurring pixels on request, but this guarantees it.
 */
export async function applyMotionBlurLayer(input: Buffer): Promise<Buffer> {
  const { width, height } = await sharp(input).metadata();
  if (!width || !height) return input;

  const kernel = buildHorizontalKernel(BLUR_LENGTH_PX, BLUR_STRENGTH);
  const blurred = await sharp(input).convolve(kernel).toBuffer();
  const streaks = await buildHorizontalStreakTexture(width, height, BLUR_LENGTH_PX);

  return sharp(blurred)
    .composite([{ input: streaks, blend: "soft-light" }])
    .toBuffer();
}

/**
 * Applies a deterministic frosted-glass effect — a soft blur, a slightly
 * desaturated/brightened haze, a faint white veil, and a grain layer —
 * blended over the whole photo via a flat per-pixel alpha mask rather than a
 * contrast-driven filter. That flat alpha blend guarantees the effect reads
 * everywhere, including on flat color blocks where a plain blur would be
 * invisible.
 */
export async function applyFrostedGlassLayer(input: Buffer): Promise<Buffer> {
  const { width, height } = await sharp(input).metadata();
  if (!width || !height) return input;

  const veil = await sharp({
    create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0.22 } },
  })
    .png()
    .toBuffer();

  const grain = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 128, g: 128, b: 128 },
      noise: { type: "gaussian", mean: 128, sigma: 28 },
    },
  })
    .ensureAlpha(0.08)
    .png()
    .toBuffer();

  const hazy = await sharp(input)
    .blur(9)
    .modulate({ saturation: 0.82, brightness: 1.06 })
    .composite([{ input: veil }, { input: grain }])
    .png()
    .toBuffer();

  const hazyMasked = await sharp(hazy).ensureAlpha(FROSTED_GLASS_STRENGTH).png().toBuffer();

  return sharp(input).composite([{ input: hazyMasked }]).toBuffer();
}
