# SmartVault

SmartVault — O'zbekiston foydalanuvchilari uchun uch tildagi, responsive web moliya boshqaruv mahsuloti.

Bu branch (`web/smartvault-v1`) eski Maga Flow kodidan alohida, noldan yaratilayotgan yangi web foundation hisoblanadi. Eski loyiha `archive/maga-flow-before-smartwallet-2026-08-11` branchida saqlangan.

## V1 yo'nalishi

- responsive web: mobil, tablet va desktop;
- UZ/RU/EN bir vaqtda;
- light/dark rejim;
- 5 asosiy yo'nalish: Bosh sahifa, Maga AI, yangi tranzaksiya, Tahlil va Menyu;
- banksiz V1: hamyonlar va tranzaksiyalar qo'lda yuritiladi;
- Maga AI faqat foydalanuvchi tasdiqlagan amallar orqali moliyaviy yozuvga ta'sir qiladi;
- Supabase target: `qogbqyrbnwmpdzwqmlzx`.

Native app, PWA install, APK/TestFlight va real bank integratsiyasi ushbu V1 scope'iga kirmaydi.

## Ishga tushirish

```bash
npm install
npm run dev
```

`VITE_SUPABASE_PUBLISHABLE_KEY` faqat browser-safe publishable key bo'lishi mumkin. Service-role key hech qachon frontend yoki Vercel public variable'ga kiritilmaydi.

## Hujjatlar

- [V1 mahsulot spetsifikatsiyasi](docs/PRODUCT_SPEC_V1.md)
- [40 checkpointli reja](docs/PHASE_PLAN.md)
