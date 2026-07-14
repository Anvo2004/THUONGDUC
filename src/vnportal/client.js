const axios = require("axios");
const config = require("../config");

const http = axios.create({
  baseURL: config.vnPortal.hostName,
  timeout: 15000,
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
  return { items: data.data || [], paging: data.paging };
}

module.exports = { getCategories, getArticles, getArticleDetail, getDocuments };
