const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { uniqueSlug, slugify } = require("./lib/slugify");
const { parseOrder } = require("./lib/parseOrder");

// __dirname = frontend/HoTroPCTT/scripts. Ma nguon docs/ nam o goc project (ngang hang voi
// frontend/), con thu muc phuc vu web (public/) nam trong frontend/HoTroPCTT/.
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..");
const FEATURE_DIR = path.join(__dirname, "..");
const DOCS_DIR = path.join(PROJECT_ROOT, "docs");
const PUBLIC_DIR = path.join(FEATURE_DIR, "public");
const MEDIA_DIR = path.join(PUBLIC_DIR, "media");
const MANIFEST_PATH = path.join(PUBLIC_DIR, "data", "media-manifest.json");

const INFOGRAPHIC_SRC = findDocsSubdir(/^INFOGRAPHIC/i);
const VIDEO_SRC = findDocsSubdir(/^VIDEO/i);

const FORMAT_FOLDERS = {
  portrait: /^a\./,
  landscape: /^b\./,
  square: /^c\./,
};
// Hau to dinh dang o cuoi ten file (truoc phan mo rong), vd "...-d.jpg", "...-v1.jpg"
const FORMAT_SUFFIX_RE = /-(d|n|v1|v2)$/i;

const SIGN_LANGUAGE_RE = /th[uủụ]\s*ng[uữựừ]/i;

function log(...args) {
  console.log(`[build-media]`, ...args);
}
function warn(...args) {
  console.warn(`[build-media][CANH BAO]`, ...args);
}

/**
 * Google Drive giai nen thanh thu muc long nhau trung ten
 * ("X-<id>/X/..."). Tim thu muc con thuc su chua noi dung.
 */
function findDocsSubdir(pattern) {
  if (!fs.existsSync(DOCS_DIR)) return null;
  const outer = fs.readdirSync(DOCS_DIR).find((n) => pattern.test(n));
  if (!outer) return null;
  const outerPath = path.join(DOCS_DIR, outer);
  const inner = fs.readdirSync(outerPath).find((n) => pattern.test(n));
  return inner ? path.join(outerPath, inner) : outerPath;
}

