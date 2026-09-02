import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(root, "src/data/transportData.ts"), "utf8");

const lines = [];
const lineRe =
  /\{\s*id:\s*(\d+),\s*slug:\s*"([^"]+)",\s*title:\s*\{\s*ar:\s*"([^"]+)",\s*en:\s*"([^"]+)"\s*\},\s*subtitle:\s*\{\s*ar:\s*"([^"]+)",\s*en:\s*"([^"]+)"\s*\}/g;
let m;
while ((m = lineRe.exec(src))) {
  lines.push({ id: Number(m[1]), slug: m[2], nameEn: m[4], descEn: m[6] });
}

const stops = [];
const stopBlockRe = /buildStops\((\d+),\s*\[([\s\S]*?)\]\)/g;
while ((m = stopBlockRe.exec(src))) {
  const lineId = Number(m[1]);
  const block = m[2];
  const tupleRe = /\[\s*"([^"]+)",\s*"([^"]+)",[\s\S]*?"([^"]+)",\s*"([^"]+)"/g;
  let order = 0;
  let tm;
  while ((tm = tupleRe.exec(block))) {
    order += 1;
    stops.push({
      lineId,
      order,
      nameAr: tm[1],
      nameEn: tm[2],
      descAr: tm[3],
      descEn: tm[4],
    });
  }
}

const out = path.join(root, "backend/AlbrigeTransport/Data/localization-seed.json");
fs.writeFileSync(out, JSON.stringify({ lines, stops }, null, 2));
console.log(`Wrote ${lines.length} lines and ${stops.length} stops to ${out}`);
