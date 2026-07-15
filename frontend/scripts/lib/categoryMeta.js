// Bo nhan dien cho tung chuyen de thien tai: bieu tuong + mau.
//
// Bieu tuong giup nguoi doc nhan ra chuyen de ma khong can doc chu (nguoi cao tuoi,
// nguoi it doc chu). Mau gom theo ho thien tai: bao/gio = tim-xanh, nuoc = xanh duong,
// dat = nau, nong/chay = cam-do, lanh = xanh ngoc.
//
// `rgb` la bo ba R G B (cach nhau bang dau cach) de CSS dung duoc ca mau dac
// `rgb(var(--cat))` lan nen nhat `rgb(var(--cat) / 0.1)` ma khong can color-mix().

const ICONS = {
  cyclone: '<path d="M12 12a4 4 0 1 1-1.2 7.8"/><path d="M12 12a4 4 0 1 0 1.2-7.8"/><path d="M12 12c-4.4 0-8-1.6-8-3.5S7.6 5 12 5"/><path d="M12 12c4.4 0 8 1.6 8 3.5S16.4 19 12 19"/>',
  flood: '<path d="M4 17.5c1.6 0 1.6 1.2 3.2 1.2s1.6-1.2 3.2-1.2 1.6 1.2 3.2 1.2 1.6-1.2 3.2-1.2 1.6 1.2 3.2 1.2"/><path d="M4 13.5c1.6 0 1.6 1.2 3.2 1.2s1.6-1.2 3.2-1.2 1.6 1.2 3.2 1.2 1.6-1.2 3.2-1.2 1.6 1.2 3.2 1.2"/><path d="M5.5 10.5V7.2L12 3l6.5 4.2v3.3"/><path d="M9.5 10.5V8h5v2.5"/>',
  inundation: '<path d="M3 16.5c1.6 0 1.6 1.3 3.2 1.3s1.6-1.3 3.2-1.3 1.6 1.3 3.2 1.3 1.6-1.3 3.2-1.3 1.6 1.3 3.2 1.3"/><path d="M3 20.2c1.6 0 1.6 1.3 3.2 1.3"/><path d="M6 16V9.5L12 5l6 4.5V16"/><path d="M10 16v-3.5h4V16"/>',
  rain: '<path d="M7 15.5a4.2 4.2 0 0 1-.4-8.4 5.2 5.2 0 0 1 10 1.2A3.6 3.6 0 0 1 16.2 15.5"/><path d="M8.5 18l-1 3"/><path d="M12 18l-1 3"/><path d="M15.5 18l-1 3"/>',
  flashflood: '<path d="M2.5 5l4.5 6.5L11 7l5 7 3-3.5 2.5 3.5"/><path d="M3 17c1.6 0 1.6 1.3 3.2 1.3S7.8 17 9.4 17s1.6 1.3 3.2 1.3S14.2 17 15.8 17s1.6 1.3 3.2 1.3"/><path d="M3 21c1.6 0 1.6-1.3 3.2-1.3S7.8 21 9.4 21s1.6-1.3 3.2-1.3S14.2 21 15.8 21s1.6-1.3 3.2-1.3"/>',
  landslide: '<path d="M2 20h20"/><path d="M3 20L13 5l4 6"/><path d="M14.5 13.5l2.5-2 4 4.5"/><circle cx="16" cy="17.5" r="1.4"/><circle cx="20" cy="19" r="1.1"/><circle cx="11.5" cy="18.5" r="1.1"/>',
  tornado: '<path d="M3 4h18"/><path d="M5 8h14"/><path d="M7.5 12h9"/><path d="M10 16h5"/><path d="M11.5 20h2"/>',
  hail: '<path d="M7 14.5a4.2 4.2 0 0 1-.4-8.4 5.2 5.2 0 0 1 10 1.2A3.6 3.6 0 0 1 16.2 14.5"/><circle cx="8.5" cy="18" r="1.2"/><circle cx="12" cy="20.5" r="1.2"/><circle cx="15.5" cy="18" r="1.2"/>',
  heat: '<circle cx="9" cy="9" r="3.2"/><path d="M9 2.5v1.8M9 13.7v1.8M2.5 9h1.8M13.7 9h1.8M4.4 4.4l1.3 1.3M12.3 12.3l1.3 1.3M13.6 4.4l-1.3 1.3M5.7 12.3l-1.3 1.3"/><path d="M19 14.5V8.2a1.6 1.6 0 0 0-3.2 0v6.3a3 3 0 1 0 3.2 0z"/>',
  salt: '<path d="M12 3.5S6.5 9.8 6.5 13.5a5.5 5.5 0 0 0 11 0C17.5 9.8 12 3.5 12 3.5z"/><path d="M10 13.5h4M12 11.5v4"/>',
  drought: '<circle cx="12" cy="7" r="3.2"/><path d="M12 1.2v1.6M12 11.2v1M6.3 7H4.8M19.2 7h-1.5M7.9 2.9l1.1 1.1M15 10l1.1 1.1M16.1 2.9L15 4M9 10l-1.1 1.1"/><path d="M2.5 17h19"/><path d="M7 17l-1.5 4M12 17v4M17 17l1.5 4M9.5 21h5"/>',
  cold: '<path d="M12 2.5v19"/><path d="M4 7l16 10"/><path d="M20 7L4 17"/><path d="M9 4.5l3 2.5 3-2.5M9 19.5l3-2.5 3 2.5"/><path d="M4.6 10.6l.6 3.6-3.4 1.3M19.4 10.6l-.6 3.6 3.4 1.3"/>',
  lightning: '<path d="M7 12.5a4.2 4.2 0 0 1-.4-8.4 5.2 5.2 0 0 1 10 1.2 3.6 3.6 0 0 1 .6 7.2"/><path d="M13 10l-3.5 5.5h3L11 22l4.5-6.5h-3L13 10z"/>',
  earthquake: '<path d="M2 20h20"/><path d="M6 20V9l6-4 6 4v11"/><path d="M9.5 20v-4.5h5V20"/><path d="M2 13.5l3-2 2.5 3.5 2.5-6 2.5 5 2.5-3.5 2 3 3-2"/>',
  tsunami: '<path d="M2 20.5c1.7 0 1.7 1.2 3.4 1.2s1.7-1.2 3.4-1.2 1.7 1.2 3.4 1.2 1.7-1.2 3.4-1.2 1.7 1.2 3.4 1.2"/><path d="M2.5 17c3-8.5 9-12.5 15-11-1.5 1.5-2 3.5-1.5 5.5"/><path d="M9 15c1.5-4 4.5-6.5 8-6.5"/>',
  seawind: '<path d="M3 7h11a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 11.5h15a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 16c1.7 0 1.7 1.3 3.4 1.3S8.1 16 9.8 16s1.7 1.3 3.4 1.3S14.9 16 16.6 16s1.7 1.3 3.4 1.3"/><path d="M3 20c1.7 0 1.7 1.3 3.4 1.3"/>',
  frost: '<path d="M12 2.5v11"/><path d="M8.5 4.5L12 7l3.5-2.5"/><path d="M7 6.8l5 2.9 5-2.9"/><path d="M6 13.5h12"/><path d="M9 16.5v4M12 15.5v5.5M15 16.5v4"/>',
  fog: '<path d="M4 8h16"/><path d="M2.5 12h19"/><path d="M5 16h14"/><path d="M3.5 20h17"/><path d="M8 4h9"/>',
  wildfire: '<path d="M12 21.5c3.6 0 6.5-2.7 6.5-6 0-4.5-4-5.5-3-10-3.5 1.5-5 5-4 7.5-1.5-.5-2-2-2-3.5-2 2-4 4-4 6 0 3.3 2.9 6 6.5 6z"/><path d="M12 21.5c1.7 0 3-1.3 3-3 0-2-2-2.8-1.5-5-2 1-3 3-2.5 4.5-.8-.3-1-1-1-1.8-1 1-1 2-1 2.3 0 1.7 1.3 3 3 3z"/>',
  airpollution: '<path d="M6 19h12a3 3 0 0 0 0-6 4.5 4.5 0 0 0-8.6-2.2A3.4 3.4 0 0 0 6 19z"/><path d="M9 22.5h9"/><path d="M4 22.5h2"/><path d="M14 6.5c0-1.2 1.5-1.2 1.5-2.5s-1.5-1.3-1.5-2.5"/><path d="M18 7c0-1 1.2-1 1.2-2s-1.2-1-1.2-2"/>',
};

