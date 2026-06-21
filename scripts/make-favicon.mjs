// Regenerate the app favicon / touch icon from the webapp brand logo
// (the cream "Perx" character at public/perx/characters/perx-logo.png).
// icon.png  -> transparent padded square (browser tab favicon)
// apple-icon -> same character on a white square (iOS fills transparency with black)
import sharp from "sharp";

const SRC = "public/perx/characters/perx-logo.png";

async function build({ out, size, bg, padding }) {
  const inner = Math.round(size * (1 - padding));
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(out);
  console.log("wrote", out, `${size}x${size}`);
}

await build({ out: "src/app/icon.png", size: 512, bg: { r: 0, g: 0, b: 0, alpha: 0 }, padding: 0.1 });
await build({ out: "src/app/apple-icon.png", size: 512, bg: { r: 255, g: 255, b: 255, alpha: 1 }, padding: 0.14 });
