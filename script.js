'use strict';

/** Utility shortcut for selecting one element. */
const $ = (id) => document.getElementById(id);

const video = $('camera');
const canvas = $('motionCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const cameraStatus = $('cameraStatus');
const gestureStatus = $('gestureStatus');
const scoreText = $('scoreText');
const wheel = $('wheel');
const screens = ['homeScreen','wheelScreen','missionScreen','resultScreen','leaderboardScreen'];

const missions = [
  {
    id:'robot', icon:'🤖', title:'Robot Maze',
    question:'ถ้าหุ่นยนต์ต้องเดินไปถึงดาว ควรเรียงคำสั่งแบบใด?',
    options:['เดินหน้า → เดินหน้า → เลี้ยวขวา → เดินหน้า','เลี้ยวขวา → เดินหน้า → เดินหน้า → ถอยหลัง','เดินหน้า → ถอยหลัง → เลี้ยวซ้าย → หยุด'],
    answer:0,
    explain:'อัลกอริทึมต้องเรียงคำสั่งทีละขั้นให้หุ่นยนต์ไปถึงเป้าหมาย'
  },
  {
    id:'debug', icon:'🐞', title:'Debug',
    question:'คำสั่งใดน่าจะผิด ถ้าหุ่นยนต์ชนกำแพง?',
    options:['เดินหน้า 1 ก้าว','เดินหน้า 5 ก้าว ทั้งที่มีกำแพงอยู่หน้า','หยุดเมื่อเจอกำแพง'],
    answer:1,
    explain:'การ Debug คือหาจุดที่ทำให้ขั้นตอนผิด แล้วแก้ให้ถูก'
  },
  {
    id:'order', icon:'🔢', title:'Order',
    question:'ลำดับใดถูกต้องก่อนออกจากบ้านไปโรงเรียน?',
    options:['ใส่รองเท้า → อาบน้ำ → แต่งตัว','อาบน้ำ → แต่งตัว → ใส่รองเท้า','ไปโรงเรียน → แปรงฟัน → ตื่นนอน'],
    answer:1,
    explain:'การคิดแบบ Algorithm คือทำตามลำดับที่ถูกต้อง'
  },
  {
    id:'treasure', icon:'💎', title:'Treasure',
    question:'หุ่นยนต์จะเก็บสมบัติให้ครบ ควรทำอย่างไร?',
    options:['เดินสุ่มไปเรื่อย ๆ','วางแผนเส้นทางก่อน แล้วเดินตามแผน','เดินชนกำแพงเพื่อหาเพชร'],
    answer:1,
    explain:'ก่อนทำงานควรวางแผนขั้นตอน แล้วทำตามแผน'
  },
  {
    id:'rocket', icon:'🚀', title:'Rocket',
    question:'ขั้นตอนปล่อยจรวดที่ถูกต้องคือข้อใด?',
    options:['นับถอยหลัง → ตรวจระบบ → จุดเครื่องยนต์','ตรวจระบบ → นับถอยหลัง → จุดเครื่องยนต์','จุดเครื่องยนต์ → ตรวจระบบ → นับถอยหลัง'],
    answer:1,
    explain:'งานสำคัญต้องมีลำดับชัดเจน เพื่อให้ปลอดภัยและสำเร็จ'
  }
];

let score = 0;
let state = 'home';
let selected = 0;
let currentMission = null;
let missionQueue = shuffle([...missions]);
let wheelRotation = 0;
let previousFrame = null;
let lastGestureAt = 0;
let lastCentroidX = null;
let waveScore = 0;
let running = false;

/** Shows one screen and hides all other screens. */
function showScreen(id){
  screens.forEach(s => $(s).classList.toggle('active', s === id));
}

/** Creates a shuffled copy of an array. */
function shuffle(array){
  for(let i=array.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [array[i],array[j]] = [array[j],array[i]];
  }
  return array;
}

/** Updates score text on screen. */
function updateScore(){ scoreText.textContent = score; }

/** Plays a short beep sound without external sound files. */
function beep(type='click'){
  try{
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audio = new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const map = {click:520, spin:260, win:780, wrong:150, end:420};
    osc.frequency.value = map[type] || 400;
    osc.type = type === 'wrong' ? 'sawtooth' : 'sine';
    gain.gain.setValueAtTime(.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .22);
    osc.connect(gain); gain.connect(audio.destination);
    osc.start(); osc.stop(audio.currentTime + .24);
  }catch(e){ /* audio is optional */ }
}

/** Requests webcam access and starts the motion detector loop. */
async function startCamera(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    cameraStatus.textContent = 'เบราว์เซอร์นี้ไม่รองรับกล้อง';
    cameraStatus.className = 'pill bad';
    return;
  }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ video:{ width:640, height:480, facingMode:'user' }, audio:false });
    video.srcObject = stream;
    cameraStatus.textContent = 'เปิดกล้องแล้ว';
    cameraStatus.className = 'pill ok';
    running = true;
    requestAnimationFrame(detectMotion);
  }catch(err){
    cameraStatus.textContent = 'กรุณาอนุญาตกล้อง แล้วรีเฟรชหน้าเว็บ';
    cameraStatus.className = 'pill bad';
    gestureStatus.textContent = 'แนะนำเปิดผ่าน GitHub Pages / https';
  }
}

