const config = require("../config");
const logger = require("../utils/logger");
const vnPortal = require("../vnportal/client");
const zaloArticle = require("../zalo/articleClient");
const { truncate } = require("../utils/text");
const store = require("../state/store");

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function firstFileUrl(doc) {
  const files = (doc.AllFilePaths || "").split(",").map((s) => s.trim()).filter(Boolean);
  return files[0];
}

function toArticleItem(doc) {
  const title = truncate(`${doc.TypeName} ${doc.CodeID}`.trim(), 150);
  const description = truncate(doc.Epitomize || doc.AgencyName || "", 300);
  return {
    title,
    description,
    bodyText: `${description}\n\nCơ quan ban hành: ${doc.AgencyName}\nTải văn bản: ${firstFileUrl(doc)}`,
    coverPhotoUrl: config.zalo.defaultCoverUrl || undefined,
  };
}

async function syncDocuments(state) {
  if (!config.sync.documentsEnabled) return;

  const { items } = await vnPortal.getDocuments({ pageNumber: 1 });
  const sorted = [...items].sort((a, b) => new Date(a.DateCreated) - new Date(b.DateCreated));

  const unsent = sorted.filter((d) => firstFileUrl(d) && !store.isDocumentSent(state, d));

  if (!config.zalo.defaultCoverUrl && unsent.length) {
    logger.warn(
      "Chua cau hinh ZALO_DEFAULT_COVER_URL - van ban khong co anh rieng nen se bi bo qua het. " +
        "Dat bien nay (vd anh logo UBND xa) de gui duoc van ban."
    );
  }

  const newDocs = config.zalo.defaultCoverUrl ? unsent.slice(0, config.sync.maxNewItemsPerRun) : [];

  if (newDocs.length === 0) {
    logger.info("Khong co van ban moi.");
    return;
  }

  logger.info(`Phat hien ${newDocs.length} van ban moi, chuan bi gui Zalo OA...`);

  for (const batch of chunk(newDocs, config.zalo.listBatchSize)) {
    const items = batch.map(toArticleItem);
    const result = await zaloArticle.publishArticles(items);
    // Dry-run khong duoc danh dau "da gui", xem giai thich trong articleSync.js
    if (result && result.dryRun) continue;
    batch.forEach((d) => store.markDocumentSent(state, d));
    store.save(state);
  }
}

module.exports = { syncDocuments };
