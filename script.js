/* Algorithm Spin Challenge - Simple Motion Version
   เล่นโดยใช้กล้องตรวจจับการเคลื่อนไหวแบบง่าย ไม่ใช้ไลบรารีภายนอก
*/

const video = document.getElementById('camera');
const canvas = document.getElementById('motionCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const statusBox = document.getElementById('motionStatus');
const wheelScreen = document.getElementById('wheelScreen');
const gameScreen = document.getElementById('gameScreen');
const wheel = document.getElementById('wheel');
const robotSpeech = document.getElementById('robotSpeech');
const boardEl = document.getElementById('board');
const missionTitle = document.getElementById('missionTitle');
const missionText = document.getElementById('missionText');
const lastCommand = document.getElementById('lastCommand');
const scoreEl = document.getElementById('score');

let score = Number(localStorage.getItem('asc_simple_score') || 0);
scoreEl.textContent = score;

let prevFrame = null;
let lastGestureAt = 0;
let spinning = false;
let wheelRotation = 0;
let currentScreen = 'wheel';
let currentMission = null;
let robot = { r: 4, c: 0, dir: 'right' };
let diamondsLeft = 0;

const missions = [
  { title: '💎 เก็บเพชร', text: 'เดินเก็บเพชรให้ครบ แล้วไปที่ธง', type: 'diamond' },
  { title: '🏁 ไปให้ถึงธง', text: 'พาหุ่นยนต์เดินไปถึงธง', type: 'flag' },
  { title: '📦 ส่งของ', text: 'ไปเก็บกล่อง แล้วส่งที่บ้าน', type: 'box' },
  { title: '🍎 เก็บผลไม้', text: 'เดินไปเก็บผลไม้ แล้วไปที่ธง', type: 'fruit' },
  { title: '⭐ ตามดาว', text: 'เก็บดาวก่อน แล้วไปถึงธง', type: 'star' }
];

const maps = {
  diamond: [
    ['','','💎','','🏁'],
    ['','🪨','','🪨',''],
    ['','','💎','',''],
    ['🪨','','','🪨',''],
    ['🤖','','','','']
  ],
  flag: [
    ['','','','🪨','🏁'],
    ['🪨','🪨','','🪨',''],
    ['','','','',''],
    ['','🪨','🪨','🪨',''],
    ['🤖','','','','']
  ],
  box: [
    ['🏠','','','🪨',''],
    ['','🪨','','',''],
    ['','🪨','📦','🪨',''],
    ['','','','',''],
    ['🤖','🪨','','','']
  ],
  fruit: [
    ['🍎','','🪨','','🏁'],
    ['','🪨','','',''],
    ['','','','🪨',''],
    ['🪨','','🍌','',''],
    ['🤖','','','','']
  ],
  star: [
    ['⭐','','','🪨','🏁'],
    ['','🪨','','🪨',''],
    ['','','⭐','',''],
    ['🪨','','','🪨',''],
    ['🤖','','','','']
  ]
};

let board = [];

/** เปิดกล้องเว็บแคม */
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
    video.srcObject = stream;
    statusBox.textContent = 'กล้องพร้อม 👋';
    video.addEventListener('loadeddata', motionLoop);
  } catch (err) {
    statusBox.textContent = 'เปิดกล้องไม่ได้ ต้องอนุญาตกล้องก่อน';
    robotSpeech.textContent = 'กรุณาอนุญาตกล้อง แล้วรีเฟรชหน้าเว็บ';
  }
}

/** อ่านภาพจากกล้องแล้วตรวจจับการเคลื่อนไหวแบบง่าย */
function motionLoop() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (prevFrame) {
    const motion = analyzeMotion(prevFrame.data, frame.data, canvas.width, canvas.height);
    const gesture = detectGesture(motion);
    if (gesture) handleGesture(gesture);
  }

  prevFrame = frame;
  requestAnimationFrame(motionLoop);
}

