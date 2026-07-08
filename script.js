/* Algorithm Spin Challenge - Vanilla JavaScript */

const screens = {
  home: document.getElementById('homeScreen'),
  how: document.getElementById('howScreen'),
  leader: document.getElementById('leaderScreen'),
  spin: document.getElementById('spinScreen'),
  mission: document.getElementById('missionScreen'),
  finish: document.getElementById('finishScreen')
};

const missions = [
  { id:'maze', icon:'🤖', title:'Robot Maze', desc:'เรียงคำสั่งให้หุ่นยนต์เดินถึงเป้าหมาย', type:'sequence', map:['S..','.#.','..G'], correct:['เดินขวา','เดินขวา','เดินลง','เดินลง'], choices:['เดินลง','เดินขวา','เดินขวา','เดินลง'] },
  { id:'debug', icon:'🐞', title:'Debug', desc:'หาคำสั่งที่ผิด แล้วเลือกคำสั่งที่ควรแก้', type:'choice', question:'หุ่นยนต์ต้องไปทางขวา 2 ครั้ง แต่มีคำสั่งผิด: ขวา → ลง → ขวา ควรแก้คำสั่งใด?', choices:['เปลี่ยน “ลง” เป็น “ขวา”','เปลี่ยน “ขวา” ตัวแรกเป็น “ขึ้น”','ลบคำสั่งทั้งหมด','เปลี่ยนเป้าหมาย'], correct:'เปลี่ยน “ลง” เป็น “ขวา”' },
  { id:'order', icon:'🔢', title:'Order', desc:'เรียงลำดับการล้างมือให้ถูกต้อง', type:'sequence', correct:['เปิดน้ำ','ล้างมือให้เปียก','ถูสบู่','ล้างน้ำสะอาด','เช็ดมือ'], choices:['ถูสบู่','เช็ดมือ','เปิดน้ำ','ล้างน้ำสะอาด','ล้างมือให้เปียก'] },
  { id:'memory', icon:'🧠', title:'Memory', desc:'จำลำดับคำสั่ง แล้วเลือกตามลำดับที่เห็น', type:'memory', correct:['⬆️ ขึ้น','➡️ ขวา','⬇️ ลง','⭐ เก็บดาว'], choices:['⭐ เก็บดาว','⬇️ ลง','➡️ ขวา','⬆️ ขึ้น'] },
  { id:'treasure', icon:'💰', title:'Treasure', desc:'พาหุ่นยนต์เก็บสมบัติให้ครบก่อนถึงประตู', type:'sequence', correct:['เดินขวา','เก็บสมบัติ','เดินลง','เดินขวา','เข้าประตู'], choices:['เข้าประตู','เดินลง','เก็บสมบัติ','เดินขวา','เดินขวา'] },
  { id:'rocket', icon:'🚀', title:'Rocket', desc:'เรียงขั้นตอนปล่อยจรวดอย่างปลอดภัย', type:'sequence', correct:['ตรวจเชื้อเพลิง','นับถอยหลัง','กดปุ่มปล่อย','จรวดพุ่งขึ้น','แยกชิ้นส่วน'], choices:['กดปุ่มปล่อย','ตรวจเชื้อเพลิง','แยกชิ้นส่วน','นับถอยหลัง','จรวดพุ่งขึ้น'] },
  { id:'pizza', icon:'🍕', title:'Pizza', desc:'เรียงอัลกอริทึมการทำพิซซ่า', type:'sequence', correct:['เตรียมแป้ง','ทาซอส','ใส่ชีส','อบพิซซ่า','หั่นแบ่ง'], choices:['อบพิซซ่า','ทาซอส','เตรียมแป้ง','หั่นแบ่ง','ใส่ชีส'] },
  { id:'brush', icon:'🪥', title:'Brush Teeth', desc:'เรียงขั้นตอนแปรงฟันให้ถูกต้อง', type:'sequence', correct:['บีบยาสีฟัน','แปรงฟันบน','แปรงฟันล่าง','บ้วนปาก','ล้างแปรง'], choices:['บ้วนปาก','แปรงฟันล่าง','บีบยาสีฟัน','ล้างแปรง','แปรงฟันบน'] },
  { id:'computer', icon:'💻', title:'Computer Start', desc:'เรียงขั้นตอนเปิดคอมพิวเตอร์', type:'sequence', correct:['เสียบปลั๊ก','กดปุ่มเปิดเครื่อง','รอหน้าจอทำงาน','ใส่รหัสผ่าน','เปิดโปรแกรม'], choices:['เปิดโปรแกรม','กดปุ่มเปิดเครื่อง','เสียบปลั๊ก','ใส่รหัสผ่าน','รอหน้าจอทำงาน'] },
  { id:'diamond', icon:'💎', title:'Diamond Run', desc:'วางคำสั่งให้เก็บเพชรแล้วไปถึงเส้นชัย', type:'sequence', correct:['เดินขวา','เก็บเพชร','เดินขวา','เดินลง','ถึงเส้นชัย'], choices:['เดินลง','เดินขวา','ถึงเส้นชัย','เก็บเพชร','เดินขวา'] },
  { id:'rescue', icon:'🦾', title:'Rescue Robot', desc:'ช่วยหุ่นยนต์หลบสิ่งกีดขวาง', type:'choice', question:'มีสิ่งกีดขวางอยู่ด้านหน้า หุ่นยนต์ควรทำอะไรเป็นขั้นแรก?', choices:['เลี้ยวซ้ายเพื่อหลบ','เดินชนสิ่งกีดขวาง','ปิดเครื่องทันที','ย้อนกลับไปเริ่มใหม่เสมอ'], correct:'เลี้ยวซ้ายเพื่อหลบ' },
  { id:'speed', icon:'⚡', title:'Speed Challenge', desc:'เรียงขั้นตอนให้ถูกก่อนหมดเวลา 30 วินาที', type:'sequence', timed:true, time:30, correct:['มองโจทย์','คิดลำดับ','เลือกคำสั่ง','ตรวจคำตอบ'], choices:['ตรวจคำตอบ','เลือกคำสั่ง','มองโจทย์','คิดลำดับ'] }
];

