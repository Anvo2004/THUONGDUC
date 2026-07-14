const { layout, escapeHtml, breadcrumb } = require("./layout");

const FORMAT_LABELS = { portrait: "Dọc", landscape: "Ngang", square: "Vuông" };

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderInfographicIndex(infographic) {
  const cards = infographic.categories
    .map((cat) => {
      const cover = cat.items[0];
      const thumbSrc = cover ? `/media/infographic/${cat.slug}/${cover.slug}/${cover.thumbnail}` : "";
      return `<a class="card" href="/infographic/${cat.slug}/">
  ${thumbSrc ? `<img class="card-thumb" src="${thumbSrc}" alt="" loading="lazy" />` : ""}
  <div class="card-body">
    <h3>${escapeHtml(cat.title)}</h3>
    <p class="muted">${cat.items.length} bài</p>
  </div>
</a>`;
    })
    .join("\n");

  const body = `
${breadcrumb([{ label: "Trang chủ", href: "/" }, { label: "Infographic" }])}
<h1>Infographic hướng dẫn kỹ năng phòng chống thiên tai</h1>
<p class="muted">Chọn một chuyên đề để xem các hình ảnh hướng dẫn kỹ năng an toàn.</p>
<div class="grid">
${cards}
</div>`;

  return layout({ title: "Infographic hướng dẫn kỹ năng PCTT - Xã Thượng Đức", bodyHtml: body });
}

function renderInfographicCategory(cat) {
  const cards = cat.items
    .map((item) => {
      const thumbSrc = `/media/infographic/${cat.slug}/${item.slug}/${item.thumbnail}`;
      return `<a class="card" href="/infographic/${cat.slug}/${item.slug}/">
  <img class="card-thumb" src="${thumbSrc}" alt="" loading="lazy" />
  <div class="card-body">
    <h3>${escapeHtml(item.title)}</h3>
  </div>
</a>`;
    })
    .join("\n");

  const body = `
${breadcrumb([
    { label: "Trang chủ", href: "/" },
    { label: "Infographic", href: "/infographic/" },
    { label: cat.title },
  ])}
<h1>${escapeHtml(cat.title)}</h1>
<div class="grid">
${cards}
</div>`;

  return layout({ title: `${cat.title} - Infographic PCTT`, bodyHtml: body });
}

function renderInfographicDetail(cat, item, prevItem, nextItem) {
  const availableFormats = [];
  if (item.formats.portrait) availableFormats.push({ key: "portrait", file: item.formats.portrait.file, bytes: item.formats.portrait.bytes });
  if (item.formats.landscape) availableFormats.push({ key: "landscape", file: item.formats.landscape.file, bytes: item.formats.landscape.bytes });
  if (item.formats.square && item.formats.square.length) {
    item.formats.square.forEach((sq, i) =>
      availableFormats.push({ key: "square", file: sq.file, bytes: sq.bytes, variant: i + 1 })
    );
  }

  const basePath = `/media/infographic/${cat.slug}/${item.slug}`;
  const tabs = availableFormats
    .map((f, i) => {
      const label = f.variant ? `${FORMAT_LABELS[f.key]} ${f.variant}` : FORMAT_LABELS[f.key];
      return `<button type="button" class="format-tab${i === 0 ? " active" : ""}" data-src="${basePath}/${f.file}">${escapeHtml(
        label
      )} <span class="muted">(${formatBytes(f.bytes)})</span></button>`;
    })
    .join("\n");

  const firstSrc = availableFormats.length ? `${basePath}/${availableFormats[0].file}` : "";

  const prevNext = `<div class="prev-next">
  ${prevItem ? `<a href="/infographic/${cat.slug}/${prevItem.slug}/">&larr; ${escapeHtml(prevItem.title)}</a>` : "<span></span>"}
  ${nextItem ? `<a href="/infographic/${cat.slug}/${nextItem.slug}/">${escapeHtml(nextItem.title)} &rarr;</a>` : "<span></span>"}
</div>`;

  const body = `
${breadcrumb([
    { label: "Trang chủ", href: "/" },
    { label: "Infographic", href: "/infographic/" },
    { label: cat.title, href: `/infographic/${cat.slug}/` },
    { label: item.title },
  ])}
<h1>${escapeHtml(item.title)}</h1>
<div class="format-tabs">
${tabs}
</div>
<div class="image-viewer">
  <img id="viewer-image" src="${firstSrc}" alt="${escapeHtml(item.title)}" />
</div>
<p><a class="download-link" id="download-link" href="${firstSrc}" download>Tải ảnh về máy</a></p>
${prevNext}
<script src="/assets/js/format-tabs.js"></script>`;

  return layout({ title: `${item.title} - ${cat.title}`, bodyHtml: body });
}

module.exports = { renderInfographicIndex, renderInfographicCategory, renderInfographicDetail };
