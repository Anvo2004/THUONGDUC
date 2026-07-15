/**
 * Tao thu 1 bai viet Zalo OA (create + verify, KHONG broadcast) tu 1 bai vnPortal cu the.
 * Dung de test thu cong, khong nam trong flow dong bo tu dong (src/index.js).
 *
 * Usage: node scripts/create-test-article.js <vnPortal-article-url-or-id>
 */
const vnPortal = require("../src/vnportal/client");
const zaloArticle = require("../src/zalo/articleClient");
const { stripHtml, truncate } = require("../src/utils/text");
const logger = require("../src/utils/logger");

function extractArticleId(input) {
  const asNumber = Number(input);
  if (Number.isInteger(asNumber) && asNumber > 0) return asNumber;

  const match = input.match(/-(\d+)(?:\?.*)?$/);
  if (!match) {
    throw new Error(`Khong tim thay ArticleID trong: ${input}`);
  }
  return parseInt(match[1], 10);
}

function extractAuthor(detailHtml) {
  const matches = [...detailHtml.matchAll(/<p[^>]*text-align:\s*right[^>]*>([\s\S]*?)<\/p>/g)];
  if (!matches.length) return undefined;
  const lastAuthor = stripHtml(matches[matches.length - 1][1]);
  return lastAuthor && lastAuthor.length <= 50 ? lastAuthor : undefined;
}

function buildDescription(detailHtml) {
  const text = stripHtml(detailHtml);
  return truncate(text, 250);
}

function buildFullBody(detailHtml) {
  return stripHtml(detailHtml);
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("Thieu tham so: node scripts/create-test-article.js <url-hoac-ArticleID>");
    process.exit(1);
  }

  const articleId = extractArticleId(input);
  logger.info(`Dang lay chi tiet bai viet ArticleID=${articleId} tu vnPortal...`);
  const article = await vnPortal.getArticleDetail(articleId);
  if (!article) {
    throw new Error(`Khong tim thay bai viet ArticleID=${articleId} tren vnPortal`);
  }

  const item = {
    title: truncate(article.Title.replace(/\s+/g, " ").trim(), 150),
    author: extractAuthor(article.Detail),
    description: buildDescription(article.Detail),
    coverPhotoUrl: article.ImagePath,
    bodyText: `${buildFullBody(article.Detail)}\n\nNguồn: ${article.ArticleLink}`,
  };

  logger.info("Chuan bi tao bai viet Zalo OA (test, khong broadcast):", JSON.stringify(item, null, 2));

  const token = await zaloArticle.createArticle(item);
  // Bai dai (anh + noi dung day du) can nhieu thoi gian xu ly hon binh thuong
  // ("Media is being processed"), tang retries/delay de tranh bao loi gia.
  const id = await zaloArticle.verifyArticle(token, { retries: 8, delayMs: 3000 });
  logger.info(`Da tao bai viet TEST tren Zalo OA thanh cong, id: ${id} (trang thai "An" - chua broadcast).`);
}

main().catch((err) => {
  logger.error("Loi tao bai viet test:", err.message);
  process.exit(1);
});
