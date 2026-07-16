const crypto = require("crypto");
const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");
const zaloClient = require("./client");

/**
 * Luong cap quyen OAuth v4 (PKCE) cua Zalo OA. Da doi chieu qua tim kiem cong khai
 * (khong fetch truc tiep duoc trang JS-rendered cua developers.zalo.me):
 *   - code_challenge = base64url(sha256(code_verifier))
 *   - Link cap quyen: https://oauth.zaloapp.com/v4/oa/permission?app_id=...&redirect_uri=...&code_challenge=...&state=...
 *   - Doi code lay token: POST https://oauth.zaloapp.com/v4/oa/access_token
 *     voi grant_type=authorization_code, code, app_id, code_verifier, header secret_key
 * Van nen doi chieu lai voi developers.zalo.me truoc khi dua vao dung that.
 */

const PERMISSION_URL = "https://oauth.zaloapp.com/v4/oa/permission";
const TOKEN_URL = "https://oauth.zaloapp.com/v4/oa/access_token";

// Luu tam code_verifier theo state trong bo nho tien trinh (du dung vi callback
// thuong den ngay sau khi tao link, trong cung 1 tien trinh server dang chay)
const pendingVerifiers = new Map();

function base64url(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateAuthUrl() {
  if (!config.zalo.callbackUrl) {
    throw new Error("Chua cau hinh ZALO_OA_CALLBACK_URL trong .env");
  }

  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash("sha256").update(codeVerifier).digest());
  const state = base64url(crypto.randomBytes(16));

  pendingVerifiers.set(state, codeVerifier);

  const url = new URL(PERMISSION_URL);
  url.searchParams.set("app_id", config.zalo.appId);
  url.searchParams.set("redirect_uri", config.zalo.callbackUrl);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("state", state);

  return url.toString();
}

async function handleCallback({ code, state }) {
  if (!code) throw new Error("Thieu tham so 'code' tu Zalo redirect");

  const codeVerifier = state ? pendingVerifiers.get(state) : undefined;
  if (state && !codeVerifier) {
    logger.warn("Khong tim thay code_verifier cho state nay (co the server da restart sau khi tao link).");
  }

  const body = new URLSearchParams({
    code,
    app_id: config.zalo.appId,
    grant_type: "authorization_code",
    ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
  });

  const { data } = await axios.post(TOKEN_URL, body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: config.zalo.secretKey,
    },
    timeout: 15000,
  });

  if (!data.access_token) {
    throw new Error(`Doi authorization code that bai: ${JSON.stringify(data)}`);
  }

  const expiresInSec = parseInt(data.expires_in, 10) || 3600;
  const token = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (expiresInSec - 300) * 1000,
  };
  await zaloClient.setToken(token);
  if (state) pendingVerifiers.delete(state);

  logger.info("Da cap nhat access token/refresh token moi tu luong cap quyen OAuth.");
  return token;
}

module.exports = { generateAuthUrl, handleCallback };
