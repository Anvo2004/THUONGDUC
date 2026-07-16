/**
 * Tach so thu tu dung dau ten thu muc/file va phan tieu de con lai.
 * Vd: "1- Bão, ANTĐ" -> { order: 1, title: "Bão, ANTĐ" }
 *     "10-Xâm nhập mặn" -> { order: 10, title: "Xâm nhập mặn" }
 *     "c. Format vuông" -> { order: 3, title: "Format vuông" } (a/b/c -> 1/2/3)
 * Neu khong tim thay so o dau, order = Infinity (xep cuoi) va title = nguyen ban.
 */
function parseOrder(rawName) {
  // Ten muc (anh/video) thuong co tien to "Info"/"Video" truoc so thu tu,
  // vd "Info 1- Cấp gió..." hoac "VIDEO 6 HƯỚNG DẪN...".
  const numMatch = rawName.match(/^\s*(?:info|video)?\s*(\d+)\s*[-.]?\s*/i);
  if (numMatch) {
    return {
      order: parseInt(numMatch[1], 10),
      title: rawName.slice(numMatch[0].length).trim(),
    };
  }

  const letterMatch = rawName.match(/^\s*([a-c])\s*[-.]?\s*/i);
  if (letterMatch) {
    const order = letterMatch[1].toLowerCase().charCodeAt(0) - "a".charCodeAt(0) + 1;
    return { order, title: rawName.slice(letterMatch[0].length).trim() };
  }

  return { order: Infinity, title: rawName.trim() };
}

module.exports = { parseOrder };
