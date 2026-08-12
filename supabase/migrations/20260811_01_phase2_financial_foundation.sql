-- SmartWallet Phase 2: fresh target schema only.
--
-- TARGET (write-enabled): qogbqyrbnwmpdzwqmlzx
-- SOURCE (read-only legacy): ycxjikeycrbmlehmjwte
--
-- REVIEW BEFORE APPLYING
-- 1. This migration is intentionally for a *fresh* target only. It must never
--    be applied to the legacy/source project and contains no data-import path.
-- 2. All monetary values are BIGINT integer minor units. Do not replace these
--    columns with numeric, decimal, real, double precision, or money types.
-- 3. Ledger, idempotency, and audit tables deliberately expose SELECT-only
--    access to authenticated Data API clients. Phase 3 controlled RPCs own
--    their writes; clients must not write ledger rows directly.
-- 4. Review this file and run supabase/tests/phase2_financial_foundation.sql
--    against a disposable/dry-run target before a production apply.
--
-- ROLLBACK NOTE
-- This is a foundation migration. In a disposable empty test project it can be
-- rolled back by dropping objects in reverse dependency order. Do NOT use a
-- destructive DROP rollback against a project containing user financial data.
-- Production rollback is restore-to-pre-migration backup plus a reviewed
-- forward-fix/restore rehearsal, not deletion of ledger history.

begin;

-- UUID generation is an explicit fresh-target dependency.  Phase 3 may use
-- the same extension, but this foundation must stand on its own when reviewed
-- or dry-run independently.
create extension if not exists pgcrypto with schema extensions;

-- These types make product state explicit. They are intentionally small and
-- stable; new states require a reviewed migration rather than client strings.
create type public.locale_code as enum ('uz', 'ru', 'en');
create type public.theme_preference as enum ('system', 'light', 'dark');
create type public.onboarding_status as enum ('not_started', 'in_progress', 'completed');
create type public.wallet_type as enum ('cash', 'manual_account', 'savings', 'other');
create type public.wallet_lifecycle as enum ('active', 'archived');
create type public.ledger_transaction_type as enum (
  'income',
  'expense',
  'transfer',
  'adjustment',
  'correction',
  'void'
);
create type public.ledger_transaction_status as enum ('posted', 'voided', 'reversed');