/** Calculates movement zones from webcam pixels and converts them into game gestures. */
function detectMotion(){
  if(!running){ return; }
  const w = canvas.width, h = canvas.height;
  ctx.drawImage(video, 0, 0, w, h);
  const frame = ctx.getImageData(0,0,w,h);
  if(previousFrame){
    let left=0, center=0, right=0, total=0, weightedX=0, movingPixels=0;
    const data = frame.data, prev = previousFrame.data;
    for(let y=0;y<h;y+=6){
      for(let x=0;x<w;x+=6){
        const i = (y*w+x)*4;
        const diff = Math.abs(data[i]-prev[i]) + Math.abs(data[i+1]-prev[i+1]) + Math.abs(data[i+2]-prev[i+2]);
        if(diff > 70){
          const weight = diff/255;
          total += weight; weightedX += x*weight; movingPixels++;
          if(x < w/3) left += weight; else if(x > w*2/3) right += weight; else center += weight;
        }
      }
    }
    const energy = total;
    const centroidX = total ? weightedX/total : null;
    readGesture({left, center, right, energy, centroidX, movingPixels});
  }
  previousFrame = frame;
  setTimeout(()=>requestAnimationFrame(detectMotion), 90);
}

/** Applies debounce so one body movement creates only one command. */
function canGesture(delay=900){
  const now = Date.now();
  if(now - lastGestureAt < delay) return false;
  lastGestureAt = now;
  return true;
}

/** Converts raw motion values into wave, left, right, and jump commands. */
function readGesture(m){
  if(m.energy < 6) return;
  if(m.centroidX !== null && lastCentroidX !== null){
    const dx = m.centroidX - lastCentroidX;
    if(Math.abs(dx) > 35) waveScore++;
    else waveScore = Math.max(0, waveScore-1);
  }
  lastCentroidX = m.centroidX;

  const sideGap = Math.abs(m.left - m.right);
  const isJump = m.energy > 46 && m.center > 13;
  const isWave = waveScore >= 3 && m.energy > 15;
  const isLeft = m.left > m.right * 1.65 && sideGap > 8;
  const isRight = m.right > m.left * 1.65 && sideGap > 8;

  if(isJump && canGesture(1100)){ waveScore = 0; gestureStatus.textContent = 'ตรวจพบ: กระโดด / ยืนยัน'; onGesture('confirm'); return; }
  if(isWave && canGesture(1200)){ waveScore = 0; gestureStatus.textContent = 'ตรวจพบ: โบกมือ'; onGesture('wave'); return; }
  if(state === 'mission' && isLeft && canGesture(750)){ gestureStatus.textContent = 'ตรวจพบ: ขยับซ้าย'; onGesture('left'); return; }
  if(state === 'mission' && isRight && canGesture(750)){ gestureStatus.textContent = 'ตรวจพบ: ขยับขวา'; onGesture('right'); }
}

/** Main gesture router for the whole game. */
function onGesture(gesture){
  beep('click');
  if(state === 'home' && gesture === 'wave') startWheel();
  else if(state === 'wheel' && gesture === 'wave') spinWheel();
  else if(state === 'mission' && gesture === 'left') moveOption(-1);
  else if(state === 'mission' && gesture === 'right') moveOption(1);
  else if(state === 'mission' && gesture === 'confirm') checkAnswer();
  else if(state === 'result' && gesture === 'wave') nextRound();
  else if(state === 'leaderboard' && gesture === 'wave') resetGame();
}

/** Opens the wheel screen. */
function startWheel(){
  state = 'wheel'; showScreen('wheelScreen'); beep('spin');
}

