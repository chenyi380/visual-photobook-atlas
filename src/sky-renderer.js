// NASA catalogue-based celestial sphere: positions and colours come from actual star data.
class SkySphereRenderer {
  constructor(canvas) {
    this.canvas=canvas;
    const gl=this.gl=canvas.getContext('webgl',{alpha:false,antialias:false});
    if(!gl) throw new Error('Celestial sphere requires WebGL');
    const vertex=`attribute vec2 aPosition;varying vec2 vScreen;void main(){vScreen=aPosition;gl_Position=vec4(aPosition,0.,1.);}`;
    const fragment=`precision highp float;
      varying vec2 vScreen;uniform sampler2D uSky;uniform float uAspect;uniform float uYaw;uniform float uPitch;uniform float uRoll;
      void main(){
        vec2 film=vec2(vScreen.x*uAspect,vScreen.y)*.69;
        vec3 ray=normalize(vec3(film,1.));
        ray.xy=mat2(cos(uRoll),sin(uRoll),-sin(uRoll),cos(uRoll))*ray.xy;
        ray.yz=mat2(cos(uPitch),sin(uPitch),-sin(uPitch),cos(uPitch))*ray.yz;
        ray.xz=mat2(cos(uYaw),-sin(uYaw),sin(uYaw),cos(uYaw))*ray.xz;
        vec2 uv=vec2(fract(atan(ray.x,ray.z)/6.283185307+.5),.5-asin(clamp(ray.y,-1.,1.))/3.141592654);
        vec3 sky=texture2D(uSky,uv).rgb;
        gl_FragColor=vec4(pow(sky,vec3(.86))*1.10,1.);
      }`;
    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
    this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));
    gl.useProgram(this.program);gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const a=gl.getAttribLocation(this.program,'aPosition');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    this.uniforms=Object.fromEntries(['uSky','uAspect','uYaw','uPitch','uRoll'].map(name=>[name,gl.getUniformLocation(this.program,name)]));
    this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);
    for(const key of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.LINEAR);
    for(const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);
    this.image=new Image();this.image.onload=()=>{
      let upload=this.image;const max=gl.getParameter(gl.MAX_TEXTURE_SIZE);
      if(upload.width>max){upload=document.createElement('canvas');upload.width=max;upload.height=max/2;upload.getContext('2d').drawImage(this.image,0,0,upload.width,upload.height);}
      gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,upload);
      this.ready=gl.getError()===gl.NO_ERROR;this.canvas.dataset.surface=this.ready?'ready':'error';
      this.canvas.dataset.textureWidth=String(upload.width);this.canvas.dataset.source='NASA/Goddard SVS';
    };
    this.image.onerror=()=>{this.canvas.dataset.surface='error';};
    this.image.src='assets/nasa-starmap-8k.jpg';
  }
  resize(width,height,ratio){this.width=width;this.height=height;this.canvas.width=Math.round(width*ratio);this.canvas.height=Math.round(height*ratio);this.gl.viewport(0,0,this.canvas.width,this.canvas.height);}
  draw(seconds,reducedMotion){
    if(!this.ready)return;
    const gl=this.gl;gl.useProgram(this.program);gl.uniform1i(this.uniforms.uSky,0);
    gl.uniform1f(this.uniforms.uAspect,this.width/this.height);
    const yaw=-1.2+(reducedMotion?0:seconds*.0018);
    gl.uniform1f(this.uniforms.uYaw,yaw);gl.uniform1f(this.uniforms.uPitch,.30);gl.uniform1f(this.uniforms.uRoll,.2);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    this.canvas.dataset.yaw=yaw.toFixed(5);this.canvas.dataset.motion=reducedMotion?'still':'observer-rotation';
  }
}
