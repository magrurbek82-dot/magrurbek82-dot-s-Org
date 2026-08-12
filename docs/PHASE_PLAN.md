# SmartWallet V1 - 40 checkpoint implementation rejasi

## Ishlash qoidasi

Ushbu reja responsive-web-only SmartWallet V1 uchun dependency tartibida yozilgan. Bir phase'ning release gate'i yopilmaguncha keyingi phase production-ready deb belgilanmaydi.

Har checkpoint natijasi:

`IMPLEMENTED -> TESTED -> BUILT -> BROWSER VERIFIED -> UZ/RU/EN -> LIGHT/DARK -> EVIDENCE -> COMMIT READY`

Status qiymatlari:

- `NOT STARTED`;
- `IN PROGRESS`;
- `BLOCKED`;
- `VERIFIED`.

Boshlang'ich status: barcha checkpoint `NOT STARTED`. Mavjud kod borligi checkpoint o'tganini anglatmaydi; dalil bo'lmasa `VERIFIED` qo'yilmaydi.

## Delivery wave xaritasi

Bir wave bir nechta bog'liq phase'larni qamrab oladi. Wave faqat ichidagi barcha phase'lar release gate'dan o'tganda tugagan hisoblanadi.

| Wave | Qamrovi | Natija |
|---|---|---|
| Wave 1 | Phase 1-4 | Xavfsiz foundation, fresh database/ledger, atomic money operations, auth/onboarding |
| Wave 2 | Phase 5-6 | Responsive design system, app shell va core financial UI |
| Wave 3 | Phase 7-8 | Menyu money modullari, reports va Maga AI/Maga Brain |
| Wave 4 | Phase 9 | Full acceptance, staged cutover va rollback evidence |

## Qat'iy chegaralar

- branch: `web/smartwallet-v1`;
- kod manbai: ushbu GitHub repository;
- write-enabled Supabase target: `qogbqyrbnwmpdzwqmlzx`;
- oldingi Supabase: read-only;
- PWA/native/APK/AAB/TestFlight/push/native biometrics yo'q;
- bank integratsiyasi yo'q;
- ledger normal product oqimida hard-delete qilinmaydi;
- source project'dan avtomatik data import yo'q;
- package/src o'zgarishi faqat tegishli checkpoint boshlanganda qilinadi.

---

## Phase 1 - Qarorlar, audit va xavfsiz baza

### CP-01 - Canonical scope freeze

**Natija:** `PRODUCT_SPEC_V1.md` user tomonidan tasdiqlangan; SmartWallet/Maga AI/Maga Brain nomlari, responsive-web-only va non-goals muzlatilgan.

**Tekshiruv:** eski PWA/native/Start/Quantum talablar V1 acceptance ro'yxatida yo'q.

### CP-02 - Repository baseline

**Natija:** branch, HEAD, remote, dirty worktree, mavjud dependency va build holati dalil bilan qayd qilingan.

**Tekshiruv:** mavjud user o'zgarishlari alohida ko'rsatilgan; hech biri yo'qolmagan.

### CP-03 - Existing UI inventory

**Natija:** barcha route, component, state, fake data va browser-only muammo inventarizatsiya qilingan.

**Tekshiruv:** har element `keep / replace / remove / deferred` holatiga ega.

### CP-04 - Environment contract

**Natija:** local, preview va production environment nomlari; public va secret variable'lar ro'yxati yozilgan.

**Tekshiruv:** AI provider secret va Supabase secret/service key browser bundle'ga kirmaydi; `.env.example` faqat xavfsiz nomlarni ko'rsatadi.

### CP-05 - Quality baseline

**Natija:** lint, typecheck, test, build va diff-check uchun takrorlanadigan local/CI oqim mavjud.

**Tekshiruv:** baseline natijasi va mavjud failure'lar yashirilmasdan hisobotga yozilgan.

**Phase 1 gate:** scope, repo va environment bo'yicha noma'lum kritik holat qolmagan.

---

## Phase 2 - Fresh Supabase va ledger foundation

