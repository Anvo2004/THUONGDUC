// Tim kiem toan bo hinh anh + video, chay hoan toan tren trinh duyet.
(function () {
  "use strict";

  var input = document.getElementById("search-input");
  var results = document.getElementById("search-results");
  var clearBtn = document.getElementById("search-clear");
  var submitBtn = document.getElementById("search-submit");
  if (!input || !results) return;

  var data = null;
  var loading = null;

  /** Bo dau tieng Viet: go "bao lut" van tim ra "Bão, ngập lụt". */
  function fold(str) {
    return String(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d");
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function loadIndex() {
    if (data) return Promise.resolve(data);
    if (loading) return loading;

    loading = fetch("/data/search-index.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (json) {
        json.items.forEach(function (it) {
          var cat = json.categories[it.cat] || {};
          it.catTitle = cat.title || "";
          it.rgb = cat.rgb || "10 92 184";
          it.icon = cat.icon || "";
          it.foldedTitle = fold(it.title);
          it.foldedCat = fold(it.catTitle);
          it.haystack = it.foldedTitle + " " + it.foldedCat;
        });
        data = json;
        return data;
      })
      .catch(function () {
        loading = null;
        return null;
      });

    return loading;
  }

  function render(matches, query) {
    if (!query) {
      results.hidden = true;
      results.innerHTML = "";
      return;
    }

    results.hidden = false;

    if (!matches.length) {
      results.innerHTML =
        '<p class="search-empty">Không tìm thấy hướng dẫn nào cho “' +
        escapeHtml(query) +
        '”.<br />Thử từ khóa khác như: bão, lũ, sạt lở, trẻ em.</p>';
      return;
    }

    results.innerHTML = matches
      .slice(0, 8)
      .map(function (it) {
        return (
          '<a class="search-result" style="--cat: ' + it.rgb + '" href="' + it.url + '">' +
          '<span class="search-result-icon">' + it.icon + "</span>" +
          '<span class="search-result-text">' +
          '<span class="search-result-title">' + escapeHtml(it.title) + "</span>" +
          '<span class="search-result-cat">' +
          (it.type === "video" ? "Video" : "Hình ảnh") + " · " + escapeHtml(it.catTitle) +
          "</span></span></a>"
        );
      })
      .join("");
  }

  /**
   * Diem uu tien khop TRON TU. Neu chi tinh chuoi con thi go "hạn hán" se doi len
   * "vận hành xả lũ" ("hanh" chua "han") - phai xep sau muc that su noi ve han han.
   */
  function scoreTerm(text, term, weight) {
    var at = text.indexOf(term);
    if (at === -1) return 0;
    var before = at === 0 ? " " : text.charAt(at - 1);
    var after = text.charAt(at + term.length) || " ";
    var startsWord = !/[a-z0-9]/.test(before);
    var endsWord = !/[a-z0-9]/.test(after);

    if (startsWord && endsWord) return weight * 4; // tron tu: "han" trong "han han"
    if (startsWord) return weight * 2; // dau tu: "ngap" trong "ngap lut"
    return weight; // giua tu: "han" trong "hanh"
  }

  function search() {
    var query = input.value.trim();
    if (clearBtn) clearBtn.hidden = !query;

    if (!query) {
      render([], "");
      return;
    }

    loadIndex().then(function (json) {
      if (!json || input.value.trim() !== query) return;

      var terms = fold(query).split(/\s+/).filter(Boolean);
      var matches = [];

      json.items.forEach(function (it) {
        var total = 0;
        var hitAll = terms.every(function (t) {
          // Tieu de nang hon chuyen de: go "set" phai ra bai ve set truoc.
          var s = scoreTerm(it.foldedTitle, t, 3) + scoreTerm(it.foldedCat, t, 1);
          total += s;
          return s > 0;
        });
        if (hitAll) matches.push({ item: it, score: total });
      });

      matches.sort(function (a, b) {
        return b.score - a.score;
      });

      render(
        matches.map(function (m) {
          return m.item;
        }),
        query
      );
    });
  }

  input.addEventListener("input", search);
  // Nap san chi muc ngay khi nguoi dung cham vao o tim -> ket qua hien tuc thi.
  input.addEventListener("focus", loadIndex, { once: true });

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      input.value = "";
      clearBtn.hidden = true;
      render([], "");
      input.focus();
    });
  }

  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      input.value = "";
      render([], "");
      input.blur();
    }
    // Enter -> mo ket qua dau tien
    if (e.key === "Enter") {
      var first = results.querySelector(".search-result");
      if (first) {
        e.preventDefault();
        location.href = first.getAttribute("href");
      }
    }
  });

  if (submitBtn) {
    submitBtn.addEventListener("click", function () {
      var first = results.querySelector(".search-result");
      if (first) {
        location.href = first.getAttribute("href");
      } else {
        input.focus();
      }
    });
  }
})();
