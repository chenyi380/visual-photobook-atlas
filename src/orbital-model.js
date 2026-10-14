// Two-body Kepler model. These are designed photobook satellites, not measured planets.
const ORBIT_ELEMENTS = [
  {a:1.75,e:.055,i:18,node:12,arg:24,ma:12},
  {a:1.91,e:.080,i:48,node:57,arg:66,ma:108},
  {a:2.12,e:.045,i:82,node:100,arg:112,ma:210},
  {a:2.23,e:.070,i:112,node:142,arg:8,ma:302},
  {a:1.84,e:.035,i:145,node:198,arg:70,ma:164},
  {a:2.06,e:.090,i:65,node:255,arg:145,ma:32},
  {a:2.28,e:.065,i:34,node:310,arg:42,ma:250},
  {a:1.98,e:.060,i:126,node:25,arg:100,ma:284},
  {a:2.18,e:.040,i:93,node:222,arg:176,ma:78},
  {a:2.34,e:.075,i:158,node:278,arg:24,ma:194},
];
const orbitRadians = degrees => degrees * Math.PI / 180;
const ORBIT_MU = (2*Math.PI/70)**2 * 2**3;
function solveEccentricAnomaly(mean,eccentricity) {
  const m = ((mean + Math.PI) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI) - Math.PI;
  let eccentric=m;
  for(let step=0;step<8;step++) eccentric-=(eccentric-eccentricity*Math.sin(eccentric)-m)/(1-eccentricity*Math.cos(eccentric));
  return eccentric;
}
function keplerPosition(elements,seconds) {
  const mean=orbitRadians(elements.ma)+seconds*Math.sqrt(ORBIT_MU/elements.a**3);
  return orbitPositionAtAnomaly(elements,solveEccentricAnomaly(mean,elements.e));
}
function orbitPositionAtAnomaly(elements,eccentric) {
  const x=elements.a*(Math.cos(eccentric)-elements.e);
  const y=elements.a*Math.sqrt(1-elements.e**2)*Math.sin(eccentric);
  const w=orbitRadians(elements.arg),i=orbitRadians(elements.i),o=orbitRadians(elements.node);
  const u=x*Math.cos(w)-y*Math.sin(w),v=x*Math.sin(w)+y*Math.cos(w);
  // Inertial coordinates: every orbit has its own plane and ascending node.
  return {x:u*Math.cos(o)-v*Math.cos(i)*Math.sin(o),
    y:u*Math.sin(o)+v*Math.cos(i)*Math.cos(o),z:v*Math.sin(i)};
}
function projectOrbitalPoint(position,globe) {
  // One stationary observer, looking down +Z. No screen-space orbit distortion.
  const camera=12, perspective=camera/(camera-position.z);
  const unit=globe.planetUnit ?? globe.baseRadius;
  return {x:globe.centerX+position.x*unit*perspective,
    y:globe.restCenterY-position.y*unit*perspective,
    z:position.z,depth:position.z/2.6,perspective};
}
function fitPlanetUnit(width,height) {
  let horizontal=0,vertical=0;
  for(const elements of ORBIT_ELEMENTS) for(let sample=0;sample<180;sample++) {
    const p=orbitPositionAtAnomaly(elements,sample*Math.PI*2/180);
    const s=12/(12-p.z);
    horizontal=Math.max(horizontal,Math.abs(p.x*s));
    vertical=Math.max(vertical,Math.abs(p.y*s));
  }
  return Math.min(width*.43/horizontal,height*.415/vertical,width*.25,height*.30);
}
