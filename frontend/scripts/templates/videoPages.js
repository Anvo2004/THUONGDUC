const { layout, escapeHtml, breadcrumb } = require("./layout");

function formatBytes(bytes) {
  if (!bytes) return "";
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function signBadge(item) {
  return item.hasSignLanguage ? `<span class="badge">Có thủ ngữ</span>` : "";
}

function renderVideoIndex(video) {
  const cards = video.categories
    .map(
      (cat) => `<a class="card card-video" href="/video/${cat.slug}/">
  <div class="card-body">
    <h3>${escapeHtml(cat.title)}</h3>
    <p class="muted">${cat.items.length} video</p>
  </div>
</a>`
    )
    .join("\n");

  const body = `
${breadcrumb([{ label: "Trang chủ", href: "/" }, { label: "Video hướng dẫn" }])}
<h1>Video hướng dẫn kỹ năng phòng chống thiên tai</h1>
<p class="muted">Phim hoạt hình hướng dẫn ứng phó bão, lũ, lũ quét, sạt lở đất. Một số video có bản thủ ngữ cho người khiếm thính.</p>
<div class="grid">
${cards}
</div>`;

  return layout({ title: "Video hướng dẫn PCTT - Xã Thượng Đức", bodyHtml: body });
}

function renderVideoCategory(cat) {
  const cards = cat.items
    .map(
      (item) => `<a class="card card-video" href="/video/${cat.slug}/${item.slug}/">
  <div class="card-body">
    <h3>${escapeHtml(item.title)} ${signBadge(item)}</h3>
    <p class="muted">${formatBytes(item.bytes)}</p>
  </div>
</a>`
    )
    .join("\n");

  const body = `
${breadcrumb([
    { label: "Trang chủ", href: "/" },
    { label: "Video hướng dẫn", href: "/video/" },
    { label: cat.title },
  ])}
<h1>${escapeHtml(cat.title)}</h1>
<div class="grid">
${cards}
</div>`;

  return layout({ title: `${cat.title} - Video hướng dẫn PCTT`, bodyHtml: body });
}

function renderVideoDetail(cat, item, prevItem, nextItem) {
  const src = `/media/video/${cat.slug}/${item.file}`;

  const prevNext = `<div class="prev-next">
  ${prevItem ? `<a href="/video/${cat.slug}/${prevItem.slug}/">&larr; ${escapeHtml(prevItem.title)}</a>` : "<span></span>"}
  ${nextItem ? `<a href="/video/${cat.slug}/${nextItem.slug}/">${escapeHtml(nextItem.title)} &rarr;</a>` : "<span></span>"}
</div>`;

  const body = `
${breadcrumb([
    { label: "Trang chủ", href: "/" },
    { label: "Video hướng dẫn", href: "/video/" },
    { label: cat.title, href: `/video/${cat.slug}/` },
    { label: item.title },
  ])}
<h1>${escapeHtml(item.title)} ${signBadge(item)}</h1>
<p class="muted">Dung lượng: ${formatBytes(item.bytes)}</p>
<div class="video-viewer">
  <video controls preload="metadata" playsinline src="${src}"></video>
</div>
<p><a class="download-link" href="${src}" download>Tải video về máy</a></p>
${prevNext}`;

  return layout({ title: `${item.title} - ${cat.title}`, bodyHtml: body });
}

module.exports = { renderVideoIndex, renderVideoCategory, renderVideoDetail };
