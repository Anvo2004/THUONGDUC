const SITE_NAME = "Kỹ năng phòng chống thiên tai";
const SITE_ORG = "UBND xã Thượng Đức";
// Dung cho URL tuyet doi (og:image) - phai la domain co that de Zalo/Facebook doc duoc anh.
const SITE_URL = "https://thuongduc.dxvtech.vn";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function breadcrumb(items) {
  // items: [{label, href}] - phan tu cuoi khong co href (trang hien tai)
  const links = items
    .map((it, i) => {
      const last = i === items.length - 1;
      if (last) return `<li aria-current="page">${escapeHtml(it.label)}</li>`;
      return `<li><a href="${it.href}">${escapeHtml(it.label)}</a></li>`;
    })
    .join("");
  return `<nav class="breadcrumb" aria-label="Đường dẫn"><ol>${links}</ol></nav>`;
}

const ICON_HOME =
  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/></svg>';
const ICON_IMAGE =
  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M3.5 16.5l4.5-4 3.5 3 3-2.5 6 5"/></svg>';
const ICON_VIDEO =
  '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="14" height="14" rx="2.5"/><path d="M16.5 10l5-3v10l-5-3z"/></svg>';

/**
 * @param {object} o
 * @param {"home"|"infographic"|"video"} [o.nav] muc dieu huong dang mo
 * @param {string} [o.ogImage] duong dan anh xem truoc (bat dau bang /), cho Zalo/Facebook
 * @param {boolean} [o.wide] noi dung rong (trang xem anh/video)
 */
function layout({ title, description = "", bodyHtml, nav = "", ogImage = "", wide = false, bodyClass = "" }) {
  const fullTitle = title.includes(SITE_ORG) ? title : `${title} — ${SITE_ORG}`;
  const desc = description || "Hình ảnh và video hướng dẫn kỹ năng phòng chống thiên tai cho người dân xã Thượng Đức.";
  const navItem = (key, href, icon, label) =>
    `<a class="nav-link${nav === key ? " is-active" : ""}" href="${href}"${
      nav === key ? ' aria-current="page"' : ""
    }>${icon}<span>${label}</span></a>`;

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(desc)}" />
<meta name="theme-color" content="#0a5cb8" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${escapeHtml(SITE_ORG)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(desc)}" />${
    ogImage ? `\n<meta property="og:image" content="${SITE_URL}${ogImage}" />` : ""
  }
<meta name="twitter:card" content="summary_large_image" />
<link rel="stylesheet" href="/assets/css/media.css" />
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#main">Bỏ qua, đến nội dung chính</a>
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="/">
      <span class="brand-mark" aria-hidden="true">
        <img src="/assets/img/logo.jpg" alt="" width="40" height="40" />
      </span>
      <span class="brand-text">
        <strong>${escapeHtml(SITE_NAME)}</strong>
        <small>${escapeHtml(SITE_ORG)}</small>
      </span>
    </a>
    <nav class="main-nav" aria-label="Điều hướng chính">
      ${navItem("home", "/", ICON_HOME, "Trang chủ")}
      ${navItem("infographic", "/infographic/", ICON_IMAGE, "Hình ảnh")}
      ${navItem("video", "/video/", ICON_VIDEO, "Video")}
    </nav>
  </div>
</header>
<main id="main" class="${wide ? "main main-wide" : "main"}">
${bodyHtml}
</main>
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-hotlines">
      <h2>Số điện thoại khẩn cấp</h2>
      <ul class="hotline-list">
        <li><a href="tel:112"><strong>112</strong><span>Cứu nạn, cứu hộ</span></a></li>
        <li><a href="tel:113"><strong>113</strong><span>Công an</span></a></li>
        <li><a href="tel:114"><strong>114</strong><span>Cứu hỏa</span></a></li>
        <li><a href="tel:115"><strong>115</strong><span>Cấp cứu y tế</span></a></li>
      </ul>
    </div>
    <p class="footer-note">
      ${escapeHtml(SITE_ORG)} — Tài liệu tuyên truyền phòng chống thiên tai.
    </p>
  </div>
</footer>
</body>
</html>`;
}

module.exports = { layout, escapeHtml, breadcrumb, SITE_NAME, SITE_ORG, SITE_URL };
