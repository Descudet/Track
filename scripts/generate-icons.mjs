import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

async function generate() {
  const svgPath = path.resolve("public/icons/icon.svg");
  const svgBuffer = fs.readFileSync(svgPath);

  const targets = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
  ];

  for (const { name, size } of targets) {
    const dest = path.resolve("public/icons", name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(dest);
    console.log(`Generated ${name} (${size}x${size})`);
  }
}

generate().catch(console.error);
