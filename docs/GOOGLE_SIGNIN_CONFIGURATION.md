# SmartWallet — Google orqali kirish sozlamasi

Web-ilovadagi **Google orqali davom etish** tugmasi Supabase OAuth oqimidan
foydalanadi. U foydalanuvchini Google hisobini tanlashga olib boradi va
muvaffaqiyatli qaytgach SmartWallet bosh sahifasini ochadi.

Bu tugma ishlashi uchun bir marta, maxfiy ma'lumotlarni GitHub'ga kiritmasdan,
quyidagi sozlama qilinadi.

## 1. Supabase Redirect URL'lari

`Authentication → URL Configuration` sahifasida:

- **Site URL:** `https://smartwallett.vercel.app`
- **Redirect URLs:**
  - `https://smartwallett.vercel.app/auth/callback`
  - `https://*-aqllihamon.vercel.app/**`
  - `http://localhost:3000/**`

Ikkinchi satr Vercel preview manzillarida email tasdiqlashi va Google qaytishi
ishlashi uchun kerak. Production uchun aniq manzil saqlanadi.

## 2. Google OAuth

Google Cloud Console ichida Web OAuth Client yaratiladi. Uning **Authorized
redirect URI** qiymati quyidagicha bo'ladi:

`https://qogbqyrbnwmpdzwqmlzx.supabase.co/auth/v1/callback`

So'ng `Authentication → Providers → Google` bo'limida Google Client ID va
Client Secret kiritilib, provider yoqiladi. Client Secret faqat Supabase
dashboardda qoladi; u hech qachon GitHub, Vercel browser environment yoki
frontend kodiga kiritilmaydi.

Google foydalanuvchisi hisobini tanlagach bevosita kiradi. Email/parol oqimida
email tasdiqlashi yoqilgan holda qoladi; bu moliyaviy mahsulot uchun xavfsizroq
va emailga egalikni tasdiqlaydi.
