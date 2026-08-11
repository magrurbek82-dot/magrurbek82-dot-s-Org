import { useEffect, useState } from 'react';
import { useLocale } from '../../i18n/locale-context';
import { LOCALES, type Locale } from '../../i18n/translations';
import {
  createDefaultProfilePreferences,
  preferencesFromProfile,
  preferencesToProfilePatch,
  resolveBrowserTimeZone,
  THEME_PREFERENCES,
  type ProfilePreferences,
} from '../../lib/profile-preferences';
import { getProfile, listSupportedCurrencies, upsertOwnProfile } from '../../lib/profile-service';
import type { SupabaseBrowserClient } from '../../lib/supabase-browser';

const FALLBACK_CURRENCIES = ['UZS', 'USD', 'EUR'] as const;

type ProfilePreferencesFormProps = {
  client: SupabaseBrowserClient;
  userId: string;
  onSaved?: (preferences: ProfilePreferences) => void | Promise<void>;
  className?: string;
};

export function ProfilePreferencesForm({ client, userId, onSaved, className = '' }: ProfilePreferencesFormProps) {
  const { setLocale, t } = useLocale();
  const [preferences, setPreferences] = useState<ProfilePreferences>(createDefaultProfilePreferences);
  const [currencies, setCurrencies] = useState<string[]>([...FALLBACK_CURRENCIES]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [profile, supported] = await Promise.all([
          getProfile(client, userId),
          listSupportedCurrencies(client).catch(() => []),
        ]);
        if (!active) return;

        const loaded = preferencesFromProfile(profile);
        setPreferences(loaded);
        setCurrencies([...new Set([
          ...supported.map((currency) => currency.code),
          loaded.baseCurrencyCode,
          ...FALLBACK_CURRENCIES,
        ])]);
      } catch {
        if (active) setNotice(t('onboardingError'));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [client, t, userId]);

  async function submit(): Promise<void> {
    setSaving(true);
    setNotice(null);
    try {
      const next = {
        ...preferences,
        displayName: preferences.displayName?.trim() || null,
        timezone: preferences.timezone.trim() || resolveBrowserTimeZone(),
      };
      await upsertOwnProfile(client, userId, preferencesToProfilePatch(next));
      setPreferences(next);
      setLocale(next.locale);
      setNotice(t('profileSaved'));
      void Promise.resolve(onSaved?.(next)).catch(() => undefined);
    } catch {
      setNotice(t('onboardingError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`sw-card sw-card--padded ${className}`} aria-busy={loading || saving}>
      <h2 className="text-xl font-semibold">{t('accountSettings')}</h2>
      {notice ? <p className="sw-status mt-3" role="status">{notice}</p> : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="sw-field">
          <span className="sw-label">{t('displayName')}</span>
          <input
            className="sw-input"
            value={preferences.displayName ?? ''}
            autoComplete="name"
            maxLength={80}
            disabled={loading || saving}
            onChange={(event) => setPreferences((current) => ({ ...current, displayName: event.target.value }))}
          />
        </label>
        <label className="sw-field">
          <span className="sw-label">{t('language')}</span>
          <select
            className="sw-select"
            value={preferences.locale}
            disabled={loading || saving}
            onChange={(event) => setPreferences((current) => ({ ...current, locale: event.target.value as Locale }))}
          >
            {LOCALES.map((option) => <option key={option} value={option}>{t(option)}</option>)}
          </select>
        </label>
        <label className="sw-field">
          <span className="sw-label">{t('currency')}</span>
          <select
            className="sw-select"
            value={preferences.baseCurrencyCode}
            disabled={loading || saving}
            onChange={(event) => setPreferences((current) => ({ ...current, baseCurrencyCode: event.target.value }))}
          >
            {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
          </select>
        </label>
        <label className="sw-field">
          <span className="sw-label">{t('theme')}</span>
          <select
            className="sw-select"
            value={preferences.themePreference}
            disabled={loading || saving}
            onChange={(event) => setPreferences((current) => ({ ...current, themePreference: event.target.value as ProfilePreferences['themePreference'] }))}
          >
            {THEME_PREFERENCES.map((option) => <option key={option} value={option}>{t(option)}</option>)}
          </select>
        </label>
        <label className="sw-field sm:col-span-2">
          <span className="sw-label">{t('timeZone')}</span>
          <input
            className="sw-input"
            value={preferences.timezone}
            autoComplete="off"
            maxLength={64}
            disabled={loading || saving}
            onChange={(event) => setPreferences((current) => ({ ...current, timezone: event.target.value }))}
          />
        </label>
      </div>
      <div className="mt-6 flex justify-end">
        <button type="button" className="sw-button sw-button--primary" disabled={loading || saving} onClick={() => void submit()}>
          {saving ? t('onboardingSaving') : t('updatePreferences')}
        </button>
      </div>
    </section>
  );
}