### CP-06 - Target/source isolation

**Natija:** `qogbqyrbnwmpdzwqmlzx` target sifatida tasdiqlangan; eski project faqat read-only audit uchun belgilangan.

**Tekshiruv:** source credential frontendda yo'q; source project'ga write/migration yubormaydigan guard va operator checklist mavjud.

### CP-07 - Currency va profile schema

**Natija:** profile, locale, timezone, base currency va currency exponent modeli reviewed migration'da yaratilgan.

**Tekshiruv:** UZS/USD/EUR va kamida bitta zero-decimal yoki three-decimal currency testdan o'tadi; float ishlatilmaydi.

### CP-08 - Wallet schema

**Natija:** wallet turi, nomi, currency, opening balance, rang va archive lifecycle yaratilgan.

**Tekshiruv:** user boshqa user wallet'ini ko'rmaydi; archived wallet history saqlanadi.

### CP-09 - Append-only ledger schema

**Natija:** ledger transaction, ledger entry, idempotency receipt, correction/void link va audit event jadvallari mavjud.

**Tekshiruv:** posted entry oddiy UPDATE/DELETE bilan o'zgarmaydi; balance entrylardan deterministik olinadi.

### CP-10 - RLS va grant foundation

**Natija:** barcha exposed user tables'da RLS, ownership policy, UPDATE uchun `USING/WITH CHECK`, explicit Data API grants mavjud.

**Tekshiruv:** anonymous, user A, user B va admin boundary testlari; view/RPC/function security review; advisor natijasi saqlangan.

**Phase 2 gate:** fresh target schema xavfsiz va ledger invariantlari database darajasida himoyalangan.

---

## Phase 3 - Atomic finance operations va recovery

### CP-11 - Income/expense RPC

**Natija:** kirim va chiqim server-side validation, signed entry, payload hash va user-bound idempotency bilan atomik yaratiladi.

**Tekshiruv:** success/error/timeout/retry/double-click testlari; duplicate balans ta'siri yo'q.

### CP-12 - Transfer RPC

**Natija:** same-currency va cross-currency transfer bitta transaction'da ikki wallet entry yaratadi.

**Tekshiruv:** source-only yoki destination-only partial state yuz bermaydi; rate/source/timestamp snapshot saqlanadi.

### CP-13 - Correction va void

**Natija:** edit/delete UI uchun reversal + replacement yoki void flow yaratilgan; original yozuv saqlanadi.

**Tekshiruv:** old/new/reversal link, sabab, actor, vaqt va balans qayta hisobi to'g'ri.

### CP-14 - Balance va aggregate functions

**Natija:** wallet balance, total balance, period income/expense va category aggregate deterministic query/function'dan keladi.

**Tekshiruv:** backdated correction, void, transfer va cross-currency fixture'lari kutilgan natijani beradi.

### CP-15 - Backup, dry-run va rollback rehearsal

**Natija:** migration dry-run, schema diff, backup verification va restore/rollback yo'li hujjatlashtirilgan.

**Tekshiruv:** test data restore qilinib invariantlar qayta o'tadi; source loyiha o'zgarmagan.

**Phase 3 gate:** moliyaviy write'lar exactly-once xulqqa yaqin, atomik va tiklanadigan.

---

## Phase 4 - Auth, privacy, onboarding va locale

### CP-16 - Auth client/server boundary

**Natija:** browser publishable key bilan ishlaydi; privileged operation server/RPC boundary'da; service key browserdan yopiq.

**Tekshiruv:** production bundle va network'da secret yo'q; expired session xavfsiz yopiladi.

### CP-17 - Login/register/recovery

**Natija:** email login/register, confirmation, reset-password, logout va xavfsiz callback/return URL ishlaydi.

**Tekshiruv:** success, invalid credentials, expired link, callback replay va open-redirect testlari.

### CP-18 - Session va account security

**Natija:** active session ko'rish, boshqa sessiyalardan chiqish, recent-auth gate va 2FA/recovery qarori amalga oshirilgan.

