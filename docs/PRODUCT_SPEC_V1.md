# SmartWallet V1 - mahsulot spetsifikatsiyasi

## 1. Hujjat maqomi

Ushbu hujjat `web/smartwallet-v1` branchidagi SmartWallet V1 uchun yagona mahsulot manbasi hisoblanadi. Oldingi AqlliHamyon, Aqli Hamyon, Maga Flow, PWA va native-app rejalari V1 doirasida ushbu hujjatdan ustun emas.

V1 qarorlari:

- mahsulot nomi: **SmartWallet**;
- foydalanuvchi ko'radigan AI yordamchi: **Maga AI**;
- AI hisoblash va vositalar qatlami: **Maga Brain**;
- platforma: faqat responsive web;
- PWA, APK, AAB, TestFlight va native ilova V1 tarkibiga kirmaydi;
- V1 bank integratsiyasisiz ishlaydi;
- asosiy tillar: UZ, RU va EN;
- yangi backend: Supabase project ref `qogbqyrbnwmpdzwqmlzx`;
- avvalgi Supabase loyiha faqat o'qish va solishtirish uchun; unga migration, write yoki cleanup yuborilmaydi;
- oddiy mahsulot operatsiyalarida moliyaviy yozuvlar hard-delete qilinmaydi.

## 2. Mahsulot maqsadi

SmartWallet foydalanuvchiga qo'lda yuritiladigan hamyonlar orqali kundalik moliyasini boshqarish imkonini beradi. V1 quyidagilarni ishonchli bajarishi kerak:

1. hamyon va boshlang'ich balans yaratish;
2. kirim, chiqim va hamyonlararo o'tkazmani xavfsiz yozish;
3. balans va tahlilni serverdagi haqiqiy ledger ma'lumotidan hisoblash;
4. qarz, maqsad, limit, obuna va eslatmalarni boshqarish;
5. Maga AI orqali moliyaviy holatni tushuntirish;
6. har qanday AI o'zgarishini foydalanuvchi tasdig'idan keyin bajarish;
7. telefon, planshet va desktop brauzerlarida bir xil ma'lumot va funksiyani ko'rsatish.

## 3. V1 ga kirmaydigan ishlar

Quyidagilar V1 doirasidan tashqarida:

- bank yoki karta API orqali real balansni avtomatik olish;
- PAN, CVV yoki to'liq karta raqamini saqlash;
- real Visa/Mastercard ulanishini ko'rsatish;
- PWA manifesti, service worker, install prompt yoki offline mutation queue;
- push notification;
- Face ID yoki fingerprint'ga bevosita native kirish;
- Google Play Billing, App Store Billing, APK/AAB va TestFlight;
- ishonchli background sync;
- real-time ovozli suhbat;
- maqolalar, reklama tarmog'i va moliyaviy profiling asosidagi reklama;
- foydalanuvchi tranzaksiyalarini tarif sababli o'chirish;
- eski Supabase loyihadan avtomatik data ko'chirish.

Brauzerda kamera, galereya yoki mikrofon imkoniyati keyin qo'shilishi mumkin, lekin ular V1 release mezoni emas.

## 4. Brend va atamalar

| Atama | Ma'nosi |
|---|---|
| SmartWallet | mahsulot va web-ilova nomi |
| Maga AI | chat, insight va tavsiya interfeysi |
| Maga Brain | serverdagi AI orchestrator, deterministic calculator va ruxsatlangan vositalar qatlami |
| Hamyon | foydalanuvchi qo'lda boshqaradigan naqd pul, karta yoki hisob yozuvi |
| Ledger transaction | foydalanuvchining moliyaviy hodisasi |
| Ledger entry | ma'lum hamyon balansiga ta'sir qiluvchi signed yozuv |
| Correction | eski yozuvni o'chirmasdan, reversal va yangi to'g'ri yozuv yaratish |
| Void | yozuvni audit izini saqlagan holda bekor qilish |

UI matnlarida `AqlliHamyon`, `Aqli Hamyon`, `Maga Flow`, `AI yordamchi`, `Start` va `Quantum` nomlari ishlatilmaydi.

## 5. Platforma va responsive qoidalar

### 5.1 Qo'llanadigan muhit

