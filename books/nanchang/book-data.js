const PHOTO_ROOT = "assets/photos/";
const ART_ROOT = "assets/art/";

const chapters = [
  {
    number: "01", title: "陶艺", phrase: "Hands / Clay / Time",
    note: "旅程从手心开始：泥、釉色和一只还没被命名的小怪兽。",
    hero: "2b3eef1ef0e49de7942fee9d2206863d.jpg", heroAlt: "陶艺转盘上的绿色与黄色手工作品", art: "pottery-print.png",
    pages: [
      { files: ["4250e10aa21fb25ab13e7dd1280b9e3c.jpg", "南昌旅行二_04.jpg", "南昌旅行二_08.jpg", "12af0065c038081cd532100c84d41b36.jpg"], caption: "把形状捏出来，也把这趟旅行捏出了开头。" },
      { files: ["16561a0936c611c49ae5d91a1b40f568.jpg", "513b73e0a9cdb9bc368ef5c690ab21a0.jpg", "8004118e84e3ced2135c5dbcd20460da.jpg", "f500242d8d05f0db94e912357647b8f6.jpg"], caption: "手作之后，用甜和凉把午后接住。" }
    ]
  },
  {
    number: "02", title: "万寿宫", phrase: "Wish / Eaves / Passing",
    note: "飞檐压低了天，手里的福字却轻得刚好。",
    hero: "23b7ee4482e11e34a0d8ed46849129f2.jpg", heroAlt: "万寿宫前手持福字的旅行照片", art: "wanshou-print.png",
    pages: [
      { files: ["03163b950fd15b791486923af9b7347f.jpg", "074fb7b7520135f9b31d50795cbb01a2.jpg", "96c2ff8b066f734fc4b502992e30268b.jpg"], caption: "先看见屋脊，再慢慢走进街巷。" },
      { files: ["088aa79a15c0c94d3ebe85c42a5de114.jpg", "51c4d50394a463ec18a85537a7a5aa50.jpg", "1e06e48e09459e97f3e2002fa8f7c110.jpg"], caption: "红墙把笑脸照得更亮。" },
      { files: ["52084e8d6a5426a444432e10a7e74263.jpg", "1b045c9a629e6e3c83cde6a8cb7a3de5.jpg", "99b27fc5bd3a0bf0d20ef704dc477d74.jpg"], caption: "把祝福举到镜头前，也带回身边。" },
      { files: ["0a22aebf13bea18690928bc9bf9b92d3.jpg", "406ff06ee0501fcbec3b7c04d44fbf44.jpg", "f58d599b7a37f90efe8d6b97dd9aab17.jpg"], caption: "Temple / Street / Souvenir" }
    ]
  },
  {
    number: "03", title: "南昌之星", phrase: "Wheel / Dusk / Friends",
    note: "摩天轮把黄昏切成很多格，每一格里都有同一群人。",
    hero: "015751c4e162a7e3bcda200d1c0eb9a8.jpg", heroAlt: "暮色中的南昌之星摩天轮", art: "ferris-print.png",
    pages: [
      { files: ["33e28ddb9aa6b4250fa205af54cf4d13.jpg", "3cdfa466cf7cce0d2d4085c3305f8917.jpg", "a873d966cd3ebc66af5e7a83a693836d.jpg", "08f06dc5e8d857eeccea7fc9d9b8bd09.jpg"], caption: "同一只巨轮，在天光里换了三次颜色。" },
      { files: ["02c5a80aef60ae3ff21b8ad3771f3e25.jpg", "5004368206a138f5852e191968bee667.jpg", "625e206ba6c24b76f32264f56acf1550.jpg", "d1ca8ecf7e088b9cb7d481764b9a67f3.jpg"], caption: "从高处看城，也在地面留下合影。" },
      { files: ["6803007681d85e4d13ade154f16be0af.jpg", "712995f2f17bd3ff51a59e0dae374256.jpg", "6c770188d298e9c5e5c22d4b12587cee.jpg", "9966fdb2a1860808759254b8a33fcda1.jpg"], caption: "暮色落下以后，镜头转向彼此。" },
      { files: ["91f9b4125b967d78cade70c1c996e584.jpg", "南昌Travel_01.jpg", "南昌旅行一_01.jpg", "南昌旅行一_02.jpg"], caption: "Night / Flash / Print" },
      { files: ["南昌旅行一_03.jpg", "南昌旅行一_04.jpg", "南昌旅行二_01.jpg", "南昌旅行二_02.jpg"], caption: "一张、再一张：同一个夜晚的不同表情。" },
      { files: ["南昌旅行二_03.jpg", "南昌旅行二_06.jpg", "南昌旅行二_07.jpg", "扫描文稿_01.jpg"], caption: "纸面有折痕，笑声没有。" }
    ]
  },
  {
    number: "04", title: "八一广场", phrase: "Sky / Stone / Arrival",
    note: "车站的红星、广场的风和一路穿过城市的脚步。",
    hero: "3105ebc92f290310db9ccf48f4851473.jpg", heroAlt: "蓝天下的南昌站正立面", art: "station-print.png",
    pages: [
      { files: ["531aea9282c35e426d88ef0fbb7acdf2.jpg", "5c22ec1fd8aeb91d3a28e37957a6196d.jpg", "cbcd8d00f8dd800929c253363a490bb3.jpg"], caption: "站前的第一组留影，天很高，人很多。" },
      { files: ["c22505d2b96e70d6d7cc8322e6ca192e.jpg", "db1091629915c9bc9ad28e5d9c041a96.jpg", "eff07e48e590d053d427993afc9bbbac.jpg"], caption: "Square / Table / Cheers" }
    ]
  },
  {
    number: "05", title: "滕王阁", phrase: "Eaves / City / Light",
    note: "旧阁与新城站在同一个画面里，白日与夜色各说一遍。",
    hero: "d3a50ba992de6b6c15b7e1af75ca53d0.jpg", heroAlt: "滕王阁与现代城市天际线", art: "tengwang-print.png",
    pages: [
      { files: ["36cc1d57b9619c82f224b82339fa10b3.jpg", "bebc7a40bbda16c4572d756fb7b41982.jpg", "702cdab459a2a2381abaf20e2ab76760.jpg", "258179b6576aa428cbd43a8c0ae5e325.jpg"], caption: "层层飞檐，把视线一直带向上。" },
      { files: ["d94e4a9f4461f224159bfa726b75b024.jpg", "38099740ce9af2a5e464538259af42b5.jpg", "148e9f75470ca9730638fee1cd5b640e.jpg"], caption: "同一座阁，在灯光里变得更近。" }
    ]
  },
  {
    number: "06", title: "密室合影", phrase: "Fear / Flash / Laughter",
    note: "门关上的时候有点紧张；门打开以后，只剩下笑。",
    hero: "8bd4d77296409f3b4818058e7d0e77a7.jpg", heroAlt: "密室逃脱结束后的朋友合影", art: null,
    pages: [
      { files: ["e511ef211c1e94488de6de5b032bd212.jpg", "4a43022072caafe7ee1ee63f8b212011.jpg", "538688f86f829ce4b617466da0a3fe02.jpg", "89ecec3ffc038bec990fa44d5fb082e8.jpg"], caption: "闯关结束，先把每个人都留在画面里。" },
      { files: ["933c5e1cc096f243a17f72a6ee5747a0.jpg", "b5bf42c0ee45d2565356e4a407bed686.jpg", "d0e46f5cb710b0145037bdbfd91d6675.jpg", "2f6c3b1fb70bc70c0eef3d74ba2bd6ca.jpg"], caption: "快门按下时，表情还没来得及统一。" },
      { files: ["ee43a172b0d05b566ac1259eedd2883c.jpg", "3a773ea9b973bf36eae5ea0f532d510b.jpg", "3bcc72a660d24ef235f0d76010fcf12d.jpg", "c4e2e8317ba195224bb776f0170d89bc.jpg"], caption: "滤镜负责胡闹，镜子负责把大家收进去。" },
      { files: ["20fb98f9c833a8fc17c76522a4609e49.jpg", "86918bbc05426233223cb47a7c47286e.jpg", "c40d13243894077e4499b9492508574a.jpg", "c5c4befa2aae62aef10369eb117ff3b9.jpg"], caption: "照片最后又成为照片，摊开一桌。" }
    ]
  }
];

