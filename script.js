/* Algorithm Spin Challenge - Motion Only, no mouse/touch controls */
const wheel = document.getElementById('wheel');
const ctx = wheel.getContext('2d');
const video = document.getElementById('camera');
const motionCanvas = document.getElementById('motionCanvas');
const mctx = motionCanvas.getContext('2d', { willReadFrequently: true });
const statusEl = document.getElementById('cameraStatus');
const toastEl = document.getElementById('toast');

const missions = [
  {type:'Robot Maze', title:'พาหุ่นยนต์ไปดาว', q:'อัลกอริทึมใดทำให้หุ่นยนต์เดินถึงดาวพอดี?', options:['เดินหน้า → เดินหน้า → เลี้ยวขวา → เดินหน้า','เลี้ยวซ้าย → เดินหน้า → ถอยหลัง','เดินหน้า → ถอยหลัง → หมุนตัว'], answer:0},
  {type:'Debug', title:'แก้คำสั่งผิด', q:'คำสั่งใดควรแก้ เพื่อให้หุ่นยนต์ไม่ชนกำแพง?', options:['เดินหน้า 3 ก้าว','เลี้ยวขวาก่อนเดินหน้า','หยุดเล่นเกม'], answer:1},
  {type:'Order', title:'เรียงลำดับล้างมือ', q:'ขั้นตอนใดเป็นลำดับที่ถูกต้อง?', options:['เปิดน้ำ → ถูสบู่ → ล้างน้ำ → เช็ดมือ','เช็ดมือ → ถูสบู่ → เปิดน้ำ','ถูสบู่ → กินขนม → ล้างน้ำ'], answer:0},
  {type:'Rocket', title:'ปล่อยจรวด', q:'ก่อนจรวดบิน ควรทำอะไรก่อน?', options:['นับถอยหลังทันที','ตรวจเชื้อเพลิงและความปลอดภัย','เก็บจรวดเข้ากล่อง'], answer:1},
  {type:'Treasure', title:'เก็บสมบัติ', q:'ถ้าต้องเก็บเหรียญก่อนเข้าประตู ควรสั่งอย่างไร?', options:['เข้าประตู → เก็บเหรียญ','เก็บเหรียญ → เดินไปประตู → เปิดประตู','หมุนตัวอย่างเดียว'], answer:1}
];

let remaining = [...missions.keys()];
let currentMission = null;
let selected = 0;
let score = 0;
let played = 0;
let rotation = 0;
let spinning = false;
let screen = 'home';
let lastFrame = null;
let lastGestureTime = 0;
let lastZone = 'center';
let stableZoneCount = 0;

function showToast(text){ toastEl.textContent = text; toastEl.classList.add('show'); setTimeout(()=>toastEl.classList.remove('show'),1300); }
function showScreen(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function updateScore(){ document.getElementById('score').textContent = score; document.getElementById('missionCount').textContent = `${played}/5`; }

function drawWheel(){
  const cx=260, cy=260, r=238, slice=(Math.PI*2)/missions.length;
  ctx.clearRect(0,0,520,520); ctx.save(); ctx.translate(cx,cy); ctx.rotate(rotation);
  missions.forEach((m,i)=>{
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,r,i*slice,(i+1)*slice); ctx.closePath();
    ctx.fillStyle=['#62d8ff','#8b6cff','#ffe166','#ff86d3','#8bf0aa'][i%5]; ctx.fill();
    ctx.strokeStyle='white'; ctx.lineWidth=8; ctx.stroke();
    ctx.save(); ctx.rotate(i*slice+slice/2); ctx.textAlign='right'; ctx.fillStyle='#172047'; ctx.font='bold 25px Trebuchet MS'; ctx.fillText(m.type,r-22,8); ctx.restore();
  });
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.lineWidth=10; ctx.strokeStyle='#fff'; ctx.stroke(); ctx.restore();
}

function spinWheel(){
  if(spinning || remaining.length===0) return;
  spinning = true; showScreen('screenHome'); showToast('วงล้อกำลังหมุน!');
  const pickPos = Math.floor(Math.random()*remaining.length);
  const missionIndex = remaining.splice(pickPos,1)[0];
  const slice = (Math.PI*2)/missions.length;
  const targetAngle = -missionIndex*slice - slice/2 - Math.PI/2;
  const start = rotation; const extra = Math.PI*2*(4+Math.random()*2); const end = targetAngle + extra;
  const startTime = performance.now(); const duration = 3600;
  function anim(t){
    const p=Math.min((t-startTime)/duration,1); const ease=1-Math.pow(1-p,4);
    rotation=start+(end-start)*ease; drawWheel();
    if(p<1) requestAnimationFrame(anim); else { spinning=false; startMission(missionIndex); }
  }
  requestAnimationFrame(anim);
}

