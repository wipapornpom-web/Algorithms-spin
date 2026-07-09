/* Algorithm Spin Challenge: Drag Pointer Edition
   ใช้ MediaPipe Hands ตรวจจับปลายนิ้วชี้ + จีบนิ้วโป้งเพื่อจับ/ลาก/ปล่อย
*/
const $ = (q) => document.querySelector(q);
const video = $('#camera');
const pointer = $('#pointer');
const statusBox = $('#gestureStatus');
const wheelScreen = $('#wheelScreen');
const gameScreen = $('#gameScreen');
const wheel = $('#wheel');
const spinTarget = $('#spinTarget');
const playArea = $('#playArea');
const scoreEls = [$('#score'), $('#score2')];
const toast = $('#toast');
const confettiCanvas = $('#confetti');
const ctx = confettiCanvas.getContext('2d');

let score = Number(localStorage.getItem('asc_drag_score') || 0);
let spinning = false;
let rotation = 0;
let currentGame = null;
let dragging = null;
let dragOffset = {x:0,y:0};
let pointerState = {x: innerWidth/2, y: innerHeight/2, pinch:false, lastPinch:false, seen:false};
let playedQueue = [];

const games = [
  {id:'brush', icon:'🦷', short:'แปรงฟัน', title:'ภารกิจแปรงฟัน', instruction:'🤖 จีบนิ้วจับรูป แล้วลากวางตามลำดับการแปรงฟัน', type:'sequence', steps:['🪥','🧴','😁','💧']},
  {id:'pizza', icon:'🍕', short:'พิซซ่า', title:'ภารกิจทำพิซซ่า', instruction:'🤖 ลากรูปขั้นตอนทำพิซซ่าให้ถูกลำดับ', type:'sequence', steps:['🥖','🍅','🧀','🔥']},
  {id:'rocket', icon:'🚀', short:'จรวด', title:'ภารกิจปล่อยจรวด', instruction:'🤖 ลากภาพขั้นตอนปล่อยจรวดให้ถูกลำดับ', type:'sequence', steps:['🔧','⛽','🔢','🚀']},
  {id:'plant', icon:'🌱', short:'ปลูกต้นไม้', title:'ภารกิจปลูกต้นไม้', instruction:'🤖 เรียงภาพขั้นตอนปลูกต้นไม้ให้ถูกต้อง', type:'sequence', steps:['🕳️','🌱','🪣','🌳']},
  {id:'computer', icon:'🖥️', short:'เปิดคอม', title:'ภารกิจเปิดคอมพิวเตอร์', instruction:'🤖 ลากภาพขั้นตอนเปิดคอมพิวเตอร์ตามลำดับ', type:'sequence', steps:['🔌','🔘','🖥️','⌨️']},
  {id:'hands', icon:'👐', short:'ล้างมือ', title:'ภารกิจล้างมือ', instruction:'🤖 เรียงภาพขั้นตอนล้างมือ', type:'sequence', steps:['🚰','🧼','👐','🧻']},
  {id:'toy', icon:'🧸', short:'เก็บของ', title:'ภารกิจเก็บของเล่น', instruction:'🤖 ลากของเล่นใส่กล่องให้ครบ', type:'collect', robot:'🧸', targets:['📦','📦','📦']},
  {id:'diamond', icon:'💎', short:'เก็บเพชร', title:'ภารกิจเก็บเพชร', instruction:'🤖 ลากหุ่นยนต์ตามถนน ไปเก็บเพชร แล้วไปถึงธง', type:'map', robot:'🤖', targets:['💎','💎','🏁']},
  {id:'flag', icon:'🏁', short:'ไปธง', title:'ภารกิจไปหาธง', instruction:'🤖 ลากหุ่นยนต์ตามถนนไปถึงธง', type:'map', robot:'🤖', targets:['⭐','🏁']},
  {id:'school', icon:'🏫', short:'ไปโรงเรียน', title:'ภารกิจไปโรงเรียน', instruction:'🤖 ลากนักเรียนตามถนน ผ่านหนังสือ แล้วไปโรงเรียน', type:'map', robot:'🧒', targets:['📘','🏫']}
];