**Tekshiruv:** revoked session sensitive RPC ishlata olmaydi; user_metadata authorization uchun ishlatilmaydi.

### CP-19 - Three-step onboarding

**Natija:** til/valyuta, AI context va ixtiyoriy daromad/birinchi wallet oqimi mavjud; draft resume qilinadi.

**Tekshiruv:** daromad wallet balansiga qo'shilmaydi; skip/resume/back/refresh UZ/RU/EN'da ishlaydi.

### CP-20 - Privacy lifecycle

**Natija:** AI memory view/edit/delete, data export va account-erasure workflow'lari aniq status bilan mavjud.

**Tekshiruv:** recent auth, grace/cancel, session revocation, Storage/provider cleanup va audit receipt testlari.

**Phase 4 gate:** real user xavfsiz kira oladi, onboarding'dan o'tadi va o'z data huquqlarini boshqaradi.

---

## Phase 5 - Design system va responsive app shell

### CP-21 - Semantic design tokens

**Natija:** light/dark palette, typography, spacing, radius, shadow, state va chart tokenlari yagona source'da.

**Tekshiruv:** eski qarama-qarshi ranglar authenticated shell'da yo'q; kontrast WCAG 2.2 AA.

### CP-22 - Responsive layout primitives

**Natija:** mobile, tablet va desktop container/grid/header patternlari mavjud.

**Tekshiruv:** 360, 375, 393, 768, 1024 va 1280 px'da overflow yo'q; 200% zoom ishlaydi.

### CP-23 - Five-destination shell

**Natija:** Home, Maga AI, `+`, Tahlil va Menyu bir xil route modelida; mobile bottom nav, desktop rail/sidebar.

**Tekshiruv:** active state, deep-link, reload, browser back va 44x44 targetlar ishlaydi.

### CP-24 - Profile accessibility

**Natija:** Profile avatar va Menyu ichidagi text link orqali ochiladi.

**Tekshiruv:** keyboard, focus, screen reader label va signed-out holatlar o'tadi.

### CP-25 - Common state kit

**Natija:** loading, empty, error, unauthorized, connection-lost, submitting va success komponentlari bir xil pattern'da.

**Tekshiruv:** moliyaviy write offline bo'lganda yashirin queue yo'q; retry idempotent.

**Phase 5 gate:** real data ulash uchun responsive, accessible va barqaror shell tayyor.

---

## Phase 6 - Core financial UI

### CP-26 - Wallet management

**Natija:** wallet list/detail/create/edit/archive va opening balance oqimi real target data bilan ishlaydi.

**Tekshiruv:** currency o'zgartirish posted history'ni buzmaydi; archived wallet read-only history beradi.

### CP-27 - Transaction sheet va history

**Natija:** income/expense/transfer form, validation, filters, detail, correction va void UI ishlaydi.

**Tekshiruv:** keyboard/mobile numpad, double-submit, timeout/retry, UZ/RU/EN va real balance update.

### CP-28 - Home

**Natija:** greeting, total balance, selected wallet, wallet stack, monthly totals va recent transactions real data bilan.

**Tekshiruv:** wallet filter qoidalari to'g'ri; XP account-wide; production'da fake Visa/demo balans yo'q.

### CP-29 - Analytics

**Natija:** Hafta/Oy/Yil, income/expense chart, net result, category split va AI insight deep-link real ledgerdan.

**Tekshiruv:** chart totals server aggregates bilan teng; accessible table; empty/error/loading va locale formatting.

### CP-30 - Menu va Profile

**Natija:** yetti money module linki, Profile linki, personal data, language/currency/theme/security/privacy settings ishlaydi.

**Tekshiruv:** Menyu tartibi spec bilan bir xil; browser/native bo'lmagan funksiya va'da qilinmaydi.

**Phase 6 gate:** foydalanuvchi AI'siz to'liq asosiy moliyaviy oqimni bajara oladi.

---

## Phase 7 - Menyu money modullari va hisobot

### CP-31 - Debt ledger

