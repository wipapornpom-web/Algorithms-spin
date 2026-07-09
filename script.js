/*
  Algorithm Spin Challenge - Finger Drag Stable Edition
  - เปิดกล้องเต็มจอ
  - ใช้ MediaPipe Hands ตรวจจับปลายนิ้วชี้
  - โบกมือเพื่อหมุนวงล้อ
  - ทุกด่านใช้การชี้/ลากนิ้วตามเส้นทาง
*/

const video = document.getElementById('camera');
const mirrorCanvas = document.getElementById('mirrorCanvas');
const gameCanvas = document.getElementById('gameCanvas');
const mctx = mirrorCanvas.getContext('2d');
const g = gameCanvas.getContext('2d');
const scoreText = document.getElementById('scoreText');
const modeText = document.getElementById('modeText');
const msg = document.getElementById('messageText');
const loading = document.getElementById('loadingPanel');

let W = 1280, H = 720;
let finger = null;
let handSeen = false;
let score = 0;
let state = 'wheel';
let wheelAngle = 0;
let spinning = false;
let spinEndTime = 0;
let spinStartTime = 0;
let spinStartAngle = 0;
let spinTargetAngle = 0;
let currentMission = null;
let remainingMissionIds = [];
let waveHistory = [];
let lastWaveSpin = 0;
let gameProgress = 0;
let successUntil = 0;

const missions = [
  { id:0, name:'เก็บเพชร', icon:'💎', color:'#6ee7ff', goal:'ลากนิ้วตามทาง พาหุ่นยนต์เก็บเพชร', checkpoints:['💎','🏁'], path:[[.15,.72],[.32,.72],[.32,.42],[.55,.42],[.55,.64],[.78,.64],[.84,.32]] },
  { id:1, name:'ไปหาธง', icon:'🏁', color:'#a78bfa', goal:'ลากตามถนนไปถึงธง', checkpoints:['🏁'], path:[[.18,.64],[.42,.64],[.42,.30],[.70,.30],[.82,.54]] },
  { id:2, name:'ส่งของ', icon:'📦', color:'#facc15', goal:'พากล่องไปส่งบ้าน', checkpoints:['📦','🏠'], path:[[.14,.35],[.36,.35],[.36,.67],[.58,.67],[.58,.38],[.82,.38]] },
  { id:3, name:'ปลูกต้นไม้', icon:'🌱', color:'#86efac', goal:'ลากไปตามขั้นตอนปลูกต้นไม้', checkpoints:['🌱','💧','🌳'], path:[[.16,.68],[.31,.50],[.48,.66],[.63,.45],[.82,.58]] },
  { id:4, name:'แปรงฟัน', icon:'🦷', color:'#f9a8d4', goal:'ลากตามลำดับแปรงฟัน', checkpoints:['🪥','🧴','😁','💧'], path:[[.14,.62],[.32,.42],[.49,.62],[.66,.42],[.84,.62]] },
  { id:5, name:'พิซซ่า', icon:'🍕', color:'#fb923c', goal:'ลากตามขั้นตอนทำพิซซ่า', checkpoints:['🥖','🍅','🧀','🔥'], path:[[.15,.40],[.33,.62],[.51,.40],[.68,.62],[.85,.40]] },
  { id:6, name:'จรวด', icon:'🚀', color:'#c4b5fd', goal:'ลากตามทางปล่อยจรวด', checkpoints:['🔧','3️⃣','2️⃣','1️⃣','🚀'], path:[[.18,.70],[.32,.56],[.46,.43],[.60,.32],[.74,.24],[.86,.15]] },
  { id:7, name:'เปิดคอม', icon:'💻', color:'#93c5fd', goal:'ลากตามขั้นตอนเปิดคอมพิวเตอร์', checkpoints:['🔌','🔘','💻','✅'], path:[[.13,.52],[.32,.52],[.45,.32],[.61,.52],[.80,.52]] },
  { id:8, name:'เก็บของเล่น', icon:'🧸', color:'#fde68a', goal:'ลากเก็บของเล่นเข้ากล่อง', checkpoints:['🧸','🪀','🧩','📦'], path:[[.16,.35],[.33,.62],[.51,.36],[.68,.62],[.84,.50]] },
  { id:9, name:'ล้างมือ', icon:'🧼', color:'#67e8f9', goal:'ลากตามขั้นตอนล้างมือ', checkpoints:['💧','🧼','👏','🚿','🧻'], path:[[.13,.66],[.29,.47],[.45,.66],[.61,.47],[.77,.66],[.88,.45]] }
];

