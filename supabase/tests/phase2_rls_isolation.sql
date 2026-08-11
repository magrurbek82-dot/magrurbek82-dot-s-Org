-- SmartWallet Phase 2 two-user RLS and append-only smoke test.
--
-- Preconditions:
--   1. Apply the Phase 2 migration to a disposable/dry-run TARGET only.
--   2. Create two real Supabase Auth users in that target project.
--   3. Replace the two UUID literals below with those Auth user IDs.
--   4. Run this as the SQL editor/database owner. It ends with ROLLBACK.
--
-- Do not run this on the legacy/source project. No source-project identifier,
-- URL, credential, or write path is used by this test.

begin;

-- Replace before running. They must be distinct ids present in auth.users.
select set_config('smartwallet.test.user_a', '00000000-0000-0000-0000-0000000000a1', true);
select set_config('smartwallet.test.user_b', '00000000-0000-0000-0000-0000000000b2', true);
select set_config('smartwallet.test.wallet_a', extensions.gen_random_uuid()::text, true);
select set_config('smartwallet.test.transaction_a', extensions.gen_random_uuid()::text, true);
select set_config('smartwallet.test.receipt_a', extensions.gen_random_uuid()::text, true);

-- User A can create and read only their own profile and wallet.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('smartwallet.test.user_a'), true);

insert into public.profiles (user_id, display_name, locale, timezone, base_currency_code)
values (
  current_setting('smartwallet.test.user_a')::uuid,
  'Phase 2 RLS test user A',
  'uz',
  'Asia/Tashkent',
  'UZS'
)
on conflict (user_id) do update
set display_name = excluded.display_name;

insert into public.wallets (
  id,
  user_id,
  wallet_type,
  name,
  currency_code,
  opening_balance_minor
)
values (
  current_setting('smartwallet.test.wallet_a')::uuid,
  current_setting('smartwallet.test.user_a')::uuid,
  'cash',
  'Phase 2 test cash wallet',
  'UZS',
  0
);

do $$
begin
  if not exists (
    select 1
    from public.wallets
    where id = current_setting('smartwallet.test.wallet_a')::uuid
      and user_id = current_setting('smartwallet.test.user_a')::uuid
  ) then
    raise exception 'User A cannot read their own wallet';
  end if;
end;
$$;

-- Normal preference updates must receive a server-controlled timestamp.
update public.profiles
set theme_preference = 'dark'
where user_id = current_setting('smartwallet.test.user_a')::uuid;

do $$
begin
  if not exists (
    select 1
    from public.profiles
    where user_id = current_setting('smartwallet.test.user_a')::uuid
      and updated_at > created_at
  ) then
    raise exception 'Profile updated_at was not advanced by its trigger';
  end if;
end;
$$;

-- User B must not see or mutate user A's rows.
select set_config('request.jwt.claim.sub', current_setting('smartwallet.test.user_b'), true);

do $$
begin
  if exists (
    select 1
    from public.profiles
    where user_id = current_setting('smartwallet.test.user_a')::uuid
  ) then
    raise exception 'RLS leak: user B can read user A profile';
  end if;

  if exists (
    select 1
    from public.wallets
    where id = current_setting('smartwallet.test.wallet_a')::uuid
  ) then
    raise exception 'RLS leak: user B can read user A wallet';
  end if;

  update public.wallets
  set name = 'This must not update'
  where id = current_setting('smartwallet.test.wallet_a')::uuid;

  if found then
    raise exception 'RLS leak: user B updated user A wallet';
  end if;
end;
$$;

-- Ledger writes are not available directly to authenticated Data API users.
do $$
begin
  begin
    insert into public.ledger_transactions (
      user_id,
      transaction_type,
      effective_at,
      client_request_id,
      payload_hash
    ) values (
      current_setting('smartwallet.test.user_b')::uuid,
      'income',
      now(),
      extensions.gen_random_uuid(),
      repeat('0', 64)
    );
    raise exception 'Direct authenticated ledger INSERT was unexpectedly allowed';
  exception
    when insufficient_privilege then
      null;
  end;
end;
$$;

-- Database owner fixture proves cross-owner/currency checks plus append-only
-- guards work even before Phase 3 introduces controlled write RPCs.
reset role;

insert into public.ledger_transactions (
  id,
  user_id,
  transaction_type,
  effective_at,
  client_request_id,
  payload_hash
)
values (
  current_setting('smartwallet.test.transaction_a')::uuid,
  current_setting('smartwallet.test.user_a')::uuid,
  'income',
  now(),
  extensions.gen_random_uuid(),
  repeat('1', 64)
);

insert into public.ledger_entries (
  user_id,
  transaction_id,
  wallet_id,
  currency_code,
  amount_minor
)
values (
  current_setting('smartwallet.test.user_a')::uuid,
  current_setting('smartwallet.test.transaction_a')::uuid,
  current_setting('smartwallet.test.wallet_a')::uuid,
  'UZS',
  100
);

insert into public.idempotency_receipts (
  id,
  user_id,
  operation,
  client_request_id,
  payload_hash,
  ledger_transaction_id
)
values (
  current_setting('smartwallet.test.receipt_a')::uuid,
  current_setting('smartwallet.test.user_a')::uuid,
  'ledger.test',
  extensions.gen_random_uuid(),
  repeat('2', 64),
  current_setting('smartwallet.test.transaction_a')::uuid
);

insert into public.audit_events (
  user_id,
  actor_user_id,
  event_type,
  entity_type,
  entity_id,
  related_transaction_id
)
values (
  current_setting('smartwallet.test.user_a')::uuid,
  current_setting('smartwallet.test.user_a')::uuid,
  'ledger.created',
  'ledger_transaction',
  current_setting('smartwallet.test.transaction_a')::uuid,
  current_setting('smartwallet.test.transaction_a')::uuid
);

do $$
begin
  begin
    update public.ledger_transactions
    set note = 'This must fail'
    where id = current_setting('smartwallet.test.transaction_a')::uuid;
    raise exception 'Ledger transaction mutation was unexpectedly allowed';
  exception
    when sqlstate '55000' then
      null;
  end;

  begin
    update public.ledger_entries
    set amount_minor = 999
    where transaction_id = current_setting('smartwallet.test.transaction_a')::uuid;
    raise exception 'Ledger entry mutation was unexpectedly allowed';
  exception
    when sqlstate '55000' then
      null;
  end;

  begin
    delete from public.idempotency_receipts
    where id = current_setting('smartwallet.test.receipt_a')::uuid;
    raise exception 'Idempotency receipt deletion was unexpectedly allowed';
  exception
    when sqlstate '55000' then
      null;
  end;
end;
$$;

-- A user can archive their own wallet, but archived history stays read-only.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('smartwallet.test.user_a'), true);

update public.wallets
set lifecycle = 'archived',
    archived_at = now(),
    archived_reason = 'Phase 2 RLS test'
where id = current_setting('smartwallet.test.wallet_a')::uuid;

do $$
begin
  if not exists (
    select 1
    from public.wallets
    where id = current_setting('smartwallet.test.wallet_a')::uuid
      and updated_at >= archived_at
  ) then
    raise exception 'Wallet updated_at was not advanced by its trigger';
  end if;

  begin
    update public.wallets
    set name = 'This must fail'
    where id = current_setting('smartwallet.test.wallet_a')::uuid;
    raise exception 'Archived wallet mutation was unexpectedly allowed';
  exception
    when sqlstate '55000' then
      null;
  end;
end;
$$;

rollback;
