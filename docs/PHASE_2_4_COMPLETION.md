# SmartWallet Wave 1: Phases 2-4 completion record

Updated: 2026-08-11
Scope: responsive SmartWallet web only; manual wallets only; no bank integration; no legacy AqlliHamyon writes.

## Phase 2 - financial foundation

Applied to the fresh SmartWallet target only:

- `20260811_01_phase2_financial_foundation`
- `20260811_03_phase2_fk_index_hardening`

The foundation contains user-owned profiles, supported currencies, manual wallets, append-only ledger transactions and entries, idempotency receipts, audit events, RLS and explicit database permissions. Amounts use integer minor units. Empty states are required until the user creates real data.

## Phase 3 - safe financial operations

Applied to the fresh SmartWallet target only:

- `20260811_02_phase3_finance_operations`

The database exposes narrowly scoped operations for income, expense, transfer, correction and void. Each write uses an authenticated user, operation idempotency, a payload hash and audit data. Direct browser writes to ledger, audit and idempotency tables are revoked. Corrections and voids create linked reversal records; they do not silently edit or delete financial history.

Before apply, the full migration was compiled inside a transaction and rolled back. A syntax issue found in the first compile was corrected before the real apply. The initial failed compile created no database changes.

## Phase 4 - identity and onboarding

The browser now uses the official Supabase client only, with PKCE, automatic token refresh and cross-tab session support. It includes sign-in, registration, password recovery, logout, a server-persisted onboarding flow, locale/base-currency/timezone preferences and profile theme preference. It does not put service keys, custom REST authentication or onboarding data in browser storage.

Supabase redirect configuration includes the production callback and Vercel preview wildcard callback.

## Reviewed exceptions and remaining verification

The Supabase advisor reports five public `SECURITY DEFINER` functions. These are intentional financial write RPCs. They are restricted by authenticated user identity inside the operation boundary, fixed search paths and direct-table DML revocation. They must remain reviewed whenever a new operation is added.

The database is fresh, so the advisor may identify newly created indexes as unused. They are retained because they support user ownership and currency foreign keys as data grows.

The last non-destructive operational check still to perform is the prepared two-user RLS scenario. It requires two disposable Supabase Auth IDs and is intentionally not claimed as executed without real identities.
