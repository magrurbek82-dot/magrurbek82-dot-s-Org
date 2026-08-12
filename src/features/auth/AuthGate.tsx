import type { ReactNode } from 'react';
import { useLocale } from '../../i18n/locale-context';
import {
  getSupabaseBrowserClient,
  type SupabaseBrowserClient,
} from '../../lib/supabase-browser';
import { AuthScreen } from './AuthScreen';
import { useAuthSession, type AuthSessionState } from './use-auth-session';

type AuthGateProps = {
  children: ReactNode | ((state: AuthSessionState) => ReactNode);
  client?: SupabaseBrowserClient | null;
  returnTo?: string;
  onAuthenticated?: () => void | Promise<void>;
  className?: string;
};

/**
 * Blocks authenticated routes until the official Supabase session is known.
 * Missing configuration deliberately renders an error, never a demo bypass.
 */
export function AuthGate({ children, client, returnTo, onAuthenticated, className = '' }: AuthGateProps) {
  const { t } = useLocale();
  let configurationError: Error | null = null;
  let resolvedClient = client ?? null;

  if (client === undefined) {
    try {
      resolvedClient = getSupabaseBrowserClient();
    } catch (error) {
      // A malformed public configuration must become a clear page state, not
      // an uncaught render failure. The detailed value is deliberately not
      // rendered because it can include deployment-specific configuration.
      configurationError = error instanceof Error ? error : new Error('Invalid browser configuration.');
    }
  }
  const auth = useAuthSession(resolvedClient);

  if (!resolvedClient || configurationError) {
    return (
      <section className={`sw-card sw-card--padded mx-auto w-full max-w-md ${className}`} role="alert">
        <h1 className="sw-page-title">{t('unsupportedConfiguration')}</h1>
        <p className="mt-2 text-sm text-[var(--sw-text-secondary)]">{t('connectionUnavailable')}</p>
      </section>
    );
  }

  if (auth.status === 'loading') {
    return <section className={`sw-card sw-card--padded mx-auto w-full max-w-md ${className}`} aria-busy="true"><p>{t('authLoading')}</p></section>;
  }

  if (auth.status === 'error') {
    return (
      <section className={`sw-card sw-card--padded mx-auto w-full max-w-md ${className}`} role="alert">
        <h1 className="sw-page-title">{t('sessionExpired')}</h1>
        <p className="mt-2 text-sm text-[var(--sw-text-secondary)]">{t('authErrorGeneric')}</p>
        <button type="button" className="sw-button sw-button--secondary mt-5" onClick={() => void auth.refresh()}>{t('tryAgain')}</button>
      </section>
    );
  }

  if (auth.status === 'anonymous') {
    return <AuthScreen client={resolvedClient} returnTo={returnTo} onAuthenticated={onAuthenticated} className={className} />;
  }

  return <>{typeof children === 'function' ? children(auth) : children}</>;
}
