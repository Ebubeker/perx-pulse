// Shrink the app's raster assets in place (same filenames/extensions, so no code changes).
// Illustrations (mascots/packs/awards) → palette PNG with dithering (smooth, ~40x smaller).
// Photos (offer JPEGs) → mozjpeg q72. Resized to ~2x their on-screen size, so still retina-crisp.
import sharp from "sharp";
import fs from "fs";
import path from "path";

const jobs = [
  { dir: "public/perx/characters", ext: ".png", max: 480, kind: "png" }, // mascots render ≤200px
  { dir: "public/perx/packs", ext: ".png", max: 560, kind: "png" },      // pack cards render ~268px
  { dir: "public/perx/awards", ext: ".png", max: 256, kind: "png" },     // badges render ~104px
  { dir: "public/perx/offers", ext: ".jpg", max: 800, kind: "jpeg" },    // photo cards
];

let before = 0, after = 0, count = 0;
for (const j of jobs) {
  if (!fs.existsSync(j.dir)) continue;
  const files = fs.readdirSync(j.dir).filter((f) => f.toLowerCase().endsWith(j.ext));
  for (const f of files) {
    const p = path.join(j.dir, f);
    const buf = fs.readFileSync(p); // read fully before writing back to the same path
    before += buf.length;
    let pipe = sharp(buf).resize({ width: j.max, height: j.max, fit: "inside", withoutEnlargement: true });
    pipe = j.kind === "png"
      ? pipe.png({ compressionLevel: 9, palette: true, quality: 90, dither: 1 })
      : pipe.jpeg({ quality: 72, mozjpeg: true, progressive: true });
    const out = await pipe.toBuffer();
    // Only overwrite when we actually save bytes (never bloat an already-small asset).
    if (out.length < buf.length) { fs.writeFileSync(p, out); after += out.length; count++; }
    else after += buf.length;
  }
}
console.log(`optimized ${count} files · ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB`);