-- ISO 4217 currency reference data. `exponent` describes how many decimal
-- digits a unit has; monetary values elsewhere are stored as integer minor
-- units. The initial seed prioritises active currencies available to V1,
-- including zero-, two-, three-, and four-decimal ISO examples.
create table public.currencies (
  code text primary key check (code ~ '^[A-Z]{3}$'),
  exponent smallint not null check (exponent between 0 and 4),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.currencies (code, exponent) values
  ('AED', 2), ('AFN', 2), ('ALL', 2), ('AMD', 2), ('ANG', 2),
  ('AOA', 2), ('ARS', 2), ('AUD', 2), ('AWG', 2), ('AZN', 2),
  ('BAM', 2), ('BBD', 2), ('BDT', 2), ('BGN', 2), ('BHD', 3),
  ('BIF', 0), ('BMD', 2), ('BND', 2), ('BOB', 2), ('BRL', 2),
  ('BSD', 2), ('BTN', 2), ('BWP', 2), ('BYN', 2), ('BZD', 2),
  ('CAD', 2), ('CDF', 2), ('CHF', 2), ('CLF', 4), ('CLP', 0),
  ('CNY', 2), ('COP', 2), ('CRC', 2), ('CUP', 2), ('CVE', 2),
  ('CZK', 2), ('DJF', 0), ('DKK', 2), ('DOP', 2), ('DZD', 2),
  ('EGP', 2), ('ERN', 2), ('ETB', 2), ('EUR', 2), ('FJD', 2),
  ('FKP', 2), ('GBP', 2), ('GEL', 2), ('GHS', 2), ('GIP', 2),
  ('GMD', 2), ('GNF', 0), ('GTQ', 2), ('GYD', 2), ('HKD', 2),
  ('HNL', 2), ('HTG', 2), ('HUF', 2), ('IDR', 2), ('ILS', 2),
  ('INR', 2), ('IQD', 3), ('IRR', 2), ('ISK', 0), ('JMD', 2),
  ('JOD', 3), ('JPY', 0), ('KES', 2), ('KGS', 2), ('KHR', 2),
  ('KMF', 0), ('KPW', 2), ('KRW', 0), ('KWD', 3), ('KYD', 2),
  ('KZT', 2), ('LAK', 2), ('LBP', 2), ('LKR', 2), ('LRD', 2),
  ('LSL', 2), ('LYD', 3), ('MAD', 2), ('MDL', 2), ('MGA', 2),
  ('MKD', 2), ('MMK', 2), ('MNT', 2), ('MOP', 2), ('MRU', 2),
  ('MUR', 2), ('MVR', 2), ('MWK', 2), ('MXN', 2), ('MYR', 2),
  ('MZN', 2), ('NAD', 2), ('NGN', 2), ('NIO', 2), ('NOK', 2),
  ('NPR', 2), ('NZD', 2), ('OMR', 3), ('PAB', 2), ('PEN', 2),
  ('PGK', 2), ('PHP', 2), ('PKR', 2), ('PLN', 2), ('PYG', 0),
  ('QAR', 2), ('RON', 2), ('RSD', 2), ('RUB', 2), ('RWF', 0),
  ('SAR', 2), ('SBD', 2), ('SCR', 2), ('SDG', 2), ('SEK', 2),
  ('SGD', 2), ('SHP', 2), ('SLE', 2), ('SOS', 2), ('SRD', 2),
  ('SSP', 2), ('STN', 2), ('SVC', 2), ('SYP', 2), ('SZL', 2),
  ('THB', 2), ('TJS', 2), ('TMT', 2), ('TND', 3), ('TOP', 2),
  ('TRY', 2), ('TTD', 2), ('TWD', 2), ('TZS', 2), ('UAH', 2),
  ('UGX', 0), ('USD', 2), ('UYU', 2), ('UZS', 2), ('VED', 2),
  ('VES', 2), ('VND', 0), ('VUV', 0), ('WST', 2), ('XAF', 0),
  ('XCD', 2), ('XOF', 0), ('XPF', 0), ('YER', 2), ('ZAR', 2),
  ('ZMW', 2), ('ZWG', 2);

-- A profile is a user-owned product preference record. Authentication data
-- (email, password, MFA, identity) stays in auth.users/auth APIs.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  display_name text check (display_name is null or char_length(display_name) between 1 and 80),
  avatar_path text check (avatar_path is null or char_length(avatar_path) <= 512),
  locale public.locale_code not null default 'uz',
  timezone text not null default 'Asia/Tashkent' check (char_length(timezone) between 1 and 64),
  base_currency_code text not null default 'UZS' references public.currencies(code),
  theme_preference public.theme_preference not null default 'system',
  onboarding_status public.onboarding_status not null default 'not_started',
  onboarding_draft jsonb not null default '{}'::jsonb check (jsonb_typeof(onboarding_draft) = 'object'),
  monthly_income_minor bigint,
  monthly_income_currency_code text references public.currencies(code),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_monthly_income_currency_check check (
    (monthly_income_minor is null and monthly_income_currency_code is null)
    or (monthly_income_minor is not null and monthly_income_currency_code is not null)
  ),
  constraint profiles_onboarding_completion_check check (
    (onboarding_status = 'completed' and onboarding_completed_at is not null)
    or (onboarding_status <> 'completed' and onboarding_completed_at is null)
  )
);

