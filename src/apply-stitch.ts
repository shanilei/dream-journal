import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { applyStitchEffect, type StitchOptions } from "./stitch.js";

// שימוש: npm run apply-stitch -- --in images/source.png [--out images/source-stitched.png]
//        [--density 104] [--thickness 2.8] [--wobble 0.44] [--palette 15]
async function main() {
  const args = process.argv.slice(2);
  const inFlag = args.indexOf("--in");

  if (inFlag === -1 || !args[inFlag + 1]) {
    console.error("שימוש:\n  npm run apply-stitch -- --in images/source.png [--out images/source-stitched.png]");
    process.exit(1);
  }

  const inputPath = args[inFlag + 1];
  const outFlag = args.indexOf("--out");
  const outputPath = outFlag !== -1 && args[outFlag + 1] ? args[outFlag + 1] : inputPath.replace(/(\.[^.]+)$/, "-stitched$1");

  const options: StitchOptions = {};
  const getNum = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? Number(args[idx + 1]) : undefined;
  };
  const density = getNum("--density");
  const thickness = getNum("--thickness");
  const wobble = getNum("--wobble");
  const paletteSize = getNum("--palette");
  if (density !== undefined) options.density = density;
  if (thickness !== undefined) options.thickness = thickness;
  if (wobble !== undefined) options.wobble = wobble;
  if (paletteSize !== undefined) options.paletteSize = paletteSize;

  const input = readFileSync(inputPath);
  const stitched = await applyStitchEffect(input, options);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, stitched);
  console.log(`התמונה עם אפקט הרקמה נשמרה ב: ${outputPath}`);
}

main().catch((err) => {
  console.error("שגיאה:", err.message);
  process.exit(1);
});
