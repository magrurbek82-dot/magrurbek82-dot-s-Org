-- SmartWallet Phase 2 follow-up: advisor-backed foreign-key indexes.
--
-- Each index below directly resolves a foreign-key advisory finding from the
-- fresh SmartWallet target.  Existing ownership/timeline indexes are left in
-- place; no index is removed merely because the empty target has not used it.

begin;

create index if not exists audit_events_actor_user_id_idx
  on public.audit_events (actor_user_id);
create index if not exists audit_events_related_transaction_id_idx
  on public.audit_events (related_transaction_id);
create index if not exists idempotency_receipts_ledger_transaction_id_idx
  on public.idempotency_receipts (ledger_transaction_id);
create index if not exists ledger_entries_currency_code_idx
  on public.ledger_entries (currency_code);
create index if not exists ledger_entries_user_id_idx
  on public.ledger_entries (user_id);
create index if not exists profiles_base_currency_code_idx
  on public.profiles (base_currency_code);
create index if not exists profiles_monthly_income_currency_code_idx
  on public.profiles (monthly_income_currency_code);
create index if not exists wallets_currency_code_idx
  on public.wallets (currency_code);

commit;
