-- SmartWallet V1 / Phase 3
-- Atomic finance operations, append-only recovery flows, and deterministic reads.
--
-- Dependency contract (created by Phase 2):
--   public.currencies, public.wallets, public.ledger_transactions,
--   public.ledger_entries, public.idempotency_receipts, public.audit_events.
--
-- This migration deliberately does not update or delete ledger rows.  A correction
-- or void creates an additional transaction with signed reversal entries instead.
-- The target project is fresh; this file is reviewed/dry-run only and is not an
-- instruction to apply anything to the legacy/source Supabase project.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- SHA-256 makes a user-bound idempotency receipt attest to the exact canonical
-- operation payload.  Do not pin extension versions: Supabase manages them.
create extension if not exists pgcrypto with schema extensions;

-- Phase 2 already has the operation-scoped unique key.  This stronger key means
-- one request UUID cannot be reused by the same user for a different operation.
alter table public.idempotency_receipts
  add constraint idempotency_receipts_user_id_client_request_id_key
  unique (user_id, client_request_id);

-- An original transaction may have exactly one append-only reversal flow.  A
-- correction creates a correction reversal plus a normal replacement transaction;
-- a void creates only the reversal transaction.
create unique index if not exists ledger_transactions_one_reversal_per_original_idx
  on public.ledger_transactions (user_id, amends_transaction_id)
  where transaction_type in ('correction', 'void');

create or replace function private.require_authenticated_user()
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required for a financial operation';
  end if;

  return v_user_id;
end;
$$;

create or replace function private.require_json_object(p_payload jsonb)
returns void
language plpgsql
immutable
security invoker
set search_path = ''
as $$
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception using
      errcode = '22023',
      message = 'Operation payload must be a JSON object';
  end if;
end;
$$;

create or replace function private.require_uuid(p_payload jsonb, p_key text)
returns uuid
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_raw text;
begin
  perform private.require_json_object(p_payload);
  v_raw := nullif(btrim(p_payload ->> p_key), '');

  if v_raw is null then
    raise exception using
      errcode = '22023',
      message = format('%s is required', p_key);
  end if;

  begin
    return v_raw::uuid;
  exception
    when invalid_text_representation then
      raise exception using
        errcode = '22023',
        message = format('%s must be a UUID', p_key);
  end;
end;
$$;

create or replace function private.require_positive_minor(p_payload jsonb, p_key text)
returns bigint
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_raw text;
  v_value bigint;
begin
  perform private.require_json_object(p_payload);
  v_raw := nullif(btrim(p_payload ->> p_key), '');

  if v_raw is null or v_raw !~ '^[0-9]+$' then
    raise exception using
      errcode = '22023',
      message = format('%s must be a positive integer minor-unit amount', p_key);
  end if;

  if char_length(v_raw) > 19 then
    raise exception using
      errcode = '22003',
      message = format('%s exceeds the supported money range', p_key);
  end if;

  begin
    v_value := v_raw::bigint;
  exception
    when numeric_value_out_of_range then
      raise exception using
        errcode = '22003',
        message = format('%s exceeds the supported money range', p_key);
  end;

  if v_value <= 0 then
    raise exception using
      errcode = '22023',
      message = format('%s must be greater than zero', p_key);
  end if;

  return v_value;
end;
$$;

create or replace function private.require_positive_numeric(p_payload jsonb, p_key text)
returns numeric
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_raw text;
  v_value numeric;
begin
  perform private.require_json_object(p_payload);
  v_raw := nullif(btrim(p_payload ->> p_key), '');

  if v_raw is null or v_raw !~ '^[0-9]+(\.[0-9]+)?$' then
    raise exception using
      errcode = '22023',
      message = format('%s must be a positive decimal value', p_key);
  end if;

  if char_length(v_raw) > 64 then
    raise exception using
      errcode = '22003',
      message = format('%s exceeds the supported rate range', p_key);
  end if;

  begin
    v_value := v_raw::numeric;
  exception
    when numeric_value_out_of_range then
      raise exception using
        errcode = '22003',
        message = format('%s exceeds the supported rate range', p_key);
  end;

  if v_value <= 0 then
    raise exception using
      errcode = '22023',
      message = format('%s must be greater than zero', p_key);
  end if;

  return v_value;
end;
$$;

create or replace function private.require_currency_code(p_payload jsonb, p_key text)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_currency text;
begin
  perform private.require_json_object(p_payload);
  v_currency := upper(nullif(btrim(p_payload ->> p_key), ''));

  if v_currency is null or v_currency !~ '^[A-Z]{3}$' then
    raise exception using
      errcode = '22023',
      message = format('%s must be a three-letter ISO currency code', p_key);
  end if;

  return v_currency;
end;
$$;

create or replace function private.require_effective_at(p_payload jsonb, p_key text)
returns timestamptz
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_raw text;
  v_value timestamptz;
begin
  perform private.require_json_object(p_payload);
  v_raw := nullif(btrim(p_payload ->> p_key), '');

  if v_raw is null then
    raise exception using
      errcode = '22023',
      message = format('%s is required', p_key);
  end if;

  begin
    v_value := v_raw::timestamptz;
  exception
    when invalid_datetime_format or datetime_field_overflow then
      raise exception using
        errcode = '22007',
        message = format('%s must be a valid ISO timestamp', p_key);
  end;

  if v_value < '2000-01-01 00:00:00+00'::timestamptz
    or v_value > now() + interval '5 minutes' then
    raise exception using
      errcode = '22023',
      message = format('%s is outside the permitted ledger time range', p_key);
  end if;

  return v_value;