- mobil web: 360 px dan boshlab;
- asosiy acceptance o'lchamlari: 375x812 va 393x852;
- tablet: 768 px va undan katta;
- desktop: 1280 px va undan katta;
- faqat qo'llab-quvvatlanadigan zamonaviy Chrome, Edge, Safari va Firefox versiyalari.

### 5.2 Responsive xulq

- mobil ekranda asosiy navigatsiya pastda turadi;
- tablet va desktopda ayni besh yo'nalish rail yoki sidebar ko'rinishiga o'tishi mumkin;
- navigatsiya nomlari va route'lari platformaga qarab o'zgarmaydi;
- desktop UI telefon maketini markazga cho'zib qo'ymaydi; kontent o'qilishi uchun max-width va grid ishlatiladi;
- iPhone korpusi, Dynamic Island, OS status bar va home indicator mahsulot UI qismi emas;
- safe-area faqat brauzer viewport talab qilgan joyda qo'llanadi, native qurilma taqlid qilinmaydi.

## 6. Axborot arxitekturasi va navigatsiya

Authenticated ilovada besh asosiy yo'nalish mavjud:

1. Bosh sahifa;
2. Maga AI;
3. `+` Tranzaksiya;
4. Tahlil;
5. Menyu.

`+` alohida doimiy page emas; u modal yoki bottom sheet ochadi. Deep-link va browser back xulqi aniq ishlashi kerak.

Profilga ikki xavfsiz va topiladigan yo'l bor:

- header/avatar orqali;
- Menyu ichidagi "Profil va sozlamalar" havolasi orqali.

Avatar tugmasi klaviatura bilan ochiladi va screen reader uchun aniq label'ga ega bo'ladi.

### 6.1 Route xaritasi

| Route | Vazifa |
|---|---|
| `/` | marketing/landing |
| `/login` | kirish |
| `/register` | ro'yxatdan o'tish |
| `/auth/callback` | OAuth/email callback |
| `/reset-password` | parol tiklash |
| `/app` | authenticated resolver; default `/app/maga-ai` |
| `/app/home` | Bosh sahifa |
| `/app/maga-ai` | Maga AI |
| `/app/analytics` | Tahlil |
| `/app/menu` | Menyu |
| `/app/profile` | Profil va sozlamalar |
| `/app/transactions` | tranzaksiyalar tarixi |
| `/app/wallets` | Hamyonlar |
| `/app/debts` | Qarzlar |
| `/app/goals` | Maqsadlar |
| `/app/limits` | Limitlar |
| `/app/subscriptions` | foydalanuvchi obunalari |
| `/app/reports` | Hisobotlar va eksport |
| `/app/reminders` | Eslatmalar va qaydlar |

Ruxsatsiz `/app/*` so'rovi login'ga yuboriladi va muvaffaqiyatli login'dan keyin xavfsiz internal return URL qayta ochiladi. Tashqi/open redirect qabul qilinmaydi.

## 7. Birinchi kirish va onboarding

Onboarding uch bosqichdan iborat:

1. til va asosiy valyuta;
2. faoliyat va yordam kerak bo'lgan yo'nalish;
3. ixtiyoriy oylik daromad va birinchi hamyon.

Qoidalar:

- birinchi render fallback tili UZ;
- tanlangan til server profilida saqlanadi;
- asosiy valyuta fallback'i UZS, lekin foydalanuvchi UZS, USD, EUR yoki boshqa ISO 4217 valyutani tanlaydi;
- oylik daromad AI profile fact hisoblanadi va wallet balansiga avtomatik qo'shilmaydi;
- telefon, karta raqami, qarz va boshqa og'ir ma'lumot majburiy emas;
- onboarding draft saqlanadi va davom ettiriladi;
- foydalanuvchi AI profile fact'larini keyin ko'radi, tahrirlaydi va o'chiradi.

## 8. Asosiy ekranlar

### 8.1 Bosh sahifa

Bosh sahifada:

- vaqtga mos salomlashuv;
- avatar va ilova ichidagi o'qilmagan bildirishnoma belgisi;
- jami balans bloki;
- tanlangan hamyon bloki;
- 2-4 ta hamyonni tanlash interfeysi;
- joriy oy kirim va chiqim;
- akkaunt bo'yicha XP/progress, agar bu funksiya keyin alohida tasdiqlansa;
- oxirgi 4-5 tranzaksiya;
- loading, empty, error va connection-lost holatlari.

