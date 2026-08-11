import { LOCALES, type Locale } from '../../i18n/translations';
import { useLocale } from '../../i18n/locale-context';

type PublicLanguageStartProps = {
  onContinue: () => void;
  className?: string;
};

/**
 * The only unauthenticated onboarding step. It intentionally happens before
 * sign-in so people can understand the entry screen in their own language.
 * The selected locale is later used to create the first profile record.
 */
export function PublicLanguageStart({ onContinue, className = '' }: PublicLanguageStartProps) {
  const { locale, setLocale, t } = useLocale();

  function chooseLocale(nextLocale: Locale): void {
    setLocale(nextLocale);
  }

  return (
    <section className={`sw-card sw-card--padded mx-auto w-full max-w-md ${className}`} aria-labelledby="language-start-title">
      <p className="sw-eyebrow">SmartVault</p>
      <h1 id="language-start-title" className="sw-page-title mt-1">{t('onboardingStepLanguageTitle')}</h1>
      <p className="mt-2 text-sm text-[var(--sw-text-secondary)]">{t('onboardingStepLanguageDescription')}</p>

      <div className="mt-6 grid gap-3" role="radiogroup" aria-label={t('language')}>
        {LOCALES.map((option) => {
          const selected = option === locale;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`sw-card sw-card--interactive min-h-14 px-4 text-left font-semibold ${selected ? 'ring-2 ring-[var(--sw-accent-indigo-strong)]' : ''}`}
              onClick={() => chooseLocale(option)}
            >
              {t(option)}
            </button>
          );
        })}
      </div>

      <button type="button" className="sw-button sw-button--primary mt-6 w-full" onClick={onContinue}>
        {t('continue')}
      </button>
    </section>
  );
}