// slug -> { icon, rgb }
const CATEGORY_META = {
  // Ho bao / gio
  "bao-antd": { icon: "cyclone", rgb: "67 56 202" },
  loc: { icon: "tornado", rgb: "99 102 241" },
  "gio-manh-tren-bien": { icon: "seawind", rgb: "79 70 229" },
  // Ho nuoc
  lu: { icon: "flood", rgb: "3 105 161" },
  "ngap-lut": { icon: "inundation", rgb: "2 132 199" },
  "mua-lon": { icon: "rain", rgb: "8 145 178" },
  "lu-quet": { icon: "flashflood", rgb: "14 116 144" },
  "song-than": { icon: "tsunami", rgb: "7 89 133" },
  // Ho dat
  "sat-lo-dat": { icon: "landslide", rgb: "180 83 9" },
  "dong-dat": { icon: "earthquake", rgb: "146 64 14" },
  // Ho nong / chay
  "nang-nong": { icon: "heat", rgb: "234 88 12" },
  "han-han": { icon: "drought", rgb: "194 65 12" },
  "chay-rung": { icon: "wildfire", rgb: "220 38 38" },
  // Ho lanh
  "ret-hai": { icon: "cold", rgb: "15 118 110" },
  "suong-muoi": { icon: "frost", rgb: "13 148 136" },
  "suong-mu": { icon: "fog", rgb: "100 116 139" },
  // Khac
  set: { icon: "lightning", rgb: "161 98 7" },
  "mua-da": { icon: "hail", rgb: "8 145 178" },
  "xam-nhap-man": { icon: "salt", rgb: "124 58 237" },
  "o-nhiem-kk": { icon: "airpollution", rgb: "87 83 78" },
};

// Chuyen de video dung lai nhan dien + anh bia cua chuyen de infographic tuong ung.
const VIDEO_TO_INFOGRAPHIC = {
  "bao-atnd": "bao-antd",
  lu: "lu",
  "lu-quet": "lu-quet",
  "sat-lo-dat": "sat-lo-dat",
  set: "set",
};

const FALLBACK = { icon: "rain", rgb: "10 92 184" };

function getCategoryMeta(slug) {
  return CATEGORY_META[slug] || CATEGORY_META[VIDEO_TO_INFOGRAPHIC[slug]] || FALLBACK;
}

/** SVG bieu tuong, thua mau tu `currentColor`. Trang tri thuan tuy -> aria-hidden. */
function categoryIcon(slug, extraClass = "") {
  const { icon } = getCategoryMeta(slug);
  const paths = ICONS[icon] || ICONS.rain;
  return `<svg class="icon${extraClass ? " " + extraClass : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}

/** Bien CSS --cat de the card to mau theo chuyen de. */
function categoryStyle(slug) {
  return `--cat: ${getCategoryMeta(slug).rgb}`;
}

module.exports = { getCategoryMeta, categoryIcon, categoryStyle, VIDEO_TO_INFOGRAPHIC };
