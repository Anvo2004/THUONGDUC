(function () {
  var tabs = document.querySelectorAll(".format-tab");
  var img = document.getElementById("viewer-image");
  var downloadLink = document.getElementById("download-link");
  if (!tabs.length || !img) return;

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      var src = tab.getAttribute("data-src");
      img.src = src;
      if (downloadLink) downloadLink.setAttribute("href", src);
    });
  });
})();
