-- SmartWallet Phase 2 schema test.
--
-- Run this after applying 20260811_01_phase2_financial_foundation.sql to a
-- disposable target/dry-run database. It intentionally performs only
-- structural, permission, and seed-data checks, then rolls back.
--
-- This script does not connect to, read from, or write to the legacy source
-- project. It is safe to use only against the fresh target project.

begin;

do $$
declare
  required_table text;
  required_tables text[] := array[
    'currencies',
    'profiles',
    'wallets',
    'ledger_transactions',
    'ledger_entries',
    'idempotency_receipts',
    'audit_events'
  ];
begin
  foreach required_table in array required_tables loop
    if not exists (
      select 1
      from pg_catalog.pg_class as c
      join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = required_table
        and c.relkind = 'r'
        and c.relrowsecurity
    ) then
      raise exception 'Phase 2 missing RLS-enabled table public.%', required_table;
    end if;
  end loop;

  if not exists (select 1 from public.currencies where code = 'UZS' and exponent = 2) then
    raise exception 'Expected ISO seed UZS exponent 2 is absent';
  end if;
  if not exists (select 1 from public.currencies where code = 'USD' and exponent = 2) then
    raise exception 'Expected ISO seed USD exponent 2 is absent';
  end if;
  if not exists (select 1 from public.currencies where code = 'EUR' and exponent = 2) then
    raise exception 'Expected ISO seed EUR exponent 2 is absent';
  end if;
  if not exists (select 1 from public.currencies where code = 'JPY' and exponent = 0) then
    raise exception 'Expected zero-decimal ISO seed JPY is absent';
  end if;
  if not exists (select 1 from public.currencies where code = 'BHD' and exponent = 3) then
    raise exception 'Expected three-decimal ISO seed BHD is absent';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and policyname = any (array[
        'profiles_select_own',
        'profiles_insert_own',
        'profiles_update_own',
        'wallets_select_own',
        'wallets_insert_own',
        'wallets_update_own',
        'ledger_transactions_select_own',
        'ledger_entries_select_own',
        'idempotency_receipts_select_own',
        'audit_events_select_own'
      ])
  ) <> 10 then
    raise exception 'One or more expected owner RLS policies are missing';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('profiles', 'wallets', 'ledger_transactions', 'ledger_entries', 'idempotency_receipts', 'audit_events')
      and column_name in ('monthly_income_minor', 'opening_balance_minor', 'amount_minor')
      and data_type in ('numeric', 'real', 'double precision', 'money')
  ) then
    raise exception 'Money columns must use integer minor units, not floating-point/decimal types';
  end if;

  if (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and (
        (table_name = 'profiles' and column_name = 'monthly_income_minor' and data_type = 'bigint')
        or (table_name = 'wallets' and column_name = 'opening_balance_minor' and data_type = 'bigint')
        or (table_name = 'ledger_entries' and column_name = 'amount_minor' and data_type = 'bigint')
      )
  ) <> 3 then
    raise exception 'Expected BIGINT minor-unit columns are missing or typed incorrectly';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'idempotency_receipts_user_id_operation_client_request_id_key'
  ) then
    raise exception 'Missing idempotency unique constraint';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc as p
    join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'enforce_wallet_immutable_financial_fields',
        'touch_row_updated_at',
        'enforce_ledger_transaction_amendment_ownership',
        'enforce_ledger_entry_ownership',
        'reject_ledger_transaction_mutation',
        'reject_ledger_entry_mutation',
        'reject_idempotency_receipt_mutation',
        'reject_audit_event_mutation'
      )
      and p.prosecdef
  ) then
    raise exception 'Phase 2 invariant triggers must not use SECURITY DEFINER';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger
    where tgname = 'ledger_transactions_append_only'
      and not tgisinternal
  ) or not exists (
    select 1
    from pg_catalog.pg_trigger
    where tgname = 'ledger_entries_append_only'
      and not tgisinternal
  ) then
    raise exception 'Append-only ledger triggers are missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger
    where tgname = 'profiles_touch_updated_at'
      and not tgisinternal
  ) or not exists (
    select 1
    from pg_catalog.pg_trigger
    where tgname = 'wallets_touch_updated_at'
      and not tgisinternal
  ) then
    raise exception 'Expected updated_at triggers are missing';
  end if;

  if has_table_privilege('anon', 'public.ledger_transactions', 'insert')
    or has_table_privilege('authenticated', 'public.ledger_transactions', 'insert')
    or has_table_privilege('authenticated', 'public.ledger_entries', 'insert')
    or has_table_privilege('authenticated', 'public.idempotency_receipts', 'insert')
    or has_table_privilege('authenticated', 'public.audit_events', 'insert') then
    raise exception 'Direct Data API ledger/audit writes must not be granted';
  end if;

  if has_function_privilege('anon', 'public.touch_row_updated_at()', 'execute')
    or has_function_privilege('authenticated', 'public.touch_row_updated_at()', 'execute')
    or has_function_privilege('authenticated', 'public.reject_ledger_entry_mutation()', 'execute') then
    raise exception 'Trigger-only functions must not be callable through the Data API';
  end if;

  if not has_table_privilege('authenticated', 'public.ledger_transactions', 'select')
    or not has_table_privilege('authenticated', 'public.ledger_entries', 'select') then
    raise exception 'Authenticated owner read grants are missing';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and policyname in (
        'profiles_select_own',
        'profiles_insert_own',
        'profiles_update_own',
        'wallets_select_own',
        'wallets_insert_own',
        'wallets_update_own',
        'ledger_transactions_select_own',
        'ledger_entries_select_own',
        'idempotency_receipts_select_own',
        'audit_events_select_own'
      )
      and roles <> array['authenticated']::name[]
  ) then
    raise exception 'An owner policy has an unexpected role target';
  end if;
end;
$$;

-- Manual RLS smoke test (requires two pre-created auth users and one wallet
-- owned by user A). Run the following separately after substituting IDs:
--
-- begin;
-- set local role authenticated;
-- select set_config('request.jwt.claim.sub', '<USER_A_UUID>', true);
-- select count(*) from public.wallets where user_id = '<USER_A_UUID>'::uuid;
-- select set_config('request.jwt.claim.sub', '<USER_B_UUID>', true);
-- select count(*) from public.wallets where user_id = '<USER_A_UUID>'::uuid;
-- -- Expected: 0 for user B. Do the equivalent for profiles, ledger tables,
-- -- idempotency_receipts, and audit_events.
-- rollback;
--
-- Run the dedicated Phase 3 operation test only after Phase 3 private write
-- RPCs exist; this Phase 2 file does not add public ledger write APIs.

rollback;
