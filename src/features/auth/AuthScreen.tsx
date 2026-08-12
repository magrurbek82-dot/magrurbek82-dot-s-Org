import { type FormEvent, useEffect, useState } from 'react';
import { useLocale } from '../../i18n/locale-context';
import type { SupabaseBrowserClient } from '../../lib/supabase-browser';
import {
  completePasswordReset,
  normalizeAuthError,
  registerWithEmail,
  requestPasswordReset,
  signInWithEmail,
  signInWithGoogle,
} from './auth-service';

export type AuthScreenMode = 'sign-in' | 'register' | 'reset-request' | 'new-password' | 'email-sent';

type AuthScreenProps = {
  client: SupabaseBrowserClient;
  returnTo?: string;
  initialMode?: Exclude<AuthScreenMode, 'email-sent'>;
  onAuthenticated?: () => void | Promise<void>;
  onPasswordUpdated?: () => void | Promise<void>;
  className?: string;
};

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getErrorMessage(error: unknown, invalidCredentials: string, generic: string): string {
  const message = normalizeAuthError(error);
  if (/email not confirmed/i.test(message)) return 'EMAIL_NOT_CONFIRMED';
  if (/email rate limit|over_email_send_rate_limit|only request this after/i.test(message)) return 'EMAIL_RATE_LIMITED';
  if (/provider is not enabled|unsupported provider|google/i.test(message)) return 'GOOGLE_UNAVAILABLE';
  return /invalid login credentials|invalid credentials/i.test(message) ? invalidCredentials : (message || generic);
}

