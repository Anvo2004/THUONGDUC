const fs = require("fs");
const path = require("path");

const { normalizeManifest } = require("./titles");
const { getCategoryMeta, categoryIcon } = require("./categoryMeta");
const { renderHome } = require("../templates/homePage");
const {
  renderInfographicIndex,
  renderInfographicCategory,
  renderInfographicDetail,
} = require("../templates/infographicPages");
const { renderVideoIndex, renderVideoCategory, renderVideoDetail } = require("../templates/videoPages");

const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");

function writeHtml(urlPath, html) {
  // urlPath vd "/infographic/bao-antd/" -> public/infographic/bao-antd/index.html
  const filePath = path.join(PUBLIC_DIR, urlPath, "index.html");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html);
}

/** Chi muc cho o tim kiem tren trang chu. Bieu tuong/mau gom theo chuyen de de file nho. */
function buildSearchIndex(infographic, video) {
  const categories = {};
  const items = [];

  const addCat = (slug, title) => {
    if (categories[slug]) return;
    categories[slug] = { title, rgb: getCategoryMeta(slug).rgb, icon: categoryIcon(slug) };
  };

  for (const cat of infographic.categories) {
    addCat(cat.slug, cat.title);
    for (const item of cat.items) {
      items.push({ title: item.title, url: `/infographic/${cat.slug}/${item.slug}/`, type: "image", cat: cat.slug });
    }
  }
  for (const cat of video.categories) {
    // Chuyen de video co the trung slug voi infographic (vd "lu") -> tach khong gian ten.
    const key = `video:${cat.slug}`;
    if (!categories[key]) {
      categories[key] = { title: cat.title, rgb: getCategoryMeta(cat.slug).rgb, icon: categoryIcon(cat.slug) };
    }
    for (const item of cat.items) {
      items.push({ title: item.title, url: `/video/${cat.slug}/${item.slug}/`, type: "video", cat: key });
    }
  }

  return { categories, items };
}

/**
 * Sinh toan bo trang tinh tu manifest. Tieu de duoc chuan hoa tai day (khong dung
 * cham toi slug - slug da nam trong URL va duong dan file media tren VPS).
 */
function generateStaticPages(manifest) {
  normalizeManifest(manifest);
  const { infographic, video } = manifest;

  fs.rmSync(path.join(PUBLIC_DIR, "infographic"), { recursive: true, force: true });
  fs.rmSync(path.join(PUBLIC_DIR, "video"), { recursive: true, force: true });

  writeHtml("/", renderHome(infographic, video));

  writeHtml("/infographic/", renderInfographicIndex(infographic));
  for (const cat of infographic.categories) {
    writeHtml(`/infographic/${cat.slug}/`, renderInfographicCategory(cat));
    cat.items.forEach((item, i) => {
      writeHtml(
        `/infographic/${cat.slug}/${item.slug}/`,
        renderInfographicDetail(cat, item, cat.items[i - 1] || null, cat.items[i + 1] || null)
      );
    });
  }

  writeHtml("/video/", renderVideoIndex(video, infographic));
  for (const cat of video.categories) {
    writeHtml(`/video/${cat.slug}/`, renderVideoCategory(cat, infographic));
    cat.items.forEach((item, i) => {
      writeHtml(
        `/video/${cat.slug}/${item.slug}/`,
        renderVideoDetail(cat, item, cat.items[i - 1] || null, cat.items[i + 1] || null, infographic)
      );
    });
  }

  const searchIndexPath = path.join(PUBLIC_DIR, "data", "search-index.json");
  fs.mkdirSync(path.dirname(searchIndexPath), { recursive: true });
  fs.writeFileSync(searchIndexPath, JSON.stringify(buildSearchIndex(infographic, video)));

  const pageCount =
    2 +
    infographic.categories.length +
    infographic.categories.reduce((n, c) => n + c.items.length, 0) +
    1 +
    video.categories.length +
    video.categories.reduce((n, c) => n + c.items.length, 0);

  return { pageCount, itemCount: buildSearchIndex(infographic, video).items.length };
}

module.exports = { generateStaticPages, PUBLIC_DIR };
