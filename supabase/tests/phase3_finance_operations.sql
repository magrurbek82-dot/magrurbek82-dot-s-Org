-- SmartWallet Phase 3: controlled finance-operation verification.
--
-- Run only after Phase 2 and 20260811_02_phase3_finance_operations.sql on a
-- disposable fresh TARGET project. This script ends with ROLLBACK and never
-- contacts or imports the legacy/source project.
--
-- Prerequisites:
--   1. Replace USER_A and USER_B below with two distinct, already-created
--      Supabase Auth user IDs from the disposable target.
--   2. Run as the SQL editor/database owner; the script changes to the
--      authenticated role for owner-bound RPC tests.
--   3. Keep the generated fixture data inside this transaction only.

begin;

-- Replace these two values before executing. They must exist in auth.users.
select set_config('smartwallet.phase3.user_a', 'USER_A', true);
select set_config('smartwallet.phase3.user_b', 'USER_B', true);

do $$
declare
  v_required_function text;
  v_required_functions text[] := array[
    'record_income',
    'record_expense',
    'record_transfer',
    'void_financial_transaction',
    'correct_financial_transaction',
    'get_wallet_balance',
    'get_wallet_balances',
    'get_total_balance_by_currency',
    'get_period_financial_aggregates',
    'get_category_expense_aggregates'
  ];
begin
  if current_setting('smartwallet.phase3.user_a') = 'USER_A'
    or current_setting('smartwallet.phase3.user_b') = 'USER_B' then
    raise exception 'Replace USER_A and USER_B with real disposable-target Auth IDs before running this test';
  end if;

  if current_setting('smartwallet.phase3.user_a')::uuid
    = current_setting('smartwallet.phase3.user_b')::uuid then
    raise exception 'Phase 3 test users must be distinct';
  end if;

  if not exists (
    select 1 from auth.users where id = current_setting('smartwallet.phase3.user_a')::uuid
  ) or not exists (
    select 1 from auth.users where id = current_setting('smartwallet.phase3.user_b')::uuid
  ) then
    raise exception 'Phase 3 test users must exist in auth.users on the disposable target';
  end if;

  foreach v_required_function in array v_required_functions loop
    if not exists (
      select 1
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = v_required_function
    ) then
      raise exception 'Expected Phase 3 public RPC public.% is missing', v_required_function;
    end if;
  end loop;

  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'idempotency_receipts_user_id_client_request_id_key'
  ) then
    raise exception 'Missing user-bound idempotency uniqueness constraint';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'ledger_transactions_one_reversal_per_original_idx'
  ) then
    raise exception 'Missing single reversal-flow index';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname in ('execute_finance_operation', 'post_standard_operation', 'reverse_transaction')
      and not p.prosecdef
  ) then
    raise exception 'Controlled ledger writers must use the reviewed SECURITY DEFINER boundary';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.prosecdef
      and (p.proconfig is null or array_to_string(p.proconfig, ',') not like '%search_path=%')
  ) then
    raise exception 'Every private SECURITY DEFINER function must pin search_path';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'record_income',
        'record_expense',
        'record_transfer',
        'void_financial_transaction',
        'correct_financial_transaction'
      )
      and (not p.prosecdef or p.proconfig is null or array_to_string(p.proconfig, ',') not like '%search_path=%')
  ) then
    raise exception 'Every public financial write RPC must use a fixed SECURITY DEFINER boundary';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'get_wallet_balance',
        'get_wallet_balances',
        'get_total_balance_by_currency',
        'get_period_financial_aggregates',
        'get_category_expense_aggregates'
      )
      and p.prosecdef
  ) then
    raise exception 'Deterministic financial read RPCs must remain SECURITY INVOKER';
  end if;

  if has_table_privilege('authenticated', 'public.ledger_transactions', 'insert')
    or has_table_privilege('authenticated', 'public.ledger_entries', 'insert')
    or has_table_privilege('authenticated', 'public.idempotency_receipts', 'insert')
    or has_table_privilege('authenticated', 'public.audit_events', 'insert') then
    raise exception 'Authenticated clients must not have direct financial write grants';
  end if;

  if has_function_privilege(
    'authenticated',
    'private.execute_finance_operation(text,jsonb,uuid)',
    'execute'
  ) then
    raise exception 'Authenticated clients must not execute the private financial write engine';
  end if;
end;
$$;

select set_config('smartwallet.phase3.wallet_cash', gen_random_uuid()::text, true);
select set_config('smartwallet.phase3.wallet_savings', gen_random_uuid()::text, true);
select set_config('smartwallet.phase3.wallet_usd', gen_random_uuid()::text, true);
select set_config('smartwallet.phase3.request_income', gen_random_uuid()::text, true);
select set_config('smartwallet.phase3.request_expense', gen_random_uuid()::text, true);
select set_config('smartwallet.phase3.request_transfer', gen_random_uuid()::text, true);
select set_config('smartwallet.phase3.request_fx_transfer', gen_random_uuid()::text, true);
select set_config('smartwallet.phase3.request_void', gen_random_uuid()::text, true);
select set_config('smartwallet.phase3.request_correction', gen_random_uuid()::text, true);
select set_config('smartwallet.phase3.request_cross_user', gen_random_uuid()::text, true);

