/* Algorithm Spin Challenge - Full Camera Pointer
   กล้องเต็มจอ + ใช้จุดเคลื่อนไหวแทนมือชี้
   ไม่ใช้ Framework และไม่ต้องใช้ไลบรารีภายนอก
*/

const video = document.getElementById('camera');
const canvas = document.getElementById('motionCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const handPointer = document.getElementById('handPointer');
const statusBox = document.getElementById('status');
const scoreEl = document.getElementById('score');
const wheelScreen = document.getElementById('wheelScreen');
const gameScreen = document.getElementById('gameScreen');
const speech = document.getElementById('speech');
const wheel = document.getElementById('wheel');
const missionTitle = document.getElementById('missionTitle');
const missionText = document.getElementById('missionText');
const commandBadge = document.getElementById('commandBadge');
const boardEl = document.getElementById('board');

let score = Number(localStorage.getItem('asc_fullcam_score') || 0);
let prevFrame = null;
let currentScreen = 'wheel';
let wheelRotation = 0;
let spinning = false;
let lastWaveAt = 0;
let pointer = { x: innerWidth / 2, y: innerHeight / 2, active: false };
let hoverAction = null;
let hoverStart = 0;
let lastActionAt = 0;
let currentMission = null;
let board = [];
let robot = { r: 4, c: 0, dir: 'right' };
let itemsLeft = 0;

scoreEl.textContent = score;

const missions = [
  { icon: '💎', title: 'เก็บเพชร', text: 'ชี้คำสั่งให้หุ่นยนต์เดินเก็บเพชร แล้วไปธง', type: 'diamond' },
  { icon: '🏁', title: 'ไปธง', text: 'ชี้คำสั่งให้หุ่นยนต์เดินไปถึงธง', type: 'flag' },
  { icon: '📦', title: 'ส่งของ', text: 'ไปเก็บกล่อง แล้วส่งที่บ้าน', type: 'box' },
  { icon: '🍎', title: 'เก็บผลไม้', text: 'เก็บผลไม้ แล้วไปที่ธง', type: 'fruit' },
  { icon: '⭐', title: 'เก็บดาว', text: 'เก็บดาวให้ครบ แล้วไปที่ธง', type: 'star' }
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

/** เปิดกล้องทันทีเมื่อเข้าเว็บ */
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    video.srcObject = stream;
    statusBox.textContent = 'กล้องพร้อม 👋';
    video.addEventListener('loadeddata', () => {
      speak('โบกมือเพื่อหมุนวงล้อ');
      motionLoop();
    });
  } catch (error) {
    statusBox.textContent = 'เปิดกล้องไม่ได้';
    speech.textContent = 'ต้องกดอนุญาตกล้องก่อนนะคะ';
  }
}

/** อ่านภาพจากกล้องและหาตำแหน่งการเคลื่อนไหว */
function motionLoop() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (prevFrame) {
    const motion = analyzeMotion(prevFrame.data, frame.data, canvas.width, canvas.height);
    updatePointer(motion);
    if (currentScreen === 'wheel') detectWave(motion);
    if (currentScreen === 'game') detectPointAction();
  }

  prevFrame = frame;
  requestAnimationFrame(motionLoop);
}