export function AuthScreen({
  client,
  returnTo,
  initialMode = 'sign-in',
  onAuthenticated,
  onPasswordUpdated,
  className = '',
}: AuthScreenProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<AuthScreenMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setNotice(null);
  }, [initialMode]);

  function switchMode(next: AuthScreenMode): void {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword('');
    setPasswordConfirmation('');
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (mode !== 'new-password' && !isEmail(email)) {
      setError(t('invalidCredentials'));
      return;
    }
    if ((mode === 'register' || mode === 'new-password') && password.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }
    if ((mode === 'register' || mode === 'new-password') && password !== passwordConfirmation) {
      setError(t('passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'sign-in') {
        await signInWithEmail(client, { email, password });
        await onAuthenticated?.();
      } else if (mode === 'register') {
        const result = await registerWithEmail(client, { email, password, returnTo });
        if (result.emailConfirmationRequired) {
          setMode('email-sent');
          setNotice(t('verificationSent'));
        } else {
          await onAuthenticated?.();
        }
      } else if (mode === 'reset-request') {
        await requestPasswordReset(client, email, returnTo);
        setMode('email-sent');
        setNotice(t('verificationSent'));
      } else if (mode === 'new-password') {
        await completePasswordReset(client, password);
        setNotice(t('passwordUpdated'));
        await onPasswordUpdated?.();
      }
    } catch (submitError) {
      const message = getErrorMessage(submitError, t('invalidCredentials'), t('authErrorGeneric'));
      setError(
        message === 'EMAIL_NOT_CONFIRMED'
          ? t('emailNotConfirmed')
          : message === 'EMAIL_RATE_LIMITED'
            ? t('emailRateLimited')
            : message === 'GOOGLE_UNAVAILABLE'
              ? t('googleUnavailable')
              : message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function continueWithGoogle(): Promise<void> {
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await signInWithGoogle(client, { returnTo });
    } catch (submitError) {
      const message = getErrorMessage(submitError, t('invalidCredentials'), t('authErrorGeneric'));
      setError(message === 'GOOGLE_UNAVAILABLE' ? t('googleUnavailable') : message);
      setSubmitting(false);
    }
  }

  const title = mode === 'register'
    ? t('createAccount')
    : mode === 'reset-request' || mode === 'new-password'
      ? t('passwordRecovery')
      : mode === 'email-sent'
        ? t('checkEmail')
        : t('login');
  const description = mode === 'register'
    ? t('createAccountDescription')
    : mode === 'reset-request'
      ? t('resetPasswordDescription')
      : mode === 'email-sent'
        ? t('verificationSent')
        : t('signInDescription');

  if (mode === 'email-sent') {
    return (
      <section className={`sw-card sw-card--padded mx-auto w-full max-w-md ${className}`} aria-live="polite">
        <p className="sw-eyebrow">SmartVault</p>
        <h1 className="sw-page-title mt-1">{title}</h1>
        <p className="mt-2 text-sm text-[var(--sw-text-secondary)]">{notice ?? description}</p>
        <button type="button" className="sw-button sw-button--primary mt-6 w-full" onClick={() => switchMode('sign-in')}>
          {t('returnToSignIn')}
        </button>
      </section>
    );
  }

  const needsEmail = mode !== 'new-password';
  const needsConfirmation = mode === 'register' || mode === 'new-password';
  const primaryAction = mode === 'register'
    ? t('registerAction')
    : mode === 'reset-request'
      ? t('sendResetLink')
      : mode === 'new-password'
        ? t('updatePassword')
        : t('signInAction');

  return (
    <section className={`sw-card sw-card--padded mx-auto w-full max-w-md ${className}`} aria-busy={submitting}>
      <p className="sw-eyebrow">SmartVault</p>
      <h1 className="sw-page-title mt-1">{title}</h1>
      <p className="mt-2 text-sm text-[var(--sw-text-secondary)]">{description}</p>

      {mode === 'sign-in' || mode === 'register' ? (
        <>
          <button
            type="button"
            className="sw-button sw-button--secondary mt-6 w-full"
            disabled={submitting}
            onClick={() => void continueWithGoogle()}
          >
            <span aria-hidden="true" className="mr-2 inline-grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-[#4285F4] shadow-sm">G</span>
            {t('continueWithGoogle')}
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-[var(--sw-text-secondary)]" aria-hidden="true">
            <span className="h-px flex-1 bg-[var(--sw-border)]" />
            <span>{t('orContinueWithEmail')}</span>
            <span className="h-px flex-1 bg-[var(--sw-border)]" />
          </div>
        </>
      ) : null}

      <form className={`${mode === 'sign-in' || mode === 'register' ? '' : 'mt-6'} grid gap-4`} onSubmit={(event) => void submit(event)} noValidate>
        {error ? <p className="sw-status sw-status--danger" role="alert">{error}</p> : null}
        {notice ? <p className="sw-status sw-status--success" role="status">{notice}</p> : null}

        {needsEmail ? (
          <label className="sw-field" htmlFor="auth-email">
            <span className="sw-label">{t('email')}</span>
            <input id="auth-email" className="sw-input" type="email" inputMode="email" autoComplete="email" value={email} disabled={submitting} onChange={(event) => setEmail(event.target.value)} required />
          </label>
        ) : null}

        {mode !== 'reset-request' ? (
          <label className="sw-field" htmlFor="auth-password">
            <span className="sw-label">{mode === 'new-password' ? t('newPassword') : t('password')}</span>
            <input id="auth-password" className="sw-input" type="password" autoComplete={mode === 'new-password' ? 'new-password' : mode === 'register' ? 'new-password' : 'current-password'} value={password} disabled={submitting} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          </label>
        ) : null}

        {needsConfirmation ? (
          <label className="sw-field" htmlFor="auth-password-confirmation">
            <span className="sw-label">{t('passwordConfirm')}</span>
            <input id="auth-password-confirmation" className="sw-input" type="password" autoComplete="new-password" value={passwordConfirmation} disabled={submitting} onChange={(event) => setPasswordConfirmation(event.target.value)} required minLength={8} />
          </label>
        ) : null}

        <button type="submit" className="sw-button sw-button--primary mt-2 w-full" disabled={submitting}>
          {submitting ? t('authLoading') : primaryAction}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        {mode === 'sign-in' ? (
          <>
            <button type="button" className="sw-button sw-button--ghost sw-button--sm" onClick={() => switchMode('reset-request')}>{t('forgotPassword')}</button>
            <button type="button" className="sw-button sw-button--ghost sw-button--sm" onClick={() => switchMode('register')}>{t('register')}</button>
          </>
        ) : (
          <button type="button" className="sw-button sw-button--ghost sw-button--sm" onClick={() => switchMode('sign-in')}>{t('returnToSignIn')}</button>
        )}
      </div>
    </section>
  );
}
