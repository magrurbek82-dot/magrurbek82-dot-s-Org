import {
  SupabaseBrowserUnauthorizedError,
  type SupabaseBrowserClient,
  toSupabaseBrowserAuthError,
} from './supabase-browser';
import {
  normalizeCurrencyCode,
  type SmartWalletProfileRow,
} from './profile-preferences';

export type ProfileMutation = Omit<
  Partial<SmartWalletProfileRow>,
  'user_id' | 'created_at' | 'updated_at'
>;

export type SupportedCurrency = {
  code: string;
  exponent: number;
};

async function assertCurrentUser(client: SupabaseBrowserClient, userId: string): Promise<void> {
  // getUser validates the access token with Auth; the database also enforces
  // the same identity through RLS. Both checks are intentional.
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || data.user.id !== userId) {
    throw new SupabaseBrowserUnauthorizedError();
  }
}

function sanitizeProfileMutation(values: ProfileMutation): ProfileMutation {
  const unsafe = values as Partial<SmartWalletProfileRow>;
  const { user_id: _userId, created_at: _createdAt, updated_at: _updatedAt, ...safeValues } = unsafe;
  return safeValues;
}

export async function getProfile(
  client: SupabaseBrowserClient,
  userId: string,
): Promise<SmartWalletProfileRow | null> {
  await assertCurrentUser(client, userId);
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw toSupabaseBrowserAuthError(error, 'The profile could not be loaded.');
  return data ? data as SmartWalletProfileRow : null;
}

export async function upsertOwnProfile(
  client: SupabaseBrowserClient,
  userId: string,
  values: ProfileMutation,
): Promise<SmartWalletProfileRow> {
  await assertCurrentUser(client, userId);
  const safeValues = sanitizeProfileMutation(values);
  const { data, error } = await client
    .from('profiles')
    .upsert({ ...safeValues, user_id: userId }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error || !data) throw toSupabaseBrowserAuthError(error, 'The profile could not be saved.');
  return data as SmartWalletProfileRow;
}

export async function patchOwnProfile(
  client: SupabaseBrowserClient,
  userId: string,
  values: ProfileMutation,
): Promise<SmartWalletProfileRow> {
  await assertCurrentUser(client, userId);
  const safeValues = sanitizeProfileMutation(values);
  const { data, error } = await client
    .from('profiles')
    .update(safeValues)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error || !data) throw toSupabaseBrowserAuthError(error, 'The profile could not be updated.');
  return data as SmartWalletProfileRow;
}

export async function getCurrencyExponent(
  client: SupabaseBrowserClient,
  currencyCode: string,
): Promise<number | null> {
  const code = normalizeCurrencyCode(currencyCode);
  const { data, error } = await client
    .from('currencies')
    .select('exponent')
    .eq('code', code)
    .maybeSingle();

  if (error) throw toSupabaseBrowserAuthError(error, 'Currency settings could not be loaded.');
  const row = data as unknown;
  const exponent = row && typeof row === 'object' && typeof (row as { exponent?: unknown }).exponent === 'number'
    ? (row as { exponent: number }).exponent
    : null;
  return exponent !== null && Number.isInteger(exponent) && exponent >= 0 && exponent <= 6 ? exponent : null;
}

export async function listSupportedCurrencies(client: SupabaseBrowserClient): Promise<SupportedCurrency[]> {
  const { data, error } = await client
    .from('currencies')
    .select('code, exponent')
    .order('code', { ascending: true });

  if (error) throw toSupabaseBrowserAuthError(error, 'Currencies could not be loaded.');

  const rows: unknown[] = Array.isArray(data) ? data as unknown[] : [];
  return rows
    .filter((row): row is { code: string; exponent: number } => (
      Boolean(row)
      && typeof row === 'object'
      && typeof (row as { code?: unknown }).code === 'string'
      && typeof (row as { exponent?: unknown }).exponent === 'number'
      && Number.isInteger((row as { exponent: number }).exponent)
      && (row as { exponent: number }).exponent >= 0
      && (row as { exponent: number }).exponent <= 6
    ))
    .map((row) => ({ code: normalizeCurrencyCode(row.code), exponent: row.exponent }));
}
