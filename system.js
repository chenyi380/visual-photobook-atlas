const books = [
  {
    id: "nanchang", number: "01", title: "南昌", english: "NANCHANG / MEMORY LAYERS",
    color: "#aa493b", text: "#f8ead7", stripe: "#d99a69", height: 316, width: 46, type: "song",
    cover: "assets/nanchang-cover.png", reader: "books/nanchang/index.html",
    lat: 28.68, lon: 115.86, place: "NANCHANG · CHINA",
  },
  {
    id: "iceland", number: "02", title: "火与冰", english: "ICELAND / ELEMENTAL SILENCE",
    color: "#294b5c", text: "#f3e9d9", stripe: "#83a8b8", height: 270, width: 39, type: "kai",
    cover: "assets/iceland/02-volcano.jpg", reader: "reader.html?book=iceland",
    lat: 64.96, lon: -19.02, place: "ICELAND · NORTH ATLANTIC",
  },
  {
    id: "naoshima", number: "03", title: "岛与几何", english: "SETOUCHI / BLUE INTERVALS",
    color: "#79a2b5", text: "#173c4d", stripe: "#e8dcc6", height: 328, width: 45, type: "sans",
    cover: "assets/naoshima/02-pier.jpg", reader: "reader.html?book=naoshima",
    lat: 34.46, lon: 133.99, place: "NAOSHIMA · SETOUCHI",
  },
  {
    id: "morocco", number: "04", title: "风与土", english: "MOROCCO / EARTH SCRIPT",
    color: "#c07859", text: "#3b2b25", stripe: "#f0d9bb", height: 246, width: 42, type: "fang",
    cover: "assets/morocco/01-kasbah.jpg", reader: "reader.html?book=morocco",
    lat: 31.79, lon: -7.09, place: "MOROCCO · NORTH AFRICA",
  },
  {
    id: "tidelines", number: "05", title: "潮汐线", english: "TIDELINES / BLUE DISTANCE",
    color: "#e3d9c3", text: "#283c43", stripe: "#be4b55", height: 292, width: 36, type: "hei",
    cover: "assets/naoshima/06-pier-long.jpg", reader: "reader.html?book=tidelines",
    lat: 34.36, lon: 134.03, place: "SETO INLAND SEA · JAPAN",
  },
  {
    id: "lava-field", number: "06", title: "熔岩书", english: "LAVA FIELD / AFTER FIRE",
    color: "#b7473d", text: "#f7e6cf", stripe: "#e9b950", height: 338, width: 43, type: "bold",
    cover: "assets/iceland/05-aerial.jpg", reader: "reader.html?book=lava-field",
    lat: 63.88, lon: -22.45, place: "REYKJANES · ICELAND",
  },
  {
    id: "dune-notes", number: "07", title: "沙丘志", english: "DUNE NOTES / WIND MAP",
    color: "#d9aa72", text: "#4c3027", stripe: "#6b7850", height: 258, width: 38, type: "kai",
    cover: "assets/morocco/05-dunes.jpg", reader: "reader.html?book=dune-notes",
    lat: 31.10, lon: -4.01, place: "MERZOUGA · SAHARA",
  },
  {
    id: "white-island", number: "08", title: "白色岛", english: "WHITE ISLAND / QUIET FORM",
    color: "#eee9d8", text: "#183d50", stripe: "#6aa0b7", height: 308, width: 48, type: "song",
    cover: "assets/naoshima/04-lighthouse.jpg", reader: "reader.html?book=white-island",
    lat: 34.47, lon: 133.98, place: "NAOSHIMA · JAPAN",
  },
  {
    id: "north-waves", number: "09", title: "北方浪", english: "NORTH WAVES / COLD TIDE",
    color: "#557e98", text: "#f2e7d4", stripe: "#243b4a", height: 282, width: 40, type: "fang",
    cover: "assets/iceland/03-waves.jpg", reader: "reader.html?book=north-waves",
    lat: 63.40, lon: -19.04, place: "VÍK · ICELAND",
  },
  {
    id: "earth-city", number: "10", title: "土城记", english: "EARTH CITY / SUN WALL",
    color: "#77463a", text: "#f3dfbd", stripe: "#d98958", height: 322, width: 44, type: "sans",
    cover: "assets/morocco/02-fortress.jpg", reader: "reader.html?book=earth-city",
    lat: 31.05, lon: -7.13, place: "AÏT BENHADDOU · MOROCCO",
  },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const radians = (degrees) => degrees * Math.PI / 180;
const easeInOutCubic = (value) => value < .5 ? 4 * value ** 3 : 1 - ((-2 * value + 2) ** 3) / 2;
const easeOutQuint = (value) => 1 - (1 - value) ** 5;

class StarGlobe {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: true });
    this.textureCanvas = document.createElement("canvas");
    this.textureContext = this.textureCanvas.getContext("2d", { willReadFrequently: true });
    this.sphereCanvas = document.createElement("canvas");
    this.sphereContext = this.sphereCanvas.getContext("2d", { alpha: true });
    this.texture = null;
    this.sphereImage = null;
    this.sphereVectors = null;
    this.stars = [];
    this.yaw = radians(-112);
    this.pitch = radians(-8);
    this.scale = 1;
    this.lastTime = performance.now();
    this.lastSphereTime = 0;
    this.transition = null;
    this.beam = null;
    this.focusBook = null;
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.image = new Image();
    this.image.addEventListener("load", () => this.prepareTexture());
    this.image.src = "assets/earth-blue-marble.jpg";

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    addEventListener("resize", this.resize, { passive: true });
    this.resize();
    requestAnimationFrame(this.render);
  }

  resize() {
    const ratio = Math.min(devicePixelRatio || 1, 1.6);
    this.width = innerWidth;
    this.height = innerHeight;
    this.ratio = ratio;
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.centerX = this.width * .5;
    this.centerY = this.height * (this.width < 720 ? .48 : .53);
    this.baseRadius = this.width < 720
      ? Math.min(this.width * .69, this.height * .34, 330)
      : Math.min(this.width * .36, this.height * .44, 540);
    this.makeStars();
    this.prepareSphereGrid();
  }

  makeStars() {
    let seed = 81329;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const count = Math.round(clamp(this.width * this.height / 5200, 150, 420));
    this.stars = Array.from({ length: count }, (_, index) => ({
      x: random() * this.width,
      y: random() * this.height,
      radius: .25 + random() * (index % 29 === 0 ? 2.2 : 1.1),
      alpha: .25 + random() * .72,
      phase: random() * Math.PI * 2,
      blue: random() > .72,
    }));
  }

  prepareTexture() {
    this.textureCanvas.width = 1024;
    this.textureCanvas.height = 512;
    this.textureContext.drawImage(this.image, 0, 0, 1024, 512);
    this.texture = this.textureContext.getImageData(0, 0, 1024, 512).data;
    this.lastSphereTime = 0;
  }

  prepareSphereGrid() {
    const size = this.width < 720 ? 230 : 360;
    if (this.sphereCanvas.width === size && this.sphereVectors) return;
    this.sphereCanvas.width = size;
    this.sphereCanvas.height = size;
    this.sphereImage = this.sphereContext.createImageData(size, size);
    const total = size * size;
    const x = new Float32Array(total);
    const y = new Float32Array(total);
    const z = new Float32Array(total);
    const edge = new Float32Array(total);
    for (let py = 0; py < size; py += 1) {
      for (let px = 0; px < size; px += 1) {
        const index = py * size + px;
        const nx = (px + .5) / size * 2 - 1;
        const ny = 1 - (py + .5) / size * 2;
        const distance = nx * nx + ny * ny;
        if (distance > 1) {
          z[index] = -1;
          continue;
        }
        x[index] = nx;
        y[index] = ny;
        z[index] = Math.sqrt(1 - distance);
        edge[index] = clamp(z[index] * 9, 0, 1);
      }
    }
    this.sphereVectors = { x, y, z, edge };
  }

  nearestAngle(target, current) {
    let result = target;
    while (result - current > Math.PI) result -= Math.PI * 2;
    while (result - current < -Math.PI) result += Math.PI * 2;
    return result;
  }

  flyTo(book, start, onComplete) {
    const now = performance.now();
    const targetYaw = this.nearestAngle(-radians(book.lon), this.yaw);
    this.transition = {
      start: now,
      duration: this.reducedMotion ? 80 : 1850,
      fromYaw: this.yaw,
      toYaw: targetYaw,
      fromPitch: this.pitch,
      toPitch: clamp(radians(book.lat), radians(-68), radians(68)),
      fromScale: this.scale,
      toScale: this.width < 720 ? 1.22 : 1.34,
      onComplete,
    };
    this.beam = { start, startedAt: now, duration: this.transition.duration, book };
    this.focusBook = book;
  }

  releaseFocus() {
    const now = performance.now();
    this.transition = {
      start: now,
      duration: this.reducedMotion ? 40 : 900,
      fromYaw: this.yaw,
      toYaw: this.yaw + radians(10),
      fromPitch: this.pitch,
      toPitch: radians(-8),
      fromScale: this.scale,
      toScale: 1,
      onComplete: null,
    };
    this.beam = null;
    this.focusBook = null;
  }

  update(time) {
    const delta = Math.min(time - this.lastTime, 80);
    this.lastTime = time;
    if (this.transition) {
      const progress = clamp((time - this.transition.start) / this.transition.duration, 0, 1);
      const eased = easeInOutCubic(progress);
      this.yaw = this.transition.fromYaw + (this.transition.toYaw - this.transition.fromYaw) * eased;
      this.pitch = this.transition.fromPitch + (this.transition.toPitch - this.transition.fromPitch) * eased;
      this.scale = this.transition.fromScale + (this.transition.toScale - this.transition.fromScale) * easeOutQuint(progress);
      if (progress >= 1) {
        const callback = this.transition.onComplete;
        this.transition = null;
        if (callback) callback();
      }
    } else if (!this.reducedMotion) {
      this.yaw += delta * .000035;
    }
  }

  drawSpace(time) {
    const context = this.context;
    const background = context.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, Math.max(this.width, this.height) * .82);
    background.addColorStop(0, "#10253a");
    background.addColorStop(.27, "#060d19");
    background.addColorStop(.68, "#02040a");
    background.addColorStop(1, "#000105");
    context.fillStyle = background;
    context.fillRect(0, 0, this.width, this.height);

    const nebula = context.createRadialGradient(this.width * .18, this.height * .28, 0, this.width * .18, this.height * .28, this.width * .36);
    nebula.addColorStop(0, "rgba(91, 40, 88, .13)");
    nebula.addColorStop(.55, "rgba(32, 56, 92, .055)");
    nebula.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = nebula;
    context.fillRect(0, 0, this.width, this.height);

    for (const star of this.stars) {
      const pulse = this.reducedMotion ? 1 : .72 + Math.sin(time * .00115 + star.phase) * .28;
      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fillStyle = star.blue
        ? `rgba(164, 214, 255, ${star.alpha * pulse})`
        : `rgba(255, 245, 221, ${star.alpha * pulse})`;
      context.fill();
    }

    const cycle = (time * .000055) % 1;
    if (!this.reducedMotion && cycle < .22) {
      const progress = cycle / .22;
      const x = this.width * (.84 - progress * .28);
      const y = this.height * (.14 + progress * .19);
      const gradient = context.createLinearGradient(x + 110, y - 72, x, y);
      gradient.addColorStop(0, "rgba(132, 206, 255, 0)");
      gradient.addColorStop(1, `rgba(213, 239, 255, ${Math.sin(progress * Math.PI) * .65})`);
      context.strokeStyle = gradient;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x + 110, y - 72);
      context.lineTo(x, y);
      context.stroke();
    }
  }

  renderSphereTexture(time) {
    if (!this.texture || !this.sphereVectors || time - this.lastSphereTime < (this.reducedMotion ? 120 : 34)) return;
    this.lastSphereTime = time;
    const { x, y, z, edge } = this.sphereVectors;
    const output = this.sphereImage.data;
    const texture = this.texture;
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);
    const width = 1024;
    const height = 512;

    for (let index = 0; index < z.length; index += 1) {
      const outputIndex = index * 4;
      if (z[index] < 0) {
        output[outputIndex + 3] = 0;
        continue;
      }

      const cameraX = x[index];
      const cameraY = y[index];
      const cameraZ = z[index];
      const worldY = cameraY * cosPitch + cameraZ * sinPitch;
      const unpitchedZ = -cameraY * sinPitch + cameraZ * cosPitch;
      const worldX = cameraX * cosYaw - unpitchedZ * sinYaw;
      const worldZ = cameraX * sinYaw + unpitchedZ * cosYaw;
      const longitude = Math.atan2(worldX, worldZ);
      const latitude = Math.asin(clamp(worldY, -1, 1));
      const tx = ((longitude / (Math.PI * 2) + .5 + 1) % 1 * width) | 0;
      const ty = clamp(((.5 - latitude / Math.PI) * height) | 0, 0, height - 1);
      const sourceIndex = (ty * width + tx) * 4;

      const sun = cameraX * -.42 + cameraY * .36 + cameraZ * .83;
      const day = clamp((sun + .24) / .88, 0, 1);
      const light = .075 + day * .94;
      const blueRim = (1 - cameraZ) ** 2 * .22;
      output[outputIndex] = clamp(texture[sourceIndex] * light + 24 * blueRim, 0, 255);
      output[outputIndex + 1] = clamp(texture[sourceIndex + 1] * light + 86 * blueRim, 0, 255);
      output[outputIndex + 2] = clamp(texture[sourceIndex + 2] * light + 150 * blueRim, 0, 255);
      output[outputIndex + 3] = edge[index] * 255;
    }
    this.sphereContext.putImageData(this.sphereImage, 0, 0);
  }

  drawGlobe(time) {
    const context = this.context;
    const radius = this.baseRadius * this.scale;
    const x = this.centerX;
    const y = this.centerY;

    context.save();
    const aura = context.createRadialGradient(x, y, radius * .78, x, y, radius * 1.18);
    aura.addColorStop(0, "rgba(62, 152, 220, 0)");
    aura.addColorStop(.64, "rgba(68, 169, 239, .08)");
    aura.addColorStop(.82, "rgba(100, 195, 255, .2)");
    aura.addColorStop(1, "rgba(57, 133, 207, 0)");
    context.fillStyle = aura;
    context.fillRect(x - radius * 1.22, y - radius * 1.22, radius * 2.44, radius * 2.44);

    context.save();
    context.shadowColor = "rgba(74, 174, 239, .55)";
    context.shadowBlur = Math.max(18, radius * .07);
    context.drawImage(this.sphereCanvas, x - radius, y - radius, radius * 2, radius * 2);
    context.restore();

    const gloss = context.createRadialGradient(x - radius * .32, y - radius * .34, radius * .03, x - radius * .12, y - radius * .16, radius * 1.02);
    gloss.addColorStop(0, "rgba(220, 245, 255, .19)");
    gloss.addColorStop(.35, "rgba(108, 189, 239, .045)");
    gloss.addColorStop(.72, "rgba(0, 0, 0, 0)");
    gloss.addColorStop(1, "rgba(0, 0, 0, .32)");
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = gloss;
    context.fill();
    context.strokeStyle = "rgba(156, 219, 255, .55)";
    context.lineWidth = Math.max(1, radius * .004);
    context.stroke();
    context.restore();

    if (this.focusBook) this.drawLocation(this.focusBook, time, radius);
  }

  project(lat, lon, radius = this.baseRadius * this.scale) {
    const latitude = radians(lat);
    const longitude = radians(lon);
    const worldX = Math.cos(latitude) * Math.sin(longitude);
    const worldY = Math.sin(latitude);
    const worldZ = Math.cos(latitude) * Math.cos(longitude);
    const yawX = worldX * Math.cos(this.yaw) + worldZ * Math.sin(this.yaw);
    const yawZ = -worldX * Math.sin(this.yaw) + worldZ * Math.cos(this.yaw);
    const pitchY = worldY * Math.cos(this.pitch) - yawZ * Math.sin(this.pitch);
    const pitchZ = worldY * Math.sin(this.pitch) + yawZ * Math.cos(this.pitch);
    return {
      x: this.centerX + yawX * radius,
      y: this.centerY - pitchY * radius,
      visible: pitchZ > 0,
      depth: pitchZ,
    };
  }

  drawLocation(book, time, radius) {
    const point = this.project(book.lat, book.lon, radius);
    if (!point.visible) return;
    const context = this.context;
    const pulse = 8 + Math.sin(time * .007) * 2.5;
    context.save();
    context.shadowColor = "#8edbff";
    context.shadowBlur = 16;
    context.strokeStyle = "rgba(175, 230, 255, .9)";
    context.lineWidth = 1;
    context.beginPath();
    context.arc(point.x, point.y, pulse, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(point.x, point.y, 2.2, 0, Math.PI * 2);
    context.fillStyle = "#f7fbff";
    context.fill();
    context.restore();

    if (!this.transition || (time - this.transition.start) / this.transition.duration > .68) {
      const side = point.x > this.width * .72 ? -1 : 1;
      const labelX = point.x + side * 24;
      context.save();
      context.strokeStyle = "rgba(174, 226, 255, .62)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(point.x + side * 9, point.y);
      context.lineTo(labelX, point.y);
      context.lineTo(labelX + side * 52, point.y);
      context.stroke();
      context.fillStyle = "rgba(226, 244, 255, .92)";
      context.font = "600 9px Inter, Arial, sans-serif";
      context.textAlign = side > 0 ? "left" : "right";
      context.fillText(book.place, labelX + side * 6, point.y - 7);
      context.fillStyle = "rgba(160, 206, 231, .72)";
      context.font = "500 7px Inter, Arial, sans-serif";
      context.fillText(`${book.lat.toFixed(2)}° / ${book.lon.toFixed(2)}°`, labelX + side * 6, point.y + 10);
      context.restore();
    }
  }

  drawBeam(time) {
    if (!this.beam) return;
    const progress = clamp((time - this.beam.startedAt) / this.beam.duration, 0, 1);
    if (progress >= .96) return;
    const eased = easeInOutCubic(progress);
    const start = this.beam.start;
    const end = { x: this.centerX, y: this.centerY };
    const control = {
      x: start.x + (end.x - start.x) * .42,
      y: Math.min(start.y, end.y) - this.height * .2,
    };
    const pointAt = (value) => {
      const inverse = 1 - value;
      return {
        x: inverse * inverse * start.x + 2 * inverse * value * control.x + value * value * end.x,
        y: inverse * inverse * start.y + 2 * inverse * value * control.y + value * value * end.y,
      };
    };
    const head = pointAt(eased);
    const tail = pointAt(Math.max(0, eased - .2 - progress * .05));
    const context = this.context;
    const gradient = context.createLinearGradient(tail.x, tail.y, head.x, head.y);
    gradient.addColorStop(0, "rgba(87, 181, 255, 0)");
    gradient.addColorStop(.66, `rgba(96, 202, 255, ${.38 + progress * .32})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, .98)");
    context.save();
    context.globalCompositeOperation = "screen";
    context.strokeStyle = gradient;
    context.lineWidth = 2 + progress * 3;
    context.shadowColor = "#65caff";
    context.shadowBlur = 18;
    context.beginPath();
    context.moveTo(tail.x, tail.y);
    const steps = 16;
    for (let step = 1; step <= steps; step += 1) {
      const value = Math.max(0, eased - .2) + (eased - Math.max(0, eased - .2)) * step / steps;
      const point = pointAt(value);
      context.lineTo(point.x, point.y);
    }
    context.stroke();
    context.beginPath();
    context.arc(head.x, head.y, 3 + progress * 2, 0, Math.PI * 2);
    context.fillStyle = "#f9fdff";
    context.fill();
    context.restore();
  }

  render(time) {
    this.update(time);
    this.drawSpace(time);
    this.renderSphereTexture(time);
    this.drawGlobe(time);
    this.drawBeam(time);
    requestAnimationFrame(this.render);
  }
}

const shelf = document.querySelector("#shelf");
const readerLayer = document.querySelector("#readerLayer");
const bookFrame = document.querySelector("#bookFrame");
const readerBookTitle = document.querySelector("#readerBookTitle");
const readerBookIssue = document.querySelector("#readerBookIssue");
const journeyStatus = document.querySelector("#journeyStatus");
const locationReadout = document.querySelector("#locationReadout");
const globe = new StarGlobe(document.querySelector("#spaceCanvas"));
let selectedIndex = 0;
let reading = false;
let journeyActive = false;

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
  button.setAttribute("aria-label", `打开《${book.title}》画册，前往${book.place}`);
  button.innerHTML = `
    <span class="spine-ornament" aria-hidden="true"></span>
    <span class="spine-title"><b>${book.title}</b><em>${book.english.split(" / ")[0]}</em></span>`;
  button.addEventListener("mouseenter", () => selectBook(index));
  button.addEventListener("focus", () => selectBook(index));
  button.addEventListener("click", () => beginJourney(book, button));

  const preview = document.createElement("figure");
  preview.className = "hover-preview";
  preview.setAttribute("aria-hidden", "true");
  preview.innerHTML = `
    <img src="${book.cover}" alt="">
    <figcaption><b>${book.title}</b><span>${book.english}</span><i>CLICK TO LOCATE</i></figcaption>`;

  item.append(button, preview);
  shelf.append(item);
});

function selectBook(index) {
  selectedIndex = index;
  const book = books[index];
  locationReadout.textContent = `${book.place} · ${book.lat.toFixed(1)}° ${book.lon.toFixed(1)}°`;
}

function beginJourney(book, button) {
  if (journeyActive || reading) return;
  const index = books.findIndex((item) => item.id === book.id);
  selectedIndex = index;
  journeyActive = true;
  const rect = button.getBoundingClientRect();
  const item = button.closest(".book-item");
  item.classList.add("departing");
  document.body.classList.add("journey-active");
  journeyStatus.textContent = `正在定位 ${book.place}`;
  journeyStatus.classList.add("visible");
  locationReadout.textContent = `${book.place} · LOCKING COORDINATES`;

  globe.flyTo(book, { x: rect.left + rect.width / 2, y: rect.top + rect.height * .35 }, () => {
    journeyStatus.textContent = `${book.title} · 记忆坐标已抵达`;
    setTimeout(() => openReader(book, true), globe.reducedMotion ? 40 : 260);
  });
}

function resetJourney() {
  journeyActive = false;
  document.body.classList.remove("journey-active");
  document.querySelectorAll(".book-item.departing").forEach((item) => item.classList.remove("departing"));
  journeyStatus.classList.remove("visible");
  locationReadout.textContent = "AUTO ORBIT";
  globe.releaseFocus();
}

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
  resetJourney();
  if (updateHash) history.pushState(null, "", `#${books[selectedIndex].id}`);
  document.querySelectorAll(".book-spine")[selectedIndex]?.focus();
}

document.querySelector("#closeReader").addEventListener("click", () => closeReader());

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && reading) closeReader();
  if (reading || journeyActive || event.altKey || event.ctrlKey || event.metaKey) return;
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
  if (index >= 0) {
    selectedIndex = index;
    selectBook(index);
  }
  if (wantsReader && index >= 0 && !reading) openReader(books[index], false);
  if (!wantsReader && reading) closeReader(false);
}

window.addEventListener("hashchange", applyHash);
applyHash();