const book = document.querySelector("#book");
const backCover = book.lastElementChild;
let folio = 1;

function createPage(classNames, label, status = label) {
  const page = document.createElement("article");
  page.className = `book-page art-page ${classNames}`;
  page.setAttribute("aria-label", label);
  page.dataset.status = status;
  return page;
}

function insert(page) { book.insertBefore(page, backCover); }

function sideClass() {
  const nextIndex = book.children.length - 1;
  return nextIndex % 2 === 0 ? "recto" : "verso";
}

function addEndpaper(label) { insert(createPage(`endpaper ${sideClass()}`, label)); }

function addIntro() {
  const page = createPage(`paper ${sideClass()}`, "扉页", "南昌旅行画册");
  page.innerHTML = `<div class="intro-sheet"><p class="eyebrow">NANCHANG · 24—27 SEP 2026</p><h2>不是按景点收藏城市，<br>是按一起走过的记忆。</h2><p class="lead">纪实照片保留当时的光，版画层留下后来想起它时的颜色。六段路，七十九帧，拼成一本可以翻动的旅行记忆。</p></div>`;
  insert(page);
}

function addChapterSpread(chapter) {
  const hasArt = Boolean(chapter.art);
  const source = hasArt ? ART_ROOT + chapter.art : PHOTO_ROOT + chapter.hero;
  const mode = hasArt ? "memory" : "night";

  const left = createPage(`chapter-spread spread-left ${mode} ${sideClass()}`, `第${chapter.number}章 ${chapter.title}跨页左页`, `${chapter.number} · ${chapter.title}`);
  left.innerHTML = `<img class="spread-memory" src="${source}" alt="${hasArt ? "" : chapter.heroAlt}" ${hasArt ? 'aria-hidden="true"' : ""} loading="lazy" decoding="async"><div class="spread-shade" aria-hidden="true"></div><div class="spread-copy"><span class="chapter-index">CHAPTER ${chapter.number}</span><h2>${chapter.title}</h2><p>${chapter.note}</p><span class="phrase">${chapter.phrase}</span></div>`;
  insert(left);

  const right = createPage(`chapter-spread spread-right ${mode} ${sideClass()}`, `第${chapter.number}章 ${chapter.title}跨页右页`, `${chapter.number} · ${chapter.title}`);
  right.innerHTML = `<img class="spread-memory" src="${source}" alt="" aria-hidden="true" loading="lazy" decoding="async"><div class="spread-shade" aria-hidden="true"></div>${hasArt ? `<figure class="spread-photo"><img src="${PHOTO_ROOT + chapter.hero}" alt="${chapter.heroAlt}" loading="lazy" decoding="async"><figcaption>MEMORY / DOCUMENT</figcaption></figure>` : ""}<span class="spread-edge-label">NANCHANG · ${chapter.number}</span>`;
  insert(right);
}