-- Wallets are manually managed financial containers in V1; no bank or card
-- integration is implied by this table. Their opening balance is immutable.
create table public.wallets (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  wallet_type public.wallet_type not null default 'manual_account',
  lifecycle public.wallet_lifecycle not null default 'active',
  name text not null check (char_length(name) between 1 and 120),
  currency_code text not null references public.currencies(code),
  opening_balance_minor bigint not null default 0,
  opening_balance_at timestamptz not null default now(),
  color_token text not null default 'indigo' check (char_length(color_token) between 1 and 64),
  archived_at timestamptz,
  archived_reason text check (archived_reason is null or char_length(archived_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_archive_lifecycle_check check (
    (lifecycle = 'active' and archived_at is null and archived_reason is null)
    or (lifecycle = 'archived' and archived_at is not null)
  ),
  constraint wallets_archive_time_check check (archived_at is null or archived_at >= created_at)
);

-- A ledger transaction is the immutable business event. Monetary effect lives
-- only in its entry rows; no balance is persisted here.
create table public.ledger_transactions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  transaction_type public.ledger_transaction_type not null,
  status public.ledger_transaction_status not null default 'posted',
  effective_at timestamptz not null,
  category_key text check (category_key is null or category_key ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  note text check (note is null or char_length(note) <= 2000),
  client_request_id uuid not null,
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  amends_transaction_id uuid references public.ledger_transactions(id) on delete restrict,
  amendment_reason text check (amendment_reason is null or char_length(amendment_reason) between 1 and 1000),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  constraint ledger_transactions_amendment_shape_check check (
    (
      transaction_type in ('correction', 'void')
      and amends_transaction_id is not null
      and amendment_reason is not null
    )
    or (
      transaction_type not in ('correction', 'void')
      and amends_transaction_id is null
      and amendment_reason is null
    )
  ),
  constraint ledger_transactions_amends_itself_check check (amends_transaction_id is null or amends_transaction_id <> id)
);

-- Signed amounts are intentional: positive increases a wallet balance and
-- negative decreases it. A transaction is considered financially complete only
-- when Phase 3 validates its complete entry set atomically via controlled RPC.
create table public.ledger_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  transaction_id uuid not null references public.ledger_transactions(id) on delete restrict,
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  currency_code text not null references public.currencies(code),
  amount_minor bigint not null check (amount_minor <> 0),
  created_at timestamptz not null default now(),
  constraint ledger_entries_transaction_wallet_unique unique (transaction_id, wallet_id, currency_code)
);

-- A receipt is written only after a successful atomic operation. It makes a
-- retried client request identifiable without allowing client-side mutation.
create table public.idempotency_receipts (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  operation text not null check (operation ~ '^[a-z][a-z0-9._-]{2,63}$'),
  client_request_id uuid not null,
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  ledger_transaction_id uuid references public.ledger_transactions(id) on delete restrict,
  response_code smallint not null default 201 check (response_code between 200 and 299),
  created_at timestamptz not null default now(),
  constraint idempotency_receipts_user_id_operation_client_request_id_key unique (user_id, operation, client_request_id)
);

-- Audit events do not store provider secrets or full receipt URLs. They retain
-- who performed an action and the immutable financial object references.
create table public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete restrict,
  event_type text not null check (event_type ~ '^[a-z][a-z0-9._-]{2,127}$'),
  entity_type text not null check (entity_type ~ '^[a-z][a-z0-9._-]{2,127}$'),
  entity_id uuid,
  request_id uuid,
  related_transaction_id uuid references public.ledger_transactions(id) on delete restrict,
  reason text check (reason is null or char_length(reason) <= 1000),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now()
);

-- Query patterns used by RLS and the financial UI. Do not add speculative
-- indexes without a query plan; these cover ownership and ledger chronology.
create index wallets_user_lifecycle_created_at_idx
  on public.wallets (user_id, lifecycle, created_at desc);
create index ledger_transactions_user_effective_at_idx
  on public.ledger_transactions (user_id, effective_at desc);
