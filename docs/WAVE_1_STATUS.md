# Wave 1 status - SmartWallet web foundation

Branch: `web/smartwallet-v1`  
Updated: 2026-08-11

## Current result

Wave 1 implementation is complete in source and the fresh SmartWallet database. Wave 1 intentionally contains Phases 1-4 of the SmartWallet roadmap, not just Phase 1. This branch replaces the old AI Studio/Maga Flow interface with a fresh SmartWallet web foundation. The old source is preserved at `archive/maga-flow-before-smartwallet-2026-08-11`.

## Wave 1 scope

| Roadmap phase | Scope | Status |
|---|---|---|
| Phase 1 | Decisions, audit and safe foundation | VERIFIED |
| Phase 2 | Fresh Supabase, wallets, append-only ledger and RLS | IMPLEMENTED + APPLIED |
| Phase 3 | Atomic financial operations, recovery and rollback rehearsal | IMPLEMENTED + APPLIED |
| Phase 4 | Auth, privacy, onboarding and persisted UZ/RU/EN profiles | IMPLEMENTED |

| Checkpoint | Status | Evidence |
|---|---|---|
| CP-01 Canonical scope freeze | VERIFIED | User-confirmed decisions recorded: SmartWallet, Maga AI/Maga Brain, responsive web only, three languages, no PWA/native and bank-free V1. |
| CP-02 Repository baseline | VERIFIED | GitHub remote, `main` baseline commit, archive branch and SmartWallet working branch recorded. |
| CP-03 Existing UI inventory | VERIFIED | Legacy Maga Flow UI was inventoried and replaced only on the new branch; archive retains the original state. |
| CP-04 Environment contract | VERIFIED | `.env.example` contains browser-safe names only. `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` were saved to Vercel for Preview and Production; no secret/service key was used. |
| CP-05 Quality baseline | VERIFIED | Typecheck/build scripts and GitHub Actions workflow added. Remote GitHub Actions run `31466432353` successfully installed dependencies, passed TypeScript and created a production build. Local Node TLS remains an environment-only issue. |
| CP-06 Fresh database foundation | APPLIED | Target-only migration `20260811_01_phase2_financial_foundation` created currencies, profiles, manual wallets, append-only ledger tables, audit records, RLS policies and explicit grants. |
| CP-07 Financial operation boundary | APPLIED | Target-only migration `20260811_02_phase3_finance_operations` added atomic income, expense, transfer, correction and void operations with idempotency and audit trail. |
| CP-08 Database hardening | APPLIED | Target-only migration `20260811_03_phase2_fk_index_hardening` added the missing foreign-key indexes. Direct ledger, audit and idempotency writes remain blocked for browser users. |
| CP-09 Auth and onboarding | IMPLEMENTED | Official Supabase browser SDK, PKCE session handling, login/registration/recovery, server-persisted onboarding and profile preferences are now wired into the app. |

## Visible changes in this commit

- Brand renamed from Maga Flow to SmartWallet.
- Old fake login, phone-frame layout and AI Studio code removed from this branch.
- New responsive shell with mobile bottom navigation and desktop sidebar.
- Five destinations: Home, Maga AI, new transaction, Analytics and Menu.
- Profile remains reachable through the avatar and Menu.
- UZ/RU/EN and light/dark preference are persisted to the authenticated user profile.
- Empty states are used instead of fake bank/card balances.
- V1 is explicitly bank-free, responsive web only and not a PWA/native app.

## Phase 2-4 verification notes

- The three migrations were applied only to the fresh SmartWallet target project, never to the legacy AqlliHamyon project.
- The Phase 2 structural/RLS test was run in a rollback-only transaction and passed after migration apply.
- Phase 3 was first compiled inside `BEGIN ... ROLLBACK`, then applied only after that probe passed. It was never retried blindly after a parser error.
- Supabase reports five intentional public `SECURITY DEFINER` financial RPCs. They are the narrow write boundary: each requires the signed-in user through `auth.uid()`, uses a fixed search path, and browser roles cannot directly write ledger/audit/idempotency tables. This warning is reviewed, not ignored.
- A real two-user RLS operation test still requires two disposable Auth users. The test SQL is prepared in `supabase/tests/phase3_finance_operations.sql`; it is not falsely marked as completed without those identities.

## Local validation note

The local machine initially had no project dependencies installed. Node package download is currently blocked by `UNABLE_TO_VERIFY_LEAF_SIGNATURE`; TLS verification was not disabled to work around this issue. The earlier remote GitHub Actions run `31466432353` successfully installed dependencies, passed `npm run typecheck` and passed `npm run build`. A new remote verification run will be created with this Wave 1 completion commit.
