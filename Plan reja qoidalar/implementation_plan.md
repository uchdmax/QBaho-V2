# 📋 SMILE BABY — Baholash Tizimi: MASTER REJA v1.0

> **Loyiha:** Klinikalar uchun mijozlar bahosini yig'ish, tahlil qilish va boshqarish tizimi  
> **Maqsad:** Boshqa klinikalarga sotishga tayyor, professional SaaS mahsulot yaratish  
> **Texnologiya:** Next.js 16, React 19, Prisma 5 (SQLite → PostgreSQL), NextAuth 4, Tailwind CSS  
> **Joylashuv:** `d:\Baholash tizimi`

---

## 📁 LOYIHA TUZILMASI (Hozirgi holat)

```
d:\Baholash tizimi/
├── app/
│   ├── page.tsx                          # Mijozlar baholash sahifasi (Ambulator/Statsionar)
│   ├── layout.tsx                        # Root layout (Providers)
│   ├── globals.css                       # Tailwind + Plus Jakarta Sans
│   ├── admin/
│   │   ├── (auth)/login/page.tsx         # Admin login
│   │   └── (dashboard)/
│   │       ├── layout.tsx                # Sidebar navigatsiya
│   │       ├── page.tsx                  # Dashboard (KPI + statistika)
│   │       ├── ratings/                  # Baholar ro'yxati
│   │       ├── employees/               # Xodimlar boshqaruvi
│   │       ├── departments/             # Bo'limlar boshqaruvi
│   │       ├── criteria/                # Mezonlar boshqaruvi
│   │       └── qr/page.tsx              # QR kod generatsiya
│   └── api/
│       ├── auth/[...nextauth]/route.ts  # NextAuth
│       ├── ratings/route.ts             # GET/POST baholar
│       ├── departments/route.ts         # CRUD bo'limlar
│       ├── employees/route.ts           # CRUD xodimlar
│       ├── employees/[id]/route.ts      # PUT/DELETE xodim
│       ├── criteria/route.ts            # CRUD mezonlar
│       └── criteria/[id]/route.ts       # PUT/DELETE mezon
├── components/
│   ├── StarRating.tsx                   # Yulduzcha baholash komponenti
│   └── Providers.tsx                    # NextAuth SessionProvider
├── lib/
│   ├── auth.ts                          # NextAuth config (bcrypt)
│   ├── prisma.ts                        # Prisma singleton
│   └── telegram.ts                      # Telegram bildirishnoma
├── prisma/
│   ├── schema.prisma                    # Ma'lumotlar bazasi modeli
│   └── dev.db                           # SQLite baza fayli
├── middleware.ts                        # Admin yo'llar himoyasi
├── seedDemo.ts                          # Demo ma'lumotlar
└── package.json
```

---

## 🗄️ MA'LUMOTLAR BAZASI MODELI (Hozirgi holat)

```
Rating (Baho)
├── id, department (String), comment, createdAt
├── employeeId? → Employee
└── values[] → RatingValue[]

RatingValue (Baho qiymati)
├── id, ratingId → Rating, criterionId → Criterion, score

User (Admin foydalanuvchi)
├── id, username, password (bcrypt hash), createdAt

Employee (Xodim)
├── id, firstName, lastName, department (String!), position?
├── departmentId? → Department (DUPLIKAT - tuzatish kerak!)
└── ratings[] → Rating[]

Criterion (Mezon)
├── id, name (unique), createdAt
├── departments[] ↔ Department[] (many-to-many)
└── ratingValues[] → RatingValue[]

Department (Bo'lim)
├── id, code (unique), name, type ('general'|'floor')
├── floor?, icon?, color?, bg?, order?, active
├── employees[] → Employee[]
└── criteria[] ↔ Criterion[] (many-to-many)
```

---

## 🔧 BOSQICHLAR

---

### 🔴 BOSQICH 1: XAVFSIZLIK (Majburiy)

**Maqsad:** Barcha admin API-larni himoyalash. Busiz loyihani internetga chiqarib bo'lmaydi.

#### 1.1 API himoyasi — `getServerSession` qo'shish

Quyidagi fayllarga `getServerSession(authOptions)` tekshiruvini qo'shish kerak. Agar sessiya yo'q bo'lsa, `401 Unauthorized` qaytarish:

