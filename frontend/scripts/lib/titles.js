// Chuan hoa tieu de hien thi cho nguoi dan doc.
//
// Tieu de trong manifest lay thang tu ten file nguon (docs/), nen con:
//   - tien to ky thuat: "Info-", "Info "
//   - hau to danh dau ban thu ngu: "thu ngu", "Thủ ngữ", "_THỦ NGỮ"
//   - viet tat: HD, AT, MT, XNM, KK, bp, ko
//   - loi go: "kxy năng", "dâu hiệu", "ứng phso vơi"
//   - VIET HOA TOAN BO (video)
//
// QUAN TRONG: chi doi CHUOI HIEN THI, khong bao gio doi slug. Slug sinh tu tieu de
// goc va da nam trong URL + duong dan file media tren VPS (/media/<catSlug>/<itemSlug>/).
// Vi vay normalizeManifest() phai chay SAU khi slug da duoc gan.

// Lop ky tu "chu cai" bao gom tieng Viet - \b cua JS chi biet [A-Za-z0-9_] nen
// khong dung duoc voi "ANTĐ", "XNM"...
const VN_WORD = "A-Za-zÀ-ỹĐđ0-9";

function wordRe(token) {
  return new RegExp(`(^|[^${VN_WORD}])${token}(?![${VN_WORD}])`, "g");
}

// Tieu de bi sai cau truc, khong sua duoc bang quy tac chung -> viet lai tay.
const OVERRIDES = {
  "Lũ quét  -Những không việc nên làm để đảm bảo an toàn trước lũ quét thu ngu":
    "Những việc không nên làm để đảm bảo an toàn trước lũ quét",
  "Lũ quét  -Những việc nên làm để đảm bảo an toàn trước lũ quét Thu Ngu":
    "Những việc nên làm để đảm bảo an toàn trước lũ quét",
  "HƯỚNG DẪN ĐẢM BẢO AN TOÀN TRƯỚC VÀ TRONG - THỦ NGỮ":
    "Hướng dẫn đảm bảo an toàn trước và trong bão",
  "HƯỚNG DẪN GIA CỐ BẢO VỆ AO, ĐẦM, LỒNG BÈ - THỦ NGỮ":
    "Hướng dẫn gia cố, bảo vệ ao, đầm, lồng bè",
  "Bão, ANTĐ": "Bão, áp thấp nhiệt đới",
  "Bão-ATNĐ": "Bão, áp thấp nhiệt đới",
  "Ô nhiễm KK": "Ô nhiễm không khí",
  // "ATNĐ Bão" bung thang ra thanh "áp thấp nhiệt đới-Bão" doc rat guong -> viet lai.
  "Cấp gió và mức nguy hại của ATNĐ-Bão": "Cấp gió và mức nguy hại của bão, áp thấp nhiệt đới",
  "Đảm bảo an toàn tàu thuyền khi có ATNĐ Bão": "Đảm bảo an toàn tàu thuyền khi có bão, áp thấp nhiệt đới",
  "HD đảm bảo an toàn trước, trong ATNĐ Bão cho ngư dân":
    "Hướng dẫn đảm bảo an toàn cho ngư dân trước và trong bão",
};

const TYPOS = [
  [/kxy\s+năng/gi, "kỹ năng"],
  [/dâu\s+hiệu/gi, "dấu hiệu"],
  [/ứng\s+phso\s+vơi/gi, "ứng phó với"],
  [/sau\s+mua\s+lũ/gi, "sau mưa lũ"],
  [/biên\s+pháp/gi, "biện pháp"],
];

const ABBREVS = [
  ["ATNĐ", "áp thấp nhiệt đới"],
  ["ANTĐ", "áp thấp nhiệt đới"],
  ["XNM", "xâm nhập mặn"],
  ["HD", "Hướng dẫn"],
  ["AT", "an toàn"],
  ["MT", "môi trường"],
  ["KK", "không khí"],
  ["bp", "biện pháp"],
  ["ko", "không"],
];

// Hau to danh dau video co ban thu ngu - da the hien bang huy hieu rieng tren giao dien.
const SIGN_SUFFIX_RE = /[\s\-_–—]*(thủ\s*ngữ|thu\s*ngu)\s*$/i;
const INFO_PREFIX_RE = /^\s*info\s*[-–—]?\s*/i;

function isMostlyUpperCase(str) {
  const letters = str.replace(new RegExp(`[^${VN_WORD}]`, "g"), "").replace(/[0-9]/g, "");
  if (letters.length < 4) return false;
  const upper = [...letters].filter((ch) => ch === ch.toUpperCase() && ch !== ch.toLowerCase());
  return upper.length / letters.length > 0.6;
}

function capitalizeFirst(str) {
  const i = str.search(new RegExp(`[${VN_WORD}]`));
  if (i === -1) return str;
  return str.slice(0, i) + str[i].toUpperCase() + str.slice(i + 1);
}

function cleanTitle(raw) {
  if (!raw) return "";
  const original = String(raw).replace(/\s+/g, " ").trim();

  if (OVERRIDES[raw]) return OVERRIDES[raw];
  if (OVERRIDES[original]) return OVERRIDES[original];

  let out = original.replace(INFO_PREFIX_RE, "").replace(SIGN_SUFFIX_RE, "");

  for (const [re, to] of TYPOS) out = out.replace(re, to);
  for (const [token, full] of ABBREVS) out = out.replace(wordRe(token), `$1${full}`);

  // Video dat ten VIET HOA TOAN BO -> ha xuong chu thuong cho de doc.
  if (isMostlyUpperCase(out)) out = out.toLowerCase();

  out = out.replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
  return capitalizeFirst(out);
}

/** Ghi de tieu de hien thi trong manifest (tai cho). Chay SAU khi slug da gan. */
function normalizeManifest(manifest) {
  for (const section of [manifest.infographic, manifest.video]) {
    if (!section || !section.categories) continue;
    for (const cat of section.categories) {
      cat.title = cleanTitle(cat.title);
      for (const item of cat.items || []) item.title = cleanTitle(item.title);
    }
  }
  return manifest;
}

module.exports = { cleanTitle, normalizeManifest };
