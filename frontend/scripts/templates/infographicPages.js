const { layout, escapeHtml, breadcrumb } = require("./layout");
const { categoryIcon, categoryStyle } = require("../lib/categoryMeta");

// Nhan cho nguoi dan, kem goi y dung o dau - thay cho "Dọc / Ngang / Vuông" kho hieu.
const FORMAT_LABELS = {
  portrait: { label: "Ảnh dọc", hint: "Hợp để xem trên điện thoại" },
  landscape: { label: "Ảnh ngang", hint: "Hợp để chiếu, in khổ ngang" },
  square: { label: "Ảnh vuông", hint: "Hợp để đăng Zalo, Facebook" },
};

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function thumbPath(catSlug, item) {
  return item.thumbnail ? `/media/infographic/${catSlug}/${item.slug}/${item.thumbnail}` : "";
}

function renderInfographicIndex(infographic) {
  const total = infographic.categories.reduce((n, c) => n + c.items.length, 0);

  const cards = infographic.categories
    .map((cat) => {
      const cover = cat.items[0];
      const src = cover ? thumbPath(cat.slug, cover) : "";
      return `<a class="cat-card" style="${categoryStyle(cat.slug)}" href="/infographic/${cat.slug}/">
  <span class="cat-card-media">
    ${src ? `<img src="${src}" alt="" loading="lazy" decoding="async" width="320" height="240" />` : ""}
    <span class="cat-card-badge" aria-hidden="true">${categoryIcon(cat.slug)}</span>
  </span>
  <span class="cat-card-body">
    <strong class="cat-card-title">${escapeHtml(cat.title)}</strong>
    <span class="cat-card-count">${cat.items.length} bài hướng dẫn</span>
  </span>
</a>`;
    })
    .join("\n");

  const body = `
${breadcrumb([{ label: "Trang chủ", href: "/" }, { label: "Hình ảnh hướng dẫn" }])}
<header class="page-head">
  <h1>Hình ảnh hướng dẫn</h1>
  <p class="page-lead">${total} bài hướng dẫn bằng hình, chia theo ${infographic.categories.length} loại thiên tai. Chọn chuyên đề bạn quan tâm.</p>
</header>
<div class="grid grid-cats">
${cards}
</div>`;

  return layout({
    title: "Hình ảnh hướng dẫn kỹ năng phòng chống thiên tai",
    description: `${total} bài hướng dẫn bằng hình về bão, lũ, lũ quét, sạt lở đất và các loại thiên tai khác.`,
    bodyHtml: body,
    nav: "infographic",
  });
}

function renderInfographicCategory(cat) {
  const cards = cat.items
    .map(
      (item) => `<a class="item-card" href="/infographic/${cat.slug}/${item.slug}/">
  <span class="item-card-media">
    <img src="${thumbPath(cat.slug, item)}" alt="" loading="lazy" decoding="async" width="320" height="427" />
  </span>
  <span class="item-card-body">
    <strong class="item-card-title">${escapeHtml(item.title)}</strong>
  </span>
</a>`
    )
    .join("\n");

  const cover = cat.items[0];
  const body = `
${breadcrumb([
    { label: "Trang chủ", href: "/" },
    { label: "Hình ảnh hướng dẫn", href: "/infographic/" },
    { label: cat.title },
  ])}
<header class="page-head page-head-cat" style="${categoryStyle(cat.slug)}">
  <span class="page-head-icon" aria-hidden="true">${categoryIcon(cat.slug)}</span>
  <div>
    <h1>${escapeHtml(cat.title)}</h1>
    <p class="page-lead">${cat.items.length} bài hướng dẫn</p>
  </div>
</header>
<div class="grid grid-items">
${cards}
</div>`;

  return layout({
    title: `${cat.title} — Hình ảnh hướng dẫn`,
    description: `${cat.items.length} bài hướng dẫn kỹ năng an toàn khi có ${cat.title.toLowerCase()}.`,
    bodyHtml: body,
    nav: "infographic",
    ogImage: cover ? thumbPath(cat.slug, cover) : "",
  });
}

