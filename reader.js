const requestedId = new URLSearchParams(location.search).get("book") || "iceland";
const data = window.READER_BOOKS[requestedId] || window.READER_BOOKS.iceland;
const bookElement = document.querySelector("#book");
document.documentElement.style.setProperty("--accent", data.accent);
document.documentElement.style.setProperty("--theme-dark", data.dark);
document.title = `${data.title} · 世界视觉档案`;

document.querySelector("#headTitle").textContent = data.title;
document.querySelector("#headEnglish").textContent = data.english;
document.querySelector("#controlTitle").textContent = data.title;

function image(index, extra = "") {
  return `<figure class="photo ${extra}"><img src="${data.images[index]}" alt="${data.captions[index]}"><figcaption><span>0${index + 1}</span>${data.captions[index]}</figcaption></figure>`;
}

const palette = data.palette.map((color) => `<i style="--swatch:${color}"></i>`).join("");
const pages = [
  `<article class="page-content cover-page">
    <img src="${data.images[1]}" alt="${data.captions[1]}">
    <div class="cover-wash"></div><p class="cover-no">WORLD VISUAL ARCHIVE / ${data.number}</p>
    <div class="cover-title"><small>${data.issue}</small><h1>${data.title}</h1><p>${data.english}</p></div>
    <div class="cover-palette">${palette}</div>
  </article>`,
  `<article class="page-content endpaper"><p>${data.words.join(" / ")}</p><div class="orbit"><span></span></div><small>${data.coordinates}</small></article>`,
  `<article class="page-content manifesto"><p class="page-kicker">VISUAL FIELD NOTE / ${data.number}</p><h2>${data.title}</h2><blockquote>${data.quote}</blockquote><div class="large-number">${data.number}</div><p class="micro">AI CURATED · EDITORIAL SEQUENCE · INTERACTIVE BINDING</p></article>`,
  `<article class="page-content full-bleed">${image(0, "bleed")}<p class="side-word">${data.words[0]}</p></article>`,
  `<article class="page-content collage-page"><p class="page-kicker">TWO DISTANCES / ONE PLACE</p>${image(1, "large")}${image(2, "small")}<span class="index-mark">A—B</span></article>`,
  `<article class="page-content statement"><div class="word-stack"><span>${data.words[0]}</span><span>${data.words[1]}</span><span>${data.words[2]}</span></div><p>${data.quote}</p><div class="palette-row">${palette}</div></article>`,
  `<article class="page-content full-bleed">${image(3, "bleed")}<p class="side-word">${data.words[1]}</p></article>`,
  `<article class="page-content collage-page reverse"><p class="page-kicker">SURFACE / SCALE / MEMORY</p>${image(4, "large")}${image(5, "small")}<span class="index-mark">C—D</span></article>`,
  `<article class="page-content colophon"><p class="page-kicker">IMAGE & DESIGN LOG</p><h2>${data.english}</h2><p>${data.credit}</p><dl><div><dt>COLOR DNA</dt><dd>${data.palette.join(" · ")}</dd></div><div><dt>EDITORIAL SYSTEM</dt><dd>FULL BLEED · ASYMMETRIC COLLAGE · FIELD NOTE</dd></div><div><dt>RUNTIME</dt><dd>STPAGEFLIP / 512 × 640</dd></div></dl><div class="palette-row">${palette}</div><small>完整来源记录见系统目录 SOURCES.md</small></article>`,
  `<article class="page-content back-page"><div><span>VOLUME / ${data.number}</span><h2>${data.title}</h2><p>${data.coordinates}</p></div><p>RETURN TO THE WORLD SHELF</p></article>`,
];

pages.forEach((content, index) => {
  const leaf = document.createElement("section");
  leaf.className = "book-page";
  leaf.dataset.density = index === 0 || index === pages.length - 1 ? "hard" : "soft";
  leaf.dataset.status = `${String(index + 1).padStart(2, "0")} / ${String(pages.length).padStart(2, "0")}`;
  leaf.innerHTML = content;
  bookElement.append(leaf);
});

const leaves = bookElement.querySelectorAll(".book-page");
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
const pageStatus = document.querySelector("#pageStatus");
const orientationStatus = document.querySelector("#orientation");
const pageFlip = new St.PageFlip(bookElement, {
  width: 512, height: 640, size: "stretch",
  minWidth: 286, maxWidth: 532, minHeight: 358, maxHeight: 666,
  drawShadow: true, flippingTime: 760, usePortrait: true, startZIndex: 10,
  autoSize: true, maxShadowOpacity: .42, showCover: true, mobileScrollSupport: false,
  clickEventForward: true, useMouseEvents: true, swipeDistance: 24, showPageCorners: true,
});

let currentPage = 0;
let isTurning = false;
function updateControls() {
  const last = pageFlip.getPageCount() - 1;
  previousButton.disabled = currentPage === 0 || isTurning;
  nextButton.disabled = currentPage === last || isTurning;
  pageStatus.textContent = currentPage === 0 ? "封面" : currentPage === last ? "封底" : leaves[currentPage]?.dataset.status;
}
pageFlip.on("flip", (event) => { currentPage = Number(event.data); updateControls(); });
pageFlip.on("changeState", (event) => { isTurning = event.data !== "read"; updateControls(); });
pageFlip.on("init", (event) => { orientationStatus.textContent = event.data.mode === "portrait" ? "单页" : "跨页"; });
pageFlip.on("changeOrientation", (event) => { orientationStatus.textContent = event.data === "portrait" ? "单页" : "跨页"; });
pageFlip.loadFromHTML(leaves);
updateControls();
previousButton.addEventListener("click", () => !isTurning && pageFlip.flipPrev("bottom"));
nextButton.addEventListener("click", () => !isTurning && pageFlip.flipNext("bottom"));
window.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || isTurning) return;
  if (event.key === "ArrowLeft") { event.preventDefault(); pageFlip.flipPrev("bottom"); }
  if (event.key === "ArrowRight" || event.key === " ") { event.preventDefault(); pageFlip.flipNext("bottom"); }
  if (event.key === "Home") pageFlip.turnToPage(0);
  if (event.key === "End") pageFlip.turnToPage(pageFlip.getPageCount() - 1);
});