-- User A creates only their own manual wallets through ordinary, owner-RLS
-- protected wallet setup. No ledger rows are inserted directly in this test.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('smartwallet.phase3.user_a'), true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.wallets (id, user_id, wallet_type, name, currency_code, opening_balance_minor)
values
  (
    current_setting('smartwallet.phase3.wallet_cash')::uuid,
    current_setting('smartwallet.phase3.user_a')::uuid,
    'cash',
    'Phase 3 cash fixture',
    'UZS',
    0
  ),
  (
    current_setting('smartwallet.phase3.wallet_savings')::uuid,
    current_setting('smartwallet.phase3.user_a')::uuid,
    'savings',
    'Phase 3 savings fixture',
    'UZS',
    0
  ),
  (
    current_setting('smartwallet.phase3.wallet_usd')::uuid,
    current_setting('smartwallet.phase3.user_a')::uuid,
    'manual_account',
    'Phase 3 USD fixture',
    'USD',
    0
  );

do $$
declare
  v_income jsonb;
  v_income_retry jsonb;
  v_expense jsonb;
  v_void jsonb;
  v_correction jsonb;
  v_income_transaction_id uuid;
  v_expense_transaction_id uuid;
  v_income_minor bigint;
  v_expense_minor bigint;
  v_net_minor bigint;
  v_replacement_transaction_id uuid;
  v_effective_at timestamptz := now();
begin
  -- A first post succeeds. The identical retry returns the same transaction and
  -- must not add another ledger entry.
  v_income := public.record_income(
    current_setting('smartwallet.phase3.wallet_cash')::uuid,
    2000000,
    'UZS',
    'salary',
    v_effective_at,
    'Phase 3 income',
    current_setting('smartwallet.phase3.request_income')::uuid
  );
  v_income_retry := public.record_income(
    current_setting('smartwallet.phase3.wallet_cash')::uuid,
    2000000,
    'UZS',
    'salary',
    v_effective_at,
    'Phase 3 income',
    current_setting('smartwallet.phase3.request_income')::uuid
  );

  if (v_income ->> 'replayed')::boolean
    or not (v_income_retry ->> 'replayed')::boolean
    or v_income ->> 'transaction_id' <> v_income_retry ->> 'transaction_id' then
    raise exception 'Idempotent income retry did not return exactly the original transaction';
  end if;

  v_income_transaction_id := (v_income ->> 'transaction_id')::uuid;

  -- Reusing a request ID with altered intent must fail safely, rather than
  -- posting another transaction or returning the wrong receipt.
  begin
    perform public.record_income(
      current_setting('smartwallet.phase3.wallet_cash')::uuid,
      1999999,
      'UZS',
      'salary',
      now(),
      'Different payload',
      current_setting('smartwallet.phase3.request_income')::uuid
    );
    raise exception 'Changed idempotency payload unexpectedly succeeded';
  exception
    when sqlstate '22023' then null;
  end;

  v_expense := public.record_expense(
    current_setting('smartwallet.phase3.wallet_cash')::uuid,
    300000,
    'UZS',
    'groceries',
    now(),
    'Phase 3 expense',
    current_setting('smartwallet.phase3.request_expense')::uuid
  );
  v_expense_transaction_id := (v_expense ->> 'transaction_id')::uuid;

  perform public.record_transfer(
    current_setting('smartwallet.phase3.wallet_cash')::uuid,
    current_setting('smartwallet.phase3.wallet_savings')::uuid,
    100000,
    100000,
    'UZS',
    'UZS',
    now(),
    'Same-currency transfer',
    null,
    null,
    null,
    current_setting('smartwallet.phase3.request_transfer')::uuid
  );

  -- rate is USD major units per UZS major unit. With both currencies using two
  -- minor digits, 1,000,000 UZS minor * .00008 equals 80 USD minor.
  perform public.record_transfer(
    current_setting('smartwallet.phase3.wallet_cash')::uuid,
    current_setting('smartwallet.phase3.wallet_usd')::uuid,
    1000000,
    80,
    'UZS',
    'USD',
    now(),
    'Cross-currency transfer',
    0.00008,
    'phase3-fixture',
    now(),
    current_setting('smartwallet.phase3.request_fx_transfer')::uuid
  );

  v_void := public.void_financial_transaction(
    v_expense_transaction_id,
    'Phase 3 test void',
    current_setting('smartwallet.phase3.request_void')::uuid
  );

  if (v_void ->> 'replayed')::boolean then
    raise exception 'Initial void was incorrectly marked as replayed';
  end if;

  v_correction := public.correct_financial_transaction(
    v_income_transaction_id,
    'income',
    jsonb_build_object(
      'wallet_id', current_setting('smartwallet.phase3.wallet_cash'),
      'amount_minor', '2200000',
      'currency_code', 'UZS',
      'category_key', 'salary',
      'effective_at', now(),
      'note', 'Corrected Phase 3 income'
    ),
    'Phase 3 test correction',
    current_setting('smartwallet.phase3.request_correction')::uuid
  );

  if (v_correction ->> 'replayed')::boolean then
    raise exception 'Initial correction was incorrectly marked as replayed';
  end if;

  v_replacement_transaction_id := (v_correction ->> 'transaction_id')::uuid;

  if not exists (
    select 1
    from public.ledger_transactions t
    where t.id = v_replacement_transaction_id
      and t.transaction_type = 'income'
      and t.amends_transaction_id is null
      and t.amendment_reason is null
      and t.metadata ? 'correction'
  ) then
    raise exception 'Correction replacement violated the Phase 2 amendment shape contract';
  end if;

  select income_minor, expense_minor, net_minor
    into v_income_minor, v_expense_minor, v_net_minor
  from public.get_period_financial_aggregates(
    now() - interval '1 day',
    now() + interval '1 day',
    null
  )
  where currency_code = 'UZS';

  if v_income_minor <> 2200000 or v_expense_minor <> 0 or v_net_minor <> 2200000 then
    raise exception 'Deterministic UZS aggregate mismatch: income %, expense %, net %',
      v_income_minor, v_expense_minor, v_net_minor;
  end if;

  if public.get_wallet_balance(current_setting('smartwallet.phase3.wallet_cash')::uuid) <> 1100000 then
    raise exception 'Cash balance did not deterministically reconcile';
  end if;
  if public.get_wallet_balance(current_setting('smartwallet.phase3.wallet_savings')::uuid) <> 100000 then
    raise exception 'Savings balance did not deterministically reconcile';
  end if;
  if public.get_wallet_balance(current_setting('smartwallet.phase3.wallet_usd')::uuid) <> 80 then
    raise exception 'Cross-currency destination balance did not reconcile';
  end if;

  if not exists (
    select 1
    from public.get_total_balance_by_currency(false) b
    where b.currency_code = 'UZS'
      and b.balance_minor = 1200000
  ) or not exists (
    select 1
    from public.get_total_balance_by_currency(false) b
    where b.currency_code = 'USD'
      and b.balance_minor = 80
  ) then
    raise exception 'Currency-separated total balances did not reconcile';
  end if;

  if not exists (
    select 1
    from public.get_category_expense_aggregates(
      now() - interval '1 day',
      now() + interval '1 day',
      null
    ) c
    where c.category_key = 'groceries'
      and c.currency_code = 'UZS'
      and c.expense_minor = 0
  ) then
    raise exception 'Voided expense was not deterministically neutralized in category aggregates';
  end if;

  if (
    select count(*)
    from public.ledger_entries
    where transaction_id = v_income_transaction_id
  ) <> 1 then
    raise exception 'Income idempotency retry created duplicate ledger entries';
  end if;