Jami balans tanlangan asosiy valyutaga historical rate snapshotlari orqali hisoblanadi. Tanlangan hamyon filtri tranzaksiyalar va wallet-specific ko'rsatkichlarga ta'sir qiladi, lekin akkaunt-wide XP'ga ta'sir qilmaydi.

Production'da demo balans, fake Visa yoki `**** 1234` ko'rsatilmaydi. Ma'lumot bo'lmasa empty state chiqadi.

### 8.2 Yangi tranzaksiya

Turlar:

- kirim;
- chiqim;
- o'tkazma.

Majburiy ma'lumot:

- tur;
- miqdor;
- valyuta;
- wallet yoki transfer uchun source/destination wallet;
- sana-vaqt;
- kategoriya.

Ixtiyoriy ma'lumot:

- subkategoriya;
- izoh;
- receipt attachment.

Submit tugmasi bir marta ishlaydi. Har write server tomonidan foydalanuvchi bilan bog'langan idempotency key va payload hash bilan himoyalanadi.

### 8.3 Tranzaksiyalar tarixi

- barcha/kirim/chiqim/o'tkazma filtri;
- sana, hamyon, kategoriya va qidiruv;
- detail view;
- correction yoki void;
- oddiy UI orqali hard delete yo'q;
- barcha o'zgarishlar audit event yaratadi.

### 8.4 Maga AI

Maga AI boshlang'ich dashboardida:

- serverdan olingan balans xulosasi;
- bugungi xarajat;
- bitta tushuntiriladigan insight;
- quick question tugmalari;
- chat history.

Maga Brain qoidalari:

- LLM hech qachon balansni o'zi hisoblamaydi; hisob deterministic server funksiyasidan keladi;
- brauzerga AI provider secret yuborilmaydi;
- foydalanuvchiga tegishli bo'lmagan data AI kontekstiga kirmaydi;
- AI read-only javob berishi mumkin;
- write faqat `proposal -> foydalanuvchi confirm -> server authorization -> atomic write -> receipt` oqimi bilan bajariladi;
- confirmation'da tur, summa, valyuta, wallet, sana va ta'sir aniq ko'rinadi;
- tool allowlist serverda saqlanadi;
- prompt injection hech qachon RLS yoki server authorization'ni chetlab o'tmaydi;
- AI tavsiyasi professional moliyaviy maslahat yoki kafolat sifatida ko'rsatilmaydi.

### 8.5 Tahlil

- Hafta/Oy/Yil;
- kirim va chiqim line chart;
- sof natija;
- kategoriya donut yoki bar chart;
- foiz va aniq summa;
- accessible jadval varianti;
- wallet va period filtri;
- real ledger data;
- empty/loading/error holati;
- Maga AI insight'ga scoped deep-link.

### 8.6 Menyu

Asosiy ketma-ketlik:

1. Hamyonlar;
2. Qarzlar;
3. Maqsadlar;
4. Limitlar;
5. Obunalar;
6. Hisobotlar;
7. Eslatmalar va qaydlar;
8. Profil va sozlamalar.

Obunalar foydalanuvchining Netflix, internet va boshqa davriy to'lovlari; SmartWallet tariflari emas.

### 8.7 Profil

- avatar, ism va account status;
- email, telefon ixtiyoriy, til va valyuta;
- light/dark/system theme;
- notification preference, hozircha in-app va mavjud bo'lsa email;
- faol sessiyalar va boshqa sessiyalardan chiqish;
- parol/2FA/recovery;
- AI memory view/edit/delete;
- data export;
- account deletion workflow;
- maxfiylik siyosati va foydalanish shartlari.

V1 "Face ID" deb va'da bermaydi. Keyingi web authentication bosqichida passkey/device verification faqat qo'llab-quvvatlanadigan brauzerlar uchun alohida acceptance bilan qo'shilishi mumkin.

## 9. Ledger va moliyaviy invariantlar

### 9.1 Saqlash modeli

