import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Bot,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileText,
  Goal,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  NotebookPen,
  Plus,
  ReceiptText,
  Settings2,
  Sparkles,
  Target,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { LocaleProvider, useLocale } from './i18n/locale-context';
import {
  AuthCallbackPage,
  AuthGate,
  AuthScreen,
  DEFAULT_AUTH_RETURN_TO,
  safeReturnTo,
  signOut,
} from './features/auth';
import {
  createDefaultOnboardingDraft,
  OnboardingFlow,
  ProfilePreferencesForm,
  PublicLanguageStart,
  createSupabaseOnboardingRepository,
} from './features/onboarding';
import { getProfile } from './lib/profile-service';
import {
  preferencesFromProfile,
  type ProfilePreferences,
} from './lib/profile-preferences';
import {
  getSupabaseBrowserClient,
  type SupabaseBrowserClient,
} from './lib/supabase-browser';

type Screen = 'home' | 'ai' | 'analytics' | 'menu' | 'profile';
type Theme = 'light' | 'dark';

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem('smartwallet.theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveThemePreference(preference: ProfilePreferences['themePreference']): Theme {
  if (preference === 'light' || preference === 'dark') return preference;
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function screenFromPath(pathname: string): Screen {
  if (pathname === '/app/home') return 'home';
  if (pathname === '/app/analytics') return 'analytics';
  if (pathname === '/app/menu') return 'menu';
  if (pathname === '/app/profile') return 'profile';
  return 'ai';
}

function pathForScreen(screen: Screen): string {
  if (screen === 'home') return '/app/home';
  if (screen === 'analytics') return '/app/analytics';
  if (screen === 'menu') return '/app/menu';
  if (screen === 'profile') return '/app/profile';
  return '/app/maga-ai';
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span aria-label="SmartWallet" className="inline-flex items-center gap-2 font-[var(--sw-font-display)] font-extrabold tracking-[-0.04em]">
      <span className="sw-brand-gradient grid h-9 w-9 place-items-center rounded-[13px] shadow-[0_8px_18px_rgb(67_56_202_/_26%)]">
        <WalletCards size={19} strokeWidth={2.25} />
      </span>
      {!compact && <span className="text-lg">SmartWallet</span>}
    </span>
  );
}

function IconButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" aria-label={label} className="sw-icon-button" onClick={onClick}>
      {children}
    </button>
  );
}

function UpgradeBanner() {
  const { t } = useLocale();
  return (
    <aside className="sw-card sw-card--accent sw-card--padded flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--sw-accent-indigo-soft)] text-[var(--sw-accent-indigo-strong)]">
          <Sparkles size={20} />
        </span>
        <div>
          <p className="font-semibold">{t('upgrade')}</p>
          <p className="mt-1 text-sm text-[var(--sw-text-secondary)]">{t('upgradeHint')}</p>
        </div>
      </div>
      <button type="button" className="sw-button sw-button--secondary sw-button--sm shrink-0">
        {t('upgrade')} <ChevronRight size={15} />
      </button>
    </aside>
  );
}

function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-xl">{title}</h2>
      {action}
    </div>
  );
}

function EmptyState({ icon, title, copy, action }: { icon: ReactNode; title: string; copy: string; action?: ReactNode }) {
  return (
    <div className="sw-empty-state">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--sw-accent-indigo-soft)] text-[var(--sw-accent-indigo-strong)]">{icon}</span>
      <div>
        <h3 className="text-base">{title}</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-[var(--sw-text-secondary)]">{copy}</p>
      </div>
      {action}
    </div>
  );
}

