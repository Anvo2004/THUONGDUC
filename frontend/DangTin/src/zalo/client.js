const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");
const tokenStore = require("./tokenStore");

// Refresh token: doi chieu voi Zalo Developers > OAuth v4 (luong xac nhan qua man hinh cap quyen)
const REFRESH_TOKEN_URL = "https://oauth.zaloapp.com/v4/oa/access_token";

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
 * Dung boi luong OAuth callback sau khi doi authorization code lay duoc token moi.
 */
async function setToken(token) {
  cachedToken = token;
  await tokenStore.saveToken(token);
}

module.exports = { getValidAccessToken, setToken };
