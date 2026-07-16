const { layout, escapeHtml, breadcrumb } = require("./layout");
const { categoryIcon, categoryStyle, VIDEO_TO_INFOGRAPHIC } = require("../lib/categoryMeta");

function formatBytes(bytes) {
  if (!bytes) return "";
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/** Chuyen de video khong co anh bia rieng -> muon anh bia cua chuyen de infographic tuong ung. */
function coverForVideoCat(catSlug, infographic) {
  if (!infographic) return "";
  const infoSlug = VIDEO_TO_INFOGRAPHIC[catSlug] || catSlug;
  const infoCat = infographic.categories.find((c) => c.slug === infoSlug);
  const cover = infoCat && infoCat.items[0];
  return cover && cover.thumbnail ? `/media/infographic/${infoSlug}/${cover.slug}/${cover.thumbnail}` : "";
}

const PLAY_BADGE = `<span class="play-badge" aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 6.5l9 5.5-9 5.5z"/></svg>
</span>`;

function signBadge(item) {
  return item.hasSignLanguage
    ? `<span class="badge badge-sign" title="Có phiên dịch thủ ngữ cho người khiếm thính">
  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 12.5V4.8a1.4 1.4 0 0 1 2.8 0v5.4"/><path d="M12.3 10.2V3.6a1.4 1.4 0 0 1 2.8 0v6.6"/><path d="M15.1 10.5V5.5a1.4 1.4 0 0 1 2.8 0v8.2c0 3.7-2.4 6.8-6 6.8-3.2 0-4.6-1.6-6.3-4.4l-1.8-3a1.4 1.4 0 0 1 2.3-1.6l1.7 2.3"/></svg>
  Có thủ ngữ
</span>`
    : "";
}

function renderVideoIndex(video, infographic) {
  const total = video.categories.reduce((n, c) => n + c.items.length, 0);

  const cards = video.categories
    .map((cat) => {
      const src = coverForVideoCat(cat.slug, infographic);
      return `<a class="cat-card cat-card-video" style="${categoryStyle(cat.slug)}" href="/video/${cat.slug}/">
  <span class="cat-card-media">
    ${src ? `<img src="${src}" alt="" loading="lazy" decoding="async" width="320" height="240" />` : ""}
    ${PLAY_BADGE}
    <span class="cat-card-badge" aria-hidden="true">${categoryIcon(cat.slug)}</span>
  </span>
  <span class="cat-card-body">
    <strong class="cat-card-title">${escapeHtml(cat.title)}</strong>
    <span class="cat-card-count">${cat.items.length} video</span>
  </span>
</a>`;
    })
    .join("\n");

  const body = `
${breadcrumb([{ label: "Trang chủ", href: "/" }, { label: "Video hướng dẫn" }])}
<header class="page-head">
  <h1>Video hướng dẫn</h1>
  <p class="page-lead">${total} phim hoạt hình ngắn hướng dẫn ứng phó bão, lũ, lũ quét, sạt lở đất và sét. Phần lớn có bản thủ ngữ dành cho người khiếm thính.</p>
</header>
<div class="grid grid-cats">
${cards}
</div>`;

  return layout({
    title: "Video hướng dẫn kỹ năng phòng chống thiên tai",
    description: `${total} video hướng dẫn ứng phó bão, lũ, lũ quét, sạt lở đất. Nhiều video có bản thủ ngữ.`,
    bodyHtml: body,
    nav: "video",
    ogImage: coverForVideoCat(video.categories[0] && video.categories[0].slug, infographic),
  });
}

function renderVideoCategory(cat, infographic) {
  const cards = cat.items
    .map(
      (item) => `<a class="video-card" style="${categoryStyle(cat.slug)}" href="/video/${cat.slug}/${item.slug}/">
  <span class="video-card-thumb" aria-hidden="true">
    ${categoryIcon(cat.slug)}
    ${PLAY_BADGE}
  </span>
  <span class="video-card-body">
    <strong class="video-card-title">${escapeHtml(item.title)}</strong>
    <span class="video-card-meta">
      ${signBadge(item)}
      <span class="muted">${formatBytes(item.bytes)}</span>
    </span>
  </span>
</a>`
    )
    .join("\n");

  const body = `
${breadcrumb([
    { label: "Trang chủ", href: "/" },
    { label: "Video hướng dẫn", href: "/video/" },
    { label: cat.title },
  ])}
<header class="page-head page-head-cat" style="${categoryStyle(cat.slug)}">
  <span class="page-head-icon" aria-hidden="true">${categoryIcon(cat.slug)}</span>
  <div>
    <h1>${escapeHtml(cat.title)}</h1>
    <p class="page-lead">${cat.items.length} video hướng dẫn</p>
  </div>
</header>
<div class="grid grid-videos">
${cards}
</div>`;

  return layout({
    title: `${cat.title} — Video hướng dẫn`,
    description: `${cat.items.length} video hướng dẫn kỹ năng an toàn khi có ${cat.title.toLowerCase()}.`,
    bodyHtml: body,
    nav: "video",
    ogImage: coverForVideoCat(cat.slug, infographic),
  });
}

function renderVideoDetail(cat, item, prevItem, nextItem, infographic) {
  const src = `/media/video/${cat.slug}/${item.file}`;
  const poster = coverForVideoCat(cat.slug, infographic);

  const nav = `<nav class="prev-next" aria-label="Video trước, video sau">
  ${
    prevItem
      ? `<a class="prev-next-link" href="/video/${cat.slug}/${prevItem.slug}/" rel="prev">
    <span class="prev-next-dir">← Video trước</span>
    <span class="prev-next-title">${escapeHtml(prevItem.title)}</span>
  </a>`
      : "<span></span>"
  }
  ${
    nextItem
      ? `<a class="prev-next-link prev-next-next" href="/video/${cat.slug}/${nextItem.slug}/" rel="next">
    <span class="prev-next-dir">Video sau →</span>
    <span class="prev-next-title">${escapeHtml(nextItem.title)}</span>
  </a>`
      : "<span></span>"
  }
</nav>`;

  const body = `
${breadcrumb([
    { label: "Trang chủ", href: "/" },
    { label: "Video hướng dẫn", href: "/video/" },
    { label: cat.title, href: `/video/${cat.slug}/` },
    { label: item.title },
  ])}
<header class="page-head page-head-detail" style="${categoryStyle(cat.slug)}">
  <p class="page-kicker"><span class="page-kicker-icon" aria-hidden="true">${categoryIcon(cat.slug)}</span>${escapeHtml(cat.title)}</p>
  <h1>${escapeHtml(item.title)}</h1>
  <p class="page-meta">${signBadge(item)}<span class="muted">Dung lượng ${formatBytes(item.bytes)}</span></p>
</header>

<div class="viewer viewer-video">
  <video controls preload="none" playsinline ${poster ? `poster="${poster}"` : ""} src="${src}"></video>
</div>
<p class="data-warning">
  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8.5v5"/><circle cx="12" cy="16.8" r=".9" fill="currentColor" stroke="none"/><path d="M10.3 3.9L2.5 17.4A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3.1L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
  Video nặng ${formatBytes(item.bytes)} — nên xem bằng Wi-Fi để tiết kiệm dung lượng 3G/4G.
</p>

<div class="actions">
  <a class="btn btn-primary" href="${src}" download>
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M4 17.5v1.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-1.5"/></svg>
    Tải video về máy <span class="btn-sub">${formatBytes(item.bytes)}</span>
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
    description: `Video hướng dẫn: ${item.title}. Xem, tải về và chia sẻ cho người thân.`,
    bodyHtml: body,
    nav: "video",
    ogImage: poster,
    wide: true,
  });
}

module.exports = { renderVideoIndex, renderVideoCategory, renderVideoDetail };
