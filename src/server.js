const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const config = require("./config");
const logger = require("./utils/logger");
const oauth = require("./zalo/oauth");

const app = express();

// Webhook can chu ky tinh tren body goc (raw string), nen luu lai raw truoc khi parse JSON
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf-8");
    },
  })
);

// Trang chu: phuc vu index.html cua web app, chen the
// <meta zalo-platform-site-verification> ma Zalo Developers yeu cau phai nam trong
// <head> trang chu (buoc "Xac thuc domain").
//
// PHAI khai bao TRUOC express.static: static se tu tra frontend/public/index.html cho "/"
// va lam mat the xac thuc. (Khong dung { index: false } de chan - nhu vay se tat index.html
// cua CA cac thu muc con, lam /infographic/ va /video/ thanh 404.)
const HOME_HTML_PATH = path.join(config.server.frontendPublicDir, "index.html");

app.get("/", (_req, res) => {
  const metaTag = config.zalo.siteVerificationMeta
    ? `<meta name="zalo-platform-site-verification" content="${config.zalo.siteVerificationMeta}" />`
    : "";

  let html;
  try {
    html = fs.readFileSync(HOME_HTML_PATH, "utf8");
  } catch (err) {
    // Chua chay build:pages -> van phai tra ve the xac thuc de Zalo khong bao loi.
    logger.warn(`Khong doc duoc ${HOME_HTML_PATH}: ${err.message}`);
    return res
      .status(200)
      .send(`<!doctype html><html lang="vi"><head><meta charset="utf-8" />${metaTag}<title>Thông tin xã Thượng Đức</title></head><body><p>Trang đang được cập nhật.</p></body></html>`);
  }

  if (metaTag) html = html.replace("</head>", `${metaTag}\n</head>`);
  res.status(200).type("html").send(html);
});

app.use(express.static(config.server.publicDir));
// Web app Infographic/Video (sinh boi `npm run build:media` / `npm run build:pages`)
app.use(express.static(config.server.frontendPublicDir));

app.get("/health", (_req, res) => res.status(200).send("OK"));

// Buoc 1: quan tri vien OA truy cap link nay de duoc dua toi trang phe duyet quyen cua Zalo
app.get("/oauth/zalo/start", (_req, res) => {
  try {
    const url = oauth.generateAuthUrl();
    res.redirect(url);
  } catch (err) {
    logger.error("Khong tao duoc link cap quyen:", err.message);
    res.status(500).send(err.message);
  }
});

// Buoc 2: Zalo redirect ve day sau khi OA admin phe duyet, kem theo ?code=&state=
app.get("/oauth/zalo/callback", async (req, res) => {
  try {
    await oauth.handleCallback({ code: req.query.code, state: req.query.state });
    res.status(200).send("Da cap quyen va luu token thanh cong. Co the dong tab nay.");
  } catch (err) {
    logger.error("Loi xu ly OAuth callback:", err.message);
    res.status(500).send(`Loi cap quyen: ${err.message}`);
  }
});

/**
 * Xac thuc chu ky webhook Zalo (X-ZEvent-Signature).
 * Cong thuc (theo tai lieu cong dong, nen doi chieu lai):
 *   mac = sha256(appId + rawBody + timestamp + OASecretKey)
 * Neu chua cau hinh ZALO_OA_SECRET_KEY thi bo qua buoc xac thuc (chi log canh bao),
 * vi muc tieu chinh la dam bao webhook luon tra 200 OK cho Zalo.
 */
function verifyWebhookSignature(req) {
  if (!config.zalo.oaSecretKey) return null; // khong the xac thuc, bo qua

  const signature = req.get("X-ZEvent-Signature");
  const timestamp = req.body && req.body.timestamp;
  if (!signature || !timestamp) return false;

  const expected = crypto
    .createHash("sha256")
    .update(`${config.zalo.appId}${req.rawBody}${timestamp}${config.zalo.oaSecretKey}`)
    .digest("hex");

  return expected === signature;
}

app.post("/webhook/zalo", (req, res) => {
  const verified = verifyWebhookSignature(req);
  if (verified === false) {
    logger.warn("Webhook Zalo: chu ky khong khop (X-ZEvent-Signature), van tra 200 OK.");
  }
  logger.info(`Webhook Zalo nhan su kien: ${req.body && req.body.event_name}`, req.body);
  res.status(200).send("OK");
});

app.listen(config.server.port, () => {
  logger.info(`Webhook/OAuth server dang chay tai port ${config.server.port}`);
});
