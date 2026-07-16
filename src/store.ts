/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { Wallet, Transaction, User, ActiveTab } from './types';

// Extend Transaction to guarantee both 'title' and older properties exist
export interface MagaTransaction extends Transaction {
  title: string;
}

interface NotificationItem {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface MagaAIResponse {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AppState {
  // Authentication & Profile
  isAuthenticated: boolean;
  user: User | null;
  wallets: Wallet[];
  activeTab: ActiveTab;
  isAddSheetOpen: boolean;
  notifications: NotificationItem[];
  
  // Real-time calculated fields required by user prompt
  balance: number;
  dailyLimit: number;
  dailySpent: number;
  transactions: MagaTransaction[];

  // Dedicated Maga AI chat history
  aiChatHistory: MagaAIResponse[];
  isAiTyping: boolean;

  // Actions
  login: (email: string, name?: string) => void;
  register: (email: string, name: string) => void;
  logout: () => void;
  
  // Onboarding
  completeOnboarding: (walletName: string, initialBalance: number, dailyLimit: number) => void;
  
  // Wallets
  addWallet: (name: string, balance: number, type: Wallet['type']) => void;
  updateWalletBalance: (id: string, amount: number) => void;
  
  // Transactions
  addTransaction: (
    amount: number, 
    type: 'daromad' | 'xarajat', 
    category: string, 
    date: string, 
    walletId: string, 
    description?: string
  ) => void;
  deleteTransaction: (id: string) => void;
  
  // State management
  setActiveTab: (tab: ActiveTab) => void;
  setAddSheetOpen: (open: boolean) => void;
  
  // Settings & Toggles
  togglePasscode: () => void;
  toggleFaceId: () => void;
  upgradeToPremium: () => void;
  setDailyLimit: (limit: number) => void;
  
  // Notifications
  addNotification: (message: string) => void;
  markNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // AI Assistant Actions
  sendAiMessage: (message: string) => void;
  clearAiChat: () => void;
}

const DEFAULT_WALLETS: Wallet[] = [
  { id: 'wallet-1', name: 'Uzcard (Karta)', balance: 4200000, type: 'karta', color: '#3b82f6' },
  { id: 'wallet-2', name: 'Naqd pul', balance: 850000, type: 'naqd', color: '#10b981' },
  { id: 'wallet-3', name: 'Jamgʻarma', balance: 12000000, type: 'jamgirma', color: '#8b5cf6' }
];

const getTodayDateString = () => new Date().toISOString().split('T')[0];
const getYesterdayDateString = () => new Date(Date.now() - 86400000).toISOString().split('T')[0];

const DEFAULT_TRANSACTIONS: MagaTransaction[] = [
  { 
    id: 'tx-1', 
    amount: 145000, 
    type: 'xarajat', 
    category: '🍔 Oziq-ovqat', 
    title: 'Korzinka supermarket', 
    date: getTodayDateString(), 
    walletId: 'wallet-1', 
    description: 'Korzinka supermarket' 
  },
  { 
    id: 'tx-2', 
    amount: 25000, 
    type: 'xarajat', 
    category: '🚕 Transport', 
    title: 'Yandex Taxi', 
    date: getTodayDateString(), 
    walletId: 'wallet-2', 
    description: 'Yandex Taxi' 
  },
  { 
    id: 'tx-3', 
    amount: 3500000, 
    type: 'daromad', 
    category: '💼 Oylik', 
    title: 'Freelance loyiha toʻlovi', 
    date: getYesterdayDateString(), 
    walletId: 'wallet-1', 
    description: 'Freelance loyiha toʻlovi' 
  },
  { 
    id: 'tx-4', 
    amount: 120000, 
    type: 'xarajat', 
    category: '🍿 Koʻngilochar', 
    title: 'Kino & Popcorn', 
    date: getYesterdayDateString(), 
    walletId: 'wallet-1', 
    description: 'Kino & Popcorn' 
  },
  { 
    id: 'tx-5', 
    amount: 150000, 
    type: 'daromad', 
    category: '🎁 Sovgʻa', 
    title: 'Doʻstlardan sovgʻa', 
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0], 
    walletId: 'wallet-2', 
    description: 'Doʻstlardan' 
  }
];

const getStoredState = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const setStoredState = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
};