/** สร้างชื่อเกมบนวงล้อให้เห็นชัดเจน */
function renderWheelLabels(){
  const old = wheel.querySelector('.wheelLabels');
  if(old) old.remove();
  const layer = document.createElement('div');
  layer.className = 'wheelLabels';
  games.forEach((game, i)=>{
    const label = document.createElement('div');
    label.className = 'wheelLabel';
    label.style.transform = `rotate(${i * 36 + 18}deg) translateY(-43%)`;
    label.innerHTML = `<span style="transform:rotate(${-i * 36 - 18}deg)">${game.icon}<small>${game.short || game.title.replace('ภารกิจ','')}</small></span>`;
    layer.appendChild(label);
  });
  wheel.appendChild(layer);
}

/** สร้างเส้นทางแบบโค้งสำหรับเกมลากตามทาง */
function makeRoad(points){
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','roadSvg');
  svg.setAttribute('viewBox',`0 0 ${playArea.clientWidth} ${playArea.clientHeight}`);
  svg.setAttribute('preserveAspectRatio','none');
  const poly = document.createElementNS('http://www.w3.org/2000/svg','polyline');
  poly.setAttribute('points', points.map(p=>`${p.x},${p.y}`).join(' '));
  poly.setAttribute('class','roadLine');
  svg.appendChild(poly);
  const dash = document.createElementNS('http://www.w3.org/2000/svg','polyline');
  dash.setAttribute('points', points.map(p=>`${p.x},${p.y}`).join(' '));
  dash.setAttribute('class','roadDash');
  svg.appendChild(dash);
  playArea.appendChild(svg);
}


/** อัปเดตคะแนนบนหน้าจอ */
function updateScore(){ scoreEls.forEach(el => el.textContent = score); localStorage.setItem('asc_drag_score', score); }

/** พูดข้อความไทยด้วย Web Speech ถ้าเบราว์เซอร์รองรับ */
function speak(text){
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[🤖⭐🎉]/g,''));
    u.lang = 'th-TH'; u.rate = 0.92; u.pitch = 1.1;
    speechSynthesis.speak(u);
  }catch(e){}
}

/** แสดงข้อความกลางจอ */
function showToast(msg, ms=1300){ toast.innerHTML = msg; toast.classList.remove('hidden'); setTimeout(()=>toast.classList.add('hidden'), ms); }

/** สลับหน้าจอ */
function showScreen(name){
  wheelScreen.classList.toggle('active', name === 'wheel');
  gameScreen.classList.toggle('active', name === 'game');
}

/** สุ่มเกมโดยไม่ซ้ำจนกว่าจะครบ */
function pickGame(){
  if(playedQueue.length >= games.length) playedQueue = [];
  const available = games.filter(g => !playedQueue.includes(g.id));
  const game = available[Math.floor(Math.random()*available.length)];
  playedQueue.push(game.id);
  return game;
}

/** หมุนวงล้อแล้วเข้าเกม */
function spinWheel(){
  if(spinning) return;
  spinning = true;
  const game = pickGame();
  const index = games.findIndex(g => g.id === game.id);
  rotation += 1440 + (360 - index * 36) + Math.floor(Math.random()*25);
  wheel.style.transform = `rotate(${rotation}deg)`;
  speak('หมุนวงล้อ');
  setTimeout(()=>{
    showToast(`${game.icon}<br>${game.title}`, 1500);
    speak(game.title);
    setTimeout(()=>startGame(game), 1200);
    spinning = false;
  }, 4200);
}

/** สร้างเกมตามชนิด */
function startGame(game){
  currentGame = game;
  $('#gameTitle').textContent = `${game.icon} ${game.title}`;
  $('#gameInstruction').textContent = game.instruction;
  $('#nextTarget').classList.add('hidden');
  $('#checkTarget').classList.remove('hidden');
  playArea.innerHTML = '';
  showScreen('game');
  if(game.type === 'sequence') renderSequence(game);
  if(game.type === 'map') renderMap(game);
  if(game.type === 'collect') renderCollect(game);
  speak(game.instruction);
}

