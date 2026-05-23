# KruHeem MathCraft AI — Doc Generator

เว็บแอปสำหรับครูคณิตศาสตร์ ใช้สร้าง/จัดการ ใบงาน ข้อสอบ และแผนการสอน (ม.ต้น–ม.ปลาย ตาม สสวท.) พร้อมตัวช่วย AI และ Prompt Builder

## Tech stack
- **React 18 + Vite 5** · **Tailwind CSS** (light/dark mode)
- **Firebase Firestore** (เก็บเอกสาร/โฟลเดอร์) + **Anonymous Auth**
- **KaTeX / MathLive** (เรนเดอร์คณิตศาสตร์) · **React Quill** (rich text)
- **Google Gemini** (สร้างโจทย์ — optional, มีโหมด mock)

## เริ่มใช้งาน
```bash
npm install
cp .env.example .env   # ใส่ VITE_GEMINI_API_KEY ถ้ามี (ไม่ใส่ก็ใช้โหมด mock ได้)
npm run dev            # http://localhost:3000
```

## Scripts
| คำสั่ง | ทำอะไร |
|--------|--------|
| `npm run dev` | รัน dev server |
| `npm run build` | build production ลง `dist/` |
| `npm run preview` | พรีวิว build |
| `npm run lint` | ตรวจโค้ดด้วย ESLint |

## ความปลอดภัย (ต้องตั้งค่าก่อนใช้งานจริง)
ฐานข้อมูลออกแบบให้ล็อกแบบ "ผู้ใช้คนเดียว" ผ่าน Anonymous Auth + Firestore rules
โค้ดฝั่ง client พร้อมแล้ว แต่ต้องเปิดใช้งาน 2 ขั้น (**ลำดับสำคัญ**):

1. **เปิด Anonymous sign-in** ที่ Firebase Console → Authentication → Sign-in method
2. **Deploy rules:** `firebase deploy --only firestore:rules`

> ⚠️ ถ้า deploy rules ก่อนเปิด Anonymous auth แอปจะอ่าน/เขียนข้อมูลไม่ได้ (ถูกล็อกออก) — เปิด auth ให้เรียบร้อยก่อนเสมอ

หมายเหตุ: Gemini key ปัจจุบันส่งจากฝั่ง client (`VITE_` prefix) — สำหรับ production ควรย้ายไป backend proxy

## โครงสร้างหลัก
```
src/
  App.jsx                 # state กลาง + auto-save + toast
  components/             # UI (Dashboard, WorksheetEditor, item ต่างๆ)
  pages/PromptBuilderPage # เครื่องมือสร้าง prompt
  hooks/                  # useTheme, useAutoPagination, useHistory, ...
  data/                   # หลักสูตร, ฟอนต์, เทมเพลตหน้า
  services/ utils/        # Gemini service, image compression, ฯลฯ
  firebase.js             # Firestore CRUD + anonymous auth
firestore.rules           # security rules (deploy เอง)
```