function isScan(file) { return /^(南昌|扫描)/.test(file); }

const ROTATE_CW = new Set([
  "南昌旅行一_01.jpg"
]);

const ROTATE_CCW = new Set([
  "南昌Travel_01.jpg",
  "南昌旅行一_03.jpg",
  "南昌旅行一_04.jpg",
  "南昌旅行二_01.jpg",
  "南昌旅行二_02.jpg",
  "南昌旅行二_03.jpg",
  "南昌旅行二_04.jpg",
  "南昌旅行二_06.jpg",
  "南昌旅行二_07.jpg",
  "南昌旅行二_08.jpg"
]);

function photoClass(file) {
  return [
    isScan(file) ? "scan" : "",
    ROTATE_CW.has(file) ? "orient-cw" : "",
    ROTATE_CCW.has(file) ? "orient-ccw" : ""
  ].filter(Boolean).join(" ");
}

function addPhotoPage(chapter, pageData, pageIndex) {
  const side = sideClass();
  const count = pageData.files.length;
  const page = createPage(`paper collage-page ${side}`, `${chapter.title}照片拼贴`, `${chapter.number} · ${chapter.title}`);
  const figures = pageData.files.map((file, index) => `<figure class="photo-scrap ${photoClass(file)}"><img src="${PHOTO_ROOT + file}" alt="${chapter.title}旅行照片 ${pageIndex + 1}-${index + 1}" loading="lazy" decoding="async"><figcaption>NANCHANG · ${chapter.number}.${String(pageIndex + 1).padStart(2, "0")}</figcaption></figure>`).join("");
  page.innerHTML = `<div class="page-meta"><b>${chapter.number} / ${chapter.title}</b><span>${chapter.phrase}</span></div><div class="collage-field layout-${count}">${figures}</div><p class="page-caption">${pageData.caption}</p><span class="folio">${String(folio).padStart(2, "0")}</span>`;
  folio += 1;
  insert(page);
}

function addClosingPages() {
  const closing = createPage(`closing-page ${sideClass()}`, "尾声", "尾声");
  closing.innerHTML = `<div class="closing-wrap"><p class="eyebrow">AFTER THE LAST PAGE</p><h2>城市留在身后，<br>照片继续往前。</h2><span class="line"></span><p>后来想起南昌，可能先想起屋檐、摩天轮和一张红色的福字；也可能只想起某次举杯、一次闪光灯，和身边的人。</p></div>`;
  insert(closing);
}

addEndpaper("前环衬");
addIntro();
for (const chapter of chapters) {
  addChapterSpread(chapter);
  chapter.pages.forEach((pageData, pageIndex) => addPhotoPage(chapter, pageData, pageIndex));
}
addClosingPages();
addEndpaper("后环衬");
