const books = [
  {
    id: "nanchang", number: "01", title: "南昌", english: "NANCHANG / MEMORY LAYERS",
    color: "#aa493b", text: "#f8ead7", stripe: "#d99a69", height: 316, width: 46, type: "song",
    cover: "assets/nanchang-cover.png", reader: "books/nanchang/index.html",
  },
  {
    id: "iceland", number: "02", title: "火与冰", english: "ICELAND / ELEMENTAL SILENCE",
    color: "#294b5c", text: "#f3e9d9", stripe: "#83a8b8", height: 270, width: 39, type: "kai",
    cover: "assets/iceland/02-volcano.jpg", reader: "reader.html?book=iceland",
  },
  {
    id: "naoshima", number: "03", title: "岛与几何", english: "SETOUCHI / BLUE INTERVALS",
    color: "#79a2b5", text: "#173c4d", stripe: "#e8dcc6", height: 328, width: 45, type: "sans",
    cover: "assets/naoshima/02-pier.jpg", reader: "reader.html?book=naoshima",
  },
  {
    id: "morocco", number: "04", title: "风与土", english: "MOROCCO / EARTH SCRIPT",
    color: "#c07859", text: "#3b2b25", stripe: "#f0d9bb", height: 246, width: 42, type: "fang",
    cover: "assets/morocco/01-kasbah.jpg", reader: "reader.html?book=morocco",
  },
  {
    id: "tidelines", number: "05", title: "潮汐线", english: "TIDELINES / BLUE DISTANCE",
    color: "#e3d9c3", text: "#283c43", stripe: "#be4b55", height: 292, width: 36, type: "hei",
    cover: "assets/naoshima/06-pier-long.jpg", reader: "reader.html?book=tidelines",
  },
  {
    id: "lava-field", number: "06", title: "熔岩书", english: "LAVA FIELD / AFTER FIRE",
    color: "#b7473d", text: "#f7e6cf", stripe: "#e9b950", height: 338, width: 43, type: "bold",
    cover: "assets/iceland/05-aerial.jpg", reader: "reader.html?book=lava-field",
  },
  {
    id: "dune-notes", number: "07", title: "沙丘志", english: "DUNE NOTES / WIND MAP",
    color: "#d9aa72", text: "#4c3027", stripe: "#6b7850", height: 258, width: 38, type: "kai",
    cover: "assets/morocco/05-dunes.jpg", reader: "reader.html?book=dune-notes",
  },
  {
    id: "white-island", number: "08", title: "白色岛", english: "WHITE ISLAND / QUIET FORM",
    color: "#eee9d8", text: "#183d50", stripe: "#6aa0b7", height: 308, width: 48, type: "song",
    cover: "assets/naoshima/04-lighthouse.jpg", reader: "reader.html?book=white-island",
  },
  {
    id: "north-waves", number: "09", title: "北方浪", english: "NORTH WAVES / COLD TIDE",
    color: "#557e98", text: "#f2e7d4", stripe: "#243b4a", height: 282, width: 40, type: "fang",
    cover: "assets/iceland/03-waves.jpg", reader: "reader.html?book=north-waves",
  },
  {
    id: "earth-city", number: "10", title: "土城记", english: "EARTH CITY / SUN WALL",
    color: "#77463a", text: "#f3dfbd", stripe: "#d98958", height: 322, width: 44, type: "sans",
    cover: "assets/morocco/02-fortress.jpg", reader: "reader.html?book=earth-city",
  },
];

const shelf = document.querySelector("#shelf");
const readerLayer = document.querySelector("#readerLayer");
const bookFrame = document.querySelector("#bookFrame");
const readerBookTitle = document.querySelector("#readerBookTitle");
const readerBookIssue = document.querySelector("#readerBookIssue");
let selectedIndex = 0;
let reading = false;

books.forEach((book, index) => {
  const item = document.createElement("div");
  item.className = `book-item book-item-${index + 1} type-${book.type}`;
  item.style.setProperty("--spine", book.color);
  item.style.setProperty("--spine-text", book.text);
  item.style.setProperty("--stripe", book.stripe);
  item.style.setProperty("--height", `${book.height}px`);
  item.style.setProperty("--width", `${book.width}px`);

  const button = document.createElement("button");
  button.className = "book-spine";
  button.type = "button";
  button.dataset.index = index;
  button.setAttribute("aria-label", `打开《${book.title}》画册`);
  button.innerHTML = `
    <span class="spine-ornament" aria-hidden="true"></span>
    <span class="spine-title"><b>${book.title}</b><em>${book.english.split(" / ")[0]}</em></span>`;
  button.addEventListener("mouseenter", () => { selectedIndex = index; });
  button.addEventListener("focus", () => { selectedIndex = index; });
  button.addEventListener("click", () => openReader(book, true));

  const preview = document.createElement("figure");
  preview.className = "hover-preview";
  preview.setAttribute("aria-hidden", "true");
  preview.innerHTML = `
    <img src="${book.cover}" alt="">
    <figcaption><b>${book.title}</b><span>${book.english}</span><i>CLICK TO OPEN</i></figcaption>`;

  item.append(button, preview);
  shelf.append(item);
});

function openReader(book, updateHash = true) {
  const index = books.findIndex((item) => item.id === book.id);
  if (index >= 0) selectedIndex = index;
  reading = true;
  readerBookTitle.textContent = book.title;
  readerBookIssue.textContent = book.english.split(" / ")[0];
  bookFrame.src = book.reader;
  readerLayer.classList.add("open");
  readerLayer.setAttribute("aria-hidden", "false");
  document.body.classList.add("reading");
  if (updateHash) history.pushState(null, "", `#read/${book.id}`);
  document.querySelector("#closeReader").focus();
}

function closeReader(updateHash = true) {
  if (!reading) return;
  reading = false;
  readerLayer.classList.remove("open");
  readerLayer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("reading");
  bookFrame.src = "about:blank";
  if (updateHash) history.pushState(null, "", `#${books[selectedIndex].id}`);
  document.querySelectorAll(".book-spine")[selectedIndex]?.focus();
}

document.querySelector("#closeReader").addEventListener("click", () => closeReader());

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && reading) closeReader();
  if (reading || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    selectedIndex = (selectedIndex + (event.key === "ArrowRight" ? 1 : -1) + books.length) % books.length;
    document.querySelectorAll(".book-spine")[selectedIndex]?.focus();
  }
});

function applyHash() {
  const raw = location.hash.replace(/^#/, "");
  const wantsReader = raw.startsWith("read/");
  const id = wantsReader ? raw.slice(5) : raw;
  const index = books.findIndex((book) => book.id === id);
  if (index >= 0) selectedIndex = index;
  if (wantsReader && index >= 0 && !reading) openReader(books[index], false);
  if (!wantsReader && reading) closeReader(false);
}

window.addEventListener("hashchange", applyHash);
applyHash();
