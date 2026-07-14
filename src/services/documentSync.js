const config = require("../config");
const logger = require("../utils/logger");
const vnPortal = require("../vnportal/client");
const zalo = require("../zalo/client");
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

function toListItem(doc) {
  return {
    title: truncate(`${doc.TypeName} ${doc.CodeID}`.trim(), 100),
    subtitle: truncate(doc.Epitomize || doc.AgencyName || "", 100),
    imageUrl: undefined,
    url: firstFileUrl(doc),
  };
}

async function syncDocuments(state) {
  if (!config.sync.documentsEnabled) return;

  const { items } = await vnPortal.getDocuments({ pageNumber: 1 });
  const sorted = [...items].sort((a, b) => new Date(a.DateCreated) - new Date(b.DateCreated));

  const newDocs = sorted
    .filter((d) => firstFileUrl(d) && !store.isDocumentSent(state, d))
    .slice(0, config.sync.maxNewItemsPerRun);

  if (newDocs.length === 0) {
    logger.info("Khong co van ban moi.");
    return;
  }

  logger.info(`Phat hien ${newDocs.length} van ban moi, chuan bi gui Zalo OA...`);

  for (const batch of chunk(newDocs, config.zalo.listBatchSize)) {
    const items = batch.map(toListItem);
    await zalo.broadcastListMessage(items);
    batch.forEach((d) => store.markDocumentSent(state, d));
    store.save(state);
  }
}

module.exports = { syncDocuments };
