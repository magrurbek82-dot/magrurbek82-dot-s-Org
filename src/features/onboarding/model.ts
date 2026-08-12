import type { Locale } from '../../i18n/translations';
import {
  DEFAULT_BASE_CURRENCY,
  createDefaultProfilePreferences,
  normalizeCurrencyCode,
  resolveBrowserTimeZone,
  type ProfilePreferences,
} from '../../lib/profile-preferences';

export const ONBOARDING_FOCUS_AREAS = ['budget', 'saving', 'debt', 'spending', 'overview'] as const;
export const ONBOARDING_STEPS = [1, 2, 3] as const;

export type OnboardingFocusArea = (typeof ONBOARDING_FOCUS_AREAS)[number];
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type OnboardingDraft = {
  version: 1;
  step: OnboardingStep;
  locale: Locale;
  baseCurrencyCode: string;
  timezone: string;
  focusAreas: OnboardingFocusArea[];
  monthlyIncomeInput: string;
  monthlyIncomeCurrencyCode: string;
  firstWallet: {
    name: string;
    openingBalanceInput: string;
  };
};

export type OnboardingCompletion = {
  preferences: ProfilePreferences;
  focusAreas: OnboardingFocusArea[];
  monthlyIncomeMinor: string | null;
  monthlyIncomeCurrencyCode: string | null;
  firstWallet: {
    name: string;
    openingBalanceMinor: string | null;
    currencyCode: string;
  } | null;
};

export type CurrencyExponentMap = Readonly<Record<string, number>>;

const DEFAULT_CURRENCY_EXPONENTS: CurrencyExponentMap = {
  UZS: 0,
  JPY: 0,
  KRW: 0,
  USD: 2,
  EUR: 2,
  GBP: 2,
};

export function createDefaultOnboardingDraft(overrides: Partial<OnboardingDraft> = {}): OnboardingDraft {
  const preferences = createDefaultProfilePreferences();
  const baseCurrencyCode = normalizeCurrencyCode(overrides.baseCurrencyCode ?? preferences.baseCurrencyCode);
  const defaults: OnboardingDraft = {
    version: 1,
    step: 1,
    locale: preferences.locale,
    baseCurrencyCode,
    timezone: preferences.timezone,
    focusAreas: [],
    monthlyIncomeInput: '',
    monthlyIncomeCurrencyCode: baseCurrencyCode,
    firstWallet: { name: '', openingBalanceInput: '' },
  };

  return {
    ...defaults,
    ...overrides,
    version: 1,
    baseCurrencyCode,
    monthlyIncomeCurrencyCode: normalizeCurrencyCode(overrides.monthlyIncomeCurrencyCode ?? baseCurrencyCode),
  };
}

function isOnboardingStep(value: unknown): value is OnboardingStep {
  return typeof value === 'number' && (ONBOARDING_STEPS as readonly number[]).includes(value);
}

function isFocusArea(value: unknown): value is OnboardingFocusArea {
  return typeof value === 'string' && (ONBOARDING_FOCUS_AREAS as readonly string[]).includes(value);
}

export function parseOnboardingDraft(value: unknown): OnboardingDraft | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Partial<OnboardingDraft>;
  const base = createDefaultOnboardingDraft();

  if (record.version !== 1) return null;

  return createDefaultOnboardingDraft({
    step: isOnboardingStep(record.step) ? record.step : base.step,
    locale: record.locale === 'ru' || record.locale === 'en' || record.locale === 'uz' ? record.locale : base.locale,
    baseCurrencyCode: normalizeCurrencyCode(record.baseCurrencyCode),
    timezone: typeof record.timezone === 'string' && record.timezone.trim() ? record.timezone : resolveBrowserTimeZone(),
    focusAreas: Array.isArray(record.focusAreas) ? record.focusAreas.filter(isFocusArea) : [],
    monthlyIncomeInput: typeof record.monthlyIncomeInput === 'string' ? record.monthlyIncomeInput.slice(0, 32) : '',
    monthlyIncomeCurrencyCode: normalizeCurrencyCode(record.monthlyIncomeCurrencyCode),
    firstWallet: {
      name: typeof record.firstWallet?.name === 'string' ? record.firstWallet.name.slice(0, 80) : '',
      openingBalanceInput: typeof record.firstWallet?.openingBalanceInput === 'string'
        ? record.firstWallet.openingBalanceInput.slice(0, 32)
        : '',
    },
  });
}

/** Converts a user-entered decimal without using JavaScript floating-point math. */
export function decimalToMinorUnits(value: string, exponent: number): string | null {
  const safeExponent = Number.isInteger(exponent) && exponent >= 0 && exponent <= 6 ? exponent : 2;
  const normalized = value.trim().replace(/\s+/g, '').replace(',', '.');
  if (!normalized) return null;

  const match = /^(\d+)(?:\.(\d+))?$/.exec(normalized);
  if (!match) return null;

  const [, wholePart, fractionPart = ''] = match;
  if (fractionPart.length > safeExponent) return null;

  const scale = 10n ** BigInt(safeExponent);
  const whole = BigInt(wholePart);
  const paddedFraction = `${fractionPart}${'0'.repeat(safeExponent)}`.slice(0, safeExponent);
  const fraction = paddedFraction ? BigInt(paddedFraction) : 0n;
  return (whole * scale + fraction).toString();
}

export function completionFromDraft(
  draft: OnboardingDraft,
  options: { currencyExponent?: number; currencyExponents?: CurrencyExponentMap } = {},
): OnboardingCompletion {
  const baseCurrencyCode = normalizeCurrencyCode(draft.baseCurrencyCode);
  const monthlyIncomeCurrencyCode = normalizeCurrencyCode(draft.monthlyIncomeCurrencyCode || baseCurrencyCode);
  const exponentFor = (currencyCode: string): number => {
    const configured = options.currencyExponents?.[currencyCode] ?? options.currencyExponent;
    if (typeof configured === 'number' && Number.isInteger(configured) && configured >= 0 && configured <= 6) {
      return configured;
    }

    return DEFAULT_CURRENCY_EXPONENTS[currencyCode] ?? 2;
  };
  const monthlyIncomeMinor = decimalToMinorUnits(draft.monthlyIncomeInput, exponentFor(monthlyIncomeCurrencyCode));
  const walletName = draft.firstWallet.name.trim();

  return {
    preferences: {
      locale: draft.locale,
      baseCurrencyCode,
      themePreference: 'system',
      timezone: draft.timezone.trim() || resolveBrowserTimeZone(),
      displayName: null,
    },
    focusAreas: draft.focusAreas,
    monthlyIncomeMinor,
    monthlyIncomeCurrencyCode: monthlyIncomeMinor === null ? null : monthlyIncomeCurrencyCode,
    firstWallet: walletName
      ? {
        name: walletName,
        openingBalanceMinor: decimalToMinorUnits(draft.firstWallet.openingBalanceInput, exponentFor(baseCurrencyCode)),
        currencyCode: baseCurrencyCode,
      }
      : null,
  };
}

export function profilePreferencesToDraft(preferences: Partial<ProfilePreferences>): OnboardingDraft {
  return createDefaultOnboardingDraft({
    locale: preferences.locale ?? 'uz',
    baseCurrencyCode: preferences.baseCurrencyCode ?? DEFAULT_BASE_CURRENCY,
    timezone: preferences.timezone ?? resolveBrowserTimeZone(),
  });
}
