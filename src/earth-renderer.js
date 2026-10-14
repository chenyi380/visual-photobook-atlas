// A real triangulated 3D sphere. Texture and code are bundled together at build time.
class EarthMeshRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!this.gl) throw new Error("WebGL unavailable; using the software sphere renderer");
    this.ready = false;
    this.initialize();
  }

  initialize() {
    const gl = this.gl;
    const vertex = `
      attribute vec3 aPosition;
      attribute vec2 aUV;
      uniform vec2 uViewport;
      uniform vec2 uCenter;
      uniform float uRadius;
      uniform float uYaw;
      uniform float uPitch;
      uniform float uLayer;
      uniform float uTime;
      uniform float uDepth;
      uniform float uDepthRadius;
      varying vec2 vUV;
      varying vec3 vNormal;
      void main() {
        float rotation = uYaw + uLayer * uTime * 0.002;
        float cy = cos(rotation), sy = sin(rotation);
        float cp = cos(uPitch), sp = sin(uPitch);
        vec3 n = vec3(aPosition.x * cy + aPosition.z * sy, aPosition.y,
                      -aPosition.x * sy + aPosition.z * cy);
        n = vec3(n.x, n.y * cp - n.z * sp, n.y * sp + n.z * cp);
        vec2 pixel = vec2(uCenter.x + n.x * uRadius, uCenter.y - n.y * uRadius);
        gl_Position = vec4(pixel.x / uViewport.x * 2.0 - 1.0,
                           1.0 - pixel.y / uViewport.y * 2.0, -(uDepth+n.z*uDepthRadius*(1.0+uLayer*.006))*.18, 1.0);
        vNormal = n;
        vUV = aUV;
      }
    `;
    const fragment = `
      precision highp float;
      uniform sampler2D uEarth;
      uniform sampler2D uNight;
      uniform float uLayer;
      uniform float uPlanet;
      uniform float uAlpha;
      uniform vec3 uPalette;
      varying vec2 vUV;
      varying vec3 vNormal;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 surface = texture2D(uEarth, vUV).rgb;
        vec3 night = texture2D(uNight, vUV).rgb;
        vec3 sun = normalize(vec3(0.72, 0.68, -0.32));
        if(uPlanet>.5){
          float bands=sin(vUV.y*100.+sin(vUV.x*37.)*1.8)*.10;
          float terrain=sin(vUV.x*73.+sin(vUV.y*39.)*2.)*sin(vUV.y*59.)*.10;
          vec3 planet=uPalette*(.83+bands+terrain);
          // Presentation fill light keeps these navigation objects readable against the sky.
          float shade=.46+max(dot(normal,sun),0.)*.82;
          gl_FragColor=vec4(planet*shade+uPalette*pow(1.-max(normal.z,0.),4.)*.20,uAlpha);
          return;
        }
        float daylight = smoothstep(-0.05, 0.72, dot(normal, sun));
        float rim = pow(1.0 - max(normal.z, 0.0), 5.0);
        if (uLayer > 0.5) {
          float whiteness = min(surface.r, min(surface.g, surface.b));
          float cloud = smoothstep(0.66, 0.95, whiteness);
          cloud *= smoothstep(0.08, 0.2, vUV.y) * (1.0 - smoothstep(0.8, 0.92, vUV.y));
          gl_FragColor = vec4(vec3(0.64, 0.77, 0.93) * (0.24 + daylight * 0.9), cloud * 0.23);
          return;
        }
        float lightMask = smoothstep(0.035, 0.36, max(night.r, max(night.g, night.b)));
        vec3 color = surface * vec3(0.17, 0.24, 0.43) + surface * daylight * 0.72;
        color += night * lightMask * vec3(2.85, 1.95, 0.70) * (1.0 - daylight * 0.70);
        float ocean = clamp((surface.b - surface.r) * 5.0, 0.0, 1.0);
        float specular = pow(max(dot(reflect(-sun, normal), vec3(0.0, 0.0, 1.0)), 0.0), 38.0);
        color += vec3(0.45, 0.66, 0.86) * specular * ocean * 0.22;
        float litLimb = pow(max(dot(normal.xy, normalize(vec2(0.62, 0.72))), 0.0), 2.5);
        color += vec3(0.46, 0.71, 1.0) * rim * (0.16 + litLimb * 2.2);
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    this.program = gl.createProgram();
    gl.attachShader(this.program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(this.program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));
    gl.useProgram(this.program);

    const vertices = [], indices = [];
    const columns = 224, rows = 128;
    for (let row = 0; row <= rows; row++) {
      const lat = Math.PI / 2 - row / rows * Math.PI;
      for (let column = 0; column <= columns; column++) {
        const lon = column / columns * Math.PI * 2 - Math.PI;
        vertices.push(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon),
          column / columns, row / rows);
      }
    }
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const a = row * (columns + 1) + column, b = a + columns + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    for (const [name, count, offset] of [["aPosition", 3, 0], ["aUV", 2, 12]]) {
      const location = gl.getAttribLocation(this.program, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, count, gl.FLOAT, false, 20, offset);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    this.indexCount = indices.length;
    this.uniforms = Object.fromEntries(["uViewport", "uCenter", "uRadius", "uYaw", "uPitch", "uEarth", "uNight", "uLayer", "uTime", "uDepth", "uDepthRadius", "uPlanet", "uPalette", "uAlpha"]
      .map(name => [name, gl.getUniformLocation(this.program, name)]));
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0, 0, 0, 0);
  }

  setTexture(image, nightImage) {
    const gl = this.gl;
    let upload = image;
    const limit = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (image.width > limit) {
      upload = document.createElement("canvas");
      upload.width = limit;
      upload.height = Math.round(image.height / image.width * limit);
      upload.getContext("2d").drawImage(image, 0, 0, upload.width, upload.height);
    }
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, upload);
    if (gl.getError() !== gl.NO_ERROR) throw new Error("GPU texture upload failed");
    if ((upload.width & (upload.width - 1)) === 0 && (upload.height & (upload.height - 1)) === 0) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }
    if (nightImage) {
      this.nightTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.nightTexture);
      let nightUpload = nightImage;
      if (nightImage.width > limit) {
        nightUpload = document.createElement("canvas");
        nightUpload.width = limit;
        nightUpload.height = Math.round(nightImage.height / nightImage.width * limit);
        nightUpload.getContext("2d").drawImage(nightImage, 0, 0, nightUpload.width, nightUpload.height);
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nightUpload);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      if (gl.getError() !== gl.NO_ERROR) throw new Error("Night texture upload failed");
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }
    this.ready = Boolean(this.nightTexture);
  }

  resize(width, height, ratio) {
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  draw(globe, time = 0) {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!this.ready) return;
    gl.useProgram(this.program);
    gl.uniform2f(this.uniforms.uViewport, globe.width, globe.height);
    gl.uniform2f(this.uniforms.uCenter, globe.centerX, globe.centerY);
    gl.uniform1f(this.uniforms.uRadius, globe.baseRadius * globe.scale);
    gl.uniform1f(this.uniforms.uYaw, globe.yaw);
    gl.uniform1f(this.uniforms.uPitch, globe.pitch);
    gl.uniform1i(this.uniforms.uEarth, 0);
    gl.uniform1i(this.uniforms.uNight, 1);
    gl.uniform1f(this.uniforms.uLayer, 0);
    gl.uniform1f(this.uniforms.uPlanet,0);
    gl.uniform1f(this.uniforms.uDepth,0);
    gl.uniform1f(this.uniforms.uDepthRadius,globe.baseRadius/(globe.planetUnit??globe.baseRadius));
    gl.uniform1f(this.uniforms.uTime, time / 1000);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(this.uniforms.uLayer, 1);
    gl.uniform1f(this.uniforms.uRadius, globe.baseRadius * globe.scale * 1.007);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.BLEND);
    this.drawPlanets(globe,time);
  }

  drawPlanets(globe,time){
    const gl=this.gl,colors=[[.91,.42,.30],[.20,.62,.80],[.59,.42,.79],[.95,.66,.30],[.25,.70,.51],[.43,.56,.88],[.86,.44,.63],[.77,.63,.45],[.32,.76,.73],[.60,.68,.79]];
    gl.uniform1f(this.uniforms.uLayer,0);gl.uniform1f(this.uniforms.uPlanet,1);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    for(const planet of globe.planetMeshes??[]){
      gl.uniform2f(this.uniforms.uCenter,planet.x,planet.y);gl.uniform1f(this.uniforms.uRadius,planet.visibleSize/2);
      gl.uniform1f(this.uniforms.uDepth,planet.z);gl.uniform1f(this.uniforms.uDepthRadius,planet.physicalRadius);
      gl.uniform1f(this.uniforms.uYaw,time*.00017+planet.index);gl.uniform1f(this.uniforms.uPitch,planet.index*.23);
      gl.uniform3f(this.uniforms.uPalette,...colors[planet.index]);gl.uniform1f(this.uniforms.uAlpha,planet.alpha);
      gl.drawElements(gl.TRIANGLES,this.indexCount,gl.UNSIGNED_SHORT,0);
    }
    gl.disable(gl.BLEND);gl.uniform1f(this.uniforms.uPlanet,0);
    globe.canvas.dataset.planetRenderer='webgl-spheres';
  }
}
