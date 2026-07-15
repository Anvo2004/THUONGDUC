const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");

const http = axios.create({
  baseURL: config.vnPortal.hostName,
  timeout: 15000,
  // vnPortal tra HTTP 404 kem body {statusCode:404,message:"Khong co thong tin"}
  // khi khong co du lieu phu hop (VD site chua co tin bai nao), day la ket qua
  // hop le "rong" chu khong phai loi that su nen khong duoc de axios throw.
  validateStatus: (status) => status === 200 || status === 404,
});

/**
 * GET /api/public/categories
 */
async function getCategories() {
  const { data } = await http.get("/api/public/categories");
  return data.data || [];
}

/**
 * GET /api/public/articles
 * @param {{pageNumber?: number, pageSize?: number, languageId?: string, searchTerm?: string, articleCatID?: number}} params
 */
async function getArticles(params = {}) {
  const { data } = await http.get("/api/public/articles", {
    params: {
      pageNumber: params.pageNumber || 1,
      pageSize: params.pageSize || config.vnPortal.pageSize,
      LanguageId: params.languageId || config.vnPortal.languageId,
      searchTerm: params.searchTerm,
      articleCatID: params.articleCatID,
    },
  });
  if (data.statusCode === 404) return { items: [], paging: null };
  return { items: data.data || [], paging: data.paging };
}

/**
 * GET /api/public/articles/{languageId}/{articleId}
 */
async function getArticleDetail(articleId, languageId = config.vnPortal.languageId) {
  const { data } = await http.get(`/api/public/articles/${languageId}/${articleId}`);
  return data.data;
}

/**
 * Workaround: /api/public/articles (danh sach) luon tra 404 "Khong co thong tin"
 * du truyen bat ky tham so nao (da kiem tra: bo loc category, bo LanguageId, bo het
 * tham so...), trong khi /api/public/articles/{lang}/{id} (chi tiet 1 bai) va
 * /api/public/documents (danh sach van ban) van hoat dong binh thuong. Day la loi/thieu
 * cau hinh o phia vnPortal cho rieng module danh sach bai viet cua site nay, khong phai
 * do tham so goi sai - can bao lai vnPortal/VNPT de ho bat lai module nay.
 *
 * Trong luc cho vnPortal xu ly, dung 2 nguon quet HTML:
 *  - Widget "TIN MOI NHAT" (span id='hcltin-moi-nhat', trang /tin-tuc-su-kien): danh
 *    sach that su theo thu tu thoi gian, nguon dang tin cay nhat. DA KIEM CHUNG: widget
 *    "TIN NOI BAT" tren trang chu (span id='hcltin-noi-bat') la noi dung CHON LOC THU
 *    CONG boi bien tap vien, KHONG phai theo thoi gian - 1 bai that su moi (da xac nhan
 *    ArticleID 344375, DateCreate hom nay) co the KHONG xuat hien o do dan den bi bo sot
 *    hoan toan neu chi dua vao trang chu.
 *  - Toan bo trang chu: giu lai lam nguon du phong/rong hon (nhieu ArticleID hon,
 *    nhung co lan ca bai cu tu khoi "goi y" - da co bo loc theo DateCreate o
 *    articleSync.js xu ly rieng).
 */
const LATEST_NEWS_PATH = "/tin-tuc-su-kien";
const LATEST_NEWS_MARKER = "id='hcltin-moi-nhat'";

function extractArticleLinks(html) {
  const linkPattern = /href=['"](\/[^'"]+-(\d{5,}))['"]/g;
  const seen = new Map();
  let match;
  while ((match = linkPattern.exec(html))) {
    const [, link, idStr] = match;
    const articleId = parseInt(idStr, 10);
    if (!seen.has(articleId)) {
      seen.set(articleId, `${config.vnPortal.hostName}${link}`);
    }
  }
  return seen;
}

async function getLatestNewsLinks() {
  const { data: html } = await http.get(LATEST_NEWS_PATH);
  const markerIdx = html.indexOf(LATEST_NEWS_MARKER);
  if (markerIdx === -1) {
    logger.warn(`Khong tim thay widget "TIN MOI NHAT" (marker ${LATEST_NEWS_MARKER}) tai ${LATEST_NEWS_PATH}`);
    return new Map();
  }
  // Widget ket thuc truoc khi gap widget Hotnews tiep theo (vd "TIN NOI BAT" o cung trang)
  const nextControlIdx = html.indexOf("HotnewsControl", markerIdx + LATEST_NEWS_MARKER.length);
  const section = nextControlIdx > -1 ? html.slice(markerIdx, nextControlIdx) : html.slice(markerIdx, markerIdx + 20000);
  return extractArticleLinks(section);
}

async function getRecentArticleLinks() {
  const [latestNews, homepage] = await Promise.all([
    getLatestNewsLinks().catch((err) => {
      logger.warn(`Khong quet duoc widget "TIN MOI NHAT": ${err.message}`);
      return new Map();
    }),
    http.get("/").then((res) => extractArticleLinks(res.data)),
  ]);

  // Uu tien thu tu tu "TIN MOI NHAT" (dang tin cay hon) roi moi den phan con lai cua trang chu
  const merged = new Map(latestNews);
  homepage.forEach((link, articleId) => {
    if (!merged.has(articleId)) merged.set(articleId, link);
  });
  return [...merged.entries()].map(([articleId, link]) => ({ articleId, link }));
}

/**
 * GET /api/public/documents
 * @param {{pageNumber?: number, pageSize?: number, languageId?: string, searchTerm?: string}} params
 */
async function getDocuments(params = {}) {
  const { data } = await http.get("/api/public/documents", {
    params: {
      pageNumber: params.pageNumber || 1,
      pageSize: params.pageSize || config.vnPortal.pageSize,
      LanguageId: params.languageId || config.vnPortal.languageId,
      searchTerm: params.searchTerm,
    },
  });
  if (data.statusCode === 404) return { items: [], paging: null };
  return { items: data.data || [], paging: data.paging };
}

module.exports = { getCategories, getArticles, getArticleDetail, getDocuments, getRecentArticleLinks };