/** คำนวณปริมาณการเคลื่อนไหว แยกซ้าย ขวา บน ล่าง */
function analyzeMotion(prev, curr, w, h) {
  let left = 0, right = 0, top = 0, bottom = 0, total = 0;
  const step = 4 * 4;
  for (let i = 0; i < curr.length; i += step) {
    const pixel = i / 4;
    const x = pixel % w;
    const y = Math.floor(pixel / w);
    const diff = Math.abs(curr[i] - prev[i]) + Math.abs(curr[i+1] - prev[i+1]) + Math.abs(curr[i+2] - prev[i+2]);
    if (diff > 65) {
      total++;
      if (x < w * 0.42) left++;
      if (x > w * 0.58) right++;
      if (y < h * 0.45) top++;
      if (y > h * 0.55) bottom++;
    }
  }
  return { left, right, top, bottom, total };
}

/** แปลงการเคลื่อนไหวเป็นคำสั่งเกม */
function detectGesture(m) {
  const now = Date.now();
  if (now - lastGestureAt < 900) return null;

  // โบกมือ/เคลื่อนไหวแรงมาก ใช้หมุนวงล้อ
  if (currentScreen === 'wheel' && m.total > 240) return 'wave';

  // ในเกม: ขยับส่วนบนซ้าย/ขวา = เลี้ยว
  if (currentScreen === 'game') {
    if (m.left > 50 && m.left > m.right * 1.6 && m.top > 22) return 'left';
    if (m.right > 50 && m.right > m.left * 1.6 && m.top > 22) return 'right';

    // เดินอยู่กับที่: เคลื่อนไหวช่วงล่างมาก = เดินหน้า
    if (m.bottom > 70 && m.total > 120) return 'walk';

    // ชูสองมือ/ขยับบนสองข้าง = กลับวงล้อ
    if (m.top > 110 && m.left > 40 && m.right > 40) return 'back';
  }
  return null;
}

/** รับคำสั่งจากท่าทาง */
function handleGesture(gesture) {
  lastGestureAt = Date.now();
  statusBox.textContent = `ตรวจพบ: ${gesture}`;

  if (gesture === 'wave' && currentScreen === 'wheel') spinWheel();
  if (currentScreen === 'game') {
    if (gesture === 'left') turnLeft();
    if (gesture === 'right') turnRight();
    if (gesture === 'walk') moveForward();
    if (gesture === 'back') showWheel();
  }
}

/** หมุนวงล้อ แล้วเข้าเกมที่สุ่มได้ */
function spinWheel() {
  if (spinning) return;
  spinning = true;
  robotSpeech.textContent = '🎡 กำลังหมุน...';
  const index = Math.floor(Math.random() * missions.length);
  const extra = 360 * 5 + (360 - index * 72) + Math.floor(Math.random() * 40);
  wheelRotation += extra;
  wheel.style.transform = `rotate(${wheelRotation}deg)`;
  beep(520, 0.12);

  setTimeout(() => {
    spinning = false;
    startMission(missions[index]);
  }, 4200);
}

/** เข้าเกมภารกิจ */
function startMission(mission) {
  currentMission = mission;
  currentScreen = 'game';
  wheelScreen.classList.remove('active');
  gameScreen.classList.add('active');
  missionTitle.textContent = mission.title;
  missionText.textContent = mission.text;
  lastCommand.textContent = 'ยกมือ/เดิน';
  board = JSON.parse(JSON.stringify(maps[mission.type]));
  robot = findRobot(board);
  diamondsLeft = countItems(board, ['💎','📦','🍎','🍌','⭐']);
  renderBoard();
  speak(mission.text);
}

/** กลับไปวงล้อ */
function showWheel() {
  currentScreen = 'wheel';
  gameScreen.classList.remove('active');
  wheelScreen.classList.add('active');
  robotSpeech.textContent = '👋 โบกมือเพื่อหมุนวงล้ออีกครั้ง';
  speak('โบกมือเพื่อหมุนวงล้อ');
}

/** หาแหน่งหุ่นยนต์เริ่มต้น */
function findRobot(map) {
  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[r].length; c++) {
      if (map[r][c] === '🤖') {
        map[r][c] = '';
        return { r, c, dir: 'right' };
      }
    }
  }
  return { r: 4, c: 0, dir: 'right' };
}

