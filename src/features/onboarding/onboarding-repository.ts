import {
  getCurrencyExponent,
  getProfile,
  listSupportedCurrencies,
  upsertOwnProfile,
  type SupportedCurrency,
} from '../../lib/profile-service';
import {
  preferencesFromProfile,
  preferencesToProfilePatch,
  type ProfilePreferences,
} from '../../lib/profile-preferences';
import type { SupabaseBrowserClient } from '../../lib/supabase-browser';
import {
  completionFromDraft,
  createDefaultOnboardingDraft,
  parseOnboardingDraft,
  profilePreferencesToDraft,
  type CurrencyExponentMap,
  type OnboardingCompletion,
  type OnboardingDraft,
} from './model';
import type { Locale } from '../../i18n/translations';

export type OnboardingLoadResult = {
  draft: OnboardingDraft;
  status: 'not_started' | 'in_progress' | 'completed';
};

export type OnboardingRepository = {
  load: () => Promise<OnboardingLoadResult>;
  saveDraft: (draft: OnboardingDraft) => Promise<void>;
  complete: (draft: OnboardingDraft) => Promise<OnboardingCompletion>;
  listCurrencies: () => Promise<SupportedCurrency[]>;
};

function normalizeDraft(draft: OnboardingDraft): OnboardingDraft {
  const parsed = parseOnboardingDraft(draft);
  if (!parsed) throw new Error('The onboarding draft is not valid.');
  return parsed;
}

function mergeProfilePreferences(draft: OnboardingDraft, profile: Awaited<ReturnType<typeof getProfile>>): OnboardingDraft {
  if (!profile) return draft;

  const preferences = preferencesFromProfile(profile);
  return createDefaultOnboardingDraft({
    ...draft,
    locale: preferences.locale,
    baseCurrencyCode: preferences.baseCurrencyCode,
    timezone: preferences.timezone,
    monthlyIncomeCurrencyCode: draft.monthlyIncomeCurrencyCode || preferences.baseCurrencyCode,
  });
}

function onboardingProfilePreferences(
  onboardingPreferences: ProfilePreferences,
  existingProfile: Awaited<ReturnType<typeof getProfile>>,
): ProfilePreferences {
  if (!existingProfile) return onboardingPreferences;
  const existing = preferencesFromProfile(existingProfile);
  return {
    ...onboardingPreferences,
    // Initial setup does not own the user's display name or theme. Preserve
    // values already selected in Profile instead of silently resetting them.
    displayName: existing.displayName,
    themePreference: existing.themePreference,
  };
}

async function loadExponents(client: SupabaseBrowserClient, draft: OnboardingDraft): Promise<CurrencyExponentMap> {
  const uniqueCodes = [...new Set([draft.baseCurrencyCode, draft.monthlyIncomeCurrencyCode])];
  const entries = await Promise.all(uniqueCodes.map(async (code) => [
    code,
    await getCurrencyExponent(client, code),
  ] as const));

  return Object.fromEntries(entries.filter((entry): entry is readonly [string, number] => entry[1] !== null));
}

/**
 * Persists onboarding only to the authenticated user's profile row. It does
 * not create a wallet: first-wallet creation belongs to the ledger phase so
 * that balance and opening transaction are created atomically there.
 */
export function createSupabaseOnboardingRepository(
  client: SupabaseBrowserClient,
  userId: string,
  options: { initialLocale?: Locale } = {},
): OnboardingRepository {
  return {
    async load(): Promise<OnboardingLoadResult> {
      const profile = await getProfile(client, userId);
      const profileDraft = parseOnboardingDraft(profile?.onboarding_draft);
      const fallback = profile
        ? profilePreferencesToDraft(preferencesFromProfile(profile))
        : createDefaultOnboardingDraft({ locale: options.initialLocale ?? 'uz' });
      const draft = mergeProfilePreferences(profileDraft ?? fallback, profile);

      return {
        draft,
        status: profile?.onboarding_status ?? 'not_started',
      };
    },

    async saveDraft(draft: OnboardingDraft): Promise<void> {
      const normalized = normalizeDraft(draft);
      const existingProfile = await getProfile(client, userId);
      const preferences = onboardingProfilePreferences(completionFromDraft(normalized).preferences, existingProfile);
      await upsertOwnProfile(client, userId, {
        ...preferencesToProfilePatch(preferences),
        onboarding_status: 'in_progress',
        onboarding_draft: normalized,
      });
    },

    async complete(draft: OnboardingDraft): Promise<OnboardingCompletion> {
      const normalized = normalizeDraft(draft);
      const existingProfile = await getProfile(client, userId);
      const currencyExponents = await loadExponents(client, normalized);
      const completion = completionFromDraft(normalized, { currencyExponents });
      const preferences = onboardingProfilePreferences(completion.preferences, existingProfile);

      await upsertOwnProfile(client, userId, {
        ...preferencesToProfilePatch(preferences),
        onboarding_status: 'completed',
        onboarding_draft: normalized,
        monthly_income_minor: completion.monthlyIncomeMinor,
        monthly_income_currency_code: completion.monthlyIncomeCurrencyCode,
        onboarding_completed_at: new Date().toISOString(),
      });

      return { ...completion, preferences };
    },

    async listCurrencies(): Promise<SupportedCurrency[]> {
      return listSupportedCurrencies(client);
    },
  };
}
