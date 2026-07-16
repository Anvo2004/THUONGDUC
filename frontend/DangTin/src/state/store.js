const fs = require("fs");
const path = require("path");
const config = require("../config");
const logger = require("../utils/logger");

const DEFAULT_STATE = {
  sentArticleIds: [],
  sentTitles: [],
  sentDocumentKeys: [],
};

// Gioi han so luong ID luu tru de file khong phinh to vo han theo thoi gian
const MAX_TRACKED_IDS = 2000;

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function load() {
  const filePath = config.paths.stateFile;
  if (!fs.existsSync(filePath)) {
    return { ...DEFAULT_STATE };
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      sentArticleIds: parsed.sentArticleIds || [],
      sentTitles: parsed.sentTitles || [],
      sentDocumentKeys: parsed.sentDocumentKeys || [],
    };
  } catch (err) {
    logger.error("Khong doc duoc state.json, khoi tao lai state rong:", err.message);
    return { ...DEFAULT_STATE };
  }
}

function save(state) {
  const filePath = config.paths.stateFile;
  ensureDir(filePath);
  const trimmed = {
    sentArticleIds: state.sentArticleIds.slice(-MAX_TRACKED_IDS),
    sentTitles: state.sentTitles.slice(-MAX_TRACKED_IDS),
    sentDocumentKeys: state.sentDocumentKeys.slice(-MAX_TRACKED_IDS),
  };
  fs.writeFileSync(filePath, JSON.stringify(trimmed, null, 2), "utf-8");
}

function isArticleSent(state, articleId) {
  return state.sentArticleIds.includes(articleId);
}

function markArticleSent(state, articleId) {
  if (!isArticleSent(state, articleId)) {
    state.sentArticleIds.push(articleId);
  }
}

// Cung 1 bai co the duoc gan vao nhieu chuyen muc tren vnPortal nen xuat hien nhieu
// lan voi cung tieu de (khac ArticleID). Theo doi rieng theo tieu de (da chuan hoa)
// de dam bao khong bao gio tao 2 bai Zalo cung tieu de, du ArticleID co khac nhau.
function isTitleSent(state, normalizedTitle) {
  return state.sentTitles.includes(normalizedTitle);
}

function markTitleSent(state, normalizedTitle) {
  if (!isTitleSent(state, normalizedTitle)) {
    state.sentTitles.push(normalizedTitle);
  }
}

// Van ban khong co ID so nen dung CodeID + DateOfIssued lam khoa duy nhat
function documentKey(doc) {
  return `${doc.CodeID}__${doc.DateOfIssued}`;
}

function isDocumentSent(state, doc) {
  return state.sentDocumentKeys.includes(documentKey(doc));
}

function markDocumentSent(state, doc) {
  const key = documentKey(doc);
  if (!state.sentDocumentKeys.includes(key)) {
    state.sentDocumentKeys.push(key);
  }
}

module.exports = {
  load,
  save,
  isArticleSent,
  markArticleSent,
  isTitleSent,
  markTitleSent,
  isDocumentSent,
  markDocumentSent,
  documentKey,
};
