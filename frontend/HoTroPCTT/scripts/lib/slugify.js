function removeDiacritics(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function slugify(str) {
  return removeDiacritics(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Tra ve 1 slug duy nhat trong pham vi `usedSlugs` (Set), tu them hau to -2, -3...
 * neu bi trung, va tu dong them slug moi vao Set.
 */
function uniqueSlug(str, usedSlugs) {
  const base = slugify(str) || "muc";
  let candidate = base;
  let counter = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${base}-${counter}`;
    counter++;
  }
  usedSlugs.add(candidate);
  return candidate;
}

module.exports = { slugify, uniqueSlug };