let score = 0;
let remaining = [];
let currentMission = null;
let selectedOrder = [];
let timer = null;
let timeLeft = 0;
let wheelRotation = 0;

/** เปิดเสียงสั้น ๆ ด้วย Web Audio โดยไม่ต้องใช้ไฟล์เสียงภายนอก */
function playSound(type){
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if(!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const tones = { click:520, spin:260, good:760, bad:150, finish:920 };
  osc.frequency.value = tones[type] || 440;
  osc.type = type === 'bad' ? 'sawtooth' : 'sine';
  gain.gain.setValueAtTime(.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + (type === 'spin' ? .55 : .22));
  osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + (type === 'spin' ? .55 : .22));
}

/** สลับหน้าจอหลักของเกม */
function showScreen(name){
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

/** เริ่มเกมใหม่และรีเซ็ตภารกิจที่เหลือ */
function startGame(){
  score = 0;
  remaining = [...missions];
  updateScore();
  drawWheel();
  showScreen('spin');
}

/** วาดข้อความชื่อภารกิจลงบนวงล้อแบบง่าย */
function drawWheel(){
  const wheel = document.getElementById('wheel');
  wheel.innerHTML = '';
  missions.forEach((m,i)=>{
    const label = document.createElement('div');
    label.textContent = m.icon;
    label.style.position = 'absolute';
    label.style.left = '50%';
    label.style.top = '50%';
    label.style.transform = `rotate(${i*30+15}deg) translate(0,-160px) rotate(-${i*30+15}deg)`;
    label.style.fontSize = '28px';
    wheel.appendChild(label);
  });
}

/** หมุนวงล้อและสุ่มภารกิจแบบไม่ซ้ำ */
function spinWheel(){
  if(remaining.length === 0){ return finishGame(); }
  playSound('spin');
  const index = Math.floor(Math.random() * remaining.length);
  currentMission = remaining.splice(index,1)[0];
  wheelRotation += 1440 + Math.floor(Math.random()*360);
  document.getElementById('wheel').style.transform = `rotate(${wheelRotation}deg)`;
  document.getElementById('spinBtn').disabled = true;
  setTimeout(()=>{
    document.getElementById('spinBtn').disabled = false;
    loadMission(currentMission);
  }, 4100);
}

/** โหลดภารกิจเข้าสู่หน้าจอภารกิจ */
function loadMission(mission){
  stopTimer();
  selectedOrder = [];
  document.getElementById('missionIcon').textContent = mission.icon;
  document.getElementById('missionTitle').textContent = mission.title;
  document.getElementById('missionDesc').textContent = mission.desc;
  document.getElementById('feedbackBox').textContent = '';
  document.getElementById('feedbackBox').className = 'feedback';
  document.getElementById('mazeArea').innerHTML = '';
  document.getElementById('taskArea').innerHTML = '';
  if(mission.map) renderMaze(mission.map);
  if(mission.type === 'choice') renderChoiceTask(mission);
  if(mission.type === 'sequence' || mission.type === 'memory') renderSequenceTask(mission);
  if(mission.type === 'memory') showMemoryPreview(mission.correct);
  if(mission.timed) startTimer(mission.time || 30);
  updateScore();
  showScreen('mission');
}

/** แสดงแผนที่เล็ก ๆ สำหรับภารกิจหุ่นยนต์ */
function renderMaze(map){
  const area = document.getElementById('mazeArea');
  area.style.gridTemplateColumns = `repeat(${map[0].length}, 52px)`;
  map.join('').split('').forEach(ch=>{
    const cell = document.createElement('div');
    cell.className = 'cell ' + (ch === '#' ? 'wall' : 'path');
    cell.textContent = ch === 'S' ? '🤖' : ch === 'G' ? '🏁' : ch === '#' ? '🧱' : '';
    area.appendChild(cell);
  });
}

/** สร้างโจทย์แบบเลือกคำตอบเดียว */
function renderChoiceTask(mission){
  const area = document.getElementById('taskArea');
  const q = document.createElement('p');
  q.textContent = mission.question;
  q.className = 'option';
  q.style.cursor = 'default';
  area.appendChild(q);
  mission.choices.forEach(choice=>{
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = choice;
    btn.onclick = () => {
      playSound('click');
      document.querySelectorAll('.option').forEach(o=>o.classList.remove('selected'));
      btn.classList.add('selected');
      selectedOrder = [choice];
    };
    area.appendChild(btn);
  });
}

/** สร้างโจทย์แบบเรียงลำดับ โดยกดตัวเลือกเพื่อเติมช่อง */
function renderSequenceTask(mission){
  const area = document.getElementById('taskArea');
  const slotTitle = document.createElement('h3');
  slotTitle.textContent = 'ลำดับคำตอบของหนู';
  area.appendChild(slotTitle);
  mission.correct.forEach((_, i)=>{
    const slot = document.createElement('div');
    slot.className = 'drop-slot';
    slot.textContent = `${i+1}. แตะเลือกคำสั่ง`;
    area.appendChild(slot);
  });
  const optionTitle = document.createElement('h3');
  optionTitle.textContent = 'คำสั่งที่ใช้ได้';
  area.appendChild(optionTitle);
  mission.choices.forEach(choice=>{
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = choice;
    btn.onclick = () => pickSequence(choice, btn);
    area.appendChild(btn);
  });
}

/** เลือกคำสั่งลงในช่องลำดับ */
function pickSequence(choice, btn){
  if(selectedOrder.length >= currentMission.correct.length || btn.disabled) return;
  playSound('click');
  selectedOrder.push(choice);
  btn.disabled = true;
  btn.classList.add('selected');
  const slots = [...document.querySelectorAll('.drop-slot')];
  const slot = slots[selectedOrder.length - 1];
  slot.textContent = `${selectedOrder.length}. ${choice}`;
  slot.classList.add('filled');
}

/** แสดงลำดับให้จำชั่วคราวในภารกิจ Memory */
function showMemoryPreview(correct){
  const fb = document.getElementById('feedbackBox');
  fb.className = 'feedback good';
  fb.textContent = 'จำลำดับนี้: ' + correct.join(' → ');
  setTimeout(()=>{ fb.textContent = 'เริ่มเลือกตามลำดับที่จำได้เลย'; }, 3500);
}

/** ตรวจคำตอบและให้คะแนน */
function checkAnswer(){
  if(!currentMission) return;
  const answer = selectedOrder.join('|');
  const correct = (Array.isArray(currentMission.correct) ? currentMission.correct : [currentMission.correct]).join('|');
  if(answer === correct){
    score += 10;
    updateScore();
    stopTimer();
    successEffect();
    setFeedback('เก่งมาก! นี่คือการคิดแบบอัลกอริทึมทีละขั้นตอน ⭐', true);
    setTimeout(()=> remaining.length ? showScreen('spin') : finishGame(), 1800);
  }else{
    playSound('bad');
    setFeedback('ยังไม่ถูกนะ เฉลยคือ: ' + (Array.isArray(currentMission.correct) ? currentMission.correct.join(' → ') : currentMission.correct), false);
  }
}

/** แสดงเฉลยภารกิจปัจจุบัน */
function showHint(){
  if(!currentMission) return;
  setFeedback('เฉลย: ' + (Array.isArray(currentMission.correct) ? currentMission.correct.join(' → ') : currentMission.correct), false);
}

/** เริ่มภารกิจเดิมใหม่ */
function retryMission(){
  if(currentMission) loadMission(currentMission);
}

/** แสดงข้อความตอบกลับ */
function setFeedback(text, good){
  const box = document.getElementById('feedbackBox');
  box.textContent = text;
  box.className = 'feedback ' + (good ? 'good' : 'bad');
}

/** อัปเดตคะแนนบนหน้าจอ */
function updateScore(){
  document.getElementById('scoreText').textContent = score;
  document.getElementById('missionScoreText').textContent = score;
  document.getElementById('leftText').textContent = remaining.length;
}

/** เริ่มตัวจับเวลาสำหรับ Speed Challenge */
function startTimer(seconds){
  timeLeft = seconds;
  document.getElementById('timerBox').hidden = false;
  document.getElementById('timeText').textContent = timeLeft;
  timer = setInterval(()=>{
    timeLeft--;
    document.getElementById('timeText').textContent = timeLeft;
    if(timeLeft <= 0){
      stopTimer();
      playSound('bad');
      setFeedback('หมดเวลาแล้ว ลองใหม่อีกครั้งนะ', false);
    }
  },1000);
}

/** หยุดตัวจับเวลา */
function stopTimer(){
  clearInterval(timer);
  timer = null;
  document.getElementById('timerBox').hidden = true;
}

/** เอฟเฟกต์ดาวและเสียงเมื่อผ่านด่าน */
function successEffect(){
  playSound('good');
  for(let i=0;i<28;i++){
    const star = document.createElement('div');
    star.className = 'star';
    star.textContent = ['⭐','✨','🎉','🌟'][Math.floor(Math.random()*4)];
    star.style.left = (45 + Math.random()*10) + 'vw';
    star.style.top = (45 + Math.random()*10) + 'vh';
    star.style.setProperty('--x', (Math.random()*600-300)+'px');
    star.style.setProperty('--y', (Math.random()*-460-80)+'px');
    document.getElementById('starsLayer').appendChild(star);
    setTimeout(()=>star.remove(),1300);
  }
}

/** จบเกมและเข้าสู่หน้าบันทึกคะแนน */
function finishGame(){
  stopTimer();
  playSound('finish');
  document.getElementById('finalScore').textContent = score;
  showScreen('finish');
}

/** อ่านคะแนนสูงสุดจาก LocalStorage */
function getScores(){
  return JSON.parse(localStorage.getItem('algorithmSpinScores') || '[]');
}

/** บันทึกคะแนนลง LocalStorage */
function saveScore(){
  const name = document.getElementById('playerName').value.trim() || 'นักเรียนคนเก่ง';
  const scores = getScores();
  scores.push({ name, score, date:new Date().toLocaleDateString('th-TH') });
  scores.sort((a,b)=>b.score-a.score);
  localStorage.setItem('algorithmSpinScores', JSON.stringify(scores.slice(0,10)));
  renderLeaderboard();
  showScreen('leader');
}

/** แสดงตารางคะแนนสูงสุด */
function renderLeaderboard(){
  const list = document.getElementById('leaderboardList');
  const scores = getScores();
  list.innerHTML = scores.length ? '' : '<div class="rank-row">ยังไม่มีคะแนน</div>';
  scores.forEach((s,i)=>{
    const row = document.createElement('div');
    row.className = 'rank-row';
    row.innerHTML = `<span>${i+1}. ${s.name}</span><span>${s.score} คะแนน</span>`;
    list.appendChild(row);
  });
}

/** รีเซ็ตคะแนนสูงสุด */
function resetScores(){
  localStorage.removeItem('algorithmSpinScores');
  renderLeaderboard();
}

/** จุดเตรียมรองรับ AI Hand Tracking ในอนาคต */
function prepareFutureHandTracking(){
  // Future: เชื่อม MediaPipe Hands แล้ว map gesture เป็น spinWheel(), pickSequence(), checkAnswer()
  // Version แรกใช้ mouse/touch เพื่อความเสถียรบน Chrome และ Microsoft Edge
}

document.getElementById('startBtn').onclick = startGame;
document.getElementById('howBtn').onclick = () => showScreen('how');
document.getElementById('leaderBtn').onclick = () => { renderLeaderboard(); showScreen('leader'); };
document.querySelectorAll('.backHome').forEach(btn=>btn.onclick = () => showScreen('home'));
document.getElementById('homeBtn').onclick = () => showScreen('home');
document.getElementById('spinBtn').onclick = spinWheel;
document.getElementById('backToSpinBtn').onclick = () => showScreen('spin');
document.getElementById('checkBtn').onclick = checkAnswer;
document.getElementById('hintBtn').onclick = showHint;
document.getElementById('retryBtn').onclick = retryMission;
document.getElementById('saveScoreBtn').onclick = saveScore;
document.getElementById('playAgainBtn').onclick = startGame;
document.getElementById('resetScoresBtn').onclick = resetScores;

prepareFutureHandTracking();
renderLeaderboard();
