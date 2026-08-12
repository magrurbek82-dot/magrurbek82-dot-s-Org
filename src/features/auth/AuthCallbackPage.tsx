import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../../i18n/locale-context';
import type { SupabaseBrowserClient } from '../../lib/supabase-browser';
import { handleAuthCallback, type AuthCallbackResult } from './auth-service';

type AuthCallbackPageProps = {
  client: SupabaseBrowserClient;
  onResolved: (result: AuthCallbackResult) => void;
  className?: string;
};

/** Render this at /auth/callback before the router removes query/hash values. */
export function AuthCallbackPage({ client, onResolved, className = '' }: AuthCallbackPageProps) {
  const { t } = useLocale();
  const [result, setResult] = useState<AuthCallbackResult | null>(null);
  const onResolvedRef = useRef(onResolved);
  const translateRef = useRef(t);
  const taskRef = useRef<{ client: SupabaseBrowserClient; result: Promise<AuthCallbackResult> } | null>(null);

  useEffect(() => {
    onResolvedRef.current = onResolved;
  }, [onResolved]);

  useEffect(() => {
    translateRef.current = t;
  }, [t]);

  useEffect(() => {
    let active = true;
    const currentTask = taskRef.current?.client === client
      ? taskRef.current
      : { client, result: handleAuthCallback(client) };
    taskRef.current = currentTask;

    void currentTask.result.then((next) => {
      if (!active) return;
      setResult(next);
      onResolvedRef.current(next);
    }).catch(() => {
      if (!active) return;
      const failure: AuthCallbackResult = {
        kind: 'error',
        returnTo: '/',
        message: translateRef.current('authCallbackError'),
      };
      setResult(failure);
      onResolvedRef.current(failure);
    });

    return () => {
      active = false;
    };
  }, [client]);

  const message = result?.kind === 'error'
    ? result.message ?? t('authCallbackError')
    : t('authLoading');

  return (
    <section className={`sw-card sw-card--padded mx-auto w-full max-w-md ${className}`} aria-live="polite" aria-busy={!result}>
      <h1 className="sw-page-title">{result?.kind === 'error' ? t('authCallbackError') : t('authLoading')}</h1>
      <p className="mt-2 text-sm text-[var(--sw-text-secondary)]">{message}</p>
    </section>
  );
}