/** สุ่มลำดับ array */
function shuffle(arr){ return [...arr].sort(()=>Math.random()-.5); }

/** สร้างเกมเรียงลำดับภาพ */
function renderSequence(game){
  const slots = document.createElement('div'); slots.className = 'slots';
  game.steps.forEach((emoji, i)=>{
    const s = document.createElement('div'); s.className = 'slot dropzone'; s.dataset.accept = emoji; s.dataset.index = i; s.textContent = i+1;
    slots.appendChild(s);
  });
  const cards = document.createElement('div'); cards.className = 'cards';
  shuffle(game.steps).forEach(emoji=>{
    const c = document.createElement('div'); c.className = 'card draggable'; c.textContent = emoji; c.dataset.value = emoji;
    cards.appendChild(c);
  });
  playArea.append(slots,cards);
}

/** สร้างเกมลากตัวละครผ่านเป้าหมาย โดยมีถนน/เส้นทางให้ลากตาม */
function renderMap(game){
  const w = playArea.clientWidth || 1000;
  const h = playArea.clientHeight || 520;
  const start = {x:90, y:h-110};
  const points = game.targets.map((emoji, i)=>{
    const gap = (w - 220) / Math.max(1, game.targets.length);
    return {
      emoji,
      x: 160 + gap * (i + 1),
      y: i % 2 === 0 ? 120 : h - 135
    };
  });
  const roadPoints = [start, ...points.map(p=>({x:p.x+60,y:p.y+60}))];
  makeRoad(roadPoints);

  const startPad = document.createElement('div');
  startPad.className='startPad'; startPad.textContent='START';
  startPad.style.left=`${start.x-45}px`; startPad.style.top=`${start.y-45}px`;
  playArea.appendChild(startPad);

  const robot = document.createElement('div');
  robot.className='mapRobot draggable mapActor';
  robot.textContent=game.robot;
  robot.dataset.value='actor';
  robot.dataset.nextIndex='0';
  robot.style.left = `${start.x-55}px`;
  robot.style.top = `${start.y-55}px`;
  playArea.appendChild(robot);

  points.forEach((p,i)=>{
    const z = document.createElement('div');
    z.className='mapTarget dropzone';
    z.dataset.accept=p.emoji;
    z.dataset.order=String(i);
    z.textContent=p.emoji;
    z.style.left=`${p.x}px`;
    z.style.top=`${p.y}px`;
    z.style.width='120px';
    z.style.height='120px';
    const badge = document.createElement('b');
    badge.textContent = i + 1;
    z.appendChild(badge);
    playArea.appendChild(z);
  });
}

/** สร้างเกมลากของใส่กล่อง */
function renderCollect(game){
  const slots = document.createElement('div'); slots.className='slots';
  game.targets.forEach((t,i)=>{ const s=document.createElement('div'); s.className='slot dropzone'; s.dataset.accept='toy'; s.textContent=t; slots.appendChild(s); });
  const cards = document.createElement('div'); cards.className='cards';
  ['🧸','🚗','⚽'].forEach(e=>{ const c=document.createElement('div'); c.className='card draggable'; c.textContent=e; c.dataset.value='toy'; cards.appendChild(c); });
  playArea.append(slots,cards);
}

/** ตรวจคำตอบ */
function checkAnswer(){
  if(!currentGame) return;
  let ok = false;
  if(currentGame.type === 'sequence'){
    const slots = [...playArea.querySelectorAll('.slot')];
    ok = slots.every(s => s.dataset.filled === s.dataset.accept);
  } else if(currentGame.type === 'collect'){
    const slots = [...playArea.querySelectorAll('.slot')];
    ok = slots.every(s => s.dataset.filled === 'toy');
  } else if(currentGame.type === 'map'){
    const zones = [...playArea.querySelectorAll('.mapTarget')];
    ok = zones.every(z => z.dataset.visited === 'yes');
  }
  if(ok){
    score += 10; updateScore(); burst();
    showToast('🎉 เก่งมาก!<br>+10 ดาว'); speak('เก่งมาก ได้สิบคะแนน');
    $('#checkTarget').classList.add('hidden'); $('#nextTarget').classList.remove('hidden');
  } else { showToast('ลองอีกครั้งนะ ⭐', 1200); speak('ลองอีกครั้งนะ'); }
}

