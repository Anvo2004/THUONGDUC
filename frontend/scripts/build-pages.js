#!/usr/bin/env node
// Sinh lai toan bo HTML tinh TU MANIFEST DA COMMIT (frontend/public/data/media-manifest.json).
//
// Khac voi build-media-manifest.js: khong can thu muc nguon docs/ (~2.5GB, khong commit)
// va khong can sharp. Dung khi chi sua giao dien - template, CSS, tieu de hien thi.
//
//   npm run build:pages
//
// Anh/video khong bi dung toi: file nhi phan van nam nguyen o VPS.

const fs = require("fs");
const path = require("path");
const { generateStaticPages } = require("./lib/generatePages");

const MANIFEST_PATH = path.join(__dirname, "..", "public", "data", "media-manifest.json");

function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`[build-pages] Khong tim thay manifest: ${MANIFEST_PATH}`);
    console.error(`[build-pages] Chay "npm run build:media" truoc (can thu muc docs/).`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const { pageCount, itemCount } = generateStaticPages(manifest);

  console.log(`[build-pages] Da sinh ${pageCount} trang HTML tu manifest (${itemCount} muc noi dung).`);
  console.log(`[build-pages] Da ghi chi muc tim kiem: public/data/search-index.json`);
}

main();
