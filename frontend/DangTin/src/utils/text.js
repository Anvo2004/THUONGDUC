function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}

// Chuan hoa tieu de de so sanh trung lap (cung 1 bai co the duoc gan vao nhieu
// chuyen muc tren vnPortal nen xuat hien nhieu lan voi cung tieu de, khac ArticleID
// hoac cung ArticleID nhung link khac nhau).
function normalizeTitle(title) {
  return (title || "").trim().toLowerCase().replace(/\s+/g, " ");
}

module.exports = { stripHtml, truncate, normalizeTitle };