/** ปรับขนาด Canvas ให้เต็มหน้าจอ */
function resize(){
  W = window.innerWidth; H = window.innerHeight;
  mirrorCanvas.width = gameCanvas.width = W;
  mirrorCanvas.height = gameCanvas.height = H;
}
window.addEventListener('resize', resize); resize();

/** แสดงข้อความแนะนำเด็ก */
function say(text){ msg.textContent = text; }

/** เสียงสั้น ๆ สร้างด้วย WebAudio ไม่ต้องมีไฟล์เสียง */
function beep(type='ok'){
  try{
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ac.createOscillator(); const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.frequency.value = type==='win'? 660 : type==='spin'? 360 : type==='bad'? 150 : 520;
    gain.gain.setValueAtTime(.001, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(.12, ac.currentTime+.02);
    gain.gain.exponentialRampToValueAtTime(.001, ac.currentTime+.18);
    osc.start(); osc.stop(ac.currentTime+.2);
  }catch(e){}
}

/** วาดภาพกล้องเป็นพื้นหลังเต็มจอ */
function drawCamera(){
  if(video.readyState >= 2){
    mctx.save();
    mctx.clearRect(0,0,W,H);
    const vw = video.videoWidth || W, vh = video.videoHeight || H;
    const scale = Math.max(W/vw, H/vh);
    const sw = vw*scale, sh = vh*scale;
    mctx.drawImage(video, (W-sw)/2, (H-sh)/2, sw, sh);
    mctx.fillStyle = 'rgba(18,12,48,.34)';
    mctx.fillRect(0,0,W,H);
    mctx.restore();
  }
}

/** เริ่มระบบกล้องและ MediaPipe Hands */
async function startCameraAndHands(){
  try{
    const hands = new Hands({locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
    hands.setOptions({maxNumHands:1, modelComplexity:1, minDetectionConfidence:.62, minTrackingConfidence:.55});
    hands.onResults(onHandResults);
    const camera = new Camera(video, {onFrame: async()=>{ await hands.send({image:video}); }, width:1280, height:720});
    await camera.start();
    loading.classList.add('hidden');
    say('โบกมือเพื่อหมุนวงล้อ');
  }catch(err){
    console.error(err);
    say('เปิดกล้องไม่ได้ กรุณาเปิดผ่าน HTTPS/GitHub Pages และอนุญาตกล้อง');
    loading.querySelector('p').textContent = 'เปิดกล้องไม่ได้ กรุณาอนุญาตกล้อง หรือเปิดผ่าน GitHub Pages/HTTPS';
  }
}

/** รับค่าปลายนิ้วชี้จาก MediaPipe */
function onHandResults(results){
  handSeen = !!(results.multiHandLandmarks && results.multiHandLandmarks.length);
  if(handSeen){
    const lm = results.multiHandLandmarks[0];
    const indexTip = lm[8];
    // กล้องแสดงแบบกระจก จึงกลับค่า x ให้ตรงกับภาพบนจอ
    finger = {x:(1-indexTip.x)*W, y:indexTip.y*H};
    detectWave(finger.x);
  }else{
    finger = null;
  }
}

/** ตรวจจับการโบกมือแบบง่าย: x แกว่งซ้ายขวากว้างพอ */
function detectWave(x){
  const now = performance.now();
  waveHistory.push({x, t:now});
  waveHistory = waveHistory.filter(p => now-p.t < 900);
  if(state !== 'wheel' || spinning || now-lastWaveSpin < 2200 || waveHistory.length < 8) return;
  const xs = waveHistory.map(p=>p.x);
  const amp = Math.max(...xs) - Math.min(...xs);
  if(amp > Math.min(260, W*.22)){
    lastWaveSpin = now;
    startSpin();
  }
}

/** เริ่มหมุนวงล้อและสุ่มภารกิจแบบไม่ซ้ำ */
function startSpin(){
  if(remainingMissionIds.length === 0) remainingMissionIds = missions.map(m=>m.id);
  const pickIndex = Math.floor(Math.random()*remainingMissionIds.length);
  const missionId = remainingMissionIds.splice(pickIndex,1)[0];
  currentMission = missions.find(m=>m.id===missionId);
  const seg = Math.PI*2/missions.length;
  const targetCenter = missionId*seg + seg/2;
  spinStartTime = performance.now(); spinEndTime = spinStartTime + 3200;
  spinStartAngle = wheelAngle;
  // pointer อยู่ด้านบน จึงตั้งเป้าให้ช่องนั้นมาหยุดด้านบน
  spinTargetAngle = (Math.PI*1.5 - targetCenter) + Math.PI*2*(4+Math.random()*2);
  spinning = true;
  modeText.textContent = 'กำลังหมุน...';
  say('วงล้อกำลังหมุน...');
  beep('spin');
}

/** เมื่อวงล้อหยุด ให้เข้าเกม */
function enterMission(){
  state = 'mission'; spinning = false; gameProgress = 0;
  modeText.textContent = currentMission.name;
  say(currentMission.goal);
}

/** วาดวงล้อพร้อมชื่อเกม */
function drawWheel(){
  const cx = W/2, cy = H/2+10;
  const r = Math.min(W,H)*.34;
  g.save();
  g.translate(cx,cy); g.rotate(wheelAngle);
  const seg = Math.PI*2/missions.length;
  for(const m of missions){
    const a0 = m.id*seg, a1 = a0+seg;
    g.beginPath(); g.moveTo(0,0); g.arc(0,0,r,a0,a1); g.closePath();
    g.fillStyle = m.color; g.fill();
    g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke();

    g.save();
    g.rotate(a0+seg/2); g.translate(r*.62,0); g.rotate(Math.PI/2);
    g.fillStyle = '#24114d'; g.textAlign = 'center'; g.textBaseline='middle';
    g.font = `900 ${Math.max(16, r*.075)}px Arial`;
    g.fillText(m.icon,0,-18);
    g.font = `900 ${Math.max(13, r*.05)}px Arial`;
    wrapText(g,m.name,0,12,r*.35,18);
    g.restore();
  }
  g.restore();

  // ตัวชี้ด้านบน
  g.beginPath();
  g.moveTo(cx, cy-r-28); g.lineTo(cx-28, cy-r+26); g.lineTo(cx+28, cy-r+26); g.closePath();
  g.fillStyle = '#ffef5a'; g.fill(); g.lineWidth=4; g.strokeStyle='#4b247d'; g.stroke();

  // กล่องชื่อเกมตรงกลาง
  g.fillStyle='rgba(255,255,255,.92)'; roundRect(cx-r*.42, cy-r*.22, r*.84, r*.44, 28, true, false);
  g.fillStyle='#3b197d'; g.textAlign='center'; g.textBaseline='middle';
  g.font = `900 ${Math.max(25, r*.11)}px Arial`;
  g.fillText('Algorithm', cx, cy-16);
  g.font = `900 ${Math.max(22, r*.09)}px Arial`;
  g.fillText('Spin', cx, cy+26);

  g.font = `900 ${Math.max(20,W*.022)}px Arial`; g.fillStyle='white';
  g.fillText('👋 โบกมือเพื่อหมุนวงล้อ', cx, H*.16);
}

/** วาดข้อความหลายบรรทัด */
function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = text.split(' '); let line='', lines=[];
  for(const w of words){
    const test = line ? line+' '+w : w;
    if(ctx.measureText(test).width > maxWidth && line){ lines.push(line); line=w; } else line=test;
  }
  lines.push(line);
  lines.forEach((ln,i)=>ctx.fillText(ln,x,y+i*lineHeight));
}

/** แปลงจุด normalized เป็นจุดจริง */
function pathPoints(m){ return m.path.map(p=>({x:p[0]*W, y:p[1]*H})); }

/** สร้างข้อมูลความยาว path */
function pathMetrics(points){
  const lens=[0]; let total=0;
  for(let i=1;i<points.length;i++){ total += dist(points[i-1],points[i]); lens.push(total); }
  return {lens,total};
}

/** หาจุดบนเส้นทางที่ใกล้นิ้วที่สุด */
function nearestOnPath(pt, points){
  const {lens,total}=pathMetrics(points); let best={d:Infinity, progress:0, x:points[0].x, y:points[0].y};
  for(let i=1;i<points.length;i++){
    const a=points[i-1], b=points[i]; const vx=b.x-a.x, vy=b.y-a.y;
    const l2=vx*vx+vy*vy; let t=((pt.x-a.x)*vx+(pt.y-a.y)*vy)/l2; t=Math.max(0,Math.min(1,t));
    const x=a.x+vx*t, y=a.y+vy*t; const d=Math.hypot(pt.x-x,pt.y-y);
    const progress=(lens[i-1]+Math.sqrt(l2)*t)/total;
    if(d<best.d) best={d,progress,x,y};
  }
  return best;
}
function pointAtProgress(points, p){
  const {lens,total}=pathMetrics(points); const target=p*total;
  for(let i=1;i<points.length;i++){
    if(target<=lens[i]){
      const segLen=lens[i]-lens[i-1]; const t=(target-lens[i-1])/segLen;
      return {x:points[i-1].x+(points[i].x-points[i-1].x)*t, y:points[i-1].y+(points[i].y-points[i-1].y)*t};
    }
  }
  return points[points.length-1];
}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}

/** วาดภารกิจแบบเส้นทางให้ลากตาม */
function drawMission(){
  const m = currentMission; const pts = pathPoints(m);
  const road = Math.max(52, Math.min(W,H)*.075);

  // ชื่อด่าน
  g.textAlign='center'; g.textBaseline='middle';
  g.fillStyle='rgba(255,255,255,.9)'; roundRect(W*.18, H*.08, W*.64, 64, 26, true, false);
  g.fillStyle='#30145f'; g.font=`900 ${Math.max(22,W*.025)}px Arial`;
  g.fillText(`${m.icon} ${m.name}`, W/2, H*.08+32);

  // ถนน/ทางเดิน
  g.lineCap='round'; g.lineJoin='round';
  g.beginPath(); pts.forEach((p,i)=> i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));
  g.lineWidth=road+18; g.strokeStyle='rgba(255,255,255,.85)'; g.stroke();
  g.beginPath(); pts.forEach((p,i)=> i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));
  g.lineWidth=road; g.strokeStyle='rgba(98, 52, 190, .88)'; g.stroke();
  g.setLineDash([18,18]);
  g.beginPath(); pts.forEach((p,i)=> i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));
  g.lineWidth=5; g.strokeStyle='rgba(255,255,255,.75)'; g.stroke();
  g.setLineDash([]);

  // จุดเริ่มและจุดตามลำดับ
  drawEmoji('🤖', pts[0].x, pts[0].y, 56, '#fff');
  const checkpointCount = m.checkpoints.length;
  for(let i=0;i<checkpointCount;i++){
    const p = pointAtProgress(pts, (i+1)/(checkpointCount+1));
    drawEmoji(m.checkpoints[i], p.x, p.y, 46, '#fff');
    drawNumber(i+1, p.x-34, p.y-34);
  }
  const end = pts[pts.length-1]; drawEmoji('🏁', end.x, end.y, 58, '#fff');

  // ตรวจการลากนิ้ว: ให้เสถียรและให้อภัย ไม่รีเซ็ตทันทีเมื่อหลุด
  if(finger){
    const near = nearestOnPath(finger, pts);
    const tolerance = Math.max(75, Math.min(W,H)*.10);
    if(near.d < tolerance && near.progress > gameProgress - .05){
      gameProgress = Math.max(gameProgress, near.progress);
      if(gameProgress > .985) completeMission();
    }
  }

  // หุ่นยนต์ที่เดินตาม progress
  const robot = pointAtProgress(pts, gameProgress);
  drawEmoji('🤖', robot.x, robot.y, 70, '#ffef5a');

  // แถบ progress
  g.fillStyle='rgba(255,255,255,.85)'; roundRect(W*.22,H*.88,W*.56,24,12,true,false);
  g.fillStyle='#34d399'; roundRect(W*.22,H*.88,W*.56*gameProgress,24,12,true,false);

  g.fillStyle='white'; g.font=`900 ${Math.max(18,W*.018)}px Arial`; g.textAlign='center';
  g.fillText('👆 ใช้นิ้วชี้ลากตามทางสีม่วงจนถึงธง', W/2, H*.84);
}