- pul qiymatlari float'da saqlanmaydi;
- summa currency exponent'iga mos integer minor unit ko'rinishida saqlanadi;
- har ledger transaction bir yoki bir nechta ledger entry yaratadi;
- wallet balans `opening_balance + posted entries` dan olinadi;
- UI balansni mustaqil yozmaydi;
- barcha posted yozuvlar append-only;
- "edit" amali reversal va replacement yozuvini yaratadi;
- "delete" amali void/reversal qiladi, hard-delete emas;
- wallet o'chirilmaydi, arxivlanadi;
- tarif pasayishi data o'chirmaydi.

### 9.2 Transfer

- bir valyutadagi transfer ikki wallet entry'ni bitta database transaction'da yaratadi;
- source kamayadi, destination oshadi;
- cross-currency transfer source amount, destination amount, rate, rate source va rate timestamp'ni saqlaydi;
- partial transfer holati bo'lishi mumkin emas;
- retry duplicate entry yaratmaydi.

### 9.3 Qarz va maqsad

- qarz principal'i oddiy daromad yoki xarajatga noto'g'ri qo'shilmaydi;
- qarz to'lovi wallet va debt ledger'ga atomik ta'sir qiladi;
- interest/fee principal'dan alohida kategoriya;
- maqsadga pul qo'shish ichki reserve transfer bo'lib, xarajat hisoblanmaydi.

### 9.4 Correction va audit

Audit event'da kamida:

- actor user;
- event turi;
- old transaction reference;
- new/reversal reference;
- request ID;
- vaqt;
- foydalanuvchi bergan sabab saqlanadi.

Oddiy product operatsiyalarida ledger va audit event hard-delete qilinmaydi. Account erasure foydalanuvchi talab qilgan alohida privacy workflow bo'lib, grace period, recent authentication, external storage/provider cleanup va audit receipt talab qiladi.

## 10. Supabase chegarasi

### 10.1 Loyihalar

- **target/write-enabled:** `qogbqyrbnwmpdzwqmlzx`;
- **source/read-only:** avvalgi loyiha; faqat schema va moslikni o'rganish uchun;
- source project ref yoki credential frontendga ko'chirilmaydi;
- source loyihaga migration, function deploy, storage write yoki user write yuborilmaydi;
- source data import V1'ning avtomatik qismi emas.

### 10.2 Xavfsizlik

- exposed schema'dagi har bir user-data table'da RLS yoqiladi;
- har policy `auth.uid()` va row ownership'ni tekshiradi;
- `TO authenticated` yolg'iz o'zi authorization hisoblanmaydi;
- UPDATE policy'da `USING` va `WITH CHECK` bo'ladi;
- yangi view'lar `security_invoker` bo'ladi yoki exposed role'lardan yopiladi;
- `SECURITY DEFINER` faqat majburiy holatda, private schema, fixed `search_path`, explicit auth check va explicit grants bilan ishlatiladi;
- `service_role`/secret key brauzerga yuborilmaydi;
- `user_metadata` authorization uchun ishlatilmaydi;
- Storage private bucket, owner path, file size/type validation va signed URL bilan ishlaydi;
- ikki alohida user, anonymous va admin boundary testlari majburiy;
- Data API exposure va `GRANT` RLS'dan alohida tekshiriladi.

### 10.3 Migration qoidasi

- barcha schema o'zgarishi reviewed migration orqali;
- migration target loyihada dry-run va diff'dan o'tadi;
- rollback yo'li va restore dalili bo'lmasdan production migration yo'q;
- source loyiha migration history'si target uchun ko'r-ko'rona ko'chirilmaydi;
- target fresh schema sifatida quriladi;
- database advisor natijalari release daliliga qo'shiladi.

## 11. Tarif va to'lov chegarasi

Public plan code'lari kelajak uchun faqat:

- `free`;
- `basic`;
- `pro`.

Tarif hech qachon mavjud moliyaviy data'ni hard-delete qilmaydi. Limit oshganda yangi premium action bloklanishi mumkin, ammo foydalanuvchi o'z data'sini ko'rish va eksport qilish imkonini saqlaydi.

V1 paid checkout faqat real web payment provider, verified webhook, idempotent payment receipt, refund/reconciliation va admin audit tayyor bo'lsa yoqiladi. Telegramga chek yuborish, fake auto-renew, fake Restore yoki soxta "keyingi yechish sanasi" ishlatilmaydi. Provider tayyor bo'lmasa paid CTA waitlist yoki "tez orada" holatida qoladi; Free core release bloklanmaydi.

