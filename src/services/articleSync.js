const config = require("../config");
const logger = require("../utils/logger");
const vnPortal = require("../vnportal/client");
const zalo = require("../zalo/client");
const { stripHtml, truncate } = require("../utils/text");
const store = require("../state/store");

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchLatestArticles() {
  const catIds = config.vnPortal.articleCatIds;
  if (catIds.length === 0) {
    const { items } = await vnPortal.getArticles({ pageNumber: 1 });
    return items;
  }
  // Neu co loc theo nhieu chuyen muc, goi rieng tung chuyen muc roi gop lai
  const results = await Promise.all(
    catIds.map((catId) => vnPortal.getArticles({ pageNumber: 1, articleCatID: catId }))
  );
  return results.flatMap((r) => r.items);
}

function toListItem(article) {
  return {
    title: truncate(article.Title, 100),
    subtitle: truncate(stripHtml(article.Summary) || article.ArticleCatName || "", 100),
    imageUrl: article.ImagePath || undefined,
    url: article.ArticleLink,
  };
}

async function syncArticles(state) {
  if (!config.sync.articlesEnabled) return;

  const articles = await fetchLatestArticles();
  // Sap xep tang dan theo ngay tao de gui theo dung thu tu thoi gian xay ra
  const sorted = [...articles].sort((a, b) => new Date(a.DateCreate) - new Date(b.DateCreate));

  const newArticles = sorted
    .filter((a) => a.Approved !== false && !store.isArticleSent(state, a.ArticleID))
    .slice(0, config.sync.maxNewItemsPerRun);

  if (newArticles.length === 0) {
    logger.info("Khong co tin bai moi.");
    return;
  }

  logger.info(`Phat hien ${newArticles.length} tin bai moi, chuan bi gui Zalo OA...`);

  for (const batch of chunk(newArticles, config.zalo.listBatchSize)) {
    const items = batch.map(toListItem);
    await zalo.broadcastListMessage(items);
    batch.forEach((a) => store.markArticleSent(state, a.ArticleID));
    store.save(state);
  }
}

module.exports = { syncArticles };
