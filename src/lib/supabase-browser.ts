import { createClient, type AuthChangeEvent, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';

const AUTH_STORAGE_KEY = 'smartwallet.auth.v1';

export type SupabaseBrowserConfig = {
  url: string;
  publishableKey: string;
};

/** Types are re-exported so application features do not depend on SDK internals. */
export type SupabaseAuthUser = User;
export type SupabaseAuthSession = Session;
export type SupabaseAuthChangeEvent = AuthChangeEvent;
export type SupabaseBrowserClient = SupabaseClient;

export class SupabaseBrowserConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseBrowserConfigError';
  }
}

export class SupabaseBrowserAuthError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status = 0, code: string | null = null) {
    super(message);
    this.name = 'SupabaseBrowserAuthError';
    this.status = status;
    this.code = code;
  }
}

export class SupabaseBrowserUnauthorizedError extends SupabaseBrowserAuthError {
  constructor(message = 'The session is no longer valid.') {
    super(message, 401, 'session_expired');
    this.name = 'SupabaseBrowserUnauthorizedError';
  }
}

function readEnvironment(name: string): string | undefined {
  const environment = import.meta.env as Record<string, string | boolean | undefined>;
  const value = environment[name];
  return typeof value === 'string' ? value.trim() : undefined;
}

function decodeJwtPayload(value: string): Record<string, unknown> | null {
  const pieces = value.split('.');
  if (pieces.length !== 3 || typeof globalThis.atob !== 'function') return null;

  try {
    const payload = pieces[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(pieces[1].length / 4) * 4, '=');
    return JSON.parse(globalThis.atob(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function assertPublishableKey(key: string): void {
  if (key.startsWith('sb_secret_')) {
    throw new SupabaseBrowserConfigError('A Supabase secret key must never be configured for the browser.');
  }

  const payload = decodeJwtPayload(key);
  if (payload?.role === 'service_role') {
    throw new SupabaseBrowserConfigError('A Supabase service_role key must never be configured for the browser.');
  }
}

/**
 * Reads only Vite public configuration. A service-role / secret key is rejected
 * before a browser client is created. Authorization remains enforced by RLS.
 */
export function getSupabaseBrowserConfig(): SupabaseBrowserConfig | null {
  const url = readEnvironment('VITE_SUPABASE_URL');
  const publishableKey = readEnvironment('VITE_SUPABASE_PUBLISHABLE_KEY');

  if (!url || !publishableKey) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new SupabaseBrowserConfigError('VITE_SUPABASE_URL must be a valid URL.');
  }

  const isLocalHttp = parsedUrl.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/i.test(parsedUrl.hostname);
  if (parsedUrl.protocol !== 'https:' && !isLocalHttp) {
    throw new SupabaseBrowserConfigError('Supabase browser traffic must use HTTPS outside local development.');
  }

  assertPublishableKey(publishableKey);
  return {
    url: parsedUrl.toString().replace(/\/$/, ''),
    publishableKey,
  };
}

/** Converts SDK and transport errors into an app-safe error shape. */
export function toSupabaseBrowserAuthError(error: unknown, fallback = 'Supabase request failed.'): SupabaseBrowserAuthError {
  if (error instanceof SupabaseBrowserAuthError) return error;

  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; status?: unknown; code?: unknown };
    return new SupabaseBrowserAuthError(
      typeof candidate.message === 'string' && candidate.message.trim() ? candidate.message : fallback,
      typeof candidate.status === 'number' ? candidate.status : 0,
      typeof candidate.code === 'string' ? candidate.code : null,
    );
  }

  return new SupabaseBrowserAuthError(fallback);
}

let singleton: SupabaseBrowserClient | null | undefined;

/**
 * The official Supabase browser client owns PKCE, token refresh, cross-tab
 * synchronization, and safe session persistence. It is intentionally created
 * only in a browser and only with the public browser key.
 */
export function getSupabaseBrowserClient(): SupabaseBrowserClient | null {
  if (singleton !== undefined) return singleton;
  if (typeof window === 'undefined') {
    return null;
  }

  const config = getSupabaseBrowserConfig();
  if (!config) {
    singleton = null;
    return singleton;
  }

  singleton = createClient(config.url, config.publishableKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: AUTH_STORAGE_KEY,
    },
    global: {
      headers: { 'X-Client-Info': 'smartwallet-web' },
    },
  });

  return singleton;
}

/** Test-only reset; production code should use the singleton. */
export function resetSupabaseBrowserClientForTests(): void {
  singleton = undefined;
}