## 12. Lokalizatsiya

- har user-facing matn translation key orqali;
- UZ, RU va EN bir checkpoint'da birga yoziladi;
- hard-coded sana, summa va plural yo'q;
- `Intl.NumberFormat` va `Intl.DateTimeFormat` ishlatiladi;
- valyuta belgisi noaniq bo'lsa ISO code ham ko'rsatiladi;
- uzun RU/EN matnlar 360 px'da overflow qilmaydi;
- tarjima yo'q bo'lsa production'da raw key ko'rsatilmaydi;
- AI javobi user tiliga mos keladi, ammo transaction category stable ID bilan saqlanadi.

## 13. Theme va design system

Light:

- background `#FCF8F5`;
- card `#FFFFFF`;
- primary text `#202522`;
- secondary text `#85807C`;
- sage `#587A55`;
- soft sage `#EDF3E9`;
- copper `#B46343`;
- expense `#C6503D`;
- border `#EEE5DE`.

Dark:

- background `#0F1110`;
- card `#181B1A`;
- primary text `#F4EBDD`;
- secondary text `#AAA9A1`;
- sage `#8EAE75`;
- soft sage `#1D3025`;
- copper `#B96B4C`;
- expense `#D85C5C`;
- border `#2B302D`.

Theme setting: `system`, `light`, `dark`. V1'da soatga qarab majburiy 06:00/18:00 almashish yo'q. Foydalanuvchi tanlovi server profilida va first paint'dan oldin mavjud client hint'da saqlanadi.

## 14. Holatlar va accessibility

Har data ekrani quyidagilarga ega:

- loading;
- empty;
- recoverable error;
- unauthorized/session expired;
- connection lost;
- success;
- submitting/duplicate-submit protection.

Connection lost holatida pul o'zgartiruvchi write local queue'ga yashirincha qo'shilmaydi. Foydalanuvchi qayta ulanish va qayta yuborishni aniq ko'radi; server idempotency duplicate'ni to'xtatadi.

Accessibility mezoni WCAG 2.2 AA:

- keyboard-only ishlash;
- ko'rinadigan focus;
- kamida 44x44 CSS px pointer target;
- screen-reader label;
- chart uchun jadval/text alternative;
- rangdan tashqari ikon/text bilan kirim-chiqim farqi;
- `prefers-reduced-motion`;
- 200% zoom'da funksional layout;
- light va dark kontrast tekshiruvi.

## 15. Privacy va xavfsiz AI

- foydalanuvchi AI'ga qanday data yuborilishini ko'radi;
- receipt, note va moliyaviy ma'lumot providerga minimal hajmda yuboriladi;
- provider key va server tool'lar browserdan yopiq;
- AI memory har fact uchun provenance va updated time saqlaydi;
- memory view/edit/delete mavjud;
- loglarda token, receipt URL yoki moliyaviy note to'liq yozilmaydi;
- account deletion DB, Storage, AI provider data va session revocation'ni qamrab oladi;
- maxfiylik siyosati providerlar va retention'ni ochiq aytadi;
- AI insight manbasi va hisob periodi foydalanuvchiga ko'rsatiladi.

## 16. Sifat va release acceptance

Har checkpoint uchun:

- `npm run lint`;
- production build;
- `git diff --check`;
- tegishli unit/integration/browser test;
- UZ/RU/EN;
- light/dark;
- 375x812, 393x852, tablet va desktop;
- keyboard/accessibility tekshiruvi;
- browser console va failed network request tekshiruvi;
- real data yoki aniq test fixture; production demo data emas;
- CHANGED / VERIFIED / NOT VERIFIED / RISK / NEXT hisoboti.

Release faqat quyidagilar isbotlanganda tayyor:

1. real target Supabase'da ikki-user isolation o'tgan;
2. transfer va correction atomik;
3. retry duplicate transaction yaratmaydi;
4. source Supabase'da hech qanday write bo'lmagan;
5. UZ/RU/EN va responsive acceptance o'tgan;
6. AI server authorization'siz write qila olmaydi;
7. backup, rollback va restore dalili mavjud;
8. production'da demo moliyaviy data yo'q;
9. accessibility critical violation yo'q;
10. release va rollback commitlari qayd qilingan.