/** นับของที่ต้องเก็บ */
function countItems(map, items) {
  return map.flat().filter(x => items.includes(x)).length;
}

/** วาดตารางเกม */
function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell path';
      const value = board[r][c];
      if (value === '🪨') cell.classList.add('wall');
      if (value === '🏁' || value === '🏠') cell.classList.add('goal');
      if (['💎','📦','🍎','🍌','⭐'].includes(value)) cell.classList.add('diamond');
      cell.textContent = value;
      if (robot.r === r && robot.c === c) {
        cell.innerHTML = `<span class="robot ${robot.dir}">🤖</span>`;
      }
      boardEl.appendChild(cell);
    }
  }
}

/** หันซ้าย */
function turnLeft() {
  const order = ['up','left','down','right'];
  robot.dir = order[(order.indexOf(robot.dir) + 1) % 4];
  lastCommand.textContent = '↩️ เลี้ยวซ้าย';
  beep(360, 0.08);
  renderBoard();
}

/** หันขวา */
function turnRight() {
  const order = ['up','right','down','left'];
  robot.dir = order[(order.indexOf(robot.dir) + 1) % 4];
  lastCommand.textContent = '↪️ เลี้ยวขวา';
  beep(420, 0.08);
  renderBoard();
}

/** เดินหน้า 1 ช่อง */
function moveForward() {
  const delta = { up: [-1,0], right: [0,1], down: [1,0], left: [0,-1] }[robot.dir];
  const nr = robot.r + delta[0];
  const nc = robot.c + delta[1];
  lastCommand.textContent = '🚶 เดินหน้า';

  if (nr < 0 || nr > 4 || nc < 0 || nc > 4 || board[nr][nc] === '🪨') {
    lastCommand.textContent = '🚧 ชนสิ่งกีดขวาง';
    boardEl.classList.add('flash');
    setTimeout(() => boardEl.classList.remove('flash'), 450);
    beep(160, 0.12);
    return;
  }

  robot.r = nr;
  robot.c = nc;

  if (['💎','📦','🍎','🍌','⭐'].includes(board[nr][nc])) {
    board[nr][nc] = '';
    diamondsLeft--;
    score += 10;
    localStorage.setItem('asc_simple_score', score);
    scoreEl.textContent = score;
    lastCommand.textContent = '⭐ เก็บได้!';
    beep(760, 0.12);
  }

  renderBoard();
  checkWin();
}

/** ตรวจว่าผ่านด่านหรือยัง */
function checkWin() {
  const here = board[robot.r][robot.c];
  const atGoal = here === '🏁' || here === '🏠';
  if (atGoal && diamondsLeft <= 0) {
    score += 20;
    localStorage.setItem('asc_simple_score', score);
    scoreEl.textContent = score;
    lastCommand.textContent = '🎉 ผ่านด่าน!';
    speak('เก่งมาก ผ่านด่านแล้ว');
    beep(900, 0.15);
    setTimeout(showWheel, 2200);
  }
}

/** เสียงพูดไทยจาก browser ถ้ารองรับ */
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'th-TH';
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

/** สร้างเสียง beep สั้น ๆ โดยไม่ต้องใช้ไฟล์เสียง */
function beep(freq = 440, duration = 0.1) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.05;
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

// ปุ่มคีย์บอร์ดสำรองสำหรับทดสอบตอนครูเตรียมงาน: A=ซ้าย D=ขวา W=เดิน Space=หมุน
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && currentScreen === 'wheel') spinWheel();
  if (currentScreen === 'game') {
    if (e.key.toLowerCase() === 'a') turnLeft();
    if (e.key.toLowerCase() === 'd') turnRight();
    if (e.key.toLowerCase() === 'w') moveForward();
    if (e.key.toLowerCase() === 'b') showWheel();
  }
});

startCamera();
speak('โบกมือเพื่อหมุนวงล้อ');