// Main state store implementation
export const useMagaStore = create<AppState>((set, get) => {
  // Initialize state from localStorage
  const initialAuth = getStoredState<boolean>('maga_auth', false);
  const initialUser = getStoredState<User | null>('maga_user', {
    email: 'user@maga.uz',
    name: 'Maga Foydalanuvchisi',
    passcodeEnabled: false,
    faceIdEnabled: false,
    premiumUser: false,
    dailyLimit: 500000, // default limit 500k UZS
    onboardingCompleted: true,
    joinedDate: 'Iyul, 2026'
  });
  const initialWallets = getStoredState<Wallet[]>('maga_wallets', DEFAULT_WALLETS);
  const initialTransactions = getStoredState<MagaTransaction[]>('maga_transactions', DEFAULT_TRANSACTIONS);
  const initialNotifications = getStoredState<NotificationItem[]>('maga_notifications', [
    { id: 'n-1', message: 'Maga Flow ilovasiga xush kelibsiz!', timestamp: 'Hozir', read: false }
  ]);
  const initialChatHistory = getStoredState<MagaAIResponse[]>('maga_ai_chat', [
    {
      id: 'ai-init',
      role: 'assistant',
      content: "Salom, men Maga AI. Moliyaviy holatingizni tahlil qildim. Sizga xarajatlarni optimallashtirish va kunlik limitni nazorat qilishda yordam beraman! Savolingiz bo'lsa, bering.",
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Reactive updates for storage and balance / spent
  const syncStateAndStorage = (
    updatedTransactions: MagaTransaction[], 
    updatedWallets: Wallet[], 
    updatedUser: User | null
  ) => {
    // 1. Calculate dynamic total balance as sum of all wallets
    const calculatedBalance = updatedWallets.reduce((sum, w) => sum + w.balance, 0);

    // 2. Calculate daily spent as sum of all expenses (xarajat) today
    const today = getTodayDateString();
    const calculatedDailySpent = updatedTransactions
      .filter(t => t.date === today && t.type === 'xarajat')
      .reduce((sum, t) => sum + t.amount, 0);

    // 3. Get dailyLimit
    const limit = updatedUser ? updatedUser.dailyLimit : 500000;

    // Apply state
    set({
      transactions: updatedTransactions,
      wallets: updatedWallets,
      user: updatedUser,
      balance: calculatedBalance,
      dailyLimit: limit,
      dailySpent: calculatedDailySpent
    });

    // Write to storage
    setStoredState('maga_wallets', updatedWallets);
    setStoredState('maga_transactions', updatedTransactions);
    if (updatedUser) setStoredState('maga_user', updatedUser);
  };

  // Immediate first calculation of reactive fields
  const firstBalance = initialWallets.reduce((sum, w) => sum + w.balance, 0);
  const todayStr = getTodayDateString();
  const firstDailySpent = initialTransactions
    .filter(t => t.date === todayStr && t.type === 'xarajat')
    .reduce((sum, t) => sum + t.amount, 0);
  const firstDailyLimit = initialUser ? initialUser.dailyLimit : 500000;

  return {
    // Base States
    isAuthenticated: initialAuth,
    user: initialUser,
    wallets: initialWallets,
    activeTab: 'home',
    isAddSheetOpen: false,
    notifications: initialNotifications,
    aiChatHistory: initialChatHistory,
    isAiTyping: false,

    // Reactive fields (Updated dynamically)
    balance: firstBalance,
    dailyLimit: firstDailyLimit,
    dailySpent: firstDailySpent,
    transactions: initialTransactions,

    login: (email, name = 'Foydalanuvchi') => {
      const newUser: User = {
        email,
        name: name || email.split('@')[0],
        passcodeEnabled: false,
        faceIdEnabled: false,
        premiumUser: false,
        dailyLimit: 500000,
        onboardingCompleted: true,
        joinedDate: new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' })
      };
      
      set({ isAuthenticated: true });
      setStoredState('maga_auth', true);
      syncStateAndStorage(get().transactions, get().wallets, newUser);
    },

    register: (email, name) => {
      const newUser: User = {
        email,
        name,
        passcodeEnabled: false,
        faceIdEnabled: false,
        premiumUser: false,
        dailyLimit: 0, // setup in onboarding
        onboardingCompleted: false,
        joinedDate: new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' })
      };

      set({ isAuthenticated: true });
      setStoredState('maga_auth', true);
      syncStateAndStorage(get().transactions, get().wallets, newUser);
    },

    logout: () => {
      set({ isAuthenticated: false, user: null, activeTab: 'home' });
      setStoredState('maga_auth', false);
      setStoredState('maga_user', null);
    },

    completeOnboarding: (walletName, initialBalance, dailyLimit) => {
      const currentUser = get().user;
      if (!currentUser) return;

      const updatedUser: User = {
        ...currentUser,
        dailyLimit,
        onboardingCompleted: true
      };

      const newFirstWallet: Wallet = {
        id: `wallet-${Date.now()}`,
        name: walletName,
        balance: initialBalance,
        type: 'karta',
        color: '#3b82f6'
      };

      const updatedWallets = [newFirstWallet, ...get().wallets.filter(w => w.id !== 'wallet-1')];

      syncStateAndStorage(get().transactions, updatedWallets, updatedUser);
      get().addNotification(`"${walletName}" hamyoni va kunlik limit muvaffaqiyatli sozlandi!`);
    },

    addWallet: (name, balance, type) => {
      const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'];
      const randomColor = colors[get().wallets.length % colors.length];
      const newWallet: Wallet = {
        id: `wallet-${Date.now()}`,
        name,
        balance,
        type,
        color: randomColor
      };
      
      const updated = [...get().wallets, newWallet];
      syncStateAndStorage(get().transactions, updated, get().user);
      get().addNotification(`Yangi "${name}" hamyoni yaratildi.`);
    },

    updateWalletBalance: (id, amount) => {
      const updated = get().wallets.map(w => {
        if (w.id === id) {
          return { ...w, balance: w.balance + amount };
        }
        return w;
      });
      syncStateAndStorage(get().transactions, updated, get().user);
    },

    addTransaction: (amount, type, category, date, walletId, description) => {
      const title = description || category.substring(2) || 'Xarajat';
      const newTx: MagaTransaction = {
        id: `tx-${Date.now()}`,
        amount,
        type,
        category,
        title,
        date,
        walletId,
        description
      };

      const updatedTxs = [newTx, ...get().transactions];
      
      // Update individual wallet balance locally first
      const updatedWallets = get().wallets.map(w => {
        if (w.id === walletId) {
          const balanceEffect = type === 'daromad' ? amount : -amount;
          return { ...w, balance: w.balance + balanceEffect };
        }
        return w;
      });

      // Synchronize in real-time
      syncStateAndStorage(updatedTxs, updatedWallets, get().user);

      // Show limit notifications or success messages
      if (type === 'xarajat') {
        const user = get().user;
        if (user && user.dailyLimit > 0) {
          const today = getTodayDateString();
          const todayExpenses = updatedTxs
            .filter(t => t.date === today && t.type === 'xarajat')
            .reduce((sum, t) => sum + t.amount, 0);

          if (todayExpenses > user.dailyLimit) {
            get().addNotification(`🚨 Diqqat! Kunlik xarajat limitingiz (${user.dailyLimit.toLocaleString('uz-UZ')} UZS) oshib ketdi!`);
          }
        }
      } else {
        get().addNotification(`Muvaffaqiyatli qo'shildi: +${amount.toLocaleString('uz-UZ')} UZS`);
      }
    },

    deleteTransaction: (id) => {
      const tx = get().transactions.find(t => t.id === id);
      if (!tx) return;

      const updatedTxs = get().transactions.filter(t => t.id !== id);
      
      // Reverse individual wallet balance locally first
      const updatedWallets = get().wallets.map(w => {
        if (w.id === tx.walletId) {
          const reverseEffect = tx.type === 'daromad' ? -tx.amount : tx.amount;
          return { ...w, balance: w.balance + reverseEffect };
        }
        return w;
      });

      syncStateAndStorage(updatedTxs, updatedWallets, get().user);
      get().addNotification(`Tranzaksiya o'chirildi.`);
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setAddSheetOpen: (open) => set({ isAddSheetOpen: open }),

    togglePasscode: () => {
      const user = get().user;
      if (!user) return;
      const updated = { ...user, passcodeEnabled: !user.passcodeEnabled };
      syncStateAndStorage(get().transactions, get().wallets, updated);
      get().addNotification(updated.passcodeEnabled ? "Passcode himoyasi yoqildi." : "Passcode himoyasi o'chirildi.");
    },

    toggleFaceId: () => {
      const user = get().user;
      if (!user) return;
      const updated = { ...user, faceIdEnabled: !user.faceIdEnabled };
      syncStateAndStorage(get().transactions, get().wallets, updated);
      get().addNotification(updated.faceIdEnabled ? "Face ID bilan kirish yoqildi." : "Face ID bilan kirish o'chirildi.");
    },

    upgradeToPremium: () => {
      const user = get().user;
      if (!user) return;
      const updated = { ...user, premiumUser: true };
      syncStateAndStorage(get().transactions, get().wallets, updated);
      get().addNotification("Tabriklaymiz! Siz PRO maqomiga ega bo'ldingiz! 💎");
    },

    setDailyLimit: (limit) => {
      const user = get().user;
      if (!user) return;
      const updated = { ...user, dailyLimit: limit };
      syncStateAndStorage(get().transactions, get().wallets, updated);
      get().addNotification(`Kunlik xarajat limiti ${limit.toLocaleString('uz-UZ')} UZS qilib belgilandi.`);
    },

    addNotification: (message) => {
      const newNotif: NotificationItem = {
        id: `n-${Date.now()}`,
        message,
        timestamp: 'Hozir',
        read: false
      };
      const updated = [newNotif, ...get().notifications];
      set({ notifications: updated });
      setStoredState('maga_notifications', updated);
    },

    markNotificationsAsRead: () => {
      const updated = get().notifications.map(n => ({ ...n, read: true }));
      set({ notifications: updated });
      setStoredState('maga_notifications', updated);
    },

    clearNotifications: () => {
      set({ notifications: [] });
      setStoredState('maga_notifications', []);
    },

    // Maga AI Assistant Action
    sendAiMessage: (message: string) => {
      const userMessage: MagaAIResponse = {
        id: `ai-msg-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
      };

      const currentChat = [...get().aiChatHistory, userMessage];
      set({ aiChatHistory: currentChat, isAiTyping: true });
      setStoredState('maga_ai_chat', currentChat);

      // Generate context-aware AI advice based on recent transactions & store state
      setTimeout(() => {
        const txs = get().transactions;
        const totalSpent = get().dailySpent;
        const limit = get().dailyLimit;
        const totalBalance = get().balance;

        let responseText = '';
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('limit') || lowerMsg.includes('tahlil') || lowerMsg.includes('spent')) {
          const percent = limit > 0 ? Math.round((totalSpent / limit) * 100) : 0;
          if (percent > 100) {
            responseText = `Siz bugun limitingizdan oshib ketdingiz! Belgilangan limit: ${limit.toLocaleString('uz-UZ')} UZS, sarflangan: ${totalSpent.toLocaleString('uz-UZ')} UZS (${percent}%). Oziq-ovqat va shaxsiy xarajatlaringizni kamaytirishni tavsiya qilaman.`;
          } else if (percent > 80) {
            responseText = `Bugungi limitgacha juda oz qoldi. Siz allaqachon ${totalSpent.toLocaleString('uz-UZ')} UZS sarfladingiz (${percent}%). Kun oxirigacha kutilmagan xarajatlardan tiyiling!`;
          } else {
            responseText = `Kunlik limitingiz barqaror holatda. Limit: ${limit.toLocaleString('uz-UZ')} UZS, sarflangan: ${totalSpent.toLocaleString('uz-UZ')} UZS (${percent}%). Bu sur'atda davom eting!`;
          }
        } else if (lowerMsg.includes('kamaytiray') || lowerMsg.includes('qanday') || lowerMsg.includes('tejamkorlik') || lowerMsg.includes('maslahat')) {
          // Analyze transaction categories
          const categories = txs.reduce((acc, t) => {
            if (t.type === 'xarajat') {
              acc[t.category] = (acc[t.category] || 0) + t.amount;
            }
            return acc;
          }, {} as Record<string, number>);

          const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]);
          if (sortedCats.length > 0) {
            const topCat = sortedCats[0][0];
            const topAmount = sortedCats[0][1];
            responseText = `Moliyaviy tahlilimga ko'ra, sizning eng ko'p xarajatingiz ${topCat} (${topAmount.toLocaleString('uz-UZ')} UZS) bo'lyapti. Ushbu turdagi xarajatlarni 15% ga qisqartirsangiz, oyiga o'rtacha ${(topAmount * 0.15).toLocaleString('uz-UZ')} UZS tejab qolishingiz mumkin!`;
          } else {
            responseText = "Xarajatlarni kamaytirish uchun, birinchi navbatda har bir chiqimni ilovaga kiritib boring. Haftalik oziq-ovqat va taksi xarajatlarini cheklash eng tez natija beradi.";
          }
        } else {
          // General financial review
          const expenses = txs.filter(t => t.type === 'xarajat').reduce((sum, t) => sum + t.amount, 0);
          const incomes = txs.filter(t => t.type === 'daromad').reduce((sum, t) => sum + t.amount, 0);

          responseText = `Maga Flow hisobotingiz: Umumiy balans ${totalBalance.toLocaleString('uz-UZ')} UZS. Tahlillar shuni ko'rsatadiki, sizda oylik daromad taxminan ${incomes.toLocaleString('uz-UZ')} UZS, umumiy kiritilgan xarajatlar esa ${expenses.toLocaleString('uz-UZ')} UZS. Sizga har oy daromadning kamida 10% ini Jamg'arma hamyoniga yo'naltirishni tavsiya qilaman.`;
        }

        const aiMessage: MagaAIResponse = {
          id: `ai-msg-${Date.now()}`,
          role: 'assistant',
          content: responseText,
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        };

        const finalChat = [...get().aiChatHistory, userMessage, aiMessage];
        set({ aiChatHistory: finalChat, isAiTyping: false });
        setStoredState('maga_ai_chat', finalChat);
      }, 1100);
    },

    clearAiChat: () => {
      const resetChat: MagaAIResponse[] = [
        {
          id: 'ai-init',
          role: 'assistant',
          content: "Salom, men Maga AI. Moliyaviy holatingizni tahlil qildim. Sizga xarajatlarni optimallashtirish va kunlik limitni nazorat qilishda yordam beraman!",
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        }
      ];
      set({ aiChatHistory: resetChat });
      setStoredState('maga_ai_chat', resetChat);
    }
  };
});

// Backward compatible export to not break existing file imports
export const useAppStore = useMagaStore;
