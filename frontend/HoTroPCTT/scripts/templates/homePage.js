const { layout, escapeHtml } = require("./layout");
const { categoryIcon, categoryStyle } = require("../lib/categoryMeta");

// Chuyen de sat suon nhat voi dia ban xa Thuong Duc (mien nui, ven song Vu Gia).
const PRIORITY_SLUGS = ["bao-antd", "lu", "lu-quet", "sat-lo-dat", "ngap-lut", "set"];

function searchBox() {
  return `<form class="search" role="search" onsubmit="return false;">
  <label class="sr-only" for="search-input">Tìm kiếm hướng dẫn</label>
  <span class="search-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>
  </span>
  <input id="search-input" type="search" autocomplete="off" placeholder="Tìm: bão, sạt lở, đuối nước…" aria-describedby="search-hint" />
  <button type="button" class="search-clear" id="search-clear" hidden aria-label="Xóa ô tìm kiếm">&times;</button>
</form>
<p class="search-hint sr-only" id="search-hint">Nhập từ khóa để tìm nhanh trong hình ảnh và video hướng dẫn.</p>
<div id="search-results" class="search-results" hidden></div>`;
}

function renderHome(infographic, video) {
  const infoItems = infographic.categories.reduce((n, c) => n + c.items.length, 0);
  const videoItems = video.categories.reduce((n, c) => n + c.items.length, 0);

  const bySlug = new Map(infographic.categories.map((c) => [c.slug, c]));
  const quickLinks = PRIORITY_SLUGS.filter((s) => bySlug.has(s))
    .map((slug) => {
      const cat = bySlug.get(slug);
      return `<a class="topic-chip" style="${categoryStyle(slug)}" href="/infographic/${slug}/">
  <span class="topic-chip-icon">${categoryIcon(slug)}</span>
  <span class="topic-chip-text">${escapeHtml(cat.title)}</span>
</a>`;
    })
    .join("\n");

  const body = `
<section class="hero">
  <div class="hero-inner">
    <p class="hero-eyebrow">UBND xã Thượng Đức</p>
    <h1>Kỹ năng phòng chống thiên tai</h1>
    <p class="hero-lead">Hình ảnh và video hướng dẫn cách giữ an toàn cho gia đình khi có bão, lũ, sạt lở đất và các loại thiên tai khác. Xem miễn phí, tải về được, chia sẻ cho người thân.</p>
    ${searchBox()}
  </div>
</section>

<section class="section" aria-labelledby="quick-title">
  <h2 class="section-title" id="quick-title">Chuyên đề thường gặp</h2>
  <div class="topic-chips">
${quickLinks}
  </div>
</section>

<section class="section" aria-labelledby="browse-title">
  <h2 class="section-title" id="browse-title">Xem theo định dạng</h2>
  <div class="entry-cards">
    <a class="entry-card entry-card-image" href="/infographic/">
      <span class="entry-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M3.5 16.5l4.5-4 3.5 3 3-2.5 6 5"/></svg>
      </span>
      <span class="entry-body">
        <strong>Hình ảnh hướng dẫn</strong>
        <span class="entry-meta">${infoItems} bài · ${infographic.categories.length} chuyên đề</span>
        <span class="entry-desc">Tranh minh họa từng bước cần làm trước, trong và sau thiên tai.</span>
      </span>
      <span class="entry-arrow" aria-hidden="true">→</span>
    </a>
    <a class="entry-card entry-card-video" href="/video/">
      <span class="entry-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="14" height="14" rx="2.5"/><path d="M16.5 10l5-3v10l-5-3z"/></svg>
      </span>
      <span class="entry-body">
        <strong>Video hướng dẫn</strong>
        <span class="entry-meta">${videoItems} video · Đa số có bản thủ ngữ</span>
        <span class="entry-desc">Phim hoạt hình ngắn, dễ hiểu, có bản dành cho người khiếm thính.</span>
      </span>
      <span class="entry-arrow" aria-hidden="true">→</span>
    </a>
  </div>
</section>

<section class="section" aria-labelledby="emergency-title">
  <div class="emergency">
    <h2 id="emergency-title">Khi có tình huống khẩn cấp</h2>
    <p>Gọi ngay các số dưới đây — miễn phí, gọi được cả khi máy hết tiền.</p>
    <ul class="emergency-list">
      <li><a href="tel:112"><strong>112</strong><span>Cứu nạn, cứu hộ</span></a></li>
      <li><a href="tel:113"><strong>113</strong><span>Công an</span></a></li>
      <li><a href="tel:114"><strong>114</strong><span>Cứu hỏa</span></a></li>
      <li><a href="tel:115"><strong>115</strong><span>Cấp cứu y tế</span></a></li>
    </ul>
  </div>
</section>
<script src="/assets/js/search.js" defer></script>`;

  return layout({
    title: "Kỹ năng phòng chống thiên tai",
    description:
      "Hình ảnh và video hướng dẫn kỹ năng phòng chống bão, lũ, lũ quét, sạt lở đất cho người dân xã Thượng Đức. Xem miễn phí, tải về và chia sẻ.",
    bodyHtml: body,
    nav: "home",
    bodyClass: "page-home",
  });
}

module.exports = { renderHome };
