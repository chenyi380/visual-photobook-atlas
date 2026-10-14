const shelf = document.querySelector('#shelf');
const readerLayer = document.querySelector('#readerLayer');
const bookFrame = document.querySelector('#bookFrame');
const toggleAtlas = document.querySelector('#toggleAtlas');
const memoryProjection = document.querySelector('#memoryProjection');
const projectionBeam = document.querySelector('#projectionBeam');
const globe = new StarGlobe(document.querySelector('#spaceCanvas'));
let selectedIndex = 0;
let reading = false;
let previewBook = null;
const orbital = new OrbitalLibrary(shelf, globe, books, {
  mode: updateMode,
  preview(book) {
    if (reading) return;
    selectedIndex = books.indexOf(book);
    const photo=ATLAS_TRAVEL_PHOTOS[book.id];
    previewBook={...book,lon:photo.center[0],lat:photo.center[1]};
    globe.previewTo(previewBook);
    document.querySelector('#locationReadout').textContent = book.place;
    document.querySelector('#projectionImage').src = ATLAS_PROJECTION_IMAGES[book.id];
    document.querySelector('#projectionImage').alt = `${book.title}旅行景色`;
    document.querySelector('#projectionMap').src = photo.map;
    document.querySelector('#projectionMap').alt = `${book.title}真实地理地图，红点为大致区域`;
    const mapInfo=ATLAS_MAP_META[book.id];
    document.querySelector('#projectionTitle').textContent = photo.title;
    document.querySelector('#projectionPlace').textContent = photo.country;
    document.querySelector('#projectionLandmarks').replaceChildren(...mapInfo.landmarks.map(name=>{const item=document.createElement('li');item.textContent=name;return item;}));
    document.querySelector('#projectionCoordinates').textContent = 'Approximate area';
    const credit=ATLAS_COVER_SOURCES[book.id];
    const attribution=document.querySelector('#projectionCredit');
    attribution.textContent=`${credit.author} · ${credit.license}`;attribution.href=credit.source;
    document.querySelector('#projectionMapCredit').textContent=photo.mapCredit;
    memoryProjection.dataset.book = book.id;
  },
  release() { hideProjection(); if (!reading) globe.releaseFocus(); },
  activate(book,button) { orbital.callbacks.preview(book);journey.start(book,button,previewBook); },
});
const navigation=new SceneNavigationController(globe,orbital,updateMode,()=>reading||photoDialog.open||!!journey.active);
const journey=new BookJourneyController(document.querySelector('#journeyCanvas'),globe,orbital,memoryProjection,book=>openReader(book),book=>orbital.buttons[books.indexOf(book)].focus());
globe.dragController=new GlobeDragController(document.querySelector('#globeControl'),globe,()=>{
  hideProjection();orbital.active=null;orbital.buttons.forEach(button=>button.classList.remove('active'));
});
const photoDialog=document.querySelector('#travelPhotoDialog');
memoryProjection.addEventListener('pointerenter',()=>{orbital.previewHeld=true;clearTimeout(orbital.releaseTimer);});
memoryProjection.addEventListener('pointerleave',()=>{if(!photoDialog.open){orbital.previewHeld=false;orbital.endPreview();}});
document.querySelector('#openTravelPhoto').addEventListener('click',()=>{
  if(!previewBook)return;
  orbital.previewHeld=true;
  const clone=memoryProjection.cloneNode(true);clone.removeAttribute('id');clone.classList.add('photo-expanded');clone.querySelector('.photo-expand').remove();
  clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  clone.style.left=clone.style.top='0';clone.setAttribute('aria-hidden','false');
  const ratio=ATLAS_TRAVEL_PHOTOS[previewBook.id].ratio,width=Math.min(innerWidth*.85,(innerHeight-100)*ratio,1200);
  clone.style.width=`${width}px`;clone.style.height=`${width/ratio}px`;clone.style.setProperty('--projection-unit',String(width/600));
  clone.style.setProperty('--photo-ratio',String(ratio));
  document.querySelector('#travelPhotoContent').replaceChildren(clone);photoDialog.showModal();
});
function closeTravelPhoto(){photoDialog.close();orbital.previewHeld=false;orbital.buttons[selectedIndex].focus();}
document.querySelector('#closeTravelPhoto').addEventListener('click',closeTravelPhoto);
photoDialog.addEventListener('cancel',event=>{event.preventDefault();closeTravelPhoto();});
function hideProjection() {
  previewBook = null;
  memoryProjection.classList.remove('visible');
  memoryProjection.setAttribute('aria-hidden', 'true');
  projectionBeam.classList.remove('visible');
}
function updateMode(opened) {
  hideProjection();
  if(!globe.sceneController)globe.setLibraryMode(opened);
  globe.releaseFocus();
  toggleAtlas.setAttribute('aria-expanded', String(opened));
  toggleAtlas.setAttribute('aria-label', opened ? '返回彩色小星球模式' : '展开半透明画册星环');
  toggleAtlas.querySelector('span').textContent = opened ? '小星球' : '画册星环';
  document.body.dataset.view = opened ? 'books' : 'planets';
  document.querySelector('#orbitHint').textContent = opened ? '拖动地球旋转 · 悬停暂停 · 点击穿越 · 滚轮缩小返回' : '拖动地球旋转 · 滚轮放大展开画册';
  document.querySelector('#locationReadout').textContent = 'EARTH / AUTO ORBIT';
}
function setOrbitOpen(opened) { if(journey.active)return;orbital.setOpen(opened); }
function updateProjection() {
  if (!previewBook || !orbital.opened || reading) return;
  const point = globe.project(previewBook.lat, previewBook.lon);
  const visible = point.visible && point.depth > .85;
  memoryProjection.classList.toggle('visible', visible);
  memoryProjection.setAttribute('aria-hidden', String(!visible));
  projectionBeam.classList.toggle('visible', visible);
  if (!visible) return;
  const mobile = globe.width < 720;
  const ratio=ATLAS_TRAVEL_PHOTOS[previewBook.id].ratio;
  const width = mobile ? Math.min(globe.width-48,340,globe.height*.26*ratio) : Math.min(globe.width*.36,globe.height*.30*ratio,680), height=width/ratio;
  const radius = globe.baseRadius * globe.scale;
  const x = clamp(globe.centerX - width / 2, 12, globe.width - width - 12);
  const y = mobile ? 64 : globe.height*.030;
  memoryProjection.style.width=`${width}px`;
  memoryProjection.style.height=`${height}px`;
  memoryProjection.style.setProperty('--projection-unit',String(width/600));
  memoryProjection.style.left = `${x.toFixed(1)}px`;
  memoryProjection.style.top = `${y.toFixed(1)}px`;
  projectionBeam.setAttribute('viewBox', `0 0 ${globe.width} ${globe.height}`);
  document.querySelector('#projectionCone').setAttribute('points', `${point.x},${point.y} ${x + width*.45},${y + height} ${x + width*.67},${y + height}`);
  document.querySelector('#projectionLine').setAttribute('d', `M${x + width*.45},${y + height} L${point.x},${point.y} L${x + width*.67},${y + height}`);
}
globe.onFrame = time => { navigation.update(time);orbital.update(time); updateProjection(); };
toggleAtlas.addEventListener('click', () => setOrbitOpen(!orbital.opened));
function openReader(book, updateHash = true) {
  selectedIndex = books.indexOf(book);
  reading = true;
  hideProjection();
  document.body.dataset.view = 'reading';
  document.querySelector('#readerBookTitle').textContent = book.title;
  document.querySelector('#readerBookIssue').textContent = book.english.split(' / ')[0];
  bookFrame.src = book.reader;
  readerLayer.classList.add('open');
  readerLayer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('reading');
  document.querySelector('#libraryView').inert = true;
  if (updateHash) history.pushState(null, '', `#read/${book.id}`);
  document.querySelector('#closeReader').focus();
}
function closeReader(updateHash = true) {
  if (!reading) return;
  reading = false;
  readerLayer.classList.remove('open');
  readerLayer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('reading');
  document.querySelector('#libraryView').inert = false;
  bookFrame.src = 'about:blank';
  if (!orbital.opened) setOrbitOpen(true);
  document.body.dataset.view = 'books';
  if (updateHash) history.pushState(null, '', location.pathname + location.search);
  orbital.buttons[selectedIndex].focus();
}
document.querySelector('#closeReader').addEventListener('click', () => closeReader());
addEventListener('keydown', event => {
  if(photoDialog.open)return;
  if (event.key === 'Escape') {
    if(journey.cancel())return;
    if (reading) closeReader();
    else if (orbital.opened) { setOrbitOpen(false); toggleAtlas.focus(); }
    return;
  }
  if (reading || journey.active || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    selectedIndex = (selectedIndex + (event.key === 'ArrowRight' ? 1 : -1) + books.length) % books.length;
    orbital.buttons[selectedIndex].focus();
  }
});
function applyHash() {
  journey.cancel();
  const [state, id] = location.hash.slice(1).split('/');
  const book = books.find(item => item.id === id);
  if (state === 'read' && book) { if (!reading || selectedIndex !== books.indexOf(book)) openReader(book, false); }
  else {
    if (reading) closeReader(false);
    if (state === 'place' && book) { setOrbitOpen(true); orbital.buttons[books.indexOf(book)].focus(); }
  }
}
addEventListener('hashchange', applyHash);
addEventListener('popstate', applyHash);
updateMode(false);
applyHash();
