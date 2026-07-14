function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function breadcrumb(items) {
  // items: [{label, href}] - phan tu cuoi khong co href (trang hien tai)
  return `<nav class="breadcrumb">${items
    .map((it, i) => {
      if (i === items.length - 1) return `<span>${escapeHtml(it.label)}</span>`;
      return `<a href="${it.href}">${escapeHtml(it.label)}</a><span class="sep">›</span>`;
    })
    .join("")}</nav>`;
}

function layout({ title, description = "", bodyHtml }) {
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
${description ? `<meta name="description" content="${escapeHtml(description)}" />` : ""}
<link rel="stylesheet" href="/assets/css/media.css" />
</head>
<body>
<header class="site-header">
  <a class="brand" href="/">Thông tin xã Thượng Đức</a>
  <nav class="main-nav">
    <a href="/infographic/">Infographic</a>
    <a href="/video/">Video hướng dẫn</a>
  </nav>
</header>
<main>
${bodyHtml}
</main>
<footer class="site-footer">
  <p>UBND xã Thượng Đức &mdash; Tài liệu tuyên truyền phòng chống thiên tai</p>
</footer>
</body>
</html>`;
}

module.exports = { layout, escapeHtml, breadcrumb };
