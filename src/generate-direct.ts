import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { applyMotionBlurLayer } from "./image-postprocess";

const PROMPT = `
A surreal analog dreamscape photograph. Vertical format.

THE SCENE: Two figures stand waist-deep in open ocean water at night. The water stretches to the horizon in every direction — no land, no boats, no shore, no walls, no architecture. The sea is dark, deep teal-green, with slow heavy swells. The sky above is ink-black with a cold amber glow near the horizon.

THE MASKED FIGURE: One figure stands directly in front of the camera, close, facing the viewer head-on. They wear a large, ornate theatrical mask — pale, expressionless — covering their entire face. The rest of their body is partially submerged. The mask is the single sharpest, most detailed element in the entire frame. It is unmistakable.

COMPOSITION: The masked figure occupies the center-left of the frame, large and close. The sea dominates the right half and the entire background — wide open water pressing in from all sides. The horizon is low. The scene feels exposed, confrontational, and unmoored.

COLOR: Deep teal ocean, near-black sky, cold amber-gold glow at the horizon, the pale mask catching the only light. No reds, no oranges, no interior colors.

STYLE: Editorial surreal photograph. Heavy 35mm film grain across the entire frame. Sharp focus on the mask. The water surface has photographic texture — real ripples, real reflection. No illustration, no painting, no 3D render. No text, no letters, no symbols anywhere.

PROHIBITED: No boats. No ships. No wood. No ropes. No anchors. No docks. No walls. No interior spaces. No plants. No fish. No additional objects of any kind. Only the masked figure, the sea, and the sky.
`.trim();

async function main() {
  const outputPath = "images/mask-sea-direct.png";
  mkdirSync(dirname(outputPath), { recursive: true });

  const form = new FormData();
  form.append("prompt", PROMPT);
  form.append("model", "sd3.5-large");
  form.append("aspect_ratio", "2:3");
  form.append("output_format", "png");
  form.append(
    "negative_prompt",
    "boat, ship, wood, rope, anchor, dock, pier, shore, beach, wall, room, interior, architecture, building, text, letters, numbers, plants, fish, seaweed, coral, illustration, painting, cartoon, 3d render, anime, blurry, soft focus, haze"
  );

  const res = await fetch("https://api.stability.ai/v2beta/stable-image/generate/sd3", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
      Accept: "image/*",
    },
    body: form,
  });

  if (!res.ok) throw new Error(`Stability error ${res.status}: ${await res.text()}`);

  const clearImage = Buffer.from(await res.arrayBuffer());
  writeFileSync(outputPath.replace(".png", "-clear.png"), clearImage);

  const processed = await applyMotionBlurLayer(clearImage);
  writeFileSync(outputPath, processed);

  console.log("Done →", outputPath);
}

main().catch((e) => { console.error(e); process.exit(1); });