function HomeScreen({ onOpenTransaction }: { onOpenTransaction: () => void }) {
  const { t } = useLocale();
  return (
    <div className="sw-page sw-page--with-mobile-nav">
      <div className="sw-page-header">
        <div>
          <p className="sw-eyebrow">{t('greeting')}</p>
          <h1 className="sw-page-title mt-1">{t('overview')}</h1>
          <p className="sw-page-description">{t('overviewDescription')}</p>
        </div>
        <div className="sw-page-header__actions flex gap-2">
          <button type="button" className="sw-button sw-button--primary" onClick={onOpenTransaction}>
            <Plus size={18} /> {t('addTransaction')}
          </button>
        </div>
      </div>

      <div className="sw-dashboard-grid">
        <section className="sw-card sw-card--padded sw-span-7 sw-home-surface relative overflow-hidden">
          <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-[var(--sw-accent-cyan-soft)] blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="sw-metric__label">{t('totalBalance')}</p>
              <p className="sw-metric__value mt-2">0 <span className="text-base font-semibold tracking-normal">UZS</span></p>
              <p className="mt-2 text-sm text-[var(--sw-text-secondary)]">{t('comingSoon')}</p>
            </div>
          </div>
          <div className="relative mt-7 grid grid-cols-3 divide-x divide-[var(--sw-divider)]">
            <div className="pr-3"><p className="sw-soft text-xs">{t('income')}</p><p className="sw-money mt-1 text-base font-bold sw-income">0</p></div>
            <div className="px-3"><p className="sw-soft text-xs">{t('expense')}</p><p className="sw-money mt-1 text-base font-bold sw-expense">0</p></div>
            <div className="pl-3"><p className="sw-soft text-xs">{t('net')}</p><p className="sw-money mt-1 text-base font-bold">0</p></div>
          </div>
        </section>

        <section className="sw-span-12">
          <SectionTitle title={t('wallets')} />
          <EmptyState
            icon={<Landmark size={24} />}
            title={t('noWallets')}
            copy={t('noWalletsDescription')}
            action={<button type="button" className="sw-button sw-button--primary" onClick={onOpenTransaction}>{t('createWallet')}</button>}
          />
        </section>

        <section className="sw-span-7">
          <SectionTitle title={t('recent')} action={<button type="button" className="sw-button sw-button--ghost sw-button--sm">{t('reports')} <ChevronRight size={14} /></button>} />
          <EmptyState icon={<ReceiptText size={24} />} title={t('emptyTransactions')} copy={t('addFirstTransaction')} action={<button type="button" className="sw-button sw-button--secondary" onClick={onOpenTransaction}><Plus size={17} /> {t('addTransaction')}</button>} />
        </section>

        <section className="sw-card sw-card--padded sw-span-5">
          <p className="sw-eyebrow">{t('thisMonth')}</p>
          <h2 className="mt-2 text-xl">{t('analyticsTitle')}</h2>
          <p className="mt-2 text-sm text-[var(--sw-text-secondary)]">{t('analyticsDescription')}</p>
          <div className="mt-6 flex h-20 items-end gap-2" aria-label="Empty chart placeholder">
            {[22, 45, 31, 56, 40, 68, 52].map((height, index) => <span key={index} className="flex-1 rounded-t bg-[var(--sw-accent-indigo-soft)]" style={{ height: `${height}%` }} />)}
          </div>
        </section>

      </div>
    </div>
  );
}

function AiScreen() {
  const { t } = useLocale();
  const questions = [t('spendingQuestion'), t('budgetQuestion'), t('debtQuestion'), t('upcomingQuestion')];
  return (
    <div className="sw-page sw-page--with-mobile-nav">
      <div className="sw-page-header">
        <div>
          <p className="sw-eyebrow">Maga Brain</p>
          <h1 className="sw-page-title mt-1">{t('ai')}</h1>
          <p className="sw-page-description">{t('aiDescription')}</p>
        </div>
      </div>
      <section className="sw-card sw-card--padded sw-ai-surface">
        <div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--sw-bg-inverse)] text-[var(--sw-accent-cyan)]"><Bot size={25} /></span><div><p className="font-semibold">{t('aiWelcome')}</p><p className="mt-1 text-sm text-[var(--sw-text-secondary)]">{t('foundation')}</p></div></div>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {questions.map((question) => <button key={question} type="button" className="sw-button sw-button--secondary justify-start text-left">{question}<ChevronRight className="ml-auto" size={16} /></button>)}
        </div>
      </section>
      <section className="mt-5 sw-card sw-card--padded">
        <label className="sw-label" htmlFor="maga-question">{t('askAi')}</label>
        <div className="mt-2 flex gap-2"><input id="maga-question" className="sw-input" placeholder={t('askAi')} /><button type="button" className="sw-button sw-button--primary" aria-label={t('ai')}><ArrowUpRight size={18} /></button></div>
        <p className="mt-3 text-xs text-[var(--sw-text-tertiary)]">{t('comingSoon')}</p>
      </section>
    </div>
  );
}