/** วิเคราะห์จุดที่มีการเคลื่อนไหวมากที่สุด */
function analyzeMotion(prev, curr, w, h) {
  let total = 0;
  let sx = 0;
  let sy = 0;
  let left = 0;
  let right = 0;
  let fast = 0;
  const step = 4 * 3;

  for (let i = 0; i < curr.length; i += step) {
    const pixel = i / 4;
    const x = pixel % w;
    const y = Math.floor(pixel / w);
    const diff = Math.abs(curr[i] - prev[i]) + Math.abs(curr[i + 1] - prev[i + 1]) + Math.abs(curr[i + 2] - prev[i + 2]);

    if (diff > 70) {
      total++;
      sx += x;
      sy += y;
      if (x < w * 0.42) left++;
      if (x > w * 0.58) right++;
      if (diff > 150) fast++;
    }
  }

  if (total < 8) return { total, fast, left, right, x: pointer.x, y: pointer.y, active: false };

  // เพราะวิดีโอถูก mirror ด้วย CSS จึงกลับแกน x ให้จุดชี้ตรงกับมือบนจอ
  const rawX = sx / total;
  const rawY = sy / total;
  const screenX = innerWidth - (rawX / w) * innerWidth;
  const screenY = (rawY / h) * innerHeight;

  return { total, fast, left, right, x: screenX, y: screenY, active: true };
}

/** อัปเดตจุดชี้มือบนหน้าจอ */
function updatePointer(motion) {
  if (motion.active) {
    pointer.x = pointer.x * 0.72 + motion.x * 0.28;
    pointer.y = pointer.y * 0.72 + motion.y * 0.28;
    pointer.active = true;
  } else {
    pointer.active = false;
  }

  handPointer.style.left = `${pointer.x}px`;
  handPointer.style.top = `${pointer.y}px`;
  handPointer.classList.toggle('active', pointer.active);
}

/** หน้าแรก: โบกมือแรง ๆ เพื่อหมุนวงล้อ */
function detectWave(motion) {
  const now = Date.now();
  if (spinning || now - lastWaveAt < 1800) return;

  if (motion.total > 180 && motion.fast > 30 && motion.left > 30 && motion.right > 30) {
    lastWaveAt = now;
    spinWheel();
  }
}

/** ในเกม: เอาจุดชี้ไปค้างบนคำสั่ง 0.9 วินาที */
function detectPointAction() {
  const now = Date.now();
  const pads = [...document.querySelectorAll('.action-pad')];
  let found = null;

  pads.forEach(pad => {
    const rect = pad.getBoundingClientRect();
    const inside = pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom;
    pad.classList.toggle('hover', inside);
    if (inside) found = pad.dataset.action;
  });

  if (found !== hoverAction) {
    hoverAction = found;
    hoverStart = now;
    pads.forEach(p => p.classList.remove('ready'));
  }

  if (!found) {
    commandBadge.textContent = '👆 ชี้คำสั่ง';
    return;
  }

  const pad = document.querySelector(`[data-action="${found}"]`);
  const hold = now - hoverStart;
  commandBadge.textContent = hold > 450 ? 'ค้างไว้อีกนิด...' : 'เจอคำสั่งแล้ว';
  if (hold > 450) pad.classList.add('ready');

  if (hold > 900 && now - lastActionAt > 700) {
    lastActionAt = now;
    hoverStart = now;
    runAction(found);
  }
}

/** หมุนวงล้อ แล้วเข้าเกมที่สุ่มได้ทันที */
function spinWheel() {
  spinning = true;
  speech.textContent = '🎡 กำลังหมุน...';
  speak('กำลังหมุน');
  beep(520, 0.1);

  const index = Math.floor(Math.random() * missions.length);
  const extra = 360 * 5 + (360 - index * 72) + Math.floor(Math.random() * 36);
  wheelRotation += extra;
  wheel.style.transform = `rotate(${wheelRotation}deg)`;

  setTimeout(() => {
    spinning = false;
    startMission(missions[index]);
  }, 3900);
}

/** เริ่มภารกิจ */
function startMission(mission) {
  currentMission = mission;
  currentScreen = 'game';
  wheelScreen.classList.remove('active');
  gameScreen.classList.add('active');

  missionTitle.textContent = mission.icon;
  missionText.textContent = mission.text;
  commandBadge.textContent = '👆 ชี้คำสั่ง';

  board = JSON.parse(JSON.stringify(maps[mission.type]));
  robot = findRobot(board);
  itemsLeft = countItems(board, ['💎', '📦', '🍎', '🍌', '⭐']);

  renderBoard();
  speak(mission.text);
}

