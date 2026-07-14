require("dotenv").config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Thieu bien moi truong bat buoc: ${name} (kiem tra file .env)`);
  }
  return value;
}

const config = {
  vnPortal: {
    hostName: requireEnv("VNPORTAL_HOST_NAME"),
    languageId: process.env.VNPORTAL_LANGUAGE_ID || "vi-VN",
    articleCatIds: (process.env.VNPORTAL_ARTICLE_CAT_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    pageSize: parseInt(process.env.VNPORTAL_PAGE_SIZE || "10", 10),
  },

  zalo: {
    appId: requireEnv("ZALO_APP_ID"),
    secretKey: requireEnv("ZALO_APP_SECRET"),
    // Secret key rieng cua OA (khac App Secret), dung de xac thuc chu ky webhook X-ZEvent-Signature
    oaSecretKey: process.env.ZALO_OA_SECRET_KEY || "",
    // Official Account Callback Url khai bao tren Zalo Developers, dung cho luong cap quyen OAuth PKCE
    callbackUrl: process.env.ZALO_OA_CALLBACK_URL || "",
    // Gia tri "content" cua the <meta name="zalo-platform-site-verification">,
    // lay tu trang "Xac thuc domain" tren Zalo Developers
    siteVerificationMeta: process.env.ZALO_SITE_VERIFICATION_META || "",
    // Gia tri ban dau, sau khi refresh se duoc luu vao Redis (hoac data/zalo-token.json neu khong dung Redis)
    initialAccessToken: process.env.ZALO_OA_ACCESS_TOKEN || "",
    initialRefreshToken: process.env.ZALO_OA_REFRESH_TOKEN || "",
    listBatchSize: parseInt(process.env.ZALO_LIST_BATCH_SIZE || "5", 10),
    // Anh cover mac dinh khi tin bai/van ban khong co ImagePath (Zalo Article bat buoc phai co cover)
    defaultCoverUrl: process.env.ZALO_DEFAULT_COVER_URL || "",
    // true = thuc su goi API gui tin; false = chi log ra console (dry-run)
    sendEnabled: (process.env.ZALO_SEND_ENABLED || "false").toLowerCase() === "true",
  },

  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  },

  server: {
    port: parseInt(process.env.PORT || "3000", 10),
    publicDir: process.env.PUBLIC_DIR || require("path").join(__dirname, "..", "public"),
    // Web app Infographic/Video (xem frontend/scripts/build-media-manifest.js) - sinh boi npm run build:media
    frontendPublicDir:
      process.env.FRONTEND_PUBLIC_DIR || require("path").join(__dirname, "..", "frontend", "public"),
  },

  sync: {
    articlesEnabled: (process.env.SYNC_ARTICLES_ENABLED || "true").toLowerCase() === "true",
    documentsEnabled: (process.env.SYNC_DOCUMENTS_ENABLED || "true").toLowerCase() === "true",
    // cron expression, mac dinh 10 phut/lan
    cronExpression: process.env.SYNC_CRON_EXPRESSION || "*/10 * * * *",
    // so tin moi toi da xu ly trong 1 lan poll (tranh spam khi lan dau chay / mat ket noi lau)
    maxNewItemsPerRun: parseInt(process.env.SYNC_MAX_NEW_ITEMS_PER_RUN || "20", 10),
  },

  paths: {
    stateFile: process.env.STATE_FILE_PATH || require("path").join(__dirname, "..", "data", "state.json"),
    zaloTokenFile: process.env.ZALO_TOKEN_FILE_PATH || require("path").join(__dirname, "..", "data", "zalo-token.json"),
  },
};

module.exports = config;
