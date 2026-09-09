# Smile Baby Baholash Tizimi — Qoidalar

Bu loyihada ishlayotgan har qanday AI assistent (Claude, Gemini yoki boshqa) quyidagi qoidalarga rioya qilishi **shart**:

## 📋 Master Reja
Loyihaning to'liq rejasi `MASTER_PLAN.md` faylida joylashgan. Har bir yangi sessiya boshida **avval shu faylni o'qib chiq**, keyin ishlashni boshlang.

## 🎨 Dizayn qoidalari
1. **Asosiy rang:** `#0A9C54` (yashil). Ikkinchi darajali: `slate` oilasi.
2. **Shrift:** `Plus Jakarta Sans`. Boshqa shrift qo'shilmasin.
3. **Komponent uslubi:** `rounded-2xl` / `rounded-3xl`, `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`, `border border-slate-100`.
4. **Alert/Confirm:** Brauzerning `alert()` va `confirm()` ishlatilmasin. Faqat Toast va Modal komponentlar.

## 🌐 Til qoidalari
- Admin panel interfeysi: **O'zbek tilida** (Baholar, Xodimlar, Bo'limlar)
- Kod va o'zgaruvchilar: **Ingliz tilida**

## 🔒 Xavfsizlik qoidalari
- Har bir admin API endpointida `getServerSession(authOptions)` tekshiruvi bo'lishi **shart**
- Yangi endpoint yaratilganda xavfsizlik tekshiruvini **birinchi** qo'shish

## 🏗️ Arxitektura qoidalari
- Bo'limlar turi: `type: 'general'` = Ambulator, `type: 'floor'` = Statsionar
- Mijoz (bemor) interfeyisda xodim tanlash (dropdown) **yo'q** — bu qaror qabul qilingan
- Yangi kutubxona qo'shishdan oldin foydalanuvchidan ruxsat so'rang

## 📂 Loyiha joylashuvi
- Loyiha: `d:\Baholash tizimi`
- Texnologiya: Next.js 16, React 19, Prisma 5 (SQLite), NextAuth 4, Tailwind CSS
