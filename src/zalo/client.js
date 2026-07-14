const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");
const tokenStore = require("./tokenStore");

/**
 * !!! QUAN TRONG - VUI LONG DOC TRUOC KHI BAT ZALO_SEND_ENABLED=true !!!
 *
 * Endpoint va cau truc payload ben duoi duoc viet dua tren hieu biet chung ve
 * Zalo Official Account OpenAPI (v3.0 Message API + v4 OAuth refresh token),
 * KHONG duoc doi chieu truc tiep voi tai lieu developers.zalo.me tai thoi diem
 * viet code nay (trang tai lieu render bang JS nen khong the tu dong doc noi
 * dung day du). Truoc khi chay that:
 *   1. Doi chieu lai endpoint REFRESH_TOKEN_URL va BROADCAST_URL voi
 *      https://developers.zalo.me (muc "Official Account API")
 *   2. Doi chieu cau truc payload trong buildListElement() va broadcastListMessage()
 *   3. Test voi ZALO_SEND_ENABLED=false (mac dinh) truoc, xem log de kiem tra
 *      noi dung se gui, roi moi bat that
 */
const REFRESH_TOKEN_URL = "https://oauth.zaloapp.com/v4/oa/access_token";
const BROADCAST_URL =
  process.env.ZALO_BROADCAST_ENDPOINT || "https://openapi.zalo.me/v3.0/oa/message/broadcast";

let cachedToken = null; // { accessToken, refreshToken, expiresAt }

async function bootstrapToken() {
  const stored = await tokenStore.loadToken();
  if (stored) return stored;

  if (!config.zalo.initialAccessToken || !config.zalo.initialRefreshToken) {
    throw new Error(
      "Chua co ZALO_OA_ACCESS_TOKEN / ZALO_OA_REFRESH_TOKEN trong .env va cung chua co token da luu"
    );
  }
  return {
    accessToken: config.zalo.initialAccessToken,
    refreshToken: config.zalo.initialRefreshToken,
    // chua biet han, ep refresh ngay lan goi dau tien de lay expiresAt chinh xac
    expiresAt: 0,
  };
}

async function refreshAccessToken(refreshToken) {
  logger.info("Dang refresh Zalo OA access token...");
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    app_id: config.zalo.appId,
    grant_type: "refresh_token",
  });

  const { data } = await axios.post(REFRESH_TOKEN_URL, body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: config.zalo.secretKey,
    },
    timeout: 15000,
  });

  if (!data.access_token) {
    throw new Error(`Refresh Zalo token that bai: ${JSON.stringify(data)}`);
  }

  const expiresInSec = parseInt(data.expires_in, 10) || 3600;
  const token = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    // tru bot 5 phut lam buffer an toan
    expiresAt: Date.now() + (expiresInSec - 300) * 1000,
  };
  await tokenStore.saveToken(token);
  return token;
}

async function getValidAccessToken() {
  if (!cachedToken) {
    cachedToken = await bootstrapToken();
  }
  if (!cachedToken.expiresAt || Date.now() >= cachedToken.expiresAt) {
    cachedToken = await refreshAccessToken(cachedToken.refreshToken);
  }
  return cachedToken.accessToken;
}

/**
 * Chuyen 1 tin bai / van ban thanh 1 "element" trong List Template cua Zalo.
 * Cau truc list template (title/subtitle/image_url/default_action) la mau
 * pho bien va on dinh trong Zalo OA OpenAPI, nhung van nen doi chieu lai.
 */
function buildListElement({ title, subtitle, imageUrl, url }) {
  return {
    title,
    subtitle,
    image_url: imageUrl || undefined,
    default_action: {
      type: "oa.open.url",
      url,
    },
  };
}

/**
 * Gui broadcast toi toan bo nguoi quan tam OA.
 * @param {Array<{title: string, subtitle: string, imageUrl?: string, url: string}>} items toi da 5 phan tu
 */
async function broadcastListMessage(items) {
  if (!items.length) return;
  if (items.length > config.zalo.listBatchSize) {
    throw new Error(`List template chi ho tro toi da ${config.zalo.listBatchSize} phan tu moi lan gui`);
  }

  const payload = {
    recipient: {
      target: {
        broadcast_type: 0, // 0 = gui toi tat ca nguoi quan tam OA
        conditions: [],
      },
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "list",
          elements: items.map(buildListElement),
        },
      },
    },
  };

  if (!config.zalo.sendEnabled) {
    logger.info(
      "[DRY-RUN] ZALO_SEND_ENABLED=false, se KHONG goi API that. Payload du dinh gui:",
      JSON.stringify(payload, null, 2)
    );
    return { dryRun: true };
  }

  const accessToken = await getValidAccessToken();
  const { data } = await axios.post(BROADCAST_URL, payload, {
    headers: {
      "Content-Type": "application/json",
      access_token: accessToken,
    },
    timeout: 15000,
  });

  if (data.error && data.error !== 0) {
    throw new Error(`Zalo broadcast API loi: ${JSON.stringify(data)}`);
  }

  logger.info(`Da gui broadcast Zalo thanh cong (${items.length} muc).`);
  return data;
}

/**
 * Dung boi luong OAuth callback sau khi doi authorization code lay duoc token moi.
 */
async function setToken(token) {
  cachedToken = token;
  await tokenStore.saveToken(token);
}

module.exports = { broadcastListMessage, getValidAccessToken, setToken };