end;
$$;

-- User B cannot use user A's wallet or read its deterministic balance through
-- either the public RPC surface or direct owner-scoped SELECT.
select set_config('request.jwt.claim.sub', current_setting('smartwallet.phase3.user_b'), true);

do $$
begin
  begin
    perform public.record_income(
      current_setting('smartwallet.phase3.wallet_cash')::uuid,
      1,
      'UZS',
      'salary',
      now(),
      'Cross-user attempt',
      current_setting('smartwallet.phase3.request_cross_user')::uuid
    );
    raise exception 'Cross-user financial operation unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.get_wallet_balance(current_setting('smartwallet.phase3.wallet_cash')::uuid);
    raise exception 'Cross-user balance read unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  if exists (
    select 1
    from public.ledger_transactions
    where user_id = current_setting('smartwallet.phase3.user_a')::uuid
  ) then
    raise exception 'RLS leak: user B can read user A ledger rows';
  end if;

  begin
    insert into public.ledger_transactions (
      user_id, transaction_type, effective_at, client_request_id, payload_hash
    ) values (
      current_setting('smartwallet.phase3.user_b')::uuid,
      'income',
      now(),
      current_setting('smartwallet.phase3.request_cross_user')::uuid,
      repeat('0', 64)
    );
    raise exception 'Direct authenticated ledger write unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

-- Database-owner fixture confirms that Phase 2 append-only protections still
-- reject a physical ledger mutation after the Phase 3 RPCs have posted rows.
reset role;

do $$
declare
  v_any_entry_id uuid;
begin
  select e.id
    into v_any_entry_id
  from public.ledger_entries e
  where e.user_id = current_setting('smartwallet.phase3.user_a')::uuid
  limit 1;

  begin
    update public.ledger_entries
    set amount_minor = amount_minor + 1
    where id = v_any_entry_id;
    raise exception 'Append-only ledger entry mutation unexpectedly succeeded';
  exception
    when sqlstate '55000' then null;
  end;
end;
$$;

rollback;
