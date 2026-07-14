const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");
const zaloClient = require("./client");
const { truncate } = require("../utils/text");

/**
 * Da doi chieu truc tiep voi tai lieu developers.zalo.me (nguoi dung gui screenshot that):
 *   - Tao bai viet:  POST https://openapi.zalo.me/v2.0/article/create
 *   - Kiem tra/verify (lay id that): POST https://openapi.zalo.me/v2.0/article/verify
 * Con thieu: API "Broadcast bai viet" (gui bai da tao toi nguoi theo doi OA) -
 * CHUA duoc xac nhan, xem BROADCAST_URL/broadcastArticle() ben duoi.
 */
const CREATE_URL = "https://openapi.zalo.me/v2.0/article/create";
const VERIFY_URL = "https://openapi.zalo.me/v2.0/article/verify";
// TODO: chua co tai lieu xac nhan endpoint that. Dat tam theo cai da tim thay qua
// tim kiem cong khai (developers.zalo.me/docs/.../broadcast-bai-viet), CAN doi chieu
// lai truoc khi dua vao dung that - xem broadcastArticle() ben duoi.
const BROADCAST_URL =
  process.env.ZALO_BROADCAST_ARTICLE_ENDPOINT || "https://openapi.zalo.me/v2.0/article/broadcast";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Tao 1 bai viet (Nội dung dạng Bài viết) tren OA. Tra ve "token" (chua phai id that),
 * phai goi verifyArticle(token) de lay id sau khi Zalo xu ly xong (bat dong bo).
 */
async function createArticle({ title, author, description, coverPhotoUrl, bodyText }) {
  if (!coverPhotoUrl) {
    throw new Error("Bai viet can anh cover (coverPhotoUrl) - vnPortal khong co ImagePath cho muc nay");
  }

  const payload = {
    type: "normal",
    title: truncate(title, 150),
    author: truncate(author || "UBND xã Thượng Đức", 50),
    cover: {
      cover_type: "photo",
      photo_url: coverPhotoUrl,
      status: "show",
    },
    description: truncate(description || title, 300),
    body: [
      {
        type: "text",
        content: bodyText || description || title,
      },
    ],
    status: "show",
    comment: "show",
  };

  const accessToken = await zaloClient.getValidAccessToken();
  const { data } = await axios.post(CREATE_URL, payload, {
    headers: { "Content-Type": "application/json", access_token: accessToken },
    timeout: 15000,
  });

  if (data.error !== 0 || !data.data || !data.data.token) {
    throw new Error(`Tao bai viet Zalo that bai: ${JSON.stringify(data)}`);
  }
  return data.data.token;
}

/**
 * Kiem tra tien trinh tao bai viet, tra ve id that cua bai viet khi da xong.
 * Zalo xu ly bat dong bo nen thu lai vai lan neu chua co ket qua.
 */
async function verifyArticle(token, { retries = 5, delayMs = 2000 } = {}) {
  const accessToken = await zaloClient.getValidAccessToken();

  for (let attempt = 1; attempt <= retries; attempt++) {
    const { data } = await axios.post(
      VERIFY_URL,
      { token },
      { headers: { "Content-Type": "application/json", access_token: accessToken }, timeout: 15000 }
    );

    if (data.error === 0 && data.data && data.data.id) {
      return data.data.id;
    }
    if (attempt < retries) await sleep(delayMs);
  }
  throw new Error("Khong lay duoc id bai viet sau nhieu lan verify (co the Zalo xu ly cham hon binh thuong)");
}

/**
 * !!! CHUA XAC NHAN VOI TAI LIEU CHINH THUC !!!
 * Gui (broadcast) bai viet da tao toi nguoi theo doi OA. Toi da 5 bai/lan theo
 * tai lieu cong dong. Se throw loi ro rang cho toi khi co xac nhan chinh thuc,
 * tranh goi nham 1 API doan mo hinh.
 */
async function broadcastArticle(articleIds) {
  throw new Error(
    "broadcastArticle() chua duoc xac nhan voi tai lieu Zalo chinh thuc (thieu trang 'Broadcast bai viet'). " +
      `Bai viet da tao thanh cong (id: ${articleIds.join(", ")}) nhung CHUA duoc gui toi nguoi theo doi. ` +
      "Cap nhat ham nay trong src/zalo/articleClient.js sau khi co tai lieu xac nhan."
  );
}

/**
 * Tao + verify + broadcast 1 nhom toi da 5 bai (tin bai/van ban) len Zalo OA.
 * Ton trong ZALO_SEND_ENABLED: false -> chi log du dinh gui, khong tao gi that ca
 * (tao bai voi status "show" la hanh dong THAT, hien ngay tren OA, nen phai dry-run duoc).
 */
async function publishArticles(items) {
  if (!items.length) return;
  if (items.length > config.zalo.listBatchSize) {
    throw new Error(`Toi da ${config.zalo.listBatchSize} bai viet moi lan gui`);
  }

  if (!config.zalo.sendEnabled) {
    logger.info(
      "[DRY-RUN] ZALO_SEND_ENABLED=false, se KHONG tao/gui bai viet that. Du dinh tao:",
      JSON.stringify(items, null, 2)
    );
    return { dryRun: true };
  }

  const articleIds = [];
  for (const item of items) {
    const token = await createArticle(item);
    const id = await verifyArticle(token);
    logger.info(`Da tao bai viet Zalo thanh cong, id: ${id} (${item.title})`);
    articleIds.push(id);
  }

  await broadcastArticle(articleIds);
  return { articleIds };
}

module.exports = { createArticle, verifyArticle, broadcastArticle, publishArticles };
