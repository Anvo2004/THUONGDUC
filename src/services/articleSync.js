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

// vnPortal.getArticles() (API danh sach) hien luon tra 404 "Khong co thong tin" du
// truyen tham so gi (loi/thieu cau hinh phia vnPortal cho module bai viet cua site nay -
// xem ghi chu tai getRecentArticleLinks() trong vnportal/client.js). Dung workaround
// quet trang chu de lay ArticleID moi, roi goi getArticleDetail() (van hoat dong binh
// thuong) de lay noi dung day du tung bai.
async function fetchNewArticleDetails(state) {
  const links = await vnPortal.getRecentArticleLinks();
  const unseenIds = links.map((l) => l.articleId).filter((id) => !store.isArticleSent(state, id));

  const details = await Promise.all(
    unseenIds.map(async (id) => {
      try {
        return await vnPortal.getArticleDetail(id);
      } catch (err) {
        logger.warn(`Khong lay duoc chi tiet bai ArticleID=${id}, bo qua:`, err.message);
        return null;
      }
    })
  );
  return details.filter(Boolean);
}

function extractAuthor(detailHtml) {
  const matches = [...detailHtml.matchAll(/<p[^>]*text-align:\s*right[^>]*>([\s\S]*?)<\/p>/g)];
  if (!matches.length) return undefined;
  const lastLine = stripHtml(matches[matches.length - 1][1]);
  return lastLine && lastLine.length <= 50 ? lastLine : undefined;
}

function toArticleItem(article) {
  const fullText = stripHtml(article.Detail) || stripHtml(article.Summary) || article.Title;
  const description = truncate(fullText, 250);
  return {
    title: truncate(article.Title.replace(/\s+/g, " ").trim(), 150),
    author: extractAuthor(article.Detail || ""),
    description,
    bodyText: `${fullText}\n\nNguồn: ${article.ArticleLink}`,
    coverPhotoUrl: article.ImagePath || config.zalo.defaultCoverUrl || undefined,
  };
}

async function syncArticles(state) {
  if (!config.sync.articlesEnabled) return;

  const articles = await fetchNewArticleDetails(state);
  // Sap xep tang dan theo ngay tao de gui theo dung thu tu thoi gian xay ra
  const sorted = [...articles].sort((a, b) => new Date(a.DateCreate) - new Date(b.DateCreate));

  const withoutCover = sorted.filter((a) => !a.ImagePath && !config.zalo.defaultCoverUrl);
  if (withoutCover.length) {
    logger.warn(
      `${withoutCover.length} tin bai khong co anh (ImagePath) va chua cau hinh ZALO_DEFAULT_COVER_URL, se bo qua: ` +
        withoutCover.map((a) => a.ArticleID).join(", ")
    );
  }

  const newArticles = sorted
    .filter((a) => a.ImagePath || config.zalo.defaultCoverUrl)
    .slice(0, config.sync.maxNewItemsPerRun);

  if (newArticles.length === 0) {
    logger.info("Khong co tin bai moi.");
    return;
  }

  logger.info(`Phat hien ${newArticles.length} tin bai moi, chuan bi tao tren Zalo OA (khong broadcast)...`);

  for (const batch of chunk(newArticles, config.zalo.listBatchSize)) {
    const items = batch.map(toArticleItem);
    const result = await zaloArticle.createArticles(items);
    // Dry-run khong duoc danh dau "da gui" - neu khong, khi bat ZALO_SEND_ENABLED=true
    // sau nay cac tin da dry-run se bi bo qua vinh vien, khong bao gio gui that duoc.
    if (result && result.dryRun) continue;
    batch.forEach((a) => store.markArticleSent(state, a.ArticleID));
    store.save(state);
  }
}

module.exports = { syncArticles };