/** กลับวงล้อ */
function showWheel() {
  currentScreen = 'wheel';
  gameScreen.classList.remove('active');
  wheelScreen.classList.add('active');
  speech.textContent = '👋 โบกมือเพื่อหมุนวงล้อ';
  commandBadge.textContent = '👆 ชี้คำสั่ง';
  speak('โบกมือเพื่อหมุนวงล้อ');
}

/** ทำคำสั่งจากกล่องที่เด็กชี้ */
function runAction(action) {
  if (action === 'left') turnLeft();
  if (action === 'right') turnRight();
  if (action === 'walk') moveForward();
  if (action === 'back') showWheel();
}

/** หาแหน่งหุ่นยนต์ */
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
  return map.flat().filter(v => items.includes(v)).length;
}

/** วาดกระดาน */
function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const value = board[r][c];
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (value === '🪨') cell.classList.add('wall');
      if (value === '🏁' || value === '🏠') cell.classList.add('goal');
      if (['💎', '📦', '🍎', '🍌', '⭐'].includes(value)) cell.classList.add('item');
      cell.textContent = value;
      if (robot.r === r && robot.c === c) {
        cell.innerHTML = `<span class="robot ${robot.dir}">🤖</span>`;
      }
      boardEl.appendChild(cell);
    }
  }
}

/** เลี้ยวซ้าย */
function turnLeft() {
  const order = ['up', 'left', 'down', 'right'];
  robot.dir = order[(order.indexOf(robot.dir) + 1) % 4];
  commandBadge.textContent = '↩️ ซ้าย';
  beep(360, 0.08);
  renderBoard();
}

/** เลี้ยวขวา */
function turnRight() {
  const order = ['up', 'right', 'down', 'left'];
  robot.dir = order[(order.indexOf(robot.dir) + 1) % 4];
  commandBadge.textContent = '↪️ ขวา';
  beep(420, 0.08);
  renderBoard();
}

/** เดินหน้า */
function moveForward() {
  const delta = { up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1] }[robot.dir];
  const nr = robot.r + delta[0];
  const nc = robot.c + delta[1];

  if (nr < 0 || nr > 4 || nc < 0 || nc > 4 || board[nr][nc] === '🪨') {
    commandBadge.textContent = '🚧 ชน';
    boardEl.classList.add('flash');
    setTimeout(() => boardEl.classList.remove('flash'), 450);
    beep(150, 0.12);
    return;
  }

  robot.r = nr;
  robot.c = nc;

  if (['💎', '📦', '🍎', '🍌', '⭐'].includes(board[nr][nc])) {
    board[nr][nc] = '';
    itemsLeft--;
    addScore(10);
    commandBadge.textContent = '⭐ เก็บได้';
    beep(760, 0.12);
  } else {
    commandBadge.textContent = '⬆️ เดิน';
    beep(520, 0.07);
  }

  renderBoard();
  checkWin();
}

/** เพิ่มคะแนน */
function addScore(point) {
  score += point;
  localStorage.setItem('asc_fullcam_score', score);
  scoreEl.textContent = score;
}

/** ตรวจชนะ */
function checkWin() {
  const here = board[robot.r][robot.c];
  if ((here === '🏁' || here === '🏠') && itemsLeft <= 0) {
    addScore(20);
    commandBadge.textContent = '🎉 ผ่าน';
    speak('เก่งมาก ผ่านด่านแล้ว');
    beep(920, 0.18);
    setTimeout(showWheel, 2200);
  }
}

/** เสียงพูดจาก Browser */
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'th-TH';
  utter.rate = 0.92;
  speechSynthesis.speak(utter);
}

/** เสียงสั้น ไม่ต้องใช้ไฟล์เสียง */
function beep(freq = 440, duration = 0.1) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (error) {}
}

startCamera();
