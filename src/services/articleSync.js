const config = require("../config");
const logger = require("../utils/logger");
const vnPortal = require("../vnportal/client");
const zaloArticle = require("../zalo/articleClient");
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

function toArticleItem(article) {
  const summary = truncate(stripHtml(article.Summary) || article.ArticleCatName || "", 300);
  return {
    title: truncate(article.Title, 150),
    description: summary,
    bodyText: `${summary}\n\nNguồn: ${article.ArticleLink}`,
    coverPhotoUrl: article.ImagePath || config.zalo.defaultCoverUrl || undefined,
  };
}

async function syncArticles(state) {
  if (!config.sync.articlesEnabled) return;

  const articles = await fetchLatestArticles();
  // Sap xep tang dan theo ngay tao de gui theo dung thu tu thoi gian xay ra
  const sorted = [...articles].sort((a, b) => new Date(a.DateCreate) - new Date(b.DateCreate));

  const unsent = sorted.filter((a) => a.Approved !== false && !store.isArticleSent(state, a.ArticleID));

  const withoutCover = unsent.filter((a) => !a.ImagePath && !config.zalo.defaultCoverUrl);
  if (withoutCover.length) {
    logger.warn(
      `${withoutCover.length} tin bai khong co anh (ImagePath) va chua cau hinh ZALO_DEFAULT_COVER_URL, se bo qua: ` +
        withoutCover.map((a) => a.ArticleID).join(", ")
    );
  }

  const newArticles = unsent
    .filter((a) => a.ImagePath || config.zalo.defaultCoverUrl)
    .slice(0, config.sync.maxNewItemsPerRun);

  if (newArticles.length === 0) {
    logger.info("Khong co tin bai moi.");
    return;
  }

  logger.info(`Phat hien ${newArticles.length} tin bai moi, chuan bi gui Zalo OA...`);

  for (const batch of chunk(newArticles, config.zalo.listBatchSize)) {
    const items = batch.map(toArticleItem);
    await zaloArticle.publishArticles(items);
    batch.forEach((a) => store.markArticleSent(state, a.ArticleID));
    store.save(state);
  }
}

module.exports = { syncArticles };
