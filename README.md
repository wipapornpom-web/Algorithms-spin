# Algorithm Spin Challenge - Motion Only Camera Edition

เกมการศึกษา HTML5 สำหรับนักเรียน ป.1–ป.3 เรื่อง **อัลกอริทึม (Algorithm)** ใช้กล้องตรวจจับการเคลื่อนไหว ไม่ต้องใช้เมาส์ระหว่างเล่น

## ภารกิจในเกม
มี 5 ภารกิจ
1. Robot Maze
2. Debug
3. Order
4. Treasure
5. Rocket

## วิธีเล่นแบบไม่สัมผัสจอ
เปิดหน้าเว็บ อนุญาตให้ใช้กล้อง แล้วให้นักเรียนยืนห่างกล้องประมาณ 1.5–3 เมตร

| ท่าทาง | ผลในเกม |
|---|---|
| โบกมือซ้าย-ขวา | เริ่มเกม / หมุนวงล้อ / ไปต่อ |
| ขยับตัวไปทางซ้าย | เลือกคำตอบก่อนหน้า |
| ขยับตัวไปทางขวา | เลือกคำตอบถัดไป |
| กระโดด หรือขยับแรงตรงกลาง | ยืนยันคำตอบ |

## จุดสำคัญ
เวอร์ชันนี้ไม่ใช้ MediaPipe หรือไลบรารีภายนอก จึงใช้งานบน GitHub Pages ได้ง่ายกว่า โดยใช้ JavaScript ตรวจจับความเปลี่ยนแปลงของภาพจากกล้องโดยตรง

## การอัปโหลดขึ้น GitHub Pages
1. แตกไฟล์ ZIP
2. อัปโหลดโฟลเดอร์ทั้งหมดขึ้น Repository ใน GitHub
3. ไปที่ Settings > Pages
4. เลือก Branch เป็น `main` และ Folder เป็น `/root`
5. กด Save
6. เปิดลิงก์ GitHub Pages ที่ได้

## เงื่อนไขกล้อง
- ควรเปิดผ่าน GitHub Pages หรือเว็บที่เป็น `https`
- ถ้าเปิดจากไฟล์ในเครื่องแล้วกล้องไม่ขึ้น ให้ใช้ Live Server หรืออัปขึ้น GitHub Pages
- Chrome และ Microsoft Edge รองรับดีที่สุด

## โครงสร้างไฟล์
```
Algorithm-Spin-Challenge-Working/
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