/** ผ่านด่านแล้วกลับไปวงล้อ */
function completeMission(){
  if(state !== 'mission') return;
  state = 'success'; successUntil = performance.now()+2300; score += 10; scoreText.textContent = score;
  modeText.textContent = 'ผ่านด่าน'; say('เก่งมาก! ผ่านแล้ว กลับไปหมุนวงล้อต่อ'); beep('win');
}

/** วาดเอฟเฟกต์สำเร็จ */
function drawSuccess(){
  drawMission();
  g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(0,0,W,H);
  g.textAlign='center'; g.textBaseline='middle';
  g.font=`900 ${Math.max(54,W*.07)}px Arial`; g.fillStyle='#ffef5a';
  g.fillText('ผ่านแล้ว! ⭐', W/2, H/2-30);
  g.font=`900 ${Math.max(24,W*.03)}px Arial`; g.fillStyle='white';
  g.fillText('+10 คะแนน', W/2, H/2+48);
  for(let i=0;i<26;i++){
    const a=i/26*Math.PI*2 + performance.now()/500;
    const r=120+40*Math.sin(performance.now()/300+i);
    drawEmoji('⭐', W/2+Math.cos(a)*r, H/2+Math.sin(a)*r, 24, 'transparent');
  }
  if(performance.now()>successUntil){ state='wheel'; currentMission=null; modeText.textContent='โบกมือหมุนวงล้อ'; say('โบกมือเพื่อหมุนวงล้อ'); }
}

