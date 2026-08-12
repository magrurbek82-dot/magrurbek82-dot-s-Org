import { LOCALES, type Locale } from '../i18n/translations';

export const DEFAULT_BASE_CURRENCY = 'UZS';
export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export type ProfilePreferences = {
  locale: Locale;
  baseCurrencyCode: string;
  themePreference: ThemePreference;
  timezone: string;
  displayName: string | null;
};

/**
 * This is the browser representation of public.profiles. It deliberately omits
 * auth metadata: user metadata is never used for authorization decisions.
 */
export type SmartWalletProfileRow = {
  user_id: string;
  display_name: string | null;
  locale: Locale;
  timezone: string;
  base_currency_code: string;
  theme_preference: ThemePreference;
  onboarding_status: 'not_started' | 'in_progress' | 'completed';
  onboarding_draft: unknown;
  monthly_income_minor: string | number | null;
  monthly_income_currency_code: string | null;
  onboarding_completed_at: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfilePreferencesPatch = Pick<
  SmartWalletProfileRow,
  'locale' | 'base_currency_code' | 'theme_preference' | 'timezone' | 'display_name'
>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

export function normalizeCurrencyCode(value: string | null | undefined): string {
  const normalized = value?.trim().toUpperCase() ?? '';
  return /^[A-Z]{3}$/.test(normalized) ? normalized : DEFAULT_BASE_CURRENCY;
}

export function resolveBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tashkent';
  } catch {
    return 'Asia/Tashkent';
  }
}

export function createDefaultProfilePreferences(): ProfilePreferences {
  return {
    locale: 'uz',
    baseCurrencyCode: DEFAULT_BASE_CURRENCY,
    themePreference: 'system',
    timezone: resolveBrowserTimeZone(),
    displayName: null,
  };
}

export function preferencesFromProfile(profile: Partial<SmartWalletProfileRow> | null | undefined): ProfilePreferences {
  const fallback = createDefaultProfilePreferences();

  return {
    locale: isLocale(profile?.locale) ? profile.locale : fallback.locale,
    baseCurrencyCode: normalizeCurrencyCode(profile?.base_currency_code),
    themePreference: isThemePreference(profile?.theme_preference) ? profile.theme_preference : fallback.themePreference,
    timezone: typeof profile?.timezone === 'string' && profile.timezone.trim() ? profile.timezone : fallback.timezone,
    displayName: typeof profile?.display_name === 'string' && profile.display_name.trim() ? profile.display_name.trim() : null,
  };
}

export function preferencesToProfilePatch(preferences: ProfilePreferences): ProfilePreferencesPatch {
  return {
    locale: preferences.locale,
    base_currency_code: normalizeCurrencyCode(preferences.baseCurrencyCode),
    theme_preference: preferences.themePreference,
    timezone: preferences.timezone.trim() || resolveBrowserTimeZone(),
    display_name: preferences.displayName?.trim() || null,
  };
}