| Fayl | Qaysi metodlar | Izoh |
|---|---|---|
| `app/api/departments/route.ts` | POST, PUT, DELETE | GET ochiq qoladi (mijozlar uchun kerak) |
| `app/api/employees/route.ts` | GET, POST | Barcha metodlar faqat admin uchun |
| `app/api/employees/[id]/route.ts` | PUT, DELETE | Barcha metodlar faqat admin uchun |
| `app/api/criteria/route.ts` | GET, POST | Barcha metodlar faqat admin uchun |
| `app/api/criteria/[id]/route.ts` | PUT, DELETE | Barcha metodlar faqat admin uchun |
| `app/api/ratings/route.ts` | GET | Faqat GET himoyalanadi. POST ochiq (mijozlar baho berishi uchun) |

**Har bir himoyalangan endpoint boshiga qo'shiladigan kod namunasi:**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Endpoint ichida:
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 });
}
```

#### 1.2 Baho berish cheklovi (Rate Limiting)

`POST /api/ratings` uchun oddiy IP-asosiy cheklash:
- **Yangi fayl:** `lib/rateLimit.ts` — xotirada IP va vaqt saqlash
- Qoida: 1 IP dan 1 soatda maksimum **5 ta** baho
- Agar chegaradan oshsa: `429 Too Many Requests`

#### 1.3 Xavfsizlik tozalash
- `lib/auth.ts` dagi hardcoded `secret` ni `.env` ga ko'chirish
- `.env` faylga `NEXTAUTH_SECRET=...` qo'shish

---

### 🟡 BOSQICH 2: KOD TOZALASH VA TUZATISHLAR

**Maqsad:** Mavjud xatolarni tuzatish, kodni barqaror qilish.

#### 2.1 Employee modelini tozalash

Hozir `Employee` da 2 ta bo'lim ma'lumoti bor:
- `department: String` (kod bo'yicha, masalan "3-qavat") 
- `departmentId: Int?` (relatsiya orqali)

**Qilish kerak:** `department` (String) ni olib tashlab, faqat `departmentId` qoldirish.

> [!WARNING]
> Bu o'zgarish barcha `Employee` bilan ishlaydigan fayllarga ta'sir qiladi:
> - `app/api/employees/route.ts`
> - `app/api/employees/[id]/route.ts`
> - `app/admin/(dashboard)/employees/EmployeesClient.tsx`
> - `app/api/ratings/route.ts` (rating yaratishda)
> - `seedDemo.ts`

#### 2.2 QR kodlar sahifasini dinamik qilish

`app/admin/(dashboard)/qr/page.tsx` — hozir bo'limlar **qo'lda yozilgan** (hardcoded).

**Qilish kerak:** `/api/departments` dan dinamik yuklash. Server Component sifatida `prisma.department.findMany()` bilan.

#### 2.3 `alert()` va `confirm()` ni almashtirish

Barcha admin sahifalarda brauzerning standart `alert()` va `confirm()` dialoglaridan foydalanilmoqda. Bu professional ko'rinmaydi.

**Qilish kerak:**
- **Yangi komponent:** `components/Toast.tsx` — chiroyli bildirishnomalar (success, error, warning)
- **Yangi komponent:** `components/ConfirmModal.tsx` — tasdiqlash oynasi
- Quyidagi fayllardagi `alert/confirm` larni almashtirish:
  - `DepartmentsClient.tsx`
  - `EmployeesClient.tsx`
  - `CriteriaClient.tsx`

---

### 🟢 BOSQICH 3: ANALITIKA VA HISOBOTLAR

**Maqsad:** Admin panelni haqiqiy boshqaruv vositasiga aylantirish.

#### 3.1 Dashboard ga sana filtrlari

`app/admin/(dashboard)/page.tsx` ga quyidagi tezkor filtrlar:
- "Bugun"
- "Bu hafta"
- "Bu oy"
- "Oxirgi 90 kun"
- Maxsus sana oralig'i (date picker)

**Texnik yondashuv:** Dashboard ni `"use client"` ga o'tkazib, sana parametrlarini API ga yuborish. Yoki URL `searchParams` orqali server-side filter qilish.

#### 3.2 Grafiklar qo'shish

**Kutubxona:** `recharts` (React uchun eng mashhur grafik kutubxonasi)

```bash
npm install recharts
```

**Qo'shiladigan grafiklar:**
1. **Liniya grafik:** Kunlik/haftalik o'rtacha baho tendensiyasi (vaqt bo'yicha)
2. **Bar chart:** Bo'limlar bo'yicha taqqoslash (eng yaxshi va eng yomon ko'rinadi)
3. **Pie chart:** Baholar taqsimoti (nechta 5⭐, nechta 4⭐, ...)

**Yangi fayl:** `app/admin/(dashboard)/components/Charts.tsx`

#### 3.3 Excel eksport

**Kutubxona:** `xlsx` (SheetJS)

```bash
npm install xlsx
```

**Funksiya:** Admin "Baholar" sahifasida "📥 Excel yuklab olish" tugmasi. Bosilganda barcha filtrga mos baholarni `.xlsx` faylga yozib, foydalanuvchiga yuklab beradi.

**O'zgartiriladigan fayl:** `app/admin/(dashboard)/ratings/RatingsTable.tsx` — tugma va eksport funksiyasi qo'shiladi.

#### 3.4 Baho holati (Status) tizimi

Har bir bahoga admin tomonidan boshqariladigan holat (status):

**Schema o'zgarishi (`prisma/schema.prisma`):**
```prisma
model Rating {
  ...
  status    String   @default("new")  // "new" | "reviewing" | "resolved"
  ...
}
```

**UI o'zgarishi:** `RatingsTable.tsx` da har bir baho yonida rangdor badge:
- 🔴 Yangi (new)
- 🟡 Ko'rilmoqda (reviewing)  
- 🟢 Hal qilindi (resolved)

Bosilganda statusni o'zgartirish mumkin.

**API o'zgarishi:** `app/api/ratings/route.ts` ga `PATCH` metod qo'shish (status yangilash uchun).

---

### 🔵 BOSQICH 4: AI TAHLIL VA MASLAHAT TIZIMI

**Maqsad:** Tizimga "aqlli maslahatchi" funksiyasini qo'shish.

#### 4.1 Tahlil mexanizmi (Rule-based)

**Yangi fayl:** `lib/analytics.ts`

Bu fayl barcha baholarni tahlil qilib, qoidalar asosida maslahatlar ishlab chiqadi:

| Qoida raqami | Shart | Natija turi | Xabar namunasi |
|---|---|---|---|
| R1 | Bo'lim o'rtachasi oxirgi 2 haftada 20%+ tushgan | ⚠️ Warning | "3-qavatda Tozalik bahosi 4.3 dan 2.8 ga tushdi" |
| R2 | Bo'lim o'rtachasi 3 oy davomida oshgan | 📈 Positive | "Kassa bo'limi 3 oyda barqaror o'sishda" |
| R3 | 1-2 yulduzli baholar soni oxirgi haftada oshgan | 🔴 Alert | "Bu hafta 5 ta salbiy baho keldi" |
| R4 | Bo'limda baho soni juda kam (oyiga < 5) | 💡 Tip | "Laboratoriyada baho soni kam — QR kodni tekshiring" |
| R5 | Izohlardan takroriy so'zlar | 📋 Insight | "3 ta bemor 'kutish vaqti' haqida yozgan" |

**Funksiya interfeysi:**
```typescript
interface Insight {
  type: 'warning' | 'positive' | 'alert' | 'tip' | 'insight';
  department?: string;
  title: string;
  description: string;
  metric?: { before: number; after: number };
  createdAt: Date;
}