/** วาดนิ้วชี้บนจอ */
function drawFinger(){
  if(!finger) return;
  g.beginPath(); g.arc(finger.x,finger.y,24,0,Math.PI*2); g.fillStyle='rgba(255,239,90,.92)'; g.fill();
  g.lineWidth=5; g.strokeStyle='white'; g.stroke();
  g.font='34px Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('👆', finger.x, finger.y-2);
}

function drawEmoji(emoji,x,y,size,bg){
  g.save();
  if(bg && bg!=='transparent'){
    g.beginPath(); g.arc(x,y,size*.62,0,Math.PI*2); g.fillStyle=bg; g.fill();
    g.lineWidth=4; g.strokeStyle='rgba(60,30,120,.8)'; g.stroke();
  }
  g.font=`${size}px Arial`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(emoji,x,y+2);
  g.restore();
}
function drawNumber(n,x,y){
  g.beginPath(); g.arc(x,y,18,0,Math.PI*2); g.fillStyle='#ffef5a'; g.fill();
  g.lineWidth=3; g.strokeStyle='#4b247d'; g.stroke();
  g.fillStyle='#32155f'; g.font='900 20px Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(n,x,y+1);
}
function roundRect(x,y,w,h,r,fill,stroke){
  g.beginPath();
  g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath();
  if(fill) g.fill(); if(stroke) g.stroke();
}

/** วนวาดเกม */
function loop(){
  requestAnimationFrame(loop);
  drawCamera();
  g.clearRect(0,0,W,H);
  const now = performance.now();
  if(spinning){
    const t = Math.min(1,(now-spinStartTime)/(spinEndTime-spinStartTime));
    const ease = 1-Math.pow(1-t,4);
    wheelAngle = spinStartAngle + spinTargetAngle*ease;
    if(t>=1) enterMission();
  }
  if(state==='wheel') drawWheel();
  else if(state==='mission') drawMission();
  else if(state==='success') drawSuccess();
  drawFinger();

  if(!handSeen){
    g.fillStyle='rgba(0,0,0,.32)'; roundRect(W*.30,H*.18,W*.40,54,24,true,false);
    g.fillStyle='white'; g.font=`900 ${Math.max(17,W*.018)}px Arial`; g.textAlign='center'; g.textBaseline='middle';
    g.fillText('ยกมือเข้ากล้องให้เห็นนิ้วชี้', W/2, H*.18+27);
  }
}

startCameraAndHands();
loop();
