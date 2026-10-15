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
    this.effectsCanvas = document.querySelector("#effectsCanvas");
    this.effectsContext = this.effectsCanvas.getContext("2d", { alpha: true });
    this.orbitCanvas = document.querySelector('#orbitCanvas');
    this.orbitContext = this.orbitCanvas.getContext('2d', {alpha:true});
    this.galaxyImage = new Image();
    this.galaxyImage.onload = () => { this.canvas.dataset.galaxy = 'ready'; };
    this.galaxyImage.src = 'assets/nasa-starmap-8k.jpg';
    this.skySeconds = 0;
    try { this.skyRenderer = new SkySphereRenderer(document.querySelector('#skyCanvas')); }
    catch(error) { this.skyRenderer = null; console.info('Using photographic sky fallback',error.message); }
    try {
      this.meshRenderer = new EarthMeshRenderer(document.querySelector("#earthCanvas"));
      this.canvas.dataset.renderer = "webgl-sphere";
    } catch (error) {
      this.meshRenderer = null;
      this.canvas.dataset.renderer = "software-sphere";
      console.info("Using compatible software sphere renderer", error.message);
    }
    document.body.dataset.renderer=this.canvas.dataset.renderer;
    document.querySelector("#earthCanvas").addEventListener("webglcontextlost", event => {
      event.preventDefault();
      this.meshRenderer = null;
      document.querySelector("#earthCanvas").style.visibility = "hidden";
      this.canvas.dataset.renderer = "software-sphere";
      document.body.dataset.renderer='software-sphere';
      this.lastSphereTime = 0;
    });
    this.textureCanvas = document.createElement("canvas");
    this.textureContext = this.textureCanvas.getContext("2d", { willReadFrequently: true });
    this.sphereCanvas = document.createElement("canvas");
    this.sphereContext = this.sphereCanvas.getContext("2d", { alpha: true });
    this.texture = null;
    this.sphereImage = null;
    this.sphereVectors = null;
    this.stars = [];
    this.yaw = radians(-112);
    this.pitch = radians(15);
    this.scale = 1;
    this.lastTime = performance.now();
    this.lastSphereTime = 0;
    this.transition = null;
    this.beam = null;
    this.focusBook = null;
    this.ready = false;
    this.readyPromise = new Promise(resolve => { this.resolveReady = resolve; });
    this.frameCount = 0;
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.image = new Image();
    this.nightImage = new Image();
    const prepare = () => {
      if (this.image.complete && this.image.naturalWidth && this.nightImage.complete && this.nightImage.naturalWidth) this.prepareTexture();
    };
    this.image.addEventListener("load", prepare);
    this.nightImage.addEventListener("load", prepare);
    this.image.addEventListener("error", () => {
      this.canvas.dataset.surface = "error";
      document.querySelector("#journeyStatus").textContent = "地球影像加载失败，请刷新重试";
      document.querySelector("#journeyStatus").classList.add("visible");
    });
    this.image.src = ATLAS_EARTH_TEXTURE;
    this.nightImage.src = ATLAS_NIGHT_TEXTURE;

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    addEventListener("resize", this.resize, { passive: true });
    this.resize();
    requestAnimationFrame(this.render);
  }

  resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    this.width = innerWidth;
    this.height = innerHeight;
    this.ratio = ratio;
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.effectsCanvas.width = Math.round(this.width * ratio);
    this.effectsCanvas.height = Math.round(this.height * ratio);
    this.effectsContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.orbitCanvas.width = Math.round(this.width * ratio);
    this.orbitCanvas.height = Math.round(this.height * ratio);
    this.orbitContext.setTransform(ratio,0,0,ratio,0,0);
    this.meshRenderer?.resize(this.width, this.height, ratio);
    this.skyRenderer?.resize(this.width,this.height,ratio);
    this.centerX = this.width * .5;
    this.restCenterY = this.height * (this.libraryOpened ? .54 : .43);
    this.centerY = this.restCenterY;
    this.bookRadius = this.width < 720
      ? Math.min(this.width * .27, this.height * .21, 260)
      : Math.min(this.width * .18, this.height * .24, 520);
    this.planetRadius=Math.min(this.width*.17,this.height*.225);
    this.planetBaseUnit = this.planetUnit = this.planetRadius/1.24;
    this.baseRadius = this.targetRadius = this.libraryOpened ? this.bookRadius : this.planetRadius;
    this.prepareSphereGrid();
  }

  setLibraryMode(opened) {
    this.libraryOpened=opened;
    this.targetRadius=opened ? this.bookRadius : this.planetRadius;
    this.restCenterY=this.height*(opened ? .54 : .43);
  }


  prepareTexture() {
    if (this.meshRenderer) {
      try {
        this.meshRenderer.setTexture(this.image, this.nightImage);
      } catch (error) {
        this.meshRenderer = null;
        document.querySelector("#earthCanvas").style.visibility = "hidden";
        this.canvas.dataset.renderer = "software-sphere";
        document.body.dataset.renderer='software-sphere';
        console.info("Texture uploaded to compatible renderer", error.message);
      }
    }
    this.textureCanvas.width = 1024;
    this.textureCanvas.height = 512;
    this.textureContext.drawImage(this.image, 0, 0, 1024, 512);
    this.texture = this.textureContext.getImageData(0, 0, 1024, 512).data;
    this.textureContext.drawImage(this.nightImage, 0, 0, 1024, 512);
    this.nightTexture = this.textureContext.getImageData(0, 0, 1024, 512).data;
    this.lastSphereTime = 0;
    this.ready = true;
    this.canvas.dataset.surface = "ready";
    this.resolveReady();
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
      duration: this.reducedMotion ? 120 : 3200,
      fromYaw: this.yaw,
      toYaw: targetYaw,
      fromPitch: this.pitch,
      toPitch: clamp(radians(book.lat), radians(-68), radians(68)),
      fromScale: this.scale,
      toScale: this.width < 720 ? 3.4 : 4.1,
      fromCenterY: this.centerY,
      toCenterY: this.height * (this.width < 720 ? .34 : .45),
      onComplete,
    };
    this.beam = { start, startedAt: now, duration: this.transition.duration, book };
    this.focusBook = book;
  }

  previewTo(book) {
    this.manualUntil=0;
    const now = performance.now();
    this.focusBook = book;
    this.beam = null;
    this.transition = {
      start: now, duration: this.reducedMotion ? 80 : 1200,
      fromYaw: this.yaw, toYaw: this.nearestAngle(-radians(book.lon)+radians(8), this.yaw),
      fromPitch: this.pitch, toPitch: radians(book.lat)-radians(23),
      fromScale: this.scale, toScale: 1,
      fromCenterY: this.centerY, toCenterY: this.restCenterY,
      onComplete: null,
    };
  }

  releaseFocus() {
    if(this.dragging)return;
    const now = performance.now();
    this.transition = {
      start: now,
      duration: this.reducedMotion ? 40 : 900,
      fromYaw: this.yaw,
      toYaw: this.yaw + radians(10),
      fromPitch: this.pitch,
      toPitch: radians(15),
      fromScale: this.scale,
      toScale: 1,
      fromCenterY: this.centerY,
      toCenterY: this.restCenterY,
      onComplete: null,
    };
    this.beam = null;
    this.focusBook = null;
  }

  update(time) {
    const delta = Math.min(time - this.lastTime, 80);
    this.lastTime = time;
    if(!this.reducedMotion) this.skySeconds=(this.skySeconds??0)+Math.max(0,delta)/1000;
    if(this.targetRadius) this.baseRadius+=(this.targetRadius-this.baseRadius)*(this.reducedMotion?1:Math.min(Math.max(delta,0)/240,1));
    this.dragController?.update(delta,time);
    if (this.dragging) return;
    if (this.transition) {
      const progress = clamp((time - this.transition.start) / this.transition.duration, 0, 1);
      const eased = easeInOutCubic(clamp(progress / .72, 0, 1));
      this.yaw = this.transition.fromYaw + (this.transition.toYaw - this.transition.fromYaw) * eased;
      this.pitch = this.transition.fromPitch + (this.transition.toPitch - this.transition.fromPitch) * eased;
      const zoom = easeInOutCubic(clamp((progress - .15) / .85, 0, 1));
      this.scale = this.transition.fromScale + (this.transition.toScale - this.transition.fromScale) * zoom;
      this.centerY = this.transition.fromCenterY + (this.transition.toCenterY - this.transition.fromCenterY) * zoom;
      if (progress >= 1) {
        const callback = this.transition.onComplete;
        this.transition = null;
        if (callback) callback();
      }
    } else if (!this.reducedMotion && !this.focusBook && time>(this.manualUntil??0) && !document.body.classList.contains("reading")) {
      this.yaw += delta * .000033;
    }
  }

  drawSpace() {
    const context=this.context;
    if(this.skyRenderer?.ready){
      context.clearRect(0,0,this.width,this.height);
      this.skyRenderer.draw(this.skySeconds,this.reducedMotion);
      return;
    }
    context.fillStyle='#000';context.fillRect(0,0,this.width,this.height);
    if(this.galaxyImage.complete&&this.galaxyImage.naturalWidth){
      const image=this.galaxyImage,unit=Math.max(this.width/image.width,this.height/image.height);
      context.drawImage(image,(this.width-image.width*unit)/2,(this.height-image.height*unit)/2,image.width*unit,image.height*unit);
    }
  }

  renderSphereTexture(time) {
    if (this.meshRenderer || !this.texture || !this.sphereVectors || time - this.lastSphereTime < (this.reducedMotion ? 120 : 34)) return;
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

      const sun = cameraX * .53 + cameraY * .61 - cameraZ * .58;
      const day = clamp(sun / .65, 0, 1);
      const light = .20 + day * .65;
      const night = this.nightTexture;
      const emission = clamp((night[sourceIndex] - 20) / 90, 0, 1) * (1 - day);
      const blueRim = (1 - cameraZ) ** 5 * (.08 + Math.max(0, cameraX * .65 + cameraY * .76));
      output[outputIndex] = clamp(texture[sourceIndex] * light * .8 + night[sourceIndex] * emission * 2.35 + 55 * blueRim, 0, 255);
      output[outputIndex + 1] = clamp(texture[sourceIndex + 1] * light + night[sourceIndex + 1] * emission * 1.75 + 130 * blueRim, 0, 255);
      output[outputIndex + 2] = clamp(texture[sourceIndex + 2] * light * 1.4 + night[sourceIndex + 2] * emission + 215 * blueRim, 0, 255);
      output[outputIndex + 3] = edge[index] * 255;
    }
    this.sphereContext.putImageData(this.sphereImage, 0, 0);
  }

  drawGlobe(time) {
    const context = this.effectsContext;
    const radius = this.baseRadius * this.scale;
    const x = this.centerX;
    const y = this.centerY;

    context.save();
    const aura = context.createRadialGradient(x, y, radius * .78, x, y, radius * 1.18);
    aura.addColorStop(0, "rgba(62, 152, 220, 0)");
    aura.addColorStop(.64, "rgba(68, 169, 239, .015)");
    aura.addColorStop(.82, "rgba(100, 195, 255, .09)");
    aura.addColorStop(1, "rgba(57, 133, 207, 0)");
    context.fillStyle = aura;
    context.fillRect(x - radius * 1.22, y - radius * 1.22, radius * 2.44, radius * 2.44);

    // Directional atmospheric scattering, aligned with the renderer's sunlight.
    if(this.libraryOpened){
      const hx=x+radius*.63,hy=y-radius*.77;
      const horizon=context.createRadialGradient(hx,hy,0,hx,hy,radius*.24);
      horizon.addColorStop(0,'rgba(239,250,255,.72)');horizon.addColorStop(.16,'rgba(209,235,255,.45)');
      horizon.addColorStop(.44,'rgba(116,187,255,.16)');horizon.addColorStop(1,'rgba(84,149,236,0)');
      context.fillStyle=horizon;context.fillRect(hx-radius*.24,hy-radius*.24,radius*.48,radius*.48);
    }

    context.save();
    context.shadowColor = "rgba(74, 174, 239, .55)";
    context.shadowBlur = Math.max(18, radius * .07);
    if (!this.meshRenderer) context.drawImage(this.sphereCanvas, x - radius, y - radius, radius * 2, radius * 2);
    context.restore();

    const gloss = context.createRadialGradient(x - radius * .32, y - radius * .34, radius * .03, x - radius * .12, y - radius * .16, radius * 1.02);
    gloss.addColorStop(0, "rgba(220, 245, 255, .015)");
    gloss.addColorStop(.35, "rgba(108, 189, 239, .01)");
    gloss.addColorStop(.72, "rgba(0, 0, 0, 0)");
    gloss.addColorStop(1, "rgba(0, 0, 0, .32)");
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = gloss;
    context.fill();
    context.strokeStyle = "rgba(156, 219, 255, .24)";
    context.lineWidth = .65;
    context.stroke();
    context.strokeStyle = "rgba(170, 223, 255, .65)";
    context.lineWidth = 1.4;
    context.shadowColor = "#8ed8ff";
    context.shadowBlur = 12;
    context.beginPath();
    context.arc(x, y, radius + .5, -1.28, -.12);
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
    const context = this.effectsContext;
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

  }

  drawBeam(time) {
    if (!this.beam) return;
    const progress = clamp((time - this.beam.startedAt) / this.beam.duration, 0, 1);
    if (progress >= .96) return;
    const eased = easeInOutCubic(progress);
    const start = this.beam.start;
    const end = this.project(this.beam.book.lat, this.beam.book.lon);
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
    const context = this.effectsContext;
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
    if (document.body.classList.contains("reading")) {
      this.lastTime = time;
      requestAnimationFrame(this.render);
      return;
    }
    this.update(time);
    this.effectsContext.clearRect(0, 0, this.width, this.height);
    if (this.onFrame) this.onFrame(time);
    this.drawSpace(time);
    this.renderSphereTexture(time);
    this.meshRenderer?.draw(this, this.reducedMotion ? 0 : time);
    this.drawGlobe(time);
    this.drawBeam(time);
    this.frameCount++;
    if (this.frameCount % 12 === 0) {
      this.canvas.dataset.yaw = this.yaw.toFixed(4);
      this.canvas.dataset.pitch = this.pitch.toFixed(4);
      this.canvas.dataset.zoom = this.scale.toFixed(3);
      this.canvas.dataset.frame = String(this.frameCount);
    }
    requestAnimationFrame(this.render);
  }
}
