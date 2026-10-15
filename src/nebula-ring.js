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
        // Closely overlapping density samples resolve one gaseous volume. The
        // previous wide offsets produced three separate luminous silhouettes.
        for(int layer=0;layer<3;layer++){
          float h=(float(layer)-1.)*.018;
          float sampleWeight=layer==1?.48:.26;
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
          // Advect a continuous Cartesian density field around the orbital
          // centre. No sine/radial repetition can turn it into parallel rails.
          float turn=time*.28+radius*.17,ct=cos(turn),st=sin(turn);
          vec2 flow=mat2(ct,-st,st,ct)*q;
          vec2 warp=vec2(noise(flow*1.7+time*.21),noise(flow*1.9-vec2(time*.16,4.7)))-.5;
          float billow=fbm(flow*.92+warp*.6);
          float cloud=fbm(flow*3.6+warp*2.4+vec2(-time*.11,time*.07));
          float width=.38+.26*billow;
          float radial=(radius-2.83-(billow-.5)*.42)/width;
          float envelope=exp(-radial*radial*1.3);
          float irregular=smoothstep(.24,.69,cloud*.76+billow*.44);
          float ridge=1.-smoothstep(.025,.17,abs(noise(flow*8.2+warp*3.5)-.51));
          float tendrils=ridge*smoothstep(.34,.65,cloud);
          float scattered=.18+.82*smoothstep(.26,.64,billow);
          float whorl=fract((angle+PI)/(2.*PI)-time*.035+1.);
          float formation=smoothstep(0.,.12,uFormation)*(1.-smoothstep(uFormation*1.22,uFormation*1.22+.16,whorl));
          float density=envelope*(.025+irregular*.79+tendrils*.19)*scattered*formation*visible;
          mass+=density*sampleWeight*1.35;
          filaments+=envelope*tendrils*irregular*sampleWeight*.7*formation*visible;
          // Sparse dust belongs to the nebula coordinates and travels within it;
          // it is not a random screen-space star field or a planet-attached tail.
          vec2 grain=vec2(angle*61.-time*.9,radius*99.+warp.y*4.);
          vec2 cell=floor(grain),local=fract(grain)-.5;
          float seed=hash(cell),spark=exp(-dot(local,local)*110.);
          dust+=spark*smoothstep(.966,.998,seed)*envelope*formation*visible*sampleWeight*1.8;
        }
        float alpha=(1.-exp(-mass*1.75))*uAlpha;
        vec3 blue=vec3(.055,.21,.80),cyan=vec3(.14,.83,1.);
        vec3 color=mix(blue,cyan,clamp(filaments*2.2+mass*.48+.10,0.,.85));
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