function generateInsights(ratings: Rating[], departments: Department[]): Insight[]
```

#### 4.2 Admin panelda "AI Tahlil" sahifasi

**Yangi fayllar:**
- `app/admin/(dashboard)/analytics/page.tsx` — sahifa
- `app/admin/(dashboard)/analytics/AnalyticsClient.tsx` — UI

**UI tarkibi:**
- Yuqorida: Filtr (sana oralig'i)
- Markazda: Maslahatlar ro'yxati (kartochkalar shaklida, turi bo'yicha ranglar bilan)
- Pastda: Eng yaxshi/eng yomon bo'limlar mini-grafiklari

**Sidebar ga qo'shish:** `layout.tsx` dagi `menuItems` ga:
```typescript
{ name: "Tahlil", href: "/admin/analytics", icon: <BrainCircuit size={20} /> }
```

#### 4.3 Haftalik Telegram hisobot

**Yangi fayl:** `app/api/cron/weekly-report/route.ts`

Har dushanba kuni (yoki API chaqirilganda) oxirgi 7 kunlik statistikani Telegramga yuboradi:
- Jami baholar soni
- Klinika o'rtacha bahosi
- Eng yaxshi va eng yomon bo'lim
- Salbiy baholar soni
- Tendensiya (o'tgan haftaga nisbatan)

---

### 🟣 BOSQICH 5: MIJOZLAR INTERFEYSI YAXSHILASH

**Maqsad:** Bemor tajribasini mukammallashtirish.

#### 5.1 Ko'p tilli qo'llab-quvvatlash

**Yangi fayllar:**
- `lib/i18n.ts` — til funksiyalari
- `lib/translations/uz.ts` — O'zbek tilidagi matnlar
- `lib/translations/ru.ts` — Rus tilidagi matnlar

**O'zgartiriladigan fayl:** `app/page.tsx` — barcha hardcoded matnlar til faylidan olinadi. Sahifa yuqorisida til tanlash tugmasi (🇺🇿 / 🇷🇺).

#### 5.2 Salbiy baho uchun qayta aloqa

Agar bemor biror mezon ga 1-2 yulduz bossa:
- Forma pastida "📞 Menga qo'ng'iroq qilib, muammoni hal qiling" tugmasi paydo bo'ladi
- Bosilganda telefon raqami kiritish maydoni chiqadi
- Bu ma'lumot `Rating` modeliga `phone` field sifatida saqlanadi va admin panelda ko'rinadi

**Schema o'zgarishi:**
```prisma
model Rating {
  ...
  phone      String?   // Bemor telefon raqami (ixtiyoriy, qayta aloqa uchun)
  ...
}
```

#### 5.3 Animatsiyalar

Muvaffaqiyat ekraniga (baho yuborgandan keyin) confetti yoki checkmark animatsiyasi qo'shish.

**Kutubxona:** `canvas-confetti` yoki oddiy CSS animatsiya.

---

### ⚫ BOSQICH 6: SOTISHGA TAYYORLASH (Kelajak)

> [!NOTE]
> Bu bosqich faqat 1-5 bosqichlar to'liq tugagandan keyin boshlanadi. Hozir rejalash uchun yozib qo'yamiz.

#### 6.1 PostgreSQL ga o'tish
- `prisma/schema.prisma` da `provider = "postgresql"` ga o'zgartirish
- Supabase yoki Railway da bepul PostgreSQL baza ochish
- Ma'lumotlarni migratsiya qilish

#### 6.2 Multi-tenant arxitektura
- `Clinic` modeli qo'shish (klinika nomi, logo, ranglar)
- Barcha modellar ga `clinicId` qo'shish
- Har bir klinika faqat o'z ma'lumotlarini ko'radi

#### 6.3 Hosting va deployment
- Vercel yoki Railway ga deploy qilish
- Maxsus domen ulash (`baholash.uz`)

---

## 📌 MUHIM QOIDALAR (Har qanday model uchun)

> [!IMPORTANT]
> Quyidagi qoidalarga **har doim** rioya qilish kerak:

1. **Rang palitra:** Asosiy rang `#0A9C54` (yashil), ikkinchi darajali `slate` oilasi. Boshqa tasodifiy ranglar ishlatilmasin.
2. **Shrift:** `Plus Jakarta Sans` (globals.css da aniqlangan). Boshqa shrift qo'shilmasin.
3. **Komponent uslubi:** `rounded-2xl` yoki `rounded-3xl`, `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`, `border border-slate-100`. Oddiy burchakli yoki soyasiz dizayn yo'q.
4. **Til:** Admin panel interfeysi **O'zbek tilida** (Baholar, Xodimlar, Bo'limlar...). Kod va o'zgaruvchilar **ingliz tilida**.
5. **Alert/Confirm:** `alert()` va `confirm()` ishlatilmasin. Faqat maxsus Toast va Modal komponentlar.
6. **API xavfsizlik:** Har bir yangi admin API endpointida `getServerSession` tekshiruvi bo'lishi **shart**.
7. **Bo'limlar turi:** `type: 'general'` = Ambulator, `type: 'floor'` = Statsionar. Bu mantiq buzilmasin.
8. **Xodim tanlash:** Mijoz (bemor) interfeyisda xodim tanlash (dropdown) **yo'q**. Bu qaror qabul qilingan va o'zgartirilmasin.

---

## ✅ HOLAT KUZATUVI

| Bosqich | Holat | Izoh |
|---|---|---|
| 🔴 1. Xavfsizlik | ⬜ Boshlanmagan | |
| 🟡 2. Kod tozalash | ⬜ Boshlanmagan | |
| 🟢 3. Analitika | ⬜ Boshlanmagan | |
| 🔵 4. AI Tahlil | ⬜ Boshlanmagan | |
| 🟣 5. Mijoz UX | ⬜ Boshlanmagan | |
| ⚫ 6. Sotishga tayyor | ⬜ Kelajak | |

---

*Ushbu hujjat loyihaning yagona manba hujjati (Single Source of Truth) hisoblanadi. Har qanday AI model (Claude, Gemini) shu hujjatga asoslanib ishlashi kerak.*