function renderInfographicDetail(cat, item, prevItem, nextItem) {
  const formats = [];
  if (item.formats.portrait) formats.push({ key: "portrait", ...item.formats.portrait });
  if (item.formats.landscape) formats.push({ key: "landscape", ...item.formats.landscape });
  if (item.formats.square && item.formats.square.length) {
    const many = item.formats.square.length > 1;
    item.formats.square.forEach((sq, i) => formats.push({ key: "square", ...sq, variant: many ? i + 1 : 0 }));
  }

  const basePath = `/media/infographic/${cat.slug}/${item.slug}`;
  const tabs = formats
    .map((f, i) => {
      const { label, hint } = FORMAT_LABELS[f.key];
      const full = f.variant ? `${label} ${f.variant}` : label;
      return `<button type="button" class="format-tab${i === 0 ? " is-active" : ""}"
  data-src="${basePath}/${f.file}" data-bytes="${formatBytes(f.bytes)}" title="${escapeHtml(hint)}"
  aria-pressed="${i === 0 ? "true" : "false"}">${escapeHtml(full)}</button>`;
    })
    .join("\n");

  const first = formats[0];
  const firstSrc = first ? `${basePath}/${first.file}` : "";

  const nav = `<nav class="prev-next" aria-label="Bài trước, bài sau">
  ${
    prevItem
      ? `<a class="prev-next-link" href="/infographic/${cat.slug}/${prevItem.slug}/" rel="prev">
    <span class="prev-next-dir">← Bài trước</span>
    <span class="prev-next-title">${escapeHtml(prevItem.title)}</span>
  </a>`
      : "<span></span>"
  }
  ${
    nextItem
      ? `<a class="prev-next-link prev-next-next" href="/infographic/${cat.slug}/${nextItem.slug}/" rel="next">
    <span class="prev-next-dir">Bài sau →</span>
    <span class="prev-next-title">${escapeHtml(nextItem.title)}</span>
  </a>`
      : "<span></span>"
  }
</nav>`;

  const body = `
${breadcrumb([
    { label: "Trang chủ", href: "/" },
    { label: "Hình ảnh hướng dẫn", href: "/infographic/" },
    { label: cat.title, href: `/infographic/${cat.slug}/` },
    { label: item.title },
  ])}
<header class="page-head page-head-detail" style="${categoryStyle(cat.slug)}">
  <p class="page-kicker"><span class="page-kicker-icon" aria-hidden="true">${categoryIcon(cat.slug)}</span>${escapeHtml(cat.title)}</p>
  <h1>${escapeHtml(item.title)}</h1>
</header>

${formats.length > 1 ? `<div class="format-tabs" role="group" aria-label="Chọn khổ ảnh">\n${tabs}\n</div>` : ""}

<figure class="viewer">
  <button type="button" class="viewer-zoom" id="viewer-zoom" aria-label="Phóng to ảnh">
    <img id="viewer-image" src="${firstSrc}" alt="${escapeHtml(item.title)}" decoding="async" />
    <span class="viewer-zoom-hint" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6"/></svg>
      Bấm để phóng to
    </span>
  </button>
</figure>

<div class="actions">
  <a class="btn btn-primary" id="download-link" href="${firstSrc}" download>
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M4 17.5v1.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-1.5"/></svg>
    Tải ảnh về máy <span class="btn-sub" id="download-size">${first ? formatBytes(first.bytes) : ""}</span>
  </a>
  <button type="button" class="btn btn-ghost" id="share-btn">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/></svg>
    Chia sẻ
  </button>
</div>

${nav}
<script src="/assets/js/viewer.js" defer></script>`;

  return layout({
    title: `${item.title} — ${cat.title}`,
    description: `Hướng dẫn bằng hình: ${item.title}. Xem, tải về và chia sẻ cho người thân.`,
    bodyHtml: body,
    nav: "infographic",
    ogImage: firstSrc,
    wide: true,
  });
}

module.exports = { renderInfographicIndex, renderInfographicCategory, renderInfographicDetail };