/** Spins the wheel and selects a mission without repeating until all missions finish. */
function spinWheel(){
  if(state !== 'wheel') return;
  if(!missionQueue.length) return finishGame();
  beep('spin');
  const mission = missionQueue.shift();
  const index = missions.findIndex(x => x.id === mission.id);
  currentMission = mission;
  wheelRotation += 1440 + (index * 72) + Math.floor(Math.random()*40);
  wheel.style.transform = `rotate(${wheelRotation}deg)`;
  wheel.classList.add('spin');
  $('wheelHint').textContent = 'กำลังสุ่มภารกิจ...';
  setTimeout(()=>{
    wheel.classList.remove('spin');
    $('wheelHint').textContent = 'โบกมือเพื่อหมุนวงล้อ';
    loadMission(mission);
  }, 4200);
}

/** Loads mission content onto the answer screen. */
function loadMission(mission){
  state = 'mission'; selected = 0;
  $('missionTitle').textContent = mission.title;
  $('missionIcon').textContent = mission.icon;
  $('missionQuestion').textContent = mission.question;
  const options = $('options');
  options.innerHTML = '';
  mission.options.forEach((text, i) => {
    const div = document.createElement('div');
    div.className = 'option' + (i===0 ? ' selected' : '');
    div.textContent = `${i+1}. ${text}`;
    options.appendChild(div);
  });
  showScreen('missionScreen');
}

/** Moves selected answer left or right. */
function moveOption(step){
  const optionEls = [...document.querySelectorAll('.option')];
  selected = (selected + step + optionEls.length) % optionEls.length;
  optionEls.forEach((el,i)=>el.classList.toggle('selected', i===selected));
}

/** Checks current answer and gives feedback. */
function checkAnswer(){
  const correct = selected === currentMission.answer;
  const optionEls = [...document.querySelectorAll('.option')];
  optionEls.forEach((el,i)=>{
    el.classList.toggle('correct', i === currentMission.answer);
    el.classList.toggle('wrong', i === selected && !correct);
  });
  if(correct){
    score += 10; updateScore(); beep('win'); burstStars();
    showResult('เก่งมาก!', `ตอบถูก +10 คะแนน — ${currentMission.explain}`, '🌟');
  }else{
    beep('wrong');
    showResult('ลองใหม่นะ', `เฉลย: ${currentMission.options[currentMission.answer]} — ${currentMission.explain}`, '💡');
    missionQueue.unshift(currentMission);
  }
}

/** Shows result screen after answering. */
function showResult(title, text, icon){
  state = 'result';
  $('resultTitle').textContent = title;
  $('resultText').textContent = text;
  $('resultIcon').textContent = icon;
  showScreen('resultScreen');
}

/** Goes to next wheel round or finishes the game. */
function nextRound(){
  if(!missionQueue.length) finishGame(); else startWheel();
}

/** Saves score and shows leaderboard. */
function finishGame(){
  state = 'leaderboard'; beep('end'); burstStars();
  const scores = JSON.parse(localStorage.getItem('asc_scores') || '[]');
  scores.push({ name:'ผู้เล่น', score, date:new Date().toLocaleDateString('th-TH') });
  scores.sort((a,b)=>b.score-a.score);
  localStorage.setItem('asc_scores', JSON.stringify(scores.slice(0,5)));
  renderLeaderboard(); showScreen('leaderboardScreen');
}

/** Renders high score list from localStorage. */
function renderLeaderboard(){
  const scores = JSON.parse(localStorage.getItem('asc_scores') || '[]');
  $('leaderboard').innerHTML = scores.map(s=>`<li><b>${s.score}</b> คะแนน <span>${s.date}</span></li>`).join('') || '<li>ยังไม่มีคะแนน</li>';
}

/** Resets game state for a new player. */
function resetGame(){
  score = 0; updateScore(); missionQueue = shuffle([...missions]); state = 'home'; showScreen('homeScreen');
}

/** Creates star particles when a mission is passed. */
function burstStars(){
  const box = $('stars');
  for(let i=0;i<28;i++){
    const star = document.createElement('div');
    star.className = 'star'; star.textContent = ['⭐','✨','🎉','💫'][i%4];
    star.style.left = `${45 + Math.random()*10}%`;
    star.style.top = `${45 + Math.random()*10}%`;
    star.style.setProperty('--x', `${(Math.random()-.5)*600}px`);
    star.style.setProperty('--y', `${(Math.random()-.5)*420}px`);
    box.appendChild(star);
    setTimeout(()=>star.remove(), 1000);
  }
}

/** Starts the app automatically. Camera permission is the only required browser prompt. */
function init(){
  updateScore(); renderLeaderboard(); startCamera(); showScreen('homeScreen');
}

init();