create index ledger_transactions_amends_transaction_id_idx
  on public.ledger_transactions (amends_transaction_id)
  where amends_transaction_id is not null;
create index ledger_entries_wallet_created_at_idx
  on public.ledger_entries (wallet_id, created_at desc);
create index ledger_entries_transaction_id_idx
  on public.ledger_entries (transaction_id);
create index audit_events_user_occurred_at_idx
  on public.audit_events (user_id, occurred_at desc);

-- Wallet financial fields and archived wallets are immutable. A correction is
-- represented by ledger rows, not by rewriting an opening balance or history.
create function public.enforce_wallet_immutable_financial_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if old.lifecycle = 'archived' then
    raise exception using
      errcode = '55000',
      message = 'Archived wallets are read-only; create a replacement wallet instead.';
  end if;

  if new.user_id is distinct from old.user_id
    or new.currency_code is distinct from old.currency_code
    or new.opening_balance_minor is distinct from old.opening_balance_minor
    or new.opening_balance_at is distinct from old.opening_balance_at
    or new.created_at is distinct from old.created_at then
    raise exception using
      errcode = '55000',
      message = 'Wallet owner, currency, opening balance, and creation time are immutable.';
  end if;

  if new.lifecycle = 'active' and (new.archived_at is not null or new.archived_reason is not null) then
    raise exception using
      errcode = '23514',
      message = 'An active wallet cannot have archive fields.';
  end if;

  if new.lifecycle = 'archived' and new.archived_at is null then
    raise exception using
      errcode = '23514',
      message = 'An archived wallet requires archived_at.';
  end if;

  return new;
end;
$$;

-- Preference/name/archive edits should be observable without allowing clients
-- to backdate the change timestamp. This trigger never changes money fields.
create function public.touch_row_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

-- The transaction itself cannot point across users when it corrects/voids an
-- earlier event. `security invoker` is intentional; no RLS bypass is used.
create function public.enforce_ledger_transaction_amendment_ownership()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if new.amends_transaction_id is not null and not exists (
    select 1
    from public.ledger_transactions as original_transaction
    where original_transaction.id = new.amends_transaction_id
      and original_transaction.user_id = new.user_id
  ) then
    raise exception using
      errcode = '23503',
      message = 'A correction or void must amend a transaction owned by the same user.';
  end if;

  return new;
end;
$$;

-- Each ledger entry must belong to the same owner as both the business event
-- and its wallet, and must use that wallet's currency. The Phase 3 RPC uses
-- this as a defense-in-depth invariant before committing an entry set.
create function public.enforce_ledger_entry_ownership()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if not exists (
    select 1
    from public.ledger_transactions as transaction_row
    join public.wallets as wallet_row on wallet_row.id = new.wallet_id
    where transaction_row.id = new.transaction_id
      and transaction_row.user_id = new.user_id
      and wallet_row.user_id = new.user_id
      and wallet_row.currency_code = new.currency_code
  ) then
    raise exception using
      errcode = '23503',
      message = 'Ledger entry owner or currency does not match its transaction and wallet.';
  end if;

  return new;
end;
$$;

-- Generic append-only guards. These functions are trigger-only, SECURITY
-- INVOKER, have a fixed search_path, and are not Data API endpoints.
create function public.reject_ledger_transaction_mutation()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'Ledger transactions are append-only; use correction or void.';
end;
$$;

create function public.reject_ledger_entry_mutation()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'Ledger entries are append-only; use a compensating entry.';
end;
$$;

create function public.reject_idempotency_receipt_mutation()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'Idempotency receipts are append-only.';
end;
$$;

create function public.reject_audit_event_mutation()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'Audit events are append-only.';
end;
$$;

create trigger wallets_no_financial_rewrite
  before update on public.wallets
  for each row execute function public.enforce_wallet_immutable_financial_fields();

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_row_updated_at();