function startMission(index){
  currentMission = missions[index]; selected = 0; screen='mission';
  document.getElementById('missionType').textContent = currentMission.type;
  document.getElementById('missionTitle').textContent = currentMission.title;
  document.getElementById('missionQuestion').textContent = currentMission.q;
  const options = document.getElementById('options'); options.innerHTML='';
  currentMission.options.forEach((op,i)=>{ const div=document.createElement('div'); div.className='option'+(i===0?' selected':''); div.textContent=`${i+1}. ${op}`; options.appendChild(div); });
  showScreen('screenMission'); showToast('เริ่มภารกิจ');
}

function moveSelection(dir){
  if(screen !== 'mission') return;
  selected = (selected + dir + currentMission.options.length) % currentMission.options.length;
  document.querySelectorAll('.option').forEach((o,i)=>o.classList.toggle('selected', i===selected));
  showToast(dir < 0 ? 'เลือกซ้าย' : 'เลือกขวา');
}

function confirmAction(){
  if(spinning) return;
  if(screen === 'home') { spinWheel(); return; }
  if(screen === 'result') { remaining.length ? spinWheel() : endGame(); return; }
  if(screen === 'end') { resetGame(); return; }
  if(screen !== 'mission') return;
  const ok = selected === currentMission.answer;
  if(ok){ score += 10; played += 1; updateScore(); showResult('ถูกต้อง!','คิดเป็นลำดับได้ดีมาก +10 คะแนน', true); }
  else { showResult('ยังไม่ถูกค่ะ',`เฉลยคือ: ${currentMission.options[currentMission.answer]} ลองจำลำดับใหม่นะคะ`, false); }
}

function showResult(title,text,good){ screen='result'; document.getElementById('resultTitle').textContent=title; document.getElementById('resultText').textContent=text; document.getElementById('stars').textContent=good?'⭐ 🎉 ⭐':'💡 ลองใหม่ได้'; showScreen('screenResult'); showToast(good?'เยี่ยมมาก!':'ดูเฉลยแล้วลองใหม่'); }
function endGame(){ screen='end'; document.getElementById('finalScore').textContent=score; saveScore(score); renderLeaderboard(); showScreen('screenEnd'); }
function resetGame(){ remaining=[...missions.keys()]; score=0; played=0; currentMission=null; selected=0; screen='home'; updateScore(); showScreen('screenHome'); showToast('เริ่มใหม่แล้ว'); }
function saveScore(s){ const list=JSON.parse(localStorage.getItem('asc_scores')||'[]'); list.push({score:s,date:new Date().toLocaleDateString('th-TH')}); list.sort((a,b)=>b.score-a.score); localStorage.setItem('asc_scores',JSON.stringify(list.slice(0,5))); }
function renderLeaderboard(){ const list=JSON.parse(localStorage.getItem('asc_scores')||'[]'); document.getElementById('leaderboard').innerHTML='<b>🏆 คะแนนสูงสุด</b>'+list.map((x,i)=>`<div>${i+1}. ${x.score} คะแนน (${x.date})</div>`).join(''); }

async function startCamera(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:640,height:480}, audio:false});
    video.srcObject = stream; statusEl.textContent='กล้องพร้อม'; showToast('กล้องพร้อมเล่นแล้ว'); requestAnimationFrame(detectMotion);
  }catch(e){ statusEl.textContent='เปิดกล้องไม่ได้'; showToast('กรุณาอนุญาตใช้กล้อง'); }
}

function detectMotion(){
  if(video.readyState >= 2){
    mctx.drawImage(video,0,0,320,240);
    const frame = mctx.getImageData(0,0,320,240);
    if(lastFrame){
      let zones=[0,0,0], total=0;
      for(let y=0;y<240;y+=8){ for(let x=0;x<320;x+=8){
        const i=(y*320+x)*4; const d=Math.abs(frame.data[i]-lastFrame.data[i])+Math.abs(frame.data[i+1]-lastFrame.data[i+1])+Math.abs(frame.data[i+2]-lastFrame.data[i+2]);
        if(d>70){ const z=x<107?0:x<214?1:2; zones[z]++; total++; }
      }}
      if(total>16){
        const maxIndex = zones.indexOf(Math.max(...zones)); const zoneName=['left','center','right'][maxIndex];
        if(zoneName===lastZone) stableZoneCount++; else { lastZone=zoneName; stableZoneCount=1; }
        const now=Date.now();
        if(stableZoneCount>=3 && now-lastGestureTime>1100){
          lastGestureTime=now;
          if(zoneName==='left') moveSelection(-1); else if(zoneName==='right') moveSelection(1); else confirmAction();
        }
      }
    }
    lastFrame = frame;
  }
  requestAnimationFrame(detectMotion);
}

drawWheel(); updateScore(); startCamera();