function AnalyticsScreen() {
  const { t } = useLocale();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  return (
    <div className="sw-page sw-page--with-mobile-nav">
      <div className="sw-page-header"><div><p className="sw-eyebrow">{t('thisMonth')}</p><h1 className="sw-page-title mt-1">{t('analyticsTitle')}</h1><p className="sw-page-description">{t('analyticsDescription')}</p></div></div>
      <section className="mb-5"><UpgradeBanner /></section>
      <div className="sw-segmented" role="tablist" aria-label={t('analytics')}>
        {(['week', 'month', 'year'] as const).map((key) => <button type="button" key={key} role="tab" aria-selected={period === key} className="sw-segmented__item" onClick={() => setPeriod(key)}>{t(key)}</button>)}
      </div>
      <section className="mt-5"><EmptyState icon={<ChartNoAxesCombined size={24} />} title={t('noAnalytics')} copy={t('analyticsDescription')} /></section>
      <section className="mt-5 sw-card sw-card--padded"><SectionTitle title={t('spendingByCategory')} /><div className="flex items-center gap-5"><span className="grid h-28 w-28 shrink-0 place-items-center rounded-full border-[14px] border-[var(--sw-accent-indigo-soft)] text-sm font-bold">0%</span><p className="text-sm text-[var(--sw-text-secondary)]">{t('addFirstTransaction')}</p></div></section>
    </div>
  );
}

const menuItems = [
  ['wallets', WalletCards], ['debts', ArrowDownLeft], ['goals', Target], ['limits', Goal], ['subscriptions', CreditCard], ['reports', FileText], ['reminders', NotebookPen],
] as const;

function MenuScreen({ onProfile }: { onProfile: () => void }) {
  const { t } = useLocale();
  return (
    <div className="sw-page sw-page--with-mobile-nav">
      <div className="sw-page-header"><div><p className="sw-eyebrow">SmartWallet</p><h1 className="sw-page-title mt-1">{t('menu')}</h1><p className="sw-page-description">{t('menuDescription')}</p></div><button type="button" className="sw-icon-button" onClick={onProfile} aria-label={t('profile')}><UserRound size={19} /></button></div>
      <section className="mb-5"><UpgradeBanner /></section>
      <section className="sw-card sw-card--padded mb-5 flex flex-wrap items-center justify-between gap-4"><div><p className="sw-metric__label">{t('totalBalance')}</p><p className="sw-metric__value mt-1">0 UZS</p></div></section>
      <div className="grid gap-2">
        {menuItems.map(([key, Icon]) => <button type="button" key={key} className="sw-card sw-card--interactive flex min-h-16 items-center gap-4 px-4 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--sw-bg-subtle)] text-[var(--sw-accent-indigo-strong)]"><Icon size={20} /></span><span className="min-w-0 flex-1 font-semibold">{t(key)}</span><ChevronRight className="text-[var(--sw-text-tertiary)]" size={19} /></button>)}
      </div>
    </div>
  );
}

