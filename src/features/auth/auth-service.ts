import {
  SupabaseBrowserAuthError,
  type SupabaseAuthSession,
  type SupabaseAuthUser,
  type SupabaseBrowserClient,
  toSupabaseBrowserAuthError,
} from '../../lib/supabase-browser';

export const DEFAULT_AUTH_RETURN_TO = '/app/maga-ai';

export type AuthCallbackResult = {
  kind: 'signed_in' | 'password_recovery' | 'error' | 'none';
  returnTo: string;
  message?: string;
};

export type AuthResult = {
  user: SupabaseAuthUser | null;
  session: SupabaseAuthSession | null;
};

export type SignUpResult = AuthResult & {
  emailConfirmationRequired: boolean;
};

function browserOrigin(): string | null {
  if (typeof window === 'undefined') return null;
  return window.location.origin;
}

/**
 * Only same-origin authenticated application paths are accepted. This blocks
 * open redirects after sign-in, registration, and password recovery.
 */
export function safeReturnTo(value: string | null | undefined, fallback = DEFAULT_AUTH_RETURN_TO): string {
  const origin = browserOrigin();
  if (!origin || !value) return fallback;

  try {
    const target = new URL(value, origin);
    const isApplicationPath = target.pathname === '/app' || target.pathname.startsWith('/app/');
    if (target.origin !== origin || !isApplicationPath) return fallback;
    if (target.pathname.startsWith('//') || target.pathname.includes('\\') || /%5c/i.test(value)) return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}

export function createAuthCallbackUrl(returnTo?: string, mode?: 'recovery'): string {
  const origin = browserOrigin();
  if (!origin) throw new SupabaseBrowserAuthError('Authentication redirects must be created in a browser.');

  const callback = new URL('/auth/callback', origin);
  callback.searchParams.set('returnTo', safeReturnTo(returnTo));
  if (mode) callback.searchParams.set('mode', mode);
  return callback.toString();
}

export function normalizeAuthError(error: unknown): string {
  return toSupabaseBrowserAuthError(error, 'Authentication could not be completed. Please try again.').message;
}

export async function signInWithEmail(
  client: SupabaseBrowserClient,
  input: { email: string; password: string },
): Promise<AuthResult> {
  const { data, error } = await client.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });
  if (error) throw toSupabaseBrowserAuthError(error, 'Sign-in could not be completed.');
  if (!data.session || !data.user) {
    throw new SupabaseBrowserAuthError('The sign-in response did not contain a session.');
  }

  return { user: data.user, session: data.session };
}

export async function registerWithEmail(
  client: SupabaseBrowserClient,
  input: { email: string; password: string; returnTo?: string },
): Promise<SignUpResult> {
  const { data, error } = await client.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: createAuthCallbackUrl(input.returnTo),
    },
  });
  if (error) throw toSupabaseBrowserAuthError(error, 'Registration could not be completed.');

  return {
    user: data.user,
    session: data.session,
    emailConfirmationRequired: !data.session,
  };
}

export async function requestPasswordReset(
  client: SupabaseBrowserClient,
  email: string,
  returnTo?: string,
): Promise<void> {
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: createAuthCallbackUrl(returnTo, 'recovery'),
  });
  if (error) throw toSupabaseBrowserAuthError(error, 'Password recovery could not be started.');
}

export async function completePasswordReset(client: SupabaseBrowserClient, password: string): Promise<void> {
  const { error } = await client.auth.updateUser({ password });
  if (error) throw toSupabaseBrowserAuthError(error, 'Password could not be updated.');
}

/** Ends this browser session through the official client and clears its tokens. */
export async function signOut(client: SupabaseBrowserClient): Promise<void> {
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw toSupabaseBrowserAuthError(error, 'Sign-out could not be completed.');
}

function clearAuthCallbackAddress(): void {
  if (typeof window === 'undefined') return;
  const clean = new URL(window.location.href);
  clean.searchParams.delete('code');
  clean.searchParams.delete('error');
  clean.searchParams.delete('error_description');
  clean.hash = '';
  window.history.replaceState({}, document.title, `${clean.pathname}${clean.search}`);
}

/**
 * Handles both Supabase PKCE (`?code=`) and implicit (`#access_token=`)
 * callback formats. PKCE links intentionally only work in the same browser
 * that requested them because the verifier stays in that browser's storage.
 */
export async function handleAuthCallback(client: SupabaseBrowserClient, url?: string): Promise<AuthCallbackResult> {
  if (!url && typeof window === 'undefined') {
    throw new SupabaseBrowserAuthError('Authentication callbacks must run in a browser.');
  }

  const callbackUrl = new URL(url ?? window.location.href);
  const returnTo = safeReturnTo(callbackUrl.searchParams.get('returnTo'));
  const callbackError = callbackUrl.searchParams.get('error_description') ?? callbackUrl.searchParams.get('error');
  const hash = new URLSearchParams(callbackUrl.hash.replace(/^#/, ''));
  const hashError = hash.get('error_description') ?? hash.get('error');

  if (callbackError || hashError) {
    clearAuthCallbackAddress();
    return { kind: 'error', returnTo, message: callbackError ?? hashError ?? undefined };
  }

  try {
    const code = callbackUrl.searchParams.get('code');
    if (code) {
      // detectSessionInUrl lets the official SDK consume the PKCE verifier and
      // exchange this code exactly once during client initialization.
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) throw new SupabaseBrowserAuthError('The callback did not contain a valid session.');
      const isRecovery = callbackUrl.searchParams.get('mode') === 'recovery';
      clearAuthCallbackAddress();
      return { kind: isRecovery ? 'password_recovery' : 'signed_in', returnTo };
    }

    if (hash.get('access_token')) {
      // The official client receives implicit-link sessions during its own
      // initialization when detectSessionInUrl is enabled.
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) throw new SupabaseBrowserAuthError('The callback did not contain a valid session.');
      const isRecovery = hash.get('type') === 'recovery' || callbackUrl.searchParams.get('mode') === 'recovery';
      clearAuthCallbackAddress();
      return { kind: isRecovery ? 'password_recovery' : 'signed_in', returnTo };
    }
  } catch (error) {
    clearAuthCallbackAddress();
    return { kind: 'error', returnTo, message: normalizeAuthError(error) };
  }

  return { kind: 'none', returnTo };
}
