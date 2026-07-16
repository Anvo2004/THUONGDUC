const config = require("../config");
const logger = require("../utils/logger");
const vnPortal = require("../vnportal/client");
const zaloArticle = require("../zalo/articleClient");
const { stripHtml, truncate, normalizeTitle } = require("../utils/text");
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
    // Zalo cong bo gioi han 150 ky tu nhung tu choi chuoi dung 150 (giong het truong
    // description tung gap: cong bo 300 nhung tu choi dung 300) - lui xuong 140 an toan.
    title: truncate(article.Title.replace(/\s+/g, " ").trim(), 140),
    author: extractAuthor(article.Detail || ""),
    description,
    bodyText: `${fullText}\n\nNguồn: ${article.ArticleLink}`,
    coverPhotoUrl: article.ImagePath || config.zalo.defaultCoverUrl || undefined,
  };
}

async function syncArticles(state) {
  if (!config.sync.articlesEnabled) return;

  const articles = await fetchNewArticleDetails(state);

  // Loc bai qua cu theo DateCreate THAT (tu getArticleDetail) - trang chu vnPortal co
  // cac khoi noi dung "goi y/noi bat" co dinh (vd "Dat va nguoi Thuong Duc") khong theo
  // thu tu thoi gian, de bi quet nham la "bai moi" dan den tao trung lien tuc moi lan
  // dong bo. Danh dau "da xu ly" luon (ke ca dry-run) de khong quet lai vinh vien.
  const maxAgeMs = config.sync.maxArticleAgeDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const tooOld = articles.filter((a) => now - new Date(a.DateCreate).getTime() > maxAgeMs);
  if (tooOld.length) {
    logger.info(
      `Bo qua ${tooOld.length} bai qua cu (qua ${config.sync.maxArticleAgeDays} ngay, ` +
        "co the la khoi noi bat/goi y tren trang chu chu khong phai bai moi that su): " +
        tooOld.map((a) => `${a.ArticleID} (${a.DateCreate})`).join(", ")
    );
    tooOld.forEach((a) => store.markArticleSent(state, a.ArticleID));
    store.save(state);
  }
  const recentArticles = articles.filter((a) => now - new Date(a.DateCreate).getTime() <= maxAgeMs);

  // Loc trung theo TIEU DE, khong chi theo ArticleID - 1 bai vnPortal co the duoc gan
  // vao nhieu chuyen muc nen xuat hien voi nhieu duong dan/ArticleID khac nhau nhung
  // cung mot noi dung (cung tieu de). Dam bao khong bao gio tao 2 bai Zalo trung tieu de.
  const seenTitlesThisRun = new Set();
  const titleDuplicates = [];
  const uniqueArticles = [];
  for (const a of recentArticles) {
    const normTitle = normalizeTitle(a.Title);
    if (store.isTitleSent(state, normTitle) || seenTitlesThisRun.has(normTitle)) {
      titleDuplicates.push(a);
    } else {
      seenTitlesThisRun.add(normTitle);
      uniqueArticles.push(a);
    }
  }
  if (titleDuplicates.length) {
    logger.info(
      `Bo qua ${titleDuplicates.length} bai trung tieu de voi bai da tao (1 bai duoc gan nhieu chuyen muc): ` +
        titleDuplicates.map((a) => `${a.ArticleID} ("${a.Title}")`).join(", ")
    );
    titleDuplicates.forEach((a) => store.markArticleSent(state, a.ArticleID));
    store.save(state);
  }

  // Sap xep tang dan theo ngay tao de gui theo dung thu tu thoi gian xay ra
  const sorted = [...uniqueArticles].sort((a, b) => new Date(a.DateCreate) - new Date(b.DateCreate));

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

    // Danh dau + luu ngay theo TUNG bai thanh cong - khong doi ca lo xong moi luu,
    // de 1 bai loi (vd verify het retry) khong lam mat trang thai cua bai da tao
    // thanh cong truoc do trong cung lo (nguyen nhan gay trung bai da gap phai).
    result.results.forEach((r, idx) => {
      if (r.id) {
        store.markArticleSent(state, batch[idx].ArticleID);
        store.markTitleSent(state, normalizeTitle(batch[idx].Title));
        store.save(state);
      }
    });
  }
}

module.exports = { syncArticles };
