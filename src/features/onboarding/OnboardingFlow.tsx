import { useEffect, useMemo, useRef, useState } from 'react';
import { LOCALES, type Locale } from '../../i18n/translations';
import { useLocale } from '../../i18n/locale-context';
import {
  ONBOARDING_FOCUS_AREAS,
  type OnboardingCompletion,
  type OnboardingDraft,
  type OnboardingFocusArea,
} from './model';
import type { OnboardingRepository } from './onboarding-repository';

const FALLBACK_CURRENCIES = ['UZS', 'USD', 'EUR'] as const;

type OnboardingFlowProps = {
  repository: OnboardingRepository;
  onComplete?: (completion: OnboardingCompletion) => void | Promise<void>;
  onAlreadyCompleted?: () => void;
  className?: string;
};

type ScreenState = 'loading' | 'ready' | 'saving' | 'completed' | 'error';

function isMoneyInput(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, '');
  return !normalized || /^\d+(?:[,.]\d{1,6})?$/.test(normalized);
}

function uniqueCurrencyCodes(codes: string[]): string[] {
  return [...new Set(codes.map((code) => code.trim().toUpperCase()).filter((code) => /^[A-Z]{3}$/.test(code)))];
}

export function OnboardingFlow({ repository, onComplete, onAlreadyCompleted, className = '' }: OnboardingFlowProps) {
  const { setLocale, t } = useLocale();
  const translateRef = useRef(t);
  const completedRef = useRef(onAlreadyCompleted);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [currencies, setCurrencies] = useState<string[]>([...FALLBACK_CURRENCIES]);
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    translateRef.current = t;
  }, [t]);

  useEffect(() => {
    completedRef.current = onAlreadyCompleted;
  }, [onAlreadyCompleted]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const [loaded, supported] = await Promise.all([
          repository.load(),
          repository.listCurrencies().catch(() => []),
        ]);
        if (!active) return;

        setDraft(loaded.draft);
        setLocale(loaded.draft.locale);
        setCurrencies(uniqueCurrencyCodes([
          ...supported.map((currency) => currency.code),
          loaded.draft.baseCurrencyCode,
          loaded.draft.monthlyIncomeCurrencyCode,
          ...FALLBACK_CURRENCIES,
        ]));

        if (loaded.status === 'completed') {
          setScreenState('completed');
          completedRef.current?.();
          return;
        }

        setScreenState('ready');
      } catch {
        if (!active) return;
        setScreenState('error');
        setNotice(translateRef.current('onboardingError'));
      }
    })();

    return () => {
      active = false;
    };
  }, [repository, setLocale]);

  const focusLabels = useMemo<Record<OnboardingFocusArea, string>>(() => ({
    budget: t('focusBudget'),
    saving: t('focusSaving'),
    debt: t('focusDebt'),
    spending: t('focusSpending'),
    overview: t('focusOverview'),
  }), [t]);

  function updateDraft(updater: (current: OnboardingDraft) => OnboardingDraft): void {
    setDraft((current) => current ? updater(current) : current);
    setNotice(null);
  }

  async function saveAndGoTo(step: 1 | 2 | 3): Promise<void> {
    if (!draft) return;
    const nextDraft = { ...draft, step } as OnboardingDraft;
    setScreenState('saving');
    setNotice(null);

    try {
      await repository.saveDraft(nextDraft);
      setDraft(nextDraft);
      setNotice(t('onboardingSaved'));
      setScreenState('ready');
    } catch {
      setScreenState('ready');
      setNotice(t('onboardingError'));
    }
  }

  async function finish(skipOptional = false): Promise<void> {
    if (!draft) return;
    const finalDraft = skipOptional
      ? {
        ...draft,
        step: 3 as const,
        monthlyIncomeInput: '',
        firstWallet: { name: '', openingBalanceInput: '' },
      }
      : { ...draft, step: 3 as const };

    if (!isMoneyInput(finalDraft.monthlyIncomeInput) || !isMoneyInput(finalDraft.firstWallet.openingBalanceInput)) {
      setNotice(t('invalidAmount'));
      return;
    }
    if (finalDraft.firstWallet.openingBalanceInput.trim() && !finalDraft.firstWallet.name.trim()) {
      setNotice(t('walletNameRequired'));
      return;
    }

    setScreenState('saving');
    setNotice(null);
    try {
      const completion = await repository.complete(finalDraft);
      setDraft(finalDraft);
      setScreenState('completed');
      setNotice(t('onboardingComplete'));
      // Navigation after completion must not turn a successfully persisted
      // profile into a false "save failed" message.
      void Promise.resolve(onComplete?.(completion)).catch(() => undefined);
    } catch {
      setScreenState('ready');
      setNotice(t('onboardingError'));
    }
  }

  if (screenState === 'loading' || !draft) {
    return <section className={`sw-card sw-card--padded ${className}`} aria-busy="true"><p>{t('authLoading')}</p></section>;
  }

  if (screenState === 'error') {
    return (
      <section className={`sw-card sw-card--padded ${className}`} role="alert">
        <h1 className="sw-page-title">{t('onboarding')}</h1>
        <p className="mt-2 text-sm text-[var(--sw-text-secondary)]">{notice ?? t('onboardingError')}</p>
      </section>
    );
  }

  if (screenState === 'completed') {
    return (
      <section className={`sw-card sw-card--padded ${className}`} aria-live="polite">
        <h1 className="sw-page-title">{t('onboardingComplete')}</h1>
        <p className="mt-2 text-sm text-[var(--sw-text-secondary)]">{t('onboardingWelcome')}</p>
      </section>
    );
  }

  const isSaving = screenState === 'saving';
  const selectedFocus = new Set(draft.focusAreas);

  return (
    <section className={`sw-card sw-card--padded ${className}`} aria-busy={isSaving}>
      <header>
        <p className="sw-eyebrow">{t('onboarding')}</p>
        <h1 className="sw-page-title mt-1">{t('onboardingWelcome')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--sw-text-secondary)]">{t('onboardingStart')}</p>
      </header>

      <ol className="mt-6 grid grid-cols-3 gap-2" aria-label={t('onboarding')}>
        {[1, 2, 3].map((step) => (
          <li key={step} aria-current={draft.step === step ? 'step' : undefined}>
            <span className={`sw-badge ${draft.step === step ? 'sw-badge--indigo' : ''}`}>{step}</span>
          </li>
        ))}
      </ol>

      {notice ? <p className="sw-status mt-5" role="status">{notice}</p> : null}

      {draft.step === 1 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h2 className="text-xl font-semibold">{t('onboardingStepLanguageTitle')}</h2>
            <p className="mt-1 text-sm text-[var(--sw-text-secondary)]">{t('onboardingStepLanguageDescription')}</p>
          </div>
          <label className="sw-field">
            <span className="sw-label">{t('language')}</span>
            <select
              className="sw-select"
              value={draft.locale}
              disabled={isSaving}
              onChange={(event) => {
                const nextLocale = event.target.value as Locale;
                updateDraft((current) => ({ ...current, locale: nextLocale }));
                setLocale(nextLocale);
              }}
            >
              {LOCALES.map((option) => <option key={option} value={option}>{t(option)}</option>)}
            </select>
          </label>
          <label className="sw-field">
            <span className="sw-label">{t('baseCurrency')}</span>
            <select
              className="sw-select"
              value={draft.baseCurrencyCode}
              disabled={isSaving}
              onChange={(event) => updateDraft((current) => {
                const nextCurrency = event.target.value;
                return {
                  ...current,
                  baseCurrencyCode: nextCurrency,
                  monthlyIncomeCurrencyCode: current.monthlyIncomeCurrencyCode === current.baseCurrencyCode
                    ? nextCurrency
                    : current.monthlyIncomeCurrencyCode,
                };
              })}
            >
              {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </select>
          </label>
        </div>
      ) : null}

      {draft.step === 2 ? (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">{t('onboardingStepFocusTitle')}</h2>
          <p className="mt-1 text-sm text-[var(--sw-text-secondary)]">{t('onboardingStepFocusDescription')}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ONBOARDING_FOCUS_AREAS.map((area) => {
              const selected = selectedFocus.has(area);
              return (
                <button
                  key={area}
                  type="button"
                  className={`sw-card sw-card--interactive min-h-14 px-4 text-left font-medium ${selected ? 'ring-2 ring-[var(--sw-accent-indigo-strong)]' : ''}`}
                  aria-pressed={selected}
                  disabled={isSaving}
                  onClick={() => updateDraft((current) => ({
                    ...current,
                    focusAreas: selected
                      ? current.focusAreas.filter((value) => value !== area)
                      : [...current.focusAreas, area],
                  }))}
                >
                  {focusLabels[area]}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {draft.step === 3 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h2 className="text-xl font-semibold">{t('onboardingStepSetupTitle')}</h2>
            <p className="mt-1 text-sm text-[var(--sw-text-secondary)]">{t('onboardingStepSetupDescription')}</p>
          </div>
          <label className="sw-field">
            <span className="sw-label">{t('monthlyIncome')} <span className="sw-label__optional">{t('optional')}</span></span>
            <input
              className="sw-input"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={draft.monthlyIncomeInput}
              disabled={isSaving}
              aria-invalid={!isMoneyInput(draft.monthlyIncomeInput)}
              onChange={(event) => updateDraft((current) => ({ ...current, monthlyIncomeInput: event.target.value }))}
            />
            <span className="sw-help-text">{t('monthlyIncomeHint')}</span>
          </label>
          <label className="sw-field">
            <span className="sw-label">{t('currency')}</span>
            <select
              className="sw-select"
              value={draft.monthlyIncomeCurrencyCode}
              disabled={isSaving}
              onChange={(event) => updateDraft((current) => ({ ...current, monthlyIncomeCurrencyCode: event.target.value }))}
            >
              {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
            </select>
          </label>
          <label className="sw-field">
            <span className="sw-label">{t('walletName')} <span className="sw-label__optional">{t('optional')}</span></span>
            <input
              className="sw-input"
              autoComplete="off"
              maxLength={80}
              placeholder={t('walletNamePlaceholder')}
              value={draft.firstWallet.name}
              disabled={isSaving}
              onChange={(event) => updateDraft((current) => ({
                ...current,
                firstWallet: { ...current.firstWallet, name: event.target.value },
              }))}
            />
          </label>
          <label className="sw-field">
            <span className="sw-label">{t('walletOpeningBalance')} <span className="sw-label__optional">{t('optional')}</span></span>
            <input
              className="sw-input"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={draft.firstWallet.openingBalanceInput}
              disabled={isSaving}
              aria-invalid={!isMoneyInput(draft.firstWallet.openingBalanceInput)}
              onChange={(event) => updateDraft((current) => ({
                ...current,
                firstWallet: { ...current.firstWallet, openingBalanceInput: event.target.value },
              }))}
            />
          </label>
        </div>
      ) : null}

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          {draft.step > 1 ? (
            <button type="button" className="sw-button sw-button--ghost" disabled={isSaving} onClick={() => void saveAndGoTo((draft.step - 1) as 1 | 2 | 3)}>
              {t('back')}
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {draft.step === 3 ? <button type="button" className="sw-button sw-button--secondary" disabled={isSaving} onClick={() => void finish(true)}>{t('skipForNow')}</button> : null}
          {draft.step < 3 ? (
            <button type="button" className="sw-button sw-button--primary" disabled={isSaving} onClick={() => void saveAndGoTo((draft.step + 1) as 1 | 2 | 3)}>
              {isSaving ? t('onboardingSaving') : t('continue')}
            </button>
          ) : (
            <button type="button" className="sw-button sw-button--primary" disabled={isSaving} onClick={() => void finish()}>
              {isSaving ? t('onboardingSaving') : t('finish')}
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}