/** หาจุดวางที่อยู่ใต้ตำแหน่งนิ้ว */
function getDropZoneAt(x,y){
  const zones = [...document.querySelectorAll('.dropzone')];
  return zones.find(z=>{
    const r=z.getBoundingClientRect(); return x>=r.left && x<=r.right && y>=r.top && y<=r.bottom;
  });
}

/** หาของที่ลากได้ใต้ตำแหน่งนิ้ว */
function getDraggableAt(x,y){
  const items = [...document.querySelectorAll('.draggable')].reverse();
  return items.find(el=>{
    const r=el.getBoundingClientRect(); return x>=r.left && x<=r.right && y>=r.top && y<=r.bottom;
  });
}

/** เริ่มจับ/ลาก */
function startDrag(x,y){
  if(wheelScreen.classList.contains('active')){
    const r = spinTarget.getBoundingClientRect();
    if(x>=r.left && x<=r.right && y>=r.top && y<=r.bottom) spinWheel();
    return;
  }
  const check = $('#checkTarget').getBoundingClientRect();
  if(!$('#checkTarget').classList.contains('hidden') && x>=check.left && x<=check.right && y>=check.top && y<=check.bottom){ checkAnswer(); return; }
  const next = $('#nextTarget').getBoundingClientRect();
  if(!$('#nextTarget').classList.contains('hidden') && x>=next.left && x<=next.right && y>=next.top && y<=next.bottom){ showScreen('wheel'); speak('กลับไปหมุนวงล้อ'); return; }
  const el = getDraggableAt(x,y);
  if(!el) return;
  dragging = el;
  const r = el.getBoundingClientRect();
  dragOffset.x = x - r.left; dragOffset.y = y - r.top;
  el.classList.add('dragging');
  document.body.appendChild(el);
  moveDrag(x,y);
}

/** เคลื่อนวัตถุที่จับอยู่ */
function moveDrag(x,y){
  if(!dragging) return;
  dragging.style.position='fixed';
  dragging.style.left = `${x - dragOffset.x}px`;
  dragging.style.top = `${y - dragOffset.y}px`;
}

/** ปล่อยวัตถุและตรวจว่าทับเป้าหมายไหม */
function endDrag(x,y){
  if(!dragging) return;
  const zone = getDropZoneAt(x,y);
  if(zone){
    if(currentGame?.type === 'map'){
      const next = Number(dragging.dataset.nextIndex || 0);
      const order = Number(zone.dataset.order || 0);
      if(order === next){
        zone.dataset.visited='yes';
        zone.classList.add('visited');
        dragging.dataset.nextIndex = String(next + 1);
        dragging.style.left = `${zone.getBoundingClientRect().left+5}px`;
        dragging.style.top = `${zone.getBoundingClientRect().top+5}px`;
        if(zone.dataset.accept === '🏁' || zone.textContent.includes('🏫')) speak('ถึงเป้าหมายแล้ว'); else speak('เก็บได้แล้ว');
      }else{
        showToast('ไปตามลำดับตัวเลขนะ ⭐', 1100);
        speak('ไปตามลำดับตัวเลขนะ');
      }
    }else{
      zone.dataset.filled = dragging.dataset.value;
      zone.textContent = dragging.textContent;
      zone.style.background = 'rgba(120,255,170,.55)';
      dragging.remove();
    }
  }
  dragging?.classList.remove('dragging');
  if(dragging && currentGame?.type !== 'map') dragging = null;
  if(dragging && currentGame?.type === 'map') dragging.classList.remove('dragging');
  dragging = null;
}

