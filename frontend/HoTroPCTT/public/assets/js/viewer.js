// Trang xem chi tiet: doi kho anh, phong to anh, chia se.
(function () {
  "use strict";

  function toast(message) {
    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 2600);
  }

  // ---------------------------------------------------------- Doi kho anh
  var tabs = document.querySelectorAll(".format-tab");
  var image = document.getElementById("viewer-image");
  var downloadLink = document.getElementById("download-link");
  var downloadSize = document.getElementById("download-size");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var src = tab.getAttribute("data-src");
      if (!src || !image) return;

      tabs.forEach(function (t) {
        t.classList.remove("is-active");
        t.setAttribute("aria-pressed", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-pressed", "true");

      image.src = src;
      if (downloadLink) downloadLink.href = src;
      if (downloadSize) downloadSize.textContent = tab.getAttribute("data-bytes") || "";
    });
  });

  // ----------------------------------------------------------- Phong to anh
  // Chu trong infographic rat nho -> phai phong to duoc thi nguoi dan moi doc noi.
  var zoomBtn = document.getElementById("viewer-zoom");

  function openLightbox() {
    if (!image) return;

    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Ảnh phóng to");

    var big = document.createElement("img");
    big.src = image.currentSrc || image.src;
    big.alt = image.alt || "";

    var close = document.createElement("button");
    close.type = "button";
    close.className = "lightbox-close";
    close.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg> Đóng';

    box.appendChild(big);
    box.appendChild(close);
    document.body.appendChild(box);
    document.body.classList.add("lightbox-open");
    close.focus();

    function dismiss() {
      box.remove();
      document.body.classList.remove("lightbox-open");
      document.removeEventListener("keydown", onKey);
      if (zoomBtn) zoomBtn.focus();
    }

    function onKey(e) {
      if (e.key === "Escape") dismiss();
    }

    // Bam vao anh: phong to 2.4x quanh diem bam, bam lai de thu nho.
    big.addEventListener("click", function (e) {
      e.stopPropagation();
      var zoomed = box.classList.toggle("is-zoomed");
      if (zoomed) {
        var rect = big.getBoundingClientRect();
        var rx = (e.clientX - rect.left) / rect.width;
        var ry = (e.clientY - rect.top) / rect.height;
        // Doi sang kich thuoc moi roi cuon toi dung diem vua bam.
        requestAnimationFrame(function () {
          box.scrollLeft = big.offsetWidth * rx - box.clientWidth / 2;
          box.scrollTop = big.offsetHeight * ry - box.clientHeight / 2;
        });
      } else {
        box.scrollTop = 0;
        box.scrollLeft = 0;
      }
    });

    close.addEventListener("click", dismiss);
    box.addEventListener("click", function (e) {
      if (e.target === box) dismiss();
    });
    document.addEventListener("keydown", onKey);
  }

  if (zoomBtn) zoomBtn.addEventListener("click", openLightbox);

  // -------------------------------------------------------------- Chia se
  // Tren dien thoai mo thang bang chia se cua he dieu hanh (Zalo, Facebook, tin nhan).
  var shareBtn = document.getElementById("share-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var data = {
        title: document.title,
        text: (document.querySelector("h1") || {}).textContent || document.title,
        url: location.href,
      };

      if (navigator.share) {
        navigator.share(data).catch(function () {
          /* nguoi dung huy chia se - khong bao loi */
        });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(location.href).then(
          function () {
            toast("Đã sao chép đường dẫn");
          },
          function () {
            toast("Không sao chép được đường dẫn");
          }
        );
      } else {
        toast(location.href);
      }
    });
  }
})();