function ProfileScreen({
  client,
  userId,
  email,
  setTheme,
  onSignOut,
}: {
  client: SupabaseBrowserClient;
  userId: string;
  email: string | undefined;
  setTheme: (theme: Theme) => void;
  onSignOut: () => Promise<void>;
}) {
  const { t } = useLocale();
  const profileItems = [['personalInfo', UserRound], ['planAndAi', Sparkles], ['currency', Landmark], ['notifications', Bell], ['privacy', LockKeyhole], ['help', CircleHelp], ['about', Settings2]] as const;
  return (
    <div className="sw-page sw-page--with-mobile-nav">
      <div className="sw-page-header"><div><p className="sw-eyebrow">SmartWallet</p><h1 className="sw-page-title mt-1">{t('profile')}</h1></div></div>
      <section className="sw-card sw-card--padded mb-5 flex flex-wrap items-center gap-4"><span className="sw-brand-gradient grid h-16 w-16 place-items-center rounded-2xl text-xl font-bold">SW</span><div className="min-w-0 flex-1"><p className="break-all text-lg font-semibold">{email ?? '—'}</p><p className="mt-1 text-sm text-[var(--sw-text-secondary)]">{t('accountSettings')}</p></div></section>
      <section className="mb-5"><UpgradeBanner /></section>
      <ProfilePreferencesForm client={client} userId={userId} className="mb-5" onSaved={(preferences) => setTheme(resolveThemePreference(preferences.themePreference))} />
      <div className="grid gap-2">{profileItems.map(([key, Icon]) => <div key={key} className="sw-card flex min-h-16 items-center gap-4 px-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--sw-bg-subtle)] text-[var(--sw-accent-indigo-strong)]"><Icon size={20} /></span><span className="min-w-0 flex-1 font-semibold">{t(key)}</span><ChevronRight className="text-[var(--sw-text-tertiary)]" size={19} /></div>)}</div>
      <button type="button" className="sw-button sw-button--secondary mt-5" onClick={() => void onSignOut()}>{t('logout')}</button>
    </div>
  );
}

function TransactionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocale();
  const [kind, setKind] = useState<'income' | 'expense' | 'transfer'>('expense');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[var(--sw-z-modal)] grid place-items-end bg-[var(--sw-bg-overlay)] p-0 backdrop-blur-sm sm:place-items-center sm:p-6" role="presentation">
      <section className="w-full max-w-xl rounded-t-[var(--sw-radius-panel)] border border-[var(--sw-border-subtle)] bg-[var(--sw-bg-surface)] p-5 shadow-[var(--sw-shadow-floating)] sm:rounded-[var(--sw-radius-panel)]" role="dialog" aria-modal="true" aria-labelledby="new-transaction-title">
        <div className="flex items-center justify-between gap-4"><div><p className="sw-eyebrow">SmartWallet</p><h2 id="new-transaction-title" className="mt-1">{t('addTransaction')}</h2></div><IconButton label={t('close')} onClick={onClose}><X size={20} /></IconButton></div>
        <div className="sw-segmented mt-6 w-full" role="tablist"><button type="button" className="sw-segmented__item" aria-selected={kind === 'income'} onClick={() => setKind('income')}><ArrowDownLeft className="mr-1 inline" size={14} />{t('income')}</button><button type="button" className="sw-segmented__item" aria-selected={kind === 'expense'} onClick={() => setKind('expense')}><ArrowUpRight className="mr-1 inline" size={14} />{t('expense')}</button><button type="button" className="sw-segmented__item" aria-selected={kind === 'transfer'} onClick={() => setKind('transfer')}><ArrowDownLeft className="mr-1 inline" size={14} />Transfer</button></div>
        <div className="mt-5 grid gap-4"><label className="sw-field"><span className="sw-label">{t('amount')}</span><input className="sw-input" inputMode="decimal" placeholder="0" /></label><label className="sw-field"><span className="sw-label">{t('selectWallet')}</span><select className="sw-select" defaultValue=""><option value="" disabled>{t('selectWallet')}</option></select></label><label className="sw-field"><span className="sw-label">{t('note')}</span><input className="sw-input" placeholder={t('note')} /></label></div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" className="sw-button sw-button--secondary" onClick={onClose}>{t('close')}</button><button type="button" className="sw-button sw-button--primary" disabled>{t('save')}</button></div>
        <p className="mt-3 text-xs text-[var(--sw-text-tertiary)]">{t('comingSoon')}</p>
      </section>
    </div>
  );
}