end;
$$;

create or replace function private.optional_text(
  p_payload jsonb,
  p_key text,
  p_max_length integer
)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_value text;
begin
  perform private.require_json_object(p_payload);
  v_value := nullif(btrim(p_payload ->> p_key), '');

  if v_value is not null and char_length(v_value) > p_max_length then
    raise exception using
      errcode = '22001',
      message = format('%s exceeds the maximum length', p_key);
  end if;

  return v_value;
end;
$$;

create or replace function private.require_text(
  p_payload jsonb,
  p_key text,
  p_max_length integer
)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_value text;
begin
  v_value := private.optional_text(p_payload, p_key, p_max_length);

  if v_value is null then
    raise exception using
      errcode = '22023',
      message = format('%s is required', p_key);
  end if;

  return v_value;
end;
$$;

create or replace function private.require_category_key(p_payload jsonb)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_category text := lower(private.require_text(p_payload, 'category_key', 64));
begin
  if v_category !~ '^[a-z0-9][a-z0-9._-]{0,63}$' then
    raise exception using
      errcode = '22023',
      message = 'category_key must be a stable lowercase identifier';
  end if;

  return v_category;
end;
$$;

create or replace function private.require_reason(p_payload jsonb)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
begin
  return private.require_text(p_payload, 'reason', 500);
end;
$$;