create trigger wallets_touch_updated_at
  before update on public.wallets
  for each row execute function public.touch_row_updated_at();

create trigger ledger_transactions_same_owner_amendment
  before insert or update on public.ledger_transactions
  for each row execute function public.enforce_ledger_transaction_amendment_ownership();

create trigger ledger_transactions_append_only
  before update or delete on public.ledger_transactions
  for each row execute function public.reject_ledger_transaction_mutation();

create trigger ledger_entries_same_owner_currency
  before insert or update on public.ledger_entries
  for each row execute function public.enforce_ledger_entry_ownership();

create trigger ledger_entries_append_only
  before update or delete on public.ledger_entries
  for each row execute function public.reject_ledger_entry_mutation();

create trigger idempotency_receipts_append_only
  before update or delete on public.idempotency_receipts
  for each row execute function public.reject_idempotency_receipt_mutation();

create trigger audit_events_append_only
  before update or delete on public.audit_events
  for each row execute function public.reject_audit_event_mutation();

-- PUBLIC schema is exposed through the Supabase Data API. RLS plus explicit
-- object grants are both required; RLS alone is not an API access boundary.
alter table public.currencies enable row level security;
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.ledger_transactions enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.idempotency_receipts enable row level security;
alter table public.audit_events enable row level security;

create policy currencies_read_reference_data
  on public.currencies
  for select
  to anon, authenticated
  using (true);

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy wallets_select_own
  on public.wallets
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy wallets_insert_own
  on public.wallets
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
create policy wallets_update_own
  on public.wallets
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy ledger_transactions_select_own
  on public.ledger_transactions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy ledger_entries_select_own
  on public.ledger_entries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy idempotency_receipts_select_own
  on public.idempotency_receipts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
create policy audit_events_select_own
  on public.audit_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Explicit Data API grants. Do not grant any ledger/audit INSERT, UPDATE, or
-- DELETE privilege to anon/authenticated; Phase 3 will introduce reviewed,
-- private server-side functions for those write paths.
revoke all on table public.currencies from PUBLIC, anon, authenticated;
revoke all on table public.profiles from PUBLIC, anon, authenticated;
revoke all on table public.wallets from PUBLIC, anon, authenticated;
revoke all on table public.ledger_transactions from PUBLIC, anon, authenticated;
revoke all on table public.ledger_entries from PUBLIC, anon, authenticated;
revoke all on table public.idempotency_receipts from PUBLIC, anon, authenticated;
revoke all on table public.audit_events from PUBLIC, anon, authenticated;
revoke all on sequence public.audit_events_id_seq from PUBLIC, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on table public.currencies to anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.wallets to authenticated;
grant select on table public.ledger_transactions to authenticated;
grant select on table public.ledger_entries to authenticated;
grant select on table public.idempotency_receipts to authenticated;
grant select on table public.audit_events to authenticated;
grant usage on type public.locale_code, public.theme_preference, public.onboarding_status,
  public.wallet_type, public.wallet_lifecycle, public.ledger_transaction_type,
  public.ledger_transaction_status to authenticated;

revoke execute on function public.enforce_wallet_immutable_financial_fields() from PUBLIC, anon, authenticated;
revoke execute on function public.touch_row_updated_at() from PUBLIC, anon, authenticated;
revoke execute on function public.enforce_ledger_transaction_amendment_ownership() from PUBLIC, anon, authenticated;
revoke execute on function public.enforce_ledger_entry_ownership() from PUBLIC, anon, authenticated;
revoke execute on function public.reject_ledger_transaction_mutation() from PUBLIC, anon, authenticated;
revoke execute on function public.reject_ledger_entry_mutation() from PUBLIC, anon, authenticated;
revoke execute on function public.reject_idempotency_receipt_mutation() from PUBLIC, anon, authenticated;
revoke execute on function public.reject_audit_event_mutation() from PUBLIC, anon, authenticated;

commit;