**Natija:** olinadigan/beriladigan qarz, due date, partial payment, principal/interest va closed status wallet bilan atomik.

**Tekshiruv:** principal income/expense analytics'ni sun'iy oshirmaydi; partial payment retry duplicate emas.

### CP-32 - Goals va reserves

**Natija:** goal, target, deadline, progress va contribution internal reserve transfer orqali.

**Tekshiruv:** contribution expense emas; correction/void progressni to'g'ri qaytaradi.

### CP-33 - Limits, subscriptions va reminders

**Natija:** category limit, expected recurring payment, paid/failed/cancelled status va in-app reminders mavjud.

**Tekshiruv:** expected payment real transaction bilan chalkashmaydi; timezone va dedupe testlari.

### CP-34 - Reports va export

**Natija:** period/category/wallet report va versioned CSV/JSON export ishlaydi.

**Tekshiruv:** export totals analytics va ledger bilan teng; archived/voided data status bilan tushunarli.

### CP-35 - Entitlement safety

**Natija:** public code'lar faqat free/basic/pro; feature lock server snapshot'dan; downgrade data o'chirmaydi.

**Tekshiruv:** locked route dead-end emas; barcha user o'z data'sini ko'rish/eksport qilishda davom etadi. Real payment provider tayyor bo'lmasa paid checkout disabled.

**Phase 7 gate:** barcha Menyu moliyaviy modullari ledger bilan mos va destructive retention yo'q.

---

## Phase 8 - Maga AI / Maga Brain

### CP-36 - Read-only Maga Brain

**Natija:** server-side AI gateway, scoped user context, deterministic calculator va tool allowlist mavjud.

**Tekshiruv:** browser bundle'da provider secret yo'q; user A context'ida user B data yo'q; AI raqamni o'zi hisoblamaydi.

### CP-37 - Maga AI dashboard va chat

**Natija:** balance/today/insight/quick questions, chat history va internal deep-link'lar UZ/RU/EN'da.

**Tekshiruv:** real/empty/error/provider-timeout holatlari; unsafe claim va fake raqam yo'q.

### CP-38 - Confirmed AI actions

**Natija:** proposal -> explicit confirm -> server authorization -> atomic ledger write -> receipt oqimi.

**Tekshiruv:** prompt injection, stale proposal, changed wallet, duplicate confirm, insufficient balance va revoked session testlari.

**Phase 8 gate:** AI moliyaviy write'ni foydalanuvchi tasdig'i va server ruxsatisiz bajara olmaydi.

---

## Phase 9 - Final QA va release

### CP-39 - Full acceptance matrix

**Natija:** UZ/RU/EN, light/dark, responsive sizes, keyboard/screen reader, loading/empty/error/connection-lost/success, console/network, RLS, idempotency va performance matrix to'liq.

**Tekshiruv:** critical/high bug yo'q; har row screenshot, test log yoki query daliliga ega; source Supabase read-only bo'lib qolgan.

### CP-40 - Staged cutover va rollback

**Natija:** preview user acceptance, migration freeze, backup/restore dalili, production deploy, smoke test, observability va rollback commit/runbook tayyor.

**Tekshiruv:** real account bilan auth -> onboarding -> wallet -> transaction -> Home -> Tahlil -> Maga AI -> export oqimi o'tadi; rollback data yo'qotmaydi.

**Phase 9 gate:** SmartWallet V1 responsive web sifatida release qilish yoki rollback qilish uchun dalilli tayyor.

---

## Deferred backlog

Quyidagilar CP-40'dan keyingi alohida mahsulot qarori va acceptance talab qiladi:

- installable PWA;
- offline read cache va mutation sync;
- browser push;
- passkey/device verification;
- camera/microphone/receipt OCR;
- realtime voice;
- bank API va real card linking;
- paid checkout va provider reconciliation, agar V1 Free release'da yoqilmagan bo'lsa;
- native Android/iOS;
- maqolalar va reklama;
- XP orqali paid entitlement mukofoti.