create or replace function private.request_payload_hash(
  p_operation text,
  p_payload jsonb
)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select encode(
    extensions.digest(
      jsonb_build_object(
        'operation', lower(btrim(p_operation)),
        'payload', p_payload
      )::text,
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function private.lock_active_wallet(
  p_user_id uuid,
  p_wallet_id uuid
)
returns public.wallets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wallet public.wallets%rowtype;
begin
  select w.*
    into v_wallet
  from public.wallets w
  where w.id = p_wallet_id
    and w.user_id = p_user_id
    and w.lifecycle = 'active'::public.wallet_lifecycle
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'Wallet is unavailable, archived, or belongs to another user';
  end if;

  return v_wallet;
end;
$$;

create or replace function private.create_ledger_transaction(
  p_user_id uuid,
  p_transaction_type public.ledger_transaction_type,
  p_effective_at timestamptz,
  p_category_key text,
  p_note text,
  p_client_request_id uuid,
  p_payload_hash text,
  p_amends_transaction_id uuid,
  p_amendment_reason text,
  p_metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_transaction_id uuid;
begin
  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then
    raise exception using
      errcode = '22023',
      message = 'Ledger metadata must be a JSON object';
  end if;

  insert into public.ledger_transactions (
    user_id,
    transaction_type,
    status,
    effective_at,
    category_key,
    note,
    client_request_id,
    payload_hash,
    amends_transaction_id,
    amendment_reason,
    metadata
  )
  values (
    p_user_id,
    p_transaction_type,
    'posted'::public.ledger_transaction_status,
    p_effective_at,
    p_category_key,
    p_note,
    p_client_request_id,
    p_payload_hash,
    p_amends_transaction_id,
    p_amendment_reason,
    p_metadata
  )
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

create or replace function private.append_ledger_entry(
  p_user_id uuid,
  p_transaction_id uuid,
  p_wallet_id uuid,
  p_currency_code text,
  p_amount_minor bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_amount_minor = 0 then
    raise exception using
      errcode = '22023',
      message = 'Ledger entries must have a non-zero signed amount';
  end if;

  insert into public.ledger_entries (
    user_id,
    transaction_id,
    wallet_id,
    currency_code,
    amount_minor
  )
  values (
    p_user_id,
    p_transaction_id,
    p_wallet_id,
    p_currency_code,
    p_amount_minor
  );
end;
$$;

create or replace function private.add_audit_event(
  p_user_id uuid,
  p_event_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_request_id uuid,
  p_related_transaction_id uuid,
  p_reason text,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_metadata is not null and jsonb_typeof(p_metadata) <> 'object' then
    raise exception using
      errcode = '22023',
      message = 'Audit metadata must be a JSON object';
  end if;

  insert into public.audit_events (
    user_id,
    actor_user_id,
    event_type,
    entity_type,
    entity_id,
    request_id,
    related_transaction_id,
    reason,
    metadata
  )
  values (
    p_user_id,
    p_user_id,
    p_event_type,
    p_entity_type,
    p_entity_id,
    p_request_id,
    p_related_transaction_id,
    p_reason,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function private.post_standard_operation(
  p_user_id uuid,
  p_operation text,
  p_payload jsonb,
  p_client_request_id uuid,
  p_payload_hash text,
  p_amends_transaction_id uuid default null,
  p_amendment_reason text default null,
  p_context jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_operation text := lower(btrim(p_operation));
  v_effective_at timestamptz;
  v_note text;
  v_category_key text;
  v_wallet public.wallets%rowtype;
  v_source_wallet public.wallets%rowtype;
  v_destination_wallet public.wallets%rowtype;
  v_wallet_id uuid;
  v_source_wallet_id uuid;
  v_destination_wallet_id uuid;
  v_amount_minor bigint;
  v_source_amount_minor bigint;
  v_destination_amount_minor bigint;
  v_currency_code text;
  v_source_currency_code text;
  v_destination_currency_code text;
  v_transaction_id uuid;
  v_metadata jsonb;
  v_rate numeric;
  v_rate_source text;
  v_rate_observed_at timestamptz;
  v_source_exponent smallint;
  v_destination_exponent smallint;
  v_expected_destination_minor numeric;
  v_audit_event_type text;
  v_audit_related_transaction_id uuid;
begin
  perform private.require_json_object(p_payload);

  if p_context is null or jsonb_typeof(p_context) <> 'object' then
    raise exception using
      errcode = '22023',
      message = 'Operation context must be a JSON object';
  end if;

  if v_operation not in ('income', 'expense', 'transfer') then
    raise exception using
      errcode = '22023',
      message = 'Only income, expense, and transfer are valid standard operations';
  end if;

  -- The Phase 2 amendment shape constraint reserves relational amendment links
  -- for the compensating correction/void row.  A corrected replacement keeps
  -- its provenance in immutable metadata instead of pretending to be an
  -- amendment row itself.
  if p_amends_transaction_id is not null or p_amendment_reason is not null then
    raise exception using
      errcode = '22023',
      message = 'Standard ledger transactions cannot carry direct amendment fields';
  end if;

  if p_context ? 'correction' then
    begin
      v_audit_related_transaction_id := nullif(
        p_context #>> '{correction,original_transaction_id}',
        ''
      )::uuid;
    exception
      when invalid_text_representation then
        raise exception using
          errcode = '22023',
          message = 'Correction context must contain a valid original transaction UUID';
    end;

    if v_audit_related_transaction_id is null then
      raise exception using
        errcode = '22023',
        message = 'Correction context must contain an original transaction UUID';
    end if;
  end if;

  v_effective_at := private.require_effective_at(p_payload, 'effective_at');
  v_note := private.optional_text(p_payload, 'note', 2000);

  if v_operation in ('income', 'expense') then
    v_wallet_id := private.require_uuid(p_payload, 'wallet_id');
    v_amount_minor := private.require_positive_minor(p_payload, 'amount_minor');
    v_currency_code := private.require_currency_code(p_payload, 'currency_code');
    v_category_key := private.require_category_key(p_payload);
    v_wallet := private.lock_active_wallet(p_user_id, v_wallet_id);

    if v_wallet.currency_code <> v_currency_code then
      raise exception using
        errcode = '22023',
        message = 'Submitted currency does not match the wallet currency';
    end if;

    v_metadata := p_context || jsonb_build_object('operation', v_operation);
    v_transaction_id := private.create_ledger_transaction(
      p_user_id,
      v_operation::public.ledger_transaction_type,
      v_effective_at,
      v_category_key,
      v_note,
      p_client_request_id,
      p_payload_hash,
      p_amends_transaction_id,
      p_amendment_reason,
      v_metadata
    );

    perform private.append_ledger_entry(
      p_user_id,
      v_transaction_id,
      v_wallet.id,
      v_wallet.currency_code,
      case when v_operation = 'income' then v_amount_minor else -v_amount_minor end
    );

    if p_context ? 'correction' then
      v_audit_event_type := 'ledger.transaction.replacement_posted';
    else
      v_audit_event_type := 'ledger.transaction.posted';
    end if;

    perform private.add_audit_event(
      p_user_id,
      v_audit_event_type,
      'ledger_transaction',
      v_transaction_id,
      p_client_request_id,
      v_audit_related_transaction_id,
      null,
      jsonb_build_object(
        'operation', v_operation,
        'wallet_id', v_wallet.id::text,
        'currency_code', v_wallet.currency_code::text
      )
    );

    return v_transaction_id;
  end if;

  v_source_wallet_id := private.require_uuid(p_payload, 'source_wallet_id');
  v_destination_wallet_id := private.require_uuid(p_payload, 'destination_wallet_id');

  if v_source_wallet_id = v_destination_wallet_id then
    raise exception using
      errcode = '22023',
      message = 'Transfer source and destination wallets must be different';
  end if;

  -- Always lock transfer wallets in UUID order.  This avoids an A->B and B->A
  -- pair of submissions taking locks in opposite orders.
  if v_source_wallet_id < v_destination_wallet_id then
    v_source_wallet := private.lock_active_wallet(p_user_id, v_source_wallet_id);
    v_destination_wallet := private.lock_active_wallet(p_user_id, v_destination_wallet_id);
  else
    v_destination_wallet := private.lock_active_wallet(p_user_id, v_destination_wallet_id);
    v_source_wallet := private.lock_active_wallet(p_user_id, v_source_wallet_id);
  end if;

  v_source_amount_minor := private.require_positive_minor(p_payload, 'source_amount_minor');
  v_destination_amount_minor := private.require_positive_minor(p_payload, 'destination_amount_minor');
  v_source_currency_code := private.require_currency_code(p_payload, 'source_currency_code');
  v_destination_currency_code := private.require_currency_code(p_payload, 'destination_currency_code');

  if v_source_wallet.currency_code <> v_source_currency_code
    or v_destination_wallet.currency_code <> v_destination_currency_code then
    raise exception using
      errcode = '22023',
      message = 'Submitted transfer currency does not match a wallet currency';
  end if;

  if v_source_wallet.currency_code = v_destination_wallet.currency_code then
    if v_source_amount_minor <> v_destination_amount_minor then
      raise exception using
        errcode = '22023',
        message = 'Same-currency transfers must use the same source and destination amount';
    end if;

    if (p_payload ? 'exchange_rate' and p_payload ->> 'exchange_rate' is not null)
      or (p_payload ? 'rate_source' and p_payload ->> 'rate_source' is not null)
      or (p_payload ? 'rate_observed_at' and p_payload ->> 'rate_observed_at' is not null) then
      raise exception using
        errcode = '22023',
        message = 'Same-currency transfers must not include an exchange-rate snapshot';
    end if;

    v_metadata := p_context || jsonb_build_object(
      'operation', 'transfer',
      'transfer', jsonb_build_object(
        'source_wallet_id', v_source_wallet.id::text,
        'destination_wallet_id', v_destination_wallet.id::text,
        'source_currency_code', v_source_wallet.currency_code::text,
        'destination_currency_code', v_destination_wallet.currency_code::text,
        'source_amount_minor', v_source_amount_minor::text,
        'destination_amount_minor', v_destination_amount_minor::text
      )
    );
  else
    v_rate := private.require_positive_numeric(p_payload, 'exchange_rate');
    v_rate_source := private.require_text(p_payload, 'rate_source', 128);
    v_rate_observed_at := private.require_effective_at(p_payload, 'rate_observed_at');

    select c.exponent
      into v_source_exponent
    from public.currencies c
    where c.code = v_source_wallet.currency_code;

    select c.exponent
      into v_destination_exponent
    from public.currencies c
    where c.code = v_destination_wallet.currency_code;

    if v_source_exponent is null or v_destination_exponent is null then
      raise exception using
        errcode = '22023',
        message = 'Transfer currency exponent is unavailable';
    end if;

    -- exchange_rate is defined as destination major units per source major unit.
    v_expected_destination_minor := round(
      v_source_amount_minor::numeric
      * v_rate
      * power(10::numeric, (v_destination_exponent - v_source_exponent)::numeric)
    );

    if v_expected_destination_minor > 9223372036854775807::numeric then
      raise exception using
        errcode = '22003',
        message = 'Converted destination amount exceeds the supported money range';
    end if;

    if v_expected_destination_minor <> v_destination_amount_minor::numeric then
      raise exception using
        errcode = '22023',
        message = 'Destination amount does not match the immutable exchange-rate snapshot';
    end if;

    v_metadata := p_context || jsonb_build_object(
      'operation', 'transfer',
      'transfer', jsonb_build_object(
        'source_wallet_id', v_source_wallet.id::text,
        'destination_wallet_id', v_destination_wallet.id::text,
        'source_currency_code', v_source_wallet.currency_code::text,
        'destination_currency_code', v_destination_wallet.currency_code::text,
        'source_amount_minor', v_source_amount_minor::text,
        'destination_amount_minor', v_destination_amount_minor::text,
        'exchange_rate', v_rate::text,
        'rate_source', v_rate_source,
        'rate_observed_at', v_rate_observed_at
      )
    );
  end if;

  v_transaction_id := private.create_ledger_transaction(
    p_user_id,
    'transfer'::public.ledger_transaction_type,
    v_effective_at,
    null,
    v_note,
    p_client_request_id,
    p_payload_hash,
    p_amends_transaction_id,
    p_amendment_reason,
    v_metadata
  );

  perform private.append_ledger_entry(
    p_user_id,
    v_transaction_id,
    v_source_wallet.id,
    v_source_wallet.currency_code,
    -v_source_amount_minor
  );
  perform private.append_ledger_entry(
    p_user_id,
    v_transaction_id,
    v_destination_wallet.id,
    v_destination_wallet.currency_code,
    v_destination_amount_minor
  );

  if p_context ? 'correction' then
    v_audit_event_type := 'ledger.transfer.replacement_posted';
  else
    v_audit_event_type := 'ledger.transfer.posted';
  end if;

  perform private.add_audit_event(
    p_user_id,
    v_audit_event_type,
    'ledger_transaction',
    v_transaction_id,
    p_client_request_id,
    v_audit_related_transaction_id,
    null,
    jsonb_build_object(
      'source_wallet_id', v_source_wallet.id::text,
      'destination_wallet_id', v_destination_wallet.id::text,
      'source_currency_code', v_source_wallet.currency_code::text,
      'destination_currency_code', v_destination_wallet.currency_code::text
    )
  );

  return v_transaction_id;
end;
$$;

create or replace function private.reverse_transaction(
  p_user_id uuid,
  p_original_transaction_id uuid,
  p_mode public.ledger_transaction_type,
  p_reason text,
  p_client_request_id uuid,
  p_payload_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_original public.ledger_transactions%rowtype;
  v_entry record;
  v_reversal_id uuid;
begin
  if p_mode not in ('correction'::public.ledger_transaction_type, 'void'::public.ledger_transaction_type) then
    raise exception using
      errcode = '22023',
      message = 'A reversal must be a correction or void';
  end if;

  select t.*
    into v_original
  from public.ledger_transactions t
  where t.id = p_original_transaction_id
    and t.user_id = p_user_id
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'Original transaction is unavailable or belongs to another user';
  end if;

  if v_original.status <> 'posted'::public.ledger_transaction_status
    or v_original.transaction_type not in (
      'income'::public.ledger_transaction_type,
      'expense'::public.ledger_transaction_type,
      'transfer'::public.ledger_transaction_type
    )
    or v_original.amends_transaction_id is not null then
    raise exception using
      errcode = '22023',
      message = 'Only an untouched posted income, expense, or transfer can be corrected or voided';
  end if;

  if exists (
    select 1
    from public.ledger_transactions t
    where t.user_id = p_user_id
      and t.amends_transaction_id = v_original.id
      and t.transaction_type in ('correction'::public.ledger_transaction_type, 'void'::public.ledger_transaction_type)
  ) then
    raise exception using
      errcode = '23505',
      message = 'This transaction already has a correction or void flow';
  end if;

  -- Lock the affected wallets in deterministic order.  Archived wallets remain
  -- reversible so historical records can be corrected without resurrecting them.
  for v_entry in
    select e.wallet_id, e.currency_code, e.amount_minor
    from public.ledger_entries e
    where e.transaction_id = v_original.id
      and e.user_id = p_user_id
    order by e.wallet_id
  loop
    perform 1
    from public.wallets w
    where w.id = v_entry.wallet_id
      and w.user_id = p_user_id
    for update;

    if not found then
      raise exception using
        errcode = '42501',
        message = 'Original transaction contains a wallet outside the current user boundary';
    end if;
  end loop;

  v_reversal_id := private.create_ledger_transaction(
    p_user_id,
    p_mode,
    v_original.effective_at,
    v_original.category_key,
    null,
    p_client_request_id,
    p_payload_hash,
    v_original.id,
    p_reason,
    jsonb_build_object(
      'amendment', jsonb_build_object(
        'original_transaction_id', v_original.id::text,
        'original_transaction_type', v_original.transaction_type::text,
        'mode', p_mode::text,
        'effective_at_source', 'original_transaction'
      )
    )
  );

  for v_entry in
    select e.wallet_id, e.currency_code, e.amount_minor
    from public.ledger_entries e
    where e.transaction_id = v_original.id
      and e.user_id = p_user_id
    order by e.wallet_id
  loop
    perform private.append_ledger_entry(
      p_user_id,
      v_reversal_id,
      v_entry.wallet_id,
      v_entry.currency_code,
      -v_entry.amount_minor
    );
  end loop;

  perform private.add_audit_event(
    p_user_id,
    case
      when p_mode = 'void'::public.ledger_transaction_type then 'ledger.transaction.voided'
      else 'ledger.transaction.reversed_for_correction'
    end,
    'ledger_transaction',
    v_reversal_id,
    p_client_request_id,
    v_original.id,
    p_reason,
    jsonb_build_object(
      'original_transaction_id', v_original.id::text,
      'original_transaction_type', v_original.transaction_type::text
    )
  );

  return v_reversal_id;
end;
$$;

create or replace function private.execute_finance_operation(
  p_operation text,
  p_payload jsonb,
  p_client_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_operation text := lower(btrim(p_operation));
  v_receipt_operation text;
  v_payload_hash text;
  v_previous record;
  v_receipt_id uuid;
  v_primary_transaction_id uuid;
  v_reversal_transaction_id uuid;
  v_original_transaction_id uuid;
  v_reason text;
  v_replacement_operation text;
  v_replacement_payload jsonb;
begin
  v_user_id := private.require_authenticated_user();
  perform private.require_json_object(p_payload);

  if p_client_request_id is null then
    raise exception using
      errcode = '22023',
      message = 'client_request_id is required for exactly-once protection';
  end if;

  if v_operation not in ('income', 'expense', 'transfer', 'void', 'correction') then
    raise exception using
      errcode = '22023',
      message = 'Unsupported financial operation';
  end if;

  -- Serialize a repeated request ID for one user before it can reach the
  -- original-row lock below.  This makes a second in-flight retry observe the
  -- immutable receipt instead of racing into an already-amended error.
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_client_request_id::text, 0)
  );

  v_receipt_operation := 'finance.' || v_operation || '.v1';
  v_payload_hash := private.request_payload_hash(v_operation, p_payload);

  select r.operation, r.payload_hash, r.ledger_transaction_id
    into v_previous
  from public.idempotency_receipts r
  where r.user_id = v_user_id
    and r.client_request_id = p_client_request_id
  for key share;

  if found then
    if v_previous.operation <> v_receipt_operation then
      raise exception using
        errcode = '22023',
        message = 'client_request_id was already used for another operation';
    end if;

    if v_previous.payload_hash <> v_payload_hash then
      raise exception using
        errcode = '22023',
        message = 'client_request_id was reused with a different payload';
    end if;

    if v_previous.ledger_transaction_id is null then
      raise exception using
        errcode = '55000',
        message = 'Idempotency receipt is incomplete and requires operator review';
    end if;

    return jsonb_build_object(
      'transaction_id', v_previous.ledger_transaction_id::text,
      'operation', v_operation,
      'replayed', true
    );
  end if;

  -- The exception block is intentional.  If another concurrent request wins the
  -- immutable receipt insert, every tentative ledger/audit write in this block is
  -- rolled back before the existing receipt is returned.
  begin
    if v_operation in ('income', 'expense', 'transfer') then
      v_primary_transaction_id := private.post_standard_operation(
        v_user_id,
        v_operation,
        p_payload,
        p_client_request_id,
        v_payload_hash
      );
    elsif v_operation = 'void' then
      v_original_transaction_id := private.require_uuid(p_payload, 'original_transaction_id');
      v_reason := private.require_reason(p_payload);
      v_primary_transaction_id := private.reverse_transaction(
        v_user_id,
        v_original_transaction_id,
        'void'::public.ledger_transaction_type,
        v_reason,
        p_client_request_id,
        v_payload_hash
      );
    else
      v_original_transaction_id := private.require_uuid(p_payload, 'original_transaction_id');
      v_reason := private.require_reason(p_payload);
      v_replacement_operation := lower(nullif(btrim(p_payload ->> 'replacement_operation'), ''));
      v_replacement_payload := p_payload -> 'replacement_payload';

      if v_replacement_operation not in ('income', 'expense', 'transfer') then
        raise exception using
          errcode = '22023',
          message = 'replacement_operation must be income, expense, or transfer';
      end if;

      perform private.require_json_object(v_replacement_payload);

      v_reversal_transaction_id := private.reverse_transaction(
        v_user_id,
        v_original_transaction_id,
        'correction'::public.ledger_transaction_type,
        v_reason,
        p_client_request_id,
        v_payload_hash
      );

      v_primary_transaction_id := private.post_standard_operation(
        v_user_id,
        v_replacement_operation,
        v_replacement_payload,
        p_client_request_id,
        v_payload_hash,
        null,
        null,
        jsonb_build_object(
          'correction', jsonb_build_object(
            'original_transaction_id', v_original_transaction_id::text,
            'reversal_transaction_id', v_reversal_transaction_id::text
          )
        )
      );

      perform private.add_audit_event(
        v_user_id,
        'ledger.transaction.corrected',
        'ledger_transaction',
        v_primary_transaction_id,
        p_client_request_id,
        v_original_transaction_id,
        v_reason,
        jsonb_build_object(
          'reversal_transaction_id', v_reversal_transaction_id::text,
          'replacement_operation', v_replacement_operation
        )
      );
    end if;

    insert into public.idempotency_receipts (
      user_id,
      operation,
      client_request_id,
      payload_hash,
      ledger_transaction_id,
      response_code
    )
    values (
      v_user_id,
      v_receipt_operation,
      p_client_request_id,
      v_payload_hash,
      v_primary_transaction_id,
      200
    )
    on conflict (user_id, client_request_id) do nothing
    returning id into v_receipt_id;

    if v_receipt_id is null then
      raise exception using
        errcode = 'SW001',
        message = 'A concurrent request already owns this client_request_id';
    end if;

    return jsonb_build_object(
      'transaction_id', v_primary_transaction_id::text,
      'operation', v_operation,
      'replayed', false
    );
  exception
    when sqlstate 'SW001' then
      select r.operation, r.payload_hash, r.ledger_transaction_id
        into v_previous
      from public.idempotency_receipts r
      where r.user_id = v_user_id
        and r.client_request_id = p_client_request_id;

      if not found or v_previous.ledger_transaction_id is null then
        raise exception using
          errcode = '55000',
          message = 'Concurrent idempotency receipt could not be recovered';
      end if;

      if v_previous.operation <> v_receipt_operation
        or v_previous.payload_hash <> v_payload_hash then
        raise exception using
          errcode = '22023',
          message = 'client_request_id was reused with a different operation or payload';
      end if;

      return jsonb_build_object(
        'transaction_id', v_previous.ledger_transaction_id::text,
        'operation', v_operation,
        'replayed', true
      );
  end;
end;
$$;

-- These public RPCs are intentionally narrow SECURITY DEFINER boundaries.  Direct
-- ledger/audit/receipt DML remains unavailable to browser roles; each function has
-- a fixed search_path and private.execute_finance_operation() checks auth.uid().
create or replace function public.record_income(
  p_wallet_id uuid,
  p_amount_minor bigint,
  p_currency_code text,
  p_category_key text,
  p_effective_at timestamptz,
  p_note text,
  p_client_request_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.execute_finance_operation(
    'income',
    jsonb_build_object(
      'wallet_id', p_wallet_id::text,
      'amount_minor', p_amount_minor::text,
      'currency_code', p_currency_code::text,
      'category_key', p_category_key,
      'effective_at', p_effective_at,
      'note', p_note
    ),
    p_client_request_id
  );
$$;

create or replace function public.record_expense(
  p_wallet_id uuid,
  p_amount_minor bigint,
  p_currency_code text,
  p_category_key text,
  p_effective_at timestamptz,
  p_note text,
  p_client_request_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.execute_finance_operation(
    'expense',
    jsonb_build_object(
      'wallet_id', p_wallet_id::text,
      'amount_minor', p_amount_minor::text,
      'currency_code', p_currency_code::text,
      'category_key', p_category_key,
      'effective_at', p_effective_at,
      'note', p_note
    ),
    p_client_request_id
  );
$$;

create or replace function public.record_transfer(
  p_source_wallet_id uuid,
  p_destination_wallet_id uuid,
  p_source_amount_minor bigint,
  p_destination_amount_minor bigint,
  p_source_currency_code text,
  p_destination_currency_code text,
  p_effective_at timestamptz,
  p_note text,
  p_exchange_rate numeric,
  p_rate_source text,
  p_rate_observed_at timestamptz,
  p_client_request_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.execute_finance_operation(
    'transfer',
    jsonb_build_object(
      'source_wallet_id', p_source_wallet_id::text,
      'destination_wallet_id', p_destination_wallet_id::text,
      'source_amount_minor', p_source_amount_minor::text,
      'destination_amount_minor', p_destination_amount_minor::text,
      'source_currency_code', p_source_currency_code::text,
      'destination_currency_code', p_destination_currency_code::text,
      'effective_at', p_effective_at,
      'note', p_note,
      'exchange_rate', p_exchange_rate,
      'rate_source', p_rate_source,
      'rate_observed_at', p_rate_observed_at
    ),
    p_client_request_id
  );
$$;

create or replace function public.void_financial_transaction(
  p_original_transaction_id uuid,
  p_reason text,
  p_client_request_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.execute_finance_operation(
    'void',
    jsonb_build_object(
      'original_transaction_id', p_original_transaction_id::text,
      'reason', p_reason
    ),
    p_client_request_id
  );
$$;

create or replace function public.correct_financial_transaction(
  p_original_transaction_id uuid,
  p_replacement_operation text,
  p_replacement_payload jsonb,
  p_reason text,
  p_client_request_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.execute_finance_operation(
    'correction',
    jsonb_build_object(
      'original_transaction_id', p_original_transaction_id::text,
      'replacement_operation', p_replacement_operation,
      'replacement_payload', p_replacement_payload,
      'reason', p_reason
    ),
    p_client_request_id
  );
$$;

-- Read functions retain SECURITY INVOKER semantics: RLS and explicit ownership
-- rules from Phase 2 still apply even when callers use the Data API RPC surface.
create or replace function public.get_wallet_balance(p_wallet_id uuid)
returns bigint
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_balance numeric;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to read a wallet balance';
  end if;

  select w.opening_balance_minor::numeric + coalesce(sum(e.amount_minor), 0)
    into v_balance
  from public.wallets w
  left join public.ledger_entries e
    on e.wallet_id = w.id
    and e.user_id = v_user_id
  where w.id = p_wallet_id
    and w.user_id = v_user_id
  group by w.id, w.opening_balance_minor;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'Wallet is unavailable or belongs to another user';
  end if;

  if v_balance > 9223372036854775807::numeric
    or v_balance < -9223372036854775808::numeric then
    raise exception using
      errcode = '22003',
      message = 'Wallet balance exceeds the supported money range';
  end if;

  return v_balance::bigint;
end;
$$;

create or replace function public.get_wallet_balances(
  p_include_archived boolean default false
)
returns table (
  wallet_id uuid,
  currency_code text,
  balance_minor bigint,
  lifecycle public.wallet_lifecycle
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    w.id,
    w.currency_code,
    (w.opening_balance_minor::numeric + coalesce(sum(e.amount_minor), 0))::bigint,
    w.lifecycle
  from public.wallets w
  left join public.ledger_entries e
    on e.wallet_id = w.id
    and e.user_id = auth.uid()
  where w.user_id = auth.uid()
    and (p_include_archived or w.lifecycle = 'active'::public.wallet_lifecycle)
  group by w.id, w.currency_code, w.opening_balance_minor, w.lifecycle
  order by w.created_at, w.id;
$$;

create or replace function public.get_total_balance_by_currency(
  p_include_archived boolean default false
)
returns table (
  currency_code text,
  balance_minor bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    w.currency_code,
    sum(w.opening_balance_minor::numeric + coalesce(e.entry_total, 0))::bigint
  from public.wallets w
  left join lateral (
    select sum(le.amount_minor) as entry_total
    from public.ledger_entries le
    where le.wallet_id = w.id
      and le.user_id = auth.uid()
  ) e on true
  where w.user_id = auth.uid()
    and (p_include_archived or w.lifecycle = 'active'::public.wallet_lifecycle)
  group by w.currency_code
  order by w.currency_code;
$$;

create or replace function public.get_period_financial_aggregates(
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_wallet_id uuid default null
)
returns table (
  currency_code text,
  income_minor bigint,
  expense_minor bigint,
  net_minor bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to read financial aggregates';
  end if;

  if p_period_start is null or p_period_end is null or p_period_start >= p_period_end then
    raise exception using
      errcode = '22023',
      message = 'A valid half-open period [start, end) is required';
  end if;

  return query
  with scoped_entries as (
    select
      e.currency_code,
      e.amount_minor,
      case
        when t.transaction_type in ('correction'::public.ledger_transaction_type, 'void'::public.ledger_transaction_type)
          then original.transaction_type::text
        else t.transaction_type::text
      end as reporting_type
    from public.ledger_entries e
    join public.ledger_transactions t
      on t.id = e.transaction_id
      and t.user_id = v_user_id
    left join public.ledger_transactions original
      on original.id = t.amends_transaction_id
      and original.user_id = v_user_id
    join public.wallets w
      on w.id = e.wallet_id
      and w.user_id = v_user_id
    where e.user_id = v_user_id
      and t.status = 'posted'::public.ledger_transaction_status
      and t.effective_at >= p_period_start
      and t.effective_at < p_period_end
      and (p_wallet_id is null or e.wallet_id = p_wallet_id)
  )
  select
    s.currency_code,
    coalesce(sum(case when s.reporting_type = 'income' then s.amount_minor else 0 end), 0)::bigint as income_minor,
    coalesce(sum(case when s.reporting_type = 'expense' then -s.amount_minor else 0 end), 0)::bigint as expense_minor,
    (
      coalesce(sum(case when s.reporting_type = 'income' then s.amount_minor else 0 end), 0)
      - coalesce(sum(case when s.reporting_type = 'expense' then -s.amount_minor else 0 end), 0)
    )::bigint as net_minor
  from scoped_entries s
  group by s.currency_code
  order by s.currency_code;
end;
$$;

create or replace function public.get_category_expense_aggregates(
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_wallet_id uuid default null
)
returns table (
  category_key text,
  currency_code text,
  expense_minor bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to read category aggregates';
  end if;

  if p_period_start is null or p_period_end is null or p_period_start >= p_period_end then
    raise exception using
      errcode = '22023',
      message = 'A valid half-open period [start, end) is required';
  end if;

  return query
  with scoped_entries as (
    select
      e.currency_code,
      e.amount_minor,
      case
        when t.transaction_type in ('correction'::public.ledger_transaction_type, 'void'::public.ledger_transaction_type)
          then original.transaction_type::text
        else t.transaction_type::text
      end as reporting_type,
      coalesce(
        case
          when t.transaction_type in ('correction'::public.ledger_transaction_type, 'void'::public.ledger_transaction_type)
            then original.category_key
          else t.category_key
        end,
        'uncategorized'
      ) as reporting_category_key
    from public.ledger_entries e
    join public.ledger_transactions t
      on t.id = e.transaction_id
      and t.user_id = v_user_id
    left join public.ledger_transactions original
      on original.id = t.amends_transaction_id
      and original.user_id = v_user_id
    join public.wallets w
      on w.id = e.wallet_id
      and w.user_id = v_user_id
    where e.user_id = v_user_id
      and t.status = 'posted'::public.ledger_transaction_status
      and t.effective_at >= p_period_start
      and t.effective_at < p_period_end
      and (p_wallet_id is null or e.wallet_id = p_wallet_id)
  )
  select
    s.reporting_category_key,
    s.currency_code,
    coalesce(sum(-s.amount_minor), 0)::bigint as expense_minor
  from scoped_entries s
  where s.reporting_type = 'expense'
  group by s.reporting_category_key, s.currency_code
  order by s.currency_code, s.reporting_category_key;
end;
$$;

-- Browser roles may read their own rows through Phase 2 RLS but must never mutate
-- an authoritative financial row directly.  All financial writes go through the
-- narrow RPCs above and receive an immutable idempotency/audit receipt.
revoke insert, update, delete on table public.ledger_transactions from public, anon, authenticated;
revoke insert, update, delete on table public.ledger_entries from public, anon, authenticated;
revoke insert, update, delete on table public.idempotency_receipts from public, anon, authenticated;
revoke insert, update, delete on table public.audit_events from public, anon, authenticated;

revoke all on function private.require_authenticated_user() from public, anon, authenticated;
revoke all on function private.require_json_object(jsonb) from public, anon, authenticated;
revoke all on function private.require_uuid(jsonb, text) from public, anon, authenticated;
revoke all on function private.require_positive_minor(jsonb, text) from public, anon, authenticated;
revoke all on function private.require_positive_numeric(jsonb, text) from public, anon, authenticated;
revoke all on function private.require_currency_code(jsonb, text) from public, anon, authenticated;
revoke all on function private.require_effective_at(jsonb, text) from public, anon, authenticated;
revoke all on function private.optional_text(jsonb, text, integer) from public, anon, authenticated;
revoke all on function private.require_text(jsonb, text, integer) from public, anon, authenticated;
revoke all on function private.require_category_key(jsonb) from public, anon, authenticated;
revoke all on function private.require_reason(jsonb) from public, anon, authenticated;
revoke all on function private.request_payload_hash(text, jsonb) from public, anon, authenticated;
revoke all on function private.lock_active_wallet(uuid, uuid) from public, anon, authenticated;
revoke all on function private.create_ledger_transaction(uuid, public.ledger_transaction_type, timestamptz, text, text, uuid, text, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function private.append_ledger_entry(uuid, uuid, uuid, text, bigint) from public, anon, authenticated;
revoke all on function private.add_audit_event(uuid, text, text, uuid, uuid, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function private.post_standard_operation(uuid, text, jsonb, uuid, text, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function private.reverse_transaction(uuid, uuid, public.ledger_transaction_type, text, uuid, text) from public, anon, authenticated;
revoke all on function private.execute_finance_operation(text, jsonb, uuid) from public, anon, authenticated;

revoke all on function public.record_income(uuid, bigint, text, text, timestamptz, text, uuid) from public, anon, authenticated;
revoke all on function public.record_expense(uuid, bigint, text, text, timestamptz, text, uuid) from public, anon, authenticated;
revoke all on function public.record_transfer(uuid, uuid, bigint, bigint, text, text, timestamptz, text, numeric, text, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.void_financial_transaction(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.correct_financial_transaction(uuid, text, jsonb, text, uuid) from public, anon, authenticated;
revoke all on function public.get_wallet_balance(uuid) from public, anon, authenticated;
revoke all on function public.get_wallet_balances(boolean) from public, anon, authenticated;
revoke all on function public.get_total_balance_by_currency(boolean) from public, anon, authenticated;
revoke all on function public.get_period_financial_aggregates(timestamptz, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.get_category_expense_aggregates(timestamptz, timestamptz, uuid) from public, anon, authenticated;

grant execute on function public.record_income(uuid, bigint, text, text, timestamptz, text, uuid) to authenticated;
grant execute on function public.record_expense(uuid, bigint, text, text, timestamptz, text, uuid) to authenticated;
grant execute on function public.record_transfer(uuid, uuid, bigint, bigint, text, text, timestamptz, text, numeric, text, timestamptz, uuid) to authenticated;
grant execute on function public.void_financial_transaction(uuid, text, uuid) to authenticated;
grant execute on function public.correct_financial_transaction(uuid, text, jsonb, text, uuid) to authenticated;
grant execute on function public.get_wallet_balance(uuid) to authenticated;
grant execute on function public.get_wallet_balances(boolean) to authenticated;
grant execute on function public.get_total_balance_by_currency(boolean) to authenticated;
grant execute on function public.get_period_financial_aggregates(timestamptz, timestamptz, uuid) to authenticated;
grant execute on function public.get_category_expense_aggregates(timestamptz, timestamptz, uuid) to authenticated;

commit;
