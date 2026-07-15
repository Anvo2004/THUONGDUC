const axios = require("axios");
const config = require("../config");

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
 * Trong luc cho vnPortal xu ly, dung trang chu (server-render san, luon co danh sach
 * bai moi nhat o moi chuyen muc) de tach ArticleID moi thay vi goi API danh sach.
 */
async function getRecentArticleLinks() {
  const { data: html } = await http.get("/");
  const linkPattern = /href="(\/[^"]+-(\d{5,}))"/gi;
  const seen = new Map();
  let match;
  while ((match = linkPattern.exec(html))) {
    const [, link, idStr] = match;
    const articleId = parseInt(idStr, 10);
    if (!seen.has(articleId)) {
      seen.set(articleId, `${config.vnPortal.hostName}${link}`);
    }
  }
  return [...seen.entries()].map(([articleId, link]) => ({ articleId, link }));
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
