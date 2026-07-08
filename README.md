# Algorithm Spin Challenge

เกมการศึกษา HTML5 สำหรับนักเรียนระดับประถมศึกษา ป.1–ป.3 เพื่อสอนแนวคิด **อัลกอริทึม (Algorithm)** ผ่านการเรียงลำดับคำสั่งและภารกิจหุ่นยนต์

## เทคโนโลยี

- HTML5
- CSS3
- JavaScript แบบ Vanilla
- ไม่ใช้ Framework
- รองรับ Chrome และ Microsoft Edge
- Responsive ใช้ได้ทั้งคอมพิวเตอร์ แท็บเล็ต และมือถือ
- พร้อมอัปโหลดขึ้น GitHub Pages

## โครงสร้างไฟล์

```text
Algorithm-Spin-Challenge/
├── index.html
├── style.css
├── script.js
├── assets/
│   ├── images/
│   ├── icons/
│   └── backgrounds/
├── sounds/
└── README.md
```

> หมายเหตุ: Version นี้ใช้เสียงจาก Web Audio API จึงไม่จำเป็นต้องมีไฟล์เสียงจริงในโฟลเดอร์ sounds แต่เตรียมโฟลเดอร์ไว้สำหรับเพิ่มเสียงภายหลัง

## วิธีใช้งาน

1. เปิดไฟล์ `index.html` ด้วย Chrome หรือ Microsoft Edge
2. กดปุ่ม **เริ่มเกม**
3. หมุนวงล้อเพื่อสุ่มภารกิจ
4. เรียงคำสั่งหรือเลือกคำตอบที่ถูกต้อง
5. ตอบถูกได้ 10 คะแนน
6. เล่นครบ 12 ภารกิจ ระบบจะแสดงคะแนนรวมและบันทึก Leaderboard ได้

## ภารกิจในเกม

1. Robot Maze
2. Debug
3. Order
4. Memory
5. Treasure
6. Rocket
7. Pizza
8. Brush Teeth
9. Computer Start
10. Diamond Run
11. Rescue Robot
12. Speed Challenge

## วิธีอัปโหลดขึ้น GitHub Pages

1. สร้าง Repository ใหม่ใน GitHub เช่น `Algorithm-Spin-Challenge`
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้น GitHub
3. ไปที่ **Settings > Pages**
4. เลือก Branch เป็น `main`
5. เลือก Folder เป็น `/root`
6. กด Save
7. รอระบบสร้างลิงก์ GitHub Pages

## การแก้ไขภารกิจ

เปิดไฟล์ `script.js` แล้วแก้ไขข้อมูลในตัวแปร `missions`

ตัวอย่าง:

```javascript
{
  id: 'pizza',
  icon: '🍕',
  title: 'Pizza',
  desc: 'เรียงอัลกอริทึมการทำพิซซ่า',
  type: 'sequence',
  correct: ['เตรียมแป้ง','ทาซอส','ใส่ชีส','อบพิซซ่า','หั่นแบ่ง'],
  choices: ['อบพิซซ่า','ทาซอส','เตรียมแป้ง','หั่นแบ่ง','ใส่ชีส']
}
```

## รองรับการพัฒนา AI ในอนาคต

ในไฟล์ `script.js` มีฟังก์ชัน `prepareFutureHandTracking()` สำหรับต่อยอด MediaPipe Hand Tracking เช่น

- โบกมือเพื่อหมุนวงล้อ
- ใช้มือแตะปุ่ม
- ใช้ท่าทางเลือกคำตอบ

Version แรกออกแบบให้ใช้เมาส์/ทัชก่อน เพื่อให้ใช้งานง่ายและเสถียรในห้องเรียน
