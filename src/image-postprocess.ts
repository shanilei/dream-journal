import sharp from "sharp";

// How long the motion-blur smear is, in pixels.
const BLUR_LENGTH_PX = 25;
// How much of the blurred version to mix in (0 = untouched, 1 = fully blurred).
// Baked directly into the convolution kernel so this is a single-pass blend —
// no separate compositing step needed.
const BLUR_STRENGTH = 0.45;

function buildMotionBlurKernel(lengthPx: number, strength: number) {
  const size = lengthPx % 2 === 0 ? lengthPx + 1 : lengthPx; // odd size so there's a center pixel
  const mid = Math.floor(size / 2);
  const kernel = new Array(size * size).fill(0);

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

  for (let i = 0; i < size; i++) {
    kernel[mid * size + i] = (lineWeights[i] / lineSum) * strength;
  }
  kernel[mid * size + mid] += 1 - strength; // keep (1 - strength) of the original sharp pixel

  return { width: size, height: size, kernel };
}

/**
 * Applies a real, deterministic directional motion-blur layer to a generated
 * image, blended at partial strength so the photo stays recognizable. This
 * runs as a post-processing step after generation, independent of whatever
 * blur/motion language is in the style prompt — image models are unreliable
 * at literally blurring pixels on request, but this guarantees it.
 */
export async function applyMotionBlurLayer(input: Buffer): Promise<Buffer> {
  const kernel = buildMotionBlurKernel(BLUR_LENGTH_PX, BLUR_STRENGTH);
  return sharp(input).convolve(kernel).toBuffer();
}