/** ประมวลผลตำแหน่งมือจาก MediaPipe */
function onHandResults(results){
  if(!results.multiHandLandmarks || results.multiHandLandmarks.length === 0){
    pointerState.seen = false; statusBox.textContent = 'ไม่เห็นมือ: ยกมือให้อยู่ในกล้อง'; return;
  }
  const lm = results.multiHandLandmarks[0];
  const index = lm[8], thumb = lm[4];
  const x = (1 - index.x) * innerWidth;
  const y = index.y * innerHeight;
  const d = Math.hypot(index.x-thumb.x, index.y-thumb.y);
  const pinch = d < 0.055;
  pointerState.x = x; pointerState.y = y; pointerState.seen = true; pointerState.pinch = pinch;
  pointer.style.left = `${x}px`; pointer.style.top = `${y}px`;
  pointer.classList.toggle('pinching', pinch);
  statusBox.textContent = pinch ? 'กำลังจับ/ลาก' : 'ชี้นิ้ว แล้วจีบนิ้วเพื่อจับ';
  if(pinch && !pointerState.lastPinch) startDrag(x,y);
  if(pinch && pointerState.lastPinch) moveDrag(x,y);
  if(!pinch && pointerState.lastPinch) endDrag(x,y);
  pointerState.lastPinch = pinch;
}

/** เปิดกล้องและ MediaPipe Hands */
async function initHands(){
  try{
    const hands = new Hands({locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
    hands.setOptions({maxNumHands:1, modelComplexity:1, minDetectionConfidence:0.65, minTrackingConfidence:0.65});
    hands.onResults(onHandResults);
    const cam = new Camera(video, {onFrame: async()=>{ await hands.send({image: video}); }, width:1280, height:720});
    await cam.start();
    statusBox.textContent = 'ชี้นิ้ว แล้วจีบนิ้วเพื่อจับ'; speak('ชี้นิ้ว แล้วจีบนิ้วเพื่อจับและลาก');
  }catch(e){
    console.error(e);
    statusBox.textContent = 'เปิดกล้องไม่ได้: กรุณาเปิดผ่าน HTTPS และอนุญาตกล้อง';
    showToast('กรุณาอนุญาตกล้อง<br>และเปิดผ่าน HTTPS', 3000);
  }
}

/** พลุ/ดาวเมื่อผ่านด่าน */
function burst(){
  confettiCanvas.width=innerWidth; confettiCanvas.height=innerHeight;
  const parts = Array.from({length:90},()=>({x:innerWidth/2,y:innerHeight/2,vx:(Math.random()-.5)*12,vy:(Math.random()-.9)*12,life:60,txt:['⭐','🎉','✨'][Math.floor(Math.random()*3)]}));
  function frame(){
    ctx.clearRect(0,0,innerWidth,innerHeight); ctx.font='28px sans-serif';
    parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.28;p.life--;ctx.globalAlpha=Math.max(0,p.life/60);ctx.fillText(p.txt,p.x,p.y);});
    ctx.globalAlpha=1;
    if(parts.some(p=>p.life>0)) requestAnimationFrame(frame); else ctx.clearRect(0,0,innerWidth,innerHeight);
  } frame();
}

/** ปุ่มสำรองสำหรับครูทดสอบบนคอม */
document.addEventListener('pointerdown', e => { if(e.pointerType === 'mouse') startDrag(e.clientX,e.clientY); });
document.addEventListener('pointermove', e => { if(e.pointerType === 'mouse') moveDrag(e.clientX,e.clientY); });
document.addEventListener('pointerup', e => { if(e.pointerType === 'mouse') endDrag(e.clientX,e.clientY); });

$('#backBtn').addEventListener('click',()=>showScreen('wheel'));
$('#resetBtn').addEventListener('click',()=>{ score=0; playedQueue=[]; updateScore(); showToast('เริ่มใหม่แล้ว'); });
spinTarget.addEventListener('click', spinWheel);
$('#checkTarget').addEventListener('click', checkAnswer);
$('#nextTarget').addEventListener('click',()=>showScreen('wheel'));

updateScore();
renderWheelLabels();
initHands();