function listDirs(dir) {
  if (!dir || !fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function listFiles(dir, ext) {
  if (!dir || !fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((f) => f.isFile() && f.name.toLowerCase().endsWith(ext))
    .map((f) => f.name);
}

function stripExt(filename) {
  return filename.slice(0, filename.length - path.extname(filename).length);
}

function fileSize(filePath) {
  return fs.statSync(filePath).size;
}

// ---------- INFOGRAPHIC ----------

function parseFormatFiles(folderPath, ext) {
  return listFiles(folderPath, ext).map((file) => {
    const base = stripExt(file).replace(FORMAT_SUFFIX_RE, "");
    const { order, title } = parseOrder(base);
    return { file, order, title };
  });
}

function buildInfographicManifest() {
  if (!INFOGRAPHIC_SRC) {
    warn("Khong tim thay thu muc nguon INFOGRAPHIC trong docs/, bo qua.");
    return { categories: [] };
  }

  const usedCatSlugs = new Set();
  const categories = [];

  for (const catDirName of listDirs(INFOGRAPHIC_SRC)) {
    const { order: catOrder, title: catTitle } = parseOrder(catDirName);
    const catSlug = uniqueSlug(catTitle, usedCatSlugs);
    const catPath = path.join(INFOGRAPHIC_SRC, catDirName);

    const subDirs = listDirs(catPath);
    const portraitDir = subDirs.find((d) => FORMAT_FOLDERS.portrait.test(d));
    const landscapeDir = subDirs.find((d) => FORMAT_FOLDERS.landscape.test(d));
    const squareDir = subDirs.find((d) => FORMAT_FOLDERS.square.test(d));

    if (!portraitDir) {
      warn(`Chuyen de "${catDirName}" khong co thu muc "a. Format doc", bo qua.`);
      continue;
    }

    const portraitFiles = parseFormatFiles(path.join(catPath, portraitDir), ".jpg");
    const landscapeFiles = landscapeDir ? parseFormatFiles(path.join(catPath, landscapeDir), ".jpg") : [];
    const squareFiles = squareDir ? parseFormatFiles(path.join(catPath, squareDir), ".jpg") : [];

    const usedItemSlugs = new Set();
    const items = [];

    for (const pf of portraitFiles.sort((a, b) => a.order - b.order)) {
      const landscapeMatch = landscapeFiles.find((f) => f.order === pf.order);
      const squareMatches = squareFiles.filter((f) => f.order === pf.order);

      if (!landscapeMatch) warn(`"${catDirName}" muc #${pf.order} (${pf.title}) thieu anh ngang.`);
      if (squareMatches.length === 0) warn(`"${catDirName}" muc #${pf.order} (${pf.title}) thieu anh vuong.`);

      const itemSlug = uniqueSlug(pf.title, usedItemSlugs);

      items.push({
        slug: itemSlug,
        order: pf.order,
        title: pf.title,
        __source: {
          portrait: path.join(catPath, portraitDir, pf.file),
          landscape: landscapeMatch ? path.join(catPath, landscapeDir, landscapeMatch.file) : null,
          square: squareMatches.map((m) => path.join(catPath, squareDir, m.file)),
        },
      });
    }

    categories.push({ slug: catSlug, order: catOrder, title: catTitle, items });
  }

  categories.sort((a, b) => a.order - b.order);
  return { categories };
}

// ---------- VIDEO ----------

function buildVideoManifest() {
  if (!VIDEO_SRC) {
    warn("Khong tim thay thu muc nguon VIDEO trong docs/, bo qua.");
    return { categories: [] };
  }

  const usedCatSlugs = new Set();
  const categories = [];

  for (const catDirName of listDirs(VIDEO_SRC)) {
    const { order: catOrder, title: catTitle } = parseOrder(catDirName);
    const catSlug = uniqueSlug(catTitle, usedCatSlugs);
    const catPath = path.join(VIDEO_SRC, catDirName);

    const usedItemSlugs = new Set();
    const items = [];

    for (const file of listFiles(catPath, ".mp4")) {
      const base = stripExt(file);
      const { order, title } = parseOrder(base);
      const itemSlug = uniqueSlug(title, usedItemSlugs);
      const srcPath = path.join(catPath, file);

      items.push({
        slug: itemSlug,
        order,
        title,
        hasSignLanguage: SIGN_LANGUAGE_RE.test(title),
        bytes: fileSize(srcPath),
        __source: srcPath,
      });
    }

    items.sort((a, b) => a.order - b.order);
    categories.push({ slug: catSlug, order: catOrder, title: catTitle, items });
  }

  categories.sort((a, b) => a.order - b.order);
  return { categories };
}

// ---------- Xu ly file (nen anh, copy video) ----------

const IMAGE_DETAIL_WIDTH = 1080;
const IMAGE_DETAIL_QUALITY = 78;
const IMAGE_THUMB_WIDTH = 320;
const IMAGE_THUMB_QUALITY = 70;

async function writeCompressedImage(srcPath, destPath, width, quality) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  // Doc vao buffer thay vi dua thang duong dan cho sharp: libvips tren Windows
  // co gioi han rieng voi duong dan dai/co dau tieng Viet, du fs doc binh thuong.
  const inputBuffer = fs.readFileSync(srcPath);
  const outputBuffer = await sharp(inputBuffer).resize({ width, withoutEnlargement: true }).jpeg({ quality }).toBuffer();
  fs.writeFileSync(destPath, outputBuffer);
  return outputBuffer.length;
}

async function processInfographicFiles(infographic) {
  const outDir = path.join(MEDIA_DIR, "infographic");
  fs.rmSync(outDir, { recursive: true, force: true });

  for (const cat of infographic.categories) {
    for (const item of cat.items) {
      const itemOutDir = path.join(outDir, cat.slug, item.slug);
      const thumbOutDir = path.join(outDir, cat.slug, item.slug, "thumb");
      const formats = {};

      if (item.__source.portrait) {
        const dest = path.join(itemOutDir, "portrait.jpg");
        const bytes = await writeCompressedImage(item.__source.portrait, dest, IMAGE_DETAIL_WIDTH, IMAGE_DETAIL_QUALITY);
        formats.portrait = { file: "portrait.jpg", bytes };
        await writeCompressedImage(
          item.__source.portrait,
          path.join(thumbOutDir, "portrait.jpg"),
          IMAGE_THUMB_WIDTH,
          IMAGE_THUMB_QUALITY
        );
      }
      if (item.__source.landscape) {
        const dest = path.join(itemOutDir, "landscape.jpg");
        const bytes = await writeCompressedImage(item.__source.landscape, dest, IMAGE_DETAIL_WIDTH, IMAGE_DETAIL_QUALITY);
        formats.landscape = { file: "landscape.jpg", bytes };
      }
      if (item.__source.square.length) {
        formats.square = [];
        for (let i = 0; i < item.__source.square.length; i++) {
          const fname = `square-${i + 1}.jpg`;
          const dest = path.join(itemOutDir, fname);
          const bytes = await writeCompressedImage(item.__source.square[i], dest, IMAGE_DETAIL_WIDTH, IMAGE_DETAIL_QUALITY);
          formats.square.push({ file: fname, bytes });
        }
      }

      item.formats = formats;
      item.thumbnail = formats.portrait ? "thumb/portrait.jpg" : null;
      delete item.__source;
    }
  }
}

function copyVideoFiles(video) {
  const outDir = path.join(MEDIA_DIR, "video");
  fs.rmSync(outDir, { recursive: true, force: true });

  for (const cat of video.categories) {
    for (const item of cat.items) {
      const destDir = path.join(outDir, cat.slug);
      fs.mkdirSync(destDir, { recursive: true });
      const fileName = `${item.slug}.mp4`;
      fs.copyFileSync(item.__source, path.join(destDir, fileName));
      item.file = fileName;
      delete item.__source;
    }
  }
}

// ---------- Sinh HTML tinh ----------

// Dung chung voi build-pages.js (sinh lai HTML tu manifest, khong can docs/).
const { generateStaticPages } = require("./lib/generatePages");

// ---------- Main ----------

async function main() {
  log("Nguon INFOGRAPHIC:", INFOGRAPHIC_SRC || "(khong tim thay)");
  log("Nguon VIDEO:", VIDEO_SRC || "(khong tim thay)");

  const infographic = buildInfographicManifest();
  const video = buildVideoManifest();

  const infoItemCount = infographic.categories.reduce((n, c) => n + c.items.length, 0);
  const videoItemCount = video.categories.reduce((n, c) => n + c.items.length, 0);
  log(`Infographic: ${infographic.categories.length} chuyen de, ${infoItemCount} muc.`);
  log(`Video: ${video.categories.length} chuyen de, ${videoItemCount} muc.`);

  const skipMedia = process.argv.includes("--manifest-only");
  if (!skipMedia) {
    log("Dang nen anh (sharp)...");
    await processInfographicFiles(infographic);
    log("Dang copy video...");
    copyVideoFiles(video);
  } else {
    // Van xoa field __source de manifest JSON sach, nhung khong tao file nhi phan
    for (const cat of infographic.categories) for (const item of cat.items) delete item.__source;
    for (const cat of video.categories) for (const item of cat.items) delete item.__source;
  }

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), infographic, video }, null, 2)
  );
  log("Da ghi manifest:", MANIFEST_PATH);

  // Luu y: manifest ghi o tren giu TIEU DE GOC (theo ten file nguon). Viec lam sach
  // tieu de de hien thi dien ra luc render, trong generateStaticPages().
  log("Dang sinh trang HTML tinh...");
  const { pageCount } = generateStaticPages({ infographic, video });
  log(`Da sinh ${pageCount} trang HTML vao public/ (trang chu, infographic/, video/)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
