export const LOCALES = ['uz', 'ru', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export type Translation = {
  home: string;
  ai: string;
  analytics: string;
  menu: string;
  profile: string;
  transaction: string;
  greeting: string;
  overview: string;
  overviewDescription: string;
  totalBalance: string;
  income: string;
  expense: string;
  net: string;
  thisMonth: string;
  wallets: string;
  noWallets: string;
  noWalletsDescription: string;
  createWallet: string;
  recent: string;
  emptyTransactions: string;
  addFirstTransaction: string;
  addTransaction: string;
  aiWelcome: string;
  aiDescription: string;
  askAi: string;
  quickQuestions: string;
  spendingQuestion: string;
  budgetQuestion: string;
  debtQuestion: string;
  upcomingQuestion: string;
  analyticsTitle: string;
  analyticsDescription: string;
  week: string;
  month: string;
  year: string;
  spendingByCategory: string;
  noAnalytics: string;
  protectedAccount: string;
  menuDescription: string;
  debts: string;
  goals: string;
  limits: string;
  subscriptions: string;
  reports: string;
  reminders: string;
  personalInfo: string;
  planAndAi: string;
  currency: string;
  notifications: string;
  privacy: string;
  help: string;
  about: string;
  freePlan: string;
  upgrade: string;
  upgradeHint: string;
  language: string;
  theme: string;
  system: string;
  light: string;
  dark: string;
  close: string;
  save: string;
  amount: string;
  type: string;
  note: string;
  selectWallet: string;
  comingSoon: string;
  foundation: string;
  login: string;
  register: string;
  logout: string;
  email: string;
  password: string;
  passwordConfirm: string;
  forgotPassword: string;
  resetPassword: string;
  resetPasswordDescription: string;
  sendResetLink: string;
  newPassword: string;
  updatePassword: string;
  createAccount: string;
  createAccountDescription: string;
  signInDescription: string;
  signInAction: string;
  continueWithGoogle: string;
  orContinueWithEmail: string;
  googleUnavailable: string;
  emailNotConfirmed: string;
  emailRateLimited: string;
  registerAction: string;
  noAccount: string;
  haveAccount: string;
  checkEmail: string;
  verificationSent: string;
  passwordUpdated: string;
  passwordRecovery: string;
  returnToSignIn: string;
  authLoading: string;
  authErrorGeneric: string;
  invalidCredentials: string;
  sessionExpired: string;
  authCallbackError: string;
  passwordMismatch: string;
  passwordTooShort: string;
  tryAgain: string;
  onboarding: string;
  onboardingWelcome: string;
  onboardingStart: string;
  onboardingStepLanguageTitle: string;
  onboardingStepLanguageDescription: string;
  baseCurrency: string;
  onboardingStepFocusTitle: string;
  onboardingStepFocusDescription: string;
  focusBudget: string;
  focusSaving: string;
  focusDebt: string;
  focusSpending: string;
  focusOverview: string;
  onboardingStepSetupTitle: string;
  onboardingStepSetupDescription: string;
  monthlyIncome: string;
  monthlyIncomeHint: string;
  firstWallet: string;
  walletName: string;
  walletNamePlaceholder: string;
  walletOpeningBalance: string;
  optional: string;
  skipForNow: string;
  continue: string;
  back: string;
  finish: string;
  onboardingSaved: string;
  onboardingResume: string;
  onboardingComplete: string;
  onboardingSaving: string;
  onboardingError: string;
  invalidAmount: string;
  walletNameRequired: string;
  preferences: string;
  accountSettings: string;
  displayName: string;
  timeZone: string;
  updatePreferences: string;
  profileSaved: string;
  unsupportedConfiguration: string;
  connectionUnavailable: string;
  uz: string;
  ru: string;
  en: string;
};

export const messages: Record<Locale, Translation> = {
  uz: {
    home: 'Bosh sahifa', ai: 'Maga AI', analytics: 'Tahlil', menu: 'Menyu', profile: 'Profil', transaction: 'Tranzaksiya',
    greeting: 'Xayrli kun', overview: 'Moliyaviy holatingiz', overviewDescription: 'Hamyonlaringiz, xarajatlaringiz va rejalaringiz bir joyda.',
    totalBalance: 'Umumiy balans', income: 'Kirim', expense: 'Chiqim', net: 'Sof qoldiq', thisMonth: 'Shu oy',
    wallets: 'Hamyonlar', noWallets: 'Birinchi hamyoningizni yarating', noWalletsDescription: "Bank ulanmagan V1 da mablag'larni qo'lda, xavfsiz va aniq boshqarasiz.", createWallet: 'Hamyon yaratish',
    recent: "So'nggi tranzaksiyalar", emptyTransactions: "Hali tranzaksiya yo'q", addFirstTransaction: 'Birinchi kirim yoki chiqimni kiriting.', addTransaction: "Tranzaksiya qo'shish",
    aiWelcome: 'Moliyangizni tushunadigan yordamchi', aiDescription: "Maga AI hisoblaringizni tushuntiradi. Har qanday o'zgarish faqat tasdiqingizdan keyin bajariladi.", askAi: "Maga AI dan so'rang...", quickQuestions: 'Tezkor savollar',
    spendingQuestion: "Bu oy nimaga ko'p sarfladim?", budgetQuestion: 'Menga budjet tuzib ber', debtQuestion: "Qarzlarimni ko'rsat", upcomingQuestion: "Keyingi to'lovlarim qaysi?",
    analyticsTitle: "Pul oqimini tushuning", analyticsDescription: "Real tranzaksiyalar paydo bo'lgach grafiklar shu yerda shakllanadi.", week: 'Hafta', month: 'Oy', year: 'Yil', spendingByCategory: 'Xarajatlar kategoriyasi', noAnalytics: "Tahlil uchun ma'lumot yetarli emas",
    protectedAccount: 'Himoyalangan hisob', menuDescription: 'Moliyaviy vositalar va sozlamalar', debts: 'Qarzlar', goals: 'Maqsadlar', limits: 'Limitlar', subscriptions: 'Obunalar', reports: 'Hisobotlar', reminders: 'Eslatmalar va qaydlar',
    personalInfo: "Shaxsiy ma'lumotlar", planAndAi: 'Tarif va AI imkoniyatlari', currency: 'Asosiy valyuta', notifications: 'Bildirishnomalar', privacy: "Ma'lumot va xavfsizlik", help: 'Yordam', about: 'SmartWallet haqida',
    freePlan: 'Free tarif', upgrade: 'Yangilash', upgradeHint: "Ko'proq tahlil va Maga AI imkoniyatlari uchun tarifni yangilang.", language: 'Til', theme: "Ko'rinish", system: 'Tizim sozlamasi', light: 'Kunduzgi', dark: 'Tungi', close: 'Yopish', save: 'Saqlash',
    amount: 'Summa', type: 'Turi', note: 'Izoh', selectWallet: 'Hamyonni tanlang', comingSoon: "Keyingi bosqichda ulanadi", foundation: 'Yangi SmartWallet web asosi',
    login: 'Kirish', register: "Ro'yxatdan o'tish", logout: 'Chiqish', email: 'Email', password: 'Parol', passwordConfirm: 'Parolni tasdiqlang', forgotPassword: 'Parolni unutdingizmi?',
    resetPassword: 'Parolni tiklash', resetPasswordDescription: 'Email manzilingizni kiriting. Tiklash havolasini yuboramiz.', sendResetLink: 'Tiklash havolasini yuborish', newPassword: 'Yangi parol', updatePassword: 'Parolni yangilash',
    createAccount: 'Hisob yarating', createAccountDescription: "SmartWallet ni xavfsiz boshlash uchun email va parolni kiriting.", signInDescription: "Moliyaviy ma'lumotlaringizga xavfsiz kiring.", signInAction: 'Kirish', continueWithGoogle: 'Google orqali davom etish', orContinueWithEmail: 'yoki email orqali', googleUnavailable: "Google orqali kirish hali sozlanmagan. Keyinroq qayta urinib ko'ring.", emailNotConfirmed: 'Email hali tasdiqlanmagan. Emaildagi havolani bosing, so‘ng qayta kiring.', emailRateLimited: 'Email yuborish limiti vaqtincha to‘ldi. Bir necha daqiqa kutib, qayta urinib ko‘ring.', registerAction: 'Hisob yaratish', noAccount: "Hisobingiz yo'qmi?", haveAccount: 'Hisobingiz bormi?',
    checkEmail: 'Emailingizni tekshiring', verificationSent: 'Tasdiqlash havolasi yuborildi.', passwordUpdated: 'Parolingiz yangilandi.', passwordRecovery: 'Parolni tiklash', returnToSignIn: 'Kirishga qaytish', authLoading: 'Tekshirilmoqda...', authErrorGeneric: "Xatolik yuz berdi. Qayta urinib ko'ring.", invalidCredentials: "Email yoki parol noto'g'ri.", sessionExpired: 'Sessiyangiz tugadi. Qayta kiring.', authCallbackError: "Tasdiqlash havolasini yakunlab bo'lmadi. Yangi havola so'rang.", passwordMismatch: 'Parollar bir xil emas.', passwordTooShort: "Parol kamida 8 ta belgidan iborat bo'lishi kerak.", tryAgain: 'Qayta urinish',
    onboarding: "Boshlang'ich sozlash", onboardingWelcome: "SmartWallet ga xush kelibsiz", onboardingStart: "Bir necha qisqa qadamda shaxsiy moliyaviy joyingizni sozlaymiz.", onboardingStepLanguageTitle: 'Til va asosiy valyutani tanlang', onboardingStepLanguageDescription: "Hisobotlar va summalar shu tanlovlar asosida ko'rsatiladi.", baseCurrency: 'Hisobot valyutasi',
    onboardingStepFocusTitle: "Nimaga ko'proq yordam kerak?", onboardingStepFocusDescription: "Bu tanlov Maga AI tavsiyalarini moslashtiradi; keyin o'zgartirishingiz mumkin.", focusBudget: 'Budjet tuzish', focusSaving: "Jamg'arish", focusDebt: 'Qarzlarni boshqarish', focusSpending: 'Xarajatlarni tushunish', focusOverview: "Umumiy moliyaviy ko'rinish",
    onboardingStepSetupTitle: "Boshlang'ich ma'lumotlar", onboardingStepSetupDescription: "Bu ma'lumotlar ixtiyoriy. Oylik daromad hamyon balansiga qo'shilmaydi.", monthlyIncome: 'Oylik daromad', monthlyIncomeHint: 'Faqat Maga AI rejalashtirishi uchun ishlatiladi.', firstWallet: 'Birinchi hamyon', walletName: 'Hamyon nomi', walletNamePlaceholder: 'Masalan, Naqd pul', walletOpeningBalance: "Boshlang'ich balans", optional: 'Ixtiyoriy', skipForNow: "Hozircha o'tkazib yuborish", continue: 'Davom etish', back: 'Orqaga', finish: 'Yakunlash', onboardingSaved: 'Qoralama saqlandi.', onboardingResume: 'Sozlashni davom ettirish', onboardingComplete: "Boshlang'ich sozlash yakunlandi.", onboardingSaving: 'Saqlanmoqda...', onboardingError: "Sozlamani saqlab bo'lmadi. Qayta urinib ko'ring.", invalidAmount: "Summani to'g'ri formatda kiriting.", walletNameRequired: "Boshlang'ich balans uchun hamyon nomini kiriting.",
    preferences: 'Sozlamalar', accountSettings: 'Hisob sozlamalari', displayName: "Ko'rinadigan ism", timeZone: 'Vaqt mintaqasi', updatePreferences: 'Sozlamalarni yangilash', profileSaved: 'Profil sozlamalari saqlandi.', unsupportedConfiguration: "Ilova sozlamasi to'liq emas. Keyinroq qayta urinib ko'ring.", connectionUnavailable: "Ulanish mavjud emas. Moliyaviy o'zgarishlar yuborilmadi.", uz: "O'zbekcha", ru: 'Ruscha', en: 'Inglizcha',
  },
  ru: {
    home: 'Главная', ai: 'Maga AI', analytics: 'Аналитика', menu: 'Меню', profile: 'Профиль', transaction: 'Транзакция',
    greeting: 'Добрый день', overview: 'Ваши финансы', overviewDescription: 'Кошельки, расходы и планы в одном месте.', totalBalance: 'Общий баланс', income: 'Доход', expense: 'Расход', net: 'Чистый остаток', thisMonth: 'В этом месяце',
    wallets: 'Кошельки', noWallets: 'Создайте первый кошелёк', noWalletsDescription: 'В V1 без банковской интеграции вы управляете средствами вручную, безопасно и понятно.', createWallet: 'Создать кошелёк', recent: 'Последние транзакции', emptyTransactions: 'Транзакций пока нет', addFirstTransaction: 'Добавьте первый доход или расход.', addTransaction: 'Добавить транзакцию',
    aiWelcome: 'Помощник, который понимает ваши финансы', aiDescription: 'Maga AI объясняет ваши данные. Любое изменение происходит только после подтверждения.', askAi: 'Спросите Maga AI...', quickQuestions: 'Быстрые вопросы', spendingQuestion: 'На что я потратил больше всего?', budgetQuestion: 'Составь мне бюджет', debtQuestion: 'Покажи мои долги', upcomingQuestion: 'Какие платежи впереди?',
    analyticsTitle: 'Понимайте денежный поток', analyticsDescription: 'Графики появятся здесь на основе реальных транзакций.', week: 'Неделя', month: 'Месяц', year: 'Год', spendingByCategory: 'Расходы по категориям', noAnalytics: 'Недостаточно данных для аналитики',
    protectedAccount: 'Защищённый аккаунт', menuDescription: 'Финансовые инструменты и настройки', debts: 'Долги', goals: 'Цели', limits: 'Лимиты', subscriptions: 'Подписки', reports: 'Отчёты', reminders: 'Напоминания и заметки', personalInfo: 'Личные данные', planAndAi: 'Тариф и доступ к AI', currency: 'Основная валюта', notifications: 'Уведомления', privacy: 'Данные и безопасность', help: 'Помощь', about: 'О SmartWallet',
    freePlan: 'Тариф Free', upgrade: 'Улучшить', upgradeHint: 'Обновите тариф для расширенной аналитики и дополнительных возможностей Maga AI.', language: 'Язык', theme: 'Тема', system: 'Как в системе', light: 'Светлая', dark: 'Тёмная', close: 'Закрыть', save: 'Сохранить', amount: 'Сумма', type: 'Тип', note: 'Комментарий', selectWallet: 'Выберите кошелёк', comingSoon: 'Появится на следующем этапе', foundation: 'Новая web-основа SmartWallet',
    login: 'Войти', register: 'Регистрация', logout: 'Выйти', email: 'Email', password: 'Пароль', passwordConfirm: 'Подтвердите пароль', forgotPassword: 'Забыли пароль?', resetPassword: 'Восстановление пароля', resetPasswordDescription: 'Введите email. Мы отправим ссылку для восстановления.', sendResetLink: 'Отправить ссылку', newPassword: 'Новый пароль', updatePassword: 'Обновить пароль', createAccount: 'Создайте аккаунт', createAccountDescription: 'Введите email и пароль, чтобы безопасно начать работу со SmartWallet.', signInDescription: 'Безопасный доступ к вашим финансовым данным.', signInAction: 'Войти', continueWithGoogle: 'Продолжить через Google', orContinueWithEmail: 'или через email', googleUnavailable: 'Вход через Google пока не настроен. Попробуйте позже.', emailNotConfirmed: 'Email ещё не подтверждён. Откройте ссылку из письма и войдите снова.', emailRateLimited: 'Лимит отправки email временно исчерпан. Подождите несколько минут и повторите попытку.', registerAction: 'Создать аккаунт', noAccount: 'Нет аккаунта?', haveAccount: 'Уже есть аккаунт?', checkEmail: 'Проверьте email', verificationSent: 'Ссылка для подтверждения отправлена.', passwordUpdated: 'Пароль обновлён.', passwordRecovery: 'Восстановление пароля', returnToSignIn: 'Вернуться ко входу', authLoading: 'Проверяем...', authErrorGeneric: 'Произошла ошибка. Попробуйте ещё раз.', invalidCredentials: 'Неверный email или пароль.', sessionExpired: 'Сессия завершилась. Войдите снова.', authCallbackError: 'Не удалось завершить подтверждение. Запросите новую ссылку.', passwordMismatch: 'Пароли не совпадают.', passwordTooShort: 'Пароль должен содержать не менее 8 символов.', tryAgain: 'Попробовать снова',
    onboarding: 'Первоначальная настройка', onboardingWelcome: 'Добро пожаловать в SmartWallet', onboardingStart: 'Настроим ваше личное финансовое пространство за несколько коротких шагов.', onboardingStepLanguageTitle: 'Выберите язык и основную валюту', onboardingStepLanguageDescription: 'От этого выбора зависят язык интерфейса и отчётов.', baseCurrency: 'Валюта отчётов', onboardingStepFocusTitle: 'В чём нужна помощь?', onboardingStepFocusDescription: 'Этот выбор настроит рекомендации Maga AI. Его можно изменить позже.', focusBudget: 'Планирование бюджета', focusSaving: 'Накопления', focusDebt: 'Управление долгами', focusSpending: 'Понимание расходов', focusOverview: 'Общий обзор финансов', onboardingStepSetupTitle: 'Начальные данные', onboardingStepSetupDescription: 'Эти данные необязательны. Месячный доход не добавляется к балансу кошелька.', monthlyIncome: 'Месячный доход', monthlyIncomeHint: 'Используется только для планирования Maga AI.', firstWallet: 'Первый кошелёк', walletName: 'Название кошелька', walletNamePlaceholder: 'Например, Наличные', walletOpeningBalance: 'Начальный баланс', optional: 'Необязательно', skipForNow: 'Пропустить сейчас', continue: 'Продолжить', back: 'Назад', finish: 'Завершить', onboardingSaved: 'Черновик сохранён.', onboardingResume: 'Продолжить настройку', onboardingComplete: 'Первоначальная настройка завершена.', onboardingSaving: 'Сохраняем...', onboardingError: 'Не удалось сохранить настройку. Попробуйте ещё раз.', invalidAmount: 'Введите сумму в правильном формате.', walletNameRequired: 'Укажите название кошелька для начального баланса.',
    preferences: 'Настройки', accountSettings: 'Настройки аккаунта', displayName: 'Отображаемое имя', timeZone: 'Часовой пояс', updatePreferences: 'Обновить настройки', profileSaved: 'Настройки профиля сохранены.', unsupportedConfiguration: 'Настройка приложения не завершена. Попробуйте позже.', connectionUnavailable: 'Нет соединения. Финансовые изменения не были отправлены.', uz: 'Узбекский', ru: 'Русский', en: 'Английский',
  },
  en: {
    home: 'Home', ai: 'Maga AI', analytics: 'Analytics', menu: 'Menu', profile: 'Profile', transaction: 'Transaction',
    greeting: 'Good afternoon', overview: 'Your financial picture', overviewDescription: 'Wallets, spending and plans in one clear place.', totalBalance: 'Total balance', income: 'Income', expense: 'Expense', net: 'Net balance', thisMonth: 'This month',
    wallets: 'Wallets', noWallets: 'Create your first wallet', noWalletsDescription: 'In bank-free V1, you manage funds manually, safely and clearly.', createWallet: 'Create wallet', recent: 'Recent transactions', emptyTransactions: 'No transactions yet', addFirstTransaction: 'Add your first income or expense.', addTransaction: 'Add transaction',
    aiWelcome: 'An assistant that understands your money', aiDescription: 'Maga AI explains your data. Any change happens only after your confirmation.', askAi: 'Ask Maga AI...', quickQuestions: 'Quick questions', spendingQuestion: 'Where did I spend the most?', budgetQuestion: 'Build a budget for me', debtQuestion: 'Show my debts', upcomingQuestion: 'What payments are coming up?',
    analyticsTitle: 'Understand your cash flow', analyticsDescription: 'Charts will appear here from real transactions.', week: 'Week', month: 'Month', year: 'Year', spendingByCategory: 'Spending by category', noAnalytics: 'Not enough data for analytics',
    protectedAccount: 'Protected account', menuDescription: 'Financial tools and settings', debts: 'Debts', goals: 'Goals', limits: 'Limits', subscriptions: 'Subscriptions', reports: 'Reports', reminders: 'Reminders and notes', personalInfo: 'Personal information', planAndAi: 'Plan and AI access', currency: 'Base currency', notifications: 'Notifications', privacy: 'Data and security', help: 'Help', about: 'About SmartWallet',
    freePlan: 'Free plan', upgrade: 'Upgrade', upgradeHint: 'Upgrade for richer analytics and more Maga AI access.', language: 'Language', theme: 'Theme', system: 'System setting', light: 'Light', dark: 'Dark', close: 'Close', save: 'Save', amount: 'Amount', type: 'Type', note: 'Note', selectWallet: 'Select a wallet', comingSoon: 'Connects in the next phase', foundation: 'New SmartWallet web foundation',
    login: 'Sign in', register: 'Register', logout: 'Sign out', email: 'Email', password: 'Password', passwordConfirm: 'Confirm password', forgotPassword: 'Forgot password?', resetPassword: 'Reset password', resetPasswordDescription: 'Enter your email and we will send a reset link.', sendResetLink: 'Send reset link', newPassword: 'New password', updatePassword: 'Update password', createAccount: 'Create your account', createAccountDescription: 'Enter an email and password to start securely with SmartWallet.', signInDescription: 'Secure access to your financial data.', signInAction: 'Sign in', continueWithGoogle: 'Continue with Google', orContinueWithEmail: 'or continue with email', googleUnavailable: 'Google sign-in is not configured yet. Please try again later.', emailNotConfirmed: 'Your email is not confirmed yet. Open the link in your email, then sign in again.', emailRateLimited: 'Email sending is temporarily rate-limited. Wait a few minutes and try again.', registerAction: 'Create account', noAccount: 'No account yet?', haveAccount: 'Already have an account?', checkEmail: 'Check your email', verificationSent: 'A verification link has been sent.', passwordUpdated: 'Your password was updated.', passwordRecovery: 'Password recovery', returnToSignIn: 'Back to sign in', authLoading: 'Checking...', authErrorGeneric: 'Something went wrong. Please try again.', invalidCredentials: 'The email or password is incorrect.', sessionExpired: 'Your session expired. Please sign in again.', authCallbackError: 'We could not finish the confirmation. Request a new link.', passwordMismatch: 'Passwords do not match.', passwordTooShort: 'Password must contain at least 8 characters.', tryAgain: 'Try again',
    onboarding: 'Initial setup', onboardingWelcome: 'Welcome to SmartWallet', onboardingStart: 'Set up your personal financial space in a few short steps.', onboardingStepLanguageTitle: 'Choose your language and base currency', onboardingStepLanguageDescription: 'Reports and amounts will use these choices.', baseCurrency: 'Reporting currency', onboardingStepFocusTitle: 'What would you like help with?', onboardingStepFocusDescription: 'This tailors Maga AI suggestions and can be changed later.', focusBudget: 'Budget planning', focusSaving: 'Saving money', focusDebt: 'Managing debt', focusSpending: 'Understanding spending', focusOverview: 'A complete financial overview', onboardingStepSetupTitle: 'Starting details', onboardingStepSetupDescription: 'These details are optional. Monthly income is not added to a wallet balance.', monthlyIncome: 'Monthly income', monthlyIncomeHint: 'Used only for Maga AI planning.', firstWallet: 'First wallet', walletName: 'Wallet name', walletNamePlaceholder: 'For example, Cash', walletOpeningBalance: 'Opening balance', optional: 'Optional', skipForNow: 'Skip for now', continue: 'Continue', back: 'Back', finish: 'Finish', onboardingSaved: 'Draft saved.', onboardingResume: 'Continue setup', onboardingComplete: 'Initial setup complete.', onboardingSaving: 'Saving...', onboardingError: 'We could not save setup. Please try again.', invalidAmount: 'Enter the amount in a valid format.', walletNameRequired: 'Enter a wallet name for an opening balance.',
    preferences: 'Preferences', accountSettings: 'Account settings', displayName: 'Display name', timeZone: 'Time zone', updatePreferences: 'Update preferences', profileSaved: 'Profile preferences saved.', unsupportedConfiguration: 'The application is not configured yet. Please try again later.', connectionUnavailable: 'No connection is available. Financial changes were not sent.', uz: 'Uzbek', ru: 'Russian', en: 'English',
  },
};

export type MessageKey = keyof Translation;
