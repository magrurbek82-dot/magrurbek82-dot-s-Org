/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { useMagaStore } from '../store';
import Odometer from '../components/Odometer';
import { CreditCard, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Trash2, ShieldAlert, Sparkles } from 'lucide-react';

export default function DashboardView() {
  const user = useMagaStore(state => state.user);
  const wallets = useMagaStore(state => state.wallets);
  const transactions = useMagaStore(state => state.transactions);
  const deleteTransaction = useMagaStore(state => state.deleteTransaction);
  const balance = useMagaStore(state => state.balance);
  const dailyLimit = useMagaStore(state => state.dailyLimit);
  const dailySpent = useMagaStore(state => state.dailySpent);

  // Today's date
  const today = new Date().toISOString().split('T')[0];

  // Daily tracker details
  const isLimitExceeded = dailySpent > dailyLimit;
  const limitPercentage = dailyLimit > 0 ? Math.min((dailySpent / dailyLimit) * 100, 100) : 0;

  // Recent transactions list
  const recentTransactions = transactions.slice(0, 10); // show up to 10 for better scroll-explore

  // Total income & expense overall
  const totalIncome = transactions
    .filter(t => t.type === 'daromad')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'xarajat')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6 pb-28 pt-2 z-10 relative">
      
      {/* Premium Apple-Style Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold mb-0.5">XUSHLI BIYOB</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans">
            Salom, <span className="text-blue-600">{user?.name || 'Foydalanuvchi'}</span>!
          </h2>
        </div>
        {user?.premiumUser ? (
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold tracking-widest font-mono border border-amber-200/50 flex items-center gap-1">
            💎 PRO
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold tracking-wide font-mono flex items-center gap-1">
            STANDART
          </span>
        )}
      </div>

      {/* Swiss Minimalist Premium Balance Card */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden">
        {/* Subtle decorative mesh gradient (light theme optimized) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-50/40 rounded-full blur-3xl pointer-events-none" />
        
        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block text-center mb-1 font-bold">
          UMUMIY BALANS
        </span>
        
        <Odometer value={balance} className="text-3xl sm:text-4xl text-slate-900 font-bold" />

        {/* Mini stats row (Kirim / Chiqim) */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
          <div className="text-left">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Kirim</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600">
                +{totalIncome.toLocaleString('uz-UZ')} UZS
              </span>
            </div>
          </div>
          <div className="text-left border-l border-slate-100 pl-4">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Chiqim</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <span className="text-xs font-mono font-bold text-rose-600">
                -{totalExpense.toLocaleString('uz-UZ')} UZS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Daily Limit Tracker (Interactive Progress Bar) */}
      <div
        className={`bg-white rounded-[20px] p-5 border shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300 relative overflow-hidden ${
          isLimitExceeded
            ? 'border-rose-200 bg-rose-50/50 shadow-[0_8px_30px_rgba(244,63,94,0.05)]'
            : 'border-slate-100'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isLimitExceeded ? (
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-blue-500" />
            )}
            <span className="text-xs font-bold text-slate-900">Kunlik Limit Tracker</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-500">
            {dailySpent.toLocaleString('uz-UZ')} / {dailyLimit.toLocaleString('uz-UZ')} UZS
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${limitPercentage}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            className={`h-full rounded-full ${
              isLimitExceeded
                ? 'bg-rose-500'
                : 'bg-blue-600'
            }`}
          />
        </div>

        {isLimitExceeded ? (
          <p className="text-[10px] font-mono text-rose-600 mt-2 text-center font-bold tracking-tight">
            🚨 DIQQAT: Kunlik xarajat chegarangiz buzildi! Iltimos, tejamkor boʻling.
          </p>
        ) : (
          <p className="text-[10px] font-mono text-slate-500 mt-2 text-center">
            Bugungi limitdan yana <span className="text-blue-600 font-bold">{(dailyLimit - dailySpent).toLocaleString('uz-UZ')} UZS</span> sarflashingiz mumkin.
          </p>
        )}
      </div>

      {/* Wallets Horizontal Cards List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">Hamyonlariz</h3>
          <span className="text-[10px] font-mono text-slate-400 font-bold">{wallets.length} ta hisob</span>
        </div>

        {/* Scrollable Container */}
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x">
          {wallets.map((wallet) => (
            <motion.div
              key={wallet.id}
              whileHover={{ y: -3 }}
              className="flex-shrink-0 w-44 snap-center bg-white border border-slate-100 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-28 shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
            >
              {/* Soft corner glowing accent based on wallet color */}
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-[0.05] blur-xl pointer-events-none"
                style={{ backgroundColor: wallet.color }}
              />

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 tracking-tight">{wallet.name}</span>
                <CreditCard className="w-4 h-4" style={{ color: wallet.color }} />
              </div>

              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">BALANS</span>
                <span className="text-sm font-mono font-bold text-slate-900">
                  {wallet.balance.toLocaleString('uz-UZ')}
                  <span className="text-[9px] text-slate-400 ml-1">UZS</span>
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Transactions List with Click-to-delete */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">Oxirgi amallar</h3>
          <span className="text-[10px] font-mono text-slate-400 font-bold">Hammasi</span>
        </div>

        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-10 rounded-2xl bg-white border border-slate-100 text-slate-400 text-xs font-mono">
                Hech qanday tranzaksiya mavjud emas.
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const txWallet = wallets.find(w => w.id === tx.walletId);
                return (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -50 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="p-3.5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-slate-200 transition-all shadow-[0_4px_20px_rgb(0,0,0,0.01)] relative overflow-hidden group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Category Icon Badge */}
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg select-none">
                        {tx.category ? tx.category.slice(0, 2) : '💰'}
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {tx.title || (tx.category ? tx.category.slice(2).trim() : 'Tranzaksiya')}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-tight">
                            {txWallet?.name || 'Hamyon'}
                          </span>
                          {tx.description && (
                            <>
                              <span className="text-[9px] text-slate-200">•</span>
                              <span className="text-[9px] text-slate-500 font-sans italic max-w-[120px] truncate">
                                {tx.description}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`text-xs font-mono font-bold ${
                          tx.type === 'daromad' ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {tx.type === 'daromad' ? '+' : '-'} {tx.amount.toLocaleString('uz-UZ')} UZS
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                          {tx.date === today ? 'Bugun' : tx.date}
                        </span>
                      </div>

                      {/* Interactive Delete Action */}
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
