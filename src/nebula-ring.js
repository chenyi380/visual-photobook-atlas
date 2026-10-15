// One analytically projected, three-sample nebula volume. The annulus is a
// flowing density field, never a stack of stroked or parallel ellipse paths.
class NebulaRingRenderer {
  constructor(canvas){
    this.canvas=canvas;
    this.gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,depth:false,stencil:false});
    if(!this.gl)throw new Error('Volumetric nebula requires WebGL');
    this.initialize();
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.lost=true;canvas.dataset.renderer='unavailable';});
    canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.initialize();});
  }
  initialize(){
    const gl=this.gl;
    const vertex=`attribute vec2 aPosition;void main(){gl_Position=vec4(aPosition,0.,1.);}`;
    const fragment=`
      precision highp float;
      uniform vec2 uResolution;
      uniform vec2 uViewport;
      uniform vec2 uCenter;
      uniform float uUnit;
      uniform float uRadius;
      uniform float uTime;
      uniform float uAlpha;
      uniform float uFormation;
      uniform vec4 uBodies[10];
      const float PI=3.14159265359;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
      float noise(vec2 p){
        vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
      }
      float fbm(vec2 p){
        float sum=0.,weight=.55;mat2 turn=mat2(.8,-.6,.6,.8);
        for(int n=0;n<4;n++){sum+=weight*noise(p);p=turn*p*2.07+vec2(13.7,7.1);weight*=.47;}
        return sum;
      }
      float foregroundMask(vec2 pixel,float depth){
        vec2 delta=pixel-uCenter;float radial=dot(delta,delta);
        if(radial<uRadius*uRadius&&depth<sqrt(max(0.,uRadius*uRadius-radial))/uUnit)return 0.;
        for(int i=0;i<10;i++){
          vec4 body=uBodies[i];vec2 d=pixel-body.xy;float r2=body.z*body.z;
          if(body.z>0.&&dot(d,d)<r2&&depth<body.w+sqrt(max(0.,r2-dot(d,d)))/uUnit)return 0.;
        }
        return 1.;
      }
      void main(){
        vec2 pixel=vec2(gl_FragCoord.x/uResolution.x,1.-gl_FragCoord.y/uResolution.y)*uViewport;
        vec2 screen=(pixel-uCenter)/uUnit;
        if(abs(screen.x)>4.8||abs(screen.y)>2.65||uAlpha<.001||uFormation<.001){gl_FragColor=vec4(0.);return;}
        float roll=-.18,c=cos(roll),s=sin(roll);
        vec2 view=vec2(screen.x*c+screen.y*s,-screen.x*s+screen.y*c);
        float tilt=.32,tangent=tan(tilt),cosine=cos(tilt);
        float mass=0.,filaments=0.,dust=0.;
        // Three height slices integrate the soft volume thickness. Their turbulent
        // density is continuous, rather than three visible geometric ring lines.
        for(int layer=0;layer<3;layer++){
          float h=(float(layer)-1.)*.105;
          float divisor=tangent+view.y/12.;
          if(abs(divisor)<.025)continue;
          float depth=(view.y-h)/divisor;
          if(abs(depth)>5.8)continue;
          vec2 q=vec2(view.x*(1.-depth/12.),depth/cosine);
          float radius=length(q);
          if(radius<1.95||radius>3.95)continue;
          float visible=foregroundMask(pixel,depth);
          if(visible<.01)continue;
          float angle=atan(q.y,q.x),time=uTime*.15;
          vec2 flow=vec2(radius*4.8,0.)+vec2(cos(angle-time*.28),sin(angle-time*.28))*3.2;
          float bend=fbm(vec2(cos(angle)*2.2,sin(angle)*2.2)+time*.22)-.5;
          float warp=.16*bend+.035*sin(angle*5.-time);
          float radial=(radius-2.83-warp)/.44;
          float envelope=exp(-radial*radial*1.8);
          float broad=fbm(flow+vec2(fbm(flow*.65+time),0.)*1.7);
          float billow=fbm(q*3.9+vec2(-time,time*.5));
          float irregular=smoothstep(.16,.69,broad*.7+billow*.42);
          float spiral=sin(radius*8.5-angle*2.+time*1.7+bend*5.);
          float strand=pow(max(0.,spiral*.5+.5),5.)*(.25+irregular);
          float whorl=fract((angle+PI)/(2.*PI)-time*.035+1.);
          float formation=smoothstep(0.,.12,uFormation)*(1.-smoothstep(uFormation*1.22,uFormation*1.22+.16,whorl));
          float density=envelope*(.12+irregular*.62+strand*.42)*formation*visible;
          mass+=density*.43;
          filaments+=envelope*strand*irregular*.38*formation*visible;
          // Sparse dust belongs to the nebula coordinates and travels within it;
          // it is not a random screen-space star field or a planet-attached tail.
          vec2 grain=vec2(angle*61.-time*.9,radius*99.+bend*4.);
          vec2 cell=floor(grain),local=fract(grain)-.5;
          float seed=hash(cell),spark=exp(-dot(local,local)*110.);
          dust+=spark*smoothstep(.978,.998,seed)*envelope*formation*visible*.9;
        }
        float alpha=(1.-exp(-mass*1.75))*uAlpha;
        vec3 blue=vec3(.055,.21,.80),cyan=vec3(.14,.83,1.);
        vec3 color=mix(blue,cyan,clamp(filaments*2.5+.18,0.,.92));
        color+=vec3(.28,.62,.90)*filaments+vec3(.7,.92,1.)*dust;
        alpha=clamp(alpha+dust*uAlpha*.62,0.,.84);
        gl_FragColor=vec4(color,alpha);
      }
    `;
    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
    const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    this.program=program;gl.useProgram(program);
    this.vertices=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.vertices);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const location=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
    this.uniforms=Object.fromEntries(['uResolution','uViewport','uCenter','uUnit','uRadius','uTime','uAlpha','uFormation','uBodies[0]'].map(name=>[name,gl.getUniformLocation(program,name)]));
    this.bodies=new Float32Array(40);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.clearColor(0,0,0,0);
    this.canvas.dataset.renderer='volumetric-fbm';
  }
  draw(globe,seconds,alpha,formation=1){
    if(this.lost)return;
    const gl=this.gl,ratio=Math.min(globe.ratio??1,globe.width<720?1:1.25);
    const width=Math.round(globe.width*ratio),height=Math.round(globe.height*ratio);
    if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;gl.viewport(0,0,width,height);}
    gl.clear(gl.COLOR_BUFFER_BIT);
    if(alpha<.001)return;
    gl.useProgram(this.program);
    gl.uniform2f(this.uniforms.uResolution,width,height);gl.uniform2f(this.uniforms.uViewport,globe.width,globe.height);
    gl.uniform2f(this.uniforms.uCenter,globe.centerX,globe.restCenterY);gl.uniform1f(this.uniforms.uUnit,Math.max(1,globe.planetUnit));
    gl.uniform1f(this.uniforms.uRadius,globe.baseRadius*globe.scale);gl.uniform1f(this.uniforms.uTime,seconds);gl.uniform1f(this.uniforms.uAlpha,alpha);gl.uniform1f(this.uniforms.uFormation,formation);
    this.bodies.fill(0);
    for(let i=0;i<Math.min(10,(globe.planetMeshes??[]).length);i++){
      const p=globe.planetMeshes[i];this.bodies.set([p.x,p.y,p.visibleSize*.5*Math.sqrt(Math.max(0,p.alpha??1)),p.z],i*4);
    }
    gl.uniform4fv(this.uniforms['uBodies[0]'],this.bodies);gl.drawArrays(gl.TRIANGLES,0,6);
    this.canvas.dataset.formation=formation.toFixed(3);this.canvas.dataset.alpha=alpha.toFixed(3);
  }
}