function SmartWalletApp({
  client,
  userId,
  email,
}: {
  client: SupabaseBrowserClient;
  userId: string;
  email: string | undefined;
}) {
  const { t } = useLocale();
  const [screen, setScreen] = useState<Screen>(() => screenFromPath(window.location.pathname));
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const nav = useMemo(() => [
    { id: 'home' as const, label: t('home'), Icon: LayoutDashboard },
    { id: 'ai' as const, label: t('ai'), Icon: Bot },
    { id: 'analytics' as const, label: t('analytics'), Icon: ChartNoAxesCombined },
    { id: 'menu' as const, label: t('menu'), Icon: Menu },
  ], [t]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('smartwallet.theme', theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    void getProfile(client, userId).then((profile) => {
      if (!active || !profile) return;
      setTheme(resolveThemePreference(preferencesFromProfile(profile).themePreference));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [client, userId]);

  const navigateScreen = useCallback((next: Screen) => {
    setScreen(next);
    const nextPath = pathForScreen(next);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => setScreen(screenFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const page = screen === 'home' ? <HomeScreen onOpenTransaction={() => setTransactionOpen(true)} />
    : screen === 'ai' ? <AiScreen />
    : screen === 'analytics' ? <AnalyticsScreen />
    : screen === 'profile' ? <ProfileScreen client={client} userId={userId} email={email} setTheme={setTheme} onSignOut={() => signOut(client)} />
    : <MenuScreen onProfile={() => navigateScreen('profile')} />;

  return (
    <div className="sw-shell">
      <a className="sw-skip-link" href="#main-content">Asosiy tarkibga o‘tish</a>
      <header className="sw-topbar">
        <div className="sw-container--wide flex items-center justify-between gap-4">
          <button type="button" className="rounded-[var(--sw-radius-control)] text-left" onClick={() => navigateScreen('home')}><BrandMark /></button>
          <div className="flex items-center gap-2"><IconButton label={t('notifications')}><Bell size={18} /></IconButton><button type="button" aria-label={t('profile')} onClick={() => navigateScreen('profile')} className="sw-brand-gradient grid h-10 w-10 place-items-center rounded-[var(--sw-radius-control)] text-sm font-bold">SW</button></div>
        </div>
      </header>
      <div className="sw-app-grid">
        <aside className="sw-sidebar" aria-label="Asosiy navigatsiya"><BrandMark compact /><nav><ul className="sw-nav-list">{nav.map(({ id, label, Icon }) => <li key={id}><button type="button" className="sw-nav-item w-full" data-active={screen === id} aria-current={screen === id ? 'page' : undefined} onClick={() => navigateScreen(id)}><Icon size={19} />{label}</button></li>)}</ul></nav></aside>
        <main id="main-content" className="min-w-0"><div className="sw-container">{page}</div></main>
      </div>
      <nav className="sw-mobile-nav" aria-label="Asosiy navigatsiya">{nav.slice(0, 2).map(({ id, label, Icon }) => <button type="button" key={id} className="sw-mobile-nav__item" aria-current={screen === id ? 'page' : undefined} onClick={() => navigateScreen(id)}><Icon size={19} /><span>{label}</span></button>)}<button type="button" className="sw-mobile-nav__item text-[var(--sw-action-primary-text)]" onClick={() => setTransactionOpen(true)} aria-label={t('addTransaction')}><span className="grid h-10 w-10 place-items-center rounded-[var(--sw-radius-control)] bg-[var(--sw-action-primary)] shadow-[0_6px_16px_rgb(67_56_202_/_28%)]"><Plus size={22} /></span></button>{nav.slice(2).map(({ id, label, Icon }) => <button type="button" key={id} className="sw-mobile-nav__item" aria-current={screen === id ? 'page' : undefined} onClick={() => navigateScreen(id)}><Icon size={19} /><span>{label}</span></button>)}</nav>
      <TransactionDialog open={transactionOpen} onClose={() => setTransactionOpen(false)} />
    </div>
  );
}

function AuthenticatedWorkspace({
  client,
  userId,
  email,
}: {
  client: SupabaseBrowserClient;
  userId: string;
  email: string | undefined;
}) {
  const { locale, setLocale, t } = useLocale();
  const repository = useMemo(
    () => createSupabaseOnboardingRepository(client, userId, { initialLocale: locale }),
    [client, locale, userId],
  );
  const [status, setStatus] = useState<'loading' | 'not_started' | 'in_progress' | 'completed' | 'error'>('loading');

  const refreshOnboarding = useCallback(async () => {
    setStatus('loading');
    try {
      const loaded = await repository.load();
      setLocale(loaded.draft.locale);
      if (loaded.status === 'not_started') {
        const completion = await repository.complete(createDefaultOnboardingDraft({
          ...loaded.draft,
          locale,
          step: 3,
        }));
        setLocale(completion.preferences.locale);
        setStatus('completed');
        return;
      }
      setStatus(loaded.status);
    } catch {
      setStatus('error');
    }
  }, [repository, setLocale]);

  useEffect(() => {
    void refreshOnboarding();
  }, [refreshOnboarding]);

  if (status === 'loading') {
    return <section className="sw-card sw-card--padded mx-auto mt-8 w-full max-w-md" aria-busy="true"><p>{t('authLoading')}</p></section>;
  }

  if (status === 'error') {
    return (
      <section className="sw-card sw-card--padded mx-auto mt-8 w-full max-w-md" role="alert">
        <h1 className="sw-page-title">{t('connectionUnavailable')}</h1>
        <button type="button" className="sw-button sw-button--secondary mt-5" onClick={() => void refreshOnboarding()}>{t('tryAgain')}</button>
      </section>
    );
  }

  if (status !== 'completed') {
    return (
      <div className="sw-container py-8">
        <OnboardingFlow
          repository={repository}
          onComplete={(completion) => {
            setLocale(completion.preferences.locale);
            setStatus('completed');
            window.history.replaceState({}, '', '/app/home');
          }}
        />
      </div>
    );
  }

  return <SmartWalletApp client={client} userId={userId} email={email} />;
}

function SmartWalletRouter() {
  const [hasCompletedPublicLanguageStep, setHasCompletedPublicLanguageStep] = useState(() => (
    window.localStorage.getItem('smartwallet.public-language-complete') === 'true'
  ));
  const [path, setPath] = useState(() => window.location.pathname);
  const client = useMemo(() => {
    try {
      return getSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const navigate = useCallback((next: string, replace = false) => {
    const destination = next.startsWith('/app') ? safeReturnTo(next) : next;
    if (replace) window.history.replaceState({}, '', destination);
    else window.history.pushState({}, '', destination);
    setPath(destination);
  }, []);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (path === '/auth/callback') {
    if (!client) {
      return <AuthGate client={client}>{null}</AuthGate>;
    }
    return <div className="sw-container py-8"><AuthCallbackPage client={client} onResolved={(result) => {
      if (result.kind === 'password_recovery') navigate('/auth/recover', true);
      if (result.kind === 'signed_in') navigate(result.returnTo, true);
    }} /></div>;
  }

  if (path === '/auth/recover' && client) {
    return <div className="sw-container py-8"><AuthScreen client={client} initialMode="new-password" onPasswordUpdated={() => navigate(DEFAULT_AUTH_RETURN_TO, true)} /></div>;
  }

  if (!hasCompletedPublicLanguageStep) {
    return (
      <div className="sw-container py-8">
        <PublicLanguageStart onContinue={() => {
          window.localStorage.setItem('smartwallet.public-language-complete', 'true');
          setHasCompletedPublicLanguageStep(true);
        }} />
      </div>
    );
  }

  const returnTo = path.startsWith('/app') ? safeReturnTo(path) : DEFAULT_AUTH_RETURN_TO;
  return (
    <AuthGate client={client} returnTo={returnTo} onAuthenticated={() => navigate(returnTo, true)}>
      {(auth) => <AuthenticatedWorkspace client={client!} userId={auth.user!.id} email={auth.user!.email} />}
    </AuthGate>
  );
}

export default function App() {
  return <LocaleProvider><SmartWalletRouter /></LocaleProvider>;
}
