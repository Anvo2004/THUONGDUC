const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");
const zaloClient = require("./client");
const { truncate } = require("../utils/text");

/**
 * Da doi chieu truc tiep voi tai lieu developers.zalo.me:
 *   - Tao bai viet:  POST https://openapi.zalo.me/v2.0/article/create
 *   - Kiem tra/verify (lay id that): POST https://openapi.zalo.me/v2.0/article/verify
 *   - Broadcast bai viet: POST https://openapi.zalo.me/v2.0/oa/message
 *     (template_type "media", moi lan toi da 5 bai viet). Luu y: noi dung broadcast
 *     can Zalo kiem duyet (~30 phut) truoc khi thuc su gui den nguoi dung.
 */
const CREATE_URL = "https://openapi.zalo.me/v2.0/article/create";
const VERIFY_URL = "https://openapi.zalo.me/v2.0/article/verify";
const BROADCAST_URL = "https://openapi.zalo.me/v2.0/oa/message";

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

  // Zalo cong bo gioi han title 150 / description 300 ky tu nhung tren thuc te TU CHOI
  // chuoi dung bang gioi han cong bo (da xac nhan qua log loi that: "title allow 1 to
  // 150 characters" / "description allow 1 to 300 characters" khi truyen dung 150/300).
  // Lui margin an toan xuong 140/250.
  const payload = {
    type: "normal",
    title: truncate(title, 140),
    author: truncate(author || "UBND xã Thượng Đức", 50),
    cover: {
      cover_type: "photo",
      photo_url: coverPhotoUrl,
      status: "show",
    },
    description: truncate(description || title, 250),
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
 * Gui (broadcast) toi da 5 bai viet da tao toi toan bo nguoi quan tam OA
 * (recipient.target rong = khong loc, gui cho tat ca).
 */
async function broadcastArticle(articleIds) {
  if (articleIds.length > 5) {
    throw new Error("Broadcast chi ho tro toi da 5 bai viet moi lan gui");
  }

  const payload = {
    recipient: { target: {} },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "media",
          elements: articleIds.map((id) => ({ media_type: "article", attachment_id: id })),
        },
      },
    },
  };

  const accessToken = await zaloClient.getValidAccessToken();
  const { data } = await axios.post(BROADCAST_URL, payload, {
    headers: { "Content-Type": "application/json", access_token: accessToken },
    timeout: 15000,
  });

  if (data.error !== 0 || !data.data || !data.data.message_id) {
    throw new Error(`Broadcast bai viet Zalo that bai: ${JSON.stringify(data)}`);
  }

  logger.info(
    `Da gui broadcast Zalo thanh cong, message_id: ${data.data.message_id} ` +
      "(luu y: Zalo can ~30 phut kiem duyet truoc khi thuc su gui den nguoi dung)."
  );
  return data.data.message_id;
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

/**
 * Tao + verify 1 nhom bai (khong broadcast) - dung cho dong bo tu dong: chi dua bai
 * len muc "Noi dung" cua OA (o trang thai "An" toi khi co nguoi chu dong xem/broadcast
 * thu cong), KHONG tu dong gui toi nguoi theo doi.
 *
 * Moi item duoc try/catch RIENG: neu 1 bai loi (vd verify het retry), cac bai con lai
 * trong cung lo van duoc tra ve id thanh cong binh thuong - khong duoc de 1 bai loi lam
 * mat ket qua cua ca lo (truoc day throw ngay khi gap loi dau tien khien caller khong kip
 * luu "da gui" cho nhung bai da tao thanh cong truoc do, dan den lan chay sau tao trung).
 */
async function createArticles(items) {
  if (!items.length) return { results: [] };

  if (!config.zalo.sendEnabled) {
    logger.info(
      "[DRY-RUN] ZALO_SEND_ENABLED=false, se KHONG tao bai viet that. Du dinh tao:",
      JSON.stringify(items, null, 2)
    );
    return { dryRun: true };
  }

  const results = [];
  for (const item of items) {
    try {
      const token = await createArticle(item);
      // Bai day du noi dung + anh can nhieu thoi gian xu ly hon ("Media is being
      // processed"), tang retries/delay de tranh bao loi gia khi Zalo chua kip xong.
      const id = await verifyArticle(token, { retries: 8, delayMs: 3000 });
      logger.info(`Da tao bai viet Zalo thanh cong (chua broadcast), id: ${id} (${item.title})`);
      results.push({ item, id });
    } catch (err) {
      logger.error(`Loi tao bai viet "${item.title}", se thu lai o lan dong bo sau:`, err.message);
      results.push({ item, error: err.message });
    }
  }
  return { results };
}

module.exports = { createArticle, verifyArticle, broadcastArticle, publishArticles, createArticles };
